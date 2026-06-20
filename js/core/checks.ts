/** Utilidades checks — sqlexec + tickets (BITACORA_REVISADO). */
import { businessMinutesBetween, extractMetricInput, DEFAULT_SCHEDULE, parseTicketDate } from "./tk-metrics.ts";
import { ticketTiempoEvidenciasCompletas, tiempoEvidenciaCoverage } from "./tk-evidencias.ts";
import { patchTkDocSeed } from "./tk-doc-seed-patch.ts";

export type DotState = "complete" | "partial" | "warn" | "overdue" | "magenta" | "idle" | "none" | "info";

export const DOT_STATE_LABELS: Record<DotState, string> = {
  complete: "Revisado / ejecutado",
  partial: "Revisión parcial",
  warn: "Más de 4 h hábiles sin atender",
  overdue: "Más de 10 h hábiles sin solución",
  magenta: "Más de 4 h hábiles sin atender",
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
  complete: "Evidencias de apertura, atención y cierre",
  idle: "Sin atención registrada (dentro de plazo)",
  none: "Sin atención registrada",
  magenta: "Sin atender (>4 h hábiles)",
  overdue: "Sin solución (>10 h hábiles)",
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

const TK_ATTEND_HOURS = 4;
const TK_SOLVE_HOURS = 10;

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

function ticketWasAttended(tk: Record<string, unknown>, input: ReturnType<typeof extractMetricInput>): boolean {
  if (input.horaInicioAtencion) return true;
  return tiempoEvidenciaCoverage(tk).atencion;
}

function metricFechaCierre(tk: Record<string, unknown>): string | null {
  for (const raw of [tk.detallesExtra, tk.meta, tk]) {
    const root = parseRecord(raw);
    const metricas = parseRecord(root.metricas);
    if (!Object.keys(metricas).length) continue;
    const cierre = parseTicketDate(
      metricas.fechaCierre || metricas.fechaSolucion || metricas.horaCierre || metricas.cierre,
    );
    if (cierre) return cierre;
  }
  return null;
}

/** Solución documentada o cierre InSoft — entrega parcial no cuenta como solución. */
function ticketIsSolvedForDot(tk: Record<string, unknown>, _input: ReturnType<typeof extractMetricInput>): boolean {
  if (ticketTiempoEvidenciasCompletas(tk)) return true;
  if (metricFechaCierre(tk)) return true;

  const cierreEmp = cierreEmpresaText(tk);
  if (/cerrado|solucionado/.test(cierreEmp)) return true;

  const norm = parseRecord(tk.normativa);
  for (const v of [norm.cierre, norm.cierreEmpresa, norm.estadoSolicitud]) {
    const s = String(v || "").toLowerCase();
    if (s.includes("cerrado") || s.includes("solucionado")) return true;
  }

  const direct = String(tk.estado || tk.ESTADO || "").toLowerCase().trim();
  if (direct === "cerrado" || direct.includes("solucionado")) return true;

  return false;
}

function businessHoursSinceCreation(
  tk: Record<string, unknown>,
  input: ReturnType<typeof extractMetricInput>,
): number | null {
  const cre = input.fechaCreacion;
  if (!cre) return null;
  const mins = businessMinutesBetween(cre, new Date().toISOString(), input, DEFAULT_SCHEDULE);
  return mins == null ? null : mins / 60;
}

/** Dot en listado TK: verde con evidencias; gris pendiente; magenta sin atender; rojo sin solución demorada. */
export function ticketListDotState(
  tk: Record<string, unknown>,
  _revisadoMap?: Record<string, boolean>,
  _revisadoKey?: string,
): DotState | null {
  const bag = prepareTkForChecks(tk);
  if (ticketIsCerradoDocumentado(bag)) return "complete";

  const input = extractMetricInput(bag);
  if (ticketIsSolvedForDot(bag, input)) return "complete";

  const hours = businessHoursSinceCreation(bag, input);
  if (hours != null) {
    if (hours > TK_SOLVE_HOURS) return "overdue";
    if (!ticketWasAttended(bag, input) && hours > TK_ATTEND_HOURS) return "magenta";
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
