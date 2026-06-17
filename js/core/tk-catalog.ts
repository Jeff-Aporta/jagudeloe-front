/** Metadatos de catálogo TK para tooltips del footer full-page. */
import { projectLabel, ticketSpace } from "./tk-spaces.ts";
import { stripHonorific } from "../ui/tkHeroAuthors.ts";

export type TkCatalogRow = Record<string, unknown>;

function metaBag(row: TkCatalogRow): Record<string, unknown> {
  const raw = row.meta;
  if (raw && typeof raw === "object") return raw as Record<string, unknown>;
  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
}

export function tkCatalogResumen(row: TkCatalogRow): string {
  return String(row.resumen ?? row.descripcion ?? row.titulo ?? row.title ?? "").trim();
}

export function tkCatalogAsesor(row: TkCatalogRow): string {
  return stripHonorific(String(row.solicitante ?? ""));
}

export function tkCatalogProyecto(row: TkCatalogRow): string {
  const meta = metaBag(row);
  const fromMeta = String(meta.proyecto ?? meta.producto ?? meta.repo ?? "").trim();
  if (fromMeta) return fromMeta;
  const norm = String(row.normativa ?? "").trim();
  if (norm) return norm;
  return projectLabel(ticketSpace(row));
}

export function tkCatalogTooltipLines(row: TkCatalogRow): string[] {
  const lines: string[] = [];
  const resumen = tkCatalogResumen(row);
  if (resumen) lines.push(resumen);
  const asesor = tkCatalogAsesor(row);
  if (asesor) lines.push(`Asesor: ${asesor}`);
  const proyecto = tkCatalogProyecto(row);
  if (proyecto) lines.push(`Proyecto: ${proyecto}`);
  return lines.length ? lines : [String(row.iticket ?? "Ticket")];
}
