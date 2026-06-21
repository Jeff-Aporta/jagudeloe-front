(function () {
  "use strict";

  const MODULE_LOADER = "./js/boot/module-graph.mjs";
  const ENTRY = "js/main.jsx";

  /** boot-helper puede cargar index.js de un pin sin lazy-assets — reforzar con el pin de la app. */
  async function loadIsaFrontPinned(h: { loadIsaFront: () => Promise<void> }, asset: (p: string) => string) {
    await h.loadIsaFront();
    if (!window.ISAFront?.ensureCodeMirrorLoaded) {
      await import(asset("isa/js/index.js"));
    }
    if (!window.ISAFront?.ensureCodeMirrorLoaded) {
      throw new Error("ISAFront incompleto — lazy-assets no disponibles en el pin CDN");
    }
  }

  async function boot() {
    if (new URLSearchParams(location.search).has("isa_boot_hold")) return;

    const { docBootFromSearch, diagramBootFromSearch } = await import("./js/boot/url-s.mjs");
    const { importAppEntry } = await import(MODULE_LOADER);

    const diagramBoot = diagramBootFromSearch();
    if (diagramBoot) {
      const mod = await importAppEntry("js/boot/diagram-viewer.ts", Babel);
      await mod.runDiagramViewer(diagramBoot);
      return;
    }

    const docBoot = docBootFromSearch();
    if (docBoot) {
      const mod = await importAppEntry("js/boot/doc-viewer.ts", Babel);
      if (mod.applyDocPageLayout) mod.applyDocPageLayout(docBoot.driver === "html" ? "html" : "jsx");
      await mod.runDocViewer(docBoot);
      return;
    }

    const { bootHelperUrl, asset, ensureLightboxZoom } = await import("./js/boot/cdn.mjs");
    const manifestMod = await importAppEntry("js/core/app-manifest.ts", Babel, { reset: true });
    manifestMod.installAppManifest(await manifestMod.fetchAppManifest());

    const { importShared, assertStack, loadIsaFront, loadSharedUi } = await import(bootHelperUrl);

    const stackMod = await importShared("stack.mjs");
    await stackMod.stackReady;
    assertStack();

    await loadIsaFrontPinned({ loadIsaFront }, asset);
    await loadSharedUi(Babel);
    await ensureLightboxZoom();
    await importAppEntry("js/core/isa-setup.ts", Babel);
    await importAppEntry(ENTRY, Babel);
  }

  function showErr(err: unknown) {
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
