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

export function formatDocumentadoPor(tk: Record<string, unknown>): string {
  const name = resolveDocumentadorNombre(tk);
  if (!name) return "";
  const cargo = resolveDocumentadorCargo(tk);
  return cargo
    ? `Solucionado y documentado por ${name} (${cargo})`
    : `Solucionado y documentado por ${name}`;
}
