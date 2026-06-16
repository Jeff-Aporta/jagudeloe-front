import { getReact, getMaterialUI } from "../core/runtime.ts";
import {
  computeSequenceLayout,
  sequenceSpecFromPayload,
  sequenceThemeDark,
  sequenceThemeLight,
  tk1431662SequenceSpec,
} from "../core/tk-sequence.ts";

const { useMemo, useRef, useState, useCallback } = getReact();

function iconifyUrl(icon, color) {
  const path = icon.includes(":") ? icon.replace(":", "/") : `mdi/${icon}`;
  return `https://api.iconify.design/${path}.svg?color=${encodeURIComponent(color)}`;
}

function TkDocSequenceSvg({ layout, theme, dark, hoverId, onMsgEnter, onMsgLeave }) {
  const { width: W, height: H, actors, lifelines, messages, altBox, title, subtitle, titleY, subtitleY } = layout;
  const uid = useMemo(() => `tk-seq-neon-${Math.random().toString(36).slice(2, 9)}`, []);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={title || "Diagrama de secuencia"}
      className="tk-doc-sequence-svg"
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
          <polygon points="0,0 8,4 0,8" fill={theme.accent} />
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

      {actors.map((a) => {
        const bw = a.kind === "actor" ? 92 : 108;
        const bx = a.x - bw / 2;
        const active = hoverId && messages.some((m) => m.id === hoverId && (m.fromX === a.x || m.toX === a.x));
        return (
          <g key={a.id} className={`tk-doc-seq-actor${active ? " is-active" : ""}`}>
            <rect
              x={bx}
              y={a.y - 14}
              width={bw}
              height={36}
              rx="8"
              fill={theme.panel}
              stroke={a.color}
              strokeWidth={active ? 2 : 1.2}
              filter={active ? `url(#${uid}-glow)` : undefined}
            />
            <image href={iconifyUrl(a.icon, a.color)} x={a.x - (a.kind === "actor" ? 28 : 24)} y={a.y - 10} width="16" height="16" />
            <text
              x={a.x + (a.kind === "actor" ? -6 : 2)}
              y={a.y + 8}
              textAnchor="middle"
              fill={theme.text}
              fontSize="11"
              fontWeight="700"
              fontFamily="Tahoma,Arial,sans-serif"
            >
              {a.label}
            </text>
          </g>
        );
      })}

      {lifelines.map((l) => (
        <line
          key={l.id}
          x1={l.x}
          y1={l.y1}
          x2={l.x}
          y2={l.y2}
          stroke={theme.grid}
          strokeWidth="1.2"
          strokeDasharray="5 4"
          className="tk-doc-seq-lifeline"
        />
      ))}

      {altBox && (
        <g className="tk-doc-seq-alt">
          <rect
            x={altBox.x}
            y={altBox.y}
            width={altBox.w}
            height={altBox.h}
            rx="10"
            fill={theme.altFill}
            stroke={theme.altBorder}
            strokeWidth="1.2"
            strokeDasharray="6 4"
          />
          <text x={altBox.x + 10} y={altBox.y + 14} fill={theme.accent} fontSize="10" fontWeight="700" fontFamily="Tahoma,Arial,sans-serif">
            {altBox.label}
          </text>
        </g>
      )}

      {messages.map((m) => {
        const active = hoverId === m.id;
        const dim = hoverId && !active;
        const dash = m.kind === "async" ? "6 4" : undefined;
        return (
          <g
            key={m.id}
            className={`tk-doc-seq-msg${active ? " is-active" : ""}${dim ? " is-dim" : ""}`}
            onMouseEnter={() => onMsgEnter?.(m)}
            onMouseLeave={() => onMsgLeave?.()}
            style={{ cursor: "pointer" }}
          >
            {m.branchFirst && m.branch && (
              <text x={altBox ? altBox.x + 14 : 20} y={m.y - 6} fill={theme.muted} fontSize="9" fontFamily="Tahoma,Arial,sans-serif">
                [{m.branch}]
              </text>
            )}
            <circle cx="18" cy={m.y} r="9" fill={theme.accent} opacity={active ? 1 : 0.92} filter={active ? `url(#${uid}-glow-strong)` : undefined} />
            <text x="18" y={m.y + 4} textAnchor="middle" fill="#fff" fontSize="9" fontWeight="700" fontFamily="Tahoma,Arial,sans-serif">
              {m.step}
            </text>
            <path
              d={m.path}
              fill="none"
              stroke={theme.accent}
              strokeWidth={active ? 2.4 : 1.6}
              strokeDasharray={dash}
              markerEnd={m.kind !== "self" ? `url(#${uid}-arrow)` : undefined}
              filter={active ? `url(#${uid}-glow)` : undefined}
            />
            {m.kind === "self" && (
              <polygon points={`${m.toX + 56},${m.y} ${m.toX + 6},${m.y - 2} ${m.toX + 6},${m.y + 2}`} fill={theme.accent} />
            )}
            <rect
              x={W / 2 - 172}
              y={m.y - 12}
              width="344"
              height="24"
              rx="5"
              fill={active ? (dark ? "rgba(30,144,255,0.18)" : "rgba(30,144,255,0.1)") : theme.panel}
              stroke={active ? theme.accent : theme.border}
              strokeWidth={active ? 1.4 : 0.8}
            />
            <text x={W / 2} y={m.y + 4} textAnchor="middle" fill={theme.text} fontSize="10" fontFamily="Consolas,Menlo,monospace">
              {m.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function TkDocSequence({ payload }) {
  const { Box, Typography, useTheme } = getMaterialUI();
  const theme = useTheme();
  const dark = theme.palette.mode === "dark";
  const containerRef = useRef(null);
  const [hoverMsg, setHoverMsg] = useState(null);
  const [cursor, setCursor] = useState({ x: 0, y: 0, active: false });

  const spec = useMemo(() => {
    if (payload?.preset === "tk1431662") return tk1431662SequenceSpec();
    return sequenceSpecFromPayload(payload ?? {});
  }, [payload]);

  const seqTheme = useMemo(() => (dark ? sequenceThemeDark() : sequenceThemeLight()), [dark]);
  const layout = useMemo(() => (spec ? computeSequenceLayout(spec) : null), [spec]);

  const onPointerMove = useCallback((e) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setCursor({ x: e.clientX - rect.left, y: e.clientY - rect.top, active: true });
  }, []);

  const onPointerLeave = useCallback(() => {
    setCursor((c) => ({ ...c, active: false }));
    setHoverMsg(null);
  }, []);

  if (!spec || !layout) {
    return (
      <Typography variant="body2" color="text.secondary">
        Diagrama de secuencia no disponible (payload inválido).
      </Typography>
    );
  }

  const caption = payload?.caption ?? payload?.note ?? "";

  return (
    <Box className="tk-doc-sequence" sx={{ my: 0.5 }}>
      <Box
        ref={containerRef}
        className={`tk-doc-sequence-neon${cursor.active ? " is-active" : ""}${hoverMsg ? " is-hover-msg" : ""}`}
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
        {hoverMsg && (
          <Box className="tk-doc-chart-tooltip" sx={{ left: cursor.x, top: Math.max(8, cursor.y - 52) }}>
            <Typography component="span" variant="caption" sx={{ fontWeight: 700, display: "block" }}>
              Paso {hoverMsg.step}
            </Typography>
            <Typography component="span" variant="caption" color="text.secondary" sx={{ display: "block", fontFamily: "monospace" }}>
              {hoverMsg.label}
            </Typography>
          </Box>
        )}
        <TkDocSequenceSvg
          layout={layout}
          theme={seqTheme}
          dark={dark}
          hoverId={hoverMsg?.id ?? null}
          onMsgEnter={setHoverMsg}
          onMsgLeave={() => setHoverMsg(null)}
        />
      </Box>
      {caption && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
          {String(caption)}
        </Typography>
      )}
    </Box>
  );
}
