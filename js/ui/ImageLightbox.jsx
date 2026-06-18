/* Lightbox para pantallazos / evidencias del ticket. */
import { getReact, getMaterialUI } from "../core/platform.ts";
import { getLightboxUi } from "../core/app-manifest.ts";
import { UI } from "../core/platform.ts";

const ZOOM_MIN = 1;
const ZOOM_MAX = 5;
const ZOOM_STEP = 0.25;
const UI_HIDE_MS = 5000;
const NAV_HIDE_MS = 2000;
const NAV_FADE = "0.75s ease-out";
const PAN_EDGE_BLEED = 30;
const PAN_STEP = 40;
const PAN_DRAG_SENSITIVITY = 1;

function buildThumbSx() {
  const { thumbSize } = getLightboxUi();
  return {
    width: thumbSize,
    height: thumbSize,
    minWidth: thumbSize,
    minHeight: thumbSize,
    maxWidth: thumbSize,
    maxHeight: thumbSize,
    objectFit: "cover",
    display: "block",
    borderRadius: 1.5,
    border: 1,
    borderColor: "divider",
    boxSizing: "border-box",
    flexShrink: 0,
    transition: "transform 0.22s ease, border-color 0.22s ease, filter 0.22s ease",
  };
}

function buildGridThumbSx() {
  return {
    width: "100%",
    height: "100%",
    minWidth: 0,
    minHeight: 0,
    maxWidth: "none",
    maxHeight: "none",
    objectFit: "cover",
    display: "block",
    borderRadius: 1,
    border: 0,
    boxSizing: "border-box",
    transition: "transform 0.22s ease, filter 0.22s ease",
  };
}

function buildThumbTriggerSx() {
  const { thumbSize } = getLightboxUi();
  return {
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    width: thumbSize,
    height: thumbSize,
    minWidth: thumbSize,
    minHeight: thumbSize,
    maxWidth: thumbSize,
    maxHeight: thumbSize,
    borderRadius: 1.5,
    overflow: "hidden",
    cursor: "zoom-in",
    outline: "none",
    verticalAlign: "top",
    boxSizing: "border-box",
    p: 0,
    m: 0,
    boxShadow: (t) => (t.palette.mode === "dark" ? "0 2px 10px rgba(0,0,0,0.28)" : "0 4px 14px rgba(15,23,42,0.1)"),
    transition: "box-shadow 0.22s ease, transform 0.22s ease",
    "&:hover": {
      boxShadow: (t) => (t.palette.mode === "dark" ? "0 10px 28px rgba(0,0,0,0.45)" : "0 12px 32px rgba(15,23,42,0.18)"),
      transform: "translateY(-2px)",
      "& img": {
        transform: "scale(1.08)",
        borderColor: "primary.main",
        filter: "brightness(1.04)",
      },
    },
    "&:active": { transform: "translateY(0)" },
    "&:focus-visible": {
      outline: "2px solid",
      outlineColor: "primary.main",
      outlineOffset: 2,
    },
  };
}

function buildGridTriggerSx() {
  return {
    position: "relative",
    display: "block",
    width: "100%",
    height: "100%",
    minWidth: 0,
    minHeight: 0,
    borderRadius: 1,
    overflow: "hidden",
    cursor: "zoom-in",
    outline: "none",
    p: 0,
    m: 0,
    boxSizing: "border-box",
    boxShadow: (t) => (t.palette.mode === "dark" ? "0 2px 10px rgba(0,0,0,0.28)" : "0 4px 14px rgba(15,23,42,0.1)"),
    transition: "box-shadow 0.22s ease, transform 0.22s ease",
    "&:hover": {
      boxShadow: (t) => (t.palette.mode === "dark" ? "0 10px 28px rgba(0,0,0,0.45)" : "0 12px 32px rgba(15,23,42,0.18)"),
      transform: "translateY(-2px)",
      "& img": {
        transform: "scale(1.06)",
        filter: "brightness(1.04)",
      },
    },
    "&:active": { transform: "translateY(0)" },
    "&:focus-visible": {
      outline: "2px solid",
      outlineColor: "primary.main",
      outlineOffset: 2,
    },
  };
}
function getPanLimits(viewport, img, zoom) {
  if (!viewport || !img || zoom <= 1) return { maxX: 0, maxY: 0 };
  const vw = viewport.clientWidth;
  const vh = viewport.clientHeight;
  const baseW = img.clientWidth;
  const baseH = img.clientHeight;
  if (!baseW || !baseH) return { maxX: PAN_EDGE_BLEED, maxY: PAN_EDGE_BLEED };
  const scaledW = baseW * zoom;
  const scaledH = baseH * zoom;
  return {
    maxX: Math.max(0, (scaledW - vw) / 2) + PAN_EDGE_BLEED,
    maxY: Math.max(0, (scaledH - vh) / 2) + PAN_EDGE_BLEED,
  };
}

