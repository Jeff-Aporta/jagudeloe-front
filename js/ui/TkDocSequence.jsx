import { getReact, getMaterialUI } from "../core/platform.ts";
import { DiagramLightbox } from "./DiagramLightbox.jsx";
import { SequenceTurtle } from "./SequenceTurtle.jsx";
import {
  computeSequenceLayout,
  resolveSequenceSpec,
  sequenceMessageTooltipText,
  sequenceThemeDark,
  sequenceThemeLight,
} from "../core/tk-sequence.ts";
import { TK_DIAGRAM_RADIUS_PX } from "../core/tk-diagram-grid.ts";
import { inlineMdWeb } from "./tkHtml.ts";
import { iconifyApiUrl, hasIconifyJsonSugar } from "../core/tk-iconify-inline.ts";
import { tkHueToHex } from "../core/tk-hue.ts";
import { contrastFontColor } from "../core/tk-color.ts";
import { registerDiagramKind } from "./diagram-kinds.ts";

const { useMemo, useRef, useState, useCallback } = getReact();

const GUIDE_X = 44;

/** Avatar del actor: disco tenue + ícono Iconify (hue 0–360). */
function ActorAvatar({ icon, hue, cx, cy, size = 16 }) {
  const fill = tkHueToHex(hue) ?? "#64748b";
  return (
    <>
      <circle cx={cx} cy={cy} r={size * 0.74} fill={fill} opacity={0.16} />
      <image
        href={iconifyApiUrl(icon, hue, size * 2)}
        x={cx - size / 2}
        y={cy - size / 2}
        width={size}
        height={size}
        preserveAspectRatio="xMidYMid meet"
      />
    </>
  );
}

function DiagramMessageLabel({ label, labelX, labelY, labelW, labelH, theme, active }) {
  if (!label) return null;
  const color = active ? theme.text : theme.muted;
  if (label.includes("{{")) {
    return (
      <foreignObject x={labelX} y={labelY} width={labelW} height={labelH} overflow="visible">
        <div
          xmlns="http://www.w3.org/1999/xhtml"
          className="tk-doc-seq-label tk-doc-markdown"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            fontSize: 10,
            fontFamily: "Consolas, Menlo, monospace",
            color,
            fontWeight: active ? 600 : 400,
            lineHeight: 1.2,
            textAlign: "center",
          }}
          dangerouslySetInnerHTML={{ __html: inlineMdWeb(label) }}
        />
      </foreignObject>
    );
  }
  return (
    <text
      x={labelX + labelW / 2}
      y={labelY + 13}
      textAnchor="middle"
      fill={color}
      fontSize="10"
      fontWeight={active ? "600" : "400"}
      fontFamily="Consolas,Menlo,monospace"
    >
      {label}
    </text>
  );
}

function MessageArrow({ m, theme, active }) {
  const stroke = (m.groupHue != null && tkHueToHex(m.groupHue)) || theme.accent;
  const sw = active ? 1.75 : 1.15;
  const dash = m.kind === "async" ? "5 3" : undefined;
  const tipX = m.arrowTipX;
  const tipY = m.arrowTipY ?? m.y;
  const dir = m.arrowDir;

  // Punta horizontal según la dirección del último tramo (sync/self/async).
  const head =
    dir > 0
      ? `${tipX},${tipY} ${tipX - 7},${tipY - 3.5} ${tipX - 7},${tipY + 3.5}`
      : `${tipX},${tipY} ${tipX + 7},${tipY - 3.5} ${tipX + 7},${tipY + 3.5}`;

  return (
    <>
      <path
        d={m.path}
        fill="none"
        stroke={stroke}
        strokeWidth={sw}
        strokeDasharray={dash}
        strokeLinecap="square"
        strokeLinejoin="miter"
        vectorEffect="non-scaling-stroke"
      />
      {m.kind === "async" ? (
        <polyline points={head} fill="none" stroke={stroke} strokeWidth={sw} strokeLinejoin="miter" />
      ) : (
        <polygon points={head} fill={stroke} />
      )}
    </>
  );
}

