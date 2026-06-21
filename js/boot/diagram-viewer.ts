/**
 * Modo visor de diagramas — query `d` (b64url del JSON {kind, payload}).
 */
import { bootShimmerHtml } from "../ui/bootShimmer.ts";

const isDist = !!(globalThis as { __ISA_DIST__?: boolean }).__ISA_DIST__
  && !new URLSearchParams(location.search).has("src");

export function applyDiagramPageLayout(): void {
  document.documentElement.classList.add("tk-doc-mode", "tk-doc-web", "tk-diagram-mode");
  document.body.classList.add("tk-doc-mode", "tk-doc-web", "tk-diagram-mode");
  const root = document.getElementById("root");
  if (root) root.classList.add("tk-doc-view", "tk-doc-web", "tk-diagram-view");
}

function bootHelperUrl(): string {
  const isLocalDev = /localhost|127\.0\.0\.1|\[::1\]/.test(location.hostname);
  if (isLocalDev) {
    return new URL("../../components/front-shared/cdn/boot-helper.mjs", import.meta.url).href;
  }
  return "https://cdn.jsdelivr.net/gh/Jeff-Aporta/front-shared@a5a6597/cdn/boot-helper.mjs?v=a87602c";
}

function syncBootTheme(): void {
  const t = (window as { ThemeInit?: { readMode?: () => string; applyThemeMode?: (m: string) => string } }).ThemeInit;
  if (t?.readMode && t?.applyThemeMode) t.applyThemeMode(t.readMode());
}

async function warmDiagramStack(): Promise<void> {
  const [cdnMod, bootHelper] = await Promise.all([
    import("./cdn.mjs"),
    import(bootHelperUrl()),
  ]);
  const { importShared, assertStack, loadIsaFront } = bootHelper;
  const stackMod = await importShared("stack.mjs");
  await stackMod.stackReady;
  assertStack();
  await Promise.all([loadIsaFront(), cdnMod.ensureLightboxZoom()]);
}

export async function runDiagramViewer(boot: { kind: string; payload: Record<string, unknown> }): Promise<void> {
  const root = document.getElementById("root");
  if (!root) throw new Error("#root no encontrado");

  syncBootTheme();
  applyDiagramPageLayout();
  root.innerHTML = bootShimmerHtml("Cargando diagrama…", { viewport: true });

  await warmDiagramStack();

  if (isDist) {
    await import("../core/isa-setup.js");
    const mod = await import("./diagram-viewer-web.js");
    mod.mountDiagramView(boot);
  } else {
    const { importAppEntry } = await import("./module-graph.mjs");
    await importAppEntry("js/core/isa-setup.ts", Babel);
    const mod = await importAppEntry("js/boot/diagram-viewer-web.jsx", Babel);
    mod.mountDiagramView(boot);
  }
  document.title = "Visor de diagrama · " + String(boot.kind || "sequence");
}
