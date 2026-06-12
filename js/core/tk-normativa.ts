/**
 * Normativa InSoft — tipo de solicitud de apertura para filtros y cruce con métricas empresa.
 */

function docFromTicket(tk: Record<string, unknown>): Record<string, unknown> {
  for (const root of [tk.normativa, tk.meta, tk.detallesExtra, tk]) {
    if (!root || typeof root !== "object") continue;
    const bag = root as Record<string, unknown>;
    if (bag.tipoSolicitudApertura || bag.tipoSolicitud) return bag;
    const metricas = (bag.metricas || {}) as Record<string, unknown>;
    const doc = (metricas.documentacion || {}) as Record<string, unknown>;
    if (doc.tipoSolicitudApertura) return doc;
  }
  return {};
}

/** Valor canónico InSoft: «1 - PQR Error del sistema», «1 - ING Servicios Otros», etc. */
export function extractTipoSolicitudApertura(tk: Record<string, unknown>): string | null {
  const norm = (tk.normativa || {}) as Record<string, unknown>;
  if (norm.tipoSolicitudApertura) return String(norm.tipoSolicitudApertura).trim() || null;
  if (norm.tipoSolicitud) return String(norm.tipoSolicitud).trim() || null;

  const doc = docFromTicket(tk);
  if (doc.tipoSolicitudApertura) return String(doc.tipoSolicitudApertura).trim() || null;

  return null;
}

/** Quita prefijo numérico InSoft («1 - …») y aclaraciones entre paréntesis. */
function stripTipoSolicitudDisplay(full: string): string {
  let s = String(full).trim();
  const m = /^\d+\s*-\s*(.+)$/.exec(s);
  if (m) s = m[1].trim();
  return s.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();
}

/** Tipos de apertura incluidos en el reporte general empresa vs hábil. */
export const TIPOS_APERTURA_COMPARATIVO = [
  "PQR proyecto",
  "PQR Error del sistema",
  "Requerimiento técnico",
] as const;

export function normalizeTipoSolicitudApertura(full: string | null | undefined): string {
  if (!full) return "";
  return stripTipoSolicitudDisplay(String(full)).toLowerCase();
}

/** Solo proyecto, error del sistema y requerimiento técnico (InSoft «1 - …»). */
export function isTipoAperturaComparativo(tipo: string | null | undefined): boolean {
  const n = normalizeTipoSolicitudApertura(tipo);
  if (!n) return false;
  return TIPOS_APERTURA_COMPARATIVO.some((t) => n.startsWith(t.toLowerCase()));
}

export function isTicketTipoComparativo(tk: Record<string, unknown>): boolean {
  return isTipoAperturaComparativo(extractTipoSolicitudApertura(tk));
}

/** Abreviaturas conocidas para chips en sidebar (texto completo queda en tooltip / detalle). */
const TIPO_CHIP_ABBR: Array<[string, string]> = [
  ["PQR proyecto", "PQR Proy."],
  ["PQR Error del sistema", "PQR Error"],
  ["ING Servicios Otros", "ING Otros"],
  ["Requerimiento técnico", "Req. téc."],
];

/** Etiqueta corta para chips (sin prefijo «1 - » ni paréntesis largos). */
export function tipoSolicitudChipLabel(full: string | null | undefined): string {
  if (!full) return "Sin tipo";
  const s = stripTipoSolicitudDisplay(String(full));
  const lower = s.toLowerCase();
  for (const [prefix, abbr] of TIPO_CHIP_ABBR) {
    if (lower.startsWith(prefix.toLowerCase())) return abbr;
  }
  if (s.length <= 18) return s;
  const words = s.split(/\s+/);
  if (words.length >= 2 && words[0].length <= 4) {
    const second = words[1].length > 4 ? `${words[1].slice(0, 4)}.` : words[1];
    return `${words[0]} ${second}`;
  }
  return `${s.slice(0, 16)}…`;
}
