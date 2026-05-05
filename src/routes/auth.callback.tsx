import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // O Supabase envia os tokens no hash da URL (#access_token=...&type=signup)
    // O onAuthStateChange do AuthProvider já processa isso automaticamente.
    // Aqui apenas aguardamos a sessão ser estabelecida e redirecionamos.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        sub.subscription.unsubscribe();
        navigate({ to: "/app/home" });
      } else if (event === "PASSWORD_RECOVERY") {
        sub.subscription.unsubscribe();
        navigate({ to: "/auth" });
      }
    });

    // Fallback: se já tiver sessão ativa, redireciona direto
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        sub.subscription.unsubscribe();
        navigate({ to: "/app/home" });
      }
    });

    // Timeout de segurança: se nada acontecer em 5s, vai pra home
    const timeout = setTimeout(() => {
      sub.subscription.unsubscribe();
      navigate({ to: "/" });
    }, 5000);

    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--gradient-soft)]">
      <div className="text-center">
        <Heart className="mx-auto h-10 w-10 fill-primary text-primary animate-heartbeat" />
        <p className="mt-4 text-sm text-muted-foreground">Confirmando sua conta...</p>
      </div>
    </div>
  );
}
