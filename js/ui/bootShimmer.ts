/** HTML y componente React para pantallas de carga con shimmer. */

const DEFAULT_ICON = "mdi:notebook-outline";
export const BOOT_WATERMARK_URL =
  "https://pub-1c290cc606c8478899f5764899278571.r2.dev/brand/logo-insoft.png";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function appBootIcon(): string {
  const meta = document.querySelector('meta[name="app-icon"]');
  const icon = meta?.getAttribute("content")?.trim();
  return icon || DEFAULT_ICON;
}

export function appBootName(): string {
  const meta = document.querySelector('meta[name="application-name"]');
  return meta?.getAttribute("content")?.trim() || "JAGUDELOE";
}

export function appBootLabel(suffix = "…"): string {
  return `Cargando ${appBootName()}${suffix}`;
}

export type BootShimmerHtmlOpts = {
  icon?: string;
  viewport?: boolean;
  watermark?: boolean;
};

/** Markup estático (index.html, doc-viewer). */
export function bootShimmerHtml(
  label: string,
  opts: BootShimmerHtmlOpts = {},
): string {
  const icon = escapeHtml(opts.icon || appBootIcon());
  const text = escapeHtml(label);
  const viewport = opts.viewport !== false;
  const classes = viewport ? "isa-app-boot isa-app-boot--viewport" : "isa-app-boot";
  const watermark = opts.watermark !== false
    ? `<img class="isa-app-boot-watermark" src="${BOOT_WATERMARK_URL}" alt="" aria-hidden="true" decoding="async" />`
    : "";
  return (
    `<div class="${classes}">` +
    `<div class="isa-app-boot-shimmer">` +
    `<iconify-icon icon="${icon}" width="1.5em" height="1.5em"></iconify-icon>` +
    `<span>${text}</span>` +
    `</div>${watermark}</div>`
  );
}

export type BootShimmerProps = {
  label?: string;
  icon?: string;
  viewport?: boolean;
  watermark?: boolean;
};

export function createBootShimmer(React: typeof window.React) {
  return function BootShimmer(props: BootShimmerProps) {
    const label = props.label || appBootLabel();
    const icon = props.icon || appBootIcon();
    const viewport = props.viewport !== false;
    const showWatermark = props.watermark !== false;
    const className = viewport
      ? "isa-app-boot isa-app-boot--viewport"
      : "isa-app-boot";

    return React.createElement(
      "div",
      { className },
      React.createElement(
        "div",
        { className: "isa-app-boot-shimmer" },
        React.createElement("iconify-icon", {
          icon,
          width: "1.5em",
          height: "1.5em",
        }),
        React.createElement("span", null, label),
      ),
      showWatermark
        ? React.createElement("img", {
          className: "isa-app-boot-watermark",
          src: BOOT_WATERMARK_URL,
          alt: "",
          "aria-hidden": "true",
          decoding: "async",
        })
        : null,
    );
  };
}

/** Reemplaza UI.Loading del namespace ISA con shimmer. */
export function registerBootShimmer(ns: string): void {
  const React = window.React;
  const bag = (window as Record<string, { UI?: Record<string, unknown> }>)[ns];
  if (!React || !bag?.UI) return;
  bag.UI.Loading = createBootShimmer(React);
}
