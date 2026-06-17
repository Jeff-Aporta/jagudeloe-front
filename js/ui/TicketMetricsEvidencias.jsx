/* Galería de pantallazos InSoft (evidencias R2). */
import { getReact, getMaterialUI } from "../core/platform.ts";
import { useGlassColors, glassCardSx } from "./glassSurface.ts";
import { getLightboxUi } from "../core/app-manifest.ts";
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

const EVIDENCIAS_COPY = {
  metricas: {
    title: "Evidencias InSoft",
    subtitle: "Pantallazos de apertura, atención, cierre, entrega y métricas del ticket en InSoft.",
  },
  doc: {
    title: "Evidencias",
    subtitle: "Pantallazos, videos e hitos de la diligencia (reuniones, pruebas, entregables).",
  },
};

export function TicketMetricsEvidencias({ items, variant = "metricas" }) {
  const { evidenciasLabelMax } = getLightboxUi();
  const c = useGlassColors();
  const { Box, Paper, Typography, Stack } = getMaterialUI();
  const visible = useLoadedEvidencias(items);
  const copy = EVIDENCIAS_COPY[variant] || EVIDENCIAS_COPY.metricas;

  if (!visible.length) return null;

  const gallery = visible.map((ev) => ({ src: ev.url, alt: ev.label, caption: ev.label }));

  return (
    <Paper variant="outlined" sx={glassCardSx(c, { p: 2.5, mb: 2, borderRadius: TK_DOC_RADIUS })}>
      <Typography variant="h6" sx={{ fontWeight: 600, color: c.text, mb: 0.5 }}>
        {copy.title}
      </Typography>
      <Typography variant="body2" sx={{ color: c.muted, mb: 2, fontSize: "0.9rem" }}>
        {copy.subtitle}
      </Typography>
      <Stack direction="row" flexWrap="wrap" useFlexGap spacing={2} sx={{ justifyContent: "flex-start" }}>
        {visible.map((ev) => (
          <Box
            key={ev.url}
            component="figure"
            sx={{
              m: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 0.5,
              width: evidenciasLabelMax,
            }}
          >
            <LightboxImage src={ev.url} alt={ev.label} caption={ev.label} gallery={gallery} />
            <Typography
              component="figcaption"
              variant="caption"
              sx={{
                color: c.muted,
                fontSize: "0.68rem",
                fontWeight: 400,
                lineHeight: 1.25,
                textAlign: "center",
                opacity: 0.78,
                width: "100%",
              }}
            >
              {ev.label}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Paper>
  );
}
