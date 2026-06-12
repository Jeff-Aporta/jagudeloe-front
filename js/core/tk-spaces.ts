/** Spaces reales en BD; "general" los combina en la UI. */
export const TICKET_SPACES = ["patyia", "clientesis"] as const;

export function spacesFor(project: string): string[] {
  return project === "general" ? [...TICKET_SPACES] : [project];
}

export function isGeneralProject(project: string): boolean {
  return project === "general";
}

export function ticketSpace(tk: Record<string, unknown>, fallback = "clientesis"): string {
  return String(tk.space || fallback).toLowerCase();
}

/** Proyecto para reporte empresa / catálogo según el ticket. */
export function reportProject(tk: Record<string, unknown>, viewProject: string): string {
  if (viewProject !== "general") return viewProject;
  return ticketSpace(tk);
}

export function projectLabel(project: string): string {
  if (project === "general") return "General · PatyIA + Clientes";
  if (project === "patyia") return "PatyIA";
  if (project === "clientesis") return "Clientes";
  return project;
}
