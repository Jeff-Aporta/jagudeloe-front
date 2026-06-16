/** PhotoSwipe 5 (CDN) — zoom, pan, galería y captions tematizados. */

const PSWP_VER = "5.4.4";
const CAPTION_VER = "1.2.7";
const PSWP_CDN = `https://cdn.jsdelivr.net/npm/photoswipe@${PSWP_VER}/dist`;
const CAPTION_CDN = `https://cdn.jsdelivr.net/npm/photoswipe-dynamic-caption-plugin@${CAPTION_VER}`;

type PswpCtor = new (options: Record<string, unknown>) => {
  init: () => void;
  destroy: () => void;
};

type CaptionCtor = new (pswp: unknown, options: Record<string, unknown>) => void;

let pswpCtor: PswpCtor | null = null;
let captionCtor: CaptionCtor | null = null;

function isDarkMode(): boolean {
  const scheme = document.documentElement.getAttribute("data-mui-color-scheme");
  if (scheme === "dark" || scheme === "light") return scheme === "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/** Variables CSS PhotoSwipe alineadas con la app (light/dark). */
export function applyTkLightboxTheme(dark = isDarkMode()): void {
  const root = document.documentElement;
  if (dark) {
    root.style.setProperty("--pswp-bg", "rgba(8, 20, 36, 0.96)");
    root.style.setProperty("--pswp-placeholder-bg", "rgba(15, 34, 54, 0.5)");
    root.style.setProperty("--pswp-icon-color", "#e8f4ff");
    root.style.setProperty("--pswp-icon-color-secondary", "#9ec5eb");
    root.style.setProperty("--pswp-icon-stroke-color", "#1e90ff");
    root.style.setProperty("--tk-pswp-caption-color", "#e8f4ff");
    root.style.setProperty("--tk-pswp-caption-bg", "rgba(15, 34, 54, 0.72)");
  } else {
    root.style.setProperty("--pswp-bg", "rgba(10, 37, 64, 0.94)");
    root.style.setProperty("--pswp-placeholder-bg", "rgba(240, 247, 255, 0.45)");
    root.style.setProperty("--pswp-icon-color", "#f0f7ff");
    root.style.setProperty("--pswp-icon-color-secondary", "#c5dff5");
    root.style.setProperty("--pswp-icon-stroke-color", "#ffffff");
    root.style.setProperty("--tk-pswp-caption-color", "#f0f7ff");
    root.style.setProperty("--tk-pswp-caption-bg", "rgba(10, 37, 64, 0.78)");
  }
}

export function ensureTkLightboxCss(): void {
  if (document.getElementById("tk-pswp-css")) return;
  const links = [
    `${PSWP_CDN}/photoswipe.css`,
    `${CAPTION_CDN}/photoswipe-dynamic-caption-plugin.css`,
  ];
  for (const href of links) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  }
  const marker = document.createElement("link");
  marker.id = "tk-pswp-css";
  marker.rel = "stylesheet";
  marker.href = "css/tk-lightbox.css";
  document.head.appendChild(marker);
}

async function loadPswp(): Promise<PswpCtor> {
  if (pswpCtor) return pswpCtor;
  const mod = await import(/* @vite-ignore */ `${PSWP_CDN}/photoswipe.esm.min.js`);
  pswpCtor = mod.default as PswpCtor;
  return pswpCtor;
}

async function loadCaptionPlugin(): Promise<CaptionCtor> {
  if (captionCtor) return captionCtor;
  const mod = await import(/* @vite-ignore */ `${CAPTION_CDN}/photoswipe-dynamic-caption-plugin.esm.js`);
  captionCtor = mod.default as CaptionCtor;
  return captionCtor;
}

export type TkLightboxItem = {
  src: string;
  width: number;
  height: number;
  caption?: string;
  alt?: string;
  element?: Element | null;
};

function collectGalleryItems(galleryId: string): { items: TkLightboxItem[]; links: HTMLAnchorElement[] } {
  const sel = `a.tk-lightbox-link[data-pswp-gallery="${CSS.escape(galleryId)}"]`;
  const links = [...document.querySelectorAll(sel)] as HTMLAnchorElement[];
  const items = links.map((a) => {
    const img = a.querySelector("img");
    return {
      src: a.getAttribute("href") || a.dataset.pswpSrc || "",
      width: Number(a.dataset.pswpWidth) || 1920,
      height: Number(a.dataset.pswpHeight) || 1080,
      caption: a.dataset.pswpCaption || "",
      alt: img?.getAttribute("alt") || a.dataset.pswpCaption || "",
      element: img || a,
    };
  });
  return { items, links };
}

let activePswp: { destroy: () => void } | null = null;

/** Abre la galería del ticket en el índice del enlace pulsado. */
export async function openTkLightboxGallery(galleryId: string, clickedLink: HTMLElement): Promise<void> {
  if (!galleryId || !clickedLink) return;
  ensureTkLightboxCss();
  applyTkLightboxTheme();

  const { items, links } = collectGalleryItems(galleryId);
  if (!items.length) return;

  const index = Math.max(0, links.indexOf(clickedLink as HTMLAnchorElement));
  activePswp?.destroy();
  activePswp = null;

  const PhotoSwipe = await loadPswp();
  const PhotoSwipeDynamicCaption = await loadCaptionPlugin();

  const dataSource = items.map((item) => ({
    src: item.src,
    width: item.width,
    height: item.height,
    alt: item.caption || item.alt || "",
    element: item.element,
  }));

  const pswp = new PhotoSwipe({
    dataSource,
    index,
    showHideAnimationType: "zoom",
    wheelToZoom: true,
    pinchToClose: true,
    bgOpacity: 0.96,
    padding: { top: 52, bottom: 96, left: 16, right: 16 },
    zoom: true,
    maxZoomLevel: 4,
    secondaryZoomLevel: 2,
  });

  new PhotoSwipeDynamicCaption(pswp, {
    type: "auto",
    captionContent: (slide: { data?: { alt?: string } }) => slide.data?.alt || "",
  });

  pswp.init();
  activePswp = pswp;
}

/** Sincroniza tema al cambiar light/dark en MUI. */
export function watchTkLightboxTheme(): () => void {
  applyTkLightboxTheme();
  const obs = new MutationObserver(() => applyTkLightboxTheme());
  obs.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-mui-color-scheme", "class"],
  });
  return () => obs.disconnect();
}

/** Sonda dimensiones naturales de la imagen para animación de zoom. */
export function probeImageSize(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    if (!url) {
      resolve({ width: 1920, height: 1080 });
      return;
    }
    const img = new Image();
    img.onload = () =>
      resolve({
        width: img.naturalWidth || 1920,
        height: img.naturalHeight || 1080,
      });
    img.onerror = () => resolve({ width: 1920, height: 1080 });
    img.src = url;
  });
}
