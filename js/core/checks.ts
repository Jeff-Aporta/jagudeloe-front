/** Utilidades checks — sqlexec + tickets (BITACORA_REVISADO). */
import { businessMinutesBetween, extractMetricInput, DEFAULT_SCHEDULE } from "./tk-metrics.ts";

export type DotState = "complete" | "partial" | "warn" | "overdue" | "idle" | "none";

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

/** Estado InSoft normalizado (listado puede venir sin tk.estado). */
export function resolveTicketEstado(tk: Record<string, unknown>): string {
  const direct = String(tk.estado || tk.ESTADO || "").toLowerCase().trim();
  if (direct) return direct;

  const norm = parseRecord(tk.normativa);
  for (const v of [norm.cierre, norm.cierreEmpresa, norm.estadoSolicitud]) {
    const s = String(v || "").toLowerCase();
    if (s.includes("cerrado")) return "cerrado";
    if (s.includes("abierto") || s.includes("sin cerrar")) return "abierto";
  }

  const doc = metricDocBag(tk);
  const cierreEmp = String(doc.cierreEmpresa || "").toLowerCase();
  if (cierreEmp.includes("cerrado")) return "cerrado";
  if (cierreEmp.includes("abierto")) return "abierto";

  if (tk.fechaEntrega || tk.FECHAENTREGA) return "cerrado";

  const input = extractMetricInput(tk);
  if (input.fechaCierre) return "cerrado";

  return "";
}

/** Dot por estado del ticket — misma semántica que el chip del detalle. */
export function ticketEstadoDotState(tk: Record<string, unknown>): DotState {
  const estado = resolveTicketEstado(tk);
  if (estado && ESTADO_TO_DOT[estado]) return ESTADO_TO_DOT[estado];
  if (ticketHasPendingTasks(tk)) return "warn";
  return "idle";
}

/** Dot en listado TK: revisado → verde; si no, mismo estado que el detalle; aging hábil como refuerzo. */
export function ticketListDotState(
  tk: Record<string, unknown>,
  revisadoMap: Record<string, boolean>,
  revisadoKey: string,
): DotState | null {
  const rev = aggregateDotState([revisadoKey], revisadoMap);
  if (rev === "complete") return "complete";

  const estadoDot = ticketEstadoDotState(tk);
  if (estadoDot !== "idle") return estadoDot;

  const input = extractMetricInput(tk);
  if (input.fechaCierre) return "complete";

  const cre = input.fechaCreacion;
  if (!cre) return "idle";

  const mins = businessMinutesBetween(cre, new Date().toISOString(), input, DEFAULT_SCHEDULE);
  if (mins == null) return "idle";

  const hours = mins / 60;
  if (hours > TK_OVERDUE_HOURS) return "overdue";
  if (hours > TK_WARN_HOURS) return "warn";
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
