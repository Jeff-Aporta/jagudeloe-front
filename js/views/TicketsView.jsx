/* views/TicketsView — tickets de un space. Navegador AÑO → MES → DÍA → ticket.
 * El HTML del ticket se genera en el front (ui/tkHtml.ts) a partir del JSON del backend. */
import { getReact, getMaterialUI } from "../core/runtime.ts";
import { UI } from "../core/platform.ts";
import { merge, boot, subscribe } from "../core/urlState.ts";
import { resolveDocDriver } from "../core/doc-driver.ts";
import { getTickets, getTicket, getRevisadoMap } from "../api/client.ts";
import { ticketListDotState, ticketDotStateLabel } from "../core/checks.ts";
import { getRealtimeConstants } from "../core/isa-front.ts";
import { DateTree, RevisadoCheck, NavStatusDot } from "../ui/parts.jsx";
import { renderTicketViewHtml, renderTicketEmailHtml } from "../ui/tkHtml.ts";
import { hydrateTkCodeBlocks, refreshTkCodeThemes } from "../ui/tkCodeHydrate.ts";
import { TicketDocWebView } from "../ui/TicketDocWebView.jsx";
import { tkDocSurfaceSx } from "../ui/tkDocSurface.ts";
import { TicketMetricsDocument } from "./TicketMetricsView.jsx";
import { TkReportSwitch } from "../ui/TkReportSwitch.jsx";
import { CopyReportLinkButton } from "../ui/CopyReportLinkButton.jsx";

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

function revisadoKeyOf(tk, iticket) {
  const ctx = (tk.contexts || [])[0] || {};
  return String(tk.revisadoKey || tk.REVISADOKEY || ctx.revisadoKey || ctx.REVISADOKEY || ("tickets." + iticket));
}

function CopyDocLinkButton({ space, iticket, driver }) {
  return <CopyReportLinkButton space={space} iticket={iticket} report="diligencia" driver={driver} />;
}

function CopyHtmlButton({ tk }) {
  const { useState } = getReact();
  const { Tooltip, IconButton } = getMaterialUI();
  const { Icon } = UI;
  const [done, setDone] = useState(false);
  if (!tk) return null;
  function copy() {
    navigator.clipboard.writeText(renderTicketEmailHtml(tk));
    setDone(true);
    setTimeout(() => setDone(false), 1500);
  }
  return (
    <Tooltip title={done ? "HTML copiado" : "Copiar HTML para correo"}>
      <IconButton size="small" onClick={copy} aria-label="Copiar HTML para correo">
        <Icon icon={done ? "mdi:check" : "mdi:email-outline"} size={20} />
      </IconButton>
    </Tooltip>
  );
}

function DriverToggle({ driver, onChange }) {
  const { ToggleButtonGroup, ToggleButton } = getMaterialUI();
  const { Icon } = UI;
  return (
    <ToggleButtonGroup size="small" exclusive value={driver} onChange={(_e, v) => v && onChange(v)} aria-label="Driver de documento">
      <ToggleButton value="jsx" title="Web — presentación moderna">
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <Icon icon="mdi:web" size={16} />
          <span>Web</span>
        </span>
      </ToggleButton>
      <ToggleButton value="html" title="HTML — para correo">
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <Icon icon="mdi:email-outline" size={16} />
          <span>HTML</span>
        </span>
      </ToggleButton>
    </ToggleButtonGroup>
  );
}

