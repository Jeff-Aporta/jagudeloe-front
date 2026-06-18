/**
 * Modelo de vista doc TK — partición, visibilidad de secciones estándar y dots del hero.
 */

import {
  extractTicketDocEvidencias,
  filterDocViewContentBlocks,
  filterInlineImagesForDocEvidenciasPanel,
} from "./tk-evidencias.ts";
import { partitionTkDocStandard, type TkDocBlock } from "./tk-doc-layout.ts";
import {
  partitionBodyLanes,
  isStandardMappedTitle,
  blockPayloadTitle,
  type TkDocBodyLanes,
} from "./tk-doc-sections.ts";
import {
  filterContentBlocks,
  laneHasContent,
  textPartsHaveContent,
} from "./tk-doc-blocks.ts";
import { finalizeSolutionLane } from "./tk-doc-solution.ts";
import {
  TK_DOC_SECTION_ORDER,
  TK_DOC_STANDARD,
  type TkDocSectionKey,
} from "./tk-doc-constants.ts";
import { roundTkMinutosTo5, computeCommitTotals } from "./tk-table.ts";
import { isTicketSinEvidenciaProblema, extractTipoSolicitudApertura, tipoSolicitudDisplayLabel } from "./tk-normativa.ts";

export type TkDocSectionDot = {
  key: TkDocSectionKey;
  title: string;
  accent: string;
  hasContent: boolean;
  /** Mejora/requerimiento: sección «Evidencias del problema» no aplica (dot con slash). */
  notApplicable?: boolean;
};

export type TkDocViewModel = {
  solicitudParts: string[];
  evidenciaIntro: string | null;
  docEvidencias: ReturnType<typeof extractTicketDocEvidencias>;
  lanes: TkDocBodyLanes;
  otrosBlocks: TkDocBlock[];
  allCommits: unknown[];
  tiempos: { name: string; detail: string; minutos: number; phase?: string }[];
  badges: TkDocBlock[];
  sectionDots: TkDocSectionDot[];
  sectionPresence: Record<TkDocSectionKey, boolean>;
  commitsTitle: string;
};

function sortBlocks(blocks: TkDocBlock[]): TkDocBlock[] {
  return (blocks ?? []).slice().sort((a, b) => (a.sortKey ?? 0) - (b.sortKey ?? 0));
}

function isInfoTiquete(b: TkDocBlock, tk: Record<string, unknown>): boolean {
  const title = blockPayloadTitle(b).toLowerCase();
  const iticket = String(tk.iticket ?? "").trim();
  if (title && iticket && title.includes(iticket.toLowerCase())) return true;
  if (/^info\b.*tiquete/i.test(title)) return true;
  return false;
}

function filterBodyBlocks(blocks: TkDocBlock[], docEvidencias: ReturnType<typeof extractTicketDocEvidencias>) {
  return filterInlineImagesForDocEvidenciasPanel(filterDocViewContentBlocks(blocks), docEvidencias);
}

function pruneLanes(lanes: TkDocBodyLanes): TkDocBodyLanes {
  return {
    causa: filterContentBlocks(lanes.causa),
    verificacion: filterContentBlocks(lanes.verificacion),
    solucion: filterContentBlocks(lanes.solucion),
    otros: filterContentBlocks(lanes.otros),
  };
}

function otrosRenderable(blocks: TkDocBlock[]): TkDocBlock[] {
  return filterContentBlocks(blocks).filter((b) => {
    const title = blockPayloadTitle(b);
    return !(title && isStandardMappedTitle(title));
  });
}

function buildSectionDots(
  presence: Record<TkDocSectionKey, boolean>,
  commitsTitle: string,
  sinEvidenciaProblema = false,
): TkDocSectionDot[] {
  return TK_DOC_SECTION_ORDER.map((key) => {
    const meta = TK_DOC_STANDARD[key];
    const title =
      key === "commits" && "titleCerrado" in meta && presence.commits
        ? commitsTitle
        : meta.title;
    const notApplicable = key === "evidencias" && sinEvidenciaProblema;
    return {
      key,
      title,
      accent: meta.accent,
      hasContent: presence[key],
      notApplicable,
    };
  });
}

function sortCommits(commits: unknown[]): Record<string, unknown>[] {
  return [...(commits as Record<string, unknown>[])].sort(
    (a, b) => Number(a.sortKey ?? 0) - Number(b.sortKey ?? 0),
  );
}

/** Fila de tiempos que resume el bloque de commits — debe coincidir con la tabla. */
function isCommitsTiempoEntry(t: { name?: string; detail?: string; phase?: string }): boolean {
  const explicit = String(t.phase ?? "").trim().toLowerCase();
  if (explicit === "commits") return true;
  const text = `${t.name ?? ""} ${t.detail ?? ""}`.toLowerCase();
  return /commit|repositorio|trabajo en commits/i.test(text);
}

