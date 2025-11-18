import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Pegar o token da URL
    const token = searchParams.get("token_hash") || searchParams.get("token");
    const type = searchParams.get("type");

    if (type === "signup" && token) {
      // Redirecionar para criar senha com o token
      navigate(`/criar-senha?token=${token}`, { replace: true });
    } else {
      // Se não for signup, redirecionar para login
      navigate("/auth", { replace: true });
    }
  }, [navigate, searchParams]);

  return (
    <main className="min-h-screen grid place-items-center">
      <section className="text-center space-y-2">
        <h1 className="text-2xl font-serif">Redirecionando…</h1>
        <p className="text-muted-foreground">Aguarde um instante.</p>
      </section>
    </main>
  );
};

export default AuthCallback;
