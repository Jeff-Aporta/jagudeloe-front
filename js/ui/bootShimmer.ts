/** HTML y componente React para pantallas de carga con shimmer. */

const DEFAULT_ICON = "mdi:notebook-outline";

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

export type BootShimmerHtmlOpts = {
  icon?: string;
  viewport?: boolean;
};

/** Markup estático (doc-viewer, index.html). */
export function bootShimmerHtml(
  label: string,
  opts: BootShimmerHtmlOpts = {},
): string {
  const icon = escapeHtml(opts.icon || appBootIcon());
  const text = escapeHtml(label);
  const viewport = opts.viewport ? " isa-app-boot--viewport" : "";
  return (
    `<div class="isa-app-boot${viewport}">` +
    `<div class="isa-app-boot-shimmer">` +
    `<iconify-icon icon="${icon}" width="1.5em" height="1.5em"></iconify-icon>` +
    `<span>${text}</span>` +
    `</div></div>`
  );
}

export type BootShimmerProps = {
  label?: string;
  icon?: string;
  viewport?: boolean;
};

export function createBootShimmer(React: typeof window.React) {
  return function BootShimmer(props: BootShimmerProps) {
    const label = props.label || "Cargando…";
    const icon = props.icon || appBootIcon();
    const className = props.viewport
      ? "isa-app-boot isa-app-boot--viewport"
      : "isa-app-boot";
    const style = props.viewport
      ? undefined
      : { minHeight: "100%", width: "100%" };

    return React.createElement(
      "div",
      { className, style },
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
