/** Pin jsDelivr front-shared — alinear con front-shared/cdn/versions.json (origin/main). */
export const PIN = "0692ebf";

const isDevHost =
  typeof location !== "undefined" && /localhost|127\.0\.0\.1|\[::1\]/.test(location.hostname);

function frontSharedCdnBase() {
  const base = document.querySelector("base")?.href || location.href;
  return new URL("../../components/front-shared/cdn/", base).href.replace(/\/?$/, "/");
}

/** En localhost: monorepo front-shared (IsaSplitView y widgets recientes). Prod: jsDelivr. */
export const CDN = isDevHost
  ? frontSharedCdnBase()
  : `https://cdn.jsdelivr.net/gh/Jeff-Aporta/front-shared@${PIN}/cdn/`;

export const bootHelperUrl = isDevHost
  ? `${CDN}boot-helper.mjs`
  : `${CDN}boot-helper.mjs?v=${PIN}`;

export const bootLoaderUrl = isDevHost
  ? `${CDN}boot-loader.mjs`
  : `${CDN}boot-loader.mjs?v=${PIN}`;

export const asset = (p) => (isDevHost ? `${CDN}${p}` : `${CDN}${p}?v=${PIN}`);

/* @isa-lightbox-boot:start */
/** @jeff-aporta/lightbox-zoom — pin: sync-component-refs.mjs */
export const LIGHTBOX_ZOOM_REF = "7770b03";

export function lightboxZoomBase() {
  const base = document.querySelector("base")?.href || location.href;
  if (isDevHost) {
    return new URL("../../components/lightbox/cdn/", base).href.replace(/\/?$/, "/");
  }
  return `https://cdn.jsdelivr.net/gh/Jeff-Aporta/lightbox-zoom@${LIGHTBOX_ZOOM_REF}/cdn/`;
}

function ensureLightboxStylesheet(href) {
  if (document.querySelector("[data-isa-lb-zoom-css]")) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.setAttribute("data-isa-lb-zoom-css", "1");
    link.onload = () => resolve();
    link.onerror = () => reject(new Error("No se pudo cargar " + href));
    document.head.appendChild(link);
  });
}

function ensureLightboxScript(src) {
  if (globalThis.ISAComponents?.LightboxZoom?.LightboxZoomDialog) {
    return Promise.resolve();
  }
  const stale = document.querySelector("script[data-isa-lb-zoom-js]");
  if (stale) stale.remove();
  return new Promise((resolve, reject) => {
    const el = document.createElement("script");
    el.src = src;
    el.setAttribute("data-isa-lb-zoom-js", "1");
    el.onload = () => {
      if (!globalThis.ISAComponents?.LightboxZoom?.LightboxZoomDialog) {
        reject(new Error("LightboxZoom no registró ISAComponents.LightboxZoom"));
        return;
      }
      resolve();
    };
    el.onerror = () => reject(new Error("No se pudo cargar " + src));
    document.head.appendChild(el);
  });
}

/** Carga CSS + bundle. Requiere stack React/MUI y registerApp previo. */
export async function ensureLightboxZoom(base = lightboxZoomBase()) {
  const b = base.endsWith("/") ? base : base + "/";
  await ensureLightboxStylesheet(b + "lightbox-zoom.min.css");
  await ensureLightboxScript(b + "lightbox-zoom.min.js");
  return globalThis.ISAComponents.LightboxZoom;
}
/* @isa-lightbox-boot:end */
