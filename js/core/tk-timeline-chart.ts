/**
 * Datos para diagrama de asignación temporal (todos los TK).
 */
import { computeFromTicket, type TicketMetricResult } from "./tk-metrics.ts";
import { computeEmpresaDesfase, extractEmpresaReport } from "./tk-empresa-report.ts";
import { isCierreDocumentado } from "./tk-empresa-comparativo.ts";
import { reportProject } from "./tk-spaces.ts";

export const TIMELINE_ROW_H = 15;
export const TIMELINE_LABEL_W = 76;
export const TIMELINE_HEADER_H = 36;
export const TIMELINE_CONCURRENCY_H = 28;

export type TimelineFilterId = "total" | "30d" | "abr-may" | "custom";

export interface TimelineRow {
  iticket: string;
  shortId: string;
  titulo: string;
  creMs: number;
  iniMs: number | null;
  finMs: number | null;
  abierto: boolean;
  incompleto: boolean;
  tieneDesfase: boolean;
}

export interface TimelineFilter {
  id: TimelineFilterId;
  label: string;
  tMin: number;
  tMax: number;
}

export interface TimelineChartData {
  filter: TimelineFilter;
  rows: TimelineRow[];
  concurrency: { t: number; count: number }[];
  maxConcurrency: number;
}

/** Colores alineados con métricas: inicio (espera), atención activa, solución (cierre). */
export const TIMELINE_PALETTE = {
  normal: {
    inicio: "#1e90ff",
    atencion: "#7b1fa2",
    solucion: "#2e7d32",
    abierto: "#78909c",
  },
  desfase: {
    inicio: "#e53935",
    atencion: "#c2185b",
    solucion: "#ad1457",
    abierto: "#880e4f",
  },
};

function ticketId(tk: Record<string, unknown>): string {
  return String(tk.code || tk.iticket || tk.id || "");
}

function shortTk(id: string): string {
  const n = id.replace(/\D/g, "");
  return n ? n.slice(-7) : id;
}

function parseMs(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? null : t;
}

function ticketEstado(tk: Record<string, unknown>): string {
  return String(tk.estado ?? tk.status ?? "").toLowerCase();
}

function isEstadoAbiertoExplicito(tk: Record<string, unknown>): boolean {
  const est = ticketEstado(tk);
  return est === "abierto" || est === "open" || est === "en-progreso" || est === "en progreso";
}

/** Resuelve instante de cierre desde métricas, entrega, reporte empresa o contextos. */
function resolveFinMs(
  tk: Record<string, unknown>,
  m: TicketMetricResult,
  project: string,
  creMs: number,
  iniMs: number | null,
): number | null {
  const candidates: (string | null | undefined)[] = [
    m.fechaCierre,
    tk.fechaEntrega as string | null,
    extractEmpresaReport(tk, reportProject(tk, project))?.fechaSolucion,
  ];

  const contexts = (tk.contexts || []) as Record<string, unknown>[];
  for (const ctx of contexts) {
    candidates.push(ctx.horaFin as string | undefined);
  }

  for (const raw of candidates) {
    const t = parseMs(raw ?? undefined);
    if (t != null) return t;
  }

  if (isCierreDocumentado(tk, m)) return iniMs ?? creMs;
  return null;
}

/** Vigente en el Gantt: solo si no hay cierre y el estado indica apertura. */
function isTimelineAbierto(
  tk: Record<string, unknown>,
  m: TicketMetricResult,
  finMs: number | null,
  now: number,
): boolean {
  if (isCierreDocumentado(tk, m)) return false;
  const est = ticketEstado(tk);
  if (est.includes("cerrad") || est === "closed") return false;
  if (finMs != null) return finMs >= now - 60_000;
  if (est === "activo" || est === "") return true;
  return isEstadoAbiertoExplicito(tk);
}

export function buildTimelineRows(
  tickets: Record<string, unknown>[],
  project = "clientesis",
  now = Date.now(),
): TimelineRow[] {
  const rows: TimelineRow[] = [];

  for (const tk of tickets) {
    const m = computeFromTicket(tk);
    const creMs = parseMs(m.fechaCreacion);
    if (creMs == null) continue;

    const iniMs = parseMs(m.horaInicioAtencion);
    let finMs = resolveFinMs(tk, m, project, creMs, iniMs);
    const abierto = isTimelineAbierto(tk, m, finMs, now);
    if (abierto && finMs == null) finMs = now;
    else if (finMs == null) finMs = iniMs ?? creMs;

    const incompleto = !m.fechaCreacion || !m.horaInicioAtencion || (!m.fechaCierre && !abierto);
    const report = extractEmpresaReport(tk, reportProject(tk, project));
    const desfase = computeEmpresaDesfase(m, report);

    rows.push({
      iticket: ticketId(tk),
      shortId: shortTk(ticketId(tk)),
      titulo: String(tk.titulo || tk.title || ""),
      creMs,
      iniMs,
      finMs,
      abierto,
      incompleto,
      tieneDesfase: desfase?.tieneDesfase ?? false,
    });
  }

  rows.sort((a, b) => a.creMs - b.creMs || a.iticket.localeCompare(b.iticket, undefined, { numeric: true }));
  return rows;
}

function rowOverlaps(row: TimelineRow, tMin: number, tMax: number): boolean {
  const fin = row.finMs ?? row.creMs;
  return row.creMs <= tMax && fin >= tMin;
}

