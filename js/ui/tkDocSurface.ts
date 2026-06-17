/** Fondo y padding compartidos del driver JSX (app embebida y vista full-page). */

export { TK_DOC_RADIUS } from "../core/tk-table.ts";

const TK_DOC_GRADIENT = {
  background: (t: { palette: { mode: string } }) =>
    t.palette.mode === "dark"
      ? "radial-gradient(ellipse 120% 80% at 50% -20%, rgba(99,102,241,0.18), transparent 55%), linear-gradient(180deg, #0b1220 0%, #0f172a 100%)"
      : "radial-gradient(ellipse 120% 80% at 50% -20%, rgba(30,144,255,0.12), transparent 55%), linear-gradient(180deg, #f0f6ff 0%, #f8fafc 100%)",
};

const TK_DOC_PAD = { p: { xs: 1.25, sm: 2, md: 3 } };

/** Superficie scroll dentro del shell de tickets (?s → sub=tickets, driver=jsx). */
export function tkDocSurfaceSx(extra: Record<string, unknown> = {}) {
  return {
    flex: 1,
    minHeight: 0,
    overflow: "auto",
    ...TK_DOC_GRADIENT,
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
