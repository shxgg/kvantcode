import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { whatsappUrl as waUrl, type SiteContent } from "@/content/site";
import { getSiteContent } from "@/lib/content.functions";
import logoMark from "@/assets/kvant-logo.png";
import designImg from "@/assets/design-hero.jpg";

const TITLE = "kvantcode.ar — Sistemas administrativos y contables para pymes";
const DESC =
  "Sistemas administrativos, contables y financieros a medida para pymes argentinas. Automatizaciones, apps financieras e informática a medida.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: () => getSiteContent(),
  component: Index,
});

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.15 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

function Logo() {
  return (
    <span className="inline-flex items-center gap-2 font-mono text-lg font-bold tracking-tight">
      <img src={logoMark} alt="" width={28} height={28} className="h-7 w-7 object-contain" />
      <span>
      <span className="text-muted-foreground">&lt;/</span>kvantcode<span className="text-accent">.</span></span>
    </span>
  );
}

function Label({ children }: { children: string }) {
  return <p className="font-mono text-sm text-accent">// {children}</p>;
}

const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-primary px-6 py-3 font-medium text-primary-foreground shadow-glow transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-ring";
const btnGhost =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-border px-6 py-3 font-medium text-foreground transition hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-ring";

function Index() {
  const site = Route.useLoaderData();
  const whatsappUrl = (m?: string) => waUrl(site, m);
  useReveal();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen overflow-x-hidden">
      <a href="#main" className="sr-only focus:not-sr-only">Saltar al contenido</a>

      {/* NAVBAR */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/70 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4" aria-label="Principal">
          <a href="#top" aria-label="kvantcode inicio"><Logo /></a>
          <ul className="hidden items-center gap-8 md:flex">
            {site.nav.map((n) => (
              <li key={n.href}>
                <a href={n.href} className="text-sm text-muted-foreground transition hover:text-foreground">{n.label}</a>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-3">
            <a href={whatsappUrl()} target="_blank" rel="noreferrer" className={`${btnPrimary} hidden px-4 py-2 text-sm sm:inline-flex`}>Hablemos</a>
            <button
              className="rounded-md border border-border p-2 md:hidden"
              aria-label="Abrir menú"
              aria-expanded={open}
              onClick={() => setOpen(!open)}
            >
              <span className="block h-0.5 w-5 bg-foreground" />
              <span className="mt-1.5 block h-0.5 w-5 bg-foreground" />
            </button>
          </div>
        </nav>
        {open && (
          <ul className="space-y-1 border-t border-border px-5 py-4 md:hidden">
            {site.nav.map((n) => (
              <li key={n.href}>
                <a href={n.href} onClick={() => setOpen(false)} className="block py-2 text-muted-foreground">{n.label}</a>
              </li>
            ))}
            <li><a href={whatsappUrl()} target="_blank" rel="noreferrer" className={`${btnPrimary} mt-2 w-full`}>Hablemos</a></li>
          </ul>
        )}
      </header>

      <main id="main">
        {/* HERO */}
        <section id="top" className="relative flex min-h-screen items-center pt-24">
          <div className="tech-grid absolute inset-0" aria-hidden />
          <div className="absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/30 blur-3xl" aria-hidden />
          <div className="relative mx-auto max-w-6xl px-5 py-20">
            <div className="reveal inline-flex items-center gap-2 rounded-lg border border-border bg-card/60 px-4 py-2 font-mono text-sm">
              <span className="text-accent">{site.hero.terminal}</span>
              <span className="animate-blink inline-block h-4 w-2 bg-accent" aria-hidden />
            </div>
            <h1 className="reveal mt-8 max-w-4xl text-5xl font-bold leading-[1.05] sm:text-6xl lg:text-7xl">
              {site.hero.title[0]}<br />
              <span className="text-gradient">{site.hero.title[1]}</span>
            </h1>
            <p className="reveal mt-6 max-w-xl text-lg text-muted-foreground">{site.hero.subtitle}</p>
            <div className="reveal mt-10 flex flex-col gap-4 sm:flex-row">
              <a href="#servicios" className={btnPrimary}>Ver servicios</a>
              <a href={whatsappUrl()} target="_blank" rel="noreferrer" className={btnGhost}>Hablemos →</a>
            </div>
          </div>
        </section>

        {/* MARQUEE */}
        <div className="overflow-hidden border-y border-border bg-card/40 py-5" aria-label="Áreas de trabajo">
          <div className="animate-marquee flex w-max gap-12 font-mono text-sm tracking-widest text-muted-foreground">
            {[...site.marquee, ...site.marquee].map((t, i) => (
              <span key={i} aria-hidden={i >= site.marquee.length}>
                <span className="text-accent">&lt;/</span>{t}
              </span>
            ))}
          </div>
        </div>

        {/* QUÉ HACEMOS */}
        <section id="servicios" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-24">
          <div className="reveal"><Label>Qué hacemos</Label>
            <h2 className="mt-3 max-w-2xl text-4xl font-bold sm:text-5xl">Software que entiende de números.</h2>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {site.whatWeDo.map((c) => (
              <article key={c.title} className="glow-card reveal rounded-xl p-8">
                <p className="font-mono text-xs text-accent">&lt;/{c.tag}&gt;</p>
                <h3 className="mt-6 text-xl font-semibold">{c.title}</h3>
                <p className="mt-3 text-muted-foreground">{c.text}</p>
              </article>
            ))}
          </div>

          {/* LISTA NUMERADA */}
          <ol className="mt-24 divide-y divide-border border-y border-border">
            {site.services.map((s, i) => (
              <li key={s.title} className="reveal group grid gap-2 py-7 transition sm:grid-cols-[80px_1fr_1fr] sm:items-center">
                <span className="font-mono text-accent">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="text-2xl font-semibold transition group-hover:text-accent">{s.title}</h3>
                <p className="text-muted-foreground">{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* CÓMO TRABAJAMOS */}
        <section id="como-trabajamos" className="relative scroll-mt-24 border-y border-border bg-card/30 py-24">
          <div className="mx-auto max-w-6xl px-5">
            <div className="reveal"><Label>Cómo trabajamos</Label>
              <h2 className="mt-3 text-4xl font-bold sm:text-5xl">{site.process.motto}</h2>
            </div>
            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {site.process.steps.map((s, i) => (
                <div key={s.title} className="glow-card reveal relative rounded-xl p-8">
                  <span className="font-mono text-sm text-muted-foreground">paso_{i + 1}</span>
                  <h3 className="mt-4 text-2xl font-semibold">
                    {s.title} {i < 2 && <span className="text-accent" aria-hidden>→</span>}
                  </h3>
                  <p className="mt-3 text-muted-foreground">{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* NOSOTROS + MÉTRICAS */}
        <section id="nosotros" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-24">
          <div className="reveal grid gap-10 md:grid-cols-2">
            <div><Label>Nosotros</Label>
              <h2 className="mt-3 text-4xl font-bold sm:text-5xl">Ingeniería con acento argentino.</h2>
            </div>
            <p className="text-lg text-muted-foreground md:pt-8">{site.about}</p>
          </div>
          <div className="reveal mt-14 overflow-hidden rounded-xl border border-border shadow-glow">
            <img src={designImg} alt="Espacio de trabajo con tableros financieros y código" width={1536} height={1024} loading="lazy" className="h-auto w-full object-cover" />
          </div>
          <dl className="mt-16 grid grid-cols-2 gap-6 lg:grid-cols-4">
            {site.metrics.map((m) => (
              <div key={m.label} className="glow-card reveal rounded-xl p-6">
                <dd className="text-gradient text-4xl font-bold sm:text-5xl">{m.value}</dd>
                <dt className="mt-2 font-mono text-xs text-muted-foreground">{m.label}</dt>
              </div>
            ))}
          </dl>
        </section>

        {/* CTA */}
        <section id="contacto" className="relative scroll-mt-24 overflow-hidden py-24">
          <div className="absolute bottom-0 left-1/2 h-80 w-[40rem] -translate-x-1/2 rounded-full bg-primary/25 blur-3xl" aria-hidden />
          <div className="relative mx-auto grid max-w-6xl gap-12 px-5 md:grid-cols-2">
            <div className="reveal"><Label>Contacto</Label>
              <h2 className="mt-3 text-4xl font-bold sm:text-5xl">{site.cta.title}</h2>
              <p className="mt-4 text-lg text-muted-foreground">{site.cta.text}</p>
              <a href={whatsappUrl()} target="_blank" rel="noreferrer" className={`${btnPrimary} mt-8`}>Escribinos por WhatsApp</a>
              <p className="mt-6 font-mono text-sm text-muted-foreground">{site.contact.email}</p>
            </div>
            <ContactForm site={site} />
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-border bg-card/30">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Logo />
            <p className="mt-3 text-sm text-muted-foreground">Sistemas a medida para pymes argentinas.</p>
          </div>
          <FooterCol title="Navegación" items={site.nav} />
          <div>
            <p className="font-mono text-xs text-accent">// Contacto</p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li><a href={`mailto:${site.contact.email}`} className="hover:text-foreground">{site.contact.email}</a></li>
              <li><a href={whatsappUrl()} className="hover:text-foreground">{site.contact.phone}</a></li>
              <li>{site.contact.location}</li>
            </ul>
          </div>
          <FooterCol title="Redes" items={site.socials} external />
        </div>
        <p className="border-t border-border py-6 text-center font-mono text-xs text-muted-foreground">© 2026 {site.name}</p>
      </footer>
    </div>
  );
}

function FooterCol({ title, items, external }: { title: string; items: { label: string; href: string }[]; external?: boolean }) {
  return (
    <div>
      <p className="font-mono text-xs text-accent">// {title}</p>
      <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
        {items.map((i) => (
          <li key={i.label}>
            <a href={i.href} {...(external ? { target: "_blank", rel: "noreferrer" } : {})} className="hover:text-foreground">{i.label}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ContactForm({ site }: { site: SiteContent }) {
  const whatsappUrl = (m?: string) => waUrl(site, m);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const input = "w-full rounded-lg border border-input bg-background/60 px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none";

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const v = (k: string) => String(f.get(k) ?? "").trim();
    const data = { nombre: v("nombre"), email: v("email"), empresa: v("empresa"), mensaje: v("mensaje") };
    const err: Record<string, string> = {};
    if (!data.nombre || data.nombre.length > 100) err["nombre"] = "Ingresá tu nombre.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) || data.email.length > 255) err["email"] = "Ingresá un email válido.";
    if (data.empresa.length > 100) err["empresa"] = "Máximo 100 caracteres.";
    if (!data.mensaje || data.mensaje.length > 1000) err["mensaje"] = "Contanos brevemente qué necesitás.";
    setErrors(err);
    if (Object.keys(err).length) return;
    const msg = `Hola kvantcode! Soy ${data.nombre}${data.empresa ? ` de ${data.empresa}` : ""} (${data.email}).\n\n${data.mensaje}`;
    window.open(whatsappUrl(msg), "_blank", "noopener");
  }

  const field = (name: string, label: string, el: React.ReactNode) => (
    <div>
      <label htmlFor={name} className="mb-2 block font-mono text-xs text-muted-foreground">{label}</label>
      {el}
      {errors[name] && <p className="mt-1 text-sm text-destructive" role="alert">{errors[name]}</p>}
    </div>
  );

  return (
    <form onSubmit={onSubmit} noValidate className="glow-card reveal space-y-5 rounded-xl p-8">
      {field("nombre", "nombre", <input id="nombre" name="nombre" autoComplete="name" maxLength={100} className={input} placeholder="Tu nombre" />)}
      {field("email", "email", <input id="email" name="email" type="email" autoComplete="email" maxLength={255} className={input} placeholder="vos@empresa.com" />)}
      {field("empresa", "empresa", <input id="empresa" name="empresa" autoComplete="organization" maxLength={100} className={input} placeholder="Nombre de tu pyme" />)}
      {field("mensaje", "mensaje", <textarea id="mensaje" name="mensaje" rows={4} maxLength={1000} className={input} placeholder="¿Qué te gustaría ordenar o automatizar?" />)}
      <button type="submit" className={`${btnPrimary} w-full`}>Enviar mensaje</button>
    </form>
  );
}
