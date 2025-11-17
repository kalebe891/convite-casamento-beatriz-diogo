import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InviteRequest {
  email: string;
  role: 'admin' | 'couple' | 'planner';
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify the requesting user is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // Check if user has admin role
    const { data: hasAdminRole } = await supabase
      .rpc('has_role', { _user_id: user.id, _role: 'admin' });
    
    if (!hasAdminRole) {
      throw new Error("User is not an admin");
    }

    const { email, role }: InviteRequest = await req.json();
    console.log(`Inviting user: ${email} with role: ${role}`);

    const origin = req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/') || '';
    const redirectTo = `${origin}/auth/callback`;
    console.log(`Redirect URL: ${redirectTo}`);

    let targetUserId: string | null = null;
    let sentViaBackend = false;

    // 1) Não usar mais inviteUserByEmail para evitar wrapping de links – apenas preparar user/role se já existir
    try {
      const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers();
      if (listErr) {
        console.error('Falha ao listar usuários (não bloqueante):', listErr);
      } else {
        const existingUser = users.find(u => u.email === email);
        if (existingUser?.id) {
          targetUserId = existingUser.id;
          await supabase.from('profiles').upsert(
            { id: targetUserId, email, full_name: email.split('@')[0] },
            { onConflict: 'id' }
          );
          await supabase.from('user_roles').upsert(
            { user_id: targetUserId, role },
            { onConflict: 'user_id,role' }
          );
        }
      }
    } catch (err) {
      console.error('Erro ao preparar usuário existente:', err);
    }

    // 2) Fallback: gerar magic link e tentar enviar via Resend
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo },
    });

    if (linkError) {
      console.error('Erro ao gerar magic link:', linkError);
      throw linkError;
    }

    console.log('Magic link gerado para:', targetUserId || 'novo usuário');

    // Tentar enviar via Resend
    let emailSent = false;
    try {
      const mailResp = await resend.emails.send({
        from: 'Convite Casamento <onboarding@resend.dev>',
        to: [email],
        subject: 'Convite para Painel Administrativo - Beatriz & Diogo',
        text: `Acesse o painel: ${linkData.properties.action_link}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4F46E5;">Você foi convidado!</h2>
            <p>Seu papel: <strong>${role === 'admin' ? 'Administrador' : role === 'couple' ? 'Casal' : 'Cerimonialista'}</strong></p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${linkData.properties.action_link}" 
                 style="background-color: #4F46E5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                Acessar Painel
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">Ou copie:</p>
            <p style="word-break: break-all; color: #4F46E5; font-size: 12px;">${linkData.properties.action_link}</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px;">Link expira em 1 hora.</p>
          </div>
        `,
      });
      if (!(mailResp as any)?.error) {
        emailSent = true;
        console.log('Email enviado via Resend');
      } else {
        console.error('Erro Resend:', (mailResp as any).error);
      }
    } catch (emailErr) {
      console.error('Erro ao enviar email (não bloqueante):', emailErr);
    }

    console.log('Convite finalizado para:', targetUserId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        user_id: targetUserId, 
        email, 
        magic_link: linkData.properties.action_link, 
        email_sent: emailSent, 
        method: 'magiclink_fallback' 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in invite-admin function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
