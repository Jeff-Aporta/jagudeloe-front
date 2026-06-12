/**
 * Reporte comparativo empresa vs hábil — tickets del Excel empresa con hitos documentados.
 */
import { computeFromTicket, formatHorasDecimal, type TicketMetricResult } from "./tk-metrics.ts";
import {
  extractEmpresaReport,
  formatDesfaseHoras,
  formatEmpresaHoras,
  type EmpresaReportEntry,
} from "./tk-empresa-report.ts";
import { isTicketTipoComparativo } from "./tk-normativa.ts";
import { reportProject } from "./tk-spaces.ts";

export const REPORTE_GENERAL_ID = "__reporte_general__";

export interface MetricPair {
  habilMinutos: number | null;
  habilHoras: number | null;
  reportHoras: number | null;
  desfaseHoras: number | null;
  pctDiff: number | null;
}

export interface ComparativoRow {
  iticket: string;
  titulo: string;
  hastaAtencion: MetricPair;
  atencionActiva: MetricPair;
  totalSolucion: MetricPair;
}

export interface ColumnAverages {
  habilHoras: number | null;
  reportHoras: number | null;
  desfaseHoras: number | null;
  pctDiff: number | null;
  count: number;
}

export interface ComparativoSummary {
  hastaAtencion: ColumnAverages;
  atencionActiva: ColumnAverages;
  totalSolucion: ColumnAverages;
}

export interface ComparativoReport {
  rows: ComparativoRow[];
  averages: ComparativoSummary;
  totalIncluidos: number;
  /** @deprecated use totalIncluidos */
  totalCerrados: number;
  excluidos: number;
  /** @deprecated use excluidos */
  excluidosAbiertos: number;
  excluidosSinReporte: number;
  excluidosSinHitos: number;
  excluidosPorTipo: number;
}

function ticketEstado(tk: Record<string, unknown>): string {
  return String(tk.estado ?? tk.status ?? "").toLowerCase();
}

/** Hitos cre → ini → cierre disponibles para métricas hábiles. */
export function hasCompleteMetricHitos(m: TicketMetricResult): boolean {
  return !!(m.fechaCreacion && m.horaInicioAtencion && m.fechaCierre);
}

/** Cierre documentado en InSoft, fechaEntrega o diligencia (aunque el estado siga abierto). */
export function isCierreDocumentado(tk: Record<string, unknown>, m: TicketMetricResult): boolean {
  const est = ticketEstado(tk);
  if (est.includes("cerrad") || est === "closed") return true;
  if (tk.fechaEntrega || m.fechaCierre) return true;

  const det = (tk.detallesExtra || {}) as Record<string, unknown>;
  const meta = (tk.meta || {}) as Record<string, unknown>;
  const metricas = (det.metricas || meta.metricas || tk.metricas || {}) as Record<string, unknown>;
  const doc = (metricas.documentacion || {}) as Record<string, unknown>;
  const norm = (tk.normativa || {}) as Record<string, unknown>;
  const cierre = String(doc.cierreEmpresa ?? norm.cierre ?? "").toLowerCase();
  if (cierre.includes("cerrad")) return true;

  const tipoCierre = String(
    norm.tipoSolicitudCierre ?? doc.tipoSolicitudCierre ?? metricas.tipoSolicitudCierre ?? "",
  ).trim();
  if (tipoCierre && !/no aplica/i.test(tipoCierre)) return true;

  return false;
}

function hasReporteEmpresaUtil(report: EmpresaReportEntry | null): report is EmpresaReportEntry {
  if (!report) return false;
  return report.horasAtencion != null || report.horasSolucion != null;
}

/**
 * Incluido en reporte general si está en el Excel empresa y tienes hitos de solución documentados.
 */
export function isTicketComparativoIncluido(
  tk: Record<string, unknown>,
  m: TicketMetricResult,
  project = "clientesis",
): boolean {
  if (!isTicketTipoComparativo(tk)) return false;
  const report = extractEmpresaReport(tk, project);
  return hasReporteEmpresaUtil(report) && hasCompleteMetricHitos(m);
}

/** @deprecated use isTicketComparativoIncluido */
export function isTicketCerradoMetricas(tk: Record<string, unknown>, m: TicketMetricResult): boolean {
  const est = ticketEstado(tk);
  if (!est.includes("cerrad") && est !== "closed") return false;
  return hasCompleteMetricHitos(m);
}

function minToH(min: number | null): number | null {
  return min != null ? min / 60 : null;
}

