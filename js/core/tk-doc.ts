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
  const pathStyle = opts.pathStyle ?? "font-size:11px;color:#1e90ff;word-break:break-all;";
  return `${link}<br/><span style="${pathStyle}">${href}</span>`;
}
