/** Registra widgets compartidos en window.ISAJ vía ISAFront. */
const ORCH = {
  local: "http://localhost:8780",
  online: "https://main-orchestrator.jeffaporta.workers.dev",
};

window.ISAFront.registerApp({
  ns: "ISAJ",
  app: "jagudeloe-front",
  theme: true,
  widgets: { targetStyle: "chip" },
  api: ORCH,
  session: true,
  realtime: true,
  auth: false,
  loginButton: {
    showPasswordToggle: true,
    showExpiryInTooltip: true,
    showIntroText: true,
  },
});

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
if (window.ISAFront?.registerCodeMirror && window.React && window.MaterialUI) {
  window.ISAFront.registerCodeMirror(window.React, window.MaterialUI);
}
