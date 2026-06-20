/** Clasificación de bloques TK_CONTENT en secciones estándar del visor doc. */

import type { TkDocBlock } from "./tk-doc-types.ts";
import {
  blockPayloadTitle,
  classifyBlockLane,
  readBlockDocLane,
  resolveBlockBodyLane,
  type TkDocLane,
} from "./tk-doc-lanes.ts";

export type { TkDocLane };
export { blockPayloadTitle, classifyBlockLane };

export type TkDocBodyLanes = Record<TkDocLane, TkDocBlock[]>;

/** true si el título no puede ser encabezado de subsección (solo cards estándar). */
export function isStandardMappedTitle(title: string): boolean {
  const mapped = classifyBlockLane(title);
  return mapped != null && mapped !== "otros";
}

function isStepsKind(kind: string): boolean {
  return kind === "steps" || kind === "stepper";
}

function isFileTreeKind(kind: string): boolean {
  return kind === "file-tree" || kind === "filetree";
}

function isCodeKind(kind: string): boolean {
  return kind === "code" || kind === "sql";
}

function normTitle(title: string): string {
  return title.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
}

function isConfigArtifactTitle(title: string): boolean {
  return /referencias de configuracion|system-prompts|openai-infomap|\.json\b/i.test(normTitle(title));
}

function isSolutionScopeTitle(title: string): boolean {
  return /alcance esperado|alcance del analisis|alcance tecnico|alcance numerico/i.test(normTitle(title));
}

/** Quita payload.title cuando pertenece a un carril estándar (no duplicar header). */
export function stripStandardBlockTitle(b: TkDocBlock): TkDocBlock {
  const title = blockPayloadTitle(b);
  if (!isStandardMappedTitle(title)) return b;
  const payload = { ...(b.payload ?? {}) };
  delete payload.title;
  return { ...b, payload };
}

function targetLaneForBlock(b: TkDocBlock, sticky: TkDocLane): TkDocLane {
  return resolveBlockBodyLane(b, sticky);
}

function sweepOtrosIntoStandard(lanes: TkDocBodyLanes): TkDocBodyLanes {
  const out = { ...lanes, otros: [...lanes.otros] };
  const keep: TkDocBlock[] = [];

  for (const b of out.otros) {
    const explicit = readBlockDocLane(b);
    if (explicit && explicit !== "otros" && explicit !== "solicitud" && explicit !== "evidencias") {
      out[explicit].push(stripStandardBlockTitle(b));
      continue;
    }

    const title = blockPayloadTitle(b);
    const kind = String(b.kind ?? "").toLowerCase();
    const mapped = classifyBlockLane(title);

    if (mapped && mapped !== "otros") {
      out[mapped].push(stripStandardBlockTitle(b));
      continue;
    }
    if (isSolutionScopeTitle(title) || isConfigArtifactTitle(title) || isCodeKind(kind) || isFileTreeKind(kind)) {
      out.solucion.push(stripStandardBlockTitle(b));
      continue;
    }
    if (isStepsKind(kind)) {
      out.verificacion.push(stripStandardBlockTitle(b));
      continue;
    }
    keep.push(b);
  }

  out.otros = keep;
  return out;
}

/** Agrupa bloques del cuerpo en causas → verificación → solución → otros. */
export function partitionBodyLanes(blocks: TkDocBlock[]): TkDocBodyLanes {
  const out: TkDocBodyLanes = { causa: [], verificacion: [], solucion: [], otros: [] };
  let sticky: TkDocLane = "otros";

  for (const raw of blocks) {
    const lane = targetLaneForBlock(raw, sticky);
    sticky = lane;
    out[lane].push(stripStandardBlockTitle(raw));
  }

  return sweepOtrosIntoStandard(out);
}
