/** Markdown ligero para diligencias TK — tablas pipe, párrafos, viñetas, headings.
 *  Inline: **negrilla**, `código`, [enlaces], {{mdi:icon}} / {{thumb-up}} (Iconify), HTML en la misma cadena. */

export type MdTable = { headers: string[]; rows: string[][] };

export type MdBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "bullet"; text: string }
  | { type: "ordered-list"; items: string[] }
  | { type: "table"; table: MdTable }
  | { type: "code"; text: string; language?: string };

const MD_TABLE_ROW = /^\|.+\|$/;
/** Filas pegadas en una sola línea: `| A | B | | C | D |` */
const GLUED_ROW_BOUNDARY = /\|\s+\|/;

export function normalizeMdInput(text: unknown): string {
  return String(text ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\\n/g, "\n");
}

export function isMdTableLine(line: string): boolean {
  return MD_TABLE_ROW.test(String(line ?? "").trim());
}

export function isMdTableSeparator(line: string): boolean {
  const t = String(line ?? "").trim();
  if (!MD_TABLE_ROW.test(t)) return false;
  return t.replace(/[|\s:]/g, "").replace(/-/g, "") === "";
}

export function parseMdTableCells(line: string): string[] {
  return String(line ?? "")
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());
}

export function parseMdPipeTable(lines: string[]): MdTable | null {
  if (!lines.length || !isMdTableLine(lines[0])) return null;
  const headers = parseMdTableCells(lines[0]);
  let i = 1;
  if (lines[i] && isMdTableSeparator(lines[i])) i += 1;
  const rows = lines.slice(i).filter(isMdTableLine).map(parseMdTableCells);
  if (!headers.length) return null;
  return { headers, rows };
}

function normalizeTableRowSegment(part: string): string {
  let s = String(part ?? "").trim();
  if (!s) return "";
  if (!s.startsWith("|")) s = `| ${s}`;
  if (!s.endsWith("|")) s = `${s} |`;
  return s.replace(/\s+/g, " ").trim();
}

/** Separa filas pegadas con `| |` y texto suelto al final. */
export function splitGluedTableText(raw: string): { rows: string[]; prose: string } {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed.startsWith("|") || !GLUED_ROW_BOUNDARY.test(trimmed)) {
    return { rows: [], prose: trimmed };
  }

  const parts = trimmed.split(GLUED_ROW_BOUNDARY);
  const rows = parts.map(normalizeTableRowSegment).filter(Boolean);
  if (!rows.length) return { rows: [], prose: trimmed };

  const last = rows[rows.length - 1];
  const m = last.match(/^(\|(?:[^|]+\|)+)\s+(.+)$/);
  if (m && !/^\|/.test(m[2].trim())) {
    rows[rows.length - 1] = m[1].trim();
    return { rows, prose: m[2].trim().replace(/\s*\|\s*$/, "") };
  }

  return { rows, prose: "" };
}

function blocksFromTableLines(lines: string[], tail = ""): MdBlock[] {
  const table = parseMdPipeTable(lines);
  if (!table) return [{ type: "paragraph", text: [...lines, tail].filter(Boolean).join(" ") }];
  const out: MdBlock[] = [{ type: "table", table }];
  if (tail.trim()) out.push({ type: "paragraph", text: tail.trim() });
  return out;
}

function expandGluedTableLine(line: string): MdBlock[] | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith("|") || !GLUED_ROW_BOUNDARY.test(trimmed)) return null;
  const { rows, prose } = splitGluedTableText(trimmed);
  if (!rows.length) return null;
  return blocksFromTableLines(rows, prose);
}

/** Recupera tablas aplanadas en un solo párrafo. */
function recoverGluedParagraph(text: string): MdBlock[] | null {
  const t = text.trim();
  if (!t.startsWith("|") || !GLUED_ROW_BOUNDARY.test(t)) return null;
  const { rows, prose } = splitGluedTableText(t);
  if (rows.length < 2) return null;
  return blocksFromTableLines(rows, prose);
}

function recoverBlocks(blocks: MdBlock[]): MdBlock[] {
  const out: MdBlock[] = [];
  for (const b of blocks) {
    if (b.type !== "paragraph") {
      out.push(b);
      continue;
    }
    const recovered = recoverGluedParagraph(b.text);
    if (recovered) out.push(...recovered);
    else out.push(b);
  }
  return out;
}

