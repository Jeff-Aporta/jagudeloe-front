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
  1435713, 1436238, 1436248, 1436259, 1437191, 1439155,
]);

/** Roles R2 de trazabilidad temporal InSoft (vista métricas). */
const TIEMPO_EVIDENCIA_ROLES = new Set(["solicitud", "atencion", "cierre", "entrega", "metricas"]);

/** Roles R2 de diligencia técnica (panel Evidencias del doc). */
const PROCESO_EVIDENCIA_ROLES = new Set([
  "bd", "prompts", "chat", "trazabilidad", "prueba", "pruebas", "problema", "test", "qa", "diagrama",
]);

const INSOFT_ROL_FROM_KEY_RE = /^tk\d+-([a-z]+)-insoft\.(png|jpe?g|webp|gif)$/i;

function insoftRolFromKey(key: string): string | null {
  const base = String(key ?? "").trim().split("/").pop() || "";
  const m = INSOFT_ROL_FROM_KEY_RE.exec(base);
  return m ? m[1].toLowerCase() : null;
}

function tiempoRolFromKey(key: string): string | null {
  const rol = insoftRolFromKey(key);
  return rol && TIEMPO_EVIDENCIA_ROLES.has(rol) ? rol : null;
}

function procesoRolFromKey(key: string): string | null {
  const rol = insoftRolFromKey(key);
  return rol && PROCESO_EVIDENCIA_ROLES.has(rol) ? rol : null;
}

function isTiempoEvidenciaKey(key: string): boolean {
  return tiempoRolFromKey(key) != null;
}

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
    bd: "BD / configuración",
    prompts: "Pantalla Prompts",
    chat: "Chat / conversación",
    trazabilidad: "Trazabilidad OpenAI",
    prueba: "Prueba",
    pruebas: "Pruebas",
    problema: "Evidencia del problema",
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

/** URL canónica para deduplicar content.image vs claves R2 en meta. */
export function canonicalEvidenciaUrl(url: string): string {
  const u = toUrl(String(url ?? "").trim());
  try {
    const parsed = new URL(u);
    return `${parsed.origin}${parsed.pathname}`.toLowerCase();
  } catch {
    return u.toLowerCase().split("?")[0].split("#")[0];
  }
}

/** Pantallazo R2 de proceso técnico (bd, prompts, chat, trazabilidad, …). */
export function isProcesoEvidenciaUrl(url: string): boolean {
  if (isReporteEmpresaDesfaseUrl(url)) return false;
  const rol = procesoRolFromKey(url);
  if (rol) return true;
  return /tk\d+-(bd|prompts|chat|trazabilidad|prueba|pruebas|problema)-insoft\./i.test(url);
}

function pushUnique(out: TicketEvidencia[], seen: Set<string>, url: string, label: string) {
  const u = toUrl(url);
  const canon = canonicalEvidenciaUrl(u);
  if (seen.has(canon)) return;
  seen.add(canon);
  out.push({ url: u, label: label || labelFromKey(url) });
}

function collectImageBlocksFromContent(raw: unknown, out: TicketEvidencia[], seen: Set<string>) {
  if (!Array.isArray(raw)) return;
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
    const alt = typeof p.alt === "string" ? p.alt.replace(/\s*\(TK-\d+\)\.?$/i, "").trim() : "";
    pushUnique(out, seen, url, caption || alt || labelFromKey(url));
  }
}

function fromAllContentBlocks(tk: Record<string, unknown>): TicketEvidencia[] {
  const seen = new Set<string>();
  const out: TicketEvidencia[] = [];
  collectImageBlocksFromContent(tk.content, out, seen);
  for (const ctx of (tk.contexts as Record<string, unknown>[]) || []) {
    collectImageBlocksFromContent(ctx.content, out, seen);
  }
  return out;
}

