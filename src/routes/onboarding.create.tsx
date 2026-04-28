import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Heart } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useCouple } from "@/lib/use-couple";
import { generateInviteCode } from "@/lib/utils-romance";

export const Route = createFileRoute("/onboarding/create")({
  head: () => ({ meta: [{ title: "Criar casal — Nosso Diário" }] }),
  component: CreateCouplePage,
});

const schema = z.object({
  anniversary: z.string().min(1, "Escolha uma data"),
});

function CreateCouplePage() {
  const { user, loading: authLoading } = useAuth();
  const { couple, loading: coupleLoading, refresh } = useCouple();
  const navigate = useNavigate();
  const [anniversary, setAnniversary] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth" });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!coupleLoading && couple) navigate({ to: "/app/home" });
  }, [coupleLoading, couple, navigate]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const parsed = schema.safeParse({ anniversary });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    try {
      const inviteCode = generateInviteCode();
      const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const { data: created, error: cErr } = await supabase
        .from("couples")
        .insert({
          anniversary_date: parsed.data.anniversary,
          created_by: user.id,
          invite_code: inviteCode,
          invite_expires_at: expires,
        })
        .select("id, invite_code")
        .single();
      if (cErr) throw cErr;

      const { error: mErr } = await supabase
        .from("couple_members")
        .insert({ couple_id: created.id, user_id: user.id });
      if (mErr) throw mErr;

      toast.success("Casal criado! Compartilhe o código com seu amor.");
      await refresh();
      navigate({ to: "/app/home" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar casal");
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
            <Heart className="h-5 w-5 fill-primary" />
          </div>
          <h1 className="text-xl font-semibold">Criar nosso casal</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Você vai gerar um código de convite. Compartilhe com seu amor pra ele(a) entrar.
          </p>
          <form onSubmit={handleCreate} className="mt-5 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="anniversary">Data do início do namoro</Label>
              <Input
                id="anniversary"
                type="date"
                value={anniversary}
                onChange={(e) => setAnniversary(e.target.value)}
                max={new Date().toISOString().slice(0, 10)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Criando..." : "Criar e gerar convite"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
