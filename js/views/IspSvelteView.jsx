/* views/IspSvelteView — pestaña dedicada a ISP-Svelte (paquete npm).
 * Carga el universo de TKs ISP-Svelte (master + relacionados) y los muestra
 * en tarjetas; al seleccionar uno abre su detalle a la derecha. El detalle
 * reutiliza la ruta estándar de TicketsView para asegurar paridad de UI. */
import { getReact, getMaterialUI, getIsaSplitView } from "../core/platform.ts";
import { UI } from "../core/platform.ts";
import { merge, boot } from "../core/urlState.ts";
import { getIspSvelteTickets, getIspSvelteTicket } from "../api/client.ts";
import { TicketDocWebView } from "../ui/TicketDocWebView.jsx";
import { tkDocSurfaceSx } from "../ui/tkDocSurface.ts";
import { patchTkDocSeed } from "../core/tk-doc-seed-patch.ts";

function ticketId(t) {
  return String(t?.ITICKET || t?.iticket || t?.code || t?.id || "").trim();
}

function ticketTitle(t) {
  return String(t?.TITULO || t?.titulo || t?.title || "").trim();
}

function ticketSummary(t) {
  return String(t?.RESUMEN || t?.resumen || t?.summary || "").trim();
}

function ticketStatus(t) {
  return String(t?.ESTADO || t?.estado || "—").toLowerCase();
}

function ticketCommitCount(t) {
  return Number(t?.commitCount || 0);
}

function ticketSpace(t) {
  return String(t?.SPACE || t?.space || "clientesis").toLowerCase();
}

function isMasterLabel(t) {
  return ticketId(t).startsWith("TK-ISP-");
}

function ticketBadge(t) {
  if (isMasterLabel(t)) return { tone: "primary", label: "Master label" };
  if (ticketStatus(t) === "cerrado" || ticketStatus(t) === "solucionado") {
    return { tone: "success", label: "Cerrado" };
  }
  if (ticketStatus(t) === "abierto" || ticketStatus(t) === "en curso") {
    return { tone: "warning", label: "Abierto" };
  }
  return { tone: "default", label: ticketStatus(t) || "Sin estado" };
}

function IspSvelteCard({ tk, selected, onSelect }) {
  const { Stack, Typography, Chip, Box } = getMaterialUI();
  const id = ticketId(tk);
  const title = ticketTitle(tk) || "(sin título)";
  const summary = ticketSummary(tk);
  const commits = ticketCommitCount(tk);
  const badge = ticketBadge(tk);
  return (
    <Box
      onClick={() => onSelect(id)}
      sx={{
        cursor: "pointer",
        borderRadius: 1.5,
        border: 1,
        borderColor: selected ? "primary.main" : "divider",
        bgcolor: selected ? (t) => t.palette.action.selected : "background.paper",
        p: 1.5,
        transition: "border-color 120ms, background 120ms",
        "&:hover": { borderColor: "primary.light" },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
        <Typography
          variant="caption"
          sx={{ fontFamily: "monospace", fontWeight: 700, color: "text.primary" }}
        >
          {id}
        </Typography>
        <Box sx={{ flex: 1 }} />
        <Chip size="small" label={badge.label} color={badge.tone} variant={selected ? "filled" : "outlined"} />
      </Stack>
      <Typography
        variant="subtitle2"
        sx={{ fontWeight: 600, lineHeight: 1.3, mb: summary ? 0.5 : 0 }}
      >
        {title}
      </Typography>
      {summary && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {summary}
        </Typography>
      )}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
        <Chip size="small" label={ticketSpace(tk)} variant="outlined" />
        <Box sx={{ flex: 1 }} />
        <Typography variant="caption" color="text.secondary">
          {commits} {commits === 1 ? "commit" : "commits"}
        </Typography>
      </Stack>
    </Box>
  );
}

function IspSvelteDetail({ iticket, reloadKey }) {
  const { useState, useEffect } = getReact();
  const { Stack, Typography, Alert, Box, CircularProgress } = getMaterialUI();
  const { Loading, ErrorBox } = UI;
  const [state, setState] = useState({ loading: true, error: null, tk: null });
  const [activeIticket, setActiveIticket] = useState(iticket);

  useEffect(() => { setActiveIticket(iticket); }, [iticket]);

  useEffect(() => {
    if (!activeIticket) { setState({ loading: false, error: null, tk: null }); return undefined; }
    let alive = true;
    setState({ loading: true, error: null, tk: null });
    getIspSvelteTicket(activeIticket)
      .then((d) => {
        if (!alive) return;
        const raw = d?.ticket || d;
        setState({ loading: false, error: null, tk: patchTkDocSeed(raw) });
      })
      .catch((e) => { if (alive) setState({ loading: false, error: e instanceof Error ? e.message : String(e), tk: null }); });
    return () => { alive = false; };
  }, [activeIticket, reloadKey]);

  if (!activeIticket) {
    return (
      <Box sx={{ p: 4, color: "text.secondary" }}>
        <Typography>Selecciona un ticket ISP-Svelte en la columna izquierda.</Typography>
      </Box>
    );
  }
  if (state.loading) {
    return Loading
      ? <Loading label={"Cargando " + activeIticket + "…"} panel watermark={false} />
      : (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, p: 3, color: "text.secondary" }}>
          <CircularProgress size={20} />
          <Typography variant="body2">Cargando {activeIticket}…</Typography>
        </Box>
      );
  }
  if (state.error) return ErrorBox ? <ErrorBox message={state.error} /> : <Alert severity="error">{state.error}</Alert>;

  const tk = state.tk || {};
  const space = ticketSpace(tk) || "clientesis";
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
        <Typography variant="caption" sx={{ fontFamily: "monospace", fontWeight: 700 }}>
          {activeIticket}
        </Typography>
        <Box sx={{ flex: 1 }} />
        <Typography variant="caption" color="text.secondary">
          {space}
        </Typography>
      </Stack>
      <Box className="tk-doc-web-surface" sx={tkDocSurfaceSx()}>
        <TicketDocWebView
          tk={tk}
          project={space}
          onTicketUpdated={(updated) => setState((s) => ({ ...s, tk: patchTkDocSeed(updated) }))}
        />
      </Box>
    </Stack>
  );
}

