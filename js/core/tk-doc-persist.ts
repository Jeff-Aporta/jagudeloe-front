/** Persistencia parcial TK_DOC — merge de bloques editados en content[]. */

import { expandEditableBlockForJson, compactEditableBlockAfterJsonEdit } from "./tk-doc-json-expand.ts";
import { normalizeDocContentBlocks } from "./tk-doc-normalize.ts";
import type { TkDocEditableBlock } from "./tk-doc-types.ts";

export type { TkDocEditableBlock };

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
}

export function docJsonBlocksFromTicket(tk: Record<string, unknown>): TkDocEditableBlock[] {
  const doc = asRecord(tk.doc);
  const fromDoc = Array.isArray(doc.blocks) ? doc.blocks : [];
  const fromContent = Array.isArray(tk.content) ? tk.content : [];
  const raw = fromDoc.length ? fromDoc : fromContent;
  return normalizeDocContentBlocks(raw.map((item, idx) => normalizeEditableBlock(item, idx)));
}

function normalizeEditableBlock(raw: unknown, idx: number): TkDocEditableBlock {
  const b = asRecord(raw);
  const nested = b.blocks;
  const block: TkDocEditableBlock = {
    kind: String(b.kind ?? "markdown"),
    sortKey: Number(b.sortKey ?? b.SORTKEY ?? idx),
    payload: asRecord(b.payload ?? b.PAYLOAD),
  };
  if (Array.isArray(nested) && nested.length) {
    block.blocks = nested.map((child, i) => normalizeEditableBlock(child, i));
  }
  return block;
}

/** Bloques de una card → JSON editable (uno u array). Normaliza tablas md → matrix. */
export function blocksToEditableJson(blocks: TkDocEditableBlock[]): string {
  const mapped = normalizeDocContentBlocks(blocks ?? [])
    .map(expandEditableBlockForJson)
    .map(stripViewOnlyFields);
  const payload = mapped.length === 1 ? mapped[0] : mapped;
  return JSON.stringify(payload, null, 2);
}

function stripViewOnlyFields(b: TkDocEditableBlock): TkDocEditableBlock {
  const out: TkDocEditableBlock = {
    kind: b.kind,
    sortKey: b.sortKey,
    payload: b.payload ?? {},
  };
  if (b.blocks?.length) out.blocks = b.blocks.map(stripViewOnlyFields);
  return out;
}

export function parseEditableJson(text: string, expectCount: number): TkDocEditableBlock[] {
  const parsed = JSON.parse(text) as unknown;
  const list = Array.isArray(parsed) ? parsed : [parsed];
  if (!list.length) throw new Error("JSON vacío");
  if (expectCount === 1 && list.length !== 1) {
    throw new Error("Esta card tiene un bloque: el JSON debe ser un objeto, no un array.");
  }
  return list.map((item, idx) => compactEditableBlockAfterJsonEdit(normalizeEditableBlock(item, idx)));
}

export function mergeDocContentBlocks(
  all: TkDocEditableBlock[],
  sectionBlocks: TkDocEditableBlock[],
  edited: TkDocEditableBlock[],
): TkDocEditableBlock[] {
  const replaceKeys = new Set(sectionBlocks.map((b) => Number(b.sortKey)));
  const kept = all.filter((b) => !replaceKeys.has(Number(b.sortKey)));
  return [...kept, ...edited].sort((a, b) => Number(a.sortKey) - Number(b.sortKey));
}

/** Resuelve bloques persistibles de una card (desagrupa image-group UI). */
export function docJsonBlocksForCard(blockOrGroup: unknown): TkDocEditableBlock[] {
  const b = asRecord(blockOrGroup);
  const kind = String(b.kind ?? "").toLowerCase();
  let blocks: TkDocEditableBlock[];
  if (kind === "image-group" && Array.isArray(b.blocks)) {
    blocks = b.blocks.map((child, idx) => normalizeEditableBlock(child, idx));
  } else {
    blocks = [normalizeEditableBlock(blockOrGroup, 0)];
  }
  return normalizeDocContentBlocks(blocks);
}

export function contentForApi(blocks: TkDocEditableBlock[]) {
  // Materializa presets (preset → spec completa) y quita el `preset` para que
  // la BD almacene siempre el JSON completo que genera el diagrama.
  return normalizeDocContentBlocks(blocks)
    .map(expandEditableBlockForJson)
    .map(compactEditableBlockAfterJsonEdit)
    .map((b) => ({
      kind: b.kind,
      sortKey: b.sortKey,
      payload: b.payload ?? {},
      ...(b.blocks?.length ? { blocks: b.blocks } : {}),
    }));
}
