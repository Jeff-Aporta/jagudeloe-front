import { getReact, getMaterialUI } from "../core/runtime.ts";
import {
  chartSpecFromPayload,
  renderChartSvg,
  chartThemeDark,
  chartThemeLight,
} from "../core/tk-chart.ts";

const { useMemo } = getReact();

export function TkDocChart({ payload }) {
  const { Box, Typography, useTheme } = getMaterialUI();
  const theme = useTheme();
  const dark = theme.palette.mode === "dark";

  const spec = useMemo(() => chartSpecFromPayload(payload ?? {}), [payload]);
  const svg = useMemo(() => {
    if (!spec) return "";
    return renderChartSvg(spec, dark ? chartThemeDark() : chartThemeLight());
  }, [spec, dark]);

  if (!spec) {
    return (
      <Typography variant="body2" color="text.secondary">
        Gráfico no disponible (payload inválido).
      </Typography>
    );
  }

  const caption = payload?.caption ?? payload?.note ?? "";

  return (
    <Box className="tk-doc-chart" sx={{ my: 0.5 }}>
      <Box
        sx={{
          borderRadius: 2,
          overflow: "hidden",
          border: 1,
          borderColor: "divider",
          bgcolor: (t) => (t.palette.mode === "dark" ? "rgba(15,23,42,0.45)" : "#fff"),
          boxShadow: (t) => (t.palette.mode === "dark" ? "none" : "0 4px 24px rgba(15,23,42,0.06)"),
          p: { xs: 1, sm: 1.5 },
        }}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      {caption && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
          {String(caption)}
        </Typography>
      )}
    </Box>
  );
}
