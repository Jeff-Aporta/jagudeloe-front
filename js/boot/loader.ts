(function () {
  "use strict";

  const BOOT_HELPER =
    "https://cdn.jsdelivr.net/gh/Jeff-Aporta/front-shared@9ecf1cc/cdn/boot-helper.mjs?v=9ecf1cc";

  const MODULE_LOADER = "./js/boot/module-graph.mjs";
  const ENTRY = "js/main.jsx";

  async function boot() {
    const { importShared, assertStack, loadIsaFront, loadSharedUi } = await import(BOOT_HELPER);
    const { importAppEntry } = await import(MODULE_LOADER);

    const stackMod = await importShared("stack.mjs");
    await stackMod.stackReady;
    assertStack();

    await loadIsaFront();
    await loadSharedUi(Babel);
    await importAppEntry("js/core/isa-setup.ts", Babel);
    await importAppEntry(ENTRY, Babel);
  }

  function showErr(err) {
    const root = document.getElementById("root");
    const msg = err instanceof Error ? err.stack || err.message : String(err);
    if (root) {
      root.innerHTML = '<pre style="color:#ff8a80;padding:24px;font-family:monospace">Error de arranque:\n' + msg + "</pre>";
    }
    console.error(err);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => boot().catch(showErr));
  } else {
    boot().catch(showErr);
  }
})();
