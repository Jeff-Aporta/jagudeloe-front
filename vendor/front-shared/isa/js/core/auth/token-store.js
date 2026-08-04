/** Persistencia JWT compartida (localStorage + migración desde sessionStorage). */

export function createTokenStore(sessionKey) {
  function read() {
    try {
      let raw = localStorage.getItem(sessionKey);
      if (!raw) {
        const legacy = sessionStorage.getItem(sessionKey);
        if (legacy) {
          localStorage.setItem(sessionKey, legacy);
          sessionStorage.removeItem(sessionKey);
          raw = legacy;
        }
      }
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function save(data) {
    const payload = JSON.stringify(data);
    localStorage.setItem(sessionKey, payload);
    try {
      sessionStorage.removeItem(sessionKey);
    } catch (e) {
      /* ignore */
    }
  }

  function clear() {
    localStorage.removeItem(sessionKey);
    try {
      sessionStorage.removeItem(sessionKey);
    } catch (e) {
      /* ignore */
    }
  }

  return { read, save, clear };
}

/** Decodifica el payload de un JWT (sin validar firma) y devuelve el objeto de claims. */
export function decodeJwtPayload(token) {
  if (typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const padded = parts[1].replace(/-/g, "+").replace(/_/g, "/") + "===".slice((parts[1].length + 3) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

/**
 * ISS portal-login emite JWTs con la firma `iapp` (claim numérico).
 * `system-login` (legacy, ya eliminado) emitía JWTs sin esos claims — esos tokens
 * son basura y el ISS los rechaza con 401. Sin este filtro, la SPA muestra
 * "logueado" con un token muerto (causa: "Rol: Usuario" + "Sin mensajes").
 */
export function isIssPortalJwt(token) {
  const p = decodeJwtPayload(token);
  if (!p) return false;
  return p.iapp != null
    || p.iterceropropietario != null
    || (typeof p.ientity === "string" && p.ientity.length > 0);
}

export function isTokenValid(record) {
  if (!record?.token) return false;
  if (record.expiresAt && new Date(record.expiresAt).getTime() < Date.now()) return false;
  // legacy LAB/system-login JWT (sin claims del portal-login ISS) → inválido para este app.
  // session.js ya borra la sesión cuando esto devuelve false (readSession → store.clear).
  if (!isIssPortalJwt(record.token)) return false;
  return true;
}

