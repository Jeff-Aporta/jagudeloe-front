/*
 * views/BitacoraView — bitácora de un space. Navegador en carpetas AÑO → MES → DÍA
 * (solo números) a la izquierda; a la derecha se ve UN DÍA a la vez. El SQL se
 * muestra con CodeMirror y se ejecuta solo con sesión/perfil, dirigido a su BD.
 * Cada bloque SQL/md con checkKey muestra su checkbox de revisado inline.
 */

interface LayoutNode {
  type: "day" | "group" | "section" | "md" | "sql" | "widget";
  title?: string;
  children?: LayoutNode[];
  segmentId?: string;
  checkKey?: string;
}
interface DayEntry { id: string; date: string; title: string; children: LayoutNode[]; }
interface BitacoraViewProps { project: string; reloadKey?: number; }

(function () {
  "use strict";
  const MUI = MaterialUI;
  const UI = window.ISAJ.UI;
  const P = window.ISAJ.Parts;

  const reDate = /(\d{4}-\d{2}-\d{2})/;
  const clamp2 = { display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.3 };

  function renderNode(
    node: LayoutNode, segments: Record<string, Record<string, string>>,
    project: string, key: string, depth: number, reloadKey?: number,
  ): ReactNode {
    if (!node) return null;
    if (node.type === "md") {
      const seg = segments[node.segmentId as string] || {};
      const raw = seg.markdown || seg.md || seg.body || "";
      const html = window.marked ? window.marked.parse(raw) : raw;
      return React.createElement(MUI.Box, { key, sx: { my: 1 } },
        node.checkKey && React.createElement(MUI.Stack, { direction: "row", spacing: 0.5, alignItems: "flex-start" },
          React.createElement(P.RevisadoCheck, { project, revisadoKey: node.checkKey, reloadKey, label: node.title }),
          React.createElement(MUI.Typography, { variant: "caption", color: "text.secondary", sx: { pt: 0.75 } }, "Revisado")),
        React.createElement(MUI.Box, { className: "md-body", dangerouslySetInnerHTML: { __html: html } }));
    }
    if (node.type === "sql") {
      const s = segments[node.segmentId as string] || {};
      const checkKey = node.checkKey || (s.checkKey as string | undefined) || (s.revisadoKey as string | undefined);
      return React.createElement(P.SqlBlock, {
        key, sql: s.sql || s.body || "-- sin SQL", title: s.title || node.title || "Consulta",
        dbTarget: s.dbTarget, project, segmentId: node.segmentId, checkKey, reloadKey,
      });
    }
    if (node.type === "day" || node.type === "group" || node.type === "section") {
      return React.createElement(MUI.Box, { key, sx: { my: 1.5, pl: depth ? 1.5 : 0, borderLeft: depth ? 2 : 0, borderColor: "divider" } },
        node.title && React.createElement(MUI.Typography, {
          variant: depth >= 1 ? "subtitle2" : "subtitle1",
          sx: Object.assign({ color: "primary.main", fontWeight: 600, mb: 0.5 }, clamp2),
        }, node.title),
        (node.children || []).map((c, i) => renderNode(c, segments, project, key + "-" + i, depth + 1, reloadKey)));
    }
    return null;
  }

  function BitacoraView(props: BitacoraViewProps) {
    const [state, setState] = React.useState<{ loading: boolean; error: string | null; data: Record<string, unknown> | null }>({ loading: true, error: null, data: null });
    const [selected, setSelected] = React.useState<string | null>(null);

    React.useEffect(() => {
      let alive = true;
      setState({ loading: true, error: null, data: null });
      setSelected(null);
      window.ISAJ.Api.getBitacora(props.project)
        .then((d) => { if (alive) setState({ loading: false, error: null, data: d as Record<string, unknown> }); })
        .catch((e) => { if (alive) setState({ loading: false, error: e instanceof Error ? e.message : String(e), data: null }); });
      return () => { alive = false; };
    }, [props.project, props.reloadKey]);

    const data = state.data || {};
    const layout = (data.layout || data) as { nodes?: LayoutNode[] };
    const segments = (data.segments || {}) as Record<string, Record<string, string>>;

    const days: DayEntry[] = [];
    const seen = new Set<string>();
    const collect = (nodes: LayoutNode[]) => {
      (nodes || []).forEach((n) => {
        if (!n) return;
        const m = reDate.exec(n.title || "");
        const isLeaf = n.type === "md" || n.type === "sql" || n.type === "widget";
        const isDay = n.type === "day" || (!!m && !isLeaf && !!(n.children && n.children.length));
        if (isDay) {
          const date = m ? m[1] : "";
          const id = date || (n.title || "");
          if (!seen.has(id)) { seen.add(id); days.push({ id, date, title: n.title || "Día", children: n.children || [] }); }
        } else if (n.children && n.children.length) {
          collect(n.children);
        }
      });
    };
    collect(layout.nodes || []);
    days.sort((a, b) => (a.date < b.date ? 1 : -1));

    React.useEffect(() => {
      if (days.length && !selected) setSelected(days[0].id);
    }, [state.data]);

    if (state.loading) return UI.Loading ? React.createElement(UI.Loading, { label: "Cargando bitácora…" }) : React.createElement(MUI.CircularProgress, null);
    if (state.error) return UI.ErrorBox ? React.createElement(UI.ErrorBox, { message: state.error }) : React.createElement(MUI.Alert, { severity: "error" }, state.error);
    if (!days.length) return React.createElement(MUI.Alert, { severity: "info" }, "La bitácora de " + props.project + " está vacía.");

    const current = days.find((d) => d.id === selected) || days[0];
    const treeItems = days.map((d) => ({ id: d.id, date: d.date, secondary: d.title.replace(reDate, "").replace(/^\s*[—-]\s*/, "").trim() }));

    const tree = React.createElement(MUI.Box, {
      sx: { width: 230, flexShrink: 0, borderRight: 1, borderColor: "divider", overflow: "auto", display: { xs: "none", md: "block" } },
    }, React.createElement(P.DateTree, { items: treeItems, selectedId: selected, onSelect: (id: string) => { setSelected(id); window.ISAJ.UrlState.merge({ sel: id }); }, mode: "day" }));

    const content = React.createElement(MUI.Box, { sx: { flex: 1, minWidth: 0, overflow: "auto", p: 2 } },
      React.createElement(MUI.Stack, { direction: "row", spacing: 1, alignItems: "flex-start", sx: { mb: 2 } },
        React.createElement(UI.Icon, { icon: "mdi:calendar-text-outline", size: 22, style: { flexShrink: 0, marginTop: 2 } }),
        React.createElement(MUI.Typography, { variant: "h6", sx: clamp2 }, current.title)),
      current.children.length
        ? current.children.map((node, i) => renderNode(node, segments, props.project, current.id + "-" + i, 0, props.reloadKey))
        : React.createElement(MUI.Typography, { color: "text.secondary" }, "Sin contenido para este día."));

    return React.createElement(MUI.Box, { sx: { display: "flex", height: "100%", minHeight: 0 } }, tree, content);
  }

  window.ISAJ = window.ISAJ || ({} as IsajNs);
  window.ISAJ.BitacoraView = BitacoraView;
})();
