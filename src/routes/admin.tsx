
import {
  clearPasswordRecovery,
  usePasswordRecoveryState,
} from "@/integrations/supabase/password-recovery";
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
      {
        name: "description",
        content: "Editá los textos y datos de contacto de kvantcode.ar.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

const input =
  "w-full rounded-lg border border-input bg-background/60 px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none";

const btn =
  "inline-flex items-center justify-center rounded-lg bg-gradient-primary px-5 py-2.5 font-medium text-primary-foreground shadow-glow transition hover:brightness-110 disabled:opacity-50";

const btnGhost =
  "rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:border-accent hover:text-accent";

function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const recovery = usePasswordRecoveryState();

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setReady(true);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, s) => {
      if (mounted) setSession(s);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    if (!session) {
      setIsAdmin(false);
      return;
    }

    setIsAdmin(false);

    supabase
      .rpc("has_role", {
        _user_id: session.user.id,
        _role: "admin",
      })
      .then(({ data, error }) => {
        if (mounted) {
          setIsAdmin(!error && !!data);
        }
      });

    return () => {
      mounted = false;
    };
  }, [session?.user.id]);

  const blocked = recovery.pending;

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-card/40">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 font-mono font-bold"
          >
            <img src={logoMark} alt="" className="h-7 w-7 object-contain" />
            kvantcode<span className="text-accent">.</span>
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              // panel
            </span>
          </Link>

          {session && !blocked && (
            <div className="flex items-center gap-3">
              {isAdmin && (
                <Link to="/panel" className={btnGhost}>
                  Ir al panel
                </Link>
              )}

              <button
                className={btnGhost}
                onClick={() => supabase.auth.signOut()}
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-10">
        {!ready || !recovery.ready ? null : blocked ? (
          <div className="glow-card mx-auto max-w-md space-y-4 rounded-xl p-8">
            <h1 className="text-2xl font-bold">Recuperación pendiente</h1>
            <p className="text-sm text-muted-foreground">
              Para continuar, completá el cambio de contraseña.
            </p>
            <Link
              to="/reset-password"
              className="text-sm text-accent underline"
            >
              Continuar con la recuperación
            </Link>
          </div>
        ) : session ? (
          <Editor userId={session.user.id} />
        ) : (
          <Login />
        )}
      </main>
    </div>
  );
}

