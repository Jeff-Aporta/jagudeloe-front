/* views/TicketMetricsView — documento de métricas por ticket (JSX inline). */
import { getReact, getMaterialUI } from "../core/runtime.ts";
import { UI } from "../core/platform.ts";
import {
  computeFromTicket,
  extractMetricInput,
  formatMinutos,
  formatHorasDecimal,
} from "../core/tk-metrics.ts";
import { extractTipoSolicitudApertura } from "../core/tk-normativa.ts";
import { extractTicketEvidencias } from "../core/tk-evidencias.ts";
import { buildTicketTimeline, buildTicketMilestones } from "../core/tk-timeline.ts";
import { extractEmpresaReport, computeEmpresaDesfase } from "../core/tk-empresa-report.ts";
import { TicketAnalysisTimeline } from "../ui/TicketAnalysisTimeline.jsx";
import { TicketMetricsEvidencias } from "../ui/TicketMetricsEvidencias.jsx";
import { EmpresaDesfaseCard } from "../ui/EmpresaDesfaseCard.jsx";

/** Colores explícitos — evita texto blanco sobre fondo blanco cuando sx no resuelve el palette. */
function useDocColors() {
  const { useTheme } = getMaterialUI();
  const dark = useTheme().palette.mode === "dark";
  return {
    pageBg: "transparent",
    cardBg: dark ? "rgba(15, 34, 54, 0.78)" : "rgba(255, 255, 255, 0.92)",
    cardHi: dark ? "rgba(26, 58, 92, 0.85)" : "rgba(240, 247, 255, 0.95)",
    border: dark ? "rgba(30,144,255,0.28)" : "rgba(30,144,255,0.16)",
    text: dark ? "#e8f4ff" : "#0a2540",
    muted: dark ? "#9ec5eb" : "#4a6278",
    preBg: dark ? "rgba(13, 33, 55, 0.9)" : "#e8eef5",
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

export function TicketMetricsDocument({ tk, iticket, project }) {
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
