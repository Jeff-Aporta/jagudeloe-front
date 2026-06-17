/** Fondo y padding compartidos del driver JSX (app embebida y vista full-page). */

export { TK_DOC_RADIUS } from "../core/tk-table.ts";

const TK_DOC_PAD = { p: { xs: 1.25, sm: 2, md: 3 } };

/** Superficie scroll dentro del shell de tickets (?s → sub=tickets, driver=jsx). */
export function tkDocSurfaceSx(extra: Record<string, unknown> = {}) {
  return {
    flex: 1,
    minHeight: 0,
    overflow: "auto",
    ...TK_DOC_PAD,
    ...extra,
  };
}

/** Página completa (?s → view=doc, driver=jsx). Fondo fijo vía doc-view.css (#root.tk-doc-web). */
export function tkDocPageSx(extra: Record<string, unknown> = {}) {
  return {
    minHeight: "100vh",
    boxSizing: "border-box",
    position: "relative",
    zIndex: 1,
    bgcolor: "transparent",
    ...TK_DOC_PAD,
    ...extra,
  };
}
