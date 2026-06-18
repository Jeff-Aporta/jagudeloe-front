/**
 * Parche de commits/tiempos/contenido cuando la API aún no refleja el seed de BD.
 * Fuente canónica: backend-tks/scripts/lib/tk-content-1439155.mjs
 */

import {
  mergeTk1439155Content,
  needsTk1439155ContentPatch,
} from "./tk-doc-content-1439155.ts";

type TkCommitSeed = {
  hash: string;
  proyecto: string;
  tkRef: string;
  descripcion: string;
  insCount: number;
  delCount: number;
  minutos: number;
  sortKey: number;
  meta: { fecha: string; repo: string };
};

type TkTiempoSeed = {
  name: string;
  detail: string;
  minutos: number;
  sortKey: number;
  phase?: string;
};

type TkDocSeedOverride = {
  commits: TkCommitSeed[];
  tiempos: TkTiempoSeed[];
};

const TK1439155_COMMITS: TkCommitSeed[] = [
  {
    hash: "2df54c0",
    proyecto: "PatyIA",
    tkRef: "TK-1439155",
    descripcion: "feat: Se ignoró el archivo local de token de desarrollo",
    insCount: 1,
    delCount: 0,
    minutos: 2,
    sortKey: 0,
    meta: { fecha: "2026-06-17T17:08:52-05:00", repo: "ISS" },
  },
  {
    hash: "ee46028",
    proyecto: "PatyIA",
    tkRef: "TK-1439155",
    descripcion: "fix: Se eliminó ireferencia del modelo de mensaje calificado",
    insCount: 0,
    delCount: 2,
    minutos: 3,
    sortKey: 1,
    meta: { fecha: "2026-06-17T17:09:01-05:00", repo: "ISS" },
  },
  {
    hash: "4363ae3",
    proyecto: "PatyIA",
    tkRef: "TK-1439155",
    descripcion: "fix: Se unificó imensaje en MensajeOpenAI sin ireferencia",
    insCount: 1,
    delCount: 3,
    minutos: 3,
    sortKey: 2,
    meta: { fecha: "2026-06-17T17:09:01-05:00", repo: "ISS" },
  },
  {
    hash: "0969a9a",
    proyecto: "PatyIA",
    tkRef: "TK-1439155",
    descripcion: "fix: Se alineó imensaje del hilo con mensajes calificados",
    insCount: 22,
    delCount: 22,
    minutos: 8,
    sortKey: 3,
    meta: { fecha: "2026-06-17T17:09:02-05:00", repo: "ISS" },
  },
  {
    hash: "404d128",
    proyecto: "PatyIA",
    tkRef: "TK-1439155",
    descripcion: "fix: Se validó imensaje al calificar mensajes de conversación",
    insCount: 31,
    delCount: 4,
    minutos: 10,
    sortKey: 4,
    meta: { fecha: "2026-06-17T17:09:02-05:00", repo: "ISS" },
  },
  {
    hash: "138ba3a",
    proyecto: "PatyIA",
    tkRef: "TK-1439155",
    descripcion: "feat: Se aumentó a 5 los resultados de búsqueda en file_search",
    insCount: 1,
    delCount: 1,
    minutos: 3,
    sortKey: 5,
    meta: { fecha: "2026-06-17T17:09:02-05:00", repo: "ISS" },
  },
  {
    hash: "e9c116a",
    proyecto: "PatyIA",
    tkRef: "TK-1439155",
    descripcion: "fix: Se omitió ireferencia en mensajes calificados de la respuesta",
    insCount: 6,
    delCount: 1,
    minutos: 4,
    sortKey: 6,
    meta: { fecha: "2026-06-17T17:09:25-05:00", repo: "ISS" },
  },
  {
    hash: "a22e0ac",
    proyecto: "PatyIA",
    tkRef: "TK-1439155",
    descripcion: "fix: Se alineó el modelo del stream con la configuración en BD",
    insCount: 43,
    delCount: 14,
    minutos: 25,
    sortKey: 7,
    meta: { fecha: "2026-06-17T21:35:40-05:00", repo: "ISS" },
  },
  {
    hash: "87c954e",
    proyecto: "PatyIA",
    tkRef: "TK-1439155",
    descripcion: "fix: Se mejoró el fallback de modelo de instrucciones desde GENERAL en BD",
    insCount: 22,
    delCount: 7,
    minutos: 15,
    sortKey: 8,
    meta: { fecha: "2026-06-17T21:35:50-05:00", repo: "ISS" },
  },
];

