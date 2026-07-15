/** Re-render al iniciar/cerrar sesión (system-login:auth + storage). */
import { getReact } from "./platform.ts";
import { Session } from "./platform.ts";

const SESSION_KEY_PREFIX = "system-login:session:jagudeloe-front";

export function useSession() {
  const { useState, useEffect } = getReact();
  const [, bump] = useState(0);

  useEffect(() => {
    function sync(e?: Event) {
      if (e?.type === "storage") {
        const se = e as StorageEvent;
        if (se.key && se.key !== SESSION_KEY_PREFIX) return;
      }
      bump((n) => n + 1);
    }
    window.addEventListener(Session.EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(Session.EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const loggedIn = Session.isLoggedIn();

  function can(capId: string) {
    return Session.can?.(capId) ?? false;
  }

  function blockReason(capId: string) {
    return Session.blockReason?.(capId) ?? "Inicia sesión para usar este servicio";
  }

  /** SQL ISA (capability sql.exec.isa). */
  function canExecSql(capId = "sql.exec.isa") {
    if (!loggedIn) return false;
    return can(capId);
  }

  function execSqlBlockReason(capId = "sql.exec.isa") {
    return blockReason(capId);
  }

  return {
    loggedIn,
    username: Session.username(),
    can,
    blockReason,
    canExecSql,
    execSqlBlockReason,
  };
}
