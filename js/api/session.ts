/*
 * api/session — JWT contra Cloudflare system-login (Neon BD_AUTH).
 * API de negocio (bitácora, tickets) sigue en Azure langlab.
 */

interface LabSession {
  username: string;
  role: string | null;
  token: string;
  expiresAt: string | null;
}

(function () {
  "use strict";

  const KEY = "system-login:session";
  const EVT = "system-login:auth";

  function load(): LabSession | null {
    const api = (window as any).ISAJ.AuthApi;
    if (api?.readSession) return api.readSession() as LabSession | null;
    try { const v = sessionStorage.getItem(KEY); return v ? (JSON.parse(v) as LabSession) : null; } catch (e) { return null; }
  }
  function save(sess: LabSession | null): void {
    const api = (window as any).ISAJ.AuthApi;
    if (sess && api?.saveSession) { api.saveSession(sess); window.dispatchEvent(new Event(EVT)); return; }
    try {
      if (sess) sessionStorage.setItem(KEY, JSON.stringify(sess));
      else sessionStorage.removeItem(KEY);
    } catch (e) {}
    window.dispatchEvent(new Event(EVT));
  }

  let session: LabSession | null = load();

  function current(): LabSession | null { return session ?? load(); }
  function isLoggedIn(): boolean {
    session = session ?? load();
    if (!session || !session.token) return false;
    if (session.expiresAt && new Date(session.expiresAt).getTime() < Date.now()) return false;
    return true;
  }
  function username(): string | null { return session ? session.username : null; }
  function authHeader(): Record<string, string> {
    const api = (window as any).ISAJ.AuthApi;
    if (api?.authHeader) return api.authHeader();
    return isLoggedIn() ? { Authorization: "Bearer " + session!.token } : {};
  }

  async function login(user: string, pass: string): Promise<LabSession> {
    const authApi = (window as any).ISAJ.AuthApi;
    const caesar = (window as any).ISAJ.Caesar;
    const wrap = caesar?.wrapPassword ?? ((p: string) => p);
    const res = await fetch(authApi.authUrl("/auth/token"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: user, password: wrap(pass) }),
    });
    const data = await res.json().catch(() => ({} as any));
    if (!res.ok || !data.token) throw new Error(data.error || ("Login falló (" + res.status + ")"));
    session = {
      username: data.username || user,
      role: data.role || null,
      token: data.token,
      expiresAt: data.expiresAt || null,
    };
    save(session);
    return session;
  }

  function logout(): void { session = null; save(null); }

  const w = window as any;
  w.ISAJ = w.ISAJ || {};
  w.ISAJ.Session = { current, isLoggedIn, username, authHeader, login, logout, EVENT: EVT };
})();
