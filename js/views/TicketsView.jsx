/* views/TicketsView — tickets de un space. Navegador AÑO → MES → DÍA → ticket.
 * El HTML del ticket se genera en el front (ui/tkHtml.ts) a partir del JSON del backend. */
import { getReact, getMaterialUI } from "../core/runtime.ts";
import { UI } from "../core/platform.ts";
import { merge, boot } from "../core/urlState.ts";
import { getTickets, getTicket, getRevisadoMap } from "../api/client.ts";
import { aggregateDotState } from "../core/checks.ts";
import { getRealtimeConstants } from "../core/isa-front.ts";
import { DateTree, RevisadoCheck } from "../ui/parts.jsx";
import { renderTicketViewHtml, renderTicketEmailHtml } from "../ui/tkHtml.ts";
import { TicketMetricsView } from "./TicketMetricsView.jsx";

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

export function TicketsDiligenciaView(props) {
  const { useState, useEffect, useRef } = getReact();
  const { Box, Typography, Alert, CircularProgress } = getMaterialUI();
  const { Loading, ErrorBox } = UI;
  const [state, setState] = useState({ loading: true, error: null, rows: [] });
  // Selección inicial desde la URL (?s → sel): al recargar con F5 se conserva el TK abierto.
  const bootSelRef = useRef(typeof boot.sel === "string" && boot.sel ? boot.sel : null);
  const [selected, setSelected] = useState(bootSelRef.current);
  const [revisadoMap, setRevisadoMap] = useState({});

  useEffect(() => {
    let alive = true;
    setState({ loading: true, error: null, rows: [] });
    setSelected(bootSelRef.current);
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
        const all = lists.filter(Boolean).flat();
        // El sel de la URL solo se respeta si existe en este space; si no, cae al primero.
        const pref = bootSelRef.current;
        bootSelRef.current = null;
        if (pref && !all.some((t) => ticketId(t) === pref)) setSelected(null);
        setState({ loading: false, error: null, rows: all });
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

const TK_TABS = [
  { id: "diligencia", label: "Diligencia", icon: "mdi:clipboard-text-outline" },
  { id: "metricas", label: "Métricas", icon: "mdi:chart-timeline-variant" },
];

function TkTabLabel({ icon, label }) {
  const { Icon } = UI;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
      <Icon icon={icon} size={18} />
      <span>{label}</span>
    </span>
  );
}

/** Hub Tickets: Diligencia (listado) | Métricas (análisis TK). */
export function TicketsView(props) {
  const { useState, useEffect } = getReact();
  const { Box, Tabs, Tab } = getMaterialUI();
  const bootTkTab = boot.sub === "metricas" || boot.tkTab === "metricas" ? "metricas" : "diligencia";
  const [tkTab, setTkTab] = useState(TK_TABS.some((t) => t.id === bootTkTab) ? bootTkTab : "diligencia");

  useEffect(() => { merge({ sub: "tickets", tkTab }); }, [tkTab]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <Tabs
        value={tkTab}
        onChange={(_e, v) => setTkTab(v)}
        variant="scrollable"
        sx={{ px: 1, minHeight: 40, flexShrink: 0, borderBottom: 1, borderColor: "divider" }}
      >
        {TK_TABS.map((t) => (
          <Tab key={t.id} value={t.id} label={<TkTabLabel icon={t.icon} label={t.label} />} sx={{ minHeight: 40, textTransform: "none" }} />
        ))}
      </Tabs>
      <Box sx={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
        {tkTab === "metricas"
          ? <TicketMetricsView project={props.project} reloadKey={props.reloadKey} />
          : <TicketsDiligenciaView project={props.project} reloadKey={props.reloadKey} />}
      </Box>
    </Box>
  );
}
