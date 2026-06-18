/** Utilidades de contenido para bloques TK_CONTENT. */

import type { TkDocBlock } from "./tk-doc-layout.ts";
import { blockPayloadTitle } from "./tk-doc-sections.ts";
import { stepsBlockHasContent } from "./tk-doc-steps.ts";

const MD_KIND = new Set(["markdown", "md", "text", "html", "body"]);

function blockText(b: TkDocBlock): string {
  const p = b.payload ?? {};
  return String(p.text ?? p.body ?? p.html ?? p.content ?? "").trim();
}

/** true si el bloque aporta contenido visible en el doc. */
export function blockHasContent(b: TkDocBlock): boolean {
  const kind = String(b.kind ?? "").toLowerCase();

  if (kind === "image-group") {
    return (b.blocks ?? []).some(blockHasContent);
  }

  if (kind === "image" || kind === "img") {
    const p = b.payload ?? {};
    return !!(String(p.url ?? p.src ?? "").trim());
  }

  if (kind === "table") {
    const rows = b.payload?.rows;
    return Array.isArray(rows) && rows.length > 0;
  }

  if (kind === "code" || kind === "sql") {
    return !!String(b.payload?.code ?? b.payload?.sql ?? "").trim();
  }

  if (kind === "file-tree" || kind === "filetree") {
    const paths = b.payload?.paths ?? b.payload?.files;
    return Array.isArray(paths) && paths.length > 0;
  }

  if (kind === "badges" || kind === "badge-row") {
    const items = b.payload?.items ?? b.payload?.badges;
    return Array.isArray(items) && items.length > 0;
  }

  if (kind === "steps" || kind === "stepper") {
    const phases = b.payload?.phases ?? b.payload?.steps;
    return stepsBlockHasContent(phases);
  }

  if (kind === "url" || kind === "link") {
    return !!String(b.payload?.url ?? b.payload?.href ?? "").trim();
  }

  if (MD_KIND.has(kind)) {
    return blockText(b).length > 0;
  }

  return blockText(b).length > 0 || !!blockPayloadTitle(b);
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
