import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { defaultSite, mergeContent } from "@/content/site";

export const getSiteContent = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"];

    if (!url || !key) {
      console.error("CMS público: faltan SUPABASE_URL o SUPABASE_PUBLISHABLE_KEY en el servidor");
      return defaultSite;
    }

    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
            h.delete("Authorization");
          }
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });

    const { data, error } = await client
      .from("site_content")
      .select("data")
      .eq("id", 1)
      .maybeSingle();

    if (error) {
      console.error("CMS público: error consultando site_content:", error.message);
      return defaultSite;
    }

    const content = mergeContent(data?.data);
    console.log("CMS público:", {
      tieneRegistro: !!data,
      telefonoGuardado: (data?.data as { contact?: { phone?: string } } | null)?.contact?.phone ?? null,
      telefonoMostrado: content.contact.phone,
      proyectoSupabase: new URL(url).hostname,
      origen: data ? "Supabase (con valores predeterminados para campos ausentes)" : "defaultSite",
    });

    return content;
  } catch (error) {
    console.error("CMS público: error cargando contenido:", error);
    return defaultSite;
  }
});
