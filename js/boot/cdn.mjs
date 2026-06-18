/** Pin jsDelivr front-shared — alinear con front-shared/cdn/versions.json (origin/main). */
export const PIN = "22f23a2";

const isDevHost =
  typeof location !== "undefined" && /localhost|127\.0\.0\.1|\[::1\]/.test(location.hostname);

function devCdnBase() {
  const base = document.querySelector("base")?.href || location.href;
  return new URL("../../front-shared/cdn/", base).href.replace(/\/?$/, "/");
}

export const CDN = isDevHost
  ? devCdnBase()
  : `https://cdn.jsdelivr.net/gh/Jeff-Aporta/front-shared@${PIN}/cdn`;

export const bootHelperUrl = isDevHost
  ? `${CDN}boot-helper.mjs`
  : `${CDN}/boot-helper.mjs?v=${PIN}`;

export const asset = (p) =>
  isDevHost ? `${CDN}${p}` : `${CDN}/${p}?v=${PIN}`;
