/* views/TicketMetricsView — documento inline con cards y timeline JSX. */
import { getReact, getMaterialUI } from "../core/runtime.ts";
import { UI } from "../core/platform.ts";
import { merge, boot } from "../core/urlState.ts";
import { getTickets, getTicket } from "../api/client.ts";
import {
  computeFromTicket,
  extractMetricInput,
  formatMinutos,
  formatHorasDecimal,
} from "../core/tk-metrics.ts";
import { extractTipoSolicitudApertura, tipoSolicitudChipLabel } from "../core/tk-normativa.ts";
import { extractTicketEvidencias } from "../core/tk-evidencias.ts";
import { buildTicketTimeline, buildTicketMilestones } from "../core/tk-timeline.ts";
import { extractEmpresaReport, computeEmpresaDesfase } from "../core/tk-empresa-report.ts";
import { TicketAnalysisTimeline } from "../ui/TicketAnalysisTimeline.jsx";
import { TicketMetricsEvidencias } from "../ui/TicketMetricsEvidencias.jsx";
import { EmpresaDesfaseCard } from "../ui/EmpresaDesfaseCard.jsx";
import { EmpresaComparativoReport } from "../ui/EmpresaComparativoReport.jsx";
import { REPORTE_GENERAL_ID, buildComparativoReport } from "../core/tk-empresa-comparativo.ts";
import { spacesFor, reportProject, projectLabel, isGeneralProject } from "../core/tk-spaces.ts";

function ticketId(t) { return String(t.code || t.iticket || t.id || ""); }

/** Colores explícitos — evita texto blanco sobre fondo blanco cuando sx no resuelve el palette. */
function useDocColors() {
  const { useTheme } = getMaterialUI();
  const dark = useTheme().palette.mode === "dark";
  return {
    pageBg: dark ? "#0a1929" : "#eef2f7",
    cardBg: dark ? "#132f4c" : "#ffffff",
    cardHi: dark ? "#1a3a5c" : "#f0f6ff",
    border: dark ? "rgba(158,197,235,0.3)" : "rgba(10,37,64,0.15)",
    text: dark ? "#e8f4ff" : "#0a2540",
    muted: dark ? "#9ec5eb" : "#4a6278",
    preBg: dark ? "#0d2137" : "#e8eef5",
  };
}

function cardSx(c, extra = {}) {
  return { bgcolor: c.cardBg, borderColor: c.border, color: c.text, ...extra };
}

function DocText({ variant, muted, bold, children, sx }) {
  const c = useDocColors();
  const { Typography } = getMaterialUI();
  return (
    <Typography
      variant={variant || "body1"}
      sx={{ color: muted ? c.muted : c.text, fontWeight: bold ? 600 : 400, lineHeight: 1.5, ...sx }}
    >
      {children}
    </Typography>
  );
}

function MetricCard({ label, minutos, sub, highlight, warn, icon }) {
  const c = useDocColors();
  const { Paper, Typography, Stack } = getMaterialUI();
  const { Icon } = UI;
  const decimal = formatHorasDecimal(minutos);
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        flex: "1 1 140px",
        minWidth: 140,
        ...cardSx(c, {
          bgcolor: highlight ? c.cardHi : warn ? c.cardBg : c.cardBg,
          borderColor: highlight ? "#1e90ff" : warn ? "#ed6c02" : c.border,
        }),
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
        {icon && <Icon icon={icon} size={18} />}
        <Typography variant="body2" sx={{ color: c.muted, fontWeight: 500 }}>{label}</Typography>
      </Stack>
      <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2, color: c.text }}>
        {formatMinutos(minutos)}
        {decimal != null && (
          <Typography
            component="span"
            sx={{ ml: 0.75, fontWeight: 500, fontSize: "0.82em", color: c.muted, opacity: 0.72 }}
          >
            ({decimal})
          </Typography>
        )}
      </Typography>
      {sub && <Typography variant="body2" sx={{ color: c.muted, mt: 0.5, lineHeight: 1.45 }}>{sub}</Typography>}
    </Paper>
  );
}

