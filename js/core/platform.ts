/*
 * Puente lazy al runtime ISAFront (window.ISAJ tras isa-setup).
 */
function isa(): IsajNs {
  const j = window.ISAJ;
  if (!j?.UI) throw new Error("ISAJ no registrado — ejecutar isa-setup.ts antes que platform");
  return j;
}

function sessionApi() {
  const j = isa();
  if (j.Session) return j.Session;
  const auth = j.Auth;
  if (!auth) throw new Error("ISAJ Session/Auth no disponible");
  return {
    current() {
      if (!auth.isLoggedIn()) return null;
      return { username: auth.username(), expiresAt: null as string | null };
    },
    isLoggedIn: () => auth.isLoggedIn(),
    username: () => auth.username(),
    authHeader: () => auth.authHeader(),
    login: (u: string, p: string) => auth.login(u, p),
    logout: () => auth.logout(),
    get EVENT() { return auth.EVENT; },
  };
}

export const UI = {
  get Icon() { return isa().UI.Icon; },
  get TargetSwitch() { return isa().UI.TargetSwitch; },
  get ThemeSwitch() { return isa().UI.ThemeSwitch; },
  get Loading() { return isa().UI.Loading; },
  get ErrorBox() { return isa().UI.ErrorBox; },
};

export const Session = {
  current: () => sessionApi().current(),
  isLoggedIn: () => sessionApi().isLoggedIn(),
  username: () => sessionApi().username(),
  authHeader: () => sessionApi().authHeader(),
  appHeader: () => sessionApi().appHeader?.() ?? {},
  appId: () => sessionApi().appId?.() ?? window.ISAJ?.APP_ID ?? null,
  login: (u: string, p: string) => sessionApi().login(u, p),
  logout: () => sessionApi().logout(),
  refreshProfile: () => sessionApi().refreshProfile?.(),
  capabilities: () => sessionApi().capabilities?.() ?? [],
  can: (cap: string) => sessionApi().can?.(cap) ?? false,
  blockReason: (cap: string) => sessionApi().blockReason?.(cap) ?? "Inicia sesión para usar este servicio",
  get EVENT() { return sessionApi().EVENT; },
};

export const Toast = {
  show: (opts: { message: string; severity?: string; durationMs?: number; title?: string }) =>
    isa().Toast?.show?.(opts) ?? isa().Feedback?.toast?.show?.({ message: opts.message, severity: opts.severity, durationMs: opts.durationMs, title: opts.title }),
};

export const Feedback = {
  get toast() { return isa().Feedback?.toast; },
  get process() { return isa().Feedback?.process; },
  runProcess: (opts: Record<string, unknown>) => isa().Feedback?.runProcess?.(opts),
  confirm: (opts: Record<string, unknown>) => isa().Feedback?.confirm?.(opts),
};

export const Realtime = {
  getStatus: () => isa().Realtime?.getStatus?.(),
};

export const Config = {
  base: () => isa().Config.base(),
  apiUrl: (path: string) => isa().Config.apiUrl(path),
};
