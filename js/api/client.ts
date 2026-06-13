/*
 * api/client — endpoints jagudeloe; HTTP vía ISAFront.createCapFetch.
 */
import { Session, Config } from "../core/platform.ts";
import { spacesFor } from "../core/tk-spaces.ts";

interface FetchOpts {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
}

const LOCAL_DIRECT = [
  { test: (p: string) => p.startsWith("/api/tk"), base: "http://127.0.0.1:8786" },
  {
    test: (p: string) =>
      p.startsWith("/api/isa") || p.startsWith("/api/bitacora") || p.startsWith("/api/catalog")
      || p.startsWith("/api/entities") || p.startsWith("/api/revisado") || p.startsWith("/api/health"),
    base: "http://127.0.0.1:8783",
  },
];

const REMOTE_DIRECT = [
  { test: (p: string) => p.startsWith("/api/tk"), base: "https://jagudeloe-tks.jeffaporta.workers.dev" },
  {
    test: (p: string) =>
      p.startsWith("/api/isa") || p.startsWith("/api/bitacora") || p.startsWith("/api/catalog")
      || p.startsWith("/api/entities") || p.startsWith("/api/revisado") || p.startsWith("/api/health"),
    base: "https://jagudeloe.jeffaporta.workers.dev",
  },
];

const http = window.ISAFront.createCapFetch({
  Session,
  Config,
  localDirect: LOCAL_DIRECT,
  remoteDirect: REMOTE_DIRECT,
  fetchTimeoutMs: 15000,
});

const revisadoCache: Record<string, Record<string, boolean>> = {};

export async function labFetch<T = unknown>(path: string, opts: FetchOpts = {}): Promise<T> {
  return http.capFetch(path, {
    method: opts.method,
    headers: opts.headers,
    body: opts.body,
  }) as Promise<T>;
}

const TICKET_REVISADO_KEY = /^tickets\.(.+)$/i;

function mergeCheckRows(...lists: { revisadoKey: string; checked: boolean }[][]) {
  const map: Record<string, boolean> = {};
  for (const rows of lists) {
    for (const r of rows || []) {
      if (r?.revisadoKey) map[r.revisadoKey] = !!r.checked;
    }
  }
  return map;
}

function invalidateRevisadoCacheFor(project: string): void {
  invalidateRevisadoCache(project);
  if (project === "general") {
    for (const s of spacesFor("general")) invalidateRevisadoCache(s);
  }
}

export async function getRevisadoMap(project: string, force = false): Promise<Record<string, boolean>> {
  if (!force && revisadoCache[project]) return revisadoCache[project];
  const spaces = spacesFor(project);
  const isaProject = spaces[0] || project;
  const [isa, ...tkLists] = await Promise.all([
    labFetch<{ rows?: { revisadoKey: string; checked: boolean }[] }>("/api/isa/" + isaProject + "/checks").catch(() => ({ rows: [] })),
    ...spaces.map((s) =>
      labFetch<{ rows?: { revisadoKey: string; checked: boolean }[] }>("/api/tk/" + s + "/checks").catch(() => ({ rows: [] })),
    ),
  ]);
  const map = mergeCheckRows(isa.rows || [], ...tkLists.map((t) => t.rows || []));
  revisadoCache[project] = map;
  return map;
}

export function invalidateRevisadoCache(project?: string): void {
  if (project) delete revisadoCache[project];
  else Object.keys(revisadoCache).forEach((k) => { delete revisadoCache[k]; });
}

export const getSpaces = () => labFetch("/api/isa/spaces");
export const ping = () => getSpaces();
export const getBitacora = (project: string) => labFetch("/api/isa/" + project + "/bitacora");

export function getBitacoraTodos(project: string, segmentId: string) {
  return labFetch<{ ok: boolean; todos: { id: string; text: string; checked: boolean; sort: number }[] }>(
    "/api/isa/" + project + "/bitacora/todos/" + encodeURIComponent(segmentId),
  );
}

export function createBitacoraTodo(project: string, segmentId: string, text: string) {
  return labFetch<{ ok: boolean; todos: { id: string; text: string; checked: boolean; sort: number }[] }>(
    "/api/isa/" + project + "/bitacora/todos/" + encodeURIComponent(segmentId),
    { method: "POST", body: { text } },
  );
}

export function updateBitacoraTodo(
  project: string,
  segmentId: string,
  todoId: string,
  patch: { text?: string; checked?: boolean },
) {
  return labFetch<{ ok: boolean; todos: { id: string; text: string; checked: boolean; sort: number }[] }>(
    "/api/isa/" + project + "/bitacora/todos/" + encodeURIComponent(segmentId) + "/" + encodeURIComponent(todoId),
    { method: "PATCH", body: patch },
  );
}

export function deleteBitacoraTodo(project: string, segmentId: string, todoId: string) {
  return labFetch<{ ok: boolean; todos: { id: string; text: string; checked: boolean; sort: number }[] }>(
    "/api/isa/" + project + "/bitacora/todos/" + encodeURIComponent(segmentId) + "/" + encodeURIComponent(todoId),
    { method: "DELETE" },
  );
}

export function getTickets(project: string, opts?: { estado?: string }) {
  let qs = "";
  if (opts?.estado === "inactivo") qs = "?activo=false";
  else if (opts?.estado === "activo") qs = "?activo=true";
  else if (opts?.estado) qs = "?activo=" + encodeURIComponent(opts.estado);
  return labFetch("/api/tk/" + project + "/tickets" + qs);
}

export const getTicket = (project: string, iticket: string) =>
  labFetch("/api/tk/" + project + "/tickets/" + encodeURIComponent(iticket));

export const getChecks = (project: string) => labFetch("/api/isa/" + project + "/checks");

export async function setCheck(project: string, revisadoKey: string, checked: boolean) {
  const key = String(revisadoKey || "").trim();
  if (!key) throw new Error("revisadoKey requerido");
  const value = !!checked;
  const isaProject = project === "general" ? (spacesFor("general")[0] || "patyia") : project;

  async function postRevisadoCheck() {
    return labFetch("/api/revisado", { method: "POST", body: { [key]: value } });
  }

  async function postIsaCheck() {
    return labFetch("/api/isa/" + isaProject + "/checks", {
      method: "POST",
      body: { revisadoKey: key, checked: value },
    });
  }

  const attempts: Array<() => Promise<unknown>> = [postRevisadoCheck];

  const ticketMatch = TICKET_REVISADO_KEY.exec(key);
  if (ticketMatch) {
    const iticket = ticketMatch[1]!;
    for (const sp of spacesFor(project)) {
      attempts.push(() =>
        labFetch("/api/tk/" + sp + "/tickets/" + encodeURIComponent(iticket) + "/check", {
          method: "PATCH",
          body: { checked: value },
        }),
      );
    }
  }

  attempts.push(postIsaCheck);

  let lastErr: Error & { status?: number } | null = null;
  for (const attempt of attempts) {
    try {
      const r = await attempt();
      invalidateRevisadoCacheFor(project);
      return r;
    } catch (e) {
      lastErr = e instanceof Error ? (e as Error & { status?: number }) : (new Error(String(e)) as Error & { status?: number });
      if (lastErr.status !== 404 && lastErr.status !== 503) throw lastErr;
    }
  }
  throw lastErr || new Error("No se pudo marcar como revisado.");
}

export const execSql = (project: string, payload: { sql: string; dbTarget?: string; segmentId?: string }) =>
  labFetch("/api/isa/" + project + "/sql", { method: "POST", body: payload });
