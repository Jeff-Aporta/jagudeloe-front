/** Registra widgets compartidos en window.ISAJ vía ISAFront. */
import { useThemeMode, makeNeonTheme } from "./theme.ts";

/** URLs del orquestador (front-shared/constants.js). */
const ORCH = {
  local: "http://localhost:8780",
  online: "https://main-orchestrator.jeffaporta.workers.dev",
  lsKey: "jeff:gateway-local",
  event: "jeff:gateway-target",
};

window.ISAFront.registerApp({
  ns: "ISAJ",
  app: "jagudeloe-front",
  theme: { lsKey: "jagudeloe:theme" },
  widgets: { targetStyle: "chip" },
  api: ORCH,
  session: true,
  realtime: true,
  auth: false,
});

if (window.ISAJ?.Theme) {
  window.ISAJ.Theme = {
    ...window.ISAJ.Theme,
    useThemeMode,
    makeTheme: makeNeonTheme,
  };
}

if (!window.ISAJ?.Session) {
  throw new Error(
    "ISAJ.Session no registrado — recargue sin caché (Ctrl+Shift+R). " +
      "Si persiste, actualice FRONT_SHARED_REF en front-shared/cdn/boot-helper.mjs.",
  );
}
if (!window.ISAJ.Session.isLoggedIn()) {
  window.ISAJ.Config.setLocal(false);
}
if (!window.ISAJ?.Realtime && window.ISAFront.registerRealtime) {
  window.ISAFront.registerRealtime("ISAJ", {});
}
