/* Lightbox para pantallazos / evidencias del ticket. */
import { getReact, getMaterialUI } from "../core/runtime.ts";
import { UI } from "../core/platform.ts";

const thumbSx = {
  width: "100%",
  maxWidth: 860,
  height: "auto",
  display: "block",
  borderRadius: 1.5,
  border: 1,
  borderColor: "divider",
  cursor: "zoom-in",
  transition: "box-shadow 0.2s ease, transform 0.15s ease",
  "&:hover": {
    boxShadow: (t) => (t.palette.mode === "dark" ? "0 8px 28px rgba(0,0,0,0.45)" : "0 12px 36px rgba(15,23,42,0.14)"),
    transform: "scale(1.005)",
  },
};

function navBtnSx(side) {
  return {
    position: "absolute",
    top: "50%",
    [side]: { xs: 4, sm: 12 },
    transform: "translateY(-50%)",
    bgcolor: "rgba(0,0,0,0.55)",
    color: "#fff",
    "&:hover": { bgcolor: "rgba(0,0,0,0.75)" },
    zIndex: 2,
  };
}

/**
 * @param {{ src: string, alt?: string, caption?: string, sx?: object, gallery?: { src: string, alt?: string, caption?: string }[], startIndex?: number }} props
 */
export function LightboxImage({ src, alt = "", caption, sx, gallery, startIndex = 0 }) {
  const { useState, useEffect, useCallback, useMemo } = getReact();
  const { Box, Dialog, IconButton, Typography } = getMaterialUI();
  const { Icon } = UI;

  const slides = useMemo(() => {
    if (Array.isArray(gallery) && gallery.length) return gallery;
    return [{ src, alt, caption }];
  }, [gallery, src, alt, caption]);

  const initial = useMemo(() => {
    if (!Array.isArray(gallery) || !gallery.length) return 0;
    const i = gallery.findIndex((g) => g.src === src);
    return i >= 0 ? i : startIndex;
  }, [gallery, src, startIndex]);

  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(initial);

  useEffect(() => {
    if (!open) setIndex(initial);
  }, [initial, open]);

  const current = slides[index] || slides[0];
  const hasNav = slides.length > 1;

  const goPrev = useCallback(() => {
    setIndex((i) => (i - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const goNext = useCallback(() => {
    setIndex((i) => (i + 1) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowLeft" && hasNav) goPrev();
      if (e.key === "ArrowRight" && hasNav) goNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, hasNav, goPrev, goNext]);

  return (
    <>
      <Box
        role="button"
        tabIndex={0}
        aria-label={`Ampliar imagen: ${alt || caption || "evidencia"}`}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        sx={{ display: "block", outline: "none", "&:focus-visible img": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: 2 } }}
      >
        <Box component="img" src={src} alt={alt} loading="lazy" sx={{ ...thumbSx, ...sx }} />
      </Box>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth={false}
        PaperProps={{
          sx: {
            m: { xs: 1, sm: 2 },
            maxWidth: "min(96vw, 1200px)",
            width: "100%",
            bgcolor: "transparent",
            boxShadow: "none",
            overflow: "visible",
          },
        }}
        slotProps={{
          backdrop: {
            sx: {
              bgcolor: "rgba(0,0,0,0.88)",
              backdropFilter: "blur(4px)",
            },
          },
        }}
      >
        <Box sx={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <IconButton
            aria-label="Cerrar"
            onClick={() => setOpen(false)}
            sx={{
              position: "absolute",
              top: { xs: -40, sm: -44 },
              right: 0,
              bgcolor: "rgba(255,255,255,0.12)",
              color: "#fff",
              "&:hover": { bgcolor: "rgba(255,255,255,0.22)" },
            }}
          >
            <Icon icon="mdi:close" size={22} />
          </IconButton>

          {hasNav && (
            <>
              <IconButton aria-label="Anterior" onClick={goPrev} sx={navBtnSx("left")}>
                <Icon icon="mdi:chevron-left" size={28} />
              </IconButton>
              <IconButton aria-label="Siguiente" onClick={goNext} sx={navBtnSx("right")}>
                <Icon icon="mdi:chevron-right" size={28} />
              </IconButton>
            </>
          )}

          <Box
            component="img"
            src={current?.src}
            alt={current?.alt ?? ""}
            sx={{
              display: "block",
              maxWidth: "100%",
              maxHeight: "min(82vh, 900px)",
              width: "auto",
              height: "auto",
              borderRadius: 1.5,
              boxShadow: "0 24px 80px rgba(0,0,0,0.55)",
            }}
          />

          {(current?.caption || hasNav) && (
            <Box sx={{ mt: 1.5, px: 1, textAlign: "center", maxWidth: 900 }}>
              {current?.caption && (
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.92)", lineHeight: 1.5 }}>
                  {current.caption}
                </Typography>
              )}
              {hasNav && (
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.55)", display: "block", mt: 0.5 }}>
                  {index + 1} / {slides.length}
                </Typography>
              )}
            </Box>
          )}
        </Box>
      </Dialog>
    </>
  );
}
