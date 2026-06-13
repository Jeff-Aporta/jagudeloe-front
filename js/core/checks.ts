/** Utilidades checks — sqlexec + tickets (BITACORA_REVISADO). */
import { businessMinutesBetween, extractMetricInput, DEFAULT_SCHEDULE } from "./tk-metrics.ts";

export type DotState = "complete" | "partial" | "warn" | "overdue" | "idle" | "none";

export function aggregateDotState(keys: string[], map: Record<string, boolean>): DotState | null {
  const list = keys.filter(Boolean);
  if (!list.length) return null;
  let checked = 0;
  for (const k of list) { if (map[k]) checked += 1; }
  if (checked === list.length) return "complete";
  if (checked === 0) return "none";
  return "partial";
}

export function ticketRevisadoKey(iticket: string): string { return "tickets." + iticket; }

const TK_WARN_HOURS = 7;
const TK_OVERDUE_HOURS = 14;

/** Dot en listado TK: verde revisado; gris joven; naranja >7 h hábiles; rojo >14 h. */
export function ticketListDotState(
  tk: Record<string, unknown>,
  revisadoMap: Record<string, boolean>,
  revisadoKey: string,
): DotState | null {
  const rev = aggregateDotState([revisadoKey], revisadoMap);
  if (rev === "complete") return "complete";

  const input = extractMetricInput(tk);
  if (input.fechaCierre) return "idle";

  const cre = input.fechaCreacion;
  if (!cre) return "idle";

  const mins = businessMinutesBetween(cre, new Date().toISOString(), input, DEFAULT_SCHEDULE);
  if (mins == null) return "idle";

  const hours = mins / 60;
  if (hours > TK_OVERDUE_HOURS) return "overdue";
  if (hours > TK_WARN_HOURS) return "warn";
  return "idle";
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
