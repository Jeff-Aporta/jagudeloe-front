/** Codificar/decodificar query `s` sin Babel (usable desde loader). */
export const PARAM = "s";
const MAX_VALUE = 100;

function b64urlEncode(str) {
  return btoa(unescape(encodeURIComponent(str))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(str) {
  let b = String(str).replace(/-/g, "+").replace(/_/g, "/");
  while (b.length % 4) b += "=";
  try { return decodeURIComponent(escape(atob(b))); } catch { return ""; }
}

function slim(state) {
  const out = {};
  Object.keys(state || {}).forEach((k) => {
    const v = state[k];
    if (v == null) return;
    if (typeof v === "string") { if (v.length <= MAX_VALUE) out[k] = v; }
    else if (typeof v === "number" || typeof v === "boolean") out[k] = v;
    else if (typeof v === "object" && JSON.stringify(v).length <= MAX_VALUE) out[k] = v;
  });
  return out;
}

export function decodeS(search = location.search) {
  const raw = new URLSearchParams(search).get(PARAM);
  if (!raw) return {};
  const json = b64urlDecode(raw);
  if (!json) return {};
  try { return JSON.parse(json) || {}; } catch { return {}; }
}

export function encodeS(state) {
  return PARAM + "=" + b64urlEncode(JSON.stringify(slim(state)));
}

export function buildShareUrl(state, originPath) {
  const path = originPath || location.pathname;
  return location.origin + path + "?" + encodeS(state);
}

/** diligencia | metricas — solo persiste en vista full-page (?s → view=doc). */
export function parseDocReportView(search = location.search) {
  const s = decodeS(search);
  return s.report === "metricas" ? "metricas" : "diligencia";
}

/** Actualiza ?s= con report=metricas o lo omite (diligencia por defecto). */
export function writeDocReportView(reportView, search = location.search) {
  const s = decodeS(search);
  const next = { ...s };
  if (reportView === "metricas") next.report = "metricas";
  else delete next.report;
  const qs = encodeS(next);
  const url = location.pathname + "?" + qs;
  history.replaceState(null, "", url);
}

/** Ticket activo en vista doc (?s → sel). */
export function parseDocSel(search = location.search) {
  const s = decodeS(search);
  const sel = typeof s.sel === "string" ? s.sel.trim() : "";
  return sel || null;
}

/** Cambia solo sel en ?s= sin recargar (navegación SPA del catálogo footer). */
export function writeDocSel(sel, search = location.search) {
  const s = decodeS(search);
  const next = { ...s, sel: String(sel || "").trim() };
  const qs = encodeS(next);
  const url = location.pathname + "?" + qs;
  history.pushState(null, "", url);
}

/** ?isa_doc_load_hold o s.bootHold — mantiene el shimmer del doc-viewer (QA visual). */
export function isDocLoadHold(search = location.search) {
  if (new URLSearchParams(search).has("isa_doc_load_hold")) return true;
  return decodeS(search).bootHold === true;
}

/* ── Visor de diagramas (query `d` = b64url del JSON {kind, payload}) ── */
export const DIAGRAM_PARAM = "d";

/** Codifica un diagrama {kind, payload} al query `d`. */
export function encodeDiagramParam(descriptor) {
  const d = descriptor || {};
  return b64urlEncode(JSON.stringify({ kind: d.kind || "sequence", payload: d.payload || {} }));
}

/** Decodifica el query `d` → {kind, payload} o null. */
export function decodeDiagramParam(raw) {
  if (!raw) return null;
  const json = b64urlDecode(raw);
  if (!json) return null;
  try {
    const obj = JSON.parse(json);
    if (!obj || typeof obj !== "object") return null;
    const kind = String(obj.kind || "sequence");
    const payload = obj.payload && typeof obj.payload === "object" ? obj.payload : obj;
    return { kind, payload };
  } catch {
    return null;
  }
}

/** Modo visor de diagramas: hay `d` en la URL → solo diagrama, sin shell. */
export function diagramBootFromSearch(search = location.search) {
  return decodeDiagramParam(new URLSearchParams(search).get(DIAGRAM_PARAM));
}

/** URL del visor: conserva `s` actual y agrega/reemplaza `d` con el diagrama. */
export function buildDiagramViewerUrl(descriptor, search = location.search, originPath) {
  const params = new URLSearchParams(search);
  params.set(DIAGRAM_PARAM, encodeDiagramParam(descriptor));
  const path = originPath || location.pathname;
  return location.origin + path + "?" + params.toString();
}

/** Vista documento: solo ticket, sin shell. driver: html (correo) | jsx (web). */
export function docBootFromSearch(search = location.search) {
  const s = decodeS(search);
  if (s.view !== "doc") return null;
  const space = typeof s.space === "string" ? s.space.trim() : "";
  const sel = typeof s.sel === "string" ? s.sel.trim() : "";
  if (!space || !sel) return null;
  const driver = s.driver === "html" ? "html" : "jsx";
  const reportView = parseDocReportView(search);
  const bootHold = s.bootHold === true || new URLSearchParams(search).has("isa_doc_load_hold");
  return { space, sel, driver, reportView, bootHold };
}
