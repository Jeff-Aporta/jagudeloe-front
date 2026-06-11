/*
 * views/TicketsView — tickets de un space. Navegador en carpetas AÑO → MES → DÍA →
 * ticket (solo números en las carpetas); a la derecha se ve UN TICKET a la vez.
 * Cada ticket incluye su checkbox de revisado inline (revisadoKey).
 */

interface Ticket {
  id?: string | number; iticket?: string | number; code?: string;
  titulo?: string; title?: string; descripcion?: string; resumen?: string;
  estado?: string; status?: string; prioridad?: string;
  fecha?: string; fechaSolicitud?: string; solicitante?: string;
  tiempoTotalMinutos?: number; revisadoKey?: string;
}
interface TicketsViewProps { project: string; reloadKey?: number; }

(function () {
  "use strict";
  const MUI = MaterialUI;
  const UI = window.ISAJ.UI;
  const P = window.ISAJ.Parts;

  const ESTADO_COLOR: Record<string, string> = {
    abierto: "warning", "en-progreso": "info", cerrado: "success", bloqueado: "error",
  };
  const ABBR: Record<string, string> = {
    ene: "01", feb: "02", mar: "03", abr: "04", may: "05", jun: "06",
    jul: "07", ago: "08", sep: "09", oct: "10", nov: "11", dic: "12",
  };

  function ticketId(t: Ticket): string { return String(t.code || t.iticket || t.id || ""); }

  function dateOf(t: Ticket): string {
    let m = /^(\d{4}-\d{2}-\d{2})/.exec(t.fecha || "");
    if (m) return m[1];
    m = /(\d{1,2})\/([a-záéíóú]+)\.?\/(\d{4})/i.exec(t.fechaSolicitud || "");
    if (m) { const mm = ABBR[m[2].slice(0, 3).toLowerCase()]; if (mm) return m[3] + "-" + mm + "-" + m[1].padStart(2, "0"); }
    return "";
  }

  function revisadoKeyOf(tk: Record<string, unknown>, iticket: string): string {
    return String(tk.revisadoKey || tk.REVISADOKEY || ("tickets." + iticket));
  }

  function TicketDetail(props: { project: string; iticket: string; reloadKey?: number }) {
    const [state, setState] = React.useState<{ loading: boolean; error: string | null; tk: Record<string, unknown> | null }>({ loading: true, error: null, tk: null });
    React.useEffect(() => {
      let alive = true;
      setState({ loading: true, error: null, tk: null });
      window.ISAJ.Api.getTicket(props.project, props.iticket)
        .then((d) => { const b = d as Record<string, unknown>; if (alive) setState({ loading: false, error: null, tk: (b.ticket || b) as Record<string, unknown> }); })
        .catch((e) => { if (alive) setState({ loading: false, error: e instanceof Error ? e.message : String(e), tk: null }); });
      return () => { alive = false; };
    }, [props.project, props.iticket, props.reloadKey]);

    if (state.loading) return UI.Loading ? React.createElement(UI.Loading, { label: "Cargando ticket…" }) : React.createElement(MUI.CircularProgress, null);
    if (state.error) return UI.ErrorBox ? React.createElement(UI.ErrorBox, { message: state.error }) : React.createElement(MUI.Alert, { severity: "error" }, state.error);
    const tk = state.tk || {};
    const rKey = revisadoKeyOf(tk, props.iticket);
    return React.createElement(MUI.Stack, { spacing: 2 },
      React.createElement(MUI.Stack, { direction: "row", spacing: 1, alignItems: "center" },
        React.createElement(P.RevisadoCheck, { project: props.project, revisadoKey: rKey, reloadKey: props.reloadKey, label: props.iticket }),
        React.createElement(MUI.Chip, { size: "small", color: "primary", label: props.iticket }),
        React.createElement(MUI.Typography, { variant: "h6" }, String(tk.titulo || tk.title || ""))),
      tk.resumen && React.createElement(MUI.Typography, { variant: "body2", color: "text.secondary" }, String(tk.resumen)),
      React.createElement(MUI.Stack, { direction: "row", spacing: 1, flexWrap: "wrap" },
        tk.estado && React.createElement(MUI.Chip, { size: "small", color: ESTADO_COLOR[String(tk.estado)] || "default", label: String(tk.estado) }),
        tk.tiempoTotalMinutos != null && React.createElement(MUI.Chip, { size: "small", variant: "outlined", label: "Total " + String(tk.tiempoTotalMinutos) + " min" }),
        tk.solicitante && React.createElement(MUI.Chip, { size: "small", variant: "outlined", label: "Solicita: " + String(tk.solicitante) })),
      tk.contentHtml && React.createElement(MUI.Box, {
        className: "tk-content",
        sx: { "& pre": { overflow: "auto", fontSize: "0.8rem" }, "& table": { width: "100%", borderCollapse: "collapse" } },
        dangerouslySetInnerHTML: { __html: String(tk.contentHtml) },
      }));
  }

  function TicketsView(props: TicketsViewProps) {
    const [state, setState] = React.useState({ loading: true, error: null as string | null, rows: [] as Ticket[] });
    const [selected, setSelected] = React.useState<string | null>(null);

    React.useEffect(() => {
      let alive = true;
      setState({ loading: true, error: null, rows: [] });
      setSelected(null);
      window.ISAJ.Api.getTickets(props.project)
        .then((d) => {
          const body = d as Record<string, unknown> | Ticket[] | null;
          const rows: Ticket[] = (body && !Array.isArray(body) && ((body.rows as Ticket[]) || (body.tickets as Ticket[]) || (body.items as Ticket[]))) || (Array.isArray(body) ? body : []);
          if (alive) setState({ loading: false, error: null, rows });
        })
        .catch((e) => { if (alive) setState({ loading: false, error: e instanceof Error ? e.message : String(e), rows: [] }); });
      return () => { alive = false; };
    }, [props.project, props.reloadKey]);

    const rows = state.rows.slice().sort((a, b) => (dateOf(a) < dateOf(b) ? 1 : -1));

    React.useEffect(() => {
      if (rows.length && !selected) setSelected(ticketId(rows[0]));
    }, [state.rows]);

    if (state.loading) return UI.Loading ? React.createElement(UI.Loading, { label: "Cargando tickets…" }) : React.createElement(MUI.CircularProgress, null);
    if (state.error) return UI.ErrorBox ? React.createElement(UI.ErrorBox, { message: state.error }) : React.createElement(MUI.Alert, { severity: "error" }, state.error);
    if (!rows.length) return React.createElement(MUI.Alert, { severity: "info" }, "Sin tickets en " + props.project + ".");

    const treeItems = rows.map((t) => ({
      id: ticketId(t), date: dateOf(t),
      label: ticketId(t) + " · " + (t.titulo || t.title || ""),
      secondary: t.estado || t.status,
    }));

    const tree = React.createElement(MUI.Box, {
      sx: { width: 260, flexShrink: 0, borderRight: 1, borderColor: "divider", overflow: "auto", display: { xs: "none", md: "block" } },
    }, React.createElement(P.DateTree, { items: treeItems, selectedId: selected, onSelect: (id: string) => { setSelected(id); window.ISAJ.UrlState.merge({ sel: id }); }, mode: "items" }));

    const content = React.createElement(MUI.Box, { sx: { flex: 1, minWidth: 0, overflow: "auto", p: 2 } },
      selected
        ? React.createElement(TicketDetail, { project: props.project, iticket: selected, reloadKey: props.reloadKey })
        : React.createElement(MUI.Typography, { color: "text.secondary" }, "Selecciona un ticket en el navegador."));

    return React.createElement(MUI.Box, { sx: { display: "flex", height: "100%", minHeight: 0 } }, tree, content);
  }

  window.ISAJ = window.ISAJ || ({} as IsajNs);
  window.ISAJ.TicketsView = TicketsView;
})();
