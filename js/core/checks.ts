/** Utilidades checks — sqlexec + tickets (BITACORA_REVISADO). */
export type DotState = "complete" | "partial" | "none";

export function aggregateDotState(keys: string[], map: Record<string, boolean>): DotState | null {
  const list = keys.filter(Boolean);
  if (!list.length) return null;
  let checked = 0;
  for (const k of list) { if (map[k]) checked += 1; }
  if (checked === list.length) return "complete";
  if (checked === 0) return "none";
  return "partial";
}

export function collectSqlCheckKeys(
  nodes: { type?: string; segmentId?: string; checkKey?: string; children?: unknown[] }[] | undefined,
  segments: Record<string, { checkKey?: string; revisadoKey?: string }>,
): string[] {
  const out: string[] = [];
  for (const n of nodes || []) {
    if (!n) continue;
    if (n.type === "sql") {
      const seg = segments[n.segmentId || ""] || {};
      const key = n.checkKey || seg.checkKey || seg.revisadoKey;
      if (key) out.push(String(key));
    }
    if (Array.isArray(n.children) && n.children.length) out.push(...collectSqlCheckKeys(n.children as typeof nodes, segments));
  }
  return out;
}

export function ticketRevisadoKey(iticket: string): string { return "tickets." + iticket; }
