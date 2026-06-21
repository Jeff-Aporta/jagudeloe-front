/* views/TicketsView — tickets de un space. Navegador AÑO → MES → DÍA → ticket.
 * El HTML del ticket se genera en el front (ui/tkHtml.ts) a partir del JSON del backend. */
import { getReact, getMaterialUI } from "../core/platform.ts";
import { UI } from "../core/platform.ts";
import { merge, boot, subscribe } from "../core/urlState.ts";
import { resolveDocDriver } from "../core/tk-doc.ts";
import { getTickets, getTicket, getRevisadoMap } from "../api/client.ts";
import { patchTkDocSeed } from "../core/tk-doc-seed-patch.ts";
import { ticketListDotState, ticketDotStateLabel } from "../core/checks.ts";
import { getRealtimeConstants } from "../core/platform.ts";
import { NavStatusDot } from "../ui/parts.jsx";
import { renderTicketViewHtml, renderTicketEmailHtml } from "../ui/tkHtml.ts";
import { hydrateTkCodeBlocks, refreshTkCodeThemes } from "../ui/tkCodeHydrate.ts";
import { TicketDocWebView } from "../ui/TicketDocWebView.jsx";
import { tkDocSurfaceSx } from "../ui/tkDocSurface.ts";
import { TicketMetricsDocument } from "./TicketMetricsView.jsx";
import { TkReportSwitch } from "../ui/TkReportSwitch.jsx";
import { CopyReportLinkButton, CopyReportLinkHtmlButton } from "../ui/CopyReportLinkButton.jsx";
import { tkToolbarSoftChipSx, roundTkMinutosTo5 } from "../core/tk-table.ts";
import { tkSpaceChipTone } from "../core/tk-spaces.ts";

const TICKET_SPACES = ["patyia", "clientesis"];
function spacesFor(project) { return project === "general" ? TICKET_SPACES : [project]; }
const ABBR = { ene: "01", feb: "02", mar: "03", abr: "04", may: "05", jun: "06", jul: "07", ago: "08", sep: "09", oct: "10", nov: "11", dic: "12" };
const navPanelSx = { width: 260, borderRight: 1, borderColor: "divider", bgcolor: "background.paper" };

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

function ticketTotalMinutos(tk) {
  const rows = tk?.tiempos;
  if (Array.isArray(rows) && rows.length) {
    const sum = rows.reduce((n, r) => n + roundTkMinutosTo5(Number(r?.minutos || 0)), 0);
    if (sum > 0) return sum;
  }
  const estim = Number(tk?.tiempoEstimacionMinutos);
  if (Number.isFinite(estim) && estim > 0) return estim;
  const direct = Number(tk?.tiempoTotalMinutos);
  if (Number.isFinite(direct) && direct > 0) return direct;
  const dil = Number(tk?.diligenciaMinutos);
  if (Number.isFinite(dil) && dil > 0) return dil;
  return null;
}

