/*
 * Puente lazy al runtime ISAFront (window.ISAJ tras isa-setup).
 */
const bridge = () => window.ISAFront.createPlatformBridge("ISAJ", { sessionFromAuth: true });

function frontShared() {
  const api = window.ISAFront;
  if (!api?.ensureCodeMirrorLoaded) {
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
  get SqlBlock() { return bridge().UI.SqlBlock; },
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
  getStatus: () => bridge().Realtime.getStatus(),
};

export const Config = {
  base: () => bridge().Config.base(),
  apiUrl: (path: string) => bridge().Config.apiUrl(path),
  isLocal: () => bridge().Config.isLocal(),
  setLocal: (v: boolean) => bridge().Config.setLocal(v),
};

/** Carga lazy de scripts/CSS y markdown (front-shared). */
export const Assets = {
  ensureCodeMirrorLoaded: (opts?: { sql?: boolean }) => frontShared().ensureCodeMirrorLoaded!(opts),
  ensureMarked: () => frontShared().ensureMarked!(),
  ensureStylesheet: (href: string) => frontShared().ensureLazyStylesheet!(href),
};

export function mdToHtml(src: string): string {
  return frontShared().mdToHtml!(src);
}

/** Acceso al stack React/MUI (front-shared). */
export const getReact = () => window.ISAFront.getReact();
export const getReactDOM = () => window.ISAFront.getReactDOM();
export const getMaterialUI = () => window.ISAFront.getMaterialUI();

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
