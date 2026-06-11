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

  function TicketCard(t: Ticket, onOpen: (t: Ticket) => void) {
    return React.createElement(MUI.Card, {
      variant: "outlined", sx: { mb: 1, cursor: "pointer" },
      onClick: () => onOpen(t),
    },
      React.createElement(MUI.CardContent, { sx: { py: 1.5 } },
        React.createElement(MUI.Stack, { direction: "row", spacing: 1, alignItems: "center", sx: { mb: 0.5 } },
          React.createElement(MUI.Chip, { size: "small", label: "#" + (t.id || t.iticket || "?"), color: "primary" }),
          t.prioridad && React.createElement(MUI.Chip, { size: "small", variant: "outlined", label: t.prioridad })),
        React.createElement(MUI.Typography, { variant: "subtitle2" }, t.titulo || t.title || "(sin título)"),
        (t as any).tiempoTotalMinutos != null && React.createElement(MUI.Chip, {
          size: "small", variant: "outlined", sx: { mt: 0.5 },
          label: (t as any).tiempoTotalMinutos + " min",
        }),
        ((t as any).resumen || t.descripcion) && React.createElement(MUI.Typography, { variant: "body2", color: "text.secondary", sx: { mt: 0.5 } },
          String((t as any).resumen || t.descripcion).slice(0, 240))));
  }

  function TicketDetailDialog(props: { project: string; iticket: string | null; onClose: () => void }) {
    const [state, setState] = React.useState({ loading: false, error: null as string | null, ticket: null as any });

    React.useEffect(() => {
      if (!props.iticket) return;
      let alive = true;
      setState({ loading: true, error: null, ticket: null });
      w.ISAJ.Api.getTicket(props.project, props.iticket)
        .then((d: any) => { if (alive) setState({ loading: false, error: null, ticket: d.ticket || d }); })
        .catch((e: any) => { if (alive) setState({ loading: false, error: e.message, ticket: null }); });
      return () => { alive = false; };
    }, [props.project, props.iticket]);

    if (!props.iticket) return null;
    const tk = state.ticket;
    return React.createElement(MUI.Dialog, { open: true, onClose: props.onClose, maxWidth: "md", fullWidth: true },
      React.createElement(MUI.DialogTitle, null, props.iticket),
      React.createElement(MUI.DialogContent, { dividers: true },
        state.loading && React.createElement(UI.Loading, { label: "Cargando detalle…" }),
        state.error && React.createElement(UI.ErrorBox, { message: state.error }),
        tk && React.createElement(MUI.Stack, { spacing: 2 },
          React.createElement(MUI.Typography, { variant: "h6" }, tk.titulo || tk.title),
          tk.resumen && React.createElement(MUI.Typography, { variant: "body2", color: "text.secondary" }, tk.resumen),
          React.createElement(MUI.Stack, { direction: "row", spacing: 1, flexWrap: "wrap" },
            tk.tiempoTotalMinutos != null && React.createElement(MUI.Chip, { size: "small", label: "Total " + tk.tiempoTotalMinutos + " min" }),
            tk.diligenciaMinutos != null && React.createElement(MUI.Chip, { size: "small", variant: "outlined", label: "Diligencia " + tk.diligenciaMinutos + " min" }),
            tk.commitMinutos != null && React.createElement(MUI.Chip, { size: "small", variant: "outlined", label: "Commits " + tk.commitMinutos + " min" }),
            tk.activo === false && React.createElement(MUI.Chip, { size: "small", color: "warning", label: "Inactivo" })),
          (tk.contexts || []).length > 0 && React.createElement(MUI.Box, null,
            React.createElement(MUI.Typography, { variant: "subtitle2", gutterBottom: true }, "Contextos"),
            (tk.contexts as any[]).map((ctx, i) => React.createElement(MUI.Paper, { key: i, variant: "outlined", sx: { p: 1.5, mb: 1 } },
              React.createElement(MUI.Typography, { variant: "body2" }, ctx.asesorNombre || "—"),
              ctx.bChecked && React.createElement(MUI.Chip, { size: "small", color: "success", label: "Revisado", sx: { ml: 1 } }),
              (ctx.commits || []).map((c: any, j: number) => React.createElement(MUI.Typography, {
                key: j, variant: "caption", component: "div", color: "text.secondary",
              }, c.hash + " · " + (c.minutos || 0) + " min · " + (c.descripcion || "")))))),
          tk.contentHtml && React.createElement(MUI.Box, {
            className: "tk-content",
            sx: { "& pre": { overflow: "auto", fontSize: "0.8rem" }, "& table": { width: "100%", borderCollapse: "collapse" } },
            dangerouslySetInnerHTML: { __html: tk.contentHtml },
          }))),
      React.createElement(MUI.DialogActions, null,
        React.createElement(MUI.Button, { onClick: props.onClose }, "Cerrar")));
  }

  function TicketsView(props: TicketsViewProps) {
    const [state, setState] = React.useState({ loading: true, error: null as string | null, rows: [] as Ticket[] });
    const [openId, setOpenId] = React.useState(null as string | null);

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

    function openTicket(t: Ticket) {
      const id = String(t.iticket || t.id || "");
      if (id) setOpenId(id);
    }

    return React.createElement(MUI.Box, null,
      React.createElement(TicketDetailDialog, { project: props.project, iticket: openId, onClose: () => setOpenId(null) }),
      React.createElement(MUI.Grid, { container: true, spacing: 2 },
        Object.keys(groups).map((e) =>
          React.createElement(MUI.Grid, { item: true, xs: 12, sm: 6, md: 3, key: e },
            React.createElement(MUI.Stack, { direction: "row", spacing: 1, alignItems: "center", sx: { mb: 1 } },
              React.createElement(MUI.Chip, { size: "small", color: ESTADO_COLOR[e] || "default", label: e }),
              React.createElement(MUI.Typography, { variant: "caption", color: "text.secondary" }, groups[e].length)),
            groups[e].map((t, i) => React.createElement(React.Fragment, { key: i }, TicketCard(t, openTicket)))))));
  }

  w.ISAJ = w.ISAJ || {};
  w.ISAJ.TicketsView = TicketsView;
})();
