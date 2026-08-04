import { AUTH_DEFAULTS as D } from "../config/constants.js";
import { wrapPassword } from "./caesar.js";
import { createTokenStore, isTokenValid } from "./token-store.js";
import { blockReasonFor, resolveCapId } from "../caps/capabilities.js";
import { sanitizeUserMessage } from "../util/sanitize-user-message.js";
import { normalizeContapymeLoginId } from "../util/format.js";
import { fetchRaw, wrapFetchError, localDevHint, isDevHost } from "../http/api-http.js";

/* Suplantación (view-as de usuario) erradicada (21-jul-2026) de todos los workers y fronts. */
const ADMIN_PERSISTENT_CAPS = new Set([
  "patyia.jwt.admin",
  "infra.target.switch",
]);

/** Sesión JWT por aplicación + capacidades de servicio (resueltas en system-login). */
export function registerSession(ns, opts = {}) {
  const appId = String(opts.appId || opts.app || "").trim();
  if (!appId) throw new Error("registerSession: appId requerido");
  const sessionKey = opts.sessionKey || `${D.sessionKey}:${appId}`;
  const authEvt = opts.authEvent || D.authEvent;
  const authLocalKey = opts.authLocalKey || D.authLocalKey;
  const authLocal = opts.authLocal || D.authLocal;
  const authOnline = opts.authOnline || D.authOnline;
  const store = createTokenStore(sessionKey);

  function authBase() {
    return authOnline;
  }

  function authUrl(path) {
    return authBase().replace(/\/$/, "") + (path.charAt(0) === "/" ? path : "/" + path);
  }

  function readSession() {
    const data = store.read();
    if (!data) return null;
    if (data.app && data.app !== appId) {
      store.clear();
      return null;
    }
    if (!isTokenValid(data)) {
      store.clear();
      return null;
    }
    return data;
  }

  function saveSession(data) {
    const caps = Array.isArray(data.capabilities) ? data.capabilities : [];
    const adminCaps = Array.isArray(data.adminCapabilities) ? data.adminCapabilities : caps;
    store.save({
      username: data.username,
      displayName: data.displayName ?? null,
      role: data.role ?? null,
      token: data.token,
      expiresAt: data.expiresAt ?? null,
      app: appId,
      capabilities: caps,
      adminCapabilities: adminCaps,
      capabilityCatalog: Array.isArray(data.capabilityCatalog) ? data.capabilityCatalog : [],
    });
    window.dispatchEvent(new Event(authEvt));
  }

  function clearSession() {
    store.clear();
    window.dispatchEvent(new Event(authEvt));
  }

  let session = readSession();
  let refreshPromise = null;

  function current() {
    session = readSession();
    return session;
  }

  function isLoggedIn() {
    session = readSession();
    return isTokenValid(session);
  }

  function username() {
    const s = current();
    if (!s) return null;
    return s.username || null;
  }

  function displayName() {
    const s = current();
    if (!s) return null;
    const dn = String(s.displayName ?? "").trim();
    return dn || null;
  }

  function realUsername() {
    return current()?.username ?? null;
  }

  function auditAuthor() {
    return String(realUsername() || username() || "").trim().toUpperCase();
  }

  function adminCapabilities() {
    const s = current();
    const caps = s?.adminCapabilities;
    return Array.isArray(caps) && caps.length ? caps : capabilities();
  }

  function capabilities() {
    const s = current();
    return Array.isArray(s?.capabilities) ? s.capabilities : [];
  }

  function capabilityCatalog() {
    const s = current();
    return Array.isArray(s?.capabilityCatalog) ? s.capabilityCatalog : [];
  }

  function isAdminRole() {
    const role = String(current()?.role || "").trim().toLowerCase();
    return role === "admin";
  }

  function can(capOrLegacy) {
    const capId = resolveCapId(capOrLegacy);
    if (!isLoggedIn()) return false;
    const pool = ADMIN_PERSISTENT_CAPS.has(capId) ? adminCapabilities() : capabilities();
    if (pool.includes(capId)) return true;
    if (ADMIN_PERSISTENT_CAPS.has(capId) && isAdminRole()) return true;
    return false;
  }

  function blockReason(capOrLegacy) {
    const capId = resolveCapId(capOrLegacy);
    return blockReasonFor(capId, {
      loggedIn: isLoggedIn(),
      username: username(),
    });
  }

  function appHeader() {
    return { "X-App-Id": appId };
  }

  /** Auth genérico (ISS, capFetch, APIs propias) — siempre el Bearer real. */
  function authHeader() {
    return isLoggedIn() ? { Authorization: "Bearer " + session.token, ...appHeader() } : {};
  }

  /** Sesión = JWT ISS (portal-login). system-login /api/session no conoce estos JWT
   *  (devolvía 401 en cada arranque) y los permisos viven en el ISS (/api/permissions/me),
   *  así que no hay nada que refrescar contra system-login. */
  async function refreshProfile() {
    return current();
  }

  function loginErrorMessage(res, data) {
    if (data?.code === "MULTI_EMPRESA" && Array.isArray(data.terceros) && data.terceros.length) {
      const e = new Error(String(data.error || "Elija la empresa para continuar."));
      e.code = "MULTI_EMPRESA";
      e.terceros = data.terceros;
      return e;
    }
    const apiErr = String(data?.error || "").trim();
    if (apiErr && !/^HTTP \d{3}$/.test(apiErr)) {
      return sanitizeUserMessage(apiErr, "No se pudo iniciar sesión");
    }
    if (res.status === 403) {
      if (data?.app) return `No tiene acceso a la aplicación (${data.app}). Solicite permiso al administrador.`;
      return "No tiene acceso a esta aplicación.";
    }
    if (res.status === 401) return "Usuario o contraseña incorrectos.";
    if (res.status >= 500) return "El servicio de acceso no está disponible. Intente más tarde.";
    return "No se pudo iniciar sesión";
  }

  async function login(user, pass, opts = {}) {
    const loginId = normalizeContapymeLoginId(user);
    if (!loginId) {
      throw new Error("Usuario y contraseña requeridos");
    }
    const credBody = {
      password: wrapPassword(pass),
      app: appId,
      semail: loginId,
    };
    const itercero = String(opts.itercero ?? "").trim();
    if (itercero) credBody.itercero = itercero;
    const isLocal = authBase() === authLocal;
    const hint = localDevHint(isLocal && isDevHost());
    let res;
    try {
      res = await fetchRaw(authUrl("/api/auth/portal-login"), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...appHeader() },
        body: JSON.stringify(credBody),
      });
    } catch (e) {
      throw wrapFetchError(e, hint);
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.token) {
      const err = loginErrorMessage(res, data);
      if (err instanceof Error && err.code === "MULTI_EMPRESA") throw err;
      throw new Error(typeof err === "string" ? err : "No se pudo iniciar sesión");
    }
    if (data.app && data.app !== appId) {
      throw new Error("Token emitido para otra aplicación");
    }
    session = {
      username: data.username || user,
      displayName: data.displayName || null,
      role: data.role || null,
      token: data.token,
      expiresAt: data.expiresAt || null,
      app: appId,
      capabilities: Array.isArray(data.capabilities) ? data.capabilities : [],
      adminCapabilities: Array.isArray(data.capabilities) ? data.capabilities : [],
      capabilityCatalog: Array.isArray(data.capabilityCatalog) ? data.capabilityCatalog : [],
    };
    saveSession(session);
    if (!session.capabilities.length) {
      refreshProfile().catch(() => null);
    }
    return session;
  }

  function logout() {
    session = null;
    clearSession();
  }

  const sessionApi = {
    current,
    isLoggedIn,
    username,
    displayName,
    realUsername,
    auditAuthor,
    authHeader,
    appHeader,
    appId: () => appId,
    login,
    logout,
    refreshProfile,
    capabilities,
    adminCapabilities,
    capabilityCatalog,
    can,
    blockReason,
    EVENT: authEvt,
  };

  const bag = window[ns] || {};
  bag.APP_ID = appId;
  bag.AuthApi = {
    AUTH_LOCAL: authLocal,
    AUTH_ONLINE: authOnline,
    SESSION_KEY: sessionKey,
    SESSION_EVT: authEvt,
    APP_ID: appId,
    authBase,
    authUrl,
    saveSession,
    readSession,
    isLoggedIn,
    authHeader,
    appHeader,
  };
  bag.Session = sessionApi;
  bag.Auth = {
    isLoggedIn,
    username,
    authHeader,
    appHeader,
    appId: () => appId,
    login,
    logout,
    refreshProfile,
    capabilities,
    capabilityCatalog,
    can,
    blockReason,
    EVENT: authEvt,
    LOGIN_URL: opts.loginUrl || D.loginUrl,
    AUTH_ONLINE: authOnline,
  };
  window[ns] = bag;

  if (isLoggedIn()) {
    const s = current();
    const needsRefresh = !Array.isArray(s?.capabilities) || !s.capabilities.length
      || !String(s?.displayName ?? "").trim();
    if (needsRefresh) {
      refreshProfile().catch(() => {});
    }
    window.dispatchEvent(new Event(authEvt));
  }
}