function computeConcurrency(rows: TimelineRow[], tMin: number, tMax: number): { t: number; count: number }[] {
  if (!rows.length || tMax <= tMin) return [];

  const events: { t: number; delta: number }[] = [];
  for (const row of rows) {
    const start = Math.max(row.creMs, tMin);
    const end = Math.min(row.finMs ?? row.creMs, tMax);
    if (end <= start) continue;
    events.push({ t: start, delta: 1 });
    events.push({ t: end, delta: -1 });
  }
  events.sort((a, b) => a.t - b.t || a.delta - b.delta);

  const points: { t: number; count: number }[] = [];
  let count = 0;
  let prevT = tMin;
  points.push({ t: tMin, count: 0 });

  for (const ev of events) {
    if (ev.t > prevT) points.push({ t: prevT, count });
    count += ev.delta;
    points.push({ t: ev.t, count });
    prevT = ev.t;
  }
  if (prevT < tMax) points.push({ t: tMax, count });

  return points;
}

export function getTimelineDomain(rows: TimelineRow[]): { tMin: number; tMax: number } {
  if (!rows.length) {
    const now = Date.now();
    return { tMin: now - 86_400_000, tMax: now };
  }
  let tMin = Infinity;
  let tMax = -Infinity;
  for (const r of rows) {
    tMin = Math.min(tMin, r.creMs);
    tMax = Math.max(tMax, r.finMs ?? r.creMs);
  }
  const pad = Math.max(86_400_000, (tMax - tMin) * 0.02);
  return { tMin: tMin - pad, tMax: tMax + pad };
}

export function buildTimelineFilter(
  filterId: TimelineFilterId,
  allRows: TimelineRow[],
  now = Date.now(),
): TimelineFilter {
  if (filterId === "30d") {
    const tMax = allRows.length
      ? Math.max(...allRows.map((r) => r.finMs ?? r.creMs), now)
      : now;
    return { id: filterId, label: "Últimos 30 días", tMin: tMax - 30 * 86_400_000, tMax: tMax + 86_400_000 };
  }
  if (filterId === "abr-may") {
    return {
      id: filterId,
      label: "Abril – Mayo 2026",
      tMin: new Date("2026-04-01T00:00:00-05:00").getTime(),
      tMax: new Date("2026-06-01T00:00:00-05:00").getTime(),
    };
  }
  const { tMin, tMax } = getTimelineDomain(allRows);
  return { id: "total", label: "Total", tMin, tMax };
}

export function buildTimelineChartForRange(
  allRows: TimelineRow[],
  tMin: number,
  tMax: number,
  filterId: TimelineFilterId = "custom",
  label = "Personalizado",
): TimelineChartData {
  const lo = Math.min(tMin, tMax);
  const hi = Math.max(tMin, tMax);
  const filter: TimelineFilter = { id: filterId, label, tMin: lo, tMax: hi };
  const rows = allRows.filter((r) => rowOverlaps(r, lo, hi));
  const concurrency = computeConcurrency(rows, lo, hi);
  const maxConcurrency = concurrency.reduce((m, p) => Math.max(m, p.count), 0);
  return { filter, rows, concurrency, maxConcurrency };
}

export function buildTimelineChart(
  tickets: Record<string, unknown>[],
  filterId: TimelineFilterId,
  project = "clientesis",
  now = Date.now(),
): TimelineChartData {
  const allRows = buildTimelineRows(tickets, project, now);
  const filter = buildTimelineFilter(filterId, allRows, now);
  return buildTimelineChartForRange(allRows, filter.tMin, filter.tMax, filterId, filter.label);
}

/** Dominio completo de todos los TK (límites del selector deslizable). */
export function getTimelineFullDomain(
  tickets: Record<string, unknown>[],
  project = "clientesis",
  now = Date.now(),
): { tMin: number; tMax: number; rows: TimelineRow[] } {
  const rows = buildTimelineRows(tickets, project, now);
  return { ...getTimelineDomain(rows), rows };
}

export function timelineRangeFromPreset(
  filterId: Exclude<TimelineFilterId, "custom">,
  allRows: TimelineRow[],
  now = Date.now(),
): { tMin: number; tMax: number; label: string } {
  const f = buildTimelineFilter(filterId, allRows, now);
  return { tMin: f.tMin, tMax: f.tMax, label: f.label };
}

export function formatAxisDateTime(ms: number): string {
  return new Date(ms).toLocaleString("es-CO", {
    timeZone: "America/Bogota",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRangeDuration(tMin: number, tMax: number): string {
  const days = Math.max(0, (tMax - tMin) / 86_400_000);
  if (days >= 2) return `${days.toFixed(1)} días`;
  const hours = (tMax - tMin) / 3_600_000;
  return `${hours.toFixed(1)} h`;
}

export function timelineSliderStep(tMin: number, tMax: number): number {
  const span = tMax - tMin;
  if (span <= 3 * 86_400_000) return 3_600_000;
  if (span <= 14 * 86_400_000) return 6 * 3_600_000;
  return 86_400_000;
}

export function xForTime(t: number, tMin: number, tMax: number, chartW: number): number {
  if (tMax <= tMin) return 0;
  return ((t - tMin) / (tMax - tMin)) * chartW;
}

export function formatAxisDate(ms: number): string {
  return new Date(ms).toLocaleDateString("es-CO", {
    timeZone: "America/Bogota",
    day: "2-digit",
    month: "short",
  });
}
