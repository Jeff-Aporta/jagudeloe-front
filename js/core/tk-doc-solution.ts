/**
 * Estándar sección «Solución aplicada»:
 * 1. Texto introductorio (markdown)
 * 2. Evidencias inline (image)
 * 3. Árbol de archivos modificados (`file-tree`)
 * 4. Resto con contexto (`intro` en code/sql/json)
 */

import type { TkDocBlock } from "./tk-doc-layout.ts";

const INTRO_KINDS = new Set(["markdown", "md", "text"]);

export function isFileTreeBlock(b: TkDocBlock): boolean {
  const kind = String(b.kind ?? "").toLowerCase();
  return kind === "file-tree" || kind === "filetree";
}

function isImageBlock(b: TkDocBlock): boolean {
  const kind = String(b.kind ?? "").toLowerCase();
  return kind === "image" || kind === "img";
}

function sortByKey(a: TkDocBlock, b: TkDocBlock): number {
  return (a.sortKey ?? 0) - (b.sortKey ?? 0);
}

function isSolutionIntroBlock(b: TkDocBlock): boolean {
  return INTRO_KINDS.has(String(b.kind ?? "").toLowerCase());
}

/** Orden canónico dentro del carril solución. */
export function normalizeSolutionLane(blocks: TkDocBlock[]): TkDocBlock[] {
  if (!blocks.length) return blocks;

  const intro: TkDocBlock[] = [];
  const images: TkDocBlock[] = [];
  const trees: TkDocBlock[] = [];
  const rest: TkDocBlock[] = [];

  for (const b of blocks) {
    if (isFileTreeBlock(b)) trees.push(b);
    else if (isImageBlock(b)) images.push(b);
    else if (isSolutionIntroBlock(b)) intro.push(b);
    else rest.push(b);
  }

  intro.sort(sortByKey);
  images.sort(sortByKey);
  trees.sort(sortByKey);
  rest.sort(sortByKey);

  return [...intro, ...images, ...trees, ...rest];
}

/** Ubica `file-tree` en solución y lo quita de otros carriles. */
export function finalizeSolutionLane(
  lanes: { causa: TkDocBlock[]; verificacion: TkDocBlock[]; solucion: TkDocBlock[]; otros: TkDocBlock[] },
  allBlocks: TkDocBlock[],
): typeof lanes {
  const tree =
    lanes.solucion.find(isFileTreeBlock)
    ?? lanes.otros.find(isFileTreeBlock)
    ?? allBlocks.find(isFileTreeBlock);

  const solucionSansTree = lanes.solucion.filter((b) => !isFileTreeBlock(b));
  const solucion =
    tree && !solucionSansTree.some(isFileTreeBlock)
      ? normalizeSolutionLane([...solucionSansTree, tree])
      : normalizeSolutionLane(lanes.solucion);

  const stripTree = (list: TkDocBlock[]) => list.filter((b) => !isFileTreeBlock(b) || b === tree);

  return {
    ...lanes,
    solucion,
    otros: stripTree(lanes.otros),
    causa: stripTree(lanes.causa),
    verificacion: stripTree(lanes.verificacion),
  };
}

/** Payload mínimo para bloque estándar `file-tree`. */
export function buildFileTreeBlock(payload: {
  paths: string[];
  hints?: Record<string, string>;
  rootLabel?: string;
  sortKey?: number;
}): TkDocBlock {
  return {
    kind: "file-tree",
    sortKey: payload.sortKey ?? 21,
    payload: {
      rootLabel: payload.rootLabel ?? "ISS",
      paths: payload.paths,
      hints: payload.hints ?? {},
    },
  };
}