function clampPan(pan, limits) {
  return {
    x: Math.min(limits.maxX, Math.max(-limits.maxX, pan.x)),
    y: Math.min(limits.maxY, Math.max(-limits.maxY, pan.y)),
  };
}

/** Mantiene fijo el punto bajo el cursor al cambiar zoom (origen: centro del viewport). */
function panForZoomAtPoint(pan, mx, my, z1, z2) {
  if (z2 <= 1) return { x: 0, y: 0 };
  const ratio = z2 / z1;
  return {
    x: mx * (1 - ratio) + pan.x * ratio,
    y: my * (1 - ratio) + pan.y * ratio,
  };
}

function viewportAnchor(viewport) {
  const rect = viewport?.getBoundingClientRect();
  if (!rect) return { x: 0, y: 0 };
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

function navBtnSx(side, visible) {
  return {
    position: "absolute",
    top: "50%",
    [side]: { xs: 4, sm: 12 },
    transform: "translateY(-50%)",
    color: "#fff",
    opacity: visible ? 1 : 0,
    bgcolor: visible ? "rgba(0,0,0,0.55)" : "transparent",
    transition: `opacity ${NAV_FADE}, background-color ${NAV_FADE}`,
    zIndex: 2,
    "&:hover": { opacity: 1, bgcolor: "rgba(0,0,0,0.75)" },
  };
}

function overlayBtnSx(visible) {
  return {
    bgcolor: visible ? "rgba(255,255,255,0.12)" : "transparent",
    color: "#fff",
    opacity: visible ? 1 : 0.72,
    transition: "opacity 0.28s ease, background-color 0.28s ease",
    "&:hover": { opacity: 1, bgcolor: "rgba(255,255,255,0.22)" },
  };
}

const toolbarBtnSx = {
  width: 32,
  height: 32,
  color: "rgba(255,255,255,0.92)",
  bgcolor: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.1)",
  transition: "background-color 0.2s ease, border-color 0.2s ease, opacity 0.2s ease",
  "&:hover": { bgcolor: "rgba(255,255,255,0.18)", borderColor: "rgba(255,255,255,0.22)" },
  "&.Mui-disabled": { color: "rgba(255,255,255,0.28)", bgcolor: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.06)" },
};

const toolbarShellSx = {
  alignSelf: "center",
  display: "inline-flex",
  alignItems: "center",
  gap: 1,
  px: 1.25,
  py: 0.5,
  borderRadius: 999,
  bgcolor: "rgba(8,12,20,0.72)",
  backdropFilter: "blur(14px)",
  border: "1px solid rgba(255,255,255,0.1)",
  boxShadow: "0 10px 36px rgba(0,0,0,0.38)",
  flexShrink: 0,
  zIndex: 3,
};

const toolbarDividerSx = {
  width: "1px",
  height: 22,
  bgcolor: "rgba(255,255,255,0.14)",
  flexShrink: 0,
};

const zoomBadgeSx = {
  minWidth: 46,
  px: 0.75,
  py: 0.25,
  borderRadius: 999,
  bgcolor: "rgba(255,255,255,0.1)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "rgba(255,255,255,0.92)",
  fontSize: 12,
  fontWeight: 700,
  lineHeight: 1.4,
  textAlign: "center",
  userSelect: "none",
  fontVariantNumeric: "tabular-nums",
};

function PanPad({ canPan, panBy }) {
  const { Box, IconButton, Tooltip } = getMaterialUI();
  const { Icon } = UI;

  const panBtnSx = {
    ...toolbarBtnSx,
    width: 26,
    height: 26,
    p: 0,
  };

  const padBtn = (label, icon, onClick, sx) => (
    <Tooltip title={label} key={label}>
      <span>
        <IconButton aria-label={label.replace(/ \(.*\)/, "")} onClick={onClick} disabled={!canPan} size="small" sx={{ ...panBtnSx, ...sx }}>
          <Icon icon={icon} size={15} />
        </IconButton>
      </span>
    </Tooltip>
  );

  return (
    <Box
      sx={{
        position: "relative",
        width: 68,
        height: 52,
        flexShrink: 0,
        opacity: canPan ? 1 : 0.5,
        transition: "opacity 0.2s ease",
      }}
    >
      {padBtn("Arriba (Ctrl ↑)", "mdi:chevron-up", () => panBy(0, -PAN_STEP), { top: 0, left: "50%", transform: "translateX(-50%)", position: "absolute" })}
      {padBtn("Izquierda (Ctrl ←)", "mdi:chevron-left", () => panBy(-PAN_STEP, 0), { left: 0, top: "50%", transform: "translateY(-50%)", position: "absolute" })}
      {padBtn("Derecha (Ctrl →)", "mdi:chevron-right", () => panBy(PAN_STEP, 0), { right: 0, top: "50%", transform: "translateY(-50%)", position: "absolute" })}
      {padBtn("Abajo (Ctrl ↓)", "mdi:chevron-down", () => panBy(0, PAN_STEP), { bottom: 0, left: "50%", transform: "translateX(-50%)", position: "absolute" })}
    </Box>
  );
}

