import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/onboarding/join")({
  head: () => ({ meta: [{ title: "Entrar em casal — Nosso Diário" }] }),
  component: () => (
    <div className="flex min-h-screen items-center justify-center bg-[var(--gradient-soft)] px-4">
      <div className="max-w-md rounded-2xl border bg-card p-6 text-center shadow-[var(--shadow-card)]">
        <h1 className="text-xl font-bold">Entrar com convite</h1>
        <p className="mt-2 text-sm text-muted-foreground">Esta etapa será implementada na próxima atualização.</p>
        <Link to="/app/home"><Button className="mt-5">Voltar</Button></Link>
      </div>
    </div>
  ),
});
