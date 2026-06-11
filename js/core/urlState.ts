/*
 * core/urlState — estado de navegación en el query param `s` (base64url de JSON).
 * REGLA: solo valores CORTOS (≤100 chars): tabs, space, subspace, ids. Lo extenso
 * va a localStorage / IndexedDB (core/storage), nunca a la URL.
 */

type StateValue = string | number | boolean | Record<string, unknown>;
type UrlStateMap = Record<string, StateValue>;

(function () {
  "use strict";

  const PARAM = "s";
  const MAX_VALUE = 100;
  let listeners: Array<(s: UrlStateMap) => void> = [];
  let writeTimer: number | null = null;

  function b64urlEncode(str: string): string {
    return btoa(unescape(encodeURIComponent(str)))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function b64urlDecode(str: string): string {
    let b = str.replace(/-/g, "+").replace(/_/g, "/");
    while (b.length % 4) b += "=";
    try { return decodeURIComponent(escape(atob(b))); } catch (e) { return ""; }
  }

  /** Descarta valores largos para respetar el límite de la URL. */
  function slim(state: UrlStateMap): UrlStateMap {
    const out: UrlStateMap = {};
    Object.keys(state || {}).forEach((k) => {
      const v = state[k];
      if (v == null) return;
      if (typeof v === "string") {
        if (v.length <= MAX_VALUE) out[k] = v;
      } else if (typeof v === "number" || typeof v === "boolean") {
        out[k] = v;
      } else if (typeof v === "object") {
        if (JSON.stringify(v).length <= MAX_VALUE) out[k] = v;
      }
    });
    return out;
  }

  function readUrl(): UrlStateMap {
    const raw = new URLSearchParams(location.search).get(PARAM);
    if (!raw) return {};
    const json = b64urlDecode(raw);
    if (!json) return {};
    try { return (JSON.parse(json) as UrlStateMap) || {}; } catch (e) { return {}; }
  }

  let current: UrlStateMap = readUrl();

  function writeUrl(): void {
    const json = JSON.stringify(slim(current));
    const p = new URLSearchParams(location.search);
    if (json === "{}") p.delete(PARAM);
    else p.set(PARAM, b64urlEncode(json));
    const qs = p.toString();
    history.replaceState(null, "", location.pathname + (qs ? "?" + qs : "") + location.hash);
  }

  function notify(): void {
    listeners.forEach((fn) => { try { fn(current); } catch (e) {} });
  }

  function get(): UrlStateMap { return Object.assign({}, current); }

  function merge(partial: UrlStateMap): void {
    current = slim(Object.assign({}, current, partial));
    notify();
    if (writeTimer) clearTimeout(writeTimer);
    writeTimer = setTimeout(writeUrl, 300) as unknown as number;
  }

  function subscribe(fn: (s: UrlStateMap) => void): () => void {
    listeners.push(fn);
    return () => { listeners = listeners.filter((f) => f !== fn); };
  }

  window.addEventListener("popstate", () => { current = readUrl(); notify(); });

  window.ISAJ = window.ISAJ || ({} as IsajNs);
  window.ISAJ.UrlState = { get, merge, subscribe, boot: get(), MAX_VALUE };
})();