function useOverlayUi(open, hideMs = UI_HIDE_MS) {
  const { useState, useCallback, useEffect, useRef } = getReact();
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);

  const poke = useCallback(() => {
    setVisible(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setVisible(false), hideMs);
  }, [hideMs]);

  useEffect(() => {
    if (!open) {
      setVisible(false);
      if (timerRef.current) clearTimeout(timerRef.current);
      return undefined;
    }
    poke();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [open, poke]);

  return { uiVisible: visible, pokeUi: poke };
}

function applyImgTransform(img, pan, zoom) {
  if (!img) return;
  img.style.transform = `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`;
}

function useZoomPan(open, slideKey) {
  const { useState, useCallback, useEffect, useRef } = getReact();
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const dragRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const zoomRef = useRef(1);
  const panRef = useRef({ x: 0, y: 0 });
  const viewportRef = useRef(null);
  const imgRef = useRef(null);
  const rafRef = useRef(0);
  const pointerRef = useRef(null);

  const syncPan = useCallback((next, { commit = true } = {}) => {
    const limits = getPanLimits(viewportRef.current, imgRef.current, zoomRef.current);
    const clamped = clampPan(next, limits);
    panRef.current = clamped;
    applyImgTransform(imgRef.current, clamped, zoomRef.current);
    if (commit) setPan(clamped);
    return clamped;
  }, []);

  const applyPan = useCallback((next) => {
    syncPan(next);
  }, [syncPan]);

  const resetView = useCallback(() => {
    zoomRef.current = 1;
    setZoom(1);
    syncPan({ x: 0, y: 0 });
  }, [syncPan]);

  useEffect(() => {
    zoomRef.current = zoom;
    applyImgTransform(imgRef.current, panRef.current, zoom);
  }, [zoom]);

  useEffect(() => {
    panRef.current = pan;
    applyImgTransform(imgRef.current, pan, zoomRef.current);
  }, [pan]);

  useEffect(() => {
    if (!open) resetView();
  }, [open, slideKey, resetView]);

  useEffect(() => {
    if (!open || zoom <= 1) return;
    syncPan(panRef.current);
  }, [zoom, open, slideKey, syncPan]);

  const applyZoomDelta = useCallback(
    (delta, clientX, clientY) => {
      const viewport = viewportRef.current;
      const z1 = zoomRef.current;
      const next = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, +(z1 + delta).toFixed(2)));
      if (next === z1) return;

      let mx = 0;
      let my = 0;
      if (viewport) {
        const rect = viewport.getBoundingClientRect();
        mx = clientX - rect.left - rect.width / 2;
        my = clientY - rect.top - rect.height / 2;
      }

      const p2 = panForZoomAtPoint(panRef.current, mx, my, z1, next);
      zoomRef.current = next;
      setZoom(next);
      syncPan(p2);
    },
    [syncPan],
  );

  const zoomIn = useCallback(() => {
    const anchor = viewportAnchor(viewportRef.current);
    applyZoomDelta(ZOOM_STEP, anchor.x, anchor.y);
  }, [applyZoomDelta]);

  const zoomOut = useCallback(() => {
    const anchor = viewportAnchor(viewportRef.current);
    applyZoomDelta(-ZOOM_STEP, anchor.x, anchor.y);
  }, [applyZoomDelta]);

  const applyZoomDeltaRef = useRef(applyZoomDelta);
  applyZoomDeltaRef.current = applyZoomDelta;

  useEffect(() => {
    if (!open) return undefined;

    const blockPageScroll = (e) => {
      e.preventDefault();
    };
    window.addEventListener("wheel", blockPageScroll, { passive: false, capture: true });

    const el = viewportRef.current;
    const onViewportWheel = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      applyZoomDeltaRef.current(delta, e.clientX, e.clientY);
    };
    if (el) el.addEventListener("wheel", onViewportWheel, { passive: false });

    return () => {
      window.removeEventListener("wheel", blockPageScroll, { capture: true });
      if (el) el.removeEventListener("wheel", onViewportWheel);
    };
  }, [open, slideKey]);

  const applyDragPan = useCallback(
    (commit = false) => {
      const { x, y, panX, panY } = dragRef.current;
      return syncPan(
        {
          x: panX + x * PAN_DRAG_SENSITIVITY,
          y: panY + y * PAN_DRAG_SENSITIVITY,
        },
        { commit },
      );
    },
    [syncPan],
  );

  const flushDrag = useCallback(() => {
    rafRef.current = 0;
    applyDragPan(false);
  }, [applyDragPan]);

  const onPanStart = useCallback(
    (e) => {
      if (zoomRef.current <= 1 || e.button !== 0) return;
      dragging.current = true;
      pointerRef.current = e.pointerId;
      dragRef.current = { x: 0, y: 0, panX: panRef.current.x, panY: panRef.current.y, lastX: e.clientX, lastY: e.clientY };
      e.currentTarget.setPointerCapture(e.pointerId);
      if (imgRef.current) imgRef.current.style.willChange = "transform";
      e.preventDefault();
    },
    [],
  );

  const onPanMove = useCallback(
    (e) => {
      if (!dragging.current || pointerRef.current !== e.pointerId) return;
      const dx = e.clientX - dragRef.current.lastX;
      const dy = e.clientY - dragRef.current.lastY;
      dragRef.current.lastX = e.clientX;
      dragRef.current.lastY = e.clientY;
      dragRef.current.x += dx;
      dragRef.current.y += dy;
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(flushDrag);
      }
      e.preventDefault();
    },
    [flushDrag],
  );

  const onPanEnd = useCallback(
    (e) => {
      if (!dragging.current) return;
      if (e.pointerId !== pointerRef.current) return;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
      applyDragPan(true);
      dragging.current = false;
      pointerRef.current = null;
      if (imgRef.current) imgRef.current.style.willChange = "";
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* ya liberado */
      }
    },
    [applyDragPan],
  );

  const onImgLoad = useCallback(() => {
    if (zoomRef.current > 1) {
      syncPan(panRef.current);
    }
  }, [syncPan]);

  const panBy = useCallback((dx, dy) => {
    if (zoomRef.current <= 1) return;
    syncPan({ x: panRef.current.x + dx, y: panRef.current.y + dy });
  }, [syncPan]);

  useEffect(() => {
    if (!open) return undefined;
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      dragging.current = false;
      pointerRef.current = null;
      rafRef.current = 0;
    };
  }, [open]);

  return {
    zoom,
    pan,
    resetView,
    zoomIn,
    zoomOut,
    onPanStart,
    onPanMove,
    onPanEnd,
    onImgLoad,
    panBy,
    viewportRef,
    imgRef,
    canPan: zoom > 1,
    isDragging: dragging,
  };
}

