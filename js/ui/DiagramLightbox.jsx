/**
 * Lightbox full-page (propio, candidato a unificar el de front-shared). Dos modos:
 *  - Diagrama: `kind` + `payload` (reproducción tortuga, grupos, compartir, código).
 *  - Galería: `slides` = [{ src, alt, caption }] + `startIndex` (navegación con dots).
 * Stage con gestos (zoom rueda+pinch, pan arrastre, rotación 2 dedos). Toolbar en 3
 * zonas (justify-between): IZQ tools, CENTRO zoom+restaurar, DER grupos de acciones.
 */
import { getReact, getMaterialUI, UI, CodeMirrorPanel } from "../core/platform.ts";
import { getDiagramComponent } from "./diagram-kinds.ts";
import { buildDiagramViewerUrl } from "../boot/url-s.mjs";
import { expandSequencePayloadForJson, sequencePayloadHideGroups } from "../core/tk-sequence.ts";
import { useStageTransform } from "./useStageTransform.js";

const { useState, useCallback, useMemo, useRef, useEffect } = getReact();

const ICON = {
  share: "mdi:share-variant-outline",
  code: "mdi:code-json",
  close: "mdi:close",
  play: "mdi:play",
  pause: "mdi:pause",
  stop: "mdi:stop",
  prev: "mdi:skip-previous",
  next: "mdi:skip-next",
  slidePrev: "mdi:chevron-left",
  slideNext: "mdi:chevron-right",
  zoomIn: "mdi:magnify-plus-outline",
  zoomOut: "mdi:magnify-minus-outline",
  restore: "mdi:backup-restore",
  open: "mdi:open-in-new",
};

function isSequenceKind(kind) {
  const k = String(kind || "").toLowerCase();
  return k === "sequence" || k === "sequence-diagram";
}

function DiagramRender({ kind, payload, turtle, groupCtl }) {
  const { Typography } = getMaterialUI();
  const Comp = getDiagramComponent(kind);
  if (Comp) return <Comp payload={payload} turtle={turtle} groupCtl={groupCtl} />;
  return (
    <Typography variant="body2" color="text.secondary" sx={{ p: 3, textAlign: "center" }}>
      Tipo de diagrama aún no soportado en el visor: <strong>{String(kind)}</strong>
    </Typography>
  );
}

function diagramCodeJson(kind, payload) {
  let p = payload || {};
  if (isSequenceKind(kind)) p = expandSequencePayloadForJson(p);
  return JSON.stringify({ kind: String(kind || "sequence").toLowerCase(), payload: p }, null, 2);
}