function pair(habilMin: number | null, reportH: number | null): MetricPair {
  const habilH = minToH(habilMin);
  let desfaseHoras: number | null = null;
  let pctDiff: number | null = null;
  if (reportH != null && habilH != null) {
    desfaseHoras = reportH - habilH;
    if (habilH > 0) pctDiff = (desfaseHoras / habilH) * 100;
    else if (reportH === 0 && habilH === 0) pctDiff = 0;
  }
  return { habilMinutos: habilMin, habilHoras: habilH, reportHoras: reportH, desfaseHoras, pctDiff };
}

function deriveReportActivaHoras(report: EmpresaReportEntry): number | null {
  const tA = report.horasAtencion;
  const tS = report.horasSolucion;
  if (tA == null || tS == null || Number.isNaN(tA) || Number.isNaN(tS)) return null;
  return tS - tA;
}

function avgPairs(rows: ComparativoRow[], pick: (r: ComparativoRow) => MetricPair): ColumnAverages {
  const habil: number[] = [];
  const report: number[] = [];
  const desfase: number[] = [];
  const pct: number[] = [];
  for (const row of rows) {
    const p = pick(row);
    if (p.habilHoras != null) habil.push(p.habilHoras);
    if (p.reportHoras != null) report.push(p.reportHoras);
    if (p.desfaseHoras != null) desfase.push(p.desfaseHoras);
    if (p.pctDiff != null) pct.push(p.pctDiff);
  }
  const mean = (arr: number[]) => (arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : null);
  return {
    habilHoras: mean(habil),
    reportHoras: mean(report),
    desfaseHoras: mean(desfase),
    pctDiff: mean(pct),
    count: Math.max(habil.length, report.length),
  };
}

export function buildComparativoReport(
  tickets: Record<string, unknown>[],
  project = "clientesis",
): ComparativoReport {
  let excluidosSinReporte = 0;
  let excluidosSinHitos = 0;
  let excluidosPorTipo = 0;
  const rows: ComparativoRow[] = [];

  for (const tk of tickets) {
    const m = computeFromTicket(tk);
    const tkProj = reportProject(tk, project);
    const report = extractEmpresaReport(tk, tkProj);

    if (!isTicketTipoComparativo(tk)) {
      excluidosPorTipo += 1;
      continue;
    }
    if (!hasReporteEmpresaUtil(report)) {
      excluidosSinReporte += 1;
      continue;
    }
    if (!hasCompleteMetricHitos(m)) {
      excluidosSinHitos += 1;
      continue;
    }

    const id = String(tk.code || tk.iticket || tk.id || "");
    rows.push({
      iticket: id,
      titulo: String(tk.titulo || tk.title || ""),
      hastaAtencion: pair(m.minutosHastaAtencion, report.horasAtencion ?? null),
      atencionActiva: pair(m.minutosAtencionActiva, deriveReportActivaHoras(report)),
      totalSolucion: pair(m.minutosTotalSolucion, report.horasSolucion ?? null),
    });
  }

  rows.sort((a, b) => a.iticket.localeCompare(b.iticket, undefined, { numeric: true }));

  const averages: ComparativoSummary = {
    hastaAtencion: avgPairs(rows, (r) => r.hastaAtencion),
    atencionActiva: avgPairs(rows, (r) => r.atencionActiva),
    totalSolucion: avgPairs(rows, (r) => r.totalSolucion),
  };

  const excluidos = excluidosSinReporte + excluidosSinHitos + excluidosPorTipo;
  return {
    rows,
    averages,
    totalIncluidos: rows.length,
    totalCerrados: rows.length,
    excluidos,
    excluidosAbiertos: excluidos,
    excluidosSinReporte,
    excluidosSinHitos,
    excluidosPorTipo,
  };
}

export function formatPctDiff(pct: number | null, signed = true): string {
  if (pct == null || Number.isNaN(pct)) return "—";
  const v = Math.abs(pct).toFixed(1);
  if (!signed) return `${v}%`;
  if (pct > 0) return `+${v}%`;
  if (pct < 0) return `−${v}%`;
  return "0%";
}

export function formatHabilHorasFromMin(min: number | null): string {
  if (min == null) return "—";
  const dec = formatHorasDecimal(min);
  const h = min / 60;
  return dec != null ? `${h.toFixed(1)} h (${dec})` : `${h.toFixed(1)} h`;
}

export { formatDesfaseHoras, formatEmpresaHoras };
