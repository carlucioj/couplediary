import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { isDemoMode, disableDemoMode, DEMO_USER } from "./demo-data";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isDemo: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    // Modo demo: não precisa do Supabase
    if (isDemoMode()) {
      setIsDemo(true);
      setLoading(false);
      return;
    }

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    if (isDemo) {
      disableDemoMode();
      setIsDemo(false);
      setSession(null);
      return;
    }
    await supabase.auth.signOut();
  };

  // No modo demo, expõe um user fake
  const demoUser = isDemo ? (DEMO_USER as unknown as User) : null;

  return (
    <AuthContext.Provider
      value={{
        user: isDemo ? demoUser : (session?.user ?? null),
        session,
        loading,
        isDemo,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
