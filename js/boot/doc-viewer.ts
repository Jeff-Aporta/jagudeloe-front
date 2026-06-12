/**
 * Vista documento — ticket sin shell de la app.
 * Drivers: html (correo + copiar HTML) | jsx (presentación web + tema).
 */
import { renderTicketViewHtml, renderTicketEmailHtml } from "../ui/tkHtml.ts";
import { hydrateTkCodeBlocks } from "../ui/tkCodeHydrate.ts";

const ORCH = {
  local: "http://localhost:8780",
  online: "https://main-orchestrator.jeffaporta.workers.dev",
  lsKey: "jeff:gateway-local",
};

function apiBase(): string {
  try {
    if (localStorage.getItem(ORCH.lsKey) === "1") return ORCH.local;
  } catch { /* ignore */ }
  return ORCH.online;
}

function showError(root: HTMLElement, message: string) {
  root.innerHTML = `<p style="margin:0;padding:24px;font-family:Tahoma,Arial,sans-serif;color:#c62828">${message}</p>`;
}

/** Scroll en body — la app normal usa overflow:hidden (base.css). */
export function applyDocPageLayout(driver: "html" | "jsx" = "jsx"): void {
  document.documentElement.classList.add("tk-doc-mode");
  document.body.classList.add("tk-doc-mode");
  const root = document.getElementById("root");
  if (root) root.classList.add("tk-doc-view");
  if (driver === "jsx") {
    document.documentElement.classList.add("tk-doc-web");
    document.body.classList.add("tk-doc-web");
  } else {
    document.documentElement.classList.add("tk-doc-html");
    document.body.classList.add("tk-doc-html");
  }
}

async function fetchTicket(space: string, iticket: string): Promise<Record<string, unknown> | null> {
  const url = apiBase().replace(/\/$/, "") + "/api/tk/" + encodeURIComponent(space) + "/tickets/" + encodeURIComponent(iticket);
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) return null;
    return (data.ticket || {}) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function mountHtmlToolbar(tk: Record<string, unknown>) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "tk-doc-fab";
  btn.title = "Copiar HTML para correo";
  btn.setAttribute("aria-label", "Copiar HTML para correo");
  btn.innerHTML = '<img src="https://api.iconify.design/mdi/content-copy.svg?color=%230b2e4e" width="22" height="22" alt="" />';
  let done = false;
  btn.addEventListener("click", () => {
    navigator.clipboard.writeText(renderTicketEmailHtml(tk)).then(() => {
      done = true;
      btn.title = "HTML copiado";
      btn.innerHTML = '<img src="https://api.iconify.design/mdi/check.svg?color=%232e9e5b" width="22" height="22" alt="" />';
      setTimeout(() => {
        done = false;
        btn.title = "Copiar HTML para correo";
        btn.innerHTML = '<img src="https://api.iconify.design/mdi/content-copy.svg?color=%230b2e4e" width="22" height="22" alt="" />';
      }, 1500);
    }).catch(() => {});
  });
  document.body.appendChild(btn);
}

function runHtmlDriver(root: HTMLElement, tk: Record<string, unknown>): void {
  applyDocPageLayout("html");
  root.classList.add("tk-doc-html");
  root.innerHTML = renderTicketViewHtml(tk);
  hydrateTkCodeBlocks(root, "light");
  mountHtmlToolbar(tk);
}

function appAssetUrl(path: string): string {
  const p = path.replace(/^\.\//, "");
  const base = document.querySelector("base")?.href ?? new URL(".", window.location.href).href;
  return new URL(p, base).href;
}

async function runJsxDriver(tk: Record<string, unknown>): Promise<void> {
  const BOOT_HELPER =
    "https://cdn.jsdelivr.net/gh/Jeff-Aporta/front-shared@05509e7/cdn/boot-helper.mjs?v=05509e7";

  const { importShared, assertStack, loadIsaFront, loadSharedUi } = await import(BOOT_HELPER);
  const { importAppEntry } = await import(appAssetUrl("js/boot/module-graph.mjs"));

  const stackMod = await importShared("stack.mjs");
  await stackMod.stackReady;
  assertStack();
  await loadIsaFront();
  await loadSharedUi(Babel);
  await importAppEntry("js/core/isa-setup.ts", Babel);
  const mod = await importAppEntry("js/boot/doc-viewer-web.jsx", Babel);
  mod.mountDocWebView(tk);
}

export async function runDocViewer(boot: { space: string; sel: string; driver?: string }): Promise<void> {
  const root = document.getElementById("root");
  if (!root) throw new Error("#root no encontrado");

  const space = boot.space.toLowerCase();
  const iticket = boot.sel.toUpperCase().startsWith("TK-") ? boot.sel.toUpperCase() : "TK-" + boot.sel;
  const driver = boot.driver === "html" ? "html" : "jsx";

  applyDocPageLayout(driver);
  root.innerHTML = '<p style="margin:0;padding:24px;font-family:Tahoma,Arial,sans-serif;color:#6b7785">Cargando documentación…</p>';

  const tk = await fetchTicket(space, iticket);
  if (!tk) {
    showError(root, "No se pudo cargar el ticket.");
    return;
  }

  const title = String(tk.iticket || iticket) + " · " + String(tk.titulo || tk.title || "Ticket");
  document.title = title;

  if (driver === "jsx") {
    await runJsxDriver(tk);
    return;
  }
  runHtmlDriver(root, tk);
}
