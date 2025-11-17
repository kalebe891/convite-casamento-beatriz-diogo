import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AuthCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    const run = async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        const type = url.searchParams.get("type");

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
          if (error) throw error;
          setStatus("success");
          navigate("/admin", { replace: true });
          return;
        }

        // Fallback: for links that include access_token in the hash
        setTimeout(async () => {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            setStatus("success");
            navigate("/admin", { replace: true });
          } else {
            setStatus("error");
          }
        }, 0);
      } catch (err: any) {
        console.error("Auth callback error:", err);
        setStatus("error");
      }
    };
    run();
  }, [navigate]);

  useEffect(() => {
    if (status === "error") {
      toast({
        title: "Não foi possível autenticar",
        description: "O link pode ter expirado ou já foi utilizado. Solicite um novo convite.",
        variant: "destructive",
      });
    }
  }, [status, toast]);

  return (
    <main className="min-h-screen grid place-items-center">
      <section className="text-center space-y-2">
        <h1 className="text-2xl font-serif">Confirmando acesso…</h1>
        <p className="text-muted-foreground">Aguarde um instante enquanto validamos o convite.</p>
      </section>
    </main>
  );
};

export default AuthCallback;
