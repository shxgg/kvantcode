import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { mergeContent, type SiteContent } from "@/content/site";
import logoMark from "@/assets/kvant-logo.png";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Panel de administración — kvantcode.ar" },
      { name: "description", content: "Editá los textos y datos de contacto de kvantcode.ar." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

const input =
  "w-full rounded-lg border border-input bg-background/60 px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none";
const btn =
  "inline-flex items-center justify-center rounded-lg bg-gradient-primary px-5 py-2.5 font-medium text-primary-foreground shadow-glow transition hover:brightness-110 disabled:opacity-50";
const btnGhost = "rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:border-accent hover:text-accent";

function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-card/40">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4">
          <Link to="/" className="inline-flex items-center gap-2 font-mono font-bold">
            <img src={logoMark} alt="" className="h-7 w-7 object-contain" />
            kvantcode<span className="text-accent">.</span>
            <span className="ml-2 text-sm font-normal text-muted-foreground">// panel</span>
          </Link>
          {session && (
            <button className={btnGhost} onClick={() => supabase.auth.signOut()}>Cerrar sesión</button>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-5 py-10">
        {!ready ? null : session ? <Editor userId={session.user.id} /> : <Login />}
      </main>
    </div>
  );
}

function Login() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [recovery, setRecovery] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email")).trim();
    const password = String(f.get("password"));
    setBusy(true);
    setMsg("");

    const res =
      mode === "in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/admin`,
            },
          });

    setBusy(false);

    if (res.error) return setMsg(res.error.message);

    if (mode === "up" && !res.data.session) {
      setMsg("Te enviamos un email para confirmar la cuenta. Después ingresá acá.");
    }
  }

  async function requestRecovery(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const email = recoveryEmail.trim();

    if (!email) {
      setMsg("Ingresá tu email.");
      return;
    }

    setBusy(true);
    setMsg("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/admin`,
    });

    setBusy(false);

    if (error) {
      setMsg(error.message);
      return;
    }

    setMsg("Si la cuenta existe, te enviamos un email para restablecer la contraseña.");
  }

  if (recovery) {
    return (
      <form
        onSubmit={requestRecovery}
        className="glow-card mx-auto max-w-md space-y-4 rounded-xl p-8"
      >
        <h1 className="text-2xl font-bold">Recuperar contraseña</h1>

        <p className="text-sm text-muted-foreground">
          Ingresá tu email y te enviaremos un enlace para restablecer tu contraseña.
        </p>

        <input
          name="recoveryEmail"
          type="email"
          required
          placeholder="info@kvantcode.ar"
          className={input}
          autoComplete="email"
          value={recoveryEmail}
          onChange={(e) => setRecoveryEmail(e.target.value)}
        />

        {msg && (
          <p className="text-sm text-accent" role="alert">
            {msg}
          </p>
        )}

        <button disabled={busy} className={`${btn} w-full`}>
          {busy ? "Enviando…" : "Enviar recuperación"}
        </button>

        <button
          type="button"
          onClick={() => {
            setRecovery(false);
            setMsg("");
          }}
          className="w-full text-sm text-muted-foreground hover:text-accent"
        >
          Volver a ingresar
        </button>
      </form>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="glow-card mx-auto max-w-md space-y-4 rounded-xl p-8"
    >
      <h1 className="text-2xl font-bold">
        {mode === "in" ? "Ingresar al panel" : "Crear cuenta de administrador"}
      </h1>

      <input
        name="email"
        type="email"
        required
        placeholder="info@kvantcode.ar"
        className={input}
        autoComplete="email"
      />

      <input
        name="password"
        type="password"
        required
        minLength={8}
        placeholder="Contraseña"
        className={input}
        autoComplete={mode === "in" ? "current-password" : "new-password"}
      />

      {msg && (
        <p className="text-sm text-accent" role="alert">
          {msg}
        </p>
      )}

      <button disabled={busy} className={`${btn} w-full`}>
        {busy
          ? "Procesando…"
          : mode === "in"
            ? "Ingresar"
            : "Crear cuenta"}
      </button>

      {mode === "in" && (
        <button
          type="button"
          onClick={() => {
            setRecovery(true);
            setMsg("");
          }}
          className="w-full text-sm text-muted-foreground hover:text-accent"
        >
          ¿Olvidaste tu contraseña?
        </button>
      )}

      <button
        type="button"
        onClick={() => {
          setMode(mode === "in" ? "up" : "in");
          setMsg("");
        }}
        className="w-full text-sm text-muted-foreground hover:text-accent"
      >
        {mode === "in"
          ? "¿Primera vez? Creá tu cuenta"
          : "Ya tengo cuenta"}
      </button>
    </form>
  );
}