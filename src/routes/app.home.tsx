import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Heart, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useCouple } from "@/lib/use-couple";

export const Route = createFileRoute("/app/home")({
  head: () => ({
    meta: [{ title: "Início — Nosso Diário" }],
  }),
  component: HomePage,
});

function HomePage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { couple, me, loading: coupleLoading } = useCouple();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: "/auth" });
    }
  }, [authLoading, user, navigate]);

  if (authLoading || coupleLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--gradient-soft)]">
        <Heart className="h-8 w-8 fill-primary text-primary animate-heartbeat" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[var(--gradient-soft)]">
      <header className="container mx-auto flex max-w-3xl items-center justify-between px-4 py-5">
        <div className="flex items-center gap-2">
          <Heart className="h-6 w-6 fill-primary text-primary" />
          <span className="font-semibold">Nosso Diário</span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => signOut()}>
          <LogOut className="mr-2 h-4 w-4" /> Sair
        </Button>
      </header>

      <main className="container mx-auto max-w-3xl px-4 py-8">
        <div className="rounded-2xl border bg-card p-8 text-center shadow-[var(--shadow-card)] animate-float-up">
          <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-blush">
            <Heart className="h-7 w-7 fill-primary text-primary" />
          </div>
          <h1 className="text-2xl font-bold">
            Olá, {me?.name || "amor"} 💕
          </h1>
          {!couple ? (
            <>
              <p className="mt-2 text-muted-foreground">
                Para começar, crie o casal de vocês ou entre com um código de convite.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link to="/onboarding/create">
                  <Button size="lg" className="w-full sm:w-auto">Criar nosso casal</Button>
                </Link>
                <Link to="/onboarding/join">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    Tenho um convite
                  </Button>
                </Link>
              </div>
              <p className="mt-6 text-xs text-muted-foreground">
                Em breve: contador de namoro, restaurantes, lista de desejos, calendário e diário do dia.
              </p>
            </>
          ) : (
            <>
              <p className="mt-2 text-muted-foreground">
                Casal criado em {new Date(couple.anniversary_date).toLocaleDateString("pt-BR")}.
                As próximas seções (restaurantes, desejos, calendário, diário do dia, casais conectados) chegam nas próximas atualizações.
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
