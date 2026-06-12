/** Re-render al iniciar/cerrar sesión (system-login:auth + storage). */
import { getReact } from "./runtime.ts";
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
  const can = Session.can;

  function canExecSql() {
    if (!loggedIn) return false;
    if (typeof can === "function") {
      return can("ejecutar_sql") || can("ejecutar_mssql") || can("guardar_langlab");
    }
    return true;
  }

  return { loggedIn, username: Session.username(), can, canExecSql };
}