/** Bloque content.image que debe mostrarse solo en el panel Evidencias (no inline). */
export function isDocEvidenciaImageBlock(block: unknown): boolean {
  if (!block || typeof block !== "object") return false;
  const kind = String((block as Record<string, unknown>).kind || "").toLowerCase();
  if (kind !== "image" && kind !== "img") return false;
  const p = ((block as Record<string, unknown>).payload || {}) as Record<string, unknown>;
  const url = String(p.url ?? p.src ?? "").trim();
  if (!url) return false;
  const lower = url.toLowerCase();
  if (lower.includes("mermaid") || lower.includes("prompts-tool")) return false;
  if (isReporteEmpresaDesfaseUrl(url)) return false;
  const caption = String(p.caption ?? p.alt ?? "").trim();
  const ev = { url: toUrl(url), label: caption };
  if (isMetricasInsoftEvidencia(ev)) return false;
  if (isProcesoEvidenciaUrl(url)) return true;
  return true;
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
    if (!isTiempoEvidenciaKey(key)) continue;
    pushUnique(out, seen, key, labelFromKey(key));
  }

  for (const k of ["solicitudImageUrl", "cierreImageUrl", "entregaImageUrl", "metricasImageUrl"]) {
    const v = doc[k];
    if (typeof v === "string" && v.trim()) {
      const ev = { url: toUrl(v), label: labelFromKey(k) };
      if (isMetricasInsoftEvidencia(ev)) pushUnique(out, seen, v, labelFromKey(k));
    }
  }

  return out;
}

function extractProcesoFromMeta(tk: Record<string, unknown>): TicketEvidencia[] {
  const doc = docBag(tk);
  const codigo = codigoTkOf(tk);
  const seen = new Set<string>();
  const out: TicketEvidencia[] = [];

  for (const item of metricasEvidenciaKeys(doc)) {
    const key = normalizeR2Key(item, codigo);
    if (key.toLowerCase().includes("mermaid")) continue;
    if (isTiempoEvidenciaKey(key)) continue;
    const ev = { url: toUrl(key), label: labelFromKey(key) };
    if (isMetricasInsoftEvidencia(ev)) continue;
    pushUnique(out, seen, key, labelFromKey(key));
  }

  return out;
}

/** Pantallazos InSoft de tiempo (apertura, atención, cierre, entrega, métricas) — solo vista métricas. */
export function extractTicketMetricasEvidencias(tk: Record<string, unknown>): TicketEvidencia[] {
  const seen = new Set<string>();
  const out: TicketEvidencia[] = [];
  for (const ev of [...extractMetricasFromMeta(tk), ...insoftEvidenciasFromContent(tk)]) {
    if (!isMetricasInsoftEvidencia(ev)) continue;
    pushUnique(out, seen, ev.url, ev.label);
  }
  return out;
}

/** Evita duplicar pantallazos: el panel Evidencias ya lista content.image de diligencia. */
export function filterInlineImagesForDocEvidenciasPanel<T>(
  blocks: T[],
  _docEvidencias?: TicketEvidencia[],
): T[] {
  return blocks.filter((b) => !isDocEvidenciaImageBlock(b));
}

/** Evidencias de diligencia (problema, proceso, pruebas) — sin pantallazos de tiempo InSoft. */
export function extractTicketDocEvidencias(tk: Record<string, unknown>): TicketEvidencia[] {
  const seen = new Set<string>();
  const out: TicketEvidencia[] = [];
  for (const ev of [...fromAllContentBlocks(tk), ...extractProcesoFromMeta(tk)]) {
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

const CIERRE_EVIDENCIA_KEY_RE = /-cierre-insoft\.(png|jpe?g|webp|gif)$/i;

function isCierreEvidenciaKey(key: string): boolean {
  const k = String(key ?? "").trim().toLowerCase();
  if (!k) return false;
  return CIERRE_EVIDENCIA_KEY_RE.test(k.split("/").pop() || k);
}

/** Pantallazo de cierre / solución en R2 (meta.metricas.documentacion). */
export function ticketHasCierreEvidencia(tk: Record<string, unknown>): boolean {
  const doc = docBag(tk);
  const cierreUrl = doc.cierreImageUrl;
  if (typeof cierreUrl === "string" && cierreUrl.trim()) return true;
  return uploadedEvidenciaKeys(doc).some(isCierreEvidenciaKey);
}

/** Hay al menos un pantallazo subido y verificado en R2 (meta.metricas.documentacion). */
export function ticketHasEvidencias(tk: Record<string, unknown>): boolean {
  return ticketEvidenciasSubidas(tk);
}
