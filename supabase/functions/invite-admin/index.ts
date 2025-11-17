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

    // Get the origin for redirect
    const origin = req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/') || '';
    console.log(`Redirect origin: ${origin}`);

    let userId: string;
    let isNewUser = false;

    // First, check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers.users.find(u => u.email === email);

    if (existingUser) {
      console.log(`User already exists: ${existingUser.id}`);
      userId = existingUser.id;
      isNewUser = false;
    } else {
      // Create new user without sending email
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          full_name: email.split('@')[0],
        },
      });

      if (createError) {
        console.error('Error creating user:', createError);
        throw createError;
      }

      userId = newUser.user.id;
      isNewUser = true;
      console.log(`New user created: ${userId}`);
    }

    // Update or create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email: email,
        full_name: email.split('@')[0],
      });

    if (profileError) {
      console.error('Profile error:', profileError);
    }

    // Update or create role
    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert({
        user_id: userId,
        role: role,
      });

    if (roleError) {
      console.error('Role error:', roleError);
      throw roleError;
    }

    // Generate magic link pointing to /admin
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      options: {
        redirectTo: `${origin}/admin`,
      },
    });

    if (linkError) {
      console.error('Error generating magic link:', linkError);
      throw linkError;
    }

    console.log(`Magic link generated for: ${userId}`);

    // Send email via Resend
    let emailSent = false;
    try {
      const { data: emailData, error: emailError } = await resend.emails.send({
        from: 'Convite Casamento <onboarding@resend.dev>',
        to: [email],
        subject: 'Convite para Painel Administrativo - Beatriz & Diogo',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4F46E5;">Você foi convidado!</h2>
            <p>Você foi convidado para acessar o painel administrativo do casamento de Beatriz & Diogo.</p>
            <p>Seu papel: <strong>${role === 'admin' ? 'Administrador' : role === 'couple' ? 'Casal' : 'Cerimonialista'}</strong></p>
            <p>Clique no botão abaixo para acessar:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${linkData.properties.action_link}" 
                 style="background-color: #4F46E5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                Acessar Painel Administrativo
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">Ou copie e cole este link no navegador:</p>
            <p style="word-break: break-all; color: #4F46E5; font-size: 12px;">${linkData.properties.action_link}</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px;">Este link expira em 1 hora por motivos de segurança.</p>
          </div>
        `,
      });

      if (!emailError) {
        emailSent = true;
        console.log('Email sent successfully:', emailData);
      } else {
        console.error('Error sending email:', emailError);
      }
    } catch (emailErr) {
      console.error('Resend error (non-blocking):', emailErr);
    }

    console.log(`Invite process completed successfully for: ${userId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        userId,
        email,
        isNewUser,
        magic_link: linkData.properties.action_link,
        email_sent: emailSent
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
