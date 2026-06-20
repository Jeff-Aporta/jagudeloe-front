import { getReact, getMaterialUI } from "../core/platform.ts";
import { LightboxZoomInline } from "./ImageLightbox.jsx";
import {
  computeFlowLayout,
  flowSpecFromPayload,
  flowThemeDark,
  flowThemeLight,
  tk1437191FlowSpec,
} from "../core/tk-flow.ts";
import { inlineMdWeb } from "./tkHtml.ts";
import { iconifyApiUrl } from "../core/tk-iconify-inline.ts";
import { tkHueToHex } from "../core/tk-hue.ts";

const { useMemo, useRef, useState, useCallback } = getReact();

function nodeRadius(shape) {
  if (shape === "terminal") return 18;
  if (shape === "diamond") return 4;
  return 12;
}

function DiagramEdgeLabel({ label, labelX, labelY, theme, dark }) {
  if (!label) return null;
  if (label.includes("{{")) {
    return (
      <>
        <rect
          x={labelX - 56}
          y={labelY - 10}
          width="112"
          height="18"
          rx="5"
          fill={dark ? "rgba(15,23,42,0.82)" : "rgba(255,255,255,0.92)"}
          stroke={theme.border}
          strokeWidth="0.8"
        />
        <foreignObject x={labelX - 56} y={labelY - 10} width="112" height="18" overflow="visible">
          <div
            xmlns="http://www.w3.org/1999/xhtml"
            className="tk-doc-flow-label tk-doc-markdown"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              height: "100%",
              fontSize: 9,
              fontFamily: "Tahoma, Arial, sans-serif",
              color: theme.edgeLabel,
              lineHeight: 1.1,
            }}
            dangerouslySetInnerHTML={{ __html: inlineMdWeb(label) }}
          />
        </foreignObject>
      </>
    );
  }
  return (
    <>
      <rect
        x={labelX - 52}
        y={labelY - 10}
        width="104"
        height="18"
        rx="5"
        fill={dark ? "rgba(15,23,42,0.82)" : "rgba(255,255,255,0.92)"}
        stroke={theme.border}
        strokeWidth="0.8"
      />
      <text x={labelX} y={labelY + 3} textAnchor="middle" fill={theme.edgeLabel} fontSize="9" fontFamily="Tahoma,Arial,sans-serif">
        {label}
      </text>
    </>
  );
}

