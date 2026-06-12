(function () {

  "use strict";

  const BOOT_HELPER =
    "https://cdn.jsdelivr.net/gh/Jeff-Aporta/front-shared@1dbb9fa/cdn/boot-helper.mjs?v=1dbb9fa";

  const MODULE_LOADER = "./js/boot/module-graph.mjs";

  const ENTRY = "js/main.jsx";



  async function boot(): Promise<void> {

    const { importShared, assertStack } = await import(BOOT_HELPER);

    const { importAppEntry } = await import(MODULE_LOADER);



    const stackMod = await importShared("stack.mjs");

    await stackMod.stackReady;

    assertStack();

    // Pin explícito: jsDelivr @main puede servir auth.js obsoleto (/auth/token sin /api).
    await import("https://cdn.jsdelivr.net/gh/Jeff-Aporta/front-shared@1dbb9fa/cdn/isa/js/index.js");

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

