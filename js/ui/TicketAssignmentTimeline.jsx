/* Diagrama Gantt: asignación temporal de todos los TK. */
import { getReact, getMaterialUI } from "../core/runtime.ts";
import {
  TIMELINE_CONCURRENCY_H,
  TIMELINE_HEADER_H,
  TIMELINE_LABEL_W,
  TIMELINE_PALETTE,
  TIMELINE_ROW_H,
  buildTimelineChartForRange,
  formatAxisDate,
  formatAxisDateTime,
  formatRangeDuration,
  getTimelineFullDomain,
  timelineRangeFromPreset,
  timelineSliderStep,
  xForTime,
} from "../core/tk-timeline-chart.ts";
import { useGlassColors, glassCardSx } from "./glassSurface.ts";

const CHART_W = 920;
const RANGE_STRIP_H = 22;
const TAB_IDS = [
  { id: "total", label: "Total" },
  { id: "30d", label: "30 días recientes" },
  { id: "abr-may", label: "Abr / May 2026" },
];

function useColors() {
  const c = useGlassColors();
  const { useTheme } = getMaterialUI();
  const dark = useTheme().palette.mode === "dark";
  return {
    ...c,
    grid: dark ? "rgba(158,197,235,0.12)" : "rgba(10,37,64,0.08)",
    conc: dark ? "rgba(30,144,255,0.45)" : "rgba(30,144,255,0.35)",
  };
}

function timelineSvgSize(rowCount) {
  return {
    w: TIMELINE_LABEL_W + CHART_W + 8,
    h: TIMELINE_HEADER_H + TIMELINE_CONCURRENCY_H + rowCount * TIMELINE_ROW_H + 8,
  };
}

