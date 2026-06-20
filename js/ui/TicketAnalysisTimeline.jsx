/* Timeline visual de hitos del ticket (sin Mermaid). */
import { getMaterialUI } from "../core/platform.ts";
import { UI } from "../core/platform.ts";
import { formatMinutos } from "../core/tk-metrics.ts";
import { useGlassColors, glassInnerSx, glassGradient } from "./glassSurface.ts";

function useColors() {
  const base = useGlassColors();
  const { useTheme } = getMaterialUI();
  const dark = useTheme().palette.mode === "dark";
  return {
    ...base,
    rail: dark ? "rgba(158,197,235,0.35)" : "rgba(10,37,64,0.18)",
    dot: "#1e90ff",
    dotDone: "#2e9e5b",
    dotWarn: "#ed6c02",
    dotMuted: dark ? "#4a6278" : "#9aa8b4",
    segHabil: "#1e90ff",
    segExcl: "#ed6c02",
    jornadaIn: "#00bcd4",
    jornadaInBg: dark ? "rgba(0,188,212,0.12)" : "rgba(255,255,255,0.82)",
    jornadaInBorder: dark ? "rgba(0,188,212,0.45)" : "rgba(0,188,212,0.28)",
    jornadaOut: "#d500f9",
    jornadaOutBg: dark ? "rgba(213,0,249,0.12)" : "rgba(255,255,255,0.82)",
    jornadaOutBorder: dark ? "rgba(213,0,249,0.45)" : "rgba(213,0,249,0.26)",
    segGap: dark ? "rgba(158,197,235,0.12)" : "rgba(10,37,64,0.04)",
    chipBg: dark ? "rgba(26, 58, 92, 0.55)" : "rgba(255, 255, 255, 0.86)",
    fecha: dark ? "#9aa8b4" : "#808080",
  };
}

function jornadaTone(ms) {
  if (!ms.esJornada) return null;
  return String(ms.key || "").startsWith("jor-in-") ? "in" : "out";
}

function jornadaColors(ms, c) {
  const tone = jornadaTone(ms);
  if (tone === "in") return { color: c.jornadaIn, border: c.jornadaInBorder, bg: c.jornadaInBg };
  if (tone === "out") return { color: c.jornadaOut, border: c.jornadaOutBorder, bg: c.jornadaOutBg };
  return { color: c.jornadaOut, border: c.jornadaOutBorder, bg: c.jornadaOutBg };
}

function dotColor(ms, c) {
  const j = jornadaTone(ms);
  if (j === "in") return c.jornadaIn;
  if (j === "out") return c.jornadaOut;
  if (ms.esExclusion) return c.dotWarn;
  if (ms.key === "cie") return c.dotDone;
  if (ms.key === "cre") return c.dotMuted;
  return c.dot;
}

function TramoChip({ label, exclusion, jornada, colors: c }) {
  const { Box, Typography } = getMaterialUI();
  const jCol = jornada ? jornadaColors(jornada, c) : null;
  return (
    <Box sx={{ pl: 3.5, py: 0.25 }}>
      <Typography
        variant="caption"
        sx={{
          display: "block",
          fontSize: "0.6875rem",
          lineHeight: 1.3,
          fontWeight: 500,
          color: exclusion ? c.dotWarn : jCol ? jCol.color : c.segHabil,
          fontStyle: "italic",
        }}
      >
        ↳ {label}
      </Typography>
    </Box>
  );
}

function DetailLine({ parts }) {
  const { Typography } = getMaterialUI();
  return (
    <Typography
      component="div"
      sx={{ fontSize: "0.75rem", lineHeight: 1.35, color: "inherit" }}
    >
      {parts.map((part, i) => (
        <span key={i}>
          {i > 0 && (
            <Typography component="span" sx={{ color: part.sepColor || "inherit", opacity: 0.55, mx: 0.4 }}>
              ·
            </Typography>
          )}
          <Typography
            component="span"
            sx={{
              color: part.color,
              fontFamily: part.mono ? "monospace" : "inherit",
              fontWeight: part.bold ? 700 : 400,
              fontStyle: part.italic ? "italic" : "normal",
            }}
          >
            {part.text}
          </Typography>
        </span>
      ))}
    </Typography>
  );
}

