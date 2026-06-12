/* Galería de pantallazos InSoft (evidencias R2). */
import { getMaterialUI } from "../core/runtime.ts";

function useColors() {
  const { useTheme } = getMaterialUI();
  const dark = useTheme().palette.mode === "dark";
  return {
    cardBg: dark ? "#132f4c" : "#ffffff",
    border: dark ? "rgba(158,197,235,0.3)" : "rgba(10,37,64,0.12)",
    text: dark ? "#e8f4ff" : "#0a2540",
    muted: dark ? "#9ec5eb" : "#4a6278",
  };
}

export function TicketMetricsEvidencias({ items }) {
  const c = useColors();
  const { Box, Paper, Typography, Stack } = getMaterialUI();

  if (!items?.length) return null;

  return (
    <Paper variant="outlined" sx={{ p: 2.5, mb: 2, bgcolor: c.cardBg, borderColor: c.border }}>
      <Typography variant="h6" sx={{ fontWeight: 600, color: c.text, mb: 0.5 }}>
        Evidencias
      </Typography>
      <Typography variant="body2" sx={{ color: c.muted, mb: 2, fontSize: "0.9rem" }}>
        Pantallazos InSoft y soporte visual del ticket.
      </Typography>
      <Stack spacing={2}>
        {items.map((ev) => (
          <Box key={ev.url}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: c.text, mb: 0.75 }}>
              {ev.label}
            </Typography>
            <Box
              component="a"
              href={ev.url}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ display: "block", textDecoration: "none" }}
            >
              <Box
                component="img"
                src={ev.url}
                alt={ev.label}
                loading="lazy"
                sx={{
                  width: "100%",
                  maxWidth: 860,
                  height: "auto",
                  display: "block",
                  borderRadius: 1.5,
                  border: 1,
                  borderColor: c.border,
                  bgcolor: c.cardBg,
                }}
              />
            </Box>
          </Box>
        ))}
      </Stack>
    </Paper>
  );
}
