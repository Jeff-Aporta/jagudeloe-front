import { stripRedundantTicketHtml, shouldSkipTicketContentBlock } from "../tkHtml.ts";
import { normalizeTkContentBlock } from "../../core/tk-code-policy.ts";
import { isStandardMappedTitle } from "../../core/tk-doc-sections.ts";
import { SECTION_META } from "./constants.ts";

export function sortBlocks(blocks) {
  return (blocks || []).slice().sort((a, b) => (a.sortKey ?? 0) - (b.sortKey ?? 0)).map(normalizeTkContentBlock);
}

export function isImageBlock(b) {
  const kind = String(b?.kind || "").toLowerCase();
  return kind === "image" || kind === "img";
}

/** Agrupa imágenes consecutivas en un solo card de Evidencia. */
export function groupImageBlocks(blocks) {
  const out = [];
  let i = 0;
  while (i < blocks.length) {
    if (!isImageBlock(blocks[i])) {
      out.push(blocks[i]);
      i++;
      continue;
    }
    const group = [];
    while (i < blocks.length && isImageBlock(blocks[i])) {
      group.push(blocks[i]);
      i++;
    }
    out.push(group.length === 1 ? group[0] : { kind: "image-group", blocks: group, sortKey: group[0].sortKey ?? 0 });
  }
  return out;
}

export function isInfoTiquete(b, tk) {
  return shouldSkipTicketContentBlock(b, tk);
}

export function sectionTitleForBlock(b, meta) {
  const payloadTitle = String(b.payload?.title ?? "").trim();
  if (payloadTitle) {
    if (isStandardMappedTitle(payloadTitle)) return meta.title;
    return payloadTitle;
  }
  const kind = String(b.kind || "text").toLowerCase();
  if (kind === "html" || kind === "body") {
    const cleaned = stripRedundantTicketHtml(String(b.payload?.html ?? b.payload?.body ?? b.payload?.content ?? ""));
    const m = /<h2\b[^>]*>([\s\S]*?)<\/h2>/i.exec(cleaned);
    if (m) {
      const h2 = m[1].replace(/<[^>]+>/g, "").trim();
      if (isStandardMappedTitle(h2)) return meta.title;
      return h2;
    }
  }
  return meta.title;
}

export function sectionMetaForBlock(b) {
  const kind = String(b.kind || "text").toLowerCase();
  const base = SECTION_META[kind] || { icon: "mdi:file-document-outline", title: "Detalle", accent: "#64748b" };
  if (b.payload?.title) return base;
  if (kind === "html" || kind === "body") {
    return { ...base, title: sectionTitleForBlock(b, base) };
  }
  return base;
}
