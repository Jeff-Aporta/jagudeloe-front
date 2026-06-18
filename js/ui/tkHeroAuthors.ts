/** Etiquetas del hero del ticket (creador del tiquete vs quien documenta la solución). */
import { extractMetricInput } from "../core/tk-metrics.ts";
import { ticketTiempoEvidenciasCompletas } from "../core/tk-evidencias.ts";

const HONORIFIC_RE = /^(Asesora|Asesor|Ingeniero|Ingeniera|Ing\.?)\s+/i;

const ASIGNADO_CARGO: Record<string, string> = {
  JAGUDELOE: "Desarrollador Semi senior de InSoft SAS",
};

export function stripHonorific(name: string): string {
  return String(name || "").replace(HONORIFIC_RE, "").trim();
}

export function formatTiqueteCreadoPor(solicitante: string | null | undefined): string {
  const name = stripHonorific(String(solicitante || ""));
  return name ? `Tiquete creado por: ${name}` : "";
}

export function resolveDocumentadorNombre(tk: Record<string, unknown>): string {
  const contexts = (tk.contexts as Record<string, unknown>[] | undefined) ?? [];
  const ctx = contexts[0] || {};
  return stripHonorific(String(ctx.asesorNombre ?? ""));
}

export function resolveDocumentadorCargo(tk: Record<string, unknown>): string {
  const meta = (typeof tk.meta === "object" && tk.meta ? tk.meta : {}) as Record<string, unknown>;
  const explicit = String(meta.documentadorCargo ?? meta.asignadoCargo ?? "").trim();
  if (explicit) return explicit;
  const asignado = String(meta.asignadoA ?? "").trim();
  return asignado ? (ASIGNADO_CARGO[asignado] ?? "") : "";
}

export const DOCUMENTADOR_LABEL = "Solucionado y documentado por";

function ticketMetaBag(tk: Record<string, unknown>): Record<string, unknown> {
  return (typeof tk.meta === "object" && tk.meta ? tk.meta : {}) as Record<string, unknown>;
}

function ticketDetBag(tk: Record<string, unknown>): Record<string, unknown> {
  return (typeof tk.detallesExtra === "object" && tk.detallesExtra ? tk.detallesExtra : {}) as Record<string, unknown>;
}

function ticketDocBag(tk: Record<string, unknown>): Record<string, unknown> {
  for (const root of [ticketMetaBag(tk), ticketDetBag(tk)]) {
    const metricas = root.metricas;
    if (metricas && typeof metricas === "object") {
      const doc = (metricas as Record<string, unknown>).documentacion;
      if (doc && typeof doc === "object") return doc as Record<string, unknown>;
    }
  }
  return {};
}

export function ticketReasignadoA(tk: Record<string, unknown>): string {
  const meta = ticketMetaBag(tk);
  const det = ticketDetBag(tk);
  const doc = ticketDocBag(tk);
  return String(meta.reasignadoA ?? det.reasignadoA ?? doc.reasignadoA ?? "").trim();
}

export function ticketEstadoCierre(tk: Record<string, unknown>): string {
  if (ticketTiempoEvidenciasCompletas(tk)) return "cerrado";

  const estado = String(tk.estado ?? "").toLowerCase();
  if (estado) return estado;

  const doc = ticketDocBag(tk);
  const cierre = String(doc.cierreEmpresa ?? "").toLowerCase();
  if (cierre.includes("abierto")) return "abierto";
  return estado || "abierto";
}

/** Etiqueta del hero según cierre real del ticket (no siempre “solucionado”). */
export function resolveDocumentadorLabel(tk: Record<string, unknown>): string {
  const estado = ticketEstadoCierre(tk);
  if (estado === "cerrado") return DOCUMENTADOR_LABEL;
  if (ticketReasignadoA(tk)) return "Atención registrada por";
  if (estado === "abierto") return "Entrega documentada por";
  return "Documentado por";
}

export function resolveDocumentadorBlock(tk: Record<string, unknown>): {
  label: string;
  nombre: string;
  cargo: string;
  nota?: string;
} | null {
  const nombre = resolveDocumentadorNombre(tk);
  if (!nombre) return null;
  const reasignado = ticketReasignadoA(tk);
  const estado = ticketEstadoCierre(tk);
  let nota: string | undefined;
  if (reasignado && estado !== "cerrado") {
    nota = `Desarrollo reasignado a ${reasignado} · ticket abierto en InSoft`;
  } else if (estado === "abierto") {
    const input = extractMetricInput(tk);
    const doc = ticketDocBag(tk);
    const cierreMeta = String(doc.cierreEmpresa ?? "").toLowerCase();
    const fechasSinEvidencia =
      !!input.fechaCierre ||
      !!input.horaInicioAtencion ||
      cierreMeta.includes("cerrado") ||
      cierreMeta.includes("solucionado");
    nota = fechasSinEvidencia
      ? "Faltan pantallazos InSoft de apertura, atención o cierre en R2"
      : "Ticket abierto en InSoft";
  }
  return {
    label: resolveDocumentadorLabel(tk),
    nombre,
    cargo: resolveDocumentadorCargo(tk),
    ...(nota ? { nota } : {}),
  };
}

/** Una línea — correo / compatibilidad. */
export function formatDocumentadoPor(tk: Record<string, unknown>): string {
  const block = resolveDocumentadorBlock(tk);
  if (!block) return "";
  return block.cargo
    ? `${block.label} ${block.nombre} (${block.cargo})`
    : `${block.label} ${block.nombre}`;
}
