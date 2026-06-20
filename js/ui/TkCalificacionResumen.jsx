/* Resumen por TK — estimado / registrado / desfase vs sistema de calificación. */
import { getMaterialUI } from "../core/platform.ts";
import { UI } from "../core/platform.ts";
import {
  calificacionEstadoLabel,
  evaluateTkCalificacion,
} from "../core/tk-calificacion.ts";
import { computeFromTicket } from "../core/tk-metrics.ts";
import { useGlassColors, glassCardGradientSx, glassInnerSx } from "./glassSurface.ts";
import { tkToolbarSoftChipSx, TK_DOC_RADIUS } from "../core/tk-table.ts";

function estadoTone(estado) {
  if (estado === "cumple" || estado === "no_aplica") return "success";
  if (estado === "no_cumple") return "danger";
  return "secondary";
}

function ResumenChip({ estado }) {
  const { Chip } = getMaterialUI();
  const tone = estadoTone(estado);
  const label = calificacionEstadoLabel(estado);

  return (
    <Chip
      size="small"
      label={label}
      sx={(t) => ({
        height: 24,
        fontWeight: 700,
        fontSize: "0.72rem",
        borderRadius: TK_DOC_RADIUS,
        border: "1px solid",
        ...tkToolbarSoftChipSx(tone, t),
      })}
    />
  );
}

function FilaKpi({ fila, colors: c }) {
  const { Box, Typography, Stack } = getMaterialUI();

  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 1.5,
        border: 1,
        borderColor: fila.estado === "no_cumple" ? "rgba(239,68,68,0.45)" : c.border,
        ...glassInnerSx(c, fila.estado === "no_cumple" ? "err" : fila.estado === "cumple" ? "hi" : "node"),
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1} sx={{ mb: 1 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", color: c.text }}>
            {fila.label}
            <Typography component="span" sx={{ ml: 0.75, fontWeight: 500, fontSize: "0.75rem", color: c.muted }}>
              ({fila.peso}%)
            </Typography>
          </Typography>
          <Typography variant="caption" sx={{ color: c.muted, display: "block", mt: 0.25 }}>
            Meta: {fila.meta}
          </Typography>
        </Box>
        <ResumenChip estado={fila.estado} />
      </Stack>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={{ xs: 0.75, sm: 2 }}
        sx={{ mb: 0.75 }}
      >
        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" sx={{ color: c.muted, display: "block", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: 0.3 }}>
            Estimado / meta
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600, color: c.text, fontFamily: "Consolas, Menlo, monospace" }}>
            {fila.estimado}
          </Typography>
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" sx={{ color: c.muted, display: "block", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: 0.3 }}>
            Registrado
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600, color: c.text, fontFamily: "Consolas, Menlo, monospace" }}>
            {fila.registrado}
          </Typography>
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" sx={{ color: c.muted, display: "block", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: 0.3 }}>
            Desfase
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 700,
              fontFamily: "Consolas, Menlo, monospace",
              color:
                fila.desfaseMinutos != null && fila.desfaseMinutos > 0
                  ? "#b91c1c"
                  : fila.desfaseMinutos != null && fila.desfaseMinutos < 0
                    ? "#047857"
                    : c.text,
            }}
          >
            {fila.desfase}
          </Typography>
        </Box>
      </Stack>

      <Typography variant="caption" sx={{ color: c.muted, lineHeight: 1.45 }}>
        {fila.detalle}
      </Typography>
    </Box>
  );
}

export function TkCalificacionResumen({ tk }) {
  const c = useGlassColors();
  const { Paper, Typography, Stack, Alert } = getMaterialUI();
  const { Icon } = UI;
  const metrics = computeFromTicket(tk);
  const evaluacion = evaluateTkCalificacion(tk, metrics);

  const globalTone =
    evaluacion.cumpleGlobal === true ? "success" : evaluacion.cumpleGlobal === false ? "error" : "warning";
  const globalIcon =
    evaluacion.cumpleGlobal === true
      ? "mdi:check-decagram"
      : evaluacion.cumpleGlobal === false
        ? "mdi:close-circle-outline"
        : "mdi:clock-alert-outline";

  return (
    <Paper
      variant="outlined"
      sx={glassCardGradientSx(c, {
        p: 2.5,
        mb: 3,
        tone: evaluacion.cumpleGlobal === false ? "err" : evaluacion.cumpleGlobal === true ? "hi" : "default",
      })}
    >
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
        <Icon icon="mdi:gauge" size={22} />
        <Typography sx={{ fontWeight: 700, fontSize: "1.05rem", flex: 1 }}>
          Calificación de este TK
        </Typography>
      </Stack>

      <Alert severity={globalTone} icon={<Icon icon={globalIcon} size={20} />} sx={{ mb: 2 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {evaluacion.resumenTexto}
        </Typography>
        {evaluacion.tipoApertura && (
          <Typography variant="caption" sx={{ display: "block", mt: 0.5, opacity: 0.9 }}>
            Tipo apertura: {evaluacion.tipoApertura}
          </Typography>
        )}
      </Alert>

      <Stack spacing={1.25}>
        {evaluacion.filas.map((fila) => (
          <FilaKpi key={fila.key} fila={fila} colors={c} />
        ))}
      </Stack>
    </Paper>
  );
}
