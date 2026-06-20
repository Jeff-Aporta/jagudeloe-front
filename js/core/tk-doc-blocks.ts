/** Utilidades de contenido para bloques TK_CONTENT. */

import type { TkDocBlock } from "./tk-doc-layout.ts";
import { interpreterBlockHasContent } from "./tk-doc-interpreter.ts";

/** true si el bloque aporta contenido visible en el doc. */
export function blockHasContent(b: TkDocBlock): boolean {
  return interpreterBlockHasContent(b);
}

export function filterContentBlocks(blocks: TkDocBlock[]): TkDocBlock[] {
  return (blocks ?? []).filter(blockHasContent);
}

export function laneHasContent(blocks: TkDocBlock[]): boolean {
  return filterContentBlocks(blocks).length > 0;
}

export function textPartsHaveContent(parts: string[]): boolean {
  return (parts ?? []).some((p) => String(p ?? "").trim().length > 0);
}