function AcumuladoBadge({ ms, colors: c }) {
  const { Box, Typography } = getMaterialUI();
  const jCol = ms.esJornada ? jornadaColors(ms, c) : null;
  const valueColor = jCol ? jCol.color : c.segHabil;

  return (
    <Box sx={{ textAlign: "right", flexShrink: 0, pl: 1, minWidth: 56 }}>
      <Typography
        variant="caption"
        sx={{ display: "block", fontSize: "0.625rem", color: c.muted, lineHeight: 1.1, letterSpacing: 0.2 }}
      >
        Σ hábil
      </Typography>
      <Typography
        sx={{
          fontWeight: 800,
          fontSize: "0.8125rem",
          color: valueColor,
          lineHeight: 1.25,
          fontFamily: "Consolas, Menlo, monospace",
          whiteSpace: "nowrap",
        }}
      >
        {formatMinutos(ms.acumuladoHabilMin ?? 0)}
      </Typography>
    </Box>
  );
}

function TimelineNode({ ms, isLast, colors: c }) {
  const { Box, Stack, Typography } = getMaterialUI();
  const { Icon } = UI;
  const dc = dotColor(ms, c);
  const isJornada = !!ms.esJornada;
  const jCol = isJornada ? jornadaColors(ms, c) : null;
  const titleColor = jCol ? jCol.color : ms.esExclusion ? c.dotWarn : c.text;

  const cardBorder = ms.esExclusion
    ? "rgba(237,108,2,0.4)"
    : jCol
      ? jCol.border
      : c.border;
  const nodeTone = ms.esExclusion
    ? "excl"
    : jCol
      ? jornadaTone(ms) === "in"
        ? "jornadaIn"
        : "jornadaOut"
      : "node";

  const metaParts = [{ text: ms.hora, mono: true, color: jCol ? jCol.color : c.text }];
  return (
    <Box sx={{ position: "relative", pb: isLast ? 0 : 0.35 }}>
      {!isLast && (
        <Box
          sx={{
            position: "absolute",
            left: 6,
            top: 20,
            bottom: 0,
            width: 2,
            bgcolor: ms.esExclusion ? "rgba(237,108,2,0.35)" : jCol ? jCol.border : c.rail,
            borderRadius: 1,
          }}
        />
      )}
      <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ py: 0.15 }}>
        <Box
          sx={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            flexShrink: 0,
            mt: 1.1,
            bgcolor: dc,
            border: 2,
            borderColor: c.cardHi,
            boxShadow: `0 0 0 1px ${dc}55`,
            zIndex: 1,
          }}
        />
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            p: 1.1,
            mb: 0.5,
            borderRadius: 1.5,
            border: 1,
            borderColor: cardBorder,
            ...glassInnerSx(c, nodeTone),
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={0.5} sx={{ mb: 0.35 }}>
            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
              <Icon icon={ms.icon} size={16} style={{ color: titleColor, flexShrink: 0 }} />
              <Typography
                component="span"
                sx={{ fontWeight: 600, color: titleColor, fontSize: "0.875rem", lineHeight: 1.25 }}
              >
                {ms.label}
              </Typography>
            </Stack>
            <AcumuladoBadge ms={ms} colors={c} />
          </Stack>
          <DetailLine parts={metaParts} />
          <Typography
            variant="caption"
            sx={{ display: "block", color: c.fecha, fontSize: "0.75rem", lineHeight: 1.3, mt: 0.25 }}
          >
            {ms.fechaTexto}
          </Typography>
          {ms.nota && (
            <Typography
              variant="caption"
              sx={{
                display: "block",
                color: c.muted,
                fontSize: "0.75rem",
                lineHeight: 1.35,
                mt: 0.35,
                fontStyle: ms.esExclusion || isJornada ? "italic" : "normal",
              }}
            >
              {ms.nota}
            </Typography>
          )}
        </Box>
      </Stack>
    </Box>
  );
}