/**
 * @param {{ src: string, alt?: string, caption?: string, sx?: object, gallery?: { src: string, alt?: string, caption?: string }[], startIndex?: number, variant?: 'thumb' | 'grid' }} props
 */
export function LightboxImage({ src, alt = "", caption, sx, gallery, startIndex = 0, variant = "thumb" }) {
  const { useState, useEffect, useCallback, useMemo } = getReact();
  const { Box, Dialog, IconButton, Typography, Stack, Tooltip } = getMaterialUI();
  const { Icon } = UI;
  const isGrid = variant === "grid";
  const thumbSx = useMemo(() => (isGrid ? buildGridThumbSx() : buildThumbSx()), [isGrid]);
  const thumbTriggerSx = useMemo(() => (isGrid ? buildGridTriggerSx() : buildThumbTriggerSx()), [isGrid]);

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
  const slideKey = current?.src ?? String(index);

  const { uiVisible: navVisible, pokeUi: pokeNav } = useOverlayUi(open, NAV_HIDE_MS);

  const { zoom, pan, resetView, zoomIn, zoomOut, onPanStart, onPanMove, onPanEnd, onImgLoad, panBy, viewportRef, imgRef, canPan, isDragging } =
    useZoomPan(open, slideKey);

  const pokeControls = useCallback(() => {
    if (isDragging.current) return;
    pokeNav();
  }, [pokeNav, isDragging]);

  const goPrev = useCallback(() => {
    setIndex((i) => (i - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const goNext = useCallback(() => {
    setIndex((i) => (i + 1) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      pokeControls();
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }

      const mod = e.ctrlKey || e.metaKey;
      if (mod) {
        if (e.key === "0") {
          e.preventDefault();
          resetView();
          return;
        }
        if (e.key === "+" || e.key === "=") {
          e.preventDefault();
          zoomIn();
          return;
        }
        if (e.key === "-") {
          e.preventDefault();
          zoomOut();
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          panBy(0, -PAN_STEP);
          return;
        }
        if (e.key === "ArrowDown") {
          e.preventDefault();
          panBy(0, PAN_STEP);
          return;
        }
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          panBy(-PAN_STEP, 0);
          return;
        }
        if (e.key === "ArrowRight") {
          e.preventDefault();
          panBy(PAN_STEP, 0);
          return;
        }
        return;
      }

      if (e.key === "ArrowLeft" && hasNav) goPrev();
      if (e.key === "ArrowRight" && hasNav) goNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, hasNav, goPrev, goNext, zoomIn, zoomOut, resetView, panBy, pokeControls]);

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
        sx={thumbTriggerSx}
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
        <Box
          sx={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "stretch", width: "100%" }}
          onMouseMove={pokeControls}
          onMouseEnter={pokeControls}
        >
          <Box sx={{ ...toolbarShellSx, mb: 1.25 }}>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Tooltip title="Alejar (Ctrl −)">
                <span>
                  <IconButton aria-label="Alejar" onClick={zoomOut} disabled={zoom <= ZOOM_MIN} sx={toolbarBtnSx} size="small">
                    <Icon icon="mdi:magnify-minus-outline" size={18} />
                  </IconButton>
                </span>
              </Tooltip>
              <Box component="span" sx={zoomBadgeSx}>
                {Math.round(zoom * 100)}%
              </Box>
              <Tooltip title="Acercar (Ctrl +)">
                <span>
                  <IconButton aria-label="Acercar" onClick={zoomIn} disabled={zoom >= ZOOM_MAX} sx={toolbarBtnSx} size="small">
                    <Icon icon="mdi:magnify-plus-outline" size={18} />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Restablecer (Ctrl 0)">
                <span>
                  <IconButton
                    aria-label="Restablecer vista"
                    onClick={resetView}
                    disabled={zoom <= 1 && pan.x === 0 && pan.y === 0}
                    sx={toolbarBtnSx}
                    size="small"
                  >
                    <Icon icon="mdi:fit-to-screen-outline" size={18} />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>

            <Box sx={toolbarDividerSx} />

            <PanPad canPan={canPan} panBy={panBy} />

            <Box sx={toolbarDividerSx} />

            <Tooltip title="Cerrar">
              <span>
                <IconButton aria-label="Cerrar" onClick={() => setOpen(false)} sx={toolbarBtnSx} size="small">
                  <Icon icon="mdi:close" size={18} />
                </IconButton>
              </span>
            </Tooltip>
          </Box>

          {hasNav && (
            <>
              <IconButton aria-label="Anterior" onClick={goPrev} sx={navBtnSx("left", navVisible)}>
                <Icon icon="mdi:chevron-left" size={28} />
              </IconButton>
              <IconButton aria-label="Siguiente" onClick={goNext} sx={navBtnSx("right", navVisible)}>
                <Icon icon="mdi:chevron-right" size={28} />
              </IconButton>
            </>
          )}

          <Box
            ref={viewportRef}
            onPointerDown={onPanStart}
            onPointerMove={onPanMove}
            onPointerUp={onPanEnd}
            onPointerCancel={onPanEnd}
            sx={{
              overflow: "hidden",
              maxWidth: "100%",
              maxHeight: "min(78vh, 860px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              alignSelf: "center",
              cursor: canPan ? "grab" : "default",
              userSelect: "none",
              touchAction: "none",
              "&:active": { cursor: canPan ? "grabbing" : "default" },
            }}
          >
            <Box
              ref={imgRef}
              component="img"
              src={current?.src}
              alt={current?.alt ?? ""}
              draggable={false}
              onLoad={onImgLoad}
              sx={{
                display: "block",
                maxWidth: "100%",
                maxHeight: "min(78vh, 860px)",
                width: "auto",
                height: "auto",
                borderRadius: 0,
                boxShadow: "0 24px 80px rgba(0,0,0,0.55)",
                transformOrigin: "center center",
              }}
            />
          </Box>

          {(current?.caption || hasNav) && (
            <Box sx={{ mt: 1.5, px: { xs: 1, sm: 1.5 }, py: 0.5, width: "100%", alignSelf: "stretch", textAlign: "left" }}>
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
