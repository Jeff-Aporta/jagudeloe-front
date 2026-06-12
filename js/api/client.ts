/*
 * api/client — cliente HTTP del Worker jagudeloe vía main-orchestrator.
 */

import { Session, Config } from "../core/platform.ts";

interface FetchOpts {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
}

interface ApiError extends Error {
  status?: number;
  data?: unknown;
}

const FETCH_TIMEOUT_MS = 15000;
const revisadoCache: Record<string, Record<string, boolean>> = {};

const LOCAL_DIRECT: { test: (p: string) => boolean; base: string }[] = [
  { test: (p) => p.startsWith("/api/tk"), base: "http://127.0.0.1:8786" },
  {
    test: (p) =>
      p.startsWith("/api/isa") || p.startsWith("/api/bitacora") || p.startsWith("/api/catalog")
      || p.startsWith("/api/entities") || p.startsWith("/api/revisado") || p.startsWith("/api/health"),
    base: "http://127.0.0.1:8783",
  },
];

function isLocalFront(): boolean {
  const h = location.hostname;
  return h === "localhost" || h === "127.0.0.1" || h === "[::1]";
}

function localDevHint(): string {
  if (!isLocalFront() || !Config.isLocal()) return "";
  return " Comprueba que el entorno local esté activo.";
}

function sanitizeApiError(raw: unknown, fallback = "No se pudo completar la operación"): string {
  const msg = String(raw ?? "").trim();
  if (!msg) return fallback;
  if (/main-orchestrator|workers\.dev|localhost:\d+|878\d|azure|orquestador|gateway/i.test(msg)) return fallback;
  if (/^HTTP \d{3}$/.test(msg)) return fallback;
  return msg.length > 200 ? msg.slice(0, 197) + "…" : msg;
}

function directBaseFor(path: string): string | null {
  if (!isLocalFront()) return null;
  for (const entry of LOCAL_DIRECT) {
    if (entry.test(path)) return entry.base;
  }
  return null;
}

async function fetchWithTimeout(url: string, opts: RequestInit): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, Object.assign({}, opts, { signal: ctrl.signal }));
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new Error("La operación tardó demasiado." + localDevHint());
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

export async function labFetch<T = unknown>(path: string, opts: FetchOpts = {}, baseOverride?: string): Promise<T> {
  const { authHeader, appHeader } = Session;
  const { base } = Config;
  const method = (opts.method || "GET").toUpperCase();
  const headers: Record<string, string> = Object.assign({}, opts.headers || {});
  if (method !== "GET" && method !== "HEAD") {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
    Object.assign(headers, authHeader(), appHeader());
  }

  const bases: string[] = [];
  if (baseOverride) bases.push(baseOverride.replace(/\/$/, ""));
  else bases.push(base().replace(/\/$/, ""));

  const direct = directBaseFor(path);
  if (direct && bases.indexOf(direct) < 0) bases.push(direct);

  let lastErr: ApiError | null = null;

  for (let bi = 0; bi < bases.length; bi++) {
    const url = bases[bi] + (path.charAt(0) === "/" ? path : "/" + path);
    let res: Response;
    try {
      res = await fetchWithTimeout(url, {
        method,
        headers,
        body: opts.body != null ? (typeof opts.body === "string" ? opts.body : JSON.stringify(opts.body)) : undefined,
      });
    } catch (e) {
      lastErr = e instanceof Error ? (e as ApiError) : new Error(String(e)) as ApiError;
      if (bi < bases.length - 1) continue;
      if (!lastErr.message.includes("conectar") && !lastErr.message.includes("tardó")) {
        lastErr.message = "No se pudo conectar con el servidor." + localDevHint();
      }
      throw lastErr;
    }

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const errBody = data as { error?: string } | null;
      let msg = sanitizeApiError(errBody?.error, "Error HTTP " + res.status);
      if (res.status === 401) msg = "Sesión requerida o expirada.";
      if (res.status === 403) msg = "No tienes permiso para esta acción.";
      if (res.status === 404) msg = "Recurso no encontrado." + localDevHint();
      lastErr = new Error(msg) as ApiError;
      lastErr.status = res.status;
      lastErr.data = data;
      if (bi < bases.length - 1 && (res.status === 404 || res.status === 502 || res.status === 503)) continue;
      throw lastErr;
    }
    return data as T;
  }

  throw lastErr || new Error("No se pudo conectar con el servidor." + localDevHint());
}

export async function getRevisadoMap(project: string, force = false): Promise<Record<string, boolean>> {
  if (!force && revisadoCache[project]) return revisadoCache[project];
  const d = await labFetch<{ rows?: { revisadoKey: string; checked: boolean }[] }>("/api/isa/" + project + "/checks");
  const map: Record<string, boolean> = {};
  (d.rows || []).forEach((r) => { map[r.revisadoKey] = !!r.checked; });
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
  const r = await labFetch("/api/isa/" + project + "/checks", { method: "POST", body: { revisadoKey, checked: !!checked } });
  invalidateRevisadoCache(project);
  return r;
}

export const execSql = (project: string, payload: { sql: string; dbTarget?: string; segmentId?: string }) =>
  labFetch("/api/isa/" + project + "/sql", { method: "POST", body: payload });
