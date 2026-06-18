/* Galería de pantallazos / evidencias (MUI ImageList + lightbox). */
import { getReact, getMaterialUI } from "../core/platform.ts";
import { useGlassColors, glassCardSx } from "./glassSurface.ts";
import { LightboxImage } from "./ImageLightbox.jsx";
import { TK_DOC_RADIUS } from "../core/tk-table.ts";

const ROW_HEIGHT = 164;
const GRID_GAP = 8;

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
    title: "Evidencias de tiempo",
    subtitle: "Pantallazos InSoft de apertura, atención, cierre, entrega y métricas del ticket.",
  },
  doc: {},
};

export function TicketMetricsEvidencias({ items, variant = "metricas", embedded = false }) {
  const { useMemo } = getReact();
  const c = useGlassColors();
  const mui = getMaterialUI();
  const { Box, Paper, Typography, ImageList, ImageListItem } = mui;
  const visible = useLoadedEvidencias(items);
  const copy = EVIDENCIAS_COPY[variant] || EVIDENCIAS_COPY.metricas;

  const gallery = useMemo(
    () => visible.map((ev) => ({ src: ev.url, alt: ev.label || "Evidencia" })),
    [visible],
  );

  if (!visible.length) return null;

  if (!ImageList || !ImageListItem) return null;

  const galleryEl = (
    <Box className="tk-evidencias-image-list">
      <ImageList
        sx={{
          width: "100%",
          m: 0,
          gridTemplateColumns: {
            xs: "repeat(2, 1fr) !important",
            sm: "repeat(3, 1fr) !important",
            md: "repeat(4, 1fr) !important",
          },
        }}
        cols={3}
        rowHeight={ROW_HEIGHT}
        gap={GRID_GAP}
      >
        {visible.map((ev, index) => (
          <ImageListItem
            key={ev.url}
            sx={{
              borderRadius: 1,
              overflow: "hidden",
              bgcolor: "action.hover",
            }}
          >
            <LightboxImage
              variant="grid"
              src={ev.url}
              alt={ev.label || "Evidencia"}
              gallery={gallery}
              startIndex={index}
            />
          </ImageListItem>
        ))}
      </ImageList>
    </Box>
  );

  if (embedded) return galleryEl;

  return (
    <Paper variant="outlined" sx={glassCardSx(c, { p: 2.5, mb: 2, borderRadius: TK_DOC_RADIUS })}>
      {copy.title && (
        <Typography variant="h6" sx={{ fontWeight: 600, color: c.text, mb: copy.subtitle ? 0.5 : 2 }}>
          {copy.title}
        </Typography>
      )}
      {copy.subtitle && (
        <Typography variant="body2" sx={{ color: c.muted, mb: 2, fontSize: "0.9rem" }}>
          {copy.subtitle}
        </Typography>
      )}
      {galleryEl}
    </Paper>
  );
}
