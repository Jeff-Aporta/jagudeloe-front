/** Bloques TK_CONTENT — utilidades de filtrado para la vista web. */

export interface TkBlockLike {
  kind?: string;
  payload?: Record<string, unknown>;
}

/** HTML mínimo generado por seeds cuando no existe temp/*-diligencia.html. */
export function isSeedStubHtmlBlock(block: TkBlockLike | null | undefined): boolean {
  if (!block) return false;
  const kind = String(block.kind || "").toLowerCase();
  if (kind !== "html" && kind !== "body") return false;
  const p = block.payload || {};
  const html = String(p.html ?? p.body ?? p.content ?? "").trim();
  if (!html) return true;
  if (!/^<section[\s>]/i.test(html)) return false;
  if (!/<h2>\s*TK-\d+\s*<\/h2>/i.test(html)) return false;
  if (html.length > 2800) return false;
  return (
    /<li>\s*Creaci[oó]n:/i.test(html) ||
    /<p>\s*Implementaci[oó]n/i.test(html) ||
    /<p>\s*Actualizaci[oó]n de \d+ instrucciones/i.test(html) ||
    /<p>\s*Revisi[oó]n de obsolescencia/i.test(html)
  );
}

export function filterDisplayBlocks<T extends TkBlockLike>(blocks: T[] | null | undefined): T[] {
  return (blocks || []).filter((b) => !isSeedStubHtmlBlock(b));
}
