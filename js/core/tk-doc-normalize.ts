/** Normalización TK_DOC al persistir — tablas a matrix; markdown con tablas → kind=table. */



import { splitMarkdownBlocks, markdownTextIsTableOnly, markdownTableMatrixFromText, type MdBlock } from "./tk-markdown.ts";

import { normalizeTablePayload, tableBlockPayload, type TableSpec } from "./tk-doc-table.ts";

import type { TkDocEditableBlock } from "./tk-doc-types.ts";



const MD_KIND = new Set(["markdown", "md", "text"]);



function asRecord(v: unknown): Record<string, unknown> {

  return v && typeof v === "object" ? (v as Record<string, unknown>) : {};

}



function blockText(b: TkDocEditableBlock): string {

  const p = b.payload ?? {};

  return String(p.text ?? p.body ?? p.html ?? p.content ?? "");

}



function laneFromPayload(p: Record<string, unknown>): Record<string, unknown> {

  const out: Record<string, unknown> = {};

  for (const k of ["docLane", "section", "lane"] as const) {

    if (p[k] != null && String(p[k]).trim()) out[k] = p[k];

  }

  return out;

}



function mdBlockToText(block: MdBlock): string {

  if (block.type === "paragraph") return block.text;

  if (block.type === "heading") return `## ${block.text}`;

  if (block.type === "bullet") return `- ${block.text}`;

  if (block.type === "ordered-list") return block.items.map((item, i) => `${i + 1}. ${item}`).join("\n");

  return "";

}



function tableSpecFromMatrix(matrix: string[][], meta: Record<string, unknown>): TableSpec {
  const headers = matrix[0]?.map((h) => String(h ?? "")) ?? [];
  const rows = matrix.slice(1).map((row) => row.map((c) => String(c ?? "")));
  return {
    title: String(meta.title ?? ""),
    headers,
    rows,
    matrix,
  };
}

function markdownTableOnlyBlock(b: TkDocEditableBlock): TkDocEditableBlock[] | null {
  const text = blockText(b);
  const matrix = markdownTableMatrixFromText(text);
  if (!matrix) return null;

  const lane = laneFromPayload(b.payload ?? {});
  const title = String(b.payload?.title ?? "").trim();
  const spec = tableSpecFromMatrix(matrix, { title });

  return [
    {
      kind: "table",
      sortKey: b.sortKey,
      payload: tableBlockPayload(spec, {
        ...lane,
        ...(title ? { title } : {}),
      }),
    },
  ];
}

function tableSpecFromMd(table: { headers: string[]; rows: string[][] }, meta: Record<string, unknown>): TableSpec {

  return {

    title: String(meta.title ?? ""),

    headers: table.headers,

    rows: table.rows,

    matrix: [table.headers, ...table.rows],

  };

}



function splitMarkdownBlock(b: TkDocEditableBlock): TkDocEditableBlock[] {

  const text = blockText(b);

  if (!text.trim()) return [b];



  const parts = splitMarkdownBlocks(text);

  const tables = parts.filter((p) => p.type === "table") as Array<{ type: "table"; table: { headers: string[]; rows: string[][] } }>;

  if (!tables.length) return [b];



  const prose = parts

    .filter((p) => p.type !== "table")

    .map(mdBlockToText)

    .filter(Boolean)

    .join("\n\n")

    .trim();



  const lane = laneFromPayload(b.payload ?? {});

  const baseKey = Number(b.sortKey ?? 0);

  const out: TkDocEditableBlock[] = [];



  if (prose) {

    out.push({

      kind: b.kind,

      sortKey: baseKey,

      payload: { ...b.payload, text: prose },

    });

  }



  tables.forEach((part, i) => {

    const title = !prose && i === 0 ? String(b.payload?.title ?? "") : "";

    const spec = tableSpecFromMd(part.table, { title });

    out.push({

      kind: "table",

      sortKey: baseKey + (prose ? 0.001 : 0) + i * 0.001,

      payload: tableBlockPayload(spec, {

        ...lane,

        ...(title ? { title } : {}),

      }),

    });

  });



  return out;

}



function normalizeBlock(b: TkDocEditableBlock): TkDocEditableBlock[] {

  const kind = String(b.kind ?? "").toLowerCase();



  if (kind === "table") {

    return [{ ...b, payload: normalizeTablePayload(b.payload) }];

  }



  if (MD_KIND.has(kind)) {
    const tableOnly = markdownTableOnlyBlock(b);
    if (tableOnly) return tableOnly;
    return splitMarkdownBlock(b);
  }



  return [b];

}



/** Normaliza bloques antes de PATCH TK_DOC (matrix canónico, tablas md extraídas). */

export function normalizeDocContentBlocks(blocks: TkDocEditableBlock[]): TkDocEditableBlock[] {

  const out: TkDocEditableBlock[] = [];

  for (const b of blocks ?? []) {

    out.push(...normalizeBlock(b));

  }

  return out.sort((a, b) => Number(a.sortKey) - Number(b.sortKey));

}