function TimelineSvg({ data, colors: c }) {
  const rows = data.rows;
  const { tMin, tMax } = data.filter;
  const { w: svgW, h: svgH } = timelineSvgSize(rows.length);

  const ticks = 8;
  const tickTimes = Array.from({ length: ticks + 1 }, (_, i) => tMin + ((tMax - tMin) * i) / ticks);

  const concPts = data.concurrency
    .map((p) => {
      const x = TIMELINE_LABEL_W + xForTime(p.t, tMin, tMax, CHART_W);
      const y = TIMELINE_HEADER_H + TIMELINE_CONCURRENCY_H - (data.maxConcurrency > 0 ? (p.count / data.maxConcurrency) * (TIMELINE_CONCURRENCY_H - 6) : 0);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${svgW} ${svgH}`}
      width="100%"
      height={svgH}
      preserveAspectRatio="xMinYMin meet"
      style={{ display: "block", fontFamily: "IBM Plex Sans, sans-serif" }}
    >
      {tickTimes.map((t) => {
        const x = TIMELINE_LABEL_W + xForTime(t, tMin, tMax, CHART_W);
        return (
          <g key={t}>
            <line x1={x} y1={TIMELINE_HEADER_H - 4} x2={x} y2={svgH} stroke={c.grid} strokeWidth={1} />
            <text x={x} y={14} textAnchor="middle" fill={c.muted} fontSize={10}>
              {formatAxisDate(t)}
            </text>
          </g>
        );
      })}

      <text x={4} y={TIMELINE_HEADER_H + 10} fill={c.muted} fontSize={9}>
        #
      </text>
      {data.maxConcurrency > 0 && concPts && (
        <>
          <polyline points={concPts} fill="none" stroke={c.conc} strokeWidth={1.5} />
          <polygon
            points={`${TIMELINE_LABEL_W},${TIMELINE_HEADER_H + TIMELINE_CONCURRENCY_H} ${concPts} ${TIMELINE_LABEL_W + CHART_W},${TIMELINE_HEADER_H + TIMELINE_CONCURRENCY_H}`}
            fill={c.conc}
            opacity={0.25}
          />
        </>
      )}
      <line
        x1={TIMELINE_LABEL_W}
        y1={TIMELINE_HEADER_H + TIMELINE_CONCURRENCY_H}
        x2={TIMELINE_LABEL_W + CHART_W}
        y2={TIMELINE_HEADER_H + TIMELINE_CONCURRENCY_H}
        stroke={c.border}
      />

      {rows.map((row, i) => {
        const y = TIMELINE_HEADER_H + TIMELINE_CONCURRENCY_H + i * TIMELINE_ROW_H;
        const pal = row.tieneDesfase ? TIMELINE_PALETTE.desfase : TIMELINE_PALETTE.normal;
        const espera = pal.inicio;
        const activa = pal.atencion;
        const solucion = pal.solucion;
        const creX = TIMELINE_LABEL_W + xForTime(row.creMs, tMin, tMax, CHART_W);
        const iniX = row.iniMs != null ? TIMELINE_LABEL_W + xForTime(row.iniMs, tMin, tMax, CHART_W) : creX;
        const finX = row.finMs != null ? TIMELINE_LABEL_W + xForTime(row.finMs, tMin, tMax, CHART_W) : iniX;
        const clipStart = Math.max(row.creMs, tMin);
        const clipIni = row.iniMs != null ? Math.max(row.iniMs, tMin) : null;
        const clipFin = Math.min(row.finMs ?? row.creMs, tMax);

        const segSolL = TIMELINE_LABEL_W + xForTime(clipStart, tMin, tMax, CHART_W);
        const segSolR = TIMELINE_LABEL_W + xForTime(clipFin, tMin, tMax, CHART_W);
        const seg1L = segSolL;
        const seg1R = clipIni != null
          ? TIMELINE_LABEL_W + xForTime(Math.min(clipIni, clipFin), tMin, tMax, CHART_W)
          : segSolR;
        const seg2L = seg1R;
        const seg2R = segSolR;

        const barY = y + 3;
        const barH = TIMELINE_ROW_H - 6;
        const title = `${row.iticket} · ${row.titulo}${row.abierto ? " (abierto)" : ""}`;

        return (
          <g key={row.iticket}>
            <text x={4} y={y + 11} fill={c.text} fontSize={9} fontWeight={row.tieneDesfase ? 700 : 500}>
              {row.shortId}
            </text>
            {segSolR > segSolL && (
              <rect
                x={segSolL}
                y={barY + barH - 3}
                width={Math.max(1, segSolR - segSolL)}
                height={3}
                fill={solucion}
                opacity={0.35}
                rx={0.5}
              >
                <title>{title} · T. solución total (cre → {row.abierto ? "ahora" : "cierre"})</title>
              </rect>
            )}
            {seg1R > seg1L && (
              <rect x={seg1L} y={barY} width={Math.max(1, seg1R - seg1L)} height={barH - 3} fill={espera} opacity={0.92} rx={1}>
                <title>{title} · T. inicio / espera (cre → ini)</title>
              </rect>
            )}
            {seg2R > seg2L && clipIni != null && (
              <rect
                x={seg2L}
                y={barY}
                width={Math.max(1, seg2R - seg2L)}
                height={barH - 3}
                fill={activa}
                opacity={row.abierto ? 0.55 : 0.92}
                rx={1}
                stroke={row.abierto ? pal.abierto : "none"}
                strokeWidth={row.abierto ? 1 : 0}
                strokeDasharray={row.abierto ? "3 2" : undefined}
              >
                <title>{title} · T. atención activa (ini → {row.abierto ? "ahora" : "cierre"})</title>
              </rect>
            )}
            {creX >= TIMELINE_LABEL_W && creX <= TIMELINE_LABEL_W + CHART_W && (
              <line x1={creX} y1={y + 1} x2={creX} y2={y + TIMELINE_ROW_H - 1} stroke={espera} strokeWidth={2} opacity={0.9}>
                <title>{row.iticket} · Creación</title>
              </line>
            )}
            {row.iniMs != null && iniX >= TIMELINE_LABEL_W && iniX <= TIMELINE_LABEL_W + CHART_W && (
              <line x1={iniX} y1={y + 1} x2={iniX} y2={y + TIMELINE_ROW_H - 1} stroke={activa} strokeWidth={2} opacity={0.95}>
                <title>{row.iticket} · Inicio atención</title>
              </line>
            )}
            {row.finMs != null && !row.abierto && finX >= TIMELINE_LABEL_W && finX <= TIMELINE_LABEL_W + CHART_W && (
              <circle cx={finX} cy={y + TIMELINE_ROW_H / 2} r={3} fill={solucion} stroke={c.cardBg} strokeWidth={1}>
                <title>{row.iticket} · Cierre / solución</title>
              </circle>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function RangeOverviewStrip({ allRows, domain, range, colors: c }) {
  const { Box } = getMaterialUI();
  const { tMin, tMax } = domain;
  const [r0, r1] = range;
  const span = tMax - tMin;
  if (!allRows.length || span <= 0) return null;

  const selL = ((Math.min(r0, r1) - tMin) / span) * 100;
  const selW = (Math.abs(r1 - r0) / span) * 100;

  return (
    <Box
      sx={{
        position: "relative",
        height: RANGE_STRIP_H,
        mb: 0.5,
        borderRadius: 1,
        bgcolor: c.grid,
        border: `1px solid ${c.border}`,
        overflow: "hidden",
      }}
    >
      {allRows.map((row) => {
        const fin = row.finMs ?? row.creMs;
        const left = ((row.creMs - tMin) / span) * 100;
        const width = Math.max(0.4, ((fin - row.creMs) / span) * 100);
        const bg = row.tieneDesfase ? TIMELINE_PALETTE.desfase.atencion : TIMELINE_PALETTE.normal.atencion;
        return (
          <Box
            key={row.iticket}
            title={`${row.iticket} · ${row.titulo}`}
            sx={{
              position: "absolute",
              left: `${left}%`,
              width: `${width}%`,
              top: 4,
              height: 3,
              bgcolor: bg,
              opacity: 0.65,
              borderRadius: 0.5,
            }}
          />
        );
      })}
      <Box
        sx={{
          position: "absolute",
          left: `${selL}%`,
          width: `${selW}%`,
          top: 0,
          bottom: 0,
          border: `2px solid ${c.conc}`,
          bgcolor: "rgba(30,144,255,0.12)",
          pointerEvents: "none",
          boxSizing: "border-box",
        }}
      />
    </Box>
  );
}

function DateRangeSelector({ domain, range, onRangeChange, preset, onPresetChange, colors: c }) {
  const { Stack, Typography, Slider, ToggleButton, ToggleButtonGroup, Box } = getMaterialUI();
  const step = timelineSliderStep(domain.tMin, domain.tMax);
  const minGap = Math.max(step, (domain.tMax - domain.tMin) * 0.005);

  const handleSlider = (_, value, activeThumb) => {
    if (!Array.isArray(value)) return;
    let [a, b] = value;
    if (b - a < minGap) {
      if (activeThumb === 0) a = Math.max(domain.tMin, b - minGap);
      else b = Math.min(domain.tMax, a + minGap);
    }
    a = Math.max(domain.tMin, Math.min(a, domain.tMax));
    b = Math.max(domain.tMin, Math.min(b, domain.tMax));
    onPresetChange(null);
    onRangeChange([Math.min(a, b), Math.max(a, b)]);
  };

  const handlePreset = (_, id) => {
    if (!id) return;
    onPresetChange(id);
    const next = timelineRangeFromPreset(id, domain.rows);
    onRangeChange([next.tMin, next.tMax]);
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
        <ToggleButtonGroup size="small" exclusive value={preset ?? ""} onChange={handlePreset}>
          {TAB_IDS.map((t) => (
            <ToggleButton key={t.id} value={t.id} sx={{ color: c.text, textTransform: "none" }}>
              {t.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <Typography variant="caption" sx={{ color: c.muted }}>
          {preset ? TAB_IDS.find((t) => t.id === preset)?.label : "Rango personalizado"}
          {" · "}{formatRangeDuration(range[0], range[1])}
        </Typography>
      </Stack>

      <RangeOverviewStrip allRows={domain.rows} domain={domain} range={range} colors={c} />

      <Stack direction="row" spacing={2} alignItems="center" sx={{ px: 0.5 }}>
        <Typography variant="caption" sx={{ color: c.muted, minWidth: 118, fontSize: "0.68rem", lineHeight: 1.25 }}>
          {formatAxisDateTime(range[0])}
        </Typography>
        <Slider
          value={range}
          onChange={handleSlider}
          min={domain.tMin}
          max={domain.tMax}
          step={step}
          disableSwap
          valueLabelDisplay="auto"
          valueLabelFormat={(v) => formatAxisDate(v)}
          sx={{
            flex: 1,
            color: c.conc,
            "& .MuiSlider-thumb": { width: 14, height: 14 },
            "& .MuiSlider-rail": { opacity: 0.35 },
          }}
        />
        <Typography variant="caption" sx={{ color: c.muted, minWidth: 118, textAlign: "right", fontSize: "0.68rem", lineHeight: 1.25 }}>
          {formatAxisDateTime(range[1])}
        </Typography>
      </Stack>
    </Box>
  );
}

function Legend({ colors: c }) {
  const { Stack, Typography, Box } = getMaterialUI();
  const items = [
    { color: TIMELINE_PALETTE.normal.inicio, label: "T. inicio (cre → ini)" },
    { color: TIMELINE_PALETTE.normal.atencion, label: "T. atención (ini → cierre)" },
    { color: TIMELINE_PALETTE.normal.solucion, label: "T. solución (franja + cierre)" },
    { color: TIMELINE_PALETTE.desfase.inicio, label: "Desfase · inicio" },
    { color: TIMELINE_PALETTE.desfase.atencion, label: "Desfase · atención" },
  ];
  return (
    <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
      {items.map((it) => (
        <Stack key={it.label} direction="row" spacing={0.5} alignItems="center">
          <Box sx={{ width: 12, height: 8, bgcolor: it.color, borderRadius: 0.5 }} />
          <Typography variant="caption" sx={{ color: c.muted }}>{it.label}</Typography>
        </Stack>
      ))}
      <Typography variant="caption" sx={{ color: c.muted }}>
        Banda superior = TK asignados en paralelo · 15 px por fila
      </Typography>
    </Stack>
  );
}

export function TicketAssignmentTimeline({ tickets, project }) {
  const c = useColors();
  const { useState, useMemo, useEffect } = getReact();
  const { Paper, Typography, Box } = getMaterialUI();

  const domain = useMemo(
    () => getTimelineFullDomain(tickets, project),
    [tickets, project],
  );

  const defaultRange = useMemo(() => {
    const next = timelineRangeFromPreset("total", domain.rows);
    return [next.tMin, next.tMax];
  }, [domain.tMin, domain.tMax, domain.rows.length]);

  const [preset, setPreset] = useState("total");
  const [range, setRange] = useState(defaultRange);

  useEffect(() => {
    setPreset("total");
    setRange(defaultRange);
  }, [defaultRange]);

  const viewRange = range[1] > range[0] ? range : defaultRange;

  const data = useMemo(
    () => buildTimelineChartForRange(domain.rows, viewRange[0], viewRange[1], preset ?? "custom"),
    [domain.rows, viewRange, preset],
  );

  return (
    <Paper variant="outlined" sx={glassCardSx(c, { p: 2, mb: 3 })}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: c.text, mb: 0.5 }}>
        Asignación temporal · todos los tickets
      </Typography>
      <Typography variant="body2" sx={{ color: c.muted, mb: 1.5, lineHeight: 1.45 }}>
        Eje Y: ticket · Eje X: tiempo. La banda superior muestra cuántos TK tenías asignados a la vez (creación → cierre).
        {" "}{data.rows.length} TK · pico {data.maxConcurrency} simultáneos.
      </Typography>

      <DateRangeSelector
        domain={domain}
        range={range}
        onRangeChange={setRange}
        preset={preset}
        onPresetChange={setPreset}
        colors={c}
      />

      <Legend colors={c} />

      {!data.rows.length ? (
        <Typography variant="body2" sx={{ color: c.muted }}>Sin tickets en este rango.</Typography>
      ) : (
        <Box sx={{ width: "100%", overflow: "visible" }}>
          <TimelineSvg data={data} colors={c} />
        </Box>
      )}
    </Paper>
  );
}