function TkDocSequenceSvg({ layout, theme, hoverId, onMsgEnter, onMsgLeave, fit, turtlePaused, turtleAutoLoop, turtleControlRef, turtleOnState, hiddenGroups, onToggleGroup }) {
  const { width: W, height: H, actors, lifelines, messages, altBox, title, subtitle, titleY, subtitleY, groups, legendX } = layout;
  const hoveredMsg = hoverId ? messages.find((m) => m.id === hoverId) : null;
  const hiColor = hoveredMsg?.groupHue != null ? tkHueToHex(hoveredMsg.groupHue) || theme.accent : theme.accent;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={title || "Diagrama de secuencia"}
      preserveAspectRatio="xMidYMid meet"
      className="tk-doc-sequence-svg"
      style={fit ? { width: "100%", height: "100%", maxWidth: "none", display: "block", margin: "0 auto" } : { width: "100%", maxWidth: W, height: "auto", display: "block", margin: "0 auto" }}
    >
      {title && (
        <text x={W / 2} y={titleY} textAnchor="middle" fill={theme.text} fontSize="13" fontWeight="600" fontFamily="Tahoma,Arial,sans-serif">
          {title}
        </text>
      )}
      {subtitle && (
        <text x={W / 2} y={subtitleY} textAnchor="middle" fill={theme.muted} fontSize="11" fontFamily="Tahoma,Arial,sans-serif">
          {subtitle}
        </text>
      )}

      {groups && groups.length > 0 && (
        <g className="tk-doc-seq-legend">
          {groups.map((grp, gi) => {
            const ly = 18 + gi * 16;
            const color = tkHueToHex(grp.hue) ?? theme.accent;
            const off = hiddenGroups ? hiddenGroups.has(grp.id) : false;
            const clickable = !!onToggleGroup;
            return (
              <g
                key={grp.id ?? gi}
                className={`tk-doc-seq-legend__item${off ? " is-off" : ""}`}
                onClick={clickable ? () => onToggleGroup(grp.id) : undefined}
                style={clickable ? { cursor: "pointer" } : undefined}
                opacity={off ? 0.4 : 1}
              >
                {clickable && (
                  <rect x={legendX - 2} y={ly - 8} width={grp.name.length * 6 + 26} height={16} rx={4} fill="transparent" />
                )}
                {off ? (
                  <circle cx={legendX + 5} cy={ly} r={4.5} fill="none" stroke={color} strokeWidth={1.4} />
                ) : (
                  <circle cx={legendX + 5} cy={ly} r={4.5} fill={color} />
                )}
                <text
                  x={legendX + 16}
                  y={ly + 3.5}
                  fill={theme.muted}
                  fontSize="10"
                  fontFamily="Tahoma,Arial,sans-serif"
                  textDecoration={off ? "line-through" : undefined}
                >
                  {grp.name}
                </text>
              </g>
            );
          })}
        </g>
      )}

      {actors.map((a) => {
        const bw = a.w;
        const bx = a.x - bw / 2;
        const iconInLabel = hasIconifyJsonSugar(a.label);
        const iconCx = bx + 18;
        const labelLeft = iconInLabel ? bx + 8 : bx + 32;
        const labelRight = bx + bw - 8;
        const labelCx = (labelLeft + labelRight) / 2;
        const active = hoverId && messages.some((m) => m.id === hoverId && (m.fromX === a.x || m.toX === a.x));
        const dim = hoverId && !active;
        return (
          <g
            key={a.id}
            className={`tk-doc-seq-actor${active ? " is-active" : ""}${dim ? " is-dim" : ""}`}
            opacity={dim ? 0.32 : 1}
          >
            <rect
              x={bx}
              y={a.y - 16}
              width={bw}
              height={32}
              rx={TK_DIAGRAM_RADIUS_PX}
              fill="transparent"
              stroke={active ? theme.accent : theme.border}
              strokeWidth={active ? 1.4 : 1}
            />
            {!iconInLabel && <ActorAvatar icon={a.icon} hue={a.hue} cx={iconCx} cy={a.y} size={16} />}
            {a.label.includes("{{") ? (
              <foreignObject x={labelLeft} y={a.y - 10} width={labelRight - labelLeft} height={20} overflow="visible">
                <div
                  xmlns="http://www.w3.org/1999/xhtml"
                  className="tk-doc-seq-actor-label tk-doc-markdown"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    height: "100%",
                    fontSize: 11,
                    fontWeight: 600,
                    fontFamily: "Tahoma,Arial,sans-serif",
                    color: theme.text,
                    lineHeight: 1,
                  }}
                  dangerouslySetInnerHTML={{ __html: inlineMdWeb(a.label) }}
                />
              </foreignObject>
            ) : (
              <text
                x={labelCx}
                y={a.y + 4}
                textAnchor="middle"
                fill={theme.text}
                fontSize="11"
                fontWeight="600"
                fontFamily="Tahoma,Arial,sans-serif"
              >
                {a.label}
              </text>
            )}
          </g>
        );
      })}

      {lifelines.map((l) => {
        const involved = hoveredMsg && (hoveredMsg.fromX === l.x || hoveredMsg.toX === l.x);
        const dim = hoverId && !involved;
        return (
          <line
            key={l.id}
            x1={l.x}
            y1={l.y1}
            x2={l.x}
            y2={l.y2}
            stroke={involved ? hiColor : theme.grid}
            strokeWidth={involved ? 1.6 : 1}
            strokeDasharray="4 4"
            className="tk-doc-seq-lifeline"
            opacity={dim ? 0.3 : 1}
          />
        );
      })}

      {altBox && (
        <g className="tk-doc-seq-alt">
          <rect
            x={altBox.x}
            y={altBox.y}
            width={altBox.w}
            height={altBox.h}
            rx={TK_DIAGRAM_RADIUS_PX}
            fill="transparent"
            stroke={theme.altBorder}
            strokeWidth="1"
            strokeDasharray="5 4"
          />
          <text x={altBox.x + 10} y={altBox.y + 14} fill={theme.muted} fontSize="10" fontWeight="600" fontFamily="Tahoma,Arial,sans-serif">
            {altBox.label}
          </text>
        </g>
      )}

      {messages.map((m) => {
        const active = hoverId === m.id;
        const dim = hoverId && !active;
        return (
          <g
            key={m.id}
            className={`tk-doc-seq-msg${active ? " is-active" : ""}${dim ? " is-dim" : ""}`}
            onMouseEnter={onMsgEnter ? () => onMsgEnter(m) : undefined}
            onMouseLeave={onMsgLeave ? () => onMsgLeave() : undefined}
            style={onMsgEnter ? { cursor: "pointer" } : undefined}
          >
            {m.branchFirst && m.branch && (
              <text x={altBox ? altBox.x + 36 : GUIDE_X + 8} y={m.y - 10} fill={theme.muted} fontSize="9" fontFamily="Tahoma,Arial,sans-serif">
                [{m.branch}]
              </text>
            )}
            <MessageArrow m={m} theme={theme} active={active} />
            {(() => {
              const dotFill = (m.groupHue != null && tkHueToHex(m.groupHue)) || theme.accent;
              return (
                <g className="tk-doc-seq-start">
                  <circle cx={m.fromX} cy={m.y} r={active ? 9 : 8} fill={dotFill} />
                  <text
                    x={m.fromX}
                    y={m.y + 3.2}
                    textAnchor="middle"
                    fill={contrastFontColor(dotFill)}
                    fontSize="9"
                    fontWeight="700"
                    fontFamily="Tahoma,Arial,sans-serif"
                  >
                    {m.step}
                  </text>
                </g>
              );
            })()}
            {m.label && (
              <rect x={m.labelX} y={m.labelY} width={m.labelW} height={m.labelH} rx={4} fill={theme.chipFill} />
            )}
            <DiagramMessageLabel
              label={m.label}
              labelX={m.labelX}
              labelY={m.labelY}
              labelW={m.labelW}
              labelH={m.labelH}
              theme={theme}
              active={active}
            />
          </g>
        );
      })}

      <SequenceTurtle
        messages={messages}
        theme={theme}
        viewW={W}
        viewH={H}
        paused={turtlePaused}
        autoLoop={turtleAutoLoop}
        controlRef={turtleControlRef}
        onState={turtleOnState}
      />
    </svg>
  );
}