function SectionCard({ title, icon, children }) {
  const c = useDocColors();
  const { Paper, Stack } = getMaterialUI();
  const { Icon } = UI;
  return (
    <Paper variant="outlined" sx={{ p: 2.5, mb: 2, ...cardSx(c) }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
        {icon && <Icon icon={icon} size={22} />}
        <DocText variant="h6" bold>{title}</DocText>
      </Stack>
      {children}
    </Paper>
  );
}

function TicketMetricsDocument({ tk, iticket, project }) {
  const c = useDocColors();
  const { Stack, Box, Alert } = getMaterialUI();
  const m = computeFromTicket(tk);
  const input = extractMetricInput(tk);
  const reporteEmpresa = extractEmpresaReport(tk, project);
  const desfase = computeEmpresaDesfase(m, reporteEmpresa);
  const timeline = buildTicketTimeline(iticket, tk.titulo || tk.title || "", m, input);
  const milestones = buildTicketMilestones(m, input);
  const evidencias = extractTicketEvidencias(tk);
  const tipoApertura = extractTipoSolicitudApertura(tk);

  return (
    <Box sx={{ maxWidth: 920, mx: "auto", py: 3, px: { xs: 2, md: 3 }, bgcolor: c.pageBg, color: c.text, minHeight: "100%" }}>
      <Box sx={{ mb: 3 }}>
        <DocText variant="subtitle2" muted bold sx={{ letterSpacing: 0.3 }}>Estudio de métricas · tiempo hábil</DocText>
        <DocText variant="h4" bold sx={{ mt: 0.75, fontSize: "1.75rem" }}>{iticket}</DocText>
        <DocText variant="h6" muted sx={{ mt: 0.75, fontWeight: 500 }}>{tk.titulo || tk.title || ""}</DocText>
        {tipoApertura && (
          <DocText muted sx={{ mt: 0.75, fontSize: "0.95rem" }}>
            Tipo solicitud apertura: {tipoApertura}
          </DocText>
        )}
      </Box>

      {!m.fechaCreacion && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Falta fecha de creación. Registra {"meta.metricas.fechaCreacion"} desde InSoft.
        </Alert>
      )}
      {m.fechaCreacion && !m.fechaCierre && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Ticket abierto — sin cierre InSoft. Métricas de atención activa y total se calcularán al registrar {"fechaCierre"}.
        </Alert>
      )}

      {/* KPI cards inline */}
      <Stack direction="row" flexWrap="wrap" gap={1.5} sx={{ mb: 3 }}>
        <MetricCard icon="mdi:clock-start" label="Hasta atención" minutos={m.minutosHastaAtencion} sub="Creación → inicio atención" />
        <MetricCard icon="mdi:head-cog-outline" label="Atención activa" minutos={m.minutosAtencionActiva} sub="Inicio atención → cierre" />
        <MetricCard icon="mdi:check-decagram" label="Total solución hábil" minutos={m.minutosTotalSolucion} sub="Tiempo real laborado" highlight />
      </Stack>

      {desfase && <EmpresaDesfaseCard desfase={desfase} />}

      {milestones.length > 0 && (
        <SectionCard title="Análisis del ticket" icon="mdi:chart-timeline-variant">
          <TicketAnalysisTimeline
            milestones={milestones}
            resumen={[
              { label: "Hasta atención", value: formatMinutos(m.minutosHastaAtencion) },
              { label: "Atención activa", value: formatMinutos(m.minutosAtencionActiva) },
              { label: "Total hábil", value: formatMinutos(m.minutosTotalSolucion), highlight: true },
            ]}
          />
        </SectionCard>
      )}

      <TicketMetricsEvidencias items={evidencias} />
    </Box>
  );
}

function TicketMetricsDocumentLoader({ project, iticket, reloadKey }) {
  const { useState, useEffect } = getReact();
  const { Loading, ErrorBox } = UI;
  const [state, setState] = useState({ loading: true, error: null, tk: null });

  useEffect(() => {
    let alive = true;
    setState({ loading: true, error: null, tk: null });
    getTicket(project, iticket)
      .then((d) => { if (alive) setState({ loading: false, error: null, tk: d.ticket || d }); })
      .catch((e) => { if (alive) setState({ loading: false, error: e instanceof Error ? e.message : String(e), tk: null }); });
    return () => { alive = false; };
  }, [project, iticket, reloadKey]);

  if (state.loading) return Loading ? <Loading label="Generando línea de tiempo…" /> : null;
  if (state.error) return ErrorBox ? <ErrorBox message={state.error} /> : null;
  return <TicketMetricsDocument tk={state.tk || {}} iticket={iticket} project={project} />;
}

