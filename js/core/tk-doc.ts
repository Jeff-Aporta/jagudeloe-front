/** Driver de documento TK, URLs de vista y enlaces en diligencias. */
import { buildShareUrl } from "../boot/url-s.mjs";

export type DocDriver = "html" | "jsx";

export const DEFAULT_DOC_DRIVER: DocDriver = "jsx";

export function resolveDocDriver(state: { driver?: unknown } | null | undefined): DocDriver {
  return state?.driver === "html" ? "html" : DEFAULT_DOC_DRIVER;
}

/** URL para ver el ticket en modo documento (sin navegación de la app). */
export function buildDocViewUrl(
  space: string,
  iticket: string,
  driver: DocDriver = DEFAULT_DOC_DRIVER,
): string {
  const state: Record<string, string> = { view: "doc", space, sel: iticket, sub: "tickets", driver };
  return buildShareUrl(state);
}

export function buildDocEmailUrl(space: string, iticket: string): string {
  return buildDocViewUrl(space, iticket, "html");
}

export function buildDocWebUrl(space: string, iticket: string): string {
  return buildDocViewUrl(space, iticket, "jsx");
}

/** URL full-page con reporte de métricas (tiempo hábil + desfase empresa). */
export function buildDocMetricasUrl(space: string, iticket: string): string {
  const state: Record<string, string> = {
    view: "doc",
    space,
    sel: iticket,
    sub: "tickets",
    driver: "jsx",
    report: "metricas",
  };
  return buildShareUrl(state);
}

export function resolveDocReportUrl(
  space: string,
  iticket: string,
  report: "diligencia" | "metricas" = "diligencia",
  driver: DocDriver = DEFAULT_DOC_DRIVER,
): string {
  if (report === "metricas") return buildDocMetricasUrl(space, iticket);
  return driver === "jsx" ? buildDocWebUrl(space, iticket) : buildDocEmailUrl(space, iticket);
}

function escHtml(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function normIticketLabel(raw: unknown): string {
  const t = String(raw ?? "").trim().toUpperCase();
  if (!t) return "";
  return t.startsWith("TK-") ? t : `TK-${t}`;
}

function docShareReportLabel(report: "diligencia" | "metricas"): string {
  return report === "metricas" ? "Documentación y métricas" : "Documentación y diligencias";
}

export type DocShareSnippetOpts = {
  url: string;
  report?: "diligencia" | "metricas";
  iticket?: string;
  titulo?: string;
  space?: string;
};

/** Texto plano de respaldo al copiar el snippet (correo sin HTML). */
export function buildDocSharePlainText(opts: DocShareSnippetOpts): string {
  const report = opts.report ?? "diligencia";
  const href = String(opts.url ?? "").trim();
  const id = normIticketLabel(opts.iticket);
  const titulo = String(opts.titulo ?? "").trim();
  const lines = [docShareReportLabel(report)];
  if (id) lines.push(id);
  if (titulo) lines.push(titulo);
  if (href) lines.push(href);
  return lines.join("\n");
}

const DOC_SHARE_FONT = "font-family:Tahoma,Arial,Helvetica,sans-serif;";

/** Fragmento HTML con CSS inline — pegar en InSoft, correo o chat (estilo email TK). */
export function buildDocShareHtmlSnippet(opts: DocShareSnippetOpts): string {
  const report = opts.report ?? "diligencia";
  const href = String(opts.url ?? "").trim();
  const safeHref = escHtml(href);
  const reportLabel = escHtml(docShareReportLabel(report));
  const id = normIticketLabel(opts.iticket);
  const titulo = String(opts.titulo ?? "").trim();
  const space = String(opts.space ?? "").trim().toUpperCase();
  const tkBadge = id
    ? `<span style="${DOC_SHARE_FONT}display:inline-block;font-size:11px;font-weight:700;color:#111111;background:#ffffff;border-radius:4px;padding:3px 10px;margin:0 0 8px 0;letter-spacing:0.3px;">${escHtml(id)}</span>`
    : "";
  const tituloHtml = titulo
    ? `<div style="${DOC_SHARE_FONT}font-size:16px;color:#ffffff;font-weight:bold;margin-top:4px;line-height:1.35;">${escHtml(titulo)}</div>`
    : "";
  const spaceHtml = space
    ? `<div style="${DOC_SHARE_FONT}font-size:11px;color:#7fb4e6;letter-spacing:1px;text-transform:uppercase;margin-top:2px;">${escHtml(space)}</div>`
    : "";

  return (
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" ` +
    `style="border-collapse:collapse;${DOC_SHARE_FONT}font-size:14px;color:#33414f;line-height:1.5;background:#eef2f7;">` +
    `<tr><td style="padding:12px 0;">` +
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="680" ` +
    `style="border-collapse:collapse;width:100%;max-width:680px;background:#ffffff;border-radius:8px;overflow:hidden;">` +
    `<tr><td style="padding:18px 20px;background:#0b2e4e;vertical-align:top;">` +
    `${tkBadge}` +
    `${spaceHtml}` +
    `<div style="${DOC_SHARE_FONT}font-size:13px;color:#cfe4fa;font-weight:600;margin-top:6px;">${reportLabel}</div>` +
    `${tituloHtml}` +
    `</td></tr>` +
    `<tr><td style="padding:18px 20px;vertical-align:top;">` +
    `<p style="margin:0 0 12px 0;font-size:13px;color:#6b7785;">Abre el visor web del ticket:</p>` +
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td ` +
    `style="border-radius:6px;background:#1e90ff;">` +
    `<a href="${safeHref}" target="_blank" rel="noopener noreferrer" ` +
    `style="${DOC_SHARE_FONT}display:inline-block;font-size:13px;font-weight:700;color:#ffffff;text-decoration:none;padding:10px 18px;">Ver documentación</a>` +
    `</td></tr></table>` +
    `<p style="margin:14px 0 0 0;font-size:11px;color:#6b7785;word-break:break-all;line-height:1.45;">` +
    `<a href="${safeHref}" target="_blank" rel="noopener noreferrer" style="color:#1e90ff;text-decoration:underline;">${safeHref}</a>` +
    `</p>` +
    `</td></tr></table></td></tr></table>`
  );
}

function wrapClipboardHtml(fragment: string): string {
  return (
    `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>` +
    `<!--StartFragment-->${fragment}<!--EndFragment-->` +
    `</body></html>`
  );
}

function copyHtmlViaExecCommand(html: string): boolean {
  const el = document.createElement("div");
  el.contentEditable = "true";
  el.innerHTML = html;
  el.setAttribute("aria-hidden", "true");
  el.style.position = "fixed";
  el.style.left = "-9999px";
  el.style.top = "0";
  document.body.appendChild(el);
  const range = document.createRange();
  range.selectNodeContents(el);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  sel?.removeAllRanges();
  document.body.removeChild(el);
  return ok;
}

/** Copia HTML enriquecido al portapapeles (con fallback execCommand y texto plano). */
export async function copyRichHtmlToClipboard(html: string, plainFallback?: string): Promise<void> {
  const fragment = String(html ?? "").trim();
  if (!fragment) return;
  const wrapped = wrapClipboardHtml(fragment);
  /** Si no se indica plain, usar el fragmento HTML (pegar con tags en editores solo-texto). */
  const plain = String(plainFallback ?? fragment).trim() || fragment;

  if (copyViaClipboardEvent(wrapped, plain)) return;

  try {
    if (navigator.clipboard?.write && typeof ClipboardItem !== "undefined") {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([wrapped], { type: "text/html" }),
          "text/plain": new Blob([plain], { type: "text/plain" }),
        }),
      ]);
      return;
    }
  } catch {
    /* siguiente estrategia */
  }
  if (copyHtmlViaExecCommand(fragment)) return;
  try {
    await navigator.clipboard.writeText(plain);
  } catch {
    await navigator.clipboard.writeText(fragment);
  }
}