export function TkDocSequence({ payload, variant = "inline", turtle, groupCtl }) {
  const { Box, Typography, useTheme } = getMaterialUI();
  const theme = useTheme();
  const dark = theme.palette.mode === "dark";
  const containerRef = useRef(null);
  const localTurtleRef = useRef(null);
  const turtleControlRef = turtle?.ref ?? localTurtleRef;
  const [hoverMsg, setHoverMsg] = useState(null);
  const [cursor, setCursor] = useState({ x: 0, y: 0, w: 0, h: 0, active: false });
  const [lbOpen, setLbOpen] = useState(false);

  const spec = useMemo(() => resolveSequenceSpec(payload ?? {}), [payload]);
  const seqTheme = useMemo(() => (dark ? sequenceThemeDark() : sequenceThemeLight()), [dark]);
  const layout = useMemo(() => (spec ? computeSequenceLayout(spec) : null), [spec]);

  const onPointerMove = useCallback((e) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setCursor({ x: e.clientX - rect.left, y: e.clientY - rect.top, w: rect.width, h: rect.height, active: true });
  }, []);

  const onPointerLeave = useCallback(() => {
    setCursor((c) => ({ ...c, active: false }));
    setHoverMsg(null);
  }, []);

  // Preview inline: entrar al visor con 1 clic / 1 tap.
  const openViewer = useCallback(() => setLbOpen(true), []);

  if (!spec || !layout) {
    return (
      <Typography variant="body2" color="text.secondary">
        Diagrama de secuencia no disponible (payload inválido).
      </Typography>
    );
  }

  const isViewer = variant === "viewer";

  // Tooltip que sigue al cursor pero SIEMPRE por debajo de la fila (no tapa el dot
  // index, ni la flecha, ni los actores; los flujos se leen de arriba→abajo).
  const tipPos = {
    left: Math.max(8, Math.min((cursor.w || 320) - 300, cursor.x + 16)),
    top: cursor.y + 26,
  };

  // Inline = SVG estático (sin hover); solo gesto de entrada (long-press / doble clic).
  const interaction = isViewer
    ? { onMouseMove: onPointerMove, onMouseLeave: onPointerLeave }
    : { onClick: openViewer };

  const panel = (
    <Box
      ref={containerRef}
      className={`tk-doc-sequence-panel${hoverMsg ? " is-hover-msg" : ""}${isViewer ? " is-viewer" : ""}`}
      {...interaction}
      sx={{
        position: "relative",
        borderRadius: "0.5rem",
        overflow: "visible",
        bgcolor: "transparent",
        ...(isViewer
          ? { width: "100%", height: "100%", display: "flex", flexDirection: "column", border: 0, p: 0 }
          : {
              border: 1,
              borderColor: "divider",
              cursor: "zoom-in",
              p: { xs: 1, sm: 1.5 },
              userSelect: "none",
              WebkitUserSelect: "none",
              WebkitTouchCallout: "none",
              touchAction: "manipulation",
            }),
      }}
    >
      {isViewer && hoverMsg && (
        <Box className="tk-doc-chart-tooltip" sx={tipPos}>
          <Typography component="span" variant="caption" sx={{ fontWeight: 700, display: "block" }}>
            <Box component="span" sx={{ opacity: 0.7, mr: 0.5 }}>{hoverMsg.step}.</Box>
            <Box component="span" dangerouslySetInnerHTML={{ __html: inlineMdWeb(hoverMsg.label) }} />
          </Typography>
          {(() => {
            const tip = sequenceMessageTooltipText(hoverMsg);
            return tip ? (
              <Box
                className="tk-doc-markdown tk-doc-seq-tooltip-desc"
                sx={{ display: "block", mt: 0.5, fontSize: "0.78rem", lineHeight: 1.45 }}
                dangerouslySetInnerHTML={{ __html: inlineMdWeb(tip) }}
              />
            ) : null;
          })()}
        </Box>
      )}
      <TkDocSequenceSvg
        layout={layout}
        theme={seqTheme}
        hoverId={isViewer ? hoverMsg?.id ?? null : null}
        onMsgEnter={isViewer ? setHoverMsg : undefined}
        onMsgLeave={isViewer ? () => setHoverMsg(null) : undefined}
        fit={isViewer}
        turtlePaused={!!hoverMsg}
        turtleAutoLoop={isViewer}
        turtleControlRef={turtleControlRef}
        turtleOnState={turtle?.onState}
        hiddenGroups={groupCtl?.hidden}
        onToggleGroup={isViewer ? groupCtl?.toggle : undefined}
      />
    </Box>
  );

  if (isViewer) return panel;

  return (
    <Box className="tk-doc-sequence" sx={{ my: 0.5 }}>
      {panel}
      <DiagramLightbox open={lbOpen} onClose={() => setLbOpen(false)} kind="sequence" payload={payload} />
    </Box>
  );
}

/** Registra el tipo `sequence` para el visor general (DiagramLightbox / ruta `d`). */
const SequenceDiagramViewer = ({ payload, turtle, groupCtl }) => (
  <TkDocSequence payload={payload} variant="viewer" turtle={turtle} groupCtl={groupCtl} />
);
registerDiagramKind("sequence", SequenceDiagramViewer);
registerDiagramKind("sequence-diagram", SequenceDiagramViewer);
