/* views/TicketsView — tickets de un space. Navegador AÑO → MES → DÍA → ticket.
 * El HTML del ticket se genera en el front (ui/tkHtml.ts) a partir del JSON del backend. */
import { getReact, getMaterialUI } from "../core/runtime.ts";
import { UI } from "../core/platform.ts";
import { merge } from "../core/urlState.ts";
import { getTickets, getTicket, getRevisadoMap } from "../api/client.ts";
import { aggregateDotState } from "../core/checks.ts";
import { getRealtimeConstants } from "../core/isa-front.ts";
import { DateTree, RevisadoCheck } from "../ui/parts.jsx";
import { renderTicketViewHtml, renderTicketEmailHtml } from "../ui/tkHtml.ts";

const ESTADO_COLOR = { abierto: "warning", "en-progreso": "info", cerrado: "success", bloqueado: "error" };
/* Spaces reales de tickets; "general" los combina todos sin filtro. */
const TICKET_SPACES = ["patyia", "clientesis"];
function spacesFor(project) { return project === "general" ? TICKET_SPACES : [project]; }
const ABBR = { ene: "01", feb: "02", mar: "03", abr: "04", may: "05", jun: "06", jul: "07", ago: "08", sep: "09", oct: "10", nov: "11", dic: "12" };

function ticketId(t) { return String(t.code || t.iticket || t.id || ""); }

function dateOf(t) {
  let m = /^(\d{4}-\d{2}-\d{2})/.exec(t.fecha || t.fechaSolicitud || "");
  if (m) return m[1];
  m = /(\d{1,2})\/([a-záéíóú]+)\.?\/(\d{4})/i.exec(String(t.fechaSolicitud || t.fecha || ""));
  if (m) {
    const mm = ABBR[m[2].slice(0, 3).toLowerCase()];
    if (mm) return m[3] + "-" + mm + "-" + m[1].padStart(2, "0");
  }
  return "";
}

function revisadoKeyOf(tk, iticket) { return String(tk.revisadoKey || tk.REVISADOKEY || ("tickets." + iticket)); }

function CopyHtmlButton({ tk }) {
  const { useState } = getReact();
  const { Tooltip, Button } = getMaterialUI();
  const { Icon } = UI;
  const [done, setDone] = useState(false);
  if (!tk) return null;
  function copy() {
    navigator.clipboard.writeText(renderTicketEmailHtml(tk));
    setDone(true);
    setTimeout(() => setDone(false), 1500);
  }
  return (
    <Tooltip title={done ? "Copiado" : "Copiar HTML para correo"}>
      <Button size="small" variant="outlined" startIcon={<Icon icon={done ? "mdi:check" : "mdi:email-outline"} />} onClick={copy}>
        {done ? "HTML copiado" : "Copiar HTML"}
      </Button>
    </Tooltip>
  );
}

function TicketDetail(props) {
  const { useState, useEffect } = getReact();
  const { Stack, Typography, Alert, CircularProgress, Chip, Box } = getMaterialUI();
  const { Loading, ErrorBox } = UI;
  const [state, setState] = useState({ loading: true, error: null, tk: null });

  useEffect(() => {
    let alive = true;
    setState({ loading: true, error: null, tk: null });
    getTicket(props.project, props.iticket)
      .then((d) => { if (alive) setState({ loading: false, error: null, tk: d.ticket || d }); })
      .catch((e) => { if (alive) setState({ loading: false, error: e instanceof Error ? e.message : String(e), tk: null }); });
    return () => { alive = false; };
  }, [props.project, props.iticket, props.reloadKey]);

  if (state.loading) return Loading ? <Loading label="Cargando ticket…" /> : <CircularProgress />;
  if (state.error) return ErrorBox ? <ErrorBox message={state.error} /> : <Alert severity="error">{state.error}</Alert>;

  const tk = state.tk || {};
  const rKey = revisadoKeyOf(tk, props.iticket);
  const tkSpace = String(tk.space || props.project).toLowerCase();
  const html = renderTicketViewHtml(tk);

  return (
    <Stack spacing={0} sx={{ height: "100%", minHeight: 0 }}>
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ px: 2, py: 1, borderBottom: 1, borderColor: "divider", flexShrink: 0 }}>
        <RevisadoCheck project={tkSpace} revisadoKey={rKey} reloadKey={props.reloadKey} label={props.iticket} showLabel={false} hint="Marcar ticket como revisado y ejecutado" />
        <Chip size="small" variant="outlined" label={tkSpace} />
        <Chip size="small" color="primary" label={props.iticket} />
        {tk.estado && <Chip size="small" color={ESTADO_COLOR[String(tk.estado)] || "default"} label={String(tk.estado)} />}
        {tk.tiempoTotalMinutos != null && <Chip size="small" variant="outlined" label={"Total " + String(tk.tiempoTotalMinutos) + " min"} />}
        <Box sx={{ flex: 1 }} />
        <CopyHtmlButton tk={tk} />
      </Stack>
      <Box
        className="tk-content"
        sx={{ flex: 1, minHeight: 0, overflow: "auto", bgcolor: "#eef2f7", "& a": { wordBreak: "break-word" } }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </Stack>
  );
}

