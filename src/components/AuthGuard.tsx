import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import { toast } from "sonner";

interface AuthGuardProps {
  children: React.ReactNode;
  onUnauthenticated: () => void;
}

const ALLOWED_DOMAINS = new Set(["barburcarneiro", "barburcarneiro.com"]);

const isAllowedDomain = (email?: string) => {
  const domain = (email ?? "").split("@")[1]?.toLowerCase();
  return Boolean(domain && ALLOWED_DOMAINS.has(domain));
};

const AuthGuard = ({ children, onUnauthenticated }: AuthGuardProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const applySession = async (nextSession: Session | null) => {
      if (!mounted) return;

      if (!nextSession) {
        setSession(null);
        setLoading(false);
        onUnauthenticated();
        return;
      }

      if (!isAllowedDomain(nextSession.user.email)) {
        toast.error("Acesso restrito a contas @barburcarneiro.");
        await supabase.auth.signOut();
        if (!mounted) return;
        setSession(null);
        setLoading(false);
        onUnauthenticated();
        return;
      }

      setSession(nextSession);
      setLoading(false);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void applySession(nextSession);
    });

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      void applySession(initialSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [onUnauthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!session) return null;

  return <>{children}</>;
};

export default AuthGuard;