function Login() {
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

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setBusy(false);

    if (error) {
      setMsg(error.message);
      return;
    }

    clearPasswordRecovery();
  }

  async function requestRecovery(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const email = recoveryEmail.trim();

    if (!email) {
      setMsg("Ingresá tu correo electrónico.");
      return;
    }

    setBusy(true);
    setMsg("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setBusy(false);

    if (error) {
      setMsg(error.message);
      return;
    }

    setMsg(
      "Si la cuenta existe, te enviamos un email para restablecer la contraseña.",
    );
  }

  if (recovery) {
    return (
      <form
        onSubmit={requestRecovery}
        className="glow-card mx-auto max-w-md space-y-4 rounded-xl p-8"
      >
        <h1 className="text-2xl font-bold">Recuperar contraseña</h1>

        <p className="text-sm text-muted-foreground">
          Ingresá tu correo electrónico y te enviaremos un enlace para
          restablecer tu contraseña.
        </p>

        <input
          name="recoveryEmail"
          type="email"
          required
          placeholder="Correo electrónico"
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
      <h1 className="text-2xl font-bold">Ingresar al panel</h1>

      <input
        name="email"
        type="email"
        required
        placeholder="Correo electrónico"
        className={input}
        autoComplete="email"
      />

      <input
        name="password"
        type="password"
        required
        placeholder="Contraseña"
        className={input}
        autoComplete="current-password"
      />

      {msg && (
        <p className="text-sm text-accent" role="alert">
          {msg}
        </p>
      )}

      <button disabled={busy} className={`${btn} w-full`}>
        {busy ? "Ingresando…" : "Ingresar"}
      </button>

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
    </form>
  );
}

function Editor({ userId }: { userId: string }) {
  const [c, setC] = useState<SiteContent | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    supabase
      .rpc("has_role", { _user_id: userId, _role: "admin" })
      .then(({ data }) => setIsAdmin(!!data));

    supabase
      .from("site_content")
      .select("data")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data }) => setC(mergeContent(data?.data)));
  }, [userId]);

  if (isAdmin === false)
    return (
      <p className="text-muted-foreground">
        Esta cuenta no tiene permisos de administración.
      </p>
    );

  if (!c || isAdmin === null)
    return <p className="text-muted-foreground">Cargando…</p>;

  const set = <K extends keyof SiteContent>(
    k: K,
    v: SiteContent[K],
  ) => setC({ ...c, [k]: v });

  async function save() {
    setStatus("Guardando…");

    const { error } = await supabase
      .from("site_content")
      .update({
        data: JSON.parse(JSON.stringify(c)),
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);

    setStatus(
      error
        ? `Error: ${error.message}`
        : "¡Guardado! Los cambios ya se ven en la web.",
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Editar contenido</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-accent">{status}</span>
          <button className={btn} onClick={save}>
            Guardar cambios
          </button>
        </div>
      </div>

      <Section title="Contacto">
        <Field label="WhatsApp (con código de país)">
          <input
            className={input}
            value={c.contact.whatsapp}
            onChange={(e) =>
              set("contact", { ...c.contact, whatsapp: e.target.value })
            }
          />
        </Field>

        <Field label="Teléfono visible">
          <input
            className={input}
            value={c.contact.phone}
            onChange={(e) =>
              set("contact", { ...c.contact, phone: e.target.value })
            }
          />
        </Field>

        <Field label="Email">
          <input
            className={input}
            value={c.contact.email}
            onChange={(e) =>
              set("contact", { ...c.contact, email: e.target.value })
            }
          />
        </Field>

        <Field label="Ubicación">
          <input
            className={input}
            value={c.contact.location}
            onChange={(e) =>
              set("contact", { ...c.contact, location: e.target.value })
            }
          />
        </Field>

        <Field label="Mensaje inicial de WhatsApp" wide>
          <input
            className={input}
            value={c.contact.whatsappMessage}
            onChange={(e) =>
              set("contact", {
                ...c.contact,
                whatsappMessage: e.target.value,
              })
            }
          />
        </Field>
      </Section>

      <Section title="Portada">
        <Field label="Título línea 1">
          <input
            className={input}
            value={c.hero.title[0]}
            onChange={(e) =>
              set("hero", {
                ...c.hero,
                title: [e.target.value, c.hero.title[1] ?? ""],
              })
            }
          />
        </Field>

        <Field label="Título línea 2">
          <input
            className={input}
            value={c.hero.title[1]}
            onChange={(e) =>
              set("hero", {
                ...c.hero,
                title: [c.hero.title[0] ?? "", e.target.value],
              })
            }
          />
        </Field>

        <Field label="Subtítulo" wide>
          <textarea
            rows={2}
            className={input}
            value={c.hero.subtitle}
            onChange={(e) =>
              set("hero", { ...c.hero, subtitle: e.target.value })
            }
          />
        </Field>

        <Field label="Línea de terminal" wide>
          <input
            className={input}
            value={c.hero.terminal}
            onChange={(e) =>
              set("hero", { ...c.hero, terminal: e.target.value })
            }
          />
        </Field>
      </Section>

      <Section title="Qué hacemos (tarjetas)">
        <ListEditor
          items={c.whatWeDo}
          onChange={(v) => set("whatWeDo", v)}
          blank={{ tag: "nuevo", title: "", text: "" }}
          fields={["tag", "title", "text"]}
        />
      </Section>

      <Section title="Servicios (lista numerada)">
        <ListEditor
          items={c.services}
          onChange={(v) => set("services", v)}
          blank={{ title: "", text: "" }}
          fields={["title", "text"]}
        />
      </Section>

      <Section title="Cómo trabajamos">
        <Field label="Frase" wide>
          <input
            className={input}
            value={c.process.motto}
            onChange={(e) =>
              set("process", { ...c.process, motto: e.target.value })
            }
          />
        </Field>

        <div className="sm:col-span-2">
          <ListEditor
            items={c.process.steps}
            onChange={(v) => set("process", { ...c.process, steps: v })}
            blank={{ title: "", text: "" }}
            fields={["title", "text"]}
          />
        </div>
      </Section>

      <Section title="Nosotros y métricas">
        <Field label="Texto de Nosotros" wide>
          <textarea
            rows={3}
            className={input}
            value={c.about}
            onChange={(e) => set("about", e.target.value)}
          />
        </Field>

        <div className="sm:col-span-2">
          <ListEditor
            items={c.metrics}
            onChange={(v) => set("metrics", v)}
            blank={{ value: "", label: "" }}
            fields={["value", "label"]}
          />
        </div>
      </Section>

      <Section title="Contacto final">
        <Field label="Título">
          <input
            className={input}
            value={c.cta.title}
            onChange={(e) =>
              set("cta", { ...c.cta, title: e.target.value })
            }
          />
        </Field>

        <Field label="Texto">
          <input
            className={input}
            value={c.cta.text}
            onChange={(e) =>
              set("cta", { ...c.cta, text: e.target.value })
            }
          />
        </Field>
      </Section>

      <Section title="Redes">
        <ListEditor
          items={c.socials}
          onChange={(v) => set("socials", v)}
          blank={{ label: "", href: "https://" }}
          fields={["label", "href"]}
        />
      </Section>

      <div className="flex justify-end">
        <button className={btn} onClick={save}>
          Guardar cambios
        </button>
      </div>
    </div>
  );
}

const fieldLabels: Record<string, string> = {
  tag: "Etiqueta",
  title: "Título",
  text: "Texto",
  value: "Valor",
  label: "Nombre",
  href: "Enlace",
};

function ListEditor<T extends Record<string, string>>({
  items,
  onChange,
  blank,
  fields,
}: {
  items: T[];
  onChange: (v: T[]) => void;
  blank: T;
  fields: (keyof T & string)[];
}) {
  return (
    <div className="space-y-3">
      {items.map((it, i) => (
        <div
          key={i}
          className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-start"
        >
          {fields.map((f) => (
            <label
              key={f}
              className={f === "text" ? "flex-[2]" : "flex-1"}
            >
              <span className="mb-1 block font-mono text-xs text-muted-foreground">
                {fieldLabels[f] ?? f}
              </span>
              <input
                className={input}
                value={it[f]}
                onChange={(e) =>
                  onChange(
                    items.map((x, j) =>
                      j === i ? { ...x, [f]: e.target.value } : x,
                    ),
                  )
                }
              />
            </label>
          ))}

          <button
            type="button"
            className={`${btnGhost} sm:mt-5`}
            onClick={() =>
              onChange(items.filter((_, j) => j !== i))
            }
            aria-label="Quitar"
          >
            Quitar
          </button>
        </div>
      ))}

      <button
        type="button"
        className={btnGhost}
        onClick={() => onChange([...items, { ...blank }])}
      >
        + Agregar
      </button>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="glow-card rounded-xl p-6">
      <h2 className="mb-4 font-mono text-sm text-accent">
        // {title}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({
  label,
  children,
  wide,
}: {
  label: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <label className={wide ? "sm:col-span-2" : ""}>
      <span className="mb-1 block font-mono text-xs text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
