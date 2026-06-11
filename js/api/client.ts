/*
 * api/client — cliente HTTP del Worker jagudeloe (ISA-DOC).
 * GET = público (sin token). POST/PUT/DELETE = adjunta Authorization si hay sesión.
 * Rutas: /isa/{project}/{recurso}.
 */

interface FetchOpts {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
}
interface ApiError extends Error {
  status?: number;
  data?: unknown;
}

(function () {
  "use strict";
  const w = window as any;

  async function labFetch<T = any>(path: string, opts: FetchOpts = {}): Promise<T> {
    let headers: Record<string, string> = Object.assign({ "Content-Type": "application/json" }, opts.headers || {});
    const method = (opts.method || "GET").toUpperCase();
    if (method !== "GET") headers = Object.assign(headers, w.ISAJ.Session.authHeader());

    const res = await fetch(w.ISAJ.Config.apiUrl(path), {
      method,
      headers,
      body: opts.body != null ? (typeof opts.body === "string" ? opts.body : JSON.stringify(opts.body)) : undefined,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      let msg = (data && (data as any).error) || ("HTTP " + res.status);
      if (res.status === 401) msg = "Sesión requerida o expirada.";
      if (res.status === 403) msg = "No tienes permiso para esta acción.";
      if (res.status === 404) msg = "Endpoint no disponible (¿backend desplegado?).";
      const err = new Error(msg) as ApiError;
      err.status = res.status; err.data = data;
      throw err;
    }
    return data as T;
  }

  const ping = () => labFetch("/health");
  const getSpaces = () => labFetch("/isa/spaces");
  const getBitacora = (project: string) => labFetch("/isa/" + project + "/bitacora");
  const getTickets = (project: string, opts?: { estado?: string }) => {
    const qs = opts && opts.estado ? "?estado=" + encodeURIComponent(opts.estado) : "";
    return labFetch("/isa/" + project + "/tickets" + qs);
  };
  const getTicket = (project: string, iticket: string) =>
    labFetch("/tk/" + project + "/tickets/" + encodeURIComponent(iticket));
  const getChecks = (project: string) => labFetch("/isa/" + project + "/checks");
  const setCheck = (project: string, revisadoKey: string, checked: boolean) =>
    labFetch("/isa/" + project + "/checks", { method: "POST", body: { revisadoKey, checked: !!checked } });

  w.ISAJ = w.ISAJ || {};
  w.ISAJ.Api = { labFetch, ping, getSpaces, getBitacora, getTickets, getTicket, getChecks, setCheck };
})();
