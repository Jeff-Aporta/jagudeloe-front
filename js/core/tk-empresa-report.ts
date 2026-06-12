/**
 * Tiempos reportados por la empresa (InSoft · Detalle Tiquetes Asignados)
 * vs métricas hábiles reales (hitos + exclusiones).
 */
import { formatHorasDecimal, formatMinutos, type TicketMetricResult } from "./tk-metrics.ts";

export interface EmpresaReportEntry {
  codigo: number;
  fechaApertura?: string | null;
  fechaSolucion?: string | null;
  horasAtencion?: number | null;
  horasSolucion?: number | null;
  fuente?: string;
  capturado?: string;
  notas?: string;
}

export interface MetricDesfaseRow {
  key: "atencion" | "solucion";
  label: string;
  empresaHoras: number | null;
  habilMinutos: number | null;
  habilHoras: number | null;
  desfaseHoras: number | null;
  desfaseMinutos: number | null;
  pendienteHitos: boolean;
}

export interface EmpresaDesfaseResult {
  report: EmpresaReportEntry;
  rows: MetricDesfaseRow[];
  maxDesfaseHoras: number;
  tieneDesfase: boolean;
  pendienteHitos: boolean;
}

const FUENTE_DEFAULT = "InSoft · Detalle Tiquetes Asignados";
const CAPTURADO = "2026-06-10";

/** Catálogo extraído del reporte empresa (JAGUDELOE, jun 2026). */
export const EMPRESA_REPORT_CLIENTESIS: Record<string, EmpresaReportEntry> = {
  "TK-1401851": { codigo: 1401851, fechaApertura: "2026-03-19", fechaSolucion: "2026-04-14", horasAtencion: 136.7, horasSolucion: 137.1 },
  "TK-1401852": { codigo: 1401852, fechaApertura: "2026-03-19", fechaSolucion: "2026-04-14", horasAtencion: 136.7, horasSolucion: 137.3 },
  "TK-1401853": { codigo: 1401853, fechaApertura: "2026-03-19", fechaSolucion: "2026-04-14", horasAtencion: 136.7, horasSolucion: 137.3 },
  "TK-1401855": { codigo: 1401855, fechaApertura: "2026-03-19", fechaSolucion: "2026-04-14", horasAtencion: 136.7, horasSolucion: 137.3 },
  "TK-1401856": { codigo: 1401856, fechaApertura: "2026-03-19", fechaSolucion: "2026-04-14", horasAtencion: 136.7, horasSolucion: 137.4 },
  "TK-1408396": { codigo: 1408396, fechaApertura: "2026-04-07", fechaSolucion: null, horasAtencion: 51.7, horasSolucion: null },
  "TK-1418894": { codigo: 1418894, fechaApertura: "2026-04-29", fechaSolucion: "2026-05-05", horasAtencion: 17.4, horasSolucion: 24.1 },
  "TK-1425170": { codigo: 1425170, fechaApertura: "2026-05-13", fechaSolucion: null, horasAtencion: 1.9, horasSolucion: null },
  "TK-1430974": { codigo: 1430974, fechaApertura: "2026-05-28", fechaSolucion: null, horasAtencion: 2.8, horasSolucion: null },
  "TK-1430975": { codigo: 1430975, fechaApertura: "2026-05-28", fechaSolucion: null, horasAtencion: 2.8, horasSolucion: null },
  "TK-1432903": { codigo: 1432903, fechaApertura: "2026-06-02", fechaSolucion: null, horasAtencion: 3.5, horasSolucion: null },
  "TK-1433179": { codigo: 1433179, fechaApertura: "2026-06-02", fechaSolucion: null, horasAtencion: 0.8, horasSolucion: null },
  "TK-1433943": { codigo: 1433943, fechaApertura: "2026-06-04", fechaSolucion: null, horasAtencion: 1.5, horasSolucion: null },
  "TK-1433968": { codigo: 1433968, fechaApertura: "2026-06-04", fechaSolucion: null, horasAtencion: 1.2, horasSolucion: null },
  "TK-1434846": { codigo: 1434846, fechaApertura: "2026-06-05", fechaSolucion: null, horasAtencion: 1.6, horasSolucion: null },
  "TK-1435136": { codigo: 1435136, fechaApertura: "2026-06-05", fechaSolucion: null, horasAtencion: 0.3, horasSolucion: null },
  "TK-1435328": { codigo: 1435328, fechaApertura: "2026-06-06", fechaSolucion: null, horasAtencion: 0.0, horasSolucion: null },
  "TK-1435713": { codigo: 1435713, fechaApertura: "2026-06-09", fechaSolucion: null, horasAtencion: 0.4, horasSolucion: null },
  "TK-1436238": { codigo: 1436238, fechaApertura: "2026-06-10", fechaSolucion: null, horasAtencion: null, horasSolucion: null },
  "TK-1436248": { codigo: 1436248, fechaApertura: "2026-06-10", fechaSolucion: null, horasAtencion: null, horasSolucion: null },
  "TK-1436259": { codigo: 1436259, fechaApertura: "2026-06-10", fechaSolucion: null, horasAtencion: null, horasSolucion: null },
};

