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

/** Vista documento: solo HTML del ticket, sin shell de la app. */
export function docBootFromSearch(search = location.search) {
  const s = decodeS(search);
  if (s.view !== "doc") return null;
  const space = typeof s.space === "string" ? s.space.trim() : "";
  const sel = typeof s.sel === "string" ? s.sel.trim() : "";
  if (!space || !sel) return null;
  return { space, sel };
}
