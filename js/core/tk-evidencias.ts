/** URLs de pantallazos / evidencias InSoft — meta.metricas + bloques image del ticket. */
const R2_PUBLIC = "https://pub-1c290cc606c8478899f5764899278571.r2.dev";

export interface TicketEvidencia {
  url: string;
  label: string;
}

function codigoTkOf(tk: Record<string, unknown>): number | null {
  for (const root of [tk.meta, tk]) {
    if (!root || typeof root !== "object") continue;
    const c = (root as Record<string, unknown>).codigoTk ?? (root as Record<string, unknown>).codigo;
    if (c != null && String(c).trim()) return Number(String(c).replace(/\D/g, ""));
  }
  const id = String(tk.iticket ?? "").replace(/\D/g, "");
  return id ? Number(id) : null;
}

const PATYIA_TK = new Set([
  1429262, 1432903, 1433179, 1433943, 1433968, 1434846, 1435136, 1435328,
  1435713, 1436238, 1436248, 1436259, 1437191,
]);

function normalizeR2Key(key: string, codigo: number | null): string {
  if (!codigo || !PATYIA_TK.has(codigo)) return key;
  return key.replace(/^clientesis\/diligencias\//, "patyia/diligencias/");
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
  const slug = base
    .replace(/\.(png|jpe?g|webp|gif)$/i, "")
    .replace(/^tk\d+-/i, "")
    .replace(/-insoft$/i, "");
  const map: Record<string, string> = {
    solicitud: "Solicitud InSoft",
    cierre: "Cierre / historial InSoft",
    entrega: "Entrega InSoft",
    metricas: "Métricas InSoft",
  };
  if (map[slug]) return map[slug];
  return slug
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function toUrl(entry: string): string {
  const s = entry.trim();
  if (/^https?:\/\//i.test(s)) return s;
  return `${R2_PUBLIC}/${s.replace(/^\//, "")}`;
}

function pushUnique(out: TicketEvidencia[], seen: Set<string>, url: string, label: string) {
  const u = toUrl(url);
  if (seen.has(u)) return;
  seen.add(u);
  out.push({ url: u, label: label || labelFromKey(url) });
}

function fromContentBlocks(tk: Record<string, unknown>): TicketEvidencia[] {
  const raw = tk.content;
  if (!Array.isArray(raw)) return [];
  const out: TicketEvidencia[] = [];
  for (const block of raw) {
    if (!block || typeof block !== "object") continue;
    const kind = String((block as Record<string, unknown>).kind || "").toLowerCase();
    if (kind !== "image" && kind !== "img") continue;
    const p = ((block as Record<string, unknown>).payload || {}) as Record<string, unknown>;
    const url = p.url ?? p.src;
    if (typeof url !== "string" || !url.trim()) continue;
    const lower = url.toLowerCase();
    if (lower.includes("mermaid") || lower.includes("prompts-tool")) continue;
    const caption = typeof p.caption === "string" ? p.caption.replace(/\s*\(TK-\d+\)\.?$/i, "").trim() : "";
    out.push({ url: toUrl(url), label: caption || labelFromKey(url) });
  }
  return out;
}

/** Pantallazos InSoft u otras evidencias (R2 o URL absoluta). Unifica meta.metricas y content.image. */
export function extractTicketEvidencias(tk: Record<string, unknown>): TicketEvidencia[] {
  const doc = docBag(tk);
  const codigo = codigoTkOf(tk);
  const seen = new Set<string>();
  const out: TicketEvidencia[] = [];

  for (const k of ["imagenesR2", "evidenciasR2", "pantallazos", "imagenes"]) {
    const v = doc[k];
    if (!Array.isArray(v)) continue;
    for (const item of v) {
      if (typeof item !== "string" || !item.trim()) continue;
      const key = normalizeR2Key(item, codigo);
      const lower = key.toLowerCase();
      if (lower.includes("mermaid")) continue;
      pushUnique(out, seen, key, labelFromKey(key));
    }
  }

  for (const k of ["solicitudImageUrl", "cierreImageUrl", "entregaImageUrl", "metricasImageUrl"]) {
    const v = doc[k];
    if (typeof v === "string" && v.trim()) pushUnique(out, seen, v, labelFromKey(k));
  }

  for (const ev of fromContentBlocks(tk)) {
    pushUnique(out, seen, ev.url, ev.label);
  }

  return out;
}
