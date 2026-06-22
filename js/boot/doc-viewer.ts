/**
 * Vista documento — ticket sin shell de la app.
 * Drivers: html (correo + copiar HTML) | jsx (presentación web + tema).
 */
import { renderTicketViewHtml, renderTicketEmailHtml } from "../ui/tkHtml.ts";
import { hydrateTkCodeBlocks } from "../ui/tkCodeHydrate.ts";
import { bootShimmerHtml } from "../ui/bootShimmer.ts";
import { isDocLoadHold } from "./url-s.mjs";
import { patchTkDocSeed } from "../core/tk-doc-seed-patch.ts";

/** API tickets — misma fuente BD que prod. Local 8796 solo con tkApi:local=1. */
const TK_API_REMOTE = "https://jagudeloe-tks.jeffaporta.workers.dev";
const TK_API_LOCAL = "http://127.0.0.1:8796";

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

async function fetchTicketFrom(base: string, space: string, iticket: string): Promise<Record<string, unknown> | null> {
  const url = base.replace(/\/$/, "") + "/api/tk/" + encodeURIComponent(space) + "/tickets/" + encodeURIComponent(iticket);
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) return null;
    return (data.ticket || {}) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function ticketApiBases(): string[] {
  const isLocalDev = /localhost|127\.0\.0\.1|\[::1\]/.test(location.hostname);
  const bases: string[] = [TK_API_REMOTE];
  if (isLocalDev) {
    try {
      if (localStorage.getItem("tkApi:local") === "1") bases.push(TK_API_LOCAL);
    } catch { /* ignore */ }
    return bases;
  }
  return bases;
}

async function fetchTicket(space: string, iticket: string): Promise<Record<string, unknown> | null> {
  const w = window as { __TK_DOC_PREFETCH__?: Promise<{ ok?: boolean; ticket?: Record<string, unknown> } | null> };
  const pref = w.__TK_DOC_PREFETCH__;
  if (pref) {
    w.__TK_DOC_PREFETCH__ = undefined;
    try {
      const data = await pref;
      if (data?.ok && data.ticket) return data.ticket as Record<string, unknown>;
    } catch { /* fallback */ }
  }
  const bases = ticketApiBases();
  for (const base of bases) {
    const ticket = await fetchTicketFrom(base, space, iticket);
    if (ticket) return ticket;
  }
  return null;
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

const isDist = !!(globalThis as { __ISA_DIST__?: boolean }).__ISA_DIST__
  && !new URLSearchParams(location.search).has("src");

async function warmJsxStackShared(): Promise<void> {
  const cdnMod = await import("./cdn.mjs");
  const bootHelper = await import(cdnMod.bootHelperUrl);
  const { importShared, assertStack, loadIsaFront } = bootHelper;
  const w = globalThis as { __TK_STACK_PREFETCH__?: Promise<{ stackReady: Promise<unknown> }> };
  const stackPref = w.__TK_STACK_PREFETCH__;
  if (stackPref) w.__TK_STACK_PREFETCH__ = undefined;
  const stackMod = stackPref ? await stackPref : await importShared("stack.mjs");
  await stackMod.stackReady;
  assertStack();
  await Promise.all([loadIsaFront(), cdnMod.ensureLightboxZoom()]);
}

async function warmJsxStackForDoc() {
  await warmJsxStackShared();
  const graphMod = await import("./module-graph.mjs");
  return graphMod.importAppEntry;
}

async function runJsxDriver(
  tk: Record<string, unknown>,
  opts: { space: string; iticket: string; reportView?: string },
  importAppEntry?: (entry: string, babel: typeof Babel, opts?: { reset?: boolean }) => Promise<Record<string, unknown>>,
): Promise<void> {
  if (isDist) {
    const mod = await import("./doc-viewer-web.js");
    mod.mountDocWebView(tk, {
      space: opts.space,
      iticket: opts.iticket,
      reportView: opts.reportView,
    });
    return;
  }
  const mod = await importAppEntry!("js/boot/doc-viewer-web.jsx", Babel);
  mod.mountDocWebView(tk, {
    space: opts.space,
    iticket: opts.iticket,
    reportView: opts.reportView,
  });
}

function syncBootTheme(): void {
  const t = (window as { ThemeInit?: { readMode?: () => string; applyThemeMode?: (m: string) => string } }).ThemeInit;
  if (t?.readMode && t?.applyThemeMode) t.applyThemeMode(t.readMode());
}

export async function runDocViewer(boot: { space: string; sel: string; driver?: string; reportView?: string; bootHold?: boolean }): Promise<void> {
  const root = document.getElementById("root");
  if (!root) throw new Error("#root no encontrado");

  const space = boot.space.toLowerCase();
  const iticket = boot.sel.toUpperCase().startsWith("TK-") ? boot.sel.toUpperCase() : "TK-" + boot.sel;
  const driver = boot.driver === "html" ? "html" : "jsx";

  syncBootTheme();
  applyDocPageLayout(driver);
  root.innerHTML = bootShimmerHtml("Cargando documentación…", { viewport: true });

  if (boot.bootHold || isDocLoadHold()) return;

  const [raw, importAppEntry] = await Promise.all([
    fetchTicket(space, iticket),
    driver === "jsx" && !isDist ? warmJsxStackForDoc() : driver === "jsx" ? warmJsxStackShared().then(() => null) : Promise.resolve(null),
  ]);
  if (!raw) {
    const tried = ticketApiBases().join(" → ");
    showError(root, `No se pudo cargar el ticket. API probada: ${tried}`);
    return;
  }
  const tk = patchTkDocSeed(raw);

  const title = String(tk.iticket || iticket) + " · " + String(tk.titulo || tk.title || "Ticket");
  document.title = title;

  if (driver === "jsx") {
    await runJsxDriver(tk, { space, iticket, reportView: boot.reportView }, importAppEntry ?? undefined);
    return;
  }
  runHtmlDriver(root, tk);
}
