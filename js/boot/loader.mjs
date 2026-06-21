/**
 * Arranque jagudeloe — producción: _dist + __ISA_DIST__ (sin Babel en app).
 * Desarrollo: ?src=1 o sin __ISA_DIST__ → transpila js/ con module-graph + Babel.
 */
import { asset, ensureLightboxZoom } from "./cdn.mjs";

const bootHold = new URLSearchParams(location.search).has("isa_boot_hold");
const useSource = new URLSearchParams(location.search).has("src");
const isDist = typeof globalThis !== "undefined" && globalThis.__ISA_DIST__ && !useSource;

function docPrefetch() {
  try {
    const raw = new URLSearchParams(location.search).get("s");
    if (!raw) return;
    let b = String(raw).replace(/-/g, "+").replace(/_/g, "/");
    while (b.length % 4) b += "=";
    const s = JSON.parse(decodeURIComponent(escape(atob(b))));
    if (s.view !== "doc" || !s.space || !s.sel) return;
    const space = String(s.space).toLowerCase();
    let tk = String(s.sel).trim().toUpperCase();
    if (!tk.startsWith("TK-")) tk = `TK-${tk}`;
    const api = `https://jagudeloe-tks.jeffaporta.workers.dev/api/tk/${encodeURIComponent(space)}/tickets/${encodeURIComponent(tk)}`;
    globalThis.__TK_DOC_PREFETCH__ = fetch(api, { headers: { Accept: "application/json" } })
      .then((r) => r.json())
      .catch(() => null);
    if (s.driver !== "html") {
      globalThis.__TK_STACK_PREFETCH__ = import(
        "https://cdn.jsdelivr.net/gh/Jeff-Aporta/front-shared@a5a6597/cdn/stack.mjs?v=a87602c",
      );
    }
  } catch { /* ignore */ }
}
docPrefetch();

async function loadIsaFrontPinned(h) {
  if (isDist) {
    await import(asset("isa/js/index.js"));
  } else {
    await h.loadIsaFront();
    if (!globalThis.ISAFront?.ensureCodeMirrorLoaded) {
      await import(asset("isa/js/index.js"));
    }
  }
  if (!globalThis.ISAFront?.ensureCodeMirrorLoaded) {
    throw new Error("ISAFront incompleto — lazy-assets no disponibles en el pin CDN");
  }
}

async function warmFullStack(h, getBabel, { sharedUi = false } = {}) {
  const stackPref = globalThis.__TK_STACK_PREFETCH__;
  if (stackPref) globalThis.__TK_STACK_PREFETCH__ = undefined;
  const stackMod = stackPref ? await stackPref : await h.importShared("stack.mjs");
  await stackMod.stackReady;
  h.assertStack();
  await loadIsaFrontPinned(h);
  // AppShell y widgets compartidos viven en front-shared/ui — Babel solo para esos JSX del CDN.
  if (sharedUi) await h.loadSharedUi(getBabel());
  await ensureLightboxZoom();
}

function showBootErr(err) {
  const root = document.getElementById("root");
  const msg = err instanceof Error ? err.stack || err.message : String(err);
  if (root) {
    root.innerHTML = `<pre style="color:#ff8a80;padding:24px;font-family:monospace">Error de arranque:\n${msg}</pre>`;
  }
  console.error(err);
}

import(asset("boot-loader.mjs")).then(({ mountBoot, getBabel, importBootHelper }) => {
  mountBoot(async () => {
    if (bootHold) return;

    const h = await importBootHelper();
    const { docBootFromSearch, diagramBootFromSearch } = await import("./url-s.mjs");

    const diagramBoot = diagramBootFromSearch();
    if (diagramBoot) {
      if (isDist) {
        const mod = await import("./diagram-viewer.js");
        await mod.runDiagramViewer(diagramBoot);
      } else {
        const { importAppEntry } = await import("./module-graph.mjs");
        const mod = await importAppEntry("js/boot/diagram-viewer.ts", getBabel());
        await mod.runDiagramViewer(diagramBoot);
      }
      return;
    }

    const docBoot = docBootFromSearch();
    if (docBoot) {
      if (isDist) {
        const mod = await import("./doc-viewer.js");
        if (mod.applyDocPageLayout) mod.applyDocPageLayout(docBoot.driver === "html" ? "html" : "jsx");
        await mod.runDocViewer(docBoot);
      } else {
        const { importAppEntry } = await import("./module-graph.mjs");
        const mod = await importAppEntry("js/boot/doc-viewer.ts", getBabel());
        if (mod.applyDocPageLayout) mod.applyDocPageLayout(docBoot.driver === "html" ? "html" : "jsx");
        await mod.runDocViewer(docBoot);
      }
      return;
    }

    if (isDist) {
      const manifest = await import("../core/app-manifest.js");
      manifest.installAppManifest(await manifest.fetchAppManifest());
    } else {
      const { importAppEntry } = await import("./module-graph.mjs");
      const manifestMod = await importAppEntry("js/core/app-manifest.ts", getBabel(), { reset: true });
      manifestMod.installAppManifest(await manifestMod.fetchAppManifest());
    }

    await warmFullStack(h, getBabel, { sharedUi: true });

    if (isDist) {
      await import("../core/isa-setup.js");
      await import("../main.js");
    } else {
      const { importAppEntry } = await import("./module-graph.mjs");
      await importAppEntry("js/core/isa-setup.ts", getBabel());
      await importAppEntry("js/main.jsx", getBabel());
    }
  });
}).catch(showBootErr);
