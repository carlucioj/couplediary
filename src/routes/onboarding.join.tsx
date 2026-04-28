import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, KeyRound } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useCouple } from "@/lib/use-couple";

export const Route = createFileRoute("/onboarding/join")({
  head: () => ({ meta: [{ title: "Entrar em casal — Nosso Diário" }] }),
  component: JoinCouplePage,
});

const schema = z.object({
  code: z
    .string()
    .trim()
    .min(6, "Código deve ter 6 caracteres")
    .max(6, "Código deve ter 6 caracteres")
    .regex(/^[A-Z0-9]+$/i, "Use apenas letras e números"),
});

function JoinCouplePage() {
  const { user, loading: authLoading } = useAuth();
  const { couple, loading: coupleLoading, refresh } = useCouple();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth" });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!coupleLoading && couple) navigate({ to: "/app/home" });
  }, [coupleLoading, couple, navigate]);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const parsed = schema.safeParse({ code });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    try {
      const upper = parsed.data.code.toUpperCase();

      // Find couple by code (RLS: only discoverable couples are public via SELECT,
      // so we go through a lookup that respects current policies — couples by code
      // are visible to authenticated users via the discoverable policy when needed.
      // Here we use an RPC-less approach: try insert and rely on error.
      // First, we try to read by invite_code under the assumption it's our own membership context.
      const { data: found, error: findErr } = await supabase
        .from("couples")
        .select("id, invite_expires_at")
        .eq("invite_code", upper)
        .maybeSingle();

      if (findErr) throw findErr;
      if (!found) {
        toast.error("Código inválido. Confirme com seu amor.");
        return;
      }
      if (found.invite_expires_at && new Date(found.invite_expires_at).getTime() < Date.now()) {
        toast.error("Esse código expirou. Peça um novo.");
        return;
      }

      const { error: mErr } = await supabase
        .from("couple_members")
        .insert({ couple_id: found.id, user_id: user.id });
      if (mErr) throw mErr;

      toast.success("Vocês estão conectados 💞");
      await refresh();
      navigate({ to: "/app/home" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao entrar no casal");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--gradient-soft)] px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/app/home" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
        <div className="rounded-2xl border bg-card p-6 shadow-[var(--shadow-card)]">
          <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blush text-primary">
            <KeyRound className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-semibold">Entrar com código</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Coloque o código de 6 caracteres que seu amor gerou.
          </p>
          <form onSubmit={handleJoin} className="mt-5 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="code">Código de convite</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="EX: A4B7K2"
                maxLength={6}
                className="text-center text-lg font-mono tracking-[0.4em] uppercase"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Conectando..." : "Entrar no casal"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