function CopyDocLinkButton({ space, iticket, driver, titulo }) {
  return (
    <>
      <CopyReportLinkButton space={space} iticket={iticket} report="diligencia" driver={driver} />
      <CopyReportLinkHtmlButton space={space} iticket={iticket} report="diligencia" driver={driver} titulo={titulo} />
    </>
  );
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
      .then((d) => {
        if (!alive) return;
        const raw = d.ticket || d;
        setState({ loading: false, error: null, tk: patchTkDocSeed(raw) });
      })
      .catch((e) => { if (alive) setState({ loading: false, error: e instanceof Error ? e.message : String(e), tk: null }); });
    return () => { alive = false; };
  }, [props.project, props.iticket, props.reloadKey]);

  useEffect(() => {
    if (state.loading || driver !== "html" || !htmlRef.current || !state.tk) return;
    hydrateTkCodeBlocks(htmlRef.current, theme.palette.mode);
    refreshTkCodeThemes(htmlRef.current, theme.palette.mode);
  }, [driver, state.loading, state.tk, theme.palette.mode]);

  if (state.loading) {
    return Loading
      ? <Loading label="Cargando ticket…" panel watermark={false} />
      : (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, p: 3, color: "text.secondary" }}>
          <CircularProgress size={20} />
        </Box>
      );
  }
  if (state.error) return ErrorBox ? <ErrorBox message={state.error} /> : <Alert severity="error">{state.error}</Alert>;

  const tk = state.tk || {};
  const html = renderTicketViewHtml(tk);
  const rKey = revisadoKeyOf(tk, props.iticket);
  const tkSpace = String(tk.space || props.project).toLowerCase();
  const dotState = ticketListDotState(tk, props.revisadoMap || {}, rKey);

  return (
    <Stack spacing={0} sx={{ height: "100%", minHeight: 0 }}>
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        flexWrap="wrap"
        className="tk-detail-toolbar"
        sx={{ px: 2, py: 0.75, minHeight: 48, borderBottom: 1, borderColor: "divider", flexShrink: 0 }}
      >
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
        <Chip size="small" label={tkSpace} sx={(t) => tkToolbarSoftChipSx(tkSpaceChipTone(tkSpace), t)} />
        {ticketTotalMinutos(tk) != null && (
          <Chip size="small" label={"Total " + String(ticketTotalMinutos(tk)) + " min"} sx={(t) => tkToolbarSoftChipSx("warning", t)} />
        )}
        <Box sx={{ flex: 1 }} />
        <TkReportSwitch mode={reportView} onToggle={toggleReport} />
        {reportView === "diligencia" && (
          <>
            <DriverToggle driver={driver} onChange={onDriverChange} />
            <CopyDocLinkButton space={tkSpace} iticket={props.iticket} driver={driver} titulo={tk.titulo || tk.title} />
            {driver === "html" && <CopyHtmlButton tk={tk} />}
          </>
        )}
        {reportView === "metricas" && (
          <>
            <CopyReportLinkButton space={tkSpace} iticket={props.iticket} report="metricas" />
            <CopyReportLinkHtmlButton space={tkSpace} iticket={props.iticket} report="metricas" titulo={tk.titulo || tk.title} />
          </>
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
          <TicketDocWebView
            tk={tk}
            project={tkSpace}
            onTicketUpdated={(updated) => setState((s) => ({ ...s, tk: patchTkDocSeed(updated) }))}
          />
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

const PAGE_SIZE = 50;

/** Fila de la lista plana (stack) de tickets. */
function FlatTicketRow({ tk, selected, revisadoMap, onSelect }) {
  const { ListItemButton, ListItemText, Box, Tooltip } = getMaterialUI();
  const id = ticketId(tk);
  const rKey = revisadoKeyOf(tk, id);
  const dotState = ticketListDotState(tk, revisadoMap, rKey);
  const title = String(tk.titulo || tk.title || "").trim();
  const minutos = ticketTotalMinutos(tk);
  const minLabel = minutos != null ? `${minutos} min` : null;
  const ellipsisSx = { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" };
  const row = (
    <ListItemButton
      selected={selected}
      onClick={() => onSelect(id)}
      sx={{ alignItems: "center", py: 0.75, gap: 1, overflow: "hidden", minWidth: 0, width: "100%" }}
    >
      <Box sx={{ flexShrink: 0 }}>
        <NavStatusDot state={dotState} title={ticketDotStateLabel(dotState)} />
      </Box>
      <ListItemText
        primary={(
          <Box component="span" sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 1, minWidth: 0 }}>
            <Box component="span" sx={{ ...ellipsisSx, fontSize: 13, fontWeight: 600 }}>{id}</Box>
            {minLabel && (
              <Box component="span" sx={{ flexShrink: 0, fontSize: 10, fontWeight: 700, color: "text.secondary", letterSpacing: 0.15 }}>
                {minLabel}
              </Box>
            )}
          </Box>
        )}
        secondary={title || undefined}
        sx={{
          minWidth: 0, my: 0, overflow: "hidden", flex: 1,
          "& .MuiListItemText-secondary": ellipsisSx,
        }}
        secondaryTypographyProps={{ fontSize: 11, ...ellipsisSx }}
      />
    </ListItemButton>
  );
  const tip = [title, minLabel].filter(Boolean).join(" · ");
  return tip ? (
    <Tooltip title={tip} placement="right" enterDelay={400}>
      <Box component="div" sx={{ display: "block", minWidth: 0, overflow: "hidden" }}>
        {row}
      </Box>
    </Tooltip>
  ) : (
    row
  );
}

export function TicketsDiligenciaView(props) {
  const { useState, useEffect, useRef, useCallback } = getReact();
  const { Box, Typography, Alert, CircularProgress, List, TextField, InputAdornment } = getMaterialUI();
  const { Loading, ErrorBox, Icon } = UI;

  const bootSelRef = useRef(
    typeof boot.sel === "string" && boot.sel && !/^TK-XXXX\d+$/i.test(boot.sel) ? boot.sel : null,
  );
  const [rows, setRows] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [status, setStatus] = useState({ loading: true, loadingMore: false, error: null });
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(bootSelRef.current);
  const [revisadoMap, setRevisadoMap] = useState({});
  const [ageTick, setAgeTick] = useState(0);

  const scrollRef = useRef(null);
  const sentinelRef = useRef(null);
  const loadingRef = useRef(false);
  const reqRef = useRef(0);
  const spacesKey = spacesFor(props.project).join("|");

  useEffect(() => {
    const id = window.setInterval(() => setAgeTick((n) => n + 1), 60000);
    return () => window.clearInterval(id);
  }, []);

  // Debounce del buscador.
  useEffect(() => {
    const id = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(id);
  }, [searchInput]);

  const loadPage = useCallback(
    (off, reset = false) => {
      if (loadingRef.current && !reset) return;
      loadingRef.current = true;
      const req = ++reqRef.current; // invalida respuestas en vuelo
      const first = off === 0;
      setStatus((s) => ({ loading: first, loadingMore: !first, error: first ? null : s.error }));
      const spaces = spacesFor(props.project);
      Promise.all(
        spaces.map((s) =>
          getTickets(s, { limit: PAGE_SIZE, offset: off, search: search || undefined })
            .then((d) => {
              const r = (d && (d.rows || d.tickets || d.items)) || (Array.isArray(d) ? d : []);
              return { rows: r.filter((t) => {
                const id = String(t.code || t.iticket || t.id || "");
                return String(t.space || s).toLowerCase() === s && !/^TK-XXXX\d+$/i.test(id);
              }), hasMore: !!d?.hasMore };
            })
            .catch(() => null),
        ),
      ).then((results) => {
        if (req !== reqRef.current) return; // respuesta obsoleta
        loadingRef.current = false;
        if (results.every((x) => x === null)) {
          setStatus({ loading: false, loadingMore: false, error: "No se pudo cargar los tickets." });
          return;
        }
        const page = results.filter(Boolean).flatMap((x) => x.rows);
        const more = results.filter(Boolean).some((x) => x.hasMore);
        setRows((prev) => {
          const base = first ? [] : prev;
          const seen = new Set(base.map(ticketId));
          const merged = base.concat(page.filter((t) => !seen.has(ticketId(t))));
          merged.sort((a, b) => (dateOf(a) < dateOf(b) ? 1 : -1));
          return merged;
        });
        setOffset(off + PAGE_SIZE);
        setHasMore(more);
        setStatus({ loading: false, loadingMore: false, error: null });
      });
    },
    [props.project, search],
  );

  // Carga inicial / reset por proyecto, búsqueda o reload.
  useEffect(() => {
    setRows([]);
    setOffset(0);
    setHasMore(false);
    loadPage(0, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spacesKey, search, props.reloadKey]);

  // Scroll infinito: carga la siguiente página al acercarse al final.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return undefined;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !loadingRef.current) loadPage(offset);
      },
      { root: scrollRef.current, rootMargin: "240px" },
    );
    io.observe(sentinel);
    return () => io.disconnect();
  }, [hasMore, offset, loadPage]);

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

  // Selección por defecto (primer ticket) cuando no hay sel válido.
  useEffect(() => {
    if (!rows.length) return;
    const pref = bootSelRef.current;
    if (pref) {
      bootSelRef.current = null;
      if (rows.some((t) => ticketId(t) === pref)) { setSelected(pref); return; }
    }
    if (!selected || !rows.some((t) => ticketId(t) === selected) || /^TK-XXXX\d+$/i.test(selected)) {
      setSelected(ticketId(rows[0]));
    }
  }, [rows]);

  void ageTick;

  // Filtro client-side (red de seguridad mientras el worker despliega el filtro server-side).
  const q = search.trim().toLowerCase();
  const displayRows = q
    ? rows.filter((t) => {
        const id = ticketId(t).toLowerCase();
        const ti = String(t.titulo || t.title || "").toLowerCase();
        return id.includes(q) || ti.includes(q);
      })
    : rows;

  const navBody = status.loading ? (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", p: 3, color: "text.secondary" }}>
      <CircularProgress size={20} />
    </Box>
  ) : status.error ? (
    <Box sx={{ p: 1.5 }}>{ErrorBox ? <ErrorBox message={status.error} /> : <Alert severity="error">{status.error}</Alert>}</Box>
  ) : !displayRows.length ? (
    <Typography color="text.secondary" sx={{ p: 2, fontSize: 13 }}>
      {search ? "Sin coincidencias." : "Sin tickets en " + props.project + "."}
    </Typography>
  ) : (
    <List dense disablePadding>
      {displayRows.map((t) => {
        const id = ticketId(t);
        return (
          <FlatTicketRow
            key={id}
            tk={t}
            selected={selected === id}
            revisadoMap={revisadoMap}
            onSelect={(sid) => { setSelected(sid); merge({ sel: sid }); }}
          />
        );
      })}
      <Box ref={sentinelRef} sx={{ height: 1 }} />
      {status.loadingMore && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 1.5 }}>
          <CircularProgress size={18} />
        </Box>
      )}
    </List>
  );

  return (
    <Box className="isa-view-split">
      <Box className="isa-view-split__nav" sx={{ ...navPanelSx, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Box sx={{ p: 1, flexShrink: 0 }}>
          <TextField
            size="small"
            fullWidth
            placeholder="Buscar TK o título…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            InputProps={
              Icon
                ? { startAdornment: <InputAdornment position="start"><Icon icon="mdi:magnify" size={18} /></InputAdornment> }
                : undefined
            }
          />
        </Box>
        <Box ref={scrollRef} sx={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
          {navBody}
        </Box>
      </Box>
      <Box className="isa-view-split__main">
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
