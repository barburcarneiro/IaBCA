import { useState } from "react";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

function isInIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
}

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const Login = () => {
  const [loading, setLoading] = useState(false);
  const inIframe = isInIframe();

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const token = new URLSearchParams(window.location.search).get("__lovable_token");
      const redirectUri = token
        ? `${window.location.origin}/?__lovable_token=${encodeURIComponent(token)}`
        : window.location.origin;

      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: redirectUri,
        extraParams: {
          hd: "barburcarneiro",
          prompt: "select_account",
        },
      });
      if (error) {
        toast.error("Erro ao fazer login. Verifique se está usando uma conta @barburcarneiro.");
        console.error("OAuth error:", error);
      }
    } catch (err) {
      toast.error("Erro inesperado ao fazer login.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold text-foreground">
            BCA – Assistente Jurídico
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Acesso restrito a contas <strong>@barburcarneiro</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {inIframe ? (
            <a
              href={window.location.href}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full"
            >
              <Button className="w-full flex items-center justify-center gap-2" size="lg">
                <GoogleIcon />
                Abrir em nova aba para fazer login
              </Button>
            </a>
          ) : (
            <Button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2"
              size="lg"
            >
              <GoogleIcon />
              {loading ? "Entrando..." : "Entrar com Google"}
            </Button>
          )}
          <p className="text-xs text-muted-foreground text-center">
            {inIframe
              ? "O login com Google não funciona dentro do preview. Clique acima para abrir em nova aba."
              : "Apenas contas do domínio @barburcarneiro são autorizadas."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
