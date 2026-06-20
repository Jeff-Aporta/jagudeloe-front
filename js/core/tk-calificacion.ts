/**
 * Sistema de calificación de TKs (modelo gestión · JAGUDELOE).
 * Referencia: cumplimiento 45% · atención 10% · solución 15% · cobertura 30%.
 */

import { formatMinutos, type TicketMetricResult } from "./tk-metrics.ts";
import { extractTipoSolicitudApertura } from "./tk-normativa.ts";

export const TK_CALIFICACION_ATENCION_MAX_MIN = 300; // 5 h hábil
export const TK_CALIFICACION_SOLUCION_MAX_MIN = 960; // 16 h hábil

export interface TkCalificacionKpiSpec {
  key: "cumplimiento" | "atencion" | "solucion" | "cobertura";
  label: string;
  peso: number;
  titulo: string;
  descripcion: string;
  meta: string;
  notas?: string;
}

export const TK_CALIFICACION_SPECS: TkCalificacionKpiSpec[] = [
  {
    key: "cumplimiento",
    label: "Cumplimiento",
    peso: 45,
    titulo: "Cumplimiento (45%)",
    descripcion:
      "Garantizar que los tickets de proyecto o mejora se entreguen dentro de las fechas y tiempos programados en InSoft.",
    meta: "Tiempo registrado ≤ estimación InSoft (diligencia vs estimación del TK).",
    notas: "Es el componente con mayor peso: refleja el compromiso con plazos acordados.",
  },
  {
    key: "atencion",
    label: "Tiempo de Atención",
    peso: 10,
    titulo: "Tiempo de Atención (10%)",
    descripcion:
      "Tiempo entre la creación del PQR y el momento en que el desarrollador recibe el ticket e inicia la revisión.",
    meta: "Menor a 5 horas hábiles (creación → inicio atención).",
    notas: "Aplica a errores, consultas, servicios SQL y servicios similares.",
  },
  {
    key: "solucion",
    label: "Tiempo de Solución",
    peso: 15,
    titulo: "Tiempo de Solución (15%)",
    descripcion: "Tiempo total para cerrar el PQR desde su creación hasta la solución documentada.",
    meta: "Máximo 16 horas hábiles (creación → cierre).",
    notas: "Misma categoría de tickets que Tiempo de Atención.",
  },
  {
    key: "cobertura",
    label: "Participación en Cobertura",
    peso: 30,
    titulo: "Participación en Cobertura (30%)",
    descripcion:
      "Mide el impacto que tienen las actualizaciones o ajustes sobre los clientes; debe ser el más bajo posible.",
    meta: "Cobertura estimada InSoft con impacto puntual (≤ 5%) o «No aplica» / 100% según tipo.",
    notas: "Se lee de normativa.coberturaEstimada del ticket.",
  },
];

export type TkCalificacionEstado = "cumple" | "no_cumple" | "pendiente" | "no_aplica";

export interface TkCalificacionFila {
  key: TkCalificacionKpiSpec["key"];
  label: string;
  peso: number;
  meta: string;
  estimado: string;
  registrado: string;
  desfase: string;
  desfaseMinutos: number | null;
  estado: TkCalificacionEstado;
  detalle: string;
}

export interface TkCalificacionResumen {
  filas: TkCalificacionFila[];
  cumpleGlobal: boolean | null;
  resumenTexto: string;
  tipoApertura: string | null;
}

function normativaBag(tk: Record<string, unknown>): Record<string, unknown> {
  return (tk.normativa && typeof tk.normativa === "object" ? tk.normativa : {}) as Record<string, unknown>;
}

function parseCoberturaPct(raw: unknown): number | null {
  const s = String(raw ?? "").trim().toLowerCase();
  if (!s) return null;
  if (/no aplica|n\/a/i.test(s)) return null;
  const m = /(\d+(?:[.,]\d+)?)\s*%/.exec(s);
  if (!m) return s.includes("100") ? 100 : null;
  return Number(m[1].replace(",", "."));
}