/** Barra proporcional: solo hábil vs excluido (sin jornada — eso va en la línea de tiempo). */
function ProportionBar({ milestones, colors: c }) {
  const { Box, Stack, Typography } = getMaterialUI();
  const segs = [];
  for (let i = 1; i < milestones.length; i++) {
    const prev = milestones[i - 1];
    const cur = milestones[i];
    if (cur.esJornada) continue;
    const mins = cur.tramoHabilMin ?? 0;
    if (mins <= 0 && !cur.esExclusion) continue;
    const isExcl = cur.esExclusion || (prev.esExclusion && cur.key.startsWith("lunch1"));
    if (cur.esExclusion && cur.key.startsWith("lunch")) {
      segs.push({ mins: 90, excl: true, label: "Almuerzo" });
    } else if (!cur.esExclusion && mins > 0) {
      segs.push({ mins, excl: false, label: cur.label });
    }
  }
  const total = segs.reduce((s, x) => s + x.mins, 0) || 1;

  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography variant="caption" sx={{ color: c.muted, display: "block", mb: 0.75 }}>
        Distribución del tiempo entre hitos (hábil vs excluido)
      </Typography>
      <Stack
        direction="row"
        sx={{
          height: 10,
          borderRadius: 1,
          overflow: "hidden",
          border: 1,
          borderColor: c.border,
          background: glassGradient(c, "default"),
          backdropFilter: "blur(8px)",
        }}
      >
        {segs.map((s, i) => (
          <Box
            key={i}
            title={`${s.label}: ${formatMinutos(s.mins)}`}
            sx={{
              width: `${(s.mins / total) * 100}%`,
              minWidth: s.mins > 0 ? 4 : 0,
              background: s.excl
                ? "linear-gradient(180deg, rgba(237,108,2,0.85), rgba(237,108,2,0.65))"
                : "linear-gradient(180deg, rgba(30,144,255,0.85), rgba(99,102,241,0.65))",
              opacity: 0.92,
            }}
          />
        ))}
      </Stack>
      <Stack direction="row" spacing={2} sx={{ mt: 0.75 }}>
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: c.segHabil }} />
          <Typography variant="caption" sx={{ color: c.muted }}>Hábil</Typography>
        </Stack>
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: c.segExcl }} />
          <Typography variant="caption" sx={{ color: c.muted }}>Excluido</Typography>
        </Stack>
      </Stack>
    </Box>
  );
}

export function TicketAnalysisTimeline({ milestones, resumen }) {
  const c = useColors();
  const { Box, Typography, Stack } = getMaterialUI();

  if (!milestones?.length) {
    return (
      <Typography variant="body2" sx={{ color: c.muted }}>
        Sin hitos para mostrar.
      </Typography>
    );
  }

  const last = milestones[milestones.length - 1];

  return (
    <Box>
      {resumen && (
        <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mb: 1.5 }}>
          {resumen.map((r) => (
            <Box
              key={r.label}
              sx={{
                px: 1,
                py: 0.5,
                borderRadius: 1,
                border: 1,
                borderColor: r.highlight ? "rgba(30,144,255,0.45)" : c.border,
                ...(r.highlight ? glassInnerSx(c, "chip") : { background: "transparent" }),
              }}
            >
              <Typography variant="caption" sx={{ color: c.muted, display: "block", fontSize: "0.6875rem" }}>
                {r.label}
              </Typography>
              <Typography sx={{ fontWeight: 700, color: c.text, fontSize: "0.9rem", lineHeight: 1.2 }}>
                {r.value}
              </Typography>
            </Box>
          ))}
        </Stack>
      )}

      <ProportionBar milestones={milestones} colors={c} />

      <Box sx={{ mt: 1.25 }}>
        {milestones.map((ms, i) => {
          const tramoMins = ms.tramoDesdeAnteriorMin ?? ms.tramoHabilMin;
          const tramoLabel =
            i > 0 && tramoMins != null && tramoMins > 0 && !ms.esExclusion
              ? `+${formatMinutos(tramoMins)} hábil desde hito anterior`
              : i > 0 && ms.esExclusion && ms.key.startsWith("lunch")
                ? `${ms.label} · no suma al cómputo`
                : null;

          return (
            <Box key={ms.key}>
              {tramoLabel && (
                <TramoChip
                  label={tramoLabel}
                  exclusion={ms.esExclusion}
                  jornada={ms.esJornada ? ms : null}
                  colors={c}
                />
              )}
              <TimelineNode ms={ms} isLast={i === milestones.length - 1} colors={c} />
            </Box>
          );
        })}
      </Box>

      {last && !last.esExclusion && (
        <Box
          sx={{
            mt: 1,
            pt: 1.25,
            pb: 1.25,
            px: 1,
            borderRadius: 1.5,
            borderTop: 1,
            borderColor: c.border,
            textAlign: "center",
            ...glassInnerSx(c, "hi"),
          }}
        >
          <Typography variant="caption" sx={{ color: c.muted, display: "block" }}>
            Total hábil desde solicitud
          </Typography>
          <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", color: c.dotDone, lineHeight: 1.2 }}>
            {formatMinutos(last.acumuladoHabilMin)}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