export function DiagramLightbox({ open, onClose, kind = "sequence", payload, closable = true, slides, startIndex = 0 }) {
  const { Dialog, Box, IconButton, Tooltip, Typography, Snackbar, CircularProgress, Button } = getMaterialUI();

  const gallery = Array.isArray(slides) && slides.length ? slides : null;
  const [idx, setIdx] = useState(startIndex || 0);
  const slideCount = gallery ? gallery.length : 0;
  const cur = gallery ? gallery[Math.min(idx, slideCount - 1)] : null;
  const goPrev = useCallback(() => setIdx((i) => (i - 1 + slideCount) % slideCount), [slideCount]);
  const goNext = useCallback(() => setIdx((i) => (i + 1) % slideCount), [slideCount]);
  const handleSwipe = useCallback(
    (dir) => {
      if (slideCount > 1) (dir === "next" ? goNext : goPrev)();
    },
    [slideCount, goNext, goPrev],
  );

  const view = useStageTransform({ onSwipe: handleSwipe, onSwipeDown: closable ? onClose : undefined });

  const [basePayload, setBasePayload] = useState(payload);
  const [hiddenGroups, setHiddenGroups] = useState(() => new Set());
  const [codeOpen, setCodeOpen] = useState(false);
  const [codeText, setCodeText] = useState("");
  const [codeErr, setCodeErr] = useState("");
  const [copied, setCopied] = useState(false);
  const [turtle, setTurtle] = useState({ playing: false, replay: 0, idx: 0, total: 0 });
  const turtleRef = useRef(null);
  const turtleBus = useMemo(() => ({ ref: turtleRef, onState: setTurtle }), []);

  useEffect(() => {
    setBasePayload(payload);
    setHiddenGroups(new Set());
  }, [payload]);

  // Galería: índice inicial al abrir y reset de zoom al cambiar de slide.
  useEffect(() => {
    if (open) setIdx(startIndex || 0);
  }, [open, startIndex]);
  useEffect(() => {
    view.reset();
  }, [idx, open, view.reset]);

  // Navegación con flechas en galería.
  useEffect(() => {
    if (!open || !gallery || slideCount < 2) return undefined;
    const onKey = (e) => {
      if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, gallery, slideCount, goPrev, goNext]);

  const effectivePayload = useMemo(
    () => (isSequenceKind(kind) ? sequencePayloadHideGroups(basePayload, hiddenGroups) : basePayload),
    [kind, basePayload, hiddenGroups],
  );

  const onToggleGroup = useCallback((id) => {
    setHiddenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  const groupCtl = useMemo(() => ({ hidden: hiddenGroups, toggle: onToggleGroup }), [hiddenGroups, onToggleGroup]);

  const call = useCallback((fn) => () => turtleRef.current?.[fn]?.(), []);
  const togglePlay = useCallback(() => {
    const api = turtleRef.current;
    if (!api) return;
    if (turtle.playing) api.pause();
    else api.play();
  }, [turtle.playing]);

  const onShare = useCallback(() => {
    try {
      const url = buildDiagramViewerUrl({ kind, payload: effectivePayload });
      const done = () => setCopied(true);
      if (navigator.clipboard?.writeText) navigator.clipboard.writeText(url).then(done).catch(done);
      else done();
    } catch {
      /* noop */
    }
  }, [kind, effectivePayload]);

  const openCode = useCallback(() => {
    setCodeText(diagramCodeJson(kind, effectivePayload));
    setCodeErr("");
    setCodeOpen(true);
  }, [kind, effectivePayload]);

  const saveCode = useCallback(() => {
    let parsed;
    try {
      parsed = JSON.parse(codeText);
    } catch (e) {
      setCodeErr("JSON inválido: " + (e?.message || e));
      return;
    }
    const next = parsed && typeof parsed.payload === "object" ? parsed.payload : parsed;
    setBasePayload(next);
    setHiddenGroups(new Set());
    try {
      history.replaceState(null, "", buildDiagramViewerUrl({ kind, payload: next }));
    } catch {
      /* noop */
    }
    setCodeOpen(false);
  }, [codeText, kind]);

  if (!open) return null;

  const tbtn = (icon, title, onClick, size = 18) => (
    <Tooltip title={title} key={title}>
      <IconButton onClick={onClick} size="small" sx={{ color: "inherit" }} aria-label={title}>
        <UI.Icon icon={icon} size={size} />
      </IconButton>
    </Tooltip>
  );

  // DER: grupos de herramientas (array de arrays) según el modo.
  const rightGroups = gallery
    ? [...(cur?.src ? [[{ icon: ICON.open, title: "Abrir original", onClick: () => window.open(cur.src, "_blank", "noopener") }]] : []), ...(closable ? [[{ icon: ICON.close, title: "Cerrar", onClick: onClose }]] : [])]
    : [
        [
          { icon: ICON.share, title: "Copiar enlace del visor", onClick: onShare },
          { icon: ICON.code, title: "Ver / editar código", onClick: openCode },
        ],
        ...(closable ? [[{ icon: ICON.close, title: "Cerrar", onClick: onClose }]] : []),
      ];

  return (
    <Dialog
      open={open}
      onClose={closable ? onClose : undefined}
      fullScreen
      className="tk-diagram-viewer-dialog"
      PaperProps={{ sx: { bgcolor: "transparent", boxShadow: "none", borderRadius: 0, display: "flex", flexDirection: "column" } }}
      slotProps={{ backdrop: { sx: { bgcolor: "rgba(4,10,20,0.92)", backdropFilter: "blur(4px)" } } }}
    >
      <Box className="tk-diagram-viewer" sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", p: { xs: 1, sm: 2 } }}>
        <Box
          className="tk-diagram-viewer__toolbar"
          sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, color: "rgba(255,255,255,0.92)", flexShrink: 0 }}
        >
          {/* IZQ: tools por modo (galería: nav de slides; diagrama: reproducción tortuga) */}
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.25, flex: "1 1 0", minWidth: 0 }}>
            {gallery
              ? slideCount > 1 && (
                  <>
                    {tbtn(ICON.slidePrev, "Anterior", goPrev)}
                    <Box component="span" sx={{ minWidth: 44, textAlign: "center", fontSize: 12, fontVariantNumeric: "tabular-nums", opacity: 0.85 }}>
                      {idx + 1} / {slideCount}
                    </Box>
                    {tbtn(ICON.slideNext, "Siguiente", goNext)}
                  </>
                )
              : (
                  <>
                    {tbtn(ICON.prev, "Tramo anterior", call("prev"))}
                    {tbtn(turtle.playing ? ICON.pause : ICON.play, turtle.playing ? "Pausar" : "Reproducir", togglePlay)}
                    {turtle.playing && tbtn(ICON.stop, "Detener", call("stop"))}
                    {tbtn(ICON.next, "Tramo siguiente", call("next"))}
                    <Box sx={{ position: "relative", width: 22, height: 22, ml: 0.5, display: "inline-flex" }}>
                      <CircularProgress
                        variant="determinate"
                        value={Math.round((turtle.replay || 0) * 100)}
                        size={22}
                        thickness={4}
                        sx={{ color: "rgba(255,255,255,0.85)" }}
                      />
                      <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <UI.Icon icon="mdi:tortoise" size={11} />
                      </Box>
                    </Box>
                  </>
                )}
          </Box>

          {/* CENTRO: zoom + restaurar */}
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.25, flexShrink: 0 }}>
            {tbtn(ICON.zoomOut, "Alejar", view.zoomOut)}
            <Box component="span" sx={{ minWidth: 42, textAlign: "center", fontSize: 12, fontVariantNumeric: "tabular-nums", opacity: 0.85 }}>
              {view.scalePct}%
            </Box>
            {tbtn(ICON.zoomIn, "Acercar", view.zoomIn)}
            {tbtn(ICON.restore, "Restaurar vista", view.reset)}
          </Box>

          {/* DER: grupos de acciones */}
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1, flex: "1 1 0", minWidth: 0, justifyContent: "flex-end" }}>
            {rightGroups.map((group, gi) => (
              <Box key={gi} sx={{ display: "inline-flex", alignItems: "center", gap: 0.25 }}>
                {group.map((b) => tbtn(b.icon, b.title, b.onClick, 20))}
              </Box>
            ))}
          </Box>
        </Box>

        <Box
          className="tk-diagram-viewer__stage"
          ref={view.stageRef}
          {...view.bind}
          onDoubleClick={view.reset}
          sx={{
            position: "relative",
            flex: 1,
            minHeight: 0,
            display: "flex",
            overflow: "hidden",
            touchAction: "none",
            cursor: view.transformed ? "grab" : "default",
            p: { xs: 0.5, sm: 1.5 },
          }}
        >
          {view.pull.active && (
            <Box
              sx={{
                position: "absolute",
                top: 14,
                left: "50%",
                zIndex: 10,
                pointerEvents: "none",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 0.5,
                transform: `translate(-50%, ${Math.min(view.pull.dy * 0.5, 160)}px)`,
              }}
            >
              <Box sx={{ position: "relative", width: 52, height: 52, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CircularProgress
                  variant="determinate"
                  value={Math.round(view.pull.progress * 100)}
                  size={52}
                  thickness={4}
                  sx={{ color: view.pull.progress >= 1 ? "#ef4444" : "rgba(255,255,255,0.9)" }}
                />
                <Box
                  sx={{
                    position: "absolute",
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: view.pull.progress >= 1 ? "#ef4444" : "rgba(255,255,255,0.14)",
                    color: view.pull.progress >= 1 ? "#fff" : "rgba(255,255,255,0.92)",
                    transition: "background-color 0.15s ease",
                  }}
                >
                  <UI.Icon icon="mdi:close" size={22} />
                </Box>
              </Box>
              <Box sx={{ fontSize: 11, fontWeight: 600, color: view.pull.progress >= 1 ? "#ef4444" : "rgba(255,255,255,0.78)" }}>
                {view.pull.progress >= 1 ? "Soltar para cerrar" : "Desliza para cerrar"}
              </Box>
            </Box>
          )}
          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              minHeight: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: view.pull.active ? `translateY(${view.pull.dy}px) ${view.transform}` : view.transform,
              transformOrigin: "center center",
              opacity: view.pull.active ? 1 - 0.3 * view.pull.progress : 1,
            }}
          >
            {gallery ? (
              <img
                src={cur?.src}
                alt={cur?.alt || ""}
                draggable={false}
                style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", display: "block", userSelect: "none", pointerEvents: "none" }}
              />
            ) : (
              <DiagramRender kind={kind} payload={effectivePayload} turtle={turtleBus} groupCtl={groupCtl} />
            )}
          </Box>
        </Box>

        {gallery && (cur?.caption || cur?.alt) ? (
          <Box sx={{ textAlign: "center", color: "rgba(255,255,255,0.82)", fontSize: 13, px: 2, pt: 0.5, flexShrink: 0 }}>
            {cur.caption || cur.alt}
          </Box>
        ) : null}

        {gallery && slideCount > 1 && (
          <Box className="tk-diagram-viewer__dots" sx={{ display: "flex", justifyContent: "center", gap: 0.75, py: 1, flexShrink: 0 }}>
            {gallery.map((_, i) => (
              <Box
                key={i}
                onClick={() => setIdx(i)}
                sx={{
                  width: 9,
                  height: 9,
                  borderRadius: "50%",
                  cursor: "pointer",
                  bgcolor: i === idx ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.4)",
                  transition: "background-color 0.15s ease",
                }}
              />
            ))}
          </Box>
        )}
      </Box>

      <Dialog open={codeOpen} onClose={() => setCodeOpen(false)} maxWidth="md" fullWidth className="tk-diagram-code-dialog">
        <Box sx={{ p: 1.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
            <Typography variant="subtitle2">Código del diagrama (editable · no se guarda en BD)</Typography>
            <IconButton onClick={() => setCodeOpen(false)} size="small" aria-label="Cerrar código">
              <UI.Icon icon={ICON.close} size={18} />
            </IconButton>
          </Box>
          <CodeMirrorPanel value={codeText} onChange={setCodeText} json lineWrapping minHeight="20rem" className="tk-code-cm" />
          {codeErr ? (
            <Typography variant="caption" color="error" sx={{ display: "block", mt: 1 }}>
              {codeErr}
            </Typography>
          ) : null}
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 1.5 }}>
            <Button onClick={() => setCodeOpen(false)} color="inherit" size="small">
              Descartar
            </Button>
            <Button onClick={saveCode} variant="contained" size="small">
              Guardar
            </Button>
          </Box>
        </Box>
      </Dialog>

      <Snackbar open={copied} autoHideDuration={1800} onClose={() => setCopied(false)} message="Enlace del visor copiado" />
    </Dialog>
  );
}