const ORDERED_ITEM_RX = /^\d+\.\s+(.*)$/;
const FENCE_OPEN_RX = /^```(\w*)$/;

function parseFencedCodeBlock(lines: string[], start: number): { block: MdBlock; next: number } | null {
  const open = lines[start]?.trim() ?? "";
  const openMatch = open.match(FENCE_OPEN_RX);
  if (!openMatch) return null;

  const language = openMatch[1]?.trim() || undefined;
  const body: string[] = [];
  let j = start + 1;
  while (j < lines.length) {
    const raw = lines[j];
    if (raw.trim() === "```") {
      return {
        block: { type: "code", text: body.join("\n").replace(/\s+$/, ""), ...(language ? { language } : {}) },
        next: j + 1,
      };
    }
    body.push(raw);
    j += 1;
  }

  return {
    block: { type: "code", text: body.join("\n").replace(/\s+$/, ""), ...(language ? { language } : {}) },
    next: j,
  };
}

function parseOrderedListLines(lines: string[], start: number): { items: string[]; next: number } {
  const items: string[] = [];
  let j = start;
  while (j < lines.length) {
    const raw = lines[j].trim();
    if (!raw) break;
    const m = raw.match(ORDERED_ITEM_RX);
    if (!m) break;
    items.push(m[1].trim());
    j += 1;
  }
  return { items, next: j };
}

/** Parte texto markdown en bloques estructurados. */
export function splitMarkdownBlocks(text: unknown): MdBlock[] {
  const out: MdBlock[] = [];
  let para: string[] = [];

  function flushPara() {
    if (!para.length) return;
    out.push({ type: "paragraph", text: para.join(" ") });
    para = [];
  }

  const lines = normalizeMdInput(text).split("\n");
  for (let li = 0; li < lines.length; li++) {
    const line = lines[li].trim();
    if (!line) {
      flushPara();
      continue;
    }

    if (line.startsWith("## ") || line.startsWith("# ")) {
      flushPara();
      out.push({ type: "heading", text: line.replace(/^#+\s*/, "") });
      continue;
    }

    if (FENCE_OPEN_RX.test(line)) {
      flushPara();
      const fenced = parseFencedCodeBlock(lines, li);
      if (fenced) {
        out.push(fenced.block);
        li = fenced.next - 1;
        continue;
      }
    }

    if (/^[-*]\s+/.test(line)) {
      flushPara();
      out.push({ type: "bullet", text: line.replace(/^[-*]\s+/, "") });
      continue;
    }

    if (ORDERED_ITEM_RX.test(line)) {
      flushPara();
      const { items, next } = parseOrderedListLines(lines, li);
      if (items.length) {
        out.push({ type: "ordered-list", items });
        li = next - 1;
        continue;
      }
    }

    if (isMdTableLine(line)) {
      flushPara();
      const glued = expandGluedTableLine(line);
      if (glued) {
        out.push(...glued);
        continue;
      }
      const tableLines: string[] = [line];
      while (li + 1 < lines.length && isMdTableLine(lines[li + 1].trim())) {
        li += 1;
        tableLines.push(lines[li].trim());
      }
      const table = parseMdPipeTable(tableLines);
      if (table) out.push({ type: "table", table });
      else para.push(...tableLines);
      continue;
    }

    para.push(line);
  }

  flushPara();
  return recoverBlocks(out);
}

/** true si el markdown es únicamente una tabla pipe (sin párrafos extra). */
export function markdownTextIsTableOnly(text: unknown): boolean {
  const raw = normalizeMdInput(text).trim();
  if (!raw.startsWith("|")) return false;

  const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
  const table = parseMdPipeTable(lines);
  if (!table || !table.headers.length) return false;

  const prose = raw
    .replace(/^\|.+\|\s*$/gm, "")
    .replace(/^\|[\s:|-]+\|\s*$/gm, "")
    .trim();
  return !prose;
}

/** Extrae matrix [cabecera, ...filas] de markdown tabla-only. */
export function markdownTableMatrixFromText(text: unknown): string[][] | null {
  if (!markdownTextIsTableOnly(text)) return null;
  const lines = normalizeMdInput(text).split("\n").map((l) => l.trim()).filter(Boolean);
  const table = parseMdPipeTable(lines);
  if (!table) return null;
  return [table.headers, ...table.rows];
}
