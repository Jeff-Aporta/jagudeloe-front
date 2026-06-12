/** Etiquetas del hero del ticket (creador del tiquete vs quien documenta la solución). */

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

export function resolveDocumentadorBlock(tk: Record<string, unknown>): {
  label: string;
  nombre: string;
  cargo: string;
} | null {
  const nombre = resolveDocumentadorNombre(tk);
  if (!nombre) return null;
  return {
    label: DOCUMENTADOR_LABEL,
    nombre,
    cargo: resolveDocumentadorCargo(tk),
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
