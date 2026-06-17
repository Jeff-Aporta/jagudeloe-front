/** Enlaces en diligencias TK: label legible + path/URL completo. */

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
  const pathStyle = opts.pathStyle ?? "font-size:11px;color:#6b7785;word-break:break-all;";
  return `${link}<br/><span style="${pathStyle}">${href}</span>`;
}
