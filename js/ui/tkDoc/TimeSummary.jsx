import { getMaterialUI } from "../../core/platform.ts";

export function TimeSummary({ tiempos }) {
  const { Box, Stack, Typography, LinearProgress } = getMaterialUI();
  const metaSx = { component: "span", variant: "caption", color: "text.secondary", sx: { fontSize: "0.75rem" } };

  if (!tiempos.length) return null;

  const total = tiempos.reduce((s, t) => s + t.minutos, 0) || 1;

  return (
    <Stack spacing={1.75}>
      {tiempos.map((t) => (
        <Box key={t.name}>
          <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5, lineHeight: 1.45 }}>
            {t.name}
            {t.detail ? (
              <Typography {...metaSx}>
                {" "}({t.detail})
              </Typography>
            ) : null}
            <Typography {...metaSx}>
              {" "}{t.minutos} min
            </Typography>
          </Typography>
          <LinearProgress
            variant="determinate"
            value={Math.min(100, (t.minutos / total) * 100)}
            sx={{
              height: 7,
              borderRadius: 4,
              bgcolor: "action.hover",
              "& .MuiLinearProgress-bar": {
                borderRadius: 4,
                background: "linear-gradient(90deg, #1e90ff, #6366f1)",
              },
            }}
          />
        </Box>
      ))}
      <Typography variant="body2" fontWeight={600} sx={{ pt: 0.5 }}>
        Tiempo invertido por estimación:
        <Typography {...metaSx}>
          {" "}{total} min
        </Typography>
      </Typography>
    </Stack>
  );
}
