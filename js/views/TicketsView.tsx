/*
 * views/TicketsView — tickets de un space (GET público). Kanban por estado.
 */

interface Ticket {
  id?: string | number; iticket?: string | number;
  titulo?: string; title?: string; descripcion?: string;
  estado?: string; status?: string; prioridad?: string;
}
interface TicketsViewProps { project: string; reloadKey?: number; }

(function () {
  "use strict";
  const React = (window as any).React;
  const MUI = (window as any).MaterialUI;
  const w = window as any;
  const UI = w.ISAJ.UI;

  const ESTADO_COLOR: Record<string, string> = {
    abierto: "warning", "en-progreso": "info", cerrado: "success", bloqueado: "error",
  };

  function TicketCard(t: Ticket) {
    return React.createElement(MUI.Card, { variant: "outlined", sx: { mb: 1 } },
      React.createElement(MUI.CardContent, { sx: { py: 1.5 } },
        React.createElement(MUI.Stack, { direction: "row", spacing: 1, alignItems: "center", sx: { mb: 0.5 } },
          React.createElement(MUI.Chip, { size: "small", label: "#" + (t.id || t.iticket || "?"), color: "primary" }),
          t.prioridad && React.createElement(MUI.Chip, { size: "small", variant: "outlined", label: t.prioridad })),
        React.createElement(MUI.Typography, { variant: "subtitle2" }, t.titulo || t.title || "(sin título)"),
        t.descripcion && React.createElement(MUI.Typography, { variant: "body2", color: "text.secondary", sx: { mt: 0.5 } },
          String(t.descripcion).slice(0, 240))));
  }

  function TicketsView(props: TicketsViewProps) {
    const [state, setState] = React.useState({ loading: true, error: null as string | null, rows: [] as Ticket[] });

    React.useEffect(() => {
      let alive = true;
      setState({ loading: true, error: null, rows: [] });
      w.ISAJ.Api.getTickets(props.project)
        .then((d: any) => {
          const rows: Ticket[] = (d && (d.rows || d.tickets || d.items)) || (Array.isArray(d) ? d : []);
          if (alive) setState({ loading: false, error: null, rows });
        })
        .catch((e: any) => { if (alive) setState({ loading: false, error: e.message, rows: [] }); });
      return () => { alive = false; };
    }, [props.project, props.reloadKey]);

    if (state.loading) return React.createElement(UI.Loading, { label: "Cargando tickets…" });
    if (state.error) return React.createElement(UI.ErrorBox, { message: state.error });
    if (!state.rows.length) return React.createElement(MUI.Alert, { severity: "info" }, "Sin tickets en " + props.project + ".");

    const groups: Record<string, Ticket[]> = {};
    state.rows.forEach((t) => {
      const e = (t.estado || t.status || "abierto").toLowerCase();
      (groups[e] = groups[e] || []).push(t);
    });

    return React.createElement(MUI.Grid, { container: true, spacing: 2 },
      Object.keys(groups).map((e) =>
        React.createElement(MUI.Grid, { item: true, xs: 12, sm: 6, md: 3, key: e },
          React.createElement(MUI.Stack, { direction: "row", spacing: 1, alignItems: "center", sx: { mb: 1 } },
            React.createElement(MUI.Chip, { size: "small", color: ESTADO_COLOR[e] || "default", label: e }),
            React.createElement(MUI.Typography, { variant: "caption", color: "text.secondary" }, groups[e].length)),
          groups[e].map((t, i) => React.createElement(React.Fragment, { key: i }, TicketCard(t))))));
  }

  w.ISAJ = w.ISAJ || {};
  w.ISAJ.TicketsView = TicketsView;
})();
