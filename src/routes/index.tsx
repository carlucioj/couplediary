import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Heart, Calendar, Utensils, Gift, BookHeart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { ThemeToggle } from "@/lib/theme";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nosso Diário — Memórias do Casal" },
      { name: "description", content: "Diário privado para casais: restaurantes, desejos, datas e o que viveram em cada dia." },
    ],
  }),
  component: Landing,
});

function diffFrom(dateStr: string) {
  const start = new Date(dateStr);
  if (isNaN(start.getTime())) return null;
  const now = new Date();
  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  let days = now.getDate() - start.getDate();
  if (days < 0) {
    months -= 1;
    const prev = new Date(now.getFullYear(), now.getMonth(), 0);
    days += prev.getDate();
  }
  if (months < 0) { years -= 1; months += 12; }
  const totalDays = Math.max(0, Math.floor((now.getTime() - start.getTime()) / 86400000));
  return { years, months, days, totalDays };
}

function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [since, setSince] = useState("2023-02-14");

  useEffect(() => {
    if (!loading && user) navigate({ to: "/app/home" });
  }, [loading, user, navigate]);

  const diff = useMemo(() => diffFrom(since), [since]);

  return (
    <div className="min-h-screen bg-[var(--gradient-soft)]">
      <header className="container mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2">
          <Heart className="h-5 w-5 fill-primary text-primary animate-heartbeat" />
          <span className="text-base font-semibold tracking-tight">Nosso Diário</span>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Link to="/auth">
            <Button variant="ghost" size="sm">Entrar</Button>
          </Link>
          <Link to="/auth" search={{ mode: "signup" }}>
            <Button size="sm">Começar</Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto max-w-5xl px-4 pb-16">
        {/* Preview funcional do contador */}
        <section className="mt-6 rounded-3xl border bg-card p-6 shadow-[var(--shadow-card)] sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Experimente agora</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                Quanto tempo vocês estão juntos?
              </h1>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Coloque a data em que tudo começou e veja seu contador. Quando criar conta, ele fica salvo pra sempre.
              </p>
              <div className="mt-4 flex items-center gap-2">
                <Input
                  type="date"
                  value={since}
                  onChange={(e) => setSince(e.target.value)}
                  className="max-w-[180px]"
                />
                <Link to="/auth" search={{ mode: "signup" }}>
                  <Button size="sm" className="gap-1">
                    Salvar <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </div>

            <div className="rounded-2xl bg-blush/60 p-5 text-center">
              {diff ? (
                <>
                  <div className="flex items-end justify-center gap-3">
                    <Stat n={diff.years} label="anos" />
                    <Stat n={diff.months} label="meses" />
                    <Stat n={diff.days} label="dias" />
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {diff.totalDays.toLocaleString("pt-BR")} dias juntos
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Escolha uma data válida</p>
              )}
            </div>
          </div>
        </section>

        {/* Atalhos utilitários (não cards de marketing) */}
        <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ShortcutCard
            to="/auth"
            search={{ mode: "signup" }}
            icon={<BookHeart className="h-4 w-4" />}
            title="Diário do dia"
            hint="Anote o que fizeram hoje"
          />
          <ShortcutCard
            to="/auth"
            search={{ mode: "signup" }}
            icon={<Utensils className="h-4 w-4" />}
            title="Restaurantes"
            hint="Visitados + queremos ir"
          />
          <ShortcutCard
            to="/auth"
            search={{ mode: "signup" }}
            icon={<Gift className="h-4 w-4" />}
            title="Lista de desejos"
            hint="Cole o link, a gente busca"
          />
          <ShortcutCard
            to="/auth"
            search={{ mode: "signup" }}
            icon={<Calendar className="h-4 w-4" />}
            title="Calendário"
            hint="Datas e memórias do dia"
          />
        </section>

        {/* Como funciona — direto ao ponto */}
        <section className="mt-8 rounded-2xl border bg-card/60 p-5">
          <h2 className="text-sm font-semibold">Como funciona</h2>
          <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><span className="mr-2 font-medium text-foreground">1.</span>Cada um cria sua conta.</li>
            <li><span className="mr-2 font-medium text-foreground">2.</span>Um gera o código do casal, o outro entra com ele.</li>
            <li><span className="mr-2 font-medium text-foreground">3.</span>Vocês registram juntos. Ninguém mais vê nada.</li>
          </ol>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/auth" search={{ mode: "signup" }}>
              <Button size="sm">Criar conta</Button>
            </Link>
            <Link to="/auth">
              <Button size="sm" variant="ghost">Já tenho conta</Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t py-5 text-center text-xs text-muted-foreground">
        Privado por padrão · Feito com <Heart className="inline h-3 w-3 fill-primary text-primary" /> pra vocês
      </footer>
    </div>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div className="min-w-[56px]">
      <div className="text-3xl font-bold tabular-nums text-primary">{n}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

function ShortcutCard({
  to, search, icon, title, hint,
}: {
  to: string;
  search?: Record<string, unknown>;
  icon: React.ReactNode;
  title: string;
  hint: string;
}) {
  return (
    <Link
      to={to}
      search={search as never}
      className="group flex items-center gap-3 rounded-2xl border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent/40"
    >
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blush text-primary">
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-sm font-medium">{title}</div>
        <div className="truncate text-xs text-muted-foreground">{hint}</div>
      </div>
      <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
