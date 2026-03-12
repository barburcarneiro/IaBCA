import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import { toast } from "sonner";

interface AuthGuardProps {
  children: React.ReactNode;
  onUnauthenticated: () => void;
}

const ALLOWED_DOMAIN = "barburcarneiro";

const AuthGuard = ({ children, onUnauthenticated }: AuthGuardProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session) {
          const email = session.user.email || "";
          const domain = email.split("@")[1];
          if (domain !== ALLOWED_DOMAIN) {
            toast.error("Acesso restrito a contas @barburcarneiro.");
            await supabase.auth.signOut();
            onUnauthenticated();
            return;
          }
        }
        setSession(session);
        setLoading(false);
        if (!session) {
          onUnauthenticated();
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const email = session.user.email || "";
        const domain = email.split("@")[1];
        if (domain !== ALLOWED_DOMAIN) {
          toast.error("Acesso restrito a contas @barburcarneiro.");
          supabase.auth.signOut();
          onUnauthenticated();
          setLoading(false);
          return;
        }
      }
      setSession(session);
      setLoading(false);
      if (!session) {
        onUnauthenticated();
      }
    });

    return () => subscription.unsubscribe();
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
