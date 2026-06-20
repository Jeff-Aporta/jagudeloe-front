/** URLs de pantallazos / evidencias InSoft — meta.metricas + bloques image del ticket. */
import {
  catalogEvidenciasTiempo,
  catalogEvidenciasTiempoFromKeys,
  formatEvidenciaHitos,
  hitosForTiempoRol,
  tiempoRolFromR2Key,
  type EvidenciaTiempo,
  type TiempoHito,
} from "./tk-evidencias-tiempo-hitos.ts";

const R2_PUBLIC = "https://pub-1c290cc606c8478899f5764899278571.r2.dev";

export type { TiempoHito, EvidenciaTiempo };

export interface TicketEvidencia {
  url: string;
  label: string;
  hitos?: TiempoHito[];
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
  1435713, 1436238, 1436248, 1436259, 1437191, 1439155, 1439822,
]);

/** Roles R2 de trazabilidad temporal InSoft (vista métricas). */
const TIEMPO_EVIDENCIA_ROLES = new Set(["solicitud", "atencion", "cierre", "entrega", "metricas"]);

/** Roles R2 de diligencia técnica (panel Evidencias del doc). */
const PROCESO_EVIDENCIA_ROLES = new Set([
  "bd", "prompts", "chat", "trazabilidad", "prueba", "pruebas", "problema", "test", "qa", "diagrama",
]);

/** Pantallazos de validación post-fix — solo carril Solución aplicada (no panel Evidencias). */
const SOLUCION_EVIDENCIA_ROLES = new Set(["chatfix", "promptsfix", "solucionfix", "postfix"]);

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