function heroBadgesFromTicket(tk: Record<string, unknown>): TkDocBlock[] {
  const label = tipoSolicitudDisplayLabel(extractTipoSolicitudApertura(tk));
  if (!label) return [];
  return [{ kind: "badge", sortKey: 0, payload: { label, tone: "primary" } }];
}

/** Particiona el ticket y calcula qué secciones estándar tienen contenido. */
export function buildTkDocViewModel(
  tk: Record<string, unknown>,
  opts?: {
    sortBlocks?: (blocks: TkDocBlock[]) => TkDocBlock[];
    isInfoTiquete?: (b: TkDocBlock, tk: Record<string, unknown>) => boolean;
    ticketEstadoCierre?: (tk: Record<string, unknown>) => string;
  },
): TkDocViewModel {
  const sortFn = opts?.sortBlocks ?? sortBlocks;
  const skipInfo = opts?.isInfoTiquete ?? isInfoTiquete;
  const estadoCierre = opts?.ticketEstadoCierre?.(tk) ?? "abierto";

  const content = sortFn((tk.content as TkDocBlock[]) ?? []).filter((b) => !skipInfo(b, tk));
  const badges = heroBadgesFromTicket(tk);
  const docEvidencias = extractTicketDocEvidencias(tk);

  const { solicitudParts, evidenciaIntro, bodyBlocks } = partitionTkDocStandard(
    tk,
    content.filter((b) => !["badge", "chip"].includes(String(b.kind).toLowerCase())),
  );

  const filteredBody = filterBodyBlocks(bodyBlocks, docEvidencias);
  let lanes = pruneLanes(partitionBodyLanes(filteredBody));

  const allBodyBlocks: TkDocBlock[] = [...filteredBody];

  for (const ctx of (tk.contexts as { content?: TkDocBlock[] }[]) ?? []) {
    const ctxFiltered = filterBodyBlocks(
      sortFn(ctx.content ?? []).filter((b) => !skipInfo(b, tk)),
      docEvidencias,
    );
    allBodyBlocks.push(...ctxFiltered);
    const ctxLanes = pruneLanes(partitionBodyLanes(ctxFiltered));
    lanes.causa.push(...ctxLanes.causa);
    lanes.verificacion.push(...ctxLanes.verificacion);
    lanes.solucion.push(...ctxLanes.solucion);
    lanes.otros.push(...ctxLanes.otros);
  }

  lanes = finalizeSolutionLane(lanes, allBodyBlocks);

  const allCommits = sortCommits([
    ...((tk.contexts as { commits?: unknown[] }[]) ?? []).flatMap((c) => c.commits ?? []),
    ...((tk.rootCommits as unknown[]) ?? []),
  ]);
  const commitMinutos = computeCommitTotals(allCommits).minutos;

  const tiempos = ((tk.tiempos as { name?: string; detail?: string; minutos?: number; phase?: string }[]) ?? [])
    .map((t) => {
      let minutos = Number(t.minutos ?? 0);
      if (isCommitsTiempoEntry(t) && commitMinutos > 0) {
        minutos = commitMinutos;
      } else {
        minutos = roundTkMinutosTo5(minutos);
      }
      return {
        name: String(t.name ?? ""),
        detail: String(t.detail ?? ""),
        minutos,
        phase: String(t.phase ?? "").trim() || undefined,
      };
    })
    .filter((t) => t.name && t.minutos > 0);

  const introText = String(evidenciaIntro ?? "").trim();
  const commitsTitle =
    estadoCierre === "cerrado"
      ? TK_DOC_STANDARD.commits.titleCerrado
      : TK_DOC_STANDARD.commits.title;

  const sectionPresence: Record<TkDocSectionKey, boolean> = {
    solicitud: textPartsHaveContent(solicitudParts),
    evidencias: !!introText || docEvidencias.length > 0,
    causa: laneHasContent(lanes.causa),
    verificacion: laneHasContent(lanes.verificacion),
    solucion: laneHasContent(lanes.solucion),
    commits: allCommits.length > 0,
    tiempos: tiempos.length > 0,
  };

  return {
    solicitudParts: solicitudParts.filter((p) => String(p ?? "").trim()),
    evidenciaIntro: introText || null,
    docEvidencias,
    lanes,
    otrosBlocks: otrosRenderable(lanes.otros),
    allCommits,
    tiempos,
    badges,
    sectionPresence,
    sectionDots: buildSectionDots(
      sectionPresence,
      commitsTitle,
      isTicketSinEvidenciaProblema(tk),
    ),
    commitsTitle,
  };
}
