/* Card de desfase: reporte empresa vs tiempo hábil real. */
import { getMaterialUI } from "../core/runtime.ts";
import { UI } from "../core/platform.ts";
import {
  formatDesfaseHoras,
  formatEmpresaHoras,
  formatHabilConDecimal,
} from "../core/tk-empresa-report.ts";

function useColors() {
  const { useTheme } = getMaterialUI();
  const dark = useTheme().palette.mode === "dark";
  return {
    errBg: dark ? "rgba(211,47,47,0.12)" : "rgba(211,47,47,0.08)",
    errBorder: dark ? "rgba(244,67,54,0.55)" : "#d32f2f",
    errText: dark ? "#ff8a80" : "#b71c1c",
    warnBg: dark ? "rgba(237,108,2,0.12)" : "rgba(237,108,2,0.08)",
    warnBorder: dark ? "rgba(255,152,0,0.5)" : "#ed6c02",
    text: dark ? "#e8f4ff" : "#0a2540",
    muted: dark ? "#9ec5eb" : "#4a6278",
  };
}

function DesfaseRow({ row, colors: c }) {
  const { Box, Typography, Stack } = getMaterialUI();
  const inflado = row.desfaseHoras != null && row.desfaseHoras > 0;

  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 1,
        border: 1,
        borderColor: row.pendienteHitos ? c.warnBorder : inflado ? c.errBorder : "rgba(158,197,235,0.25)",
        bgcolor: row.pendienteHitos ? c.warnBg : inflado ? "rgba(211,47,47,0.06)" : "transparent",
      }}
    >
      <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", color: c.text, mb: 0.75 }}>{row.label}</Typography>
      <Stack spacing={0.5}>
        <Typography variant="body2" sx={{ color: c.muted }}>
          Empresa reporta:{" "}
          <Typography component="span" sx={{ fontWeight: 700, color: c.text }}>
            {formatEmpresaHoras(row.empresaHoras)}
          </Typography>
        </Typography>
        {row.pendienteHitos ? (
          <Typography variant="body2" sx={{ color: c.muted, fontStyle: "italic" }}>
            Tiempo hábil: pendiente — faltan hitos (creación / inicio atención / cierre).
          </Typography>
        ) : (
          <Typography variant="body2" sx={{ color: c.muted }}>
            Tiempo hábil real:{" "}
            <Typography component="span" sx={{ fontWeight: 700, color: c.text }}>
              {formatHabilConDecimal(row.habilMinutos)}
            </Typography>
          </Typography>
        )}
        {row.desfaseHoras != null && Math.abs(row.desfaseHoras) >= 0.25 && (
          <Typography
            variant="body2"
            sx={{
              fontWeight: 800,
              color: inflado ? c.errText : c.muted,
              mt: 0.25,
            }}
          >
            Desfase: {formatDesfaseHoras(row.desfaseHoras)}
          </Typography>
        )}
      </Stack>
    </Box>
  );
}

export function EmpresaDesfaseCard({ desfase }) {
  const c = useColors();
  const { Paper, Typography, Stack } = getMaterialUI();
  const { Icon } = UI;

  if (!desfase?.rows?.length) return null;

  const isError = desfase.tieneDesfase;
  const isWarn = !isError && desfase.pendienteHitos;

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        mb: 3,
        bgcolor: isError ? c.errBg : isWarn ? c.warnBg : "transparent",
        borderColor: isError ? c.errBorder : isWarn ? c.warnBorder : c.errBorder,
        borderWidth: 2,
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
        <Icon icon={isError ? "mdi:alert-octagon" : "mdi:alert-circle-outline"} size={22} />
        <Typography sx={{ fontWeight: 700, fontSize: "1.05rem", color: isError ? c.errText : c.text }}>
          {isError ? "Desfase reporte empresa" : "Reporte empresa · comparación pendiente"}
        </Typography>
      </Stack>
      <Stack spacing={1.25} sx={{ mt: 0.5 }}>
        {desfase.rows.map((row) => (
          <DesfaseRow key={row.key} row={row} colors={c} />
        ))}
      </Stack>
    </Paper>
  );
}