function TkDocFlowSvg({ layout, theme, dark, hoverId, onNodeEnter, onNodeLeave }) {
  const { width: W, height: H, nodes, edges, title, subtitle, titleY, subtitleY } = layout;
  const uid = useMemo(() => `tk-flow-neon-${Math.random().toString(36).slice(2, 9)}`, []);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={title || "Diagrama de flujo"}
      className="tk-doc-flow-svg"
      style={{ width: "100%", maxWidth: W, height: "auto", display: "block" }}
    >
      <defs>
        <filter id={`${uid}-glow`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={`${uid}-glow-strong`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="4.5" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1.15 0"
            result="glow"
          />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id={`${uid}-panel`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={dark ? "rgba(30,144,255,0.1)" : "rgba(30,144,255,0.05)"} />
          <stop offset="100%" stopColor={theme.panel} />
        </linearGradient>
        <marker id={`${uid}-arrow`} markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <polygon points="0,0 8,4 0,8" fill={theme.edge} />
        </marker>
      </defs>

      <rect x="0" y="0" width={W} height={H} rx="12" fill={`url(#${uid}-panel)`} stroke={theme.border} strokeWidth="1" />

      {title && (
        <text x={W / 2} y={titleY} textAnchor="middle" fill={theme.text} fontSize="13" fontWeight="700" fontFamily="Tahoma,Arial,sans-serif">
          {title}
        </text>
      )}
      {subtitle && (
        <text x={W / 2} y={subtitleY} textAnchor="middle" fill={theme.muted} fontSize="11" fontFamily="Tahoma,Arial,sans-serif">
          {subtitle}
        </text>
      )}

      {edges.map((edge) => {
        const active = hoverId && (hoverId === edge.fromId || hoverId === edge.toId);
        const dim = hoverId && !active;
        return (
          <g key={edge.id} className={`tk-doc-flow-edge${active ? " is-active" : ""}${dim ? " is-dim" : ""}`}>
            <path
              d={edge.path}
              fill="none"
              stroke={theme.edge}
              strokeWidth={active ? 2.4 : 1.6}
              strokeDasharray={edge.dashed ? "6 4" : undefined}
              markerEnd={`url(#${uid}-arrow)`}
              filter={active ? `url(#${uid}-glow)` : undefined}
            />
            {edge.label && <DiagramEdgeLabel label={edge.label} labelX={edge.labelX} labelY={edge.labelY} theme={theme} dark={dark} />}
          </g>
        );
      })}

      {nodes.map((node) => {
        const active = hoverId === node.id;
        const dim = hoverId && hoverId !== node.id;
        const rx = nodeRadius(node.shape);
        const textStartY = node.y + 22 + (node.lines.length > 1 ? 0 : 4);
        const stroke = tkHueToHex(node.hue) ?? "#64748b";

        return (
          <g
            key={node.id}
            className={`tk-doc-flow-node${active ? " is-active" : ""}${dim ? " is-dim" : ""}`}
            onMouseEnter={() => onNodeEnter?.(node)}
            onMouseLeave={() => onNodeLeave?.()}
            style={{ cursor: "pointer" }}
          >
            <rect
              x={node.x}
              y={node.y}
              width={node.w}
              height={node.h}
              rx={rx}
              fill={dark ? "rgba(15,23,42,0.88)" : "rgba(255,255,255,0.94)"}
              stroke={stroke}
              strokeWidth={active ? 2.2 : 1.4}
              filter={active ? `url(#${uid}-glow-strong)` : `url(#${uid}-glow)`}
            />
            {node.step != null && (
              <>
                <circle cx={node.x + 16} cy={node.y + 16} r="10" fill={stroke} opacity={active ? 1 : 0.92} />
                <text x={node.x + 16} y={node.y + 20} textAnchor="middle" fill="#fff" fontSize="9" fontWeight="700" fontFamily="Tahoma,Arial,sans-serif">
                  {node.step}
                </text>
              </>
            )}
            <image href={iconifyApiUrl(node.icon, node.hue)} x={node.x + node.w - 28} y={node.y + 10} width="16" height="16" />
            {node.lines.map((line, i) => (
              <text
                key={`${node.id}-l-${i}`}
                x={node.x + node.w / 2}
                y={textStartY + i * 14}
                textAnchor="middle"
                fill={theme.text}
                fontSize="10"
                fontWeight={i === 0 ? 700 : 500}
                fontFamily="Tahoma,Arial,sans-serif"
              >
                {line}
              </text>
            ))}
          </g>
        );
      })}
    </svg>
  );
}

function FlowLightboxWrap({ children, caption, alt }) {
  if (!LightboxZoomInline) return children;
  return (
    <LightboxZoomInline caption={caption} alt={alt} className="tk-doc-flow-inline" fullPage>
      {children}
    </LightboxZoomInline>
  );
}

export function TkDocFlow({ payload }) {
  const { Box, Typography, useTheme } = getMaterialUI();
  const theme = useTheme();
  const dark = theme.palette.mode === "dark";
  const containerRef = useRef(null);
  const [hoverNode, setHoverNode] = useState(null);
  const [cursor, setCursor] = useState({ x: 0, y: 0, active: false });

  const spec = useMemo(() => {
    if (payload?.preset === "tk1437191") return tk1437191FlowSpec();
    return flowSpecFromPayload(payload ?? {});
  }, [payload]);

  const flowTheme = useMemo(() => (dark ? flowThemeDark() : flowThemeLight()), [dark]);
  const layout = useMemo(() => (spec ? computeFlowLayout(spec) : null), [spec]);

  const onPointerMove = useCallback((e) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setCursor({ x: e.clientX - rect.left, y: e.clientY - rect.top, active: true });
  }, []);

  const onPointerLeave = useCallback(() => {
    setCursor((c) => ({ ...c, active: false }));
    setHoverNode(null);
  }, []);

  if (!spec || !layout) {
    return (
      <Typography variant="body2" color="text.secondary">
        Diagrama de flujo no disponible (JSON inválido).
      </Typography>
    );
  }

  const caption = payload?.caption ?? payload?.note ?? spec.subtitle ?? "";

  return (
    <Box className="tk-doc-flow" sx={{ my: 0.5 }}>
      <FlowLightboxWrap caption={caption || layout.title || "Diagrama de flujo"} alt={layout.title || "Diagrama de flujo"}>
        <Box
          ref={containerRef}
          className={`tk-doc-flow-neon${cursor.active ? " is-active" : ""}${hoverNode ? " is-hover-node" : ""}`}
          onMouseMove={onPointerMove}
          onMouseLeave={onPointerLeave}
          sx={{
            position: "relative",
            borderRadius: 2,
            overflow: "hidden",
            border: 1,
            borderColor: dark ? "rgba(30,144,255,0.22)" : "rgba(30,144,255,0.14)",
            bgcolor: dark ? "rgba(15,23,42,0.45)" : "#fff",
            boxShadow: dark
              ? "0 0 24px rgba(30,144,255,0.12), inset 0 1px 0 rgba(255,255,255,0.04)"
              : "0 4px 24px rgba(15,23,42,0.06), 0 0 20px rgba(30,144,255,0.06)",
            p: { xs: 1, sm: 1.5 },
            "--chart-cx": `${cursor.x}px`,
            "--chart-cy": `${cursor.y}px`,
          }}
        >
          <Box className="tk-doc-chart-spotlight" aria-hidden />
          {hoverNode && (
            <Box className="tk-doc-chart-tooltip" sx={{ left: cursor.x, top: Math.max(8, cursor.y - 52) }}>
              <Typography component="span" variant="caption" sx={{ fontWeight: 700, display: "block" }}>
                Paso {hoverNode.step ?? "—"}
              </Typography>
              <Typography component="span" variant="caption" color="text.secondary" sx={{ display: "block" }}>
                {hoverNode.label}
              </Typography>
            </Box>
          )}
          <TkDocFlowSvg
            layout={layout}
            theme={flowTheme}
            dark={dark}
            hoverId={hoverNode?.id ?? null}
            onNodeEnter={setHoverNode}
            onNodeLeave={() => setHoverNode(null)}
          />
        </Box>
      </FlowLightboxWrap>
      {caption && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
          {String(caption)}
        </Typography>
      )}
    </Box>
  );
}
