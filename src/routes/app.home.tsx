import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Heart, Copy, Check, Utensils, Gift, Calendar, BookHeart, Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/AppShell";
import { useCouple } from "@/lib/use-couple";
import { formatDuration, totalDays } from "@/lib/utils-romance";

export const Route = createFileRoute("/app/home")({
  head: () => ({ meta: [{ title: "Início — Nosso Diário" }] }),
  component: () => (
    <AppShell requireCouple={false}>
      <HomePage />
    </AppShell>
  ),
});

function useTick(ms = 1000) {
  const [, setT] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setT((n) => n + 1), ms);
    return () => clearInterval(id);
  }, [ms]);
}

function HomePage() {
  const { couple, partner, me } = useCouple();
  const [copied, setCopied] = useState(false);
  useTick(1000);

  const dur = couple ? formatDuration(couple.anniversary_date) : null;
  const totalD = couple ? totalDays(couple.anniversary_date) : 0;

  async function copyCode() {
    if (!couple?.invite_code) return;
    try {
      await navigator.clipboard.writeText(couple.invite_code);
      setCopied(true);
      toast.success("Código copiado");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Não foi possível copiar");
    }
  }

  if (!couple) {
    return (
      <div className="rounded-2xl border bg-card p-6 text-center shadow-[var(--shadow-card)] animate-float-up">
        <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-blush">
          <Heart className="h-6 w-6 fill-primary text-primary" />
        </div>
        <h1 className="text-xl font-semibold">Olá, {me?.name || "amor"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pra começar, crie o casal de vocês ou entre com um código.
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link to="/onboarding/create">
            <Button className="w-full sm:w-auto">Criar nosso casal</Button>
          </Link>
          <Link to="/onboarding/join">
            <Button variant="outline" className="w-full sm:w-auto">Tenho um convite</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border bg-card p-6 shadow-[var(--shadow-card)] animate-float-up">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          {me?.name || "Você"}{partner ? ` & ${partner.name}` : ""}
        </p>
        <h1 className="mt-1 text-lg font-semibold">Estamos juntos há</h1>
        {dur && (
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
            <Cell n={dur.years} label="anos" />
            <Cell n={dur.months} label="meses" />
            <Cell n={dur.days} label="dias" />
            <Cell n={dur.hours} label="horas" />
            <Cell n={dur.minutes} label="min" />
            <Cell n={dur.seconds} label="seg" />
          </div>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          {totalD.toLocaleString("pt-BR")} dias · desde {new Date(couple.anniversary_date).toLocaleDateString("pt-BR")}
        </p>
      </section>

      {!partner && couple.invite_code && (
        <section className="rounded-2xl border border-dashed bg-card/70 p-5">
          <p className="text-sm font-medium">Convide seu amor 💌</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Compartilhe esse código com quem você ama. Ele(a) cria a conta e usa "Tenho um convite".
          </p>
          <div className="mt-3 flex items-center gap-2">
            <code className="flex-1 rounded-lg bg-muted px-4 py-3 text-center font-mono text-2xl tracking-[0.4em]">
              {couple.invite_code}
            </code>
            <Button variant="outline" size="icon" onClick={copyCode} aria-label="Copiar código">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </section>
      )}

      <section className="grid gap-3 sm:grid-cols-2">
        <Tile to="/app/diary" icon={<BookHeart className="h-4 w-4" />} title="Diário do dia" hint="O que vivemos hoje" />
        <Tile to="/app/calendar" icon={<Calendar className="h-4 w-4" />} title="Calendário" hint="Datas e memórias" />
        <Tile to="/app/restaurants" icon={<Utensils className="h-4 w-4" />} title="Restaurantes" hint="Visitados + queremos ir" />
        <Tile to="/app/wishlist" icon={<Gift className="h-4 w-4" />} title="Lista de desejos" hint="Cole o link, a gente busca" />
        <Tile to="/app/friends" icon={<Users className="h-4 w-4" />} title="Casais conectados" hint="Amigos casais (opcional)" />
      </section>
    </div>
  );
}

function Cell({ n, label }: { n: number; label: string }) {
  return (
    <div className="rounded-xl bg-blush/50 py-3 text-center">
      <div className="text-xl font-bold tabular-nums text-primary sm:text-2xl">{n}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

function Tile({
  to, icon, title, hint,
}: { to: "/app/diary" | "/app/calendar" | "/app/restaurants" | "/app/wishlist" | "/app/friends"; icon: React.ReactNode; title: string; hint: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-2xl border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent/40"
    >
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blush text-primary">
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-sm font-medium">{title}</div>
        <div className="truncate text-xs text-muted-foreground">{hint}</div>
      </div>
    </Link>
  );
}