function solucionRolFromKey(key: string): string | null {
  const rol = insoftRolFromKey(key);
  return rol && SOLUCION_EVIDENCIA_ROLES.has(rol) ? rol : null;
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
    chatfix: "Prueba post-fix — chat",
    promptsfix: "Prueba post-fix — prompts",
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

/** Pantallazo R2 de validación post-fix — inline en Solución aplicada. */
export function isSolucionEvidenciaUrl(url: string): boolean {
  if (isReporteEmpresaDesfaseUrl(url)) return false;
  if (solucionRolFromKey(url)) return true;
  return /tk\d+-(chatfix|promptsfix|solucionfix|postfix)-insoft\./i.test(String(url ?? ""));
}

function isSolucionEvidenciaPayload(p: Record<string, unknown>, url: string): boolean {
  const lane = String(p.docLane ?? p.evidenceLane ?? p.lane ?? "").trim().toLowerCase();
  if (lane === "solucion" || lane === "solución") return true;
  return isSolucionEvidenciaUrl(url);
}

/** Pantallazo R2 de proceso técnico (bd, prompts, chat, trazabilidad, …). */
export function isProcesoEvidenciaUrl(url: string): boolean {
  if (isReporteEmpresaDesfaseUrl(url)) return false;
  if (isSolucionEvidenciaUrl(url)) return false;
  const rol = procesoRolFromKey(url);
  if (rol) return true;
  return /tk\d+-(bd|prompts|chat|trazabilidad|prueba|pruebas|problema)-insoft\./i.test(url);
}

function pushUnique(
  out: TicketEvidencia[],
  seen: Set<string>,
  url: string,
  label: string,
  hitos?: TiempoHito[],
) {
  const u = toUrl(url);
  const canon = canonicalEvidenciaUrl(u);
  if (seen.has(canon)) return;
  seen.add(canon);
  const base = label || labelFromKey(url);
  out.push({ url: u, label: base, hitos });
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
    if (isSolucionEvidenciaPayload(p, url)) continue;
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
    if (isSolucionEvidenciaPayload(p, url)) return false;
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

function parseEvidenciasTiempoDoc(raw: unknown): EvidenciaTiempo[] {
  if (!Array.isArray(raw)) return [];
  const out: EvidenciaTiempo[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const key = String(row.key ?? "").trim();
    const hitosRaw = row.hitos;
    if (!key || !Array.isArray(hitosRaw)) continue;
    const hitos = hitosRaw.filter(
      (h): h is TiempoHito => h === "apertura" || h === "atencion" || h === "cierre",
    );
    if (!hitos.length) continue;
    out.push({
      key,
      rol: typeof row.rol === "string" ? row.rol : undefined,
      hitos,
      label: typeof row.label === "string" ? row.label : undefined,
    });
  }
  return out;
}

function resolveEvidenciasTiempo(tk: Record<string, unknown>): EvidenciaTiempo[] {
  const doc = docBag(tk);
  const explicit = parseEvidenciasTiempoDoc(doc.evidenciasTiempo);
  if (explicit.length) return explicit;
  const codigo = codigoTkOf(tk);
  if (!codigo) return [];
  const fromCatalog = catalogEvidenciasTiempo(codigo);
  if (fromCatalog.length) return fromCatalog;
  const keys = [
    ...metricasEvidenciaKeys(doc),
    ...uploadedEvidenciaKeys(doc),
  ];
  return catalogEvidenciasTiempoFromKeys(codigo, keys);
}

function hitosMapForTicket(tk: Record<string, unknown>): Map<string, TiempoHito[]> {
  const codigo = codigoTkOf(tk);
  const map = new Map<string, TiempoHito[]>();
  for (const ev of resolveEvidenciasTiempo(tk)) {
    const key = normalizeR2Key(ev.key, codigo).toLowerCase();
    map.set(key, ev.hitos);
  }
  return map;
}

function hitosForKey(tk: Record<string, unknown>, key: string): TiempoHito[] {
  const codigo = codigoTkOf(tk);
  const norm = normalizeR2Key(key, codigo).toLowerCase();
  const fromMap = hitosMapForTicket(tk).get(norm);
  if (fromMap?.length) return fromMap;
  const rol = tiempoRolFromR2Key(norm) ?? tiempoRolFromKey(norm);
  if (rol && codigo) return hitosForTiempoRol(codigo, rol);
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
    const hitos = hitosForKey(tk, key);
    pushUnique(out, seen, key, labelFromKey(key), hitos);
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
    if (solucionRolFromKey(key)) continue;
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
    const hitos = hitosForKey(tk, ev.url);
    pushUnique(out, seen, ev.url, ev.label, hitos.length ? hitos : ev.hitos);
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
    if (isSolucionEvidenciaUrl(ev.url)) continue;
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

export function uploadedTiempoEvidenciaRoles(tk: Record<string, unknown>): Set<string> {
  const doc = docBag(tk);
  const codigo = codigoTkOf(tk);
  const roles = new Set<string>();
  for (const key of uploadedEvidenciaKeys(doc)) {
    const rol = tiempoRolFromKey(normalizeR2Key(key, codigo));
    if (rol) roles.add(rol);
  }
  return roles;
}

function uploadedTiempoEvidenciaHitos(tk: Record<string, unknown>): Set<TiempoHito> {
  const doc = docBag(tk);
  const codigo = codigoTkOf(tk);
  const subidas = new Set(
    uploadedEvidenciaKeys(doc).map((k) => normalizeR2Key(k, codigo).toLowerCase()),
  );
  const hitos = new Set<TiempoHito>();
  for (const ev of resolveEvidenciasTiempo(tk)) {
    const key = normalizeR2Key(ev.key, codigo).toLowerCase();
    if (!subidas.has(key)) continue;
    for (const h of ev.hitos) hitos.add(h);
  }
  return hitos;
}

function legacyTiempoEvidenciaCoverage(tk: Record<string, unknown>): {
  apertura: boolean;
  atencion: boolean;
  cierre: boolean;
} {
  const roles = uploadedTiempoEvidenciaRoles(tk);
  const hasMetricas = roles.has("metricas");
  return {
    apertura: roles.has("solicitud"),
    atencion: roles.has("atencion") || hasMetricas,
    cierre: roles.has("cierre") || roles.has("entrega") || hasMetricas,
  };
}

export function tiempoEvidenciaCoverage(tk: Record<string, unknown>): {
  apertura: boolean;
  atencion: boolean;
  cierre: boolean;
} {
  const hitos = uploadedTiempoEvidenciaHitos(tk);
  if (hitos.size > 0) {
    return {
      apertura: hitos.has("apertura"),
      atencion: hitos.has("atencion"),
      cierre: hitos.has("cierre"),
    };
  }
  return legacyTiempoEvidenciaCoverage(tk);
}

/** Métricas de tiempo documentadas: trío apertura / atención / cierre en evidencias subidas. */
export function ticketTiempoEvidenciasCompletas(tk: Record<string, unknown>): boolean {
  const c = tiempoEvidenciaCoverage(tk);
  return c.apertura && c.atencion && c.cierre;
}

const TIEMPO_EVIDENCIA_MISSING_LABELS: Record<TiempoHito, string> = {
  apertura: "apertura (evidencia InSoft)",
  atencion: "atención (evidencia InSoft)",
  cierre: "cierre (evidencia InSoft)",
};

export { formatEvidenciaHitos, resolveEvidenciasTiempo };

/** Etiquetas humanas de pantallazos de tiempo que faltan en R2. */
export function missingTiempoEvidenciaLabels(tk: Record<string, unknown>): string[] {
  const c = tiempoEvidenciaCoverage(tk);
  return (Object.keys(TIEMPO_EVIDENCIA_MISSING_LABELS) as Array<keyof typeof TIEMPO_EVIDENCIA_MISSING_LABELS>)
    .filter((k) => !c[k])
    .map((k) => TIEMPO_EVIDENCIA_MISSING_LABELS[k]);
}

function isCierreEvidenciaKey(key: string): boolean {
  const k = String(key ?? "").trim().toLowerCase();
  if (!k) return false;
  return CIERRE_EVIDENCIA_KEY_RE.test(k.split("/").pop() || k);
}

/** Pantallazo de cierre / solución en R2 (meta.metricas.documentacion). */
export function ticketHasCierreEvidencia(tk: Record<string, unknown>): boolean {
  return tiempoEvidenciaCoverage(tk).cierre;
}

/** Hay al menos un pantallazo subido y verificado en R2 (meta.metricas.documentacion). */
export function ticketHasEvidencias(tk: Record<string, unknown>): boolean {
  return ticketEvidenciasSubidas(tk);
}
