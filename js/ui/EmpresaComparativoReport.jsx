/* Reporte general: empresa vs hábil (solo cerrados). */
import { getReact, getMaterialUI } from "../core/platform.ts";
import {
  buildComparativoReport,
  formatDesfaseHoras,
  formatEmpresaHoras,
  formatHabilHorasFromMin,
  formatPctDiff,
} from "../core/tk-empresa-comparativo.ts";
import { TicketAssignmentTimeline } from "./TicketAssignmentTimeline.jsx";
import { projectLabel } from "../core/tk-spaces.ts";
import { useGlassColors, glassCardGradientSx, glassInnerSx } from "./glassSurface.ts";

function useColors() {
  const c = useGlassColors();
  const { useTheme } = getMaterialUI();
  const dark = useTheme().palette.mode === "dark";
  return {
    ...c,
    pos: dark ? "#ff8a80" : "#c62828",
    neg: dark ? "#82b1ff" : "#1565c0",
    barHabil: "#1e90ff",
    barReport: "#ed6c02",
  };
}

function MetricCell({ pair, colors: c }) {
  const { Typography, Stack } = getMaterialUI();
  if (pair.habilHoras == null && pair.reportHoras == null) {
    return <Typography variant="body2" sx={{ color: c.muted }}>—</Typography>;
  }
  const inflado = pair.desfaseHoras != null && pair.desfaseHoras > 0;
  return (
    <Stack spacing={0.25}>
      <Typography variant="body2" sx={{ color: c.text, fontSize: "0.8125rem" }}>
        H: {formatHabilHorasFromMin(pair.habilMinutos)}
      </Typography>
      <Typography variant="body2" sx={{ color: c.muted, fontSize: "0.8125rem" }}>
        R: {formatEmpresaHoras(pair.reportHoras)}
      </Typography>
      {pair.desfaseHoras != null && (
        <Typography
          variant="body2"
          sx={{ fontWeight: 700, fontSize: "0.8125rem", color: inflado ? c.pos : pair.desfaseHoras < 0 ? c.neg : c.muted }}
        >
          Δ {formatDesfaseHoras(pair.desfaseHoras)} · {formatPctDiff(pair.pctDiff)}
        </Typography>
      )}
    </Stack>
  );
}

function DesfaseChart({ rows, colors: c }) {
  const { Box, Typography, Stack } = getMaterialUI();
  if (!rows.length) return null;

  const metrics = [
    { key: "hastaAtencion", label: "T. atención", color: "#1e90ff" },
    { key: "atencionActiva", label: "T. activa", color: "#7b1fa2" },
    { key: "totalSolucion", label: "T. solución", color: "#2e7d32" },
  ];

  const maxAbs = Math.max(
    0.1,
    ...rows.flatMap((r) => metrics.map((m) => Math.abs(r[m.key].desfaseHoras ?? 0))),
  );

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" sx={{ color: c.text, fontWeight: 700, mb: 1.5 }}>
        Desfase por ticket (reportado − hábil)
      </Typography>
      <Stack spacing={1.25}>
        {rows.map((row) => (
          <Box key={row.iticket}>
            <Typography variant="caption" sx={{ color: c.muted, display: "block", mb: 0.5 }}>
              {row.iticket}
            </Typography>
            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ height: 28 }}>
              {metrics.map((m) => {
                const d = row[m.key].desfaseHoras;
                if (d == null) {
                  return (
                    <Box key={m.key} sx={{ flex: 1, height: 8, bgcolor: "rgba(128,128,128,0.15)", borderRadius: 1 }} />
                  );
                }
                const w = `${Math.min(100, (Math.abs(d) / maxAbs) * 100)}%`;
                const bg = d > 0 ? c.pos : d < 0 ? c.neg : c.muted;
                return (
                  <Box
                    key={m.key}
                    title={`${m.label}: ${formatDesfaseHoras(d)}`}
                    sx={{
                      flex: 1,
                      height: 8,
                      borderRadius: 1,
                      bgcolor: "rgba(128,128,128,0.12)",
                      overflow: "hidden",
                      display: "flex",
                      justifyContent: d >= 0 ? "flex-start" : "flex-end",
                    }}
                  >
                    <Box sx={{ width: w, height: "100%", bgcolor: bg, opacity: 0.85 }} />
                  </Box>
                );
              })}
            </Stack>
          </Box>
        ))}
      </Stack>
      <Stack direction="row" spacing={2} sx={{ mt: 1.5 }} flexWrap="wrap" useFlexGap>
        {metrics.map((m) => (
          <Stack key={m.key} direction="row" spacing={0.5} alignItems="center">
            <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: m.color }} />
            <Typography variant="caption" sx={{ color: c.muted }}>{m.label}</Typography>
          </Stack>
        ))}
        <Typography variant="caption" sx={{ color: c.muted }}>Rojo = empresa mayor · Azul = empresa menor</Typography>
      </Stack>
    </Box>
  );
}

