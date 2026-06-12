/* Timeline visual de hitos del ticket (sin Mermaid). */
import { getMaterialUI } from "../core/runtime.ts";
import { UI } from "../core/platform.ts";
import { formatMinutos } from "../core/tk-metrics.ts";

function useColors() {
  const { useTheme } = getMaterialUI();
  const dark = useTheme().palette.mode === "dark";
  return {
    rail: dark ? "rgba(158,197,235,0.35)" : "rgba(10,37,64,0.18)",
    dot: "#1e90ff",
    dotDone: "#2e9e5b",
    dotWarn: "#ed6c02",
    dotMuted: dark ? "#4a6278" : "#9aa8b4",
    segHabil: "#1e90ff",
    segExcl: "#ed6c02",
    segGap: dark ? "rgba(158,197,235,0.12)" : "rgba(10,37,64,0.06)",
    text: dark ? "#e8f4ff" : "#0a2540",
    muted: dark ? "#9ec5eb" : "#4a6278",
    chipBg: dark ? "#1a3a5c" : "#f0f6ff",
    cardBg: dark ? "#132f4c" : "#ffffff",
    border: dark ? "rgba(158,197,235,0.3)" : "rgba(10,37,64,0.12)",
  };
}

function dotColor(ms, c) {
  if (ms.esExclusion) return c.dotWarn;
  if (ms.key === "cie") return c.dotDone;
  if (ms.key === "cre") return c.dotMuted;
  return c.dot;
}

