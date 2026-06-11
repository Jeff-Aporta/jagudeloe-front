/*
 * api/client — cliente HTTP del Worker jagudeloe vía main-orchestrator.
 * GET = público (sin token). POST/PUT/DELETE = adjunta Authorization si hay sesión.
 * Rutas: /api/isa/{project}/{recurso}, /api/tk/…
 *
 * FALLBACK: si el backend falla (red/CORS/404/500), se devuelven MOCKUPS definidos
 * en js/mocks/*.json, marcados con `_mock: true` para que la UI los muestre como
 * datos de ejemplo mientras se arregla el back.
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

  async function labFetch<T = unknown>(path: string, opts: FetchOpts = {}): Promise<T> {
    const method = (opts.method || "GET").toUpperCase();
    const headers: Record<string, string> = Object.assign({}, opts.headers || {});
    if (method !== "GET" && method !== "HEAD") {
      headers["Content-Type"] = headers["Content-Type"] || "application/json";
      Object.assign(headers, window.ISAJ.Session.authHeader());
    }

    const res = await fetch(window.ISAJ.Config.apiUrl(path), {
      method,
      headers,
      body: opts.body != null ? (typeof opts.body === "string" ? opts.body : JSON.stringify(opts.body)) : undefined,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const errBody = data as { error?: string } | null;
      let msg = (errBody && errBody.error) || ("HTTP " + res.status);
      if (res.status === 401) msg = "Sesión requerida o expirada.";
      if (res.status === 403) msg = "No tienes permiso para esta acción.";
      if (res.status === 404) msg = "Endpoint no disponible (¿backend desplegado?).";
      const err = new Error(msg) as ApiError;
      err.status = res.status; err.data = data;
      throw err;
    }
    return data as T;
  }

  /** Carga un mockup local (js/mocks/<name>.json) y lo marca como ejemplo. */
  async function loadMock<T = Record<string, unknown>>(name: string): Promise<T> {
    const res = await fetch("js/mocks/" + name + ".json", { cache: "no-store" });
    if (!res.ok) throw new Error("Mock " + name + " no disponible");
    const data = (await res.json()) as Record<string, unknown>;
    data._mock = true;
    return data as T;
  }

  /** Intenta el backend; si falla, cae al mockup (sin romper la UI). */
  async function withMock<T = Record<string, unknown>>(real: () => Promise<T>, mock: string): Promise<T> {
    try {
      return await real();
    } catch (e) {
      try {
        return await loadMock<T>(mock);
      } catch {
        throw e; // si ni el mock carga, propaga el error original
      }
    }
  }

  const getSpaces = () => labFetch("/api/isa/spaces");
  const ping = () => getSpaces();

  const getBitacora = (project: string) =>
    withMock(() => labFetch("/api/isa/" + project + "/bitacora"), "bitacora");

  const getTickets = (project: string, opts?: { estado?: string }) => {
    let qs = "";
    if (opts?.estado === "inactivo") qs = "?activo=false";
    else if (opts?.estado === "activo") qs = "?activo=true";
    else if (opts?.estado) qs = "?activo=" + encodeURIComponent(opts.estado);
    return withMock(() => labFetch("/api/tk/" + project + "/tickets" + qs), "tickets");
  };

  const getTicket = (project: string, iticket: string) =>
    withMock(async () => labFetch("/api/tk/" + project + "/tickets/" + encodeURIComponent(iticket)), "tickets")
      .then((d) => {
        const body = d as Record<string, unknown>;
        // Si vino del mock (lista), extrae el ticket pedido y añade contenido de ejemplo.
        if (body._mock && Array.isArray(body.rows)) {
          const found = (body.rows as Record<string, unknown>[]).find((t) => String(t.id) === String(iticket)) || (body.rows as Record<string, unknown>[])[0] || {};
          return Object.assign({ _mock: true, contentHtml: "<p><em>Contenido de ejemplo del ticket.</em> Reemplazar por el detalle real del backend.</p>" }, found);
        }
        return body;
      });

  const getChecks = (project: string) =>
    withMock(() => labFetch("/api/isa/" + project + "/checks"), "checks");

  const setCheck = (project: string, revisadoKey: string, checked: boolean) =>
    labFetch("/api/isa/" + project + "/checks", { method: "POST", body: { revisadoKey, checked: !!checked } });

  const execSql = (project: string, payload: { sql: string; dbTarget?: string; segmentId?: string }) =>
    labFetch("/api/isa/" + project + "/sql", { method: "POST", body: payload });

  window.ISAJ = window.ISAJ || ({} as IsajNs);
  window.ISAJ.Api = { labFetch, ping, getSpaces, getBitacora, getTickets, getTicket, getChecks, setCheck, execSql };
})();
