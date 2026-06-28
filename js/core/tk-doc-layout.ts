/** Normalización de bloques TK para vista doc homogénea (estándar 1436238 / 1437976). */

import { stripRedundantTicketHtml } from "../ui/tkHtml.ts";
import { readBlockDocLane } from "./tk-doc-lanes.ts";

export type { TkDocBlock } from "./tk-doc-types.ts";
import type { TkDocBlock } from "./tk-doc-types.ts";

const MD_KIND = new Set(["markdown", "md", "text"]);
const TK_RESUMEN_MAX = 560;

export function tkPlainText(raw: unknown): string {
  return String(raw ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\*\*|__|`/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function tkTextsOverlap(a: unknown, b: unknown): boolean {
  const x = tkPlainText(a);
  const y = tkPlainText(b);
  if (!x || !y) return false;
  if (x === y) return true;
  const n = Math.min(160, x.length, y.length);
  if (n < 40) return false;
  return x.slice(0, n) === y.slice(0, n) || x.includes(y.slice(0, n)) || y.includes(x.slice(0, n));
}

function blockText(b: TkDocBlock): string {
  const p = b.payload ?? {};
  return String(p.text ?? p.body ?? p.html ?? p.content ?? "");
}

function isUntitledMarkdown(b: TkDocBlock): boolean {
  const kind = String(b.kind ?? "").toLowerCase();
  if (!MD_KIND.has(kind)) return false;
  return !String(b.payload?.title ?? "").trim();
}

/** Tarjeta resumen bajo el hero — solo párrafo corto y no duplicado del primer bloque. */
export function shouldShowTkResumenPaper(tk: Record<string, unknown>, content: TkDocBlock[]): boolean {
  const resumen = String(tk.resumen ?? "").trim();
  if (!resumen || resumen.length > TK_RESUMEN_MAX) return false;
  const first = content.find((b) => MD_KIND.has(String(b.kind ?? "").toLowerCase()));
  if (first && tkTextsOverlap(resumen, blockText(first))) return false;
  return true;
}

function splitHtmlSections(html: string): { title: string; body: string }[] {
  const cleaned = stripRedundantTicketHtml(html).trim();
  if (!cleaned) return [];
  if (!/<h2\b/i.test(cleaned)) return [{ title: "Detalle", body: cleaned }];

  const chunks = cleaned.split(/(?=<h2\b)/i).map((s) => s.trim()).filter(Boolean);
  return chunks.map((chunk) => {
    const m = /<h2\b[^>]*>([\s\S]*?)<\/h2>/i.exec(chunk);
    const title = m ? tkPlainText(m[1]) || "Detalle" : "Detalle";
    const body = m ? chunk.replace(m[0], "").trim() : chunk;
    return { title, body };
  }).filter((s) => s.body || s.title !== "Detalle");
}

function expandMarkdownByHeadings(block: TkDocBlock): TkDocBlock[] {
  const text = String(block.payload?.text ?? block.payload?.body ?? "");
  if (String(block.payload?.title ?? "").trim() || !/^#{2,3}\s/m.test(text)) return [block];

  const segments = text.split(/\n(?=#{2,3}\s)/).map((s) => s.trim()).filter(Boolean);
  if (segments.length < 2) return [block];

  const base = block.sortKey ?? 0;
  return segments.map((seg, i) => {
    const m = /^(#{2,3})\s+(.+?)(?:\n|$)/.exec(seg);
    if (!m) {
      return { ...block, sortKey: base + i * 0.01, payload: { ...block.payload, text: seg } };
    }
    const body = seg.slice(m[0].length).trim();
    return {
      kind: block.kind,
      sortKey: base + i * 0.01,
      payload: { ...block.payload, title: m[2].trim(), text: body },
    };
  });
}

function expandHtmlBlock(block: TkDocBlock): TkDocBlock[] {
  const html = String(block.payload?.html ?? block.payload?.body ?? block.payload?.content ?? "");
  const sections = splitHtmlSections(html);
  if (sections.length <= 1 && sections[0]?.title === "Detalle") return [block];

  const base = block.sortKey ?? 0;
  return sections.map((sec, i) => ({
    kind: "html",
    sortKey: base + i * 0.01,
    payload: { title: sec.title, html: sec.body },
  }));
}

/** Expande HTML por h2 y markdown por ##; quita intro duplicada del resumen. */
export function normalizeTkDocBlocks(tk: Record<string, unknown>, content: TkDocBlock[]): TkDocBlock[] {
  const resumen = String(tk.resumen ?? "").trim();
  const showResumen = shouldShowTkResumenPaper(tk, content);

  const expanded: TkDocBlock[] = [];
  for (const b of content) {
    const kind = String(b.kind ?? "").toLowerCase();
    if (kind === "html" || kind === "body") {
      expanded.push(...expandHtmlBlock(b));
      continue;
    }
    if (MD_KIND.has(kind)) {
      expanded.push(...expandMarkdownByHeadings(b));
      continue;
    }
    expanded.push(b);
  }

  if (!expanded.length) return expanded;

  const first = expanded[0];
  if (
    showResumen &&
    isUntitledMarkdown(first) &&
    resumen &&
    tkTextsOverlap(resumen, blockText(first))
  ) {
    return expanded.slice(1);
  }

  if (
    !showResumen &&
    isUntitledMarkdown(first) &&
    resumen &&
    tkTextsOverlap(resumen, blockText(first)) &&
    blockText(first).length < resumen.length + 40
  ) {
    return expanded;
  }

  return expanded;
}

const MD_DOC_KIND = new Set(["markdown", "md", "text"]);

function isSolicitudTitle(title: string): boolean {
  return /^(solicitud|objetivo|requerimiento)\b/i.test(title.trim());
}

function isEvidenciaTitle(title: string): boolean {
  return /evidencia/i.test(title.trim());
}

function isTiempoSectionTitle(title: string): boolean {
  return /^resumen de tiempos\b/i.test(title.trim());
}

function pushSolicitudPart(parts: string[], text: string) {
  const t = String(text ?? "").trim();
  if (!t) return;
  if (parts.some((p) => tkTextsOverlap(p, t))) return;
  parts.push(t);
}

export type TkDocStandardPartition = {
  solicitudParts: string[];
  evidenciaIntro: string | null;
  bodyBlocks: TkDocBlock[];
};

/**
 * Orden estándar del doc web:
 * 1. Solicitud y objetivo (resumen BD + intro content)
 * 2. Evidencias del problema (texto + galería)
 * 3. Resto del contenido
 * (Resumen de tiempos y commits se renderizan al final en TicketDocWebView.)
 */
export function partitionTkDocStandard(
  tk: Record<string, unknown>,
  content: TkDocBlock[],
): TkDocStandardPartition {
  const expanded = normalizeTkDocBlocks(tk, content);
  const solicitudParts: string[] = [];
  const bodyBlocks: TkDocBlock[] = [];
  let evidenciaIntro: string | null = null;
  let mdIndex = 0;
  let consumedUntitledIntro = false;

  const resumen = String(tk.resumen ?? "").trim();
  if (resumen) solicitudParts.push(resumen);

  for (const b of expanded) {
    const kind = String(b.kind ?? "").toLowerCase();
    const title = String(b.payload?.title ?? "").trim();
    const text = blockText(b);
    const docLane = readBlockDocLane(b);

    if (docLane === "solicitud" && MD_DOC_KIND.has(kind)) {
      pushSolicitudPart(solicitudParts, text);
      continue;
    }

    if (docLane === "evidencias" && MD_DOC_KIND.has(kind)) {
      if (!evidenciaIntro) evidenciaIntro = text;
      continue;
    }

    if (MD_DOC_KIND.has(kind)) {
      const isEarly = mdIndex < 2 || (b.sortKey ?? 0) < 3;
      mdIndex += 1;

      if (isTiempoSectionTitle(title)) continue;

      if (!consumedUntitledIntro && !title && isEarly) {
        pushSolicitudPart(solicitudParts, text);
        consumedUntitledIntro = true;
        continue;
      }

      if (!evidenciaIntro && isEvidenciaTitle(title)) {
        if (docLane && docLane !== "evidencias") {
          bodyBlocks.push(b);
          continue;
        }
        evidenciaIntro = text;
        continue;
      }

      if (isEarly && isSolicitudTitle(title)) {
        pushSolicitudPart(solicitudParts, text);
        continue;
      }
    }

    bodyBlocks.push(b);
  }

  if (!solicitudParts.length) {
    const idx = bodyBlocks.findIndex((b) => MD_DOC_KIND.has(String(b.kind ?? "").toLowerCase()));
    if (idx >= 0) {
      pushSolicitudPart(solicitudParts, blockText(bodyBlocks[idx]));
      bodyBlocks.splice(idx, 1);
    }
  }

  return { solicitudParts, evidenciaIntro, bodyBlocks };
}
