/* core/auth-api — login Cloudflare system-login (compartido con PatyIA / langlab). */
(function () {
  "use strict";
  const AUTH_LOCAL = "http://localhost:8787";
  const AUTH_ONLINE = "https://system-login.jeffaporta.workers.dev";
  const SESSION_KEY = "system-login:session";
  const SESSION_EVT = "system-login:auth";

  function authBase(): string {
    try {
      if (localStorage.getItem("system-login:auth-local") === "1") return AUTH_LOCAL;
    } catch (e) {}
    return AUTH_ONLINE;
  }
  function authUrl(path: string): string {
    return authBase().replace(/\/$/, "") + (path.charAt(0) === "/" ? path : "/" + path);
  }
  function saveSession(data: { username: string; role?: string | null; token: string; expiresAt?: string | null }) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      username: data.username,
      role: data.role ?? null,
      token: data.token,
      expiresAt: data.expiresAt ?? null,
    }));
    window.dispatchEvent(new Event(SESSION_EVT));
  }
  function readSession() {
    try {
      const v = sessionStorage.getItem(SESSION_KEY);
      return v ? JSON.parse(v) : null;
    } catch (e) { return null; }
  }
  function authHeader(): Record<string, string> {
    const s = readSession();
    return s?.token ? { Authorization: "Bearer " + s.token } : {};
  }

  const w = window as any;
  w.ISAJ = w.ISAJ || {};
  w.ISAJ.AuthApi = { authUrl, saveSession, readSession, authHeader, SESSION_KEY, SESSION_EVT, AUTH_ONLINE };
})();
