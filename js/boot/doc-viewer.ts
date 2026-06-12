/**
 * Vista documento — solo HTML del ticket. Sin React/MUI/AppShell.
 * Activada con ?s=… donde s contiene { view:"doc", space, sel }.
 */
import { renderTicketViewHtml } from "../ui/tkHtml.ts";

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

export async function runDocViewer(boot: { space: string; sel: string }): Promise<void> {
  const root = document.getElementById("root");
  if (!root) throw new Error("#root no encontrado");

  document.documentElement.classList.add("tk-doc-mode");
  document.body.classList.add("tk-doc-mode");
  root.classList.add("tk-doc-view");

  const space = boot.space.toLowerCase();
  const iticket = boot.sel.toUpperCase().startsWith("TK-") ? boot.sel.toUpperCase() : "TK-" + boot.sel;
  root.innerHTML = '<p style="margin:0;padding:24px;font-family:Tahoma,Arial,sans-serif;color:#6b7785">Cargando documentación…</p>';

  const url = apiBase().replace(/\/$/, "") + "/api/tk/" + encodeURIComponent(space) + "/tickets/" + encodeURIComponent(iticket);

  let data: { ok?: boolean; ticket?: Record<string, unknown>; error?: string };
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) {
      showError(root, data.error || "No se pudo cargar el ticket.");
      return;
    }
  } catch {
    showError(root, "No se pudo conectar con el servidor.");
    return;
  }

  const tk = data.ticket || {};
  const title = String(tk.iticket || iticket) + " · " + String(tk.titulo || tk.title || "Ticket");
  document.title = title;
  root.innerHTML = renderTicketViewHtml(tk);
}
