/** Registra widgets compartidos en window.ISAJ vía ISAFront. */
import { registerBootShimmer } from "../ui/bootShimmer.ts";

const ORCH = {
  local: "http://localhost:8780",
  online: "https://main-orchestrator.jeffaporta.workers.dev",
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
  loginButton: {
    showPasswordToggle: true,
    showExpiryInTooltip: true,
    showIntroText: true,
  },
});

registerBootShimmer("ISAJ");

/** Mantiene body[data-mui-color-scheme] alineado con <html> (shimmer + doc-view). */
(function syncThemeSchemeOnBody() {
  const bag = window.ISAJ;
  if (!bag?.Theme || bag.Theme.__bodySyncPatched) return;
  function sync() {
    const m = document.documentElement.getAttribute("data-mui-color-scheme");
    if (m === "light" || m === "dark") {
      document.body.setAttribute("data-mui-color-scheme", m);
    }
  }
  sync();
  try {
    new MutationObserver(sync).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-mui-color-scheme"],
    });
  } catch { /* ignore */ }
  bag.Theme.__bodySyncPatched = true;
})();

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