function copyViaClipboardEvent(htmlWrapped: string, plain: string): boolean {
  const el = document.createElement("div");
  el.contentEditable = "true";
  el.innerHTML = plain.includes("<") ? plain : `<span>${plain}</span>`;
  el.setAttribute("aria-hidden", "true");
  el.style.position = "fixed";
  el.style.left = "-9999px";
  el.style.top = "0";
  document.body.appendChild(el);
  const range = document.createRange();
  range.selectNodeContents(el);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);

  let handled = false;
  const onCopy = (e: ClipboardEvent) => {
    if (!e.clipboardData) return;
    e.clipboardData.setData("text/html", htmlWrapped);
    e.clipboardData.setData("text/plain", plain);
    e.preventDefault();
    handled = true;
  };
  document.addEventListener("copy", onCopy);
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  document.removeEventListener("copy", onCopy);
  sel?.removeAllRanges();
  document.body.removeChild(el);
  return ok && handled;
}

export function tkLinkHref(payload: Record<string, unknown> | undefined): string {
  return String(payload?.href ?? payload?.url ?? "").trim() || "#";
}

export function tkLinkLabel(payload: Record<string, unknown> | undefined, href?: string): string {
  const h = href ?? tkLinkHref(payload);
  const label = String(payload?.label ?? "").trim();
  return label || h;
}

/** true cuando conviene mostrar la URL además del label (label semántico distinto del path). */
export function tkLinkShowsPath(payload: Record<string, unknown> | undefined): boolean {
  const href = tkLinkHref(payload);
  if (!href || href === "#") return false;
  const label = String(payload?.label ?? "").trim();
  if (!label) return false;
  return label !== href;
}

export function tkLinkHtml(
  payload: Record<string, unknown> | undefined,
  opts: { esc: (s: unknown) => string; linkStyle?: string; pathStyle?: string },
): string {
  const rawHref = tkLinkHref(payload);
  const href = opts.esc(rawHref);
  const label = opts.esc(tkLinkLabel(payload, rawHref));
  const link = `<a href="${href}" target="_blank" rel="noreferrer" style="${opts.linkStyle ?? ""}">${label}</a>`;
  if (!tkLinkShowsPath(payload)) return link;
  const pathStyle = opts.pathStyle ?? "display:block;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;color:#1e90ff;";
  return `${link}<br/><span style="${pathStyle}">${href}</span>`;
}