function TicketDetail(props) {
  const { useState, useEffect, useRef, useCallback } = getReact();
  const { Stack, Typography, Alert, CircularProgress, Chip, Box, useTheme } = getMaterialUI();
  const { Loading, ErrorBox } = UI;
  const [state, setState] = useState({ loading: true, error: null, tk: null });
  const [driver, setDriver] = useState(() => resolveDocDriver(boot));
  const [reportView, setReportView] = useState("diligencia");
  const htmlRef = useRef(null);
  const theme = useTheme();
  void props.ageTick;

  useEffect(() => subscribe((s) => setDriver(resolveDocDriver(s))), []);

  useEffect(() => {
    setReportView("diligencia");
  }, [props.iticket]);

  const toggleReport = useCallback(() => {
    setReportView((prev) => (prev === "metricas" ? "diligencia" : "metricas"));
  }, []);

  function onDriverChange(v) {
    merge({ driver: v });
  }

  useEffect(() => {
    let alive = true;
    setState({ loading: true, error: null, tk: null });
    getTicket(props.project, props.iticket)
      .then((d) => { if (alive) setState({ loading: false, error: null, tk: d.ticket || d }); })
      .catch((e) => { if (alive) setState({ loading: false, error: e instanceof Error ? e.message : String(e), tk: null }); });
    return () => { alive = false; };
  }, [props.project, props.iticket, props.reloadKey]);

  useEffect(() => {
    if (state.loading || driver !== "html" || !htmlRef.current || !state.tk) return;
    hydrateTkCodeBlocks(htmlRef.current, theme.palette.mode);
    refreshTkCodeThemes(htmlRef.current, theme.palette.mode);
  }, [driver, state.loading, state.tk, theme.palette.mode]);

  if (state.loading) return Loading ? <Loading label="Cargando ticket…" /> : <CircularProgress />;
  if (state.error) return ErrorBox ? <ErrorBox message={state.error} /> : <Alert severity="error">{state.error}</Alert>;

  const tk = state.tk || {};
  const html = renderTicketViewHtml(tk);
  const rKey = revisadoKeyOf(tk, props.iticket);
  const tkSpace = String(tk.space || props.project).toLowerCase();
  const dotState = ticketListDotState(tk, props.revisadoMap || {}, rKey);

  return (
    <Stack spacing={0} sx={{ height: "100%", minHeight: 0 }}>
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ px: 2, py: 1, borderBottom: 1, borderColor: "divider", flexShrink: 0 }}>
        <RevisadoCheck project={tkSpace} revisadoKey={rKey} reloadKey={props.reloadKey} label={props.iticket} showLabel={false} hint="Marcar ticket como revisado y ejecutado" />
        <Chip
          size="small"
          label={
            <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.75 }}>
              <NavStatusDot state={dotState} title={ticketDotStateLabel(dotState)} />
              {props.iticket}
            </Box>
          }
          sx={{ bgcolor: "#fff", color: "#111", fontWeight: 700 }}
        />
        <Chip size="small" variant="outlined" label={tkSpace} />
        {tk.tiempoTotalMinutos != null && <Chip size="small" variant="outlined" label={"Total " + String(tk.tiempoTotalMinutos) + " min"} />}
        <Box sx={{ flex: 1 }} />
        <TkReportSwitch mode={reportView} onToggle={toggleReport} />
        {reportView === "diligencia" && (
          <>
            <DriverToggle driver={driver} onChange={onDriverChange} />
            <CopyDocLinkButton space={tkSpace} iticket={props.iticket} driver={driver} />
            {driver === "html" && <CopyHtmlButton tk={tk} />}
          </>
        )}
        {reportView === "metricas" && (
          <CopyReportLinkButton space={tkSpace} iticket={props.iticket} report="metricas" />
        )}
      </Stack>
      {reportView === "metricas" ? (
        <Box className="tk-doc-web-surface" sx={tkDocSurfaceSx()}>
          <TicketMetricsDocument tk={tk} iticket={props.iticket} project={tkSpace} />
        </Box>
      ) : driver === "jsx" ? (
        <Box
          className="tk-doc-web-surface"
          sx={tkDocSurfaceSx()}
        >
          <TicketDocWebView tk={tk} />
        </Box>
      ) : (
        <Box
          ref={htmlRef}
          className="tk-content"
          sx={{ flex: 1, minHeight: 0, overflow: "auto", bgcolor: "transparent", "& a": { wordBreak: "break-word" } }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
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
  const [ageTick, setAgeTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setAgeTick((n) => n + 1), 60000);
    return () => window.clearInterval(id);
  }, []);

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
    const dotState = ticketListDotState(t, revisadoMap, rKey);
    return {
      id,
      date: dateOf(t),
      label: id,
      secondary: String(t.titulo || t.title || ""),
      dotState,
      dotTitle: ticketDotStateLabel(dotState),
    };
  });
  void ageTick;

  return (
    <Box sx={{ display: "flex", height: "100%", minHeight: 0 }}>
      <Box sx={{ width: 260, flexShrink: 0, borderRight: 1, borderColor: "divider", bgcolor: "background.paper", overflow: "auto", display: { xs: "none", md: "block" } }}>
        <DateTree items={treeItems} selectedId={selected} onSelect={(id) => { setSelected(id); merge({ sel: id }); }} mode="items" />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column" }}>
        {selected ? (
          <TicketDetail
            project={props.project}
            iticket={selected}
            reloadKey={props.reloadKey}
            revisadoMap={revisadoMap}
            ageTick={ageTick}
          />
        ) : (
          <Typography color="text.secondary" sx={{ p: 2 }}>Selecciona un ticket en el navegador.</Typography>
        )}
      </Box>
    </Box>
  );
}

/** Vista Tickets — listado + detalle (métricas efímeras desde toolbar del TK). */
export function TicketsView(props) {
  const { useEffect } = getReact();

  useEffect(() => {
    merge({ sub: "tickets", tkTab: undefined });
  }, []);

  return <TicketsDiligenciaView project={props.project} reloadKey={props.reloadKey} />;
}
