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

/** Misma BD que prod (GitHub Pages). Local 8796 solo con localStorage tkApi:local=1. */
const TK_API_REMOTE = "https://jagudeloe-tks.jeffaporta.workers.dev";
const TK_API_LOCAL = "http://127.0.0.1:8796";

function isDevHost(): boolean {
  const h = typeof location !== "undefined" ? location.hostname : "";
  return h === "localhost" || h === "127.0.0.1" || h === "[::1]";
}

function tkApiLocalEnabled(): boolean {
  try {
    return window.localStorage?.getItem("tkApi:local") === "1";
  } catch {
    return false;
  }
}

const LOCAL_DIRECT = [
  {
    test: (p: string) => p.startsWith("/api/tk") && tkApiLocalEnabled(),
    base: TK_API_LOCAL,
  },
  {
    test: (p: string) =>
      p.startsWith("/api/isa") || p.startsWith("/api/catalog")
      || p.startsWith("/api/entities") || p.startsWith("/api/revisado") || p.startsWith("/api/health"),
    base: "http://127.0.0.1:8793",
  },
];

const REMOTE_DIRECT = [
  { test: (p: string) => p.startsWith("/api/tk"), base: TK_API_REMOTE },
  {
    test: (p: string) =>
      p.startsWith("/api/isa") || p.startsWith("/api/catalog")
      || p.startsWith("/api/entities") || p.startsWith("/api/revisado") || p.startsWith("/api/health"),
    base: "https://jagudeloe.jeffaporta.workers.dev",
  },
];

const http = window.ISAFront.createCapFetch({
  Session,
  Config,
  localDirect: LOCAL_DIRECT,
  remoteDirect: REMOTE_DIRECT,
  orchOnline: TK_API_REMOTE,
  orchOnlineInLocal: true,
  fetchTimeoutMs: 15000,
});

const revisadoCache: Record<string, Record<string, boolean>> = {};

async function fetchTkRemoteFirst<T>(path: string, opts: FetchOpts): Promise<T | null> {
  if (!isDevHost() || !Config.isLocal() || tkApiLocalEnabled() || !path.startsWith("/api/tk")) {
    return null;
  }
  const apiPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${TK_API_REMOTE}${apiPath}`;
  try {
    const headers: Record<string, string> = { Accept: "application/json", ...(opts.headers || {}) };
    if (Session.isLoggedIn()) {
      Object.assign(headers, Session.authHeader(), Session.appHeader());
    }
    const res = await fetch(url, {
      method: opts.method || "GET",
      headers,
      body: opts.body != null ? JSON.stringify(opts.body) : undefined,
    });
    const text = await res.text();
    const data = text ? JSON.parse(text) : {};
    if (!res.ok || data.ok === false) return null;
    return data as T;
  } catch {
    return null;
  }
}

export async function labFetch<T = unknown>(path: string, opts: FetchOpts = {}): Promise<T> {
  const remote = await fetchTkRemoteFirst<T>(path, opts);
  if (remote !== null) return remote;
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

function encodeTkQueryQ(bag: Record<string, unknown>): string {
  const json = JSON.stringify(bag);
  return btoa(unescape(encodeURIComponent(json)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function getTickets(
  project: string,
  opts?: { estado?: string; search?: string; limit?: number; offset?: number },
) {
  const bag: Record<string, unknown> = { limit: opts?.limit ?? 50, offset: opts?.offset ?? 0 };
  if (opts?.estado === "inactivo") bag.activo = false;
  else if (opts?.estado === "activo") bag.activo = true;
  else if (opts?.estado) bag.estado = opts.estado;
  if (opts?.search?.trim()) bag.search = opts.search.trim();
  const qs = "?q=" + encodeURIComponent(encodeTkQueryQ(bag));
  return labFetch("/api/tk/" + project + "/tickets" + qs);
}

export const getTicket = (project: string, iticket: string) =>
  labFetch("/api/tk/" + project + "/tickets/" + encodeURIComponent(iticket));

/** PATCH TK_DOC — edición manual de content[] / blocks (no toca commits ni tiempos). */
export function patchTicketDoc(project: string, iticket: string, content: unknown[]) {
  return labFetch("/api/tk/" + project + "/tickets/" + encodeURIComponent(iticket) + "/doc", {
    method: "PATCH",
    body: { content },
  });
}

/** PATCH cabecera TK_TICKET — título, solicitante, resumen, documentador (sin tocar doc/commits). */
export function patchTicketHead(
  project: string,
  iticket: string,
  patch: {
    titulo?: string;
    solicitante?: string | null;
    resumen?: string | null;
    documentadorNombre?: string | null;
    documentadorCargo?: string | null;
  },
) {
  return labFetch("/api/tk/" + project + "/tickets/" + encodeURIComponent(iticket) + "/head", {
    method: "PATCH",
    body: patch,
  });
}

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
