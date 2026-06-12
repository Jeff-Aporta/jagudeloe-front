/** URLs de pantallazos / evidencias InSoft desde meta del ticket. */
const R2_PUBLIC = "https://pub-1c290cc606c8478899f5764899278571.r2.dev";

export interface TicketEvidencia {
  url: string;
  label: string;
}

function docBag(tk: Record<string, unknown>): Record<string, unknown> {
  for (const root of [tk.meta, tk.detallesExtra, tk]) {
    if (!root || typeof root !== "object") continue;
    const metricas = (root as Record<string, unknown>).metricas;
    if (!metricas || typeof metricas !== "object") continue;
    const doc = (metricas as Record<string, unknown>).documentacion;
    if (doc && typeof doc === "object") return doc as Record<string, unknown>;
  }
  return {};
}

function labelFromKey(key: string): string {
  const base = key.split("/").pop() || key;
  return base
    .replace(/\.(png|jpe?g|webp|gif)$/i, "")
    .replace(/^tk\d+-/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function toUrl(entry: string): string {
  const s = entry.trim();
  if (/^https?:\/\//i.test(s)) return s;
  return `${R2_PUBLIC}/${s.replace(/^\//, "")}`;
}

/** Pantallazos InSoft u otras evidencias (R2 o URL absoluta). */
export function extractTicketEvidencias(tk: Record<string, unknown>): TicketEvidencia[] {
  const doc = docBag(tk);
  const raw: unknown[] = [];

  for (const k of ["imagenesR2", "evidenciasR2", "pantallazos", "imagenes"]) {
    const v = doc[k];
    if (Array.isArray(v)) raw.push(...v);
  }

  for (const k of ["solicitudImageUrl", "cierreImageUrl", "entregaImageUrl"]) {
    const v = doc[k];
    if (typeof v === "string" && v.trim()) raw.push(v);
  }

  const seen = new Set<string>();
  const out: TicketEvidencia[] = [];
  for (const item of raw) {
    if (typeof item !== "string" || !item.trim()) continue;
    const lower = item.toLowerCase();
    if (lower.includes("mermaid")) continue;
    const url = toUrl(item);
    if (seen.has(url)) continue;
    seen.add(url);
    out.push({ url, label: labelFromKey(item) });
  }
  return out;
}
