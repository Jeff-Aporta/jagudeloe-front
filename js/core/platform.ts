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
  login: (u: string, p: string) => sessionApi().login(u, p),
  logout: () => sessionApi().logout(),
  get EVENT() { return sessionApi().EVENT; },
  can: (perm: string) => isa().Session?.can?.(perm),
};

export const Toast = {
  show: (opts: { message: string; severity?: string; durationMs?: number }) => isa().Toast?.show?.(opts),
};

export const Realtime = {
  getStatus: () => isa().Realtime?.getStatus?.(),
};

export const Config = {
  base: () => isa().Config.base(),
  apiUrl: (path: string) => isa().Config.apiUrl(path),
};
