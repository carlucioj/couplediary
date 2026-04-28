import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Heart, Calendar, Utensils, Gift, Users, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nosso Diário — Memórias do Casal" },
      { name: "description", content: "Plataforma romântica para casais registrarem restaurantes, desejos, datas e cada dia inesquecível, com privacidade total." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate({ to: "/app/home" });
    }
  }, [loading, user, navigate]);

  return (
    <div className="min-h-screen bg-[var(--gradient-soft)]">
      <header className="container mx-auto flex max-w-5xl items-center justify-between px-4 py-5">
        <div className="flex items-center gap-2">
          <Heart className="h-6 w-6 fill-primary text-primary animate-heartbeat" />
          <span className="text-lg font-semibold tracking-tight">Nosso Diário</span>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/auth">
            <Button variant="ghost" size="sm">Entrar</Button>
          </Link>
          <Link to="/auth" search={{ mode: "signup" }}>
            <Button size="sm">Começar</Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto max-w-5xl px-4 pb-20">
        <section className="py-12 text-center sm:py-20">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full bg-blush px-4 py-1.5 text-xs font-medium text-primary">
            <Heart className="h-3.5 w-3.5 fill-primary" />
            Para vocês dois, e mais ninguém
          </div>
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-6xl">
            Tudo que vocês vivem juntos,{" "}
            <span className="bg-[var(--gradient-romance)] bg-clip-text text-transparent">
              num só lugar
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-balance text-base text-muted-foreground sm:text-lg">
            Registre restaurantes, sonhos, datas marcantes e o diário de cada dia.
            Avise sua pessoa amada com um toque pelo WhatsApp.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/auth" search={{ mode: "signup" }}>
              <Button size="lg" className="w-full sm:w-auto">
                Criar nosso diário
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Já tenho conta
              </Button>
            </Link>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={<Heart className="h-5 w-5" />}
            title="Contador de namoro"
            text="Anos, meses, dias e até segundos do seu amor."
          />
          <FeatureCard
            icon={<Utensils className="h-5 w-5" />}
            title="Restaurantes"
            text="Lugares visitados e a lista de 'queremos ir'."
          />
          <FeatureCard
            icon={<Gift className="h-5 w-5" />}
            title="Lista de desejos"
            text="Cole o link da loja, a gente busca o resto."
          />
          <FeatureCard
            icon={<Calendar className="h-5 w-5" />}
            title="Diário do dia"
            text="O que vocês fizeram em cada data, no calendário."
          />
          <FeatureCard
            icon={<Users className="h-5 w-5" />}
            title="Casais conectados"
            text="Encontre amigos casais e compartilhe o que quiser."
          />
          <FeatureCard
            icon={<ShieldCheck className="h-5 w-5" />}
            title="100% privado"
            text="Só vocês dois acessam. Ninguém mais consegue ver nada."
          />
        </section>
      </main>

      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        Feito com <Heart className="inline h-3 w-3 fill-primary text-primary" /> para vocês.
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)] transition-transform hover:-translate-y-0.5">
      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blush text-primary">
        {icon}
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
