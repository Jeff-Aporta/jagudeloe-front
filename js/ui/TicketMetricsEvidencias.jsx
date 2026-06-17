/* Galería de pantallazos InSoft (evidencias R2). */
import { getReact, getMaterialUI } from "../core/runtime.ts";
import { useGlassColors, glassCardSx } from "./glassSurface.ts";
import { LightboxImage } from "./ImageLightbox.jsx";
import { TK_DOC_RADIUS } from "../core/tk-table.ts";

function probeImage(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

/** Solo evidencias cuya URL responde con una imagen válida. */
function useLoadedEvidencias(items) {
  const { useState, useEffect } = getReact();
  const [loaded, setLoaded] = useState([]);

  useEffect(() => {
    if (!items?.length) {
      setLoaded([]);
      return;
    }
    let alive = true;
    setLoaded([]);
    Promise.all(
      items.map(async (ev) => ((await probeImage(ev.url)) ? ev : null)),
    ).then((rows) => {
      if (alive) setLoaded(rows.filter(Boolean));
    });
    return () => { alive = false; };
  }, [items?.map((i) => i.url).join("|") ?? ""]);

  return loaded;
}

export function TicketMetricsEvidencias({ items }) {
  const c = useGlassColors();
  const { Box, Paper, Typography, Stack } = getMaterialUI();
  const visible = useLoadedEvidencias(items);

  if (!visible.length) return null;

  const gallery = visible.map((ev) => ({ src: ev.url, alt: ev.label, caption: ev.label }));

  return (
    <Paper variant="outlined" sx={glassCardSx(c, { p: 2.5, mb: 2, borderRadius: TK_DOC_RADIUS })}>
      <Typography variant="h6" sx={{ fontWeight: 600, color: c.text, mb: 0.5 }}>
        Evidencias
      </Typography>
      <Typography variant="body2" sx={{ color: c.muted, mb: 2, fontSize: "0.9rem" }}>
        Pantallazos InSoft y soporte visual del ticket.
      </Typography>
      <Stack spacing={2}>
        {visible.map((ev) => (
          <Box key={ev.url}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: c.text, mb: 0.75 }}>
              {ev.label}
            </Typography>
            <LightboxImage
              src={ev.url}
              alt={ev.label}
              caption={ev.label}
              gallery={gallery}
              sx={{
                borderColor: c.border,
                bgcolor: c.cardBg,
              }}
            />
          </Box>
        ))}
      </Stack>
    </Paper>
  );
}
