/** URLs de pantallazos / evidencias InSoft — meta.metricas + bloques image del ticket. */
const R2_PUBLIC = "https://pub-1c290cc606c8478899f5764899278571.r2.dev";

export interface TicketEvidencia {
  url: string;
  label: string;
}

/** Claves R2 confirmadas en bucket (sync BD) o legacy con flag explícito. */
function uploadedEvidenciaKeys(doc: Record<string, unknown>): string[] {
  const subidas = doc.imagenesR2Subidas;
  if (Array.isArray(subidas)) {
    return subidas.filter((x): x is string => typeof x === "string" && !!x.trim());
  }
  if (doc.evidenciasSubidas === true) {
    const raw = doc.imagenesR2 ?? doc.evidenciasR2 ?? doc.pantallazos ?? doc.imagenes;
    if (Array.isArray(raw)) {
      return raw.filter((x): x is string => typeof x === "string" && !!x.trim());
    }
  }
  return [];
}

export function ticketEvidenciasSubidas(tk: Record<string, unknown>): boolean {
  const doc = docBag(tk);
  if (doc.evidenciasSubidas === false) return false;
  return uploadedEvidenciaKeys(doc).length > 0;
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
    atencion: "Atención InSoft",
  };
  if (map[slug]) return map[slug];
  return slug
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Captura compartida desfase empresa — permanece en diligencia, no en métricas InSoft. */
export function isReporteEmpresaDesfaseUrl(url: string): boolean {
  const u = String(url || "").toLowerCase();
  return u.includes("reporte-empresa-detalle-tiquetes-asignados");
}

function normalizeEvidenciaLabel(raw: string): string {
  return String(raw || "").replace(/\s*\(TK-\d+\)\.?$/i, "").trim();
}

const INSOFT_METRICAS_URL_RE =
  /tk\d+-(solicitud|cierre|entrega|metricas|atencion)-insoft\.(png|jpe?g|webp|gif)/i;

const INSOFT_METRICAS_LABELS = new Set([
  "Solicitud InSoft",
  "Cierre / historial InSoft",
  "Entrega InSoft",
  "Métricas InSoft",
  "Atención InSoft",
]);

const INSOFT_METRICAS_CAPTION_RE =
  /^(Solicitud registrada|Cierre documentado|Entrega documentada|Métricas registradas)(\s+en\s+InSoft)?/i;

const INSOFT_METRICAS_LABEL_PREFIX_RE = /^(Solicitud|Cierre|Entrega|Métricas|Atención)\s+InSoft\b/i;

const INSOFT_METRICAS_PANTALLAZO_RE = /^Pantallazo\s+(solicitud|cierre|entrega|métricas|atención)\b/i;

/** InSoft TK-… con solicitud, atención, cierre o entrega en el pie de foto. */
const INSOFT_METRICAS_TK_CAPTION_RE =
  /^InSoft\s+TK-\d+.*\b(solicitud|inicio de atención|atención|cierre|entrega|métricas)\b/i;

/** Pantallazo InSoft de apertura/atención/cierre/entrega/métricas — solo vista métricas. */
export function isMetricasInsoftEvidencia(ev: TicketEvidencia): boolean {
  if (isReporteEmpresaDesfaseUrl(ev.url)) return false;

  const label = normalizeEvidenciaLabel(ev.label);
  if (INSOFT_METRICAS_LABELS.has(label)) return true;
  if (INSOFT_METRICAS_CAPTION_RE.test(label)) return true;
  if (INSOFT_METRICAS_LABEL_PREFIX_RE.test(label)) return true;
  if (INSOFT_METRICAS_PANTALLAZO_RE.test(label)) return true;
  if (INSOFT_METRICAS_TK_CAPTION_RE.test(label)) return true;

  const u = ev.url.toLowerCase();
  return INSOFT_METRICAS_URL_RE.test(u);
}

/** Bloque content.image de apertura/atención/cierre InSoft — excluir de vista diligencia. */
export function isInsoftMetricasImageBlock(block: unknown): boolean {
  if (!block || typeof block !== "object") return false;
  const kind = String((block as Record<string, unknown>).kind || "").toLowerCase();
  if (kind !== "image" && kind !== "img") return false;
  const p = ((block as Record<string, unknown>).payload || {}) as Record<string, unknown>;
  const url = String(p.url ?? p.src ?? "").trim();
  if (url && isReporteEmpresaDesfaseUrl(url)) return false;
  const caption = String(p.caption ?? "").trim();
  const alt = String(p.alt ?? "").trim();
  return isMetricasInsoftEvidencia({ url: url ? toUrl(url) : "", label: caption || alt });
}

