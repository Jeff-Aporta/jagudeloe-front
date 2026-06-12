(function () {

  "use strict";

  const BOOT_HELPER =
    "https://cdn.jsdelivr.net/gh/Jeff-Aporta/front-shared@main/cdn/boot-helper.mjs";

  const MODULE_LOADER = "./js/boot/module-graph.mjs";

  const ENTRY = "js/main.jsx";



  async function boot(): Promise<void> {

    const { importShared, assertStack, loadIsaFront } = await import(BOOT_HELPER);

    const { importAppEntry } = await import(MODULE_LOADER);



    const stackMod = await importShared("stack.mjs");

    await stackMod.stackReady;

    assertStack();

    await loadIsaFront();

    await importAppEntry("js/core/isa-setup.ts", Babel);

    await importAppEntry(ENTRY, Babel);

  }



  function showErr(err: unknown): void {

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

