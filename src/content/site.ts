// Todos los textos, métricas y datos de contacto del sitio en un solo lugar.
export const defaultSite = {
  name: "kvantcode.ar",
  contact: {
    whatsapp: "5491132169646", // número sin + ni espacios
    whatsappMessage: "Hola kvantcode, quiero contarles sobre mi empresa.",
    email: "info@kvantcode.ar",
    phone: "+54 9 11 3216-9646",
    location: "Buenos Aires, Argentina",
  },
  footer: {
    description: "Tecnología que impulsa tu negocio.",
  },
  socials: [
    { label: "LinkedIn", href: "https://linkedin.com" },
    { label: "Instagram", href: "https://instagram.com" },
    { label: "GitHub", href: "https://github.com" },
  ],
  nav: [
    { label: "Servicios", href: "#servicios" },
    { label: "Cómo trabajamos", href: "#como-trabajamos" },
    { label: "Nosotros", href: "#nosotros" },
    { label: "Contacto", href: "#contacto" },
  ],
  hero: {
    terminal: "$ kvantcode init --pyme",
    title: ["Ordenamos tu empresa.", "Automatizamos el resto."],
    subtitle: "Sistemas administrativos, contables y financieros a medida para pymes argentinas.",
  },
  marquee: [
    "ADMINISTRACIÓN",
    "CONTABILIDAD",
    "GESTIÓN DE GASTOS",
    "APPS FINANCIERAS",
    "AUTOMATIZACIONES",
    "IA",
    "INFORMÁTICA A MEDIDA",
  ],
  whatWeDo: [
    {
      tag: "admin.sys",
      title: "Sistemas administrativos y contables",
      text: "Facturación, cuentas corrientes, stock y contabilidad integrados en un sistema pensado para cómo trabaja tu pyme.",
    },
    {
      tag: "finance.app",
      title: "Gestión de gastos y apps financieras",
      text: "Controlá gastos, flujo de caja y presupuestos en tiempo real, desde la compu o el celular.",
    },
    {
      tag: "auto.flow",
      title: "Automatizaciones e informática a medida",
      text: "Eliminamos tareas repetitivas, conectamos tus herramientas y sumamos IA donde realmente suma.",
    },
  ],
  services: [
    { title: "Sistemas de gestión", text: "ERP liviano a medida: ventas, compras, stock y clientes." },
    { title: "Control de gastos", text: "Registro, categorías, aprobaciones y reportes claros." },
    { title: "Apps financieras", text: "Tableros de caja, cobranzas y proyecciones." },
    { title: "Automatización de procesos", text: "Integraciones, reportes automáticos y flujos con IA." },
    { title: "Soporte y servicios IT a medida", text: "Acompañamiento técnico continuo para tu equipo." },
  ],
  process: {
    motto: "Empezá con poco, crecé a tu ritmo",
    steps: [
      { title: "Diagnóstico", text: "Entendemos tus procesos, números y dolores antes de escribir una línea de código." },
      { title: "Implementación", text: "Desarrollamos por etapas, con entregas cortas y tu equipo involucrado." },
      { title: "Soporte y evolución", text: "Acompañamos, medimos y mejoramos el sistema a medida que tu empresa crece." },
    ],
  },
  about:
    "Somos un estudio de ingeniería de software argentino. Combinamos conocimiento contable y administrativo con desarrollo moderno para que las pymes trabajen con datos ordenados y procesos que fluyen.",
  metrics: [
    { value: "40+", label: "pymes acompañadas" },
    { value: "120k", label: "comprobantes procesados / mes" },
    { value: "-60%", label: "tiempo en tareas manuales" },
    { value: "99.9%", label: "disponibilidad de sistemas" },
  ],
  cta: {
    title: "Contanos qué necesitás",
    text: "Te respondemos en menos de 24 hs hábiles. Sin compromiso.",
  },
};

export type SiteContent = typeof defaultSite;

/** Combina los datos guardados en el panel con los valores por defecto. */
export function mergeContent(saved: unknown): SiteContent {
  const s = (saved && typeof saved === "object" ? saved : {}) as Partial<SiteContent>;
  const d = defaultSite;
  return {
    ...d,
    ...s,
    contact: { ...d.contact, ...(s.contact ?? {}) },
    footer: { ...d.footer, ...(s.footer ?? {}) },
    hero: { ...d.hero, ...(s.hero ?? {}) },
    process: { ...d.process, ...(s.process ?? {}) },
    cta: { ...d.cta, ...(s.cta ?? {}) },
    nav: d.nav,
  };
}

export const whatsappUrl = (site: SiteContent, msg = site.contact.whatsappMessage) =>
  `https://wa.me/${site.contact.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`;