export function normalizeTkCode(raw: string | number | null | undefined): string {
  const n = String(raw ?? "").replace(/\D/g, "");
  return n ? `TK-${n}` : "";
}

function parseReportRaw(raw: unknown): EmpresaReportEntry | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const codigo = Number(o.codigo ?? o.codigoTk ?? 0);
  if (!codigo) return null;
  const num = (v: unknown) => (v == null || v === "" ? null : Number(v));
  return {
    codigo,
    fechaApertura: (o.fechaApertura as string) ?? null,
    fechaSolucion: (o.fechaSolucion as string) ?? null,
    horasAtencion: num(o.horasAtencion ?? o.tAtencion ?? o.tiempoAtencion),
    horasSolucion: num(o.horasSolucion ?? o.tSolucion ?? o.tiempoSolucion),
    fuente: (o.fuente as string) ?? FUENTE_DEFAULT,
    capturado: (o.capturado as string) ?? null,
    notas: (o.notas as string) ?? undefined,
  };
}

/** Lee reporte empresa del ticket (meta) o del catálogo local. */
export function extractEmpresaReport(tk: Record<string, unknown>, project = "clientesis"): EmpresaReportEntry | null {
  const meta = (tk.meta || {}) as Record<string, unknown>;
  const metricas = (meta.metricas || tk.metricas || {}) as Record<string, unknown>;
  const det = (tk.detallesExtra || {}) as Record<string, unknown>;
  const detMet = (det.metricas || {}) as Record<string, unknown>;

  for (const src of [metricas.reporteEmpresa, detMet.reporteEmpresa, meta.reporteEmpresa]) {
    const parsed = parseReportRaw(src);
    if (parsed) return { ...parsed, fuente: parsed.fuente || FUENTE_DEFAULT };
  }

  if (project !== "clientesis") return null;
  const code = normalizeTkCode(tk.code || tk.iticket || tk.id);
  const cat = EMPRESA_REPORT_CLIENTESIS[code];
  if (!cat) return null;
  return { ...cat, fuente: FUENTE_DEFAULT, capturado: CAPTURADO };
}

function rowDesfase(
  key: "atencion" | "solucion",
  label: string,
  empresaHoras: number | null | undefined,
  habilMinutos: number | null,
): MetricDesfaseRow {
  const emp = empresaHoras != null && !Number.isNaN(empresaHoras) ? empresaHoras : null;
  const habilH = habilMinutos != null ? habilMinutos / 60 : null;
  const pendienteHitos = emp != null && habilMinutos == null;
  let desfaseHoras: number | null = null;
  if (emp != null && habilH != null) desfaseHoras = emp - habilH;
  return {
    key,
    label,
    empresaHoras: emp,
    habilMinutos,
    habilHoras: habilH,
    desfaseHoras,
    desfaseMinutos: desfaseHoras != null ? Math.round(desfaseHoras * 60) : null,
    pendienteHitos,
  };
}

const DESFASE_UMBRAL_H = 0.25;

export function computeEmpresaDesfase(
  metrics: TicketMetricResult,
  report: EmpresaReportEntry | null,
): EmpresaDesfaseResult | null {
  if (!report) return null;

  const rows: MetricDesfaseRow[] = [];
  if (report.horasAtencion != null) {
    rows.push(rowDesfase("atencion", "T. atención", report.horasAtencion, metrics.minutosHastaAtencion));
  }
  if (report.horasSolucion != null) {
    rows.push(rowDesfase("solucion", "T. solución", report.horasSolucion, metrics.minutosTotalSolucion));
  }

  if (!rows.length) return null;

  const desfases = rows.map((r) => Math.abs(r.desfaseHoras ?? 0)).filter((d) => d > 0);
  const maxDesfaseHoras = desfases.length ? Math.max(...desfases) : 0;
  const pendienteHitos = rows.some((r) => r.pendienteHitos);
  const tieneDesfase = rows.some((r) => r.desfaseHoras != null && r.desfaseHoras >= DESFASE_UMBRAL_H);

  return { report, rows, maxDesfaseHoras, tieneDesfase, pendienteHitos };
}

export function formatDesfaseHoras(h: number | null, signed = true): string {
  if (h == null || Number.isNaN(h)) return "—";
  const abs = Math.abs(h);
  const v = abs.toFixed(1);
  if (!signed) return v;
  if (h > 0) return `+${v} h`;
  if (h < 0) return `−${v} h`;
  return "0 h";
}

export function formatEmpresaHoras(h: number | null): string {
  if (h == null || Number.isNaN(h)) return "—";
  return `${h.toFixed(1)} h`;
}

export function formatHabilConDecimal(minutos: number | null): string {
  if (minutos == null) return "—";
  const dec = formatHorasDecimal(minutos);
  return `${formatMinutos(minutos)}${dec ? ` (${dec})` : ""}`;
}