/** Quita pantallazos InSoft del contenido mostrado en diligencia (raíz y contextos). */
export function filterDocViewContentBlocks<T>(blocks: T[]): T[] {
  return blocks.filter((b) => !isInsoftMetricasImageBlock(b));
}

function insoftEvidenciasFromContent(tk: Record<string, unknown>): TicketEvidencia[] {
  const seen = new Set<string>();
  const out: TicketEvidencia[] = [];

  const scan = (raw: unknown) => {
    if (!Array.isArray(raw)) return;
    for (const block of raw) {
      if (!isInsoftMetricasImageBlock(block)) continue;
      const p = ((block as Record<string, unknown>).payload || {}) as Record<string, unknown>;
      const url = String(p.url ?? p.src ?? "").trim();
      if (!url) continue;
      const caption = String(p.caption ?? "").trim();
      const alt = String(p.alt ?? "").trim();
      const label = normalizeEvidenciaLabel(caption || alt) || labelFromKey(url);
      pushUnique(out, seen, url, label);
    }
  };

  scan(tk.content);
  for (const ctx of (tk.contexts as Record<string, unknown>[]) || []) {
    scan(ctx.content);
  }
  return out;
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

/** Claves R2 candidatas para métricas (subidas o planeadas en meta). */
function metricasEvidenciaKeys(doc: Record<string, unknown>): string[] {
  const uploaded = uploadedEvidenciaKeys(doc);
  if (uploaded.length) return uploaded;
  const raw = doc.imagenesR2 ?? doc.imagenesR2Pendientes ?? doc.evidenciasR2 ?? doc.pantallazos;
  if (Array.isArray(raw)) {
    return raw.filter((x): x is string => typeof x === "string" && !!x.trim());
  }
  return [];
}

function extractMetricasFromMeta(tk: Record<string, unknown>): TicketEvidencia[] {
  const doc = docBag(tk);
  const codigo = codigoTkOf(tk);
  const seen = new Set<string>();
  const out: TicketEvidencia[] = [];

  for (const item of metricasEvidenciaKeys(doc)) {
    const key = normalizeR2Key(item, codigo);
    if (key.toLowerCase().includes("mermaid")) continue;
    pushUnique(out, seen, key, labelFromKey(key));
  }

  for (const k of ["solicitudImageUrl", "cierreImageUrl", "entregaImageUrl", "metricasImageUrl"]) {
    const v = doc[k];
    if (typeof v === "string" && v.trim()) pushUnique(out, seen, v, labelFromKey(k));
  }

  return out;
}

/** Pantallazos InSoft (apertura, atención, cierre, entrega, métricas) — vista métricas únicamente. */
export function extractTicketMetricasEvidencias(tk: Record<string, unknown>): TicketEvidencia[] {
  const seen = new Set<string>();
  const out: TicketEvidencia[] = [];
  for (const ev of [...extractMetricasFromMeta(tk), ...insoftEvidenciasFromContent(tk)]) {
    pushUnique(out, seen, ev.url, ev.label);
  }
  return out;
}

/** Evidencias de diligencia (content.image, reuniones, hitos) — sin apertura/cierre InSoft. */
export function extractTicketDocEvidencias(tk: Record<string, unknown>): TicketEvidencia[] {
  const seen = new Set<string>();
  const out: TicketEvidencia[] = [];
  for (const ev of fromContentBlocks(tk)) {
    if (isMetricasInsoftEvidencia(ev)) continue;
    pushUnique(out, seen, ev.url, ev.label);
  }
  return out;
}

/** Todas las evidencias (métricas + diligencia). */
export function extractTicketEvidencias(tk: Record<string, unknown>): TicketEvidencia[] {
  const seen = new Set<string>();
  const out: TicketEvidencia[] = [];
  for (const ev of [...extractMetricasFromMeta(tk), ...extractTicketDocEvidencias(tk)]) {
    pushUnique(out, seen, ev.url, ev.label);
  }
  return out;
}

/** Hay al menos un pantallazo subido y verificado en R2 (meta.metricas.documentacion). */
export function ticketHasEvidencias(tk: Record<string, unknown>): boolean {
  return ticketEvidenciasSubidas(tk);
}