export function TicketsView(props) {
  const { useState, useEffect } = getReact();
  const { Box, Typography, Alert, CircularProgress } = getMaterialUI();
  const { Loading, ErrorBox } = UI;
  const [state, setState] = useState({ loading: true, error: null, rows: [] });
  const [selected, setSelected] = useState(null);
  const [revisadoMap, setRevisadoMap] = useState({});

  useEffect(() => {
    let alive = true;
    setState({ loading: true, error: null, rows: [] });
    setSelected(null);
    const spaces = spacesFor(props.project);
    Promise.all(spaces.map((s) =>
      getTickets(s).then((d) => {
        const rows = (d && !Array.isArray(d) && (d.rows || d.tickets || d.items)) || (Array.isArray(d) ? d : []);
        // Filtro estricto: solo tickets cuyo space coincide con el tab.
        return rows.filter((t) => String(t.space || s).toLowerCase() === s);
      }).catch(() => null),
    ))
      .then((lists) => {
        if (!alive) return;
        if (lists.every((l) => l === null)) { setState({ loading: false, error: "No se pudo cargar los tickets.", rows: [] }); return; }
        setState({ loading: false, error: null, rows: lists.filter(Boolean).flat() });
      });
    return () => { alive = false; };
  }, [props.project, props.reloadKey]);

  function loadRevisado(force) {
    return Promise.all(spacesFor(props.project).map((s) => getRevisadoMap(s, force).catch(() => ({}))))
      .then((maps) => Object.assign({}, ...maps));
  }

  useEffect(() => {
    let alive = true;
    loadRevisado(false).then((m) => { if (alive) setRevisadoMap(m); });
    return () => { alive = false; };
  }, [props.project, props.reloadKey]);

  useEffect(() => {
    const { REALTIME, REALTIME_EVENT } = getRealtimeConstants();
    function refresh() { loadRevisado(true).then(setRevisadoMap).catch(() => setRevisadoMap({})); }
    function onRealtime(e) { const msg = e.detail; if (msg && msg.type && msg.type !== REALTIME.CHECKS_UPDATED) return; refresh(); }
    window.addEventListener("isaj:checks-sync", refresh);
    window.addEventListener(REALTIME_EVENT, onRealtime);
    return () => { window.removeEventListener("isaj:checks-sync", refresh); window.removeEventListener(REALTIME_EVENT, onRealtime); };
  }, [props.project]);

  const rows = state.rows.slice().sort((a, b) => (dateOf(a) < dateOf(b) ? 1 : -1));
  useEffect(() => { if (rows.length && !selected) setSelected(ticketId(rows[0])); }, [state.rows]);

  if (state.loading) return Loading ? <Loading label="Cargando tickets…" /> : <CircularProgress />;
  if (state.error) return ErrorBox ? <ErrorBox message={state.error} /> : <Alert severity="error">{state.error}</Alert>;
  if (!rows.length) return <Alert severity="info">{"Sin tickets en " + props.project + "."}</Alert>;

  const treeItems = rows.map((t) => {
    const id = ticketId(t);
    const rKey = revisadoKeyOf(t, id);
    return { id, date: dateOf(t), label: id, secondary: String(t.titulo || t.title || ""), dotState: aggregateDotState([rKey], revisadoMap) };
  });

  return (
    <Box sx={{ display: "flex", height: "100%", minHeight: 0 }}>
      <Box sx={{ width: 260, flexShrink: 0, borderRight: 1, borderColor: "divider", overflow: "auto", display: { xs: "none", md: "block" } }}>
        <DateTree items={treeItems} selectedId={selected} onSelect={(id) => { setSelected(id); merge({ sel: id }); }} mode="items" />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column" }}>
        {selected ? <TicketDetail project={props.project} iticket={selected} reloadKey={props.reloadKey} /> : <Typography color="text.secondary" sx={{ p: 2 }}>Selecciona un ticket en el navegador.</Typography>}
      </Box>
    </Box>
  );
}