function SummaryBlock({ averages, colors: c }) {
  const { Paper, Typography, Stack } = getMaterialUI();
  const blocks = [
    { title: "T. atención (hasta inicio)", data: averages.hastaAtencion },
    { title: "T. atención activa (ini → cierre)", data: averages.atencionActiva },
    { title: "T. solución total (cre → cierre)", data: averages.totalSolucion },
  ];

  return (
    <Paper variant="outlined" sx={glassCardGradientSx(c, { p: 2, mb: 3 })}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: c.text, mb: 1.5 }}>
        Resumen comparativo (promedios)
      </Typography>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} useFlexGap flexWrap="wrap">
        {blocks.map((b) => (
          <Paper
            key={b.title}
            variant="outlined"
            sx={glassCardGradientSx(c, { flex: "1 1 240px", p: 1.5, tone: "hi" })}
          >
            <Typography variant="body2" sx={{ fontWeight: 600, color: c.text, mb: 0.75 }}>{b.title}</Typography>
            <Stack spacing={0.35}>
              <Typography variant="body2" sx={{ color: c.muted }}>
                Hábil prom.: {b.data.habilHoras != null ? `${b.data.habilHoras.toFixed(1)} h` : "—"}
                {b.data.count > 0 && ` (n=${b.data.count})`}
              </Typography>
              <Typography variant="body2" sx={{ color: c.muted }}>
                Reportado prom.: {b.data.reportHoras != null ? `${b.data.reportHoras.toFixed(1)} h` : "—"}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, color: c.text }}>
                Desfase prom.: {formatDesfaseHoras(b.data.desfaseHoras)}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                  color: (b.data.pctDiff ?? 0) > 0 ? c.pos : (b.data.pctDiff ?? 0) < 0 ? c.neg : c.text,
                }}
              >
                Diferencia %: {formatPctDiff(b.data.pctDiff)}
              </Typography>
            </Stack>
          </Paper>
        ))}
      </Stack>
      <Typography variant="body2" sx={{ color: c.muted, mt: 2, lineHeight: 1.5 }}>
        La diferencia porcentual es (reportado − hábil) / hábil × 100. Valor positivo: la empresa contabiliza más horas
        que el tiempo hábil real; negativo: contabiliza menos.
      </Typography>
    </Paper>
  );
}

function avgToPair(avg) {
  return {
    habilMinutos: avg.habilHoras != null ? avg.habilHoras * 60 : null,
    habilHoras: avg.habilHoras,
    reportHoras: avg.reportHoras,
    desfaseHoras: avg.desfaseHoras,
    pctDiff: avg.pctDiff,
  };
}

function ComparativoTable({ rows, averages, colors: c }) {
  const {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography,
  } = getMaterialUI();

  const headSx = {
    fontWeight: 700,
    color: c.text,
    ...glassInnerSx(c, "chip"),
    borderColor: c.border,
  };
  const cellSx = { color: c.text, borderColor: c.border, verticalAlign: "top" };

  const avgRow = (
    <TableRow sx={{ bgcolor: "rgba(30,144,255,0.08)" }}>
      <TableCell colSpan={2} sx={{ ...cellSx, fontWeight: 700 }}>Promedios</TableCell>
      <TableCell sx={cellSx}><MetricCell pair={avgToPair(averages.hastaAtencion)} colors={c} /></TableCell>
      <TableCell sx={cellSx}><MetricCell pair={avgToPair(averages.atencionActiva)} colors={c} /></TableCell>
      <TableCell sx={cellSx}><MetricCell pair={avgToPair(averages.totalSolucion)} colors={c} /></TableCell>
    </TableRow>
  );

  return (
    <TableContainer component={Paper} variant="outlined" sx={glassCardGradientSx(c, { mb: 3 })}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell sx={headSx}>Ticket</TableCell>
            <TableCell sx={headSx}>Asunto</TableCell>
            <TableCell sx={headSx}>T. atención</TableCell>
            <TableCell sx={headSx}>T. activa</TableCell>
            <TableCell sx={headSx}>T. solución</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.iticket} hover>
              <TableCell sx={{ ...cellSx, fontWeight: 600, whiteSpace: "nowrap" }}>{row.iticket}</TableCell>
              <TableCell sx={{ ...cellSx, maxWidth: 200 }}>{row.titulo}</TableCell>
              <TableCell sx={cellSx}><MetricCell pair={row.hastaAtencion} colors={c} /></TableCell>
              <TableCell sx={cellSx}><MetricCell pair={row.atencionActiva} colors={c} /></TableCell>
              <TableCell sx={cellSx}><MetricCell pair={row.totalSolucion} colors={c} /></TableCell>
            </TableRow>
          ))}
          {rows.length > 0 && (
            <>
              <TableRow><TableCell colSpan={5} sx={{ py: 0.5, border: 0 }} /></TableRow>
              {avgRow}
            </>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export function EmpresaComparativoReport({ tickets, project }) {
  const c = useColors();
  const { Box, Typography, Alert } = getMaterialUI();
  const report = buildComparativoReport(tickets, project);

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto", py: 3, px: { xs: 2, md: 3 }, bgcolor: c.pageBg, minHeight: "100%" }}>
      <Typography variant="h5" sx={{ fontWeight: 700, color: c.text, mb: 2 }}>
        Reporte general · Empresa vs hábil · {projectLabel(project)}
      </Typography>

      <TicketAssignmentTimeline tickets={tickets} project={project} />

      {!report.rows.length ? (
        <Alert severity="info">
          No hay tickets con tipo PQR proyecto, PQR Error del sistema o Requerimiento técnico, reporte empresa y hitos
          de solución documentados (creación, inicio de atención y cierre).
        </Alert>
      ) : (
        <>
          <DesfaseChart rows={report.rows} colors={c} />
          <ComparativoTable rows={report.rows} averages={report.averages} colors={c} />
          <SummaryBlock averages={report.averages} colors={c} />
        </>
      )}
    </Box>
  );
}
