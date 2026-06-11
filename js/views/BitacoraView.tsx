/*
 * views/BitacoraView — bitácora de un space. Navegador tipo árbol (mes → día) a la
 * izquierda y acordeones anidados (mes → día → contenido md/sql) a la derecha,
 * imitando ISA-DOC. Si el backend falla, el cliente entrega un MOCKUP (_mock).
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
  const MUI = MaterialUI;
  const UI = window.ISAJ.UI;
  const P = window.ISAJ.Parts;

  function renderLeaf(node: LayoutNode, segments: Record<string, Record<string, string>>, key: string): ReactNode {
    if (node.type === "md") {
      const seg = segments[node.segmentId as string] || {};
      const html = window.marked ? window.marked.parse(seg.md || seg.body || "") : (seg.md || "");
      return React.createElement(MUI.Box, { key, className: "md-body", sx: { my: 1 }, dangerouslySetInnerHTML: { __html: html } });
    }
    if (node.type === "sql") {
      const s = segments[node.segmentId as string] || {};
      return React.createElement(MUI.Box, { key, sx: { my: 1 } },
        React.createElement(MUI.Stack, { direction: "row", spacing: 1, alignItems: "center", sx: { mb: 0.5 } },
          React.createElement(UI.Icon, { icon: "mdi:database-search-outline" }),
          React.createElement(MUI.Typography, { variant: "subtitle2" }, s.title || node.checkKey || "Consulta")),
        React.createElement("pre", { className: "sql-body" }, s.sql || s.body || "-- sin SQL"));
    }
    return null;
  }

  function BitacoraView(props: BitacoraViewProps) {
    const [state, setState] = React.useState<{ loading: boolean; error: string | null; data: Record<string, unknown> | null }>({ loading: true, error: null, data: null });
    const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});
    const [selected, setSelected] = React.useState<string | null>(null);

    React.useEffect(() => {
      let alive = true;
      setState({ loading: true, error: null, data: null });
      window.ISAJ.Api.getBitacora(props.project)
        .then((d) => { if (alive) { setState({ loading: false, error: null, data: d as Record<string, unknown> }); } })
        .catch((e) => { if (alive) setState({ loading: false, error: e instanceof Error ? e.message : String(e), data: null }); });
      return () => { alive = false; };
    }, [props.project, props.reloadKey]);

    // Abre el primer mes y su primer día al cargar.
    const data = state.data || {};
    const layout = (data.layout || data) as { nodes?: LayoutNode[] };
    const months: LayoutNode[] = layout.nodes || [];
    const segments = (data.segments || {}) as Record<string, Record<string, string>>;

    React.useEffect(() => {
      if (months.length) {
        const init: Record<string, boolean> = { mo0: true };
        if (months[0].children && months[0].children.length) init["d0_0"] = true;
        setExpanded(init);
      }
    }, [state.data]);

    if (state.loading) return UI.Loading ? React.createElement(UI.Loading, { label: "Cargando bitácora…" }) : React.createElement(MUI.CircularProgress, null);
    if (state.error) return UI.ErrorBox ? React.createElement(UI.ErrorBox, { message: state.error }) : React.createElement(MUI.Alert, { severity: "error" }, state.error);
    if (!months.length) return React.createElement(MUI.Alert, { severity: "info" }, "La bitácora de " + props.project + " está vacía.");

    const isMock = !!data._mock;

    // Árbol: meses → días
    const groups = months.map((mo, mi) => ({
      id: "mo" + mi,
      label: mo.title || "Mes",
      count: (mo.children || []).length,
      items: (mo.children || []).map((day, di) => ({ id: "d" + mi + "_" + di, label: day.title || "Día" })),
    }));

    function selectDay(dayId: string) {
      const moId = "mo" + dayId.slice(1).split("_")[0];
      setExpanded((e) => ({ ...e, [moId]: true, [dayId]: true }));
      setSelected(dayId);
      window.ISAJ.UrlState.merge({ sel: dayId });
      setTimeout(() => { const el = document.getElementById(dayId); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); }, 60);
    }
    const toggle = (id: string) => setExpanded((e) => ({ ...e, [id]: !e[id] }));

    const tree = React.createElement(MUI.Box, {
      sx: { width: 300, flexShrink: 0, borderRight: 1, borderColor: "divider", overflow: "auto", display: { xs: "none", md: "block" } },
    }, React.createElement(P.MonthTree, { groups, selectedId: selected, onSelect: selectDay }));

    const content = React.createElement(MUI.Box, { sx: { flex: 1, minWidth: 0, overflow: "auto", p: 2 } },
      isMock && React.createElement(P.MockBanner, null),
      months.map((mo, mi) => {
        const moId = "mo" + mi;
        return React.createElement(P.Accordion, {
          key: moId, nodeId: moId, level: 0, icon: "mdi:calendar-month-outline",
          title: mo.title || "Mes", count: (mo.children || []).length,
          expanded: !!expanded[moId], onToggle: () => toggle(moId),
        },
          (mo.children || []).map((day, di) => {
            const dId = "d" + mi + "_" + di;
            return React.createElement(P.Accordion, {
              key: dId, nodeId: dId, level: 1, icon: "mdi:calendar-text-outline",
              title: day.title || "Día",
              expanded: !!expanded[dId], onToggle: () => toggle(dId),
            }, (day.children || []).map((leaf, li) => renderLeaf(leaf, segments, dId + "-" + li)));
          }));
      }));

    return React.createElement(MUI.Box, { sx: { display: "flex", height: "100%", minHeight: 0 } }, tree, content);
  }

  window.ISAJ = window.ISAJ || ({} as IsajNs);
  window.ISAJ.BitacoraView = BitacoraView;
})();
