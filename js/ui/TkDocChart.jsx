import { getReact, getMaterialUI } from "../core/platform.ts";
import {
  chartSpecFromPayload,
  computeChartLayout,
  chartThemeDark,
  chartThemeLight,
} from "../core/tk-chart.ts";

const { useMemo, useRef, useState, useCallback } = getReact();

function fmtNum(n) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function TkDocChartSvg({ layout, theme, dark, hoverId, onBarEnter, onBarLeave }) {
  const {
    width: W,
    height: H,
    padL,
    padR,
    padT,
    bars,
    grid,
    legend,
    xLabels,
    title,
    subtitle,
    titleY,
    subtitleY,
    yAxisLabel,
    showValues,
  } = layout;
  const uid = useMemo(() => `tk-neon-${Math.random().toString(36).slice(2, 9)}`, []);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={title || "Gráfico de métricas"}
      className="tk-doc-chart-svg"
      style={{ width: "100%", height: "auto", display: "block", marginInline: "auto" }}
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
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1.2 0"
            result="glow"
          />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id={`${uid}-panel`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={dark ? "rgba(30,144,255,0.08)" : "rgba(30,144,255,0.04)"} />
          <stop offset="100%" stopColor={theme.panel} />
        </linearGradient>
      </defs>

      <rect
        x="0"
        y="0"
        width={W}
        height={H}
        rx="12"
        fill={`url(#${uid}-panel)`}
        stroke={theme.border}
        strokeWidth="1"
        className="tk-doc-chart-panel"
      />

      {title && (
        <text
          x={W / 2}
          y={titleY}
          textAnchor="middle"
          fill={theme.text}
          fontSize="13"
          fontWeight="700"
          fontFamily="Tahoma,Arial,sans-serif"
          className="tk-doc-chart-title"
        >
          {title}
        </text>
      )}
      {subtitle && (
        <text
          x={W / 2}
          y={subtitleY}
          textAnchor="middle"
          fill={theme.muted}
          fontSize="11"
          fontFamily="Tahoma,Arial,sans-serif"
        >
          {subtitle}
        </text>
      )}

      {legend.map((item) => (
        <g key={`${item.label}-${item.x}`}>
          <rect x={item.x} y={item.y - 8} width="10" height="10" rx="2" fill={item.color} opacity="0.95" />
          <text x={item.x + 14} y={item.y} fill={theme.muted} fontSize="10" fontFamily="Tahoma,Arial,sans-serif">
            {item.label}
          </text>
        </g>
      ))}

      {grid.map(({ y, val }) => (
        <g key={y}>
          <line
            x1={padL}
            y1={y}
            x2={W - padR}
            y2={y}
            stroke={theme.grid}
            strokeWidth="1"
            className="tk-doc-chart-grid"
          />
          <text
            x={padL - 6}
            y={y + 4}
            textAnchor="end"
            fill={theme.muted}
            fontSize="9"
            fontFamily="Tahoma,Arial,sans-serif"
          >
            {fmtNum(val)}
          </text>
        </g>
      ))}

      {yAxisLabel && (
        <text
          x="14"
          y={padT + layout.plotH / 2}
          transform={`rotate(-90 14 ${padT + layout.plotH / 2})`}
          textAnchor="middle"
          fill={theme.muted}
          fontSize="10"
          fontFamily="Tahoma,Arial,sans-serif"
        >
          {yAxisLabel}
        </text>
      )}

      {bars.map((bar) => {
        const active = hoverId === bar.id;
        const dim = hoverId && hoverId !== bar.id;
        return (
          <g key={bar.id} className={`tk-doc-chart-bar-group${dim ? " is-dim" : ""}${active ? " is-active" : ""}`}>
            <rect
              x={bar.x}
              y={bar.y}
              width={bar.w}
              height={bar.h}
              rx="3"
              fill={bar.color}
              className="tk-doc-chart-bar-glow"
              opacity={active ? 1 : 0.88}
              filter={active ? `url(#${uid}-glow-strong)` : `url(#${uid}-glow)`}
              onMouseEnter={() => onBarEnter(bar)}
              onMouseLeave={onBarLeave}
              style={{ cursor: "pointer" }}
            />
            <rect
              x={bar.x}
              y={bar.y}
              width={bar.w}
              height={bar.h}
              rx="3"
              fill="transparent"
              onMouseEnter={() => onBarEnter(bar)}
              onMouseLeave={onBarLeave}
              style={{ cursor: "pointer" }}
            />
            {showValues && bar.h > 12 && (
              <text
                x={bar.x + bar.w / 2}
                y={bar.y - 4}
                textAnchor="middle"
                fill={theme.text}
                fontSize="9"
                fontWeight="600"
                fontFamily="Tahoma,Arial,sans-serif"
                pointerEvents="none"
                opacity={active ? 1 : 0.85}
              >
                {fmtNum(bar.value)}
              </text>
            )}
          </g>
        );
      })}

      {xLabels.map(({ x, y, text, rotate }) =>
        rotate ? (
          <text
            key={`${text}-${x}`}
            x={x}
            y={y}
            transform={`rotate(-${rotate} ${x} ${y})`}
            textAnchor="end"
            fill={theme.muted}
            fontSize="9"
            fontFamily="Tahoma,Arial,sans-serif"
          >
            {text}
          </text>
        ) : (
          <text
            key={`${text}-${x}`}
            x={x}
            y={y}
            textAnchor="middle"
            fill={theme.muted}
            fontSize="9"
            fontFamily="Tahoma,Arial,sans-serif"
          >
            {text}
          </text>
        ),
      )}
    </svg>
  );
}