export function TicketMetricsView(props) {
  const c = useDocColors();
  const { useState, useEffect, useMemo } = getReact();
  const {
    Box, Typography, Alert, Paper, Chip, TextField, InputAdornment, Stack, MenuItem, FormControl, InputLabel, Select,
  } = getMaterialUI();
  const { Loading, ErrorBox, Icon } = UI;
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(() => {
    if (typeof boot.sel === "string" && boot.sel) return boot.sel;
    return null;
  });
  const [query, setQuery] = useState("");
  const [tipoFilter, setTipoFilter] = useState("");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    const spaces = spacesFor(props.project);
    Promise.all(
      spaces.map((s) =>
        getTickets(s)
          .then((d) => {
            const list = (d && !Array.isArray(d) && (d.rows || d.tickets || d.items)) || (Array.isArray(d) ? d : []);
            return list.filter((t) => String(t.space || s).toLowerCase() === s);
          })
          .catch(() => null),
      ),
    )
      .then((lists) => {
        if (!alive) return;
        if (lists.every((l) => l === null)) {
          setError("No se pudo cargar los tickets.");
          setRows([]);
        } else {
          setRows(lists.filter(Boolean).flat());
        }
      })
      .catch((e) => { if (alive) setError(e instanceof Error ? e.message : String(e)); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [props.project, props.reloadKey]);

  const summary = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows
      .map((t) => {
        const id = ticketId(t);
        const m = computeFromTicket(t);
        const tipoApertura = extractTipoSolicitudApertura(t);
        const tkSpace = reportProject(t, props.project);
        const desfaseEmp = computeEmpresaDesfase(m, extractEmpresaReport(t, tkSpace));
        return {
          id,
          tkSpace,
          titulo: t.titulo || t.title || "",
          m,
          tipoApertura,
          incomplete: !m.fechaCreacion || !m.fechaCierre,
          desfaseEmpresa: desfaseEmp?.tieneDesfase ?? false,
          reporteEmpresa: !!desfaseEmp,
        };
      })
      .filter((row) => {
        if (tipoFilter && row.tipoApertura !== tipoFilter) return false;
        return !q || row.id.toLowerCase().includes(q) || row.titulo.toLowerCase().includes(q) || q.replace(/\D/g, "") === row.id.replace(/\D/g, "");
      })
      .sort((a, b) => String(b.m.fechaCreacion || "").localeCompare(String(a.m.fechaCreacion || "")));
  }, [rows, query, tipoFilter, props.project]);

  const tipoOptions = useMemo(() => {
    const set = new Set();
    rows.forEach((t) => {
      const v = extractTipoSolicitudApertura(t);
      if (v) set.add(v);
    });
    return [...set].sort((a, b) => String(a).localeCompare(String(b), "es"));
  }, [rows]);

  const comparativo = useMemo(
    () => buildComparativoReport(rows, props.project),
    [rows, props.project],
  );

  useEffect(() => {
    if (!summary.length && !comparativo.totalIncluidos) return;
    if (selected === REPORTE_GENERAL_ID) return;
    const still = selected && summary.some((r) => r.id === selected);
    if (!still) {
      if (comparativo.totalIncluidos > 0) {
        setSelected(REPORTE_GENERAL_ID);
      } else {
        const prefer = isGeneralProject(props.project)
          ? summary[0]
          : summary.find((r) => r.id === (props.project === "patyia" ? "TK-1429262" : "TK-1420742")) || summary[0];
        if (prefer) setSelected(prefer.id);
      }
    }
  }, [summary, selected, comparativo.totalIncluidos, props.project]);

  useEffect(() => {
    if (selected) merge({ sel: selected });
  }, [selected]);

  const selectedRow = useMemo(
    () => summary.find((r) => r.id === selected),
    [summary, selected],
  );

  const detailProject = selectedRow?.tkSpace
    ?? (isGeneralProject(props.project) ? "clientesis" : props.project);

  const showReport = selected === REPORTE_GENERAL_ID;

  if (loading) return Loading ? <Loading label="Cargando tickets…" /> : null;
  if (error) return ErrorBox ? <ErrorBox message={error} /> : <Alert severity="error">{error}</Alert>;

  return (
    <Box sx={{ display: "flex", height: "100%", minHeight: 0, bgcolor: c.pageBg, color: c.text }}>
      <Box
        sx={{
          width: 280,
          flexShrink: 0,
          borderRight: 1,
          borderColor: c.border,
          display: "flex",
          flexDirection: "column",
          bgcolor: c.cardBg,
          color: c.text,
        }}
      >
        <Box sx={{ p: 1.5, borderBottom: 1, borderColor: c.border }}>
          <Typography variant="subtitle2" sx={{ mb: 0.5, color: c.text, fontWeight: 600 }}>
            Tickets · {projectLabel(props.project)}
          </Typography>
          <TextField
            size="small"
            fullWidth
            placeholder="Buscar 1420742…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            sx={{
              "& .MuiInputBase-input": { color: c.text },
              "& .MuiOutlinedInput-notchedOutline": { borderColor: c.border },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Icon icon="mdi:magnify" size={18} />
                </InputAdornment>
              ),
            }}
          />
          {tipoOptions.length > 0 && (
            <FormControl size="small" fullWidth sx={{ mt: 1 }}>
              <InputLabel id="tipo-apertura-label">Tipo apertura</InputLabel>
              <Select
                labelId="tipo-apertura-label"
                label="Tipo apertura"
                value={tipoFilter}
                onChange={(e) => setTipoFilter(e.target.value)}
                sx={{
                  "& .MuiSelect-select": { color: c.text },
                  "& .MuiOutlinedInput-notchedOutline": { borderColor: c.border },
                }}
              >
                <MenuItem value="">Todos</MenuItem>
                {tipoOptions.map((tipo) => (
                  <MenuItem key={tipo} value={tipo}>{tipoSolicitudChipLabel(tipo)}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>
        <Box sx={{ flex: 1, overflow: "auto", p: 1 }}>
          <Paper
            variant="outlined"
            onClick={() => setSelected(REPORTE_GENERAL_ID)}
            sx={{
              p: 1.25,
              mb: 1.5,
              cursor: "pointer",
              ...cardSx(c, {
                borderColor: showReport ? "#1e90ff" : c.border,
                bgcolor: showReport ? c.cardHi : c.cardBg,
                borderWidth: showReport ? 2 : 1,
              }),
            }}
          >
            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 0.5 }}>
              <Icon icon="mdi:chart-bar" size={18} />
              <Chip size="small" label="Reporte general" color={showReport ? "primary" : "default"} />
              {comparativo.totalIncluidos > 0 && (
                <Chip size="small" label={`${comparativo.totalIncluidos} en Excel`} variant="outlined" />
              )}
            </Stack>
            <Typography variant="body2" sx={{ color: c.muted, lineHeight: 1.4, fontSize: "0.8125rem" }}>
              Empresa vs hábil · desfases y promedios
            </Typography>
          </Paper>
          {!summary.length ? (
            <Alert severity="info" sx={{ m: 0.5 }}>
              {rows.length ? "Sin coincidencias." : "Sin tickets en PatyIA ni Clientes."}
            </Alert>
          ) : (
            summary.map((row) => {
              const sel = selected === row.id;
              return (
                <Paper
                  key={row.id}
                  variant="outlined"
                  onClick={() => setSelected(row.id)}
                  sx={{
                    p: 1.25,
                    mb: 1,
                    cursor: "pointer",
                    ...cardSx(c, {
                      borderColor: sel ? "#1e90ff" : c.border,
                      bgcolor: sel ? c.cardHi : c.cardBg,
                    }),
                    opacity: row.incomplete ? 0.6 : 1,
                  }}
                >
                  <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 0.5 }} flexWrap="wrap" useFlexGap>
                    <Chip size="small" label={row.id} color={sel ? "primary" : "default"} />
                    {row.tipoApertura && (
                      <Chip
                        size="small"
                        variant="outlined"
                        label={tipoSolicitudChipLabel(row.tipoApertura)}
                        title={row.tipoApertura}
                        sx={{
                          maxWidth: "100%",
                          "& .MuiChip-label": { overflow: "hidden", textOverflow: "ellipsis" },
                        }}
                      />
                    )}
                    {row.incomplete && <Chip size="small" label="inc." variant="outlined" color="warning" title="Incompleto" />}
                    {row.desfaseEmpresa && (
                      <Chip size="small" label="des." color="error" variant="outlined" title="Desfase empresa" />
                    )}
                    {!row.desfaseEmpresa && row.reporteEmpresa && (
                      <Chip size="small" label="empresa" variant="outlined" color="default" />
                    )}
                  </Stack>
                  <Typography variant="body2" title={row.titulo} sx={{ fontWeight: sel ? 600 : 400, lineHeight: 1.45, color: c.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {row.titulo}
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: "0.8125rem", mt: 0.25, color: c.muted }}>
                    {formatMinutos(row.m.minutosTotalSolucion)} hábil
                  </Typography>
                </Paper>
              );
            })
          )}
        </Box>
      </Box>

      <Box sx={{ flex: 1, minWidth: 0, overflow: "auto", bgcolor: c.pageBg }}>
        {showReport ? (
          <EmpresaComparativoReport tickets={rows} project={props.project} />
        ) : selected ? (
          <TicketMetricsDocumentLoader
            project={detailProject}
            iticket={selected}
            reloadKey={props.reloadKey}
          />
        ) : (
          <Typography sx={{ p: 4, textAlign: "center", color: c.muted }}>
            Selecciona el reporte general o un ticket en la lista.
          </Typography>
        )}
      </Box>
    </Box>
  );
}
