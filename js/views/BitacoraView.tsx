/*
 * views/BitacoraView — bitácora de un space (GET público, visible sin login).
 * Renderiza el bundle (layout + segmentos md/sql) que devuelve el backend.
 */

interface LayoutNode {
  type: "day" | "group" | "section" | "md" | "sql" | "widget";
  title?: string;
  children?: LayoutNode[];
  segmentId?: string;
  checkKey?: string;
}
interface BitacoraViewProps { project: string; reloadKey?: number; }

(function () {
  "use strict";
  const React = (window as any).React;
  const MUI = (window as any).MaterialUI;
  const w = window as any;
  const UI = w.ISAJ.UI;

  function renderNode(node: LayoutNode, segments: Record<string, any>, key: string): any {
    if (!node) return null;
    if (node.type === "md") {
      const seg = segments[node.segmentId as string] || {};
      const html = w.marked ? w.marked.parse(seg.md || seg.body || "") : (seg.md || "");
      return React.createElement(MUI.Paper, { key, variant: "outlined", sx: { p: 2, my: 1 } },
        React.createElement("div", { className: "md-body", dangerouslySetInnerHTML: { __html: html } }));
    }
    if (node.type === "sql") {
      const s = segments[node.segmentId as string] || {};
      return React.createElement(MUI.Paper, { key, variant: "outlined", sx: { p: 2, my: 1 } },
        React.createElement(MUI.Stack, { direction: "row", spacing: 1, alignItems: "center", sx: { mb: 1 } },
          React.createElement(UI.Icon, { icon: "mdi:database-search-outline" }),
          React.createElement(MUI.Typography, { variant: "subtitle2" }, s.title || node.checkKey || "Consulta")),
        React.createElement("pre", { className: "sql-body" }, s.sql || s.body || "-- sin SQL"));
    }
    if (node.type === "day" || node.type === "group" || node.type === "section") {
      return React.createElement(MUI.Box, { key, sx: { my: 2 } },
        React.createElement(MUI.Typography, { variant: node.type === "day" ? "h6" : "subtitle1", sx: { color: "primary.main", mb: 1 } }, node.title),
        (node.children || []).map((c, i) => renderNode(c, segments, key + "-" + i)));
    }
    return null;
  }

  function BitacoraView(props: BitacoraViewProps) {
    const [state, setState] = React.useState({ loading: true, error: null as string | null, data: null as any });

    React.useEffect(() => {
      let alive = true;
      setState({ loading: true, error: null, data: null });
      w.ISAJ.Api.getBitacora(props.project)
        .then((d: any) => { if (alive) setState({ loading: false, error: null, data: d }); })
        .catch((e: any) => { if (alive) setState({ loading: false, error: e.message, data: null }); });
      return () => { alive = false; };
    }, [props.project, props.reloadKey]);

    if (state.loading) return React.createElement(UI.Loading, { label: "Cargando bitácora…" });
    if (state.error) return React.createElement(UI.ErrorBox, { message: state.error });

    const data = state.data || {};
    const layout = data.layout || data;
    const nodes: LayoutNode[] = (layout && layout.nodes) || [];
    const segments = data.segments || {};

    if (!nodes.length) {
      return React.createElement(MUI.Alert, { severity: "info" }, "La bitácora de " + props.project + " está vacía.");
    }
    return React.createElement(MUI.Box, null, nodes.map((n, i) => renderNode(n, segments, "n" + i)));
  }

  w.ISAJ = w.ISAJ || {};
  w.ISAJ.BitacoraView = BitacoraView;
})();