function fmtDesfaseMin(min: number | null, invert = false): string {
  if (min == null || Number.isNaN(min)) return "—";
  if (min === 0) return "0 min";
  const sign = invert ? (min > 0 ? "−" : "+") : min > 0 ? "+" : "−";
  return `${sign}${formatMinutos(Math.abs(min))}`;
}

function estadoFromCumple(cumple: boolean | null): TkCalificacionEstado {
  if (cumple === true) return "cumple";
  if (cumple === false) return "no_cumple";
  return "pendiente";
}

/** Evalúa el TK contra el sistema de calificación. */
export function evaluateTkCalificacion(
  tk: Record<string, unknown>,
  metrics: TicketMetricResult,
): TkCalificacionResumen {
  const estimacion = Math.round(Number(tk.estimacionMinutos ?? 0));
  const diligencia = Math.round(Number(tk.diligenciaMinutos ?? 0));
  const registradoSolucion = metrics.minutosTotalSolucion;
  const registradoAtencion = metrics.minutosHastaAtencion;
  const coberturaRaw = normativaBag(tk).coberturaEstimada;
  const coberturaPct = parseCoberturaPct(coberturaRaw);
  const tipoApertura = extractTipoSolicitudApertura(tk);

  // Cumplimiento: estimación InSoft vs diligencia registrada
  let cumplimientoCumple: boolean | null = null;
  let cumplimientoDesfase: number | null = null;
  if (estimacion > 0 && diligencia > 0) {
    cumplimientoDesfase = diligencia - estimacion;
    cumplimientoCumple = diligencia <= estimacion;
  } else if (estimacion > 0 && registradoSolucion != null) {
    cumplimientoDesfase = registradoSolucion - estimacion;
    cumplimientoCumple = registradoSolucion <= estimacion;
  }

  // Atención: < 5 h hábil
  let atencionCumple: boolean | null = null;
  let atencionDesfase: number | null = null;
  if (registradoAtencion != null) {
    atencionDesfase = registradoAtencion - TK_CALIFICACION_ATENCION_MAX_MIN;
    atencionCumple = registradoAtencion < TK_CALIFICACION_ATENCION_MAX_MIN;
  }

  // Solución: ≤ 16 h hábil
  let solucionCumple: boolean | null = null;
  let solucionDesfase: number | null = null;
  if (registradoSolucion != null) {
    solucionDesfase = registradoSolucion - TK_CALIFICACION_SOLUCION_MAX_MIN;
    solucionCumple = registradoSolucion <= TK_CALIFICACION_SOLUCION_MAX_MIN;
  }

  // Cobertura
  let coberturaCumple: boolean | null = null;
  let coberturaEstado: TkCalificacionEstado = "pendiente";
  const cobStr = String(coberturaRaw ?? "").trim();
  if (/no aplica|n\/a/i.test(cobStr)) {
    coberturaCumple = true;
    coberturaEstado = "no_aplica";
  } else if (coberturaPct != null) {
    if (coberturaPct >= 100) {
      coberturaCumple = true;
    } else {
      coberturaCumple = coberturaPct <= 5;
    }
  } else if (cobStr) {
    coberturaCumple = null;
  }

  const filas: TkCalificacionFila[] = [
    {
      key: "cumplimiento",
      label: "Cumplimiento",
      peso: 45,
      meta: "Registrado ≤ estimado InSoft",
      estimado: estimacion > 0 ? formatMinutos(estimacion) : "—",
      registrado: diligencia > 0 ? formatMinutos(diligencia) : registradoSolucion != null ? `${formatMinutos(registradoSolucion)} hábil` : "—",
      desfase: fmtDesfaseMin(cumplimientoDesfase),
      desfaseMinutos: cumplimientoDesfase,
      estado: estadoFromCumple(cumplimientoCumple),
      detalle:
        cumplimientoCumple === true
          ? "Entrega dentro del tiempo estimado."
          : cumplimientoCumple === false
            ? "Superó la estimación InSoft."
            : "Falta estimación o tiempo registrado.",
    },
    {
      key: "atencion",
      label: "Tiempo de atención",
      peso: 10,
      meta: "< 5 h hábiles",
      estimado: formatMinutos(TK_CALIFICACION_ATENCION_MAX_MIN),
      registrado: registradoAtencion != null ? formatMinutos(registradoAtencion) : "—",
      desfase: fmtDesfaseMin(atencionDesfase),
      desfaseMinutos: atencionDesfase,
      estado: estadoFromCumple(atencionCumple),
      detalle:
        atencionCumple === true
          ? "Atención iniciada dentro del límite."
          : atencionCumple === false
            ? "Superó 5 h hábiles hasta iniciar atención."
            : "Pendiente hito inicio atención.",
    },
    {
      key: "solucion",
      label: "Tiempo de solución",
      peso: 15,
      meta: "≤ 16 h hábiles",
      estimado: formatMinutos(TK_CALIFICACION_SOLUCION_MAX_MIN),
      registrado: registradoSolucion != null ? formatMinutos(registradoSolucion) : "—",
      desfase: fmtDesfaseMin(solucionDesfase),
      desfaseMinutos: solucionDesfase,
      estado: estadoFromCumple(solucionCumple),
      detalle:
        solucionCumple === true
          ? "Cierre dentro del límite de 16 h hábiles."
          : solucionCumple === false
            ? "Superó 16 h hábiles totales."
            : "Pendiente hito cierre / solución.",
    },
    {
      key: "cobertura",
      label: "Cobertura",
      peso: 30,
      meta: "Impacto mínimo",
      estimado: "≤ 5% · No aplica · 100%",
      registrado: cobStr || "—",
      desfase: "—",
      desfaseMinutos: null,
      estado: coberturaEstado === "no_aplica" ? "no_aplica" : estadoFromCumple(coberturaCumple),
      detalle:
        coberturaEstado === "no_aplica"
          ? "Cobertura no aplica a este tipo de TK."
          : coberturaCumple === true
            ? "Impacto acotado según cobertura estimada."
            : coberturaCumple === false
              ? "Cobertura estimada indica impacto elevado."
              : "Sin coberturaEstimada en normativa.",
    },
  ];

  const evaluables = filas.filter((f) => f.estado !== "pendiente" && f.estado !== "no_aplica");
  const cumpleCount = filas.filter((f) => f.estado === "cumple" || f.estado === "no_aplica").length;
  const failCount = filas.filter((f) => f.estado === "no_cumple").length;
  const pendienteCount = filas.filter((f) => f.estado === "pendiente").length;

  let cumpleGlobal: boolean | null = null;
  let resumenTexto = "Sin datos suficientes para calificar.";
  if (failCount > 0) {
    cumpleGlobal = false;
    resumenTexto = `No cumple ${failCount} indicador${failCount > 1 ? "es" : ""} del sistema de calificación.`;
  } else if (pendienteCount > 0 && evaluables.length === 0) {
    cumpleGlobal = null;
    resumenTexto = "Métricas incompletas — faltan hitos o datos InSoft.";
  } else if (pendienteCount > 0) {
    cumpleGlobal = null;
    resumenTexto = `Cumple ${cumpleCount} indicador${cumpleCount !== 1 ? "es" : ""}; ${pendienteCount} pendiente${pendienteCount > 1 ? "s" : ""}.`;
  } else {
    cumpleGlobal = true;
    resumenTexto = "Cumple con los tiempos determinados por el sistema de calificación.";
  }

  return { filas, cumpleGlobal, resumenTexto, tipoApertura };
}

export function calificacionEstadoLabel(estado: TkCalificacionEstado): string {
  if (estado === "cumple") return "Cumple";
  if (estado === "no_cumple") return "No cumple";
  if (estado === "no_aplica") return "No aplica";
  return "Pendiente";
}