export function TkDocChart({ payload }) {
  const { Box, Typography, useTheme } = getMaterialUI();
  const theme = useTheme();
  const dark = theme.palette.mode === "dark";
  const containerRef = useRef(null);
  const [hoverBar, setHoverBar] = useState(null);
  const [cursor, setCursor] = useState({ x: 0, y: 0, active: false });

  const spec = useMemo(() => chartSpecFromPayload(payload ?? {}), [payload]);
  const chartTheme = useMemo(() => (dark ? chartThemeDark() : chartThemeLight()), [dark]);
  const layout = useMemo(() => (spec ? computeChartLayout(spec) : null), [spec]);

  const onPointerMove = useCallback((e) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setCursor({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      active: true,
    });
  }, []);

  const onPointerLeave = useCallback(() => {
    setCursor((c) => ({ ...c, active: false }));
    setHoverBar(null);
  }, []);

  if (!spec || !layout) {
    return (
      <Typography variant="body2" color="text.secondary">
        Gráfico no disponible (payload inválido).
      </Typography>
    );
  }

  const caption = payload?.caption ?? payload?.note ?? "";

  return (
    <Box className="tk-doc-chart" sx={{ my: 0.5, textAlign: "center" }}>
      <Box
        ref={containerRef}
        className={`tk-doc-chart-neon${cursor.active ? " is-active" : ""}${hoverBar ? " is-hover-bar" : ""}`}
        onMouseMove={onPointerMove}
        onMouseLeave={onPointerLeave}
        sx={{
          position: "relative",
          width: "100%",
          maxWidth: layout.width,
          mx: "auto",
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
        {hoverBar && (
          <Box className="tk-doc-chart-tooltip" sx={{ left: cursor.x, top: Math.max(8, cursor.y - 48) }}>
            <Typography component="span" variant="caption" sx={{ fontWeight: 700, display: "block" }}>
              {hoverBar.label}
            </Typography>
            <Typography component="span" variant="caption" color="text.secondary" sx={{ display: "block" }}>
              {hoverBar.seriesLabel}: {fmtNum(hoverBar.value)}
            </Typography>
          </Box>
        )}
        <TkDocChartSvg
          layout={layout}
          theme={chartTheme}
          dark={dark}
          hoverId={hoverBar?.id ?? null}
          onBarEnter={setHoverBar}
          onBarLeave={() => setHoverBar(null)}
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