export function IspSvelteView(props) {
  const { useState, useEffect, useRef } = getReact();
  const { Box, Typography, Alert, CircularProgress } = getMaterialUI();
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState({ loading: true, error: null });
  const bootSelRef = useRef(typeof boot.sel === "string" && boot.sel ? boot.sel : null);
  const [selected, setSelected] = useState(bootSelRef.current);

  useEffect(() => { merge({ space: "isp-svelte", sub: undefined }); }, []);

  useEffect(() => {
    let alive = true;
    setStatus({ loading: true, error: null });
    getIspSvelteTickets()
      .then((d) => {
        if (!alive) return;
        const list = (d && (d.rows || d.tickets || d.items)) || (Array.isArray(d) ? d : []);
        setRows(list);
        setStatus({ loading: false, error: null });
      })
      .catch((e) => {
        if (!alive) return;
        setStatus({ loading: false, error: e instanceof Error ? e.message : String(e) });
      });
    return () => { alive = false; };
  }, [props.reloadKey]);

  useEffect(() => {
    if (!rows.length) return;
    const pref = bootSelRef.current;
    if (pref && rows.some((r) => ticketId(r) === pref)) { setSelected(pref); bootSelRef.current = null; return; }
    if (!selected || !rows.some((r) => ticketId(r) === selected)) setSelected(ticketId(rows[0]));
  }, [rows]);

  const navBody = status.loading ? (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", p: 3, color: "text.secondary" }}>
      <CircularProgress size={20} />
    </Box>
  ) : status.error ? (
    <Box sx={{ p: 1.5 }}><Alert severity="error">{status.error}</Alert></Box>
  ) : !rows.length ? (
    <Box sx={{ p: 2 }}>
      <Typography variant="body2" color="text.secondary">
        No hay tickets ISP-Svelte todavía. Se crean automáticamente al documentar el paquete
        <code> @ingenieria_insoft/ispsveltecomponents-cli-is</code>.
      </Typography>
    </Box>
  ) : (
    <Stack spacing={1.25} sx={{ p: 1.5, overflow: "auto", minHeight: 0, flex: 1 }}>
      {rows.map((r) => (
        <IspSvelteCard
          key={ticketId(r)}
          tk={r}
          selected={selected === ticketId(r)}
          onSelect={(id) => { setSelected(id); merge({ sel: id }); }}
        />
      ))}
    </Stack>
  );

  const IsaSplitView = getIsaSplitView();
  return (
    <IsaSplitView
      className="isa-view-split"
      panelClassName="isa-view-split__nav"
      mainClassName="isa-view-split__main"
      hidePanelBelow="md"
      storageKey="jagudeloe:isp-svelte-nav"
      defaultWidth={320}
      panelTitle="ISP-Svelte"
      panelIcon="mdi:package-variant-closed"
      UI={UI}
      panel={(
        <Box sx={{ display: "flex", flexDirection: "column", minHeight: 0, height: "100%", flex: 1, overflow: "hidden" }}>
          <Box sx={{ px: 1.5, py: 1, flexShrink: 0, borderBottom: 1, borderColor: "divider" }}>
            <Typography variant="caption" color="text.secondary">
              {rows.length} {rows.length === 1 ? "ticket" : "tickets"} · paquete
              <code> @ingenieria_insoft/ispsveltecomponents-cli-is</code>
            </Typography>
          </Box>
          <Box sx={{ flex: 1, minHeight: 0, overflow: "auto" }}>{navBody}</Box>
        </Box>
      )}
    >
      <IspSvelteDetail iticket={selected} reloadKey={props.reloadKey} />
    </IsaSplitView>
  );
}

export default IspSvelteView;
