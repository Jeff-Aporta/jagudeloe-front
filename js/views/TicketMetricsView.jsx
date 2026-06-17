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
import { extractTicketMetricasEvidencias } from "../core/tk-evidencias.ts";
import { buildTicketTimeline, buildTicketMilestones } from "../core/tk-timeline.ts";
import { extractEmpresaReport, computeEmpresaDesfase } from "../core/tk-empresa-report.ts";
import { extractTicketPendingTasks } from "../core/checks.ts";
import { TicketAnalysisTimeline } from "../ui/TicketAnalysisTimeline.jsx";
import { TicketMetricsEvidencias } from "../ui/TicketMetricsEvidencias.jsx";
import { EmpresaDesfaseCard } from "../ui/EmpresaDesfaseCard.jsx";
import { useGlassColors, glassCardGradientSx, glassInnerSx, glassGradient } from "../ui/glassSurface.ts";

function useDocColors() {
  return useGlassColors();
}

function cardSx(c, extra = {}) {
  return glassCardGradientSx(c, extra);
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

function metricKpiStripShadow(c) {
  const dark = String(c.cardBg).includes("15, 34, 54");
  return dark
    ? "0 8px 32px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,255,255,0.06)"
    : "0 4px 20px rgba(15,23,42,0.04), inset 0 1px 0 rgba(255,255,255,0.92)";
}

/** Tres KPI en una sola franja: mismo degradado, sin líneas verticales; el del centro sin redondeo. */
function MetricKpiStrip({ items }) {
  const c = useDocColors();
  const { Box, Typography, Stack } = getMaterialUI();
  const { Icon } = UI;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        mb: 3,
        borderRadius: 2,
        overflow: "hidden",
        border: 1,
        borderColor: c.border,
        background: glassGradient(c, "hi"),
        backgroundColor: "transparent",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        boxShadow: metricKpiStripShadow(c),
      }}
    >
      {items.map((item) => {
        const decimal = formatHorasDecimal(item.minutos);
        return (
          <Box
            key={item.label}
            sx={{
              flex: "1 1 0",
              minWidth: { sm: 0 },
              p: 2,
              borderRadius: 0,
              background: "transparent",
              boxShadow: "none",
              border: "none",
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
              {item.icon && <Icon icon={item.icon} size={18} />}
              <Typography variant="body2" sx={{ color: c.muted, fontWeight: 500 }}>{item.label}</Typography>
            </Stack>
            <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2, color: c.text }}>
              {formatMinutos(item.minutos)}
              {decimal != null && (
                <Typography
                  component="span"
                  sx={{ ml: 0.75, fontWeight: 500, fontSize: "0.82em", color: c.muted, opacity: 0.72 }}
                >
                  ({decimal})
                </Typography>
              )}
            </Typography>
            {item.sub && (
              <Typography variant="body2" sx={{ color: c.muted, mt: 0.5, lineHeight: 1.45 }}>{item.sub}</Typography>
            )}
          </Box>
        );
      })}
    </Box>
  );
}

function SectionCard({ title, icon, children }) {
  const c = useDocColors();
  const { Paper, Stack } = getMaterialUI();
  const { Icon } = UI;
  return (
    <Paper variant="outlined" sx={{ p: 2.5, mb: 2, ...cardSx(c, { tone: "default" }) }}>
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
  const evidencias = extractTicketMetricasEvidencias(tk);
  const tareasPendientes = extractTicketPendingTasks(tk).filter((t) => !t.done);
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

      {tareasPendientes.length > 0 && (
        <Alert severity="warning" icon={<UI.Icon icon="mdi:alert-circle-outline" />} sx={{ mb: 3 }}>
          <DocText bold sx={{ mb: 0.75 }}>Tareas pendientes</DocText>
          <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
            {tareasPendientes.map((t) => (
              <Box component="li" key={t.texto} sx={{ mb: 0.35 }}>
                <DocText variant="body2">{t.texto}</DocText>
              </Box>
            ))}
          </Box>
        </Alert>
      )}

      <MetricKpiStrip
        items={[
          {
            icon: "mdi:clock-start",
            label: "Hasta atención",
            minutos: m.minutosHastaAtencion,
            sub: "Creación → inicio atención",
          },
          {
            icon: "mdi:head-cog-outline",
            label: "Atención activa",
            minutos: m.minutosAtencionActiva,
            sub: "Inicio atención → cierre",
          },
          {
            icon: "mdi:check-decagram",
            label: "Total solución hábil",
            minutos: m.minutosTotalSolucion,
            sub: "Tiempo real laborado",
          },
        ]}
      />

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

      <TicketMetricsEvidencias items={evidencias} galleryId={`tk-${iticket}`} variant="metricas" />
    </Box>
  );
}
