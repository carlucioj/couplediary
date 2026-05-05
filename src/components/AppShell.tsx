import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Heart, Home, BookHeart, Calendar, Utensils, Gift, Users, LogOut, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useCouple } from "@/lib/use-couple";
import { ThemeToggle } from "@/lib/theme";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/app/home", label: "Início", icon: Home },
  { to: "/app/diary", label: "Diário", icon: BookHeart },
  { to: "/app/calendar", label: "Calendário", icon: Calendar },
  { to: "/app/restaurants", label: "Restaurantes", icon: Utensils },
  { to: "/app/wishlist", label: "Desejos", icon: Gift },
  { to: "/app/friends", label: "Casais", icon: Users },
] as const;

export function AppShell({ children, requireCouple = true }: { children: ReactNode; requireCouple?: boolean }) {
  const { user, loading: authLoading, signOut, isDemo } = useAuth();
  const { couple, loading: coupleLoading } = useCouple();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth" });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (requireCouple && !coupleLoading && user && !couple) navigate({ to: "/app/home" });
  }, [requireCouple, coupleLoading, couple, user, navigate]);

  if (authLoading || coupleLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--gradient-soft)]">
        <Heart className="h-8 w-8 fill-primary text-primary animate-heartbeat" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--gradient-soft)] pb-24 md:pb-10">
      {/* Banner modo demo */}
      {isDemo && (
        <div className="flex items-center justify-between gap-2 bg-primary/10 px-4 py-2 text-xs text-primary">
          <span className="flex items-center gap-1.5">
            <FlaskConical className="h-3.5 w-3.5" />
            Modo demo — dados de exemplo, nada é salvo
          </span>
          <button
            onClick={() => signOut()}
            className="underline underline-offset-2 hover:no-underline"
          >
            Sair do demo
          </button>
        </div>
      )}
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="container mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link to="/app/home" className="flex items-center gap-2">
            <Heart className="h-5 w-5 fill-primary text-primary" />
            <span className="font-semibold">Nosso Diário</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {NAV.map((item) => {
              const active = location.pathname === item.to;
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors",
                    active ? "bg-blush text-primary" : "text-muted-foreground hover:bg-accent/40 hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" /> {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={() => signOut()}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-5xl px-4 py-6">{children}</main>

      {/* Bottom nav mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t bg-background/95 backdrop-blur md:hidden">
        <div className="grid grid-cols-6">
          {NAV.map((item) => {
            const active = location.pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2 text-[10px]",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className={cn("h-5 w-5", active && "fill-primary/20")} />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
