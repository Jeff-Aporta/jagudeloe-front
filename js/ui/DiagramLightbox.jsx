/**
 * Lightbox full-page — diagramas (tortuga, código, compartir) y galería de imágenes.
 * UI base: @jeff-aporta/lightbox-zoom (LightboxZoomDialog / useStageTransform).
 */
import { getReact, getMaterialUI, UI, CodeMirrorPanel, Lightbox } from "../core/platform.ts";
import { getDiagramComponent } from "./diagram-kinds.ts";
import { buildDiagramViewerUrl } from "../boot/url-s.mjs";
import { expandSequencePayloadForJson, sequencePayloadHideGroups } from "../core/tk-sequence.ts";

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
  const { Dialog, Box, IconButton, Typography, Snackbar, CircularProgress, Button } = getMaterialUI();

  const gallery = Array.isArray(slides) && slides.length ? slides : null;

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

  const LightboxZoomDialog = Lightbox.LightboxZoomDialog;

  const diagramToolbarLeft = !gallery ? (
    <>
      <ToolbarBtn icon={ICON.prev} title="Tramo anterior" onClick={call("prev")} />
      <ToolbarBtn icon={turtle.playing ? ICON.pause : ICON.play} title={turtle.playing ? "Pausar" : "Reproducir"} onClick={togglePlay} />
      {turtle.playing && <ToolbarBtn icon={ICON.stop} title="Detener" onClick={call("stop")} />}
      <ToolbarBtn icon={ICON.next} title="Tramo siguiente" onClick={call("next")} />
      <Box sx={{ position: "relative", width: 22, height: 22, ml: 0.5, display: "inline-flex" }}>
        <CircularProgress variant="determinate" value={Math.round((turtle.replay || 0) * 100)} size={22} thickness={4} sx={{ color: "rgba(255,255,255,0.85)" }} />
        <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <UI.Icon icon="mdi:tortoise" size={11} />
        </Box>
      </Box>
    </>
  ) : null;

  const diagramToolbarRight = !gallery
    ? [[{ icon: ICON.share, title: "Copiar enlace del visor", onClick: onShare }, { icon: ICON.code, title: "Ver / editar código", onClick: openCode }]]
    : null;

  return (
    <>
      <LightboxZoomDialog
        ns="ISAJ"
        open={open}
        onClose={onClose}
        closable={closable}
        slides={gallery}
        startIndex={startIndex}
        className="isa-lb-zoom tk-diagram-viewer"
        toolbarLeft={diagramToolbarLeft}
        toolbarRight={diagramToolbarRight}
      >
        {!gallery ? <DiagramRender kind={kind} payload={effectivePayload} turtle={turtleBus} groupCtl={groupCtl} /> : null}
      </LightboxZoomDialog>

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
    </>
  );
}

function ToolbarBtn({ icon, title, onClick }) {
  const { IconButton, Tooltip } = getMaterialUI();
  return (
    <Tooltip title={title}>
      <IconButton onClick={onClick} size="small" sx={{ color: "inherit" }} aria-label={title}>
        <UI.Icon icon={icon} size={18} />
      </IconButton>
    </Tooltip>
  );
}
