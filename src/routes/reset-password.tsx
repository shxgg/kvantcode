
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  clearPasswordRecovery,
  usePasswordRecoveryState,
} from "@/integrations/supabase/password-recovery";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Restablecer contraseña — kvantcode.ar" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ResetPasswordPage,
});

const input =
  "w-full rounded-lg border border-input bg-background/60 px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none";

const button =
  "inline-flex w-full items-center justify-center rounded-lg bg-gradient-primary px-5 py-2.5 font-medium text-primary-foreground shadow-glow transition hover:brightness-110 disabled:opacity-50";

function ResetPasswordPage() {
  const recovery = usePasswordRecoveryState();

  const [sessionReady, setSessionReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [updated, setUpdated] = useState(false);
  const [sessionError, setSessionError] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (!mounted) return;

      if (error) {
        setHasSession(false);
        setSessionError(true);
        setMessage(
          "No se pudo verificar la sesión. Solicitá un nuevo enlace de recuperación.",
        );
      } else {
        setHasSession(!!data.session);
        setSessionError(false);
      }

      setSessionReady(true);
    };

    void loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setHasSession(!!session);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (password.length < 8) {
      setMessage("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (password !== confirmation) {
      setMessage("Las contraseñas no coinciden.");
      return;
    }

    setBusy(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setMessage(error.message);
      setBusy(false);
      return;
    }

    clearPasswordRecovery();

    const { error: signOutError } = await supabase.auth.signOut();

    setBusy(false);

    if (signOutError) {
      setUpdated(true);
      setMessage(
        "La contraseña fue actualizada, pero no se pudo cerrar la sesión automáticamente. Cerrá sesión antes de continuar.",
      );
      return;
    }

    window.location.replace("/panel?passwordUpdated=1");
  }

  const checking = !recovery.ready || !sessionReady;

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground">
      <div className="mx-auto flex min-h-[80vh] max-w-md items-center justify-center">
        <div className="w-full rounded-2xl border border-border bg-card p-8 shadow-xl">
          <h1 className="mb-3 text-2xl font-semibold">
            Restablecer contraseña
          </h1>

          {checking ? (
            <p className="text-sm text-muted-foreground">
              Verificando enlace de recuperación...
            </p>
          ) : updated ? (
            <>
              <p className="mb-4 text-sm text-accent">{message}</p>
              <Link to="/admin" className="text-sm text-accent underline">
                Ir al inicio de sesión
              </Link>
            </>
          ) : sessionError || !recovery.pending || !hasSession ? (
            <>
              <p className="mb-4 text-sm text-muted-foreground">
                {message ||
                  "El enlace de recuperación no es válido, venció o ya fue utilizado. Solicitá uno nuevo desde el inicio de sesión."}
              </p>

              <Link to="/admin" className="text-sm text-accent underline">
                Volver al inicio de sesión
              </Link>
            </>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Ingresá tu nueva contraseña. Debe tener al menos 8 caracteres.
              </p>

              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="Nueva contraseña"
                className={input}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />

              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="Confirmar contraseña"
                className={input}
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
              />

              {message && (
                <p className="text-sm text-accent" role="alert">
                  {message}
                </p>
              )}

              <button type="submit" disabled={busy} className={button}>
                {busy ? "Actualizando..." : "Guardar nueva contraseña"}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}