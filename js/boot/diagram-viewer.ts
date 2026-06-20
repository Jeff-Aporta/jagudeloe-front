/**
 * Modo visor de diagramas — query `d` (b64url del JSON {kind, payload}).
 * Arranca el runtime compartido (sin fetch de ticket) y monta el visor full-page.
 */
import { bootShimmerHtml } from "../ui/bootShimmer.ts";

export function applyDiagramPageLayout(): void {
  document.documentElement.classList.add("tk-doc-mode", "tk-doc-web", "tk-diagram-mode");
  document.body.classList.add("tk-doc-mode", "tk-doc-web", "tk-diagram-mode");
  const root = document.getElementById("root");
  if (root) root.classList.add("tk-doc-view", "tk-doc-web", "tk-diagram-view");
}

function appAssetUrl(path: string): string {
  const p = path.replace(/^\.\//, "");
  const base = document.querySelector("base")?.href ?? new URL(".", window.location.href).href;
  return new URL(p, base).href;
}

function bootHelperUrl(): string {
  const isLocalDev = /localhost|127\.0\.0\.1|\[::1\]/.test(location.hostname);
  if (isLocalDev) {
    return appAssetUrl("../../components/front-shared/cdn/boot-helper.mjs");
  }
  return "https://cdn.jsdelivr.net/gh/Jeff-Aporta/front-shared@a5a6597/cdn/boot-helper.mjs?v=a87602c";
}

function syncBootTheme(): void {
  const t = (window as { ThemeInit?: { readMode?: () => string; applyThemeMode?: (m: string) => string } }).ThemeInit;
  if (t?.readMode && t?.applyThemeMode) t.applyThemeMode(t.readMode());
}

export async function runDiagramViewer(boot: { kind: string; payload: Record<string, unknown> }): Promise<void> {
  const root = document.getElementById("root");
  if (!root) throw new Error("#root no encontrado");

  syncBootTheme();
  applyDiagramPageLayout();
  root.innerHTML = bootShimmerHtml("Cargando diagrama…", { viewport: true });

  const cdnMod = await import(appAssetUrl("js/boot/cdn.mjs"));
  const { importShared, assertStack, loadIsaFront, loadSharedUi } = await import(bootHelperUrl());
  const { importAppEntry } = await import(appAssetUrl("js/boot/module-graph.mjs"));

  const stackMod = await importShared("stack.mjs");
  await stackMod.stackReady;
  assertStack();
  await loadIsaFront();
  await loadSharedUi(Babel);
  await cdnMod.ensureLightboxZoom();
  await importAppEntry("js/core/isa-setup.ts", Babel);

  const mod = await importAppEntry("js/boot/diagram-viewer-web.jsx", Babel);
  mod.mountDiagramView(boot);
  document.title = "Visor de diagrama · " + String(boot.kind || "sequence");
}