const TK1439155_TIEMPOS: TkTiempoSeed[] = [
  {
    name: "Investigación y testing",
    detail: "conversación 2219 · causa del modelo y validación de solución",
    minutos: 40,
    sortKey: 0,
    phase: "investigacion",
  },
  {
    name: "Trabajo en commits ISS",
    detail: "9 commits · alineación modelo GENERAL",
    minutos: 75,
    sortKey: 1,
    phase: "commits",
  },
  {
    name: "Diligencia del ticket",
    detail: "evidencias + documentación TK-1439155",
    minutos: 50,
    sortKey: 2,
    phase: "diligencia",
  },
];

const DOC_SEED_OVERRIDES: Record<string, TkDocSeedOverride> = {
  "TK-1439155": { commits: TK1439155_COMMITS, tiempos: TK1439155_TIEMPOS },
};

function normIticket(raw: unknown): string {
  const t = String(raw ?? "").trim().toUpperCase();
  return t.startsWith("TK-") ? t : `TK-${t}`;
}

function collectCommits(tk: Record<string, unknown>): Record<string, unknown>[] {
  const contexts = (tk.contexts as { commits?: unknown[] }[]) ?? [];
  const fromCtx = contexts.flatMap((c) => (c.commits as Record<string, unknown>[]) ?? []);
  const root = (tk.rootCommits as Record<string, unknown>[]) ?? [];
  return [...fromCtx, ...root];
}

function needsCommitPatch(current: Record<string, unknown>[], expected: TkCommitSeed[]): boolean {
  if (current.length !== expected.length) return true;
  const byHash = new Map(current.map((c) => [String(c.hash ?? "").toLowerCase(), c]));
  for (const exp of expected) {
    const row = byHash.get(exp.hash.toLowerCase());
    if (!row) return true;
    const desc = String(row.descripcion ?? "");
    if (desc !== exp.descripcion) return true;
    if (/fix\(TK-/i.test(desc)) return true;
  }
  return false;
}

function needsTiemposPatch(
  current: Record<string, unknown>[],
  expected: TkTiempoSeed[],
): boolean {
  if (current.length !== expected.length) return true;
  const byName = new Map(current.map((t) => [String(t.name ?? ""), t]));
  for (const exp of expected) {
    const row = byName.get(exp.name);
    if (!row) return true;
    if (Number(row.minutos ?? 0) !== exp.minutos) return true;
    if (String(row.detail ?? "") !== exp.detail) return true;
    if (exp.phase && String(row.phase ?? "") !== exp.phase) return true;
  }
  return false;
}

/** Sustituye commits/tiempos/contenido del ticket si la API aún no coincide con el seed. */
export function patchTkDocSeed(tk: Record<string, unknown>): Record<string, unknown> {
  const iticket = normIticket(tk.iticket);
  const override = DOC_SEED_OVERRIDES[iticket];
  if (!override) return tk;

  let out = { ...tk };

  const currentCommits = collectCommits(out);
  const currentTiempos = (out.tiempos as Record<string, unknown>[]) ?? [];
  const patchCommits = needsCommitPatch(currentCommits, override.commits);
  const patchTiempos = needsTiemposPatch(currentTiempos, override.tiempos);

  if (patchCommits || patchTiempos) {
    const contexts = [...((out.contexts as Record<string, unknown>[]) ?? [])];
    if (patchCommits) {
      if (!contexts.length) {
        contexts.push({ sortKey: 0, commits: override.commits });
      } else {
        contexts[0] = { ...contexts[0], commits: override.commits };
      }
    }
    out = {
      ...out,
      contexts: patchCommits ? contexts : out.contexts,
      rootCommits: patchCommits ? [] : out.rootCommits,
      tiempos: override.tiempos,
    };
  }

  const content = (out.content as unknown[]) ?? [];
  if (iticket === "TK-1439155" && needsTk1439155ContentPatch(content)) {
    out = { ...out, content: mergeTk1439155Content(content) };
  }

  return out;
}