function TramoChip({ label, exclusion, colors: c }) {
  const { Box, Typography } = getMaterialUI();
  return (
    <Box sx={{ pl: 3.5, py: 0.75 }}>
      <Typography
        variant="caption"
        sx={{
          display: "inline-block",
          px: 1,
          py: 0.25,
          borderRadius: 1,
          fontSize: "0.75rem",
          fontWeight: 600,
          color: exclusion ? c.dotWarn : c.segHabil,
          bgcolor: exclusion ? "rgba(237,108,2,0.12)" : c.chipBg,
          border: 1,
          borderColor: exclusion ? "rgba(237,108,2,0.35)" : c.border,
          fontStyle: exclusion ? "italic" : "normal",
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}

function TimelineNode({ ms, isLast, colors: c }) {
  const { Box, Stack, Typography } = getMaterialUI();
  const dc = dotColor(ms, c);

  return (
    <Box sx={{ position: "relative", pb: isLast ? 0 : 0.5 }}>
      {!isLast && (
        <Box
          sx={{
            position: "absolute",
            left: 6,
            top: 22,
            bottom: 0,
            width: 2,
            bgcolor: ms.esExclusion ? "rgba(237,108,2,0.35)" : c.rail,
            borderRadius: 1,
          }}
        />
      )}
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        <Box
          sx={{
            width: 14,
            height: 14,
            borderRadius: "50%",
            flexShrink: 0,
            mt: 0.75,
            bgcolor: dc,
            border: 2,
            borderColor: c.cardBg,
            boxShadow: `0 0 0 2px ${dc}44`,
            zIndex: 1,
          }}
        />
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            p: 1.25,
            mb: 1,
            borderRadius: 1.5,
            border: 1,
            borderColor: ms.esExclusion ? "rgba(237,108,2,0.4)" : c.border,
            bgcolor: ms.esExclusion ? "rgba(237,108,2,0.06)" : c.cardBg,
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
            <UI.Icon icon={ms.icon} size={18} />
            <Typography component="span" sx={{ fontWeight: 600, color: c.text, fontSize: "0.95rem" }}>
              {ms.label}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="baseline" flexWrap="wrap" useFlexGap>
            <Typography
              component="span"
              sx={{ fontFamily: "monospace", fontWeight: 700, fontSize: "1rem", color: c.text }}
            >
              {ms.hora}
            </Typography>
            {!ms.esExclusion && (
              <Typography
                component="span"
                sx={{ fontWeight: 700, fontSize: "0.85rem", color: c.segHabil }}
              >
                Σ {formatMinutos(ms.acumuladoHabilMin)}
              </Typography>
            )}
          </Stack>
          <Typography variant="body2" sx={{ color: c.muted, mt: 0.35, fontSize: "0.8125rem" }}>
            {ms.fechaTexto}
          </Typography>
          {ms.nota && (
            <Typography
              variant="body2"
              sx={{
                color: c.muted,
                mt: 0.5,
                fontSize: "0.8125rem",
                fontStyle: ms.esExclusion ? "italic" : "normal",
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

/** Barra proporcional de tramos hábiles vs exclusiones (solo informativa). */
function ProportionBar({ milestones, colors: c }) {
  const { Box, Stack, Typography } = getMaterialUI();
  const segs = [];
  for (let i = 1; i < milestones.length; i++) {
    const prev = milestones[i - 1];
    const cur = milestones[i];
    const mins = cur.tramoHabilMin ?? 0;
    if (mins <= 0 && !cur.esExclusion) continue;
    const isExcl = cur.esExclusion || (prev.esExclusion && cur.key.startsWith("lunch1"));
    if (cur.esExclusion && cur.key.startsWith("lunch0")) {
      segs.push({ mins: 90, excl: true, label: "Almuerzo" });
    } else if (!cur.esExclusion && mins > 0) {
      segs.push({ mins, excl: false, label: cur.label });
    }
  }
  const total = segs.reduce((s, x) => s + x.mins, 0) || 1;

  return (
    <Box sx={{ mb: 2.5 }}>
      <Typography variant="caption" sx={{ color: c.muted, display: "block", mb: 0.75 }}>
        Distribución del tiempo entre hitos (hábil vs excluido)
      </Typography>
      <Stack direction="row" sx={{ height: 10, borderRadius: 1, overflow: "hidden", border: 1, borderColor: c.border }}>
        {segs.map((s, i) => (
          <Box
            key={i}
            title={`${s.label}: ${formatMinutos(s.mins)}`}
            sx={{
              width: `${(s.mins / total) * 100}%`,
              minWidth: s.mins > 0 ? 4 : 0,
              bgcolor: s.excl ? c.segExcl : c.segHabil,
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
  const { Box, Paper, Typography, Stack } = getMaterialUI();

  if (!milestones?.length) {
    return (
      <Typography variant="body2" sx={{ color: c.muted }}>
        Sin hitos para mostrar.
      </Typography>
    );
  }

  const last = milestones[milestones.length - 1];

  return (
    <Paper variant="outlined" sx={{ p: 2, bgcolor: c.cardBg, borderColor: c.border }}>
      {resumen && (
        <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
          {resumen.map((r) => (
            <Box
              key={r.label}
              sx={{
                px: 1.5,
                py: 0.75,
                borderRadius: 1,
                border: 1,
                borderColor: r.highlight ? c.segHabil : c.border,
                bgcolor: r.highlight ? c.chipBg : "transparent",
              }}
            >
              <Typography variant="caption" sx={{ color: c.muted, display: "block" }}>{r.label}</Typography>
              <Typography sx={{ fontWeight: 700, color: c.text, fontSize: "1.05rem" }}>{r.value}</Typography>
            </Box>
          ))}
        </Stack>
      )}

      <ProportionBar milestones={milestones} colors={c} />

      <Box>
        {milestones.map((ms, i) => {
          const prev = i > 0 ? milestones[i - 1] : null;
          const tramoLabel =
            i > 0 && ms.tramoHabilMin != null && ms.tramoHabilMin > 0 && !ms.esExclusion
              ? `+${formatMinutos(ms.tramoHabilMin)} hábil desde hito anterior`
              : i > 0 && ms.esExclusion && ms.key.startsWith("lunch0")
                ? "Almuerzo 12:30–14:00 · no suma al cómputo"
                : null;

          return (
            <Box key={ms.key}>
              {tramoLabel && (
                <TramoChip label={tramoLabel} exclusion={ms.esExclusion} colors={c} />
              )}
              <TimelineNode ms={ms} isLast={i === milestones.length - 1} colors={c} />
            </Box>
          );
        })}
      </Box>

      {last && !last.esExclusion && (
        <Box
          sx={{
            mt: 1.5,
            pt: 1.5,
            borderTop: 1,
            borderColor: c.border,
            textAlign: "center",
          }}
        >
          <Typography variant="body2" sx={{ color: c.muted }}>
            Total hábil desde solicitud
          </Typography>
          <Typography sx={{ fontWeight: 800, fontSize: "1.35rem", color: c.dotDone }}>
            {formatMinutos(last.acumuladoHabilMin)}
          </Typography>
        </Box>
      )}
    </Paper>
  );
}
