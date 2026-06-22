/*
 * Puente lazy al runtime ISAFront (window.ISAJ tras isa-setup).
 */
const bridge = () => window.ISAFront.createPlatformBridge("ISAJ", { sessionFromAuth: true });

function frontSharedLazy() {
  const api = window.ISAFront;
  return api?.ensureCodeMirrorLoaded ? api : null;
}

function frontShared() {
  const api = frontSharedLazy();
  if (!api) {
    throw new Error("ISAFront lazy-assets no cargado — recargue sin caché (Ctrl+Shift+R).");
  }
  return api;
}

export const UI = {
  get Icon() { return bridge().UI.Icon; },
  get TargetSwitch() { return bridge().UI.TargetSwitch; },
  get ThemeSwitch() { return bridge().UI.ThemeSwitch; },
  get Loading() { return bridge().UI.Loading; },
  get ErrorBox() { return bridge().UI.ErrorBox; },
  get LoginButton() { return bridge().UI.LoginButton; },
  get SqlBlock() {
    const fromBridge = bridge().UI.SqlBlock;
    if (typeof fromBridge === "function") return fromBridge;
    return window.ISAJ?.UI?.SqlBlock;
  },
};

export const Session = {
  current: () => bridge().Session.current(),
  isLoggedIn: () => bridge().Session.isLoggedIn(),
  username: () => bridge().Session.username(),
  authHeader: () => bridge().Session.authHeader(),
  appHeader: () => bridge().Session.appHeader(),
  appId: () => bridge().Session.appId(),
  login: (u: string, p: string) => bridge().Session.login(u, p),
  logout: () => bridge().Session.logout(),
  refreshProfile: () => bridge().Session.refreshProfile(),
  capabilities: () => bridge().Session.capabilities(),
  can: (cap: string) => bridge().Session.can(cap),
  blockReason: (cap: string) => bridge().Session.blockReason(cap),
  get EVENT() { return bridge().Session.EVENT; },
};

export const Toast = {
  show: (opts: { message: string; severity?: string; durationMs?: number; title?: string }) =>
    bridge().Toast.show(opts),
};

export const Feedback = {
  get toast() { return bridge().Feedback.toast; },
  get process() { return bridge().Feedback.process; },
  runProcess: (opts: Record<string, unknown>) => bridge().Feedback.runProcess(opts),
  confirm: (opts: Record<string, unknown>) => bridge().Feedback.confirm(opts),
};

export const Realtime = {
  getStatus: () => bridge().Realtime?.getStatus?.() || "disconnected",
};

export const Config = {
  base: () => bridge().Config.base(),
  apiUrl: (path: string) => bridge().Config.apiUrl(path),
  isLocal: () => bridge().Config.isLocal(),
  setLocal: (v: boolean) => bridge().Config.setLocal(v),
};

/** Carga lazy de scripts/CSS y markdown (front-shared). */
export const Assets = {
  ensureCodeMirrorLoaded: (opts?: { sql?: boolean }) => {
    const api = frontSharedLazy();
    return api ? api.ensureCodeMirrorLoaded!(opts) : Promise.resolve();
  },
  ensureMarked: () => {
    const api = frontSharedLazy();
    return api ? api.ensureMarked!() : Promise.resolve();
  },
  ensureStylesheet: (href: string) => {
    const api = frontSharedLazy();
    return api ? api.ensureLazyStylesheet!(href) : Promise.resolve();
  },
};

export function mdToHtml(src: string): string {
  const api = frontSharedLazy();
  if (api?.mdToHtml) return api.mdToHtml(src);
  return String(src ?? "");
}

/** Acceso al stack React/MUI (front-shared). */
export const getReact = () => window.ISAFront.getReact();
export const getReactDOM = () => window.ISAFront.getReactDOM();
export const getMaterialUI = () => window.ISAFront.getMaterialUI();

/** Layout panel izquierdo redimensionable + contenido (ISAFront.Layout.IsaSplitView). */
export function getIsaSplitView() {
  const C = window.ISAFront?.Layout?.IsaSplitView;
  if (!C) {
    throw new Error("IsaSplitView no cargado — recargue sin caché (Ctrl+Shift+R).");
  }
  return C;
}

/** Puente a ISAFront.CodeMirrorPanel (front-shared). */
export function CodeMirrorPanel(props: Record<string, unknown>) {
  const Panel = window.ISAFront?.CodeMirrorPanel;
  if (!Panel) throw new Error("CodeMirrorPanel no cargado — recargue sin caché (Ctrl+Shift+R).");
  return Panel(props);
}

function lightboxApi() {
  const api = window.ISAComponents?.LightboxZoom;
  if (!api?.LightboxZoomDialog) {
    throw new Error("ISAComponents.LightboxZoom no cargado — recargue sin caché (Ctrl+Shift+R).");
  }
  return api;
}

/** Visor lightbox-zoom (@isa-components/lightbox). */
export const LightboxZoom = {
  get LightboxZoomDialog() { return lightboxApi().LightboxZoomDialog; },
  get LightboxZoomImage() { return lightboxApi().LightboxZoomImage; },
  get LightboxZoomInline() { return lightboxApi().LightboxZoomInline; },
  get LightboxZoomStage() { return lightboxApi().LightboxZoomStage; },
  get useLightboxZoom() { return lightboxApi().useLightboxZoom; },
  get useStageTransform() { return lightboxApi().useStageTransform; },
  get svgElementToDataUrl() { return lightboxApi().svgElementToDataUrl; },
  get openLightboxInline() { return lightboxApi().openLightboxInline; },
};

/** Alias legacy (migración desde ISAFront.Lightbox). */
export const Lightbox = {
  get LightboxZoomDialog() { return lightboxApi().LightboxZoomDialog; },
  get ImageLightboxDialog() { return lightboxApi().LightboxZoomDialog; },
  get LightboxImage() { return lightboxApi().LightboxZoomImage; },
  get LightboxZoomInline() { return lightboxApi().LightboxZoomInline; },
  get useImageLightboxZoom() { return lightboxApi().useLightboxZoom; },
  get useStageTransform() { return lightboxApi().useStageTransform; },
  get svgElementToDataUrl() { return lightboxApi().svgElementToDataUrl; },
  get openLightboxInline() { return lightboxApi().openLightboxInline; },
};

/** Constantes y utilidades del runtime compartido ISAFront (global). */
export function getRealtimeConstants() {
  const f = window.ISAFront || {};
  return {
    REALTIME: f.REALTIME || { CHECKS_UPDATED: "checks.updated" },
    REALTIME_EVENT: f.REALTIME_EVENT || "isa:realtime",
  };
}

export function formatLocalDateTime(iso: string): string {
  const fn = window.ISAFront?.formatLocalDateTime;
  if (typeof fn === "function") return fn(iso);
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? String(iso) : d.toLocaleString(undefined, {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  });
}
