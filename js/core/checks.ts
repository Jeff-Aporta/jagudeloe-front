/** Utilidades checks — sqlexec + tickets (BITACORA_REVISADO). */
import { businessMinutesBetween, extractMetricInput, DEFAULT_SCHEDULE } from "./tk-metrics.ts";
import { ticketTiempoEvidenciasCompletas } from "./tk-evidencias.ts";
import { patchTkDocSeed } from "./tk-doc-seed-patch.ts";

export type DotState = "complete" | "partial" | "warn" | "overdue" | "idle" | "none" | "info";

export const DOT_STATE_LABELS: Record<DotState, string> = {
  complete: "Revisado / ejecutado",
  partial: "Revisión parcial",
  warn: "Más de 7 h hábiles sin cerrar",
  overdue: "Más de 14 h hábiles sin cerrar",
  idle: "Pendiente",
  none: "Sin revisar",
  info: "En progreso",
};

export function dotStateLabel(state: DotState | null | undefined): string {
  if (!state) return DOT_STATE_LABELS.idle;
  return DOT_STATE_LABELS[state] ?? DOT_STATE_LABELS.idle;
}

/** Tooltips del dot en listado / chip de ticket (evidencias + aging). */
export const TICKET_DOT_STATE_LABELS: Partial<Record<DotState, string>> = {
  complete: "Ticket cerrado / documentado",
  idle: "Sin cierre documentado",
  none: "Sin cierre documentado",
  warn: "Diligencia demorada (>7 h hábiles)",
  overdue: "Diligencia muy demorada (>14 h hábiles)",
};

export function ticketDotStateLabel(state: DotState | null | undefined): string {
  if (!state) return TICKET_DOT_STATE_LABELS.idle ?? DOT_STATE_LABELS.idle;
  return TICKET_DOT_STATE_LABELS[state] ?? DOT_STATE_LABELS[state] ?? DOT_STATE_LABELS.idle;
}

export function aggregateDotState(keys: string[], map: Record<string, boolean>): DotState | null {
  const list = keys.filter(Boolean);
  if (!list.length) return null;
  let checked = 0;
  for (const k of list) { if (map[k]) checked += 1; }
  if (checked === list.length) return "complete";
  if (checked === 0) return "none";
  return "partial";
}

export function ticketRevisadoKey(iticket: string): string { return "tickets." + iticket; }

const TK_WARN_HOURS = 7;
const TK_OVERDUE_HOURS = 14;

/** Pendientes conocidas cuando la BD aún no trae meta.metricas.documentacion.tareasPendientes. */
const FALLBACK_PENDING_TASKS: Record<string, string[]> = {
  "TK-1433179": [
    "Completar fase de pruebas con imágenes cliente (X:\\Errores Cp y Aw v4\\VRESTREPO\\imagenes cliente)",
    "Documentar resultados finales de vision_detail y reasoning_effort en diligencia",
    "Registrar cierre formal en InSoft y actualizar fechaCierre en métricas ISA",
  ],
  "TK-1433968": [
    "Revisar dependencias de Prompt objects reutilizables en OpenAI",
    "Evaluar impacto en macro prompts, clasificadores y variables dinámicas",
    "Proponer recomendación técnica (migración a backend/BD con versionado)",
  ],
};

function ticketKey(tk: Record<string, unknown>): string {
  const id = String(tk.iticket || tk.code || tk.id || "").trim().toUpperCase();
  if (!id) return "";
  return id.startsWith("TK-") ? id : `TK-${id}`;
}

function parseRecord(v: unknown): Record<string, unknown> {
  if (!v) return {};
  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v) as unknown;
      return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  }
  return typeof v === "object" ? (v as Record<string, unknown>) : {};
}

function metricDocBag(tk: Record<string, unknown>): Record<string, unknown> {
  for (const raw of [tk.meta, tk.detallesExtra, tk]) {
    const root = parseRecord(raw);
    if (!Object.keys(root).length) continue;
    const metricas = parseRecord(root.metricas);
    if (!Object.keys(metricas).length) continue;
    const doc = parseRecord(metricas.documentacion);
    if (Object.keys(doc).length) return doc;
  }
  return {};
}

function normalizePendingTask(item: unknown): { texto: string; done: boolean } | null {
  if (typeof item === "string") {
    const texto = item.trim();
    return texto ? { texto, done: false } : null;
  }
  if (!item || typeof item !== "object") return null;
  const row = item as Record<string, unknown>;
  const texto = String(row.texto ?? row.text ?? row.label ?? "").trim();
  if (!texto) return null;
  return { texto, done: row.done === true || row.completada === true || row.checked === true };
}

