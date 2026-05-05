import { createFileRoute, Link, useNavigate, Outlet } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, FlaskConical } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { enableDemoMode } from "@/lib/demo-data";

const searchSchema = z.object({
  mode: z.enum(["login", "signup"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Entrar — Nosso Diário" },
      { name: "description", content: "Entre ou crie sua conta no Nosso Diário." },
    ],
  }),
  component: AuthLayout,
});

// Layout: renderiza a página de auth OU rotas filhas (ex: /auth/callback)
function AuthLayout() {
  return <Outlet />;
}

const credSchema = z.object({
  email: z.string().trim().email("E-mail inválido").max(255),
  password: z.string().min(6, "Mínimo 6 caracteres").max(72),
});

const signupSchema = credSchema.extend({
  name: z.string().trim().min(1, "Diga seu nome").max(60),
});

export function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">(search.mode ?? "login");
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (!loading && user) {
      navigate({ to: "/app/home" });
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    if (search.mode) setMode(search.mode);
  }, [search.mode]);

  function handleDemo() {
    enableDemoMode();
    // Força reload para o AuthProvider detectar o modo demo
    window.location.href = "/app/home";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "signup") {
        const parsed = signupSchema.safeParse({ name, email, password });
        if (!parsed.success) {
          toast.error(parsed.error.issues[0].message);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: { name: parsed.data.name },
          },
        });
        if (error) throw error;
        toast.success("Conta criada! Verifique seu e-mail para confirmar.");
      } else {
        const parsed = credSchema.safeParse({ email, password });
        if (!parsed.success) {
          toast.error(parsed.error.issues[0].message);
          return;
        }
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) throw error;
        navigate({ to: "/app/home" });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao autenticar";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--gradient-soft)] px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2">
          <Heart className="h-6 w-6 fill-primary text-primary" />
          <span className="text-lg font-semibold">Nosso Diário</span>
        </Link>

        {/* Banner modo demo */}
        <div className="mb-4 rounded-xl border border-dashed border-primary/40 bg-blush/40 p-4">
          <p className="text-sm font-medium text-foreground">Quer explorar sem criar conta?</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            O modo demo carrega dados de exemplo em todas as telas — diário, calendário, restaurantes e mais.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3 gap-2 border-primary/40 text-primary hover:bg-blush"
            onClick={handleDemo}
          >
            <FlaskConical className="h-4 w-4" />
            Entrar no modo demo
          </Button>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-[var(--shadow-card)]">
          <div className="mb-5 flex rounded-lg bg-muted p-1 text-sm">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 rounded-md py-2 font-medium transition ${
                mode === "login" ? "bg-background shadow-sm" : "text-muted-foreground"
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 rounded-md py-2 font-medium transition ${
                mode === "signup" ? "bg-background shadow-sm" : "text-muted-foreground"
              }`}
            >
              Criar conta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Seu nome</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Como te chamam?"
                  autoComplete="name"
                  maxLength={60}
                  required
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@exemplo.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                minLength={6}
                required
              />
            </div>

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Aguarde..." : mode === "signup" ? "Criar conta" : "Entrar"}
            </Button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Ao continuar, você concorda em manter o que registra aqui só para vocês dois.
        </p>
      </div>
    </div>
  );
}