/** Tareas pendientes declaradas en meta.metricas.documentacion.tareasPendientes */
export function extractTicketPendingTasks(tk: Record<string, unknown>): { texto: string; done: boolean }[] {
  const doc = metricDocBag(tk);
  const raw = doc.tareasPendientes;
  if (Array.isArray(raw)) {
    const parsed = raw.map(normalizePendingTask).filter(Boolean) as { texto: string; done: boolean }[];
    if (parsed.length) return parsed;
  }
  const fallback = FALLBACK_PENDING_TASKS[ticketKey(tk)];
  if (!fallback?.length) return [];
  return fallback.map((texto) => ({ texto, done: false }));
}

export function ticketHasPendingTasks(tk: Record<string, unknown>): boolean {
  return extractTicketPendingTasks(tk).some((t) => !t.done);
}

const ESTADO_TO_DOT: Record<string, DotState> = {
  cerrado: "complete",
  abierto: "warn",
  "en-progreso": "info",
  bloqueado: "overdue",
};

/** Aplica parches de seed (métricas, cierre, etc.) antes de evaluar estado visual. */
export function prepareTkForChecks(tk: Record<string, unknown>): Record<string, unknown> {
  return patchTkDocSeed(tk);
}

function cierreEmpresaText(tk: Record<string, unknown>): string {
  const doc = metricDocBag(tk);
  return String(doc.cierreEmpresa ?? "").toLowerCase();
}

/** Ticket con cierre documentado — solo con pantallazos InSoft de apertura, atención y cierre en R2. */
export function ticketIsCerradoDocumentado(tk: Record<string, unknown>): boolean {
  return ticketTiempoEvidenciasCompletas(tk);
}

/** Estado InSoft normalizado (listado puede venir sin tk.estado). */
export function resolveTicketEstado(tk: Record<string, unknown>): string {
  const direct = String(tk.estado || tk.ESTADO || "").toLowerCase().trim();
  if (direct) return direct;

  const norm = parseRecord(tk.normativa);
  for (const v of [norm.cierre, norm.cierreEmpresa, norm.estadoSolicitud]) {
    const s = String(v || "").toLowerCase();
    if (s.includes("cerrado") || s.includes("solucionado")) return "cerrado";
    if (s.includes("abierto") || s.includes("sin cerrar")) return "abierto";
  }

  const cierreEmp = cierreEmpresaText(tk);
  if (cierreEmp.includes("cerrado") || cierreEmp.includes("solucionado")) return "cerrado";
  if (cierreEmp.includes("abierto")) return "abierto";

  if (tk.fechaEntrega || tk.FECHAENTREGA) return "cerrado";

  const input = extractMetricInput(tk);
  if (input.fechaCierre) return "cerrado";

  return "";
}

/** Dot por estado del ticket — misma semántica que el chip del detalle. */
export function ticketEstadoDotState(tk: Record<string, unknown>): DotState {
  const bag = prepareTkForChecks(tk);
  if (ticketIsCerradoDocumentado(bag)) return "complete";
  const estado = resolveTicketEstado(bag);
  if (estado && ESTADO_TO_DOT[estado]) return ESTADO_TO_DOT[estado];
  if (ticketHasPendingTasks(bag)) return "warn";
  return "idle";
}

/** Dot en listado TK: verde con cierre documentado; gris sin él; rojo/naranja si la diligencia abierta se demora. */
export function ticketListDotState(
  tk: Record<string, unknown>,
  _revisadoMap?: Record<string, boolean>,
  _revisadoKey?: string,
): DotState | null {
  const bag = prepareTkForChecks(tk);
  if (ticketIsCerradoDocumentado(bag)) return "complete";

  const input = extractMetricInput(bag);
  const closed =
    resolveTicketEstado(bag) === "cerrado" ||
    !!input.fechaCierre ||
    !!(bag.fechaEntrega || bag.FECHAENTREGA);

  if (!closed) {
    const cre = input.fechaCreacion;
    if (cre) {
      const mins = businessMinutesBetween(cre, new Date().toISOString(), input, DEFAULT_SCHEDULE);
      if (mins != null) {
        const hours = mins / 60;
        if (hours > TK_OVERDUE_HOURS) return "overdue";
        if (hours > TK_WARN_HOURS) return "warn";
      }
    }
  }

  return "idle";
}

export function collectSqlCheckKeys(
  nodes: { type?: string; segmentId?: string; checkKey?: string; children?: unknown[] }[] | undefined,
  segments: Record<string, { checkKey?: string; revisadoKey?: string }>,
): string[] {
  const out: string[] = [];
  for (const n of nodes || []) {
    if (!n) continue;
    if (n.type === "sql") {
      const seg = segments[n.segmentId || ""] || {};
      const key = n.checkKey || seg.checkKey || seg.revisadoKey;
      if (key) out.push(String(key));
    }
    if (Array.isArray(n.children) && n.children.length) out.push(...collectSqlCheckKeys(n.children as typeof nodes, segments));
  }
  return out;
}
