import { getMaterialUI } from "../../core/platform.ts";
import { TK_DOC_SECTION_GRAY, TK_DOC_STANDARD } from "../../core/tk-doc-constants.ts";
import { TK_DOC_RADIUS, roundTkMinutosTo5 } from "../../core/tk-table.ts";
import { glassInnerSx, useGlassColors } from "../glassSurface.ts";

const META_SX = {
  color: TK_DOC_SECTION_GRAY,
  fontWeight: 400,
  fontSize: "0.8rem",
  lineHeight: 1.5,
  display: "block",
  mt: 0.35,
};

const TIEMPO_ACCENT = TK_DOC_STANDARD.tiempos.accent;

const PHASE_META = {
  investigacion: {
    label: "Investigación y testing",
    bar: "linear-gradient(90deg, #7c3aed, #8b5cf6)",
  },
  commits: {
    label: "Commits",
    bar: "linear-gradient(90deg, #06b6d4, #6366f1)",
  },
  diligencia: {
    label: "Diligencia",
    bar: "linear-gradient(90deg, #f59e0b, #fbbf24)",
  },
  otro: {
    label: "Otro",
    bar: "linear-gradient(90deg, #059669, #10b981)",
  },
};

function tiempoPhaseChipSx(phase, t) {
  const dark = t.palette.mode === "dark";
  const tones = {
    investigacion: {
      bgcolor: dark ? "rgba(124,58,237,0.32)" : "rgba(124,58,237,0.12)",
      color: dark ? "#ede9fe" : "#5b21b6",
      borderColor: dark ? "rgba(167,139,250,0.65)" : "rgba(124,58,237,0.42)",
    },
    commits: {
      bgcolor: dark ? "rgba(6,182,212,0.3)" : "rgba(6,182,212,0.13)",
      color: dark ? "#cffafe" : "#0e7490",
      borderColor: dark ? "rgba(34,211,238,0.62)" : "rgba(6,182,212,0.44)",
    },
    diligencia: {
      bgcolor: dark ? "rgba(245,158,11,0.3)" : "rgba(245,158,11,0.15)",
      color: dark ? "#fef3c7" : "#92400e",
      borderColor: dark ? "rgba(251,191,36,0.65)" : "rgba(217,119,6,0.45)",
    },
    otro: {
      bgcolor: dark ? "rgba(16,185,129,0.28)" : "rgba(16,185,129,0.12)",
      color: dark ? "#d1fae5" : "#047857",
      borderColor: dark ? "rgba(52,211,153,0.6)" : "rgba(16,185,129,0.38)",
    },
  };
  return tones[phase] ?? tones.otro;
}

function classifyTiempoPhase(item) {
  const name = String(item?.name ?? "");
  const text = `${name} ${item?.detail ?? ""}`.toLowerCase();
  if (/^diligencia\b|\bdiligencia del\b|evidencias \+|documentaci[oó]n tk/i.test(text)) return "diligencia";
  if (/investigaci|testing\b|\bpruebas\b|verificaci|reproducci|matriz de prueba/i.test(text)) return "investigacion";
  if (/commit|repositorio|codigo|servidor|front|desarrollo|entrega|bd\b/i.test(text)) return "commits";
  return "otro";
}

function resolveTiempoPhase(item) {
  const explicit = String(item?.phase ?? "").trim().toLowerCase();
  if (explicit && PHASE_META[explicit]) return explicit;
  return classifyTiempoPhase(item);
}

function TimeRow({ item, total, isLast }) {
  const { Box, Stack, Typography, LinearProgress, Chip } = getMaterialUI();
  const phase = resolveTiempoPhase(item);
  const phaseStyle = PHASE_META[phase] ?? PHASE_META.otro;
  const minutos = roundTkMinutosTo5(item.minutos);
  const pctTotal = Math.min(100, (minutos / total) * 100);

  return (
    <Box
      sx={{
        px: 1.75,
        py: 1.5,
        borderBottom: isLast ? 0 : 1,
        borderColor: "divider",
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={2}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Typography variant="body2" component="div" fontWeight={600} sx={{ lineHeight: 1.5 }}>
              {item.name}
            </Typography>
            <Chip
              size="small"
              variant="outlined"
              label={phaseStyle.label}
              sx={(t) => {
                const chip = tiempoPhaseChipSx(phase, t);
                return {
                  height: 22,
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  letterSpacing: 0.15,
                  borderRadius: TK_DOC_RADIUS,
                  bgcolor: chip.bgcolor,
                  color: chip.color,
                  border: `1px solid ${chip.borderColor}`,
                  boxShadow: t.palette.mode === "dark"
                    ? "0 1px 0 rgba(255,255,255,0.06) inset"
                    : "0 1px 0 rgba(255,255,255,0.9) inset",
                  "& .MuiChip-label": { px: 1, py: 0 },
                };
              }}
            />
          </Stack>
          {item.detail ? (
            <Typography component="div" sx={META_SX}>
              {item.detail}
            </Typography>
          ) : null}
        </Box>
        <Typography
          variant="body2"
          component="div"
          fontWeight={700}
          sx={{ whiteSpace: "nowrap", color: "text.primary", lineHeight: 1.5, pt: 0.1 }}
        >
          {minutos} min
        </Typography>
      </Stack>

      <Box sx={{ mt: 1.35 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          component="div"
          sx={{ lineHeight: 1.5, letterSpacing: 0.1, mb: 0.75 }}
        >
          {Math.round(pctTotal)}% del total
        </Typography>
        <LinearProgress
          variant="determinate"
          value={pctTotal}
          sx={{
            height: 8,
            borderRadius: 4,
            bgcolor: "action.hover",
            "& .MuiLinearProgress-bar": {
              borderRadius: 4,
              background: phaseStyle.bar,
            },
          }}
        />
      </Box>
    </Box>
  );
}

export function TimeSummary({ tiempos }) {
  const { Box, Stack, Typography, Chip, Paper } = getMaterialUI();
  const c = useGlassColors();

  if (!tiempos.length) return null;

  const total =
    tiempos.reduce((s, t) => s + roundTkMinutosTo5(t.minutos), 0) || 1;

  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: TK_DOC_RADIUS,
        borderColor: c.border,
        overflow: "hidden",
        ...glassInnerSx(c, "node"),
      }}
    >
      {tiempos.map((t, i) => (
        <TimeRow
          key={t.name}
          item={t}
          total={total}
          isLast={i === tiempos.length - 1}
        />
      ))}

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          px: 1.75,
          py: 1.35,
          bgcolor: "action.selected",
          borderTop: 1,
          borderColor: "divider",
          boxShadow: (theme) =>
            theme.palette.mode === "dark"
              ? "inset 0 1px 0 rgba(255,255,255,0.06)"
              : "inset 0 1px 0 rgba(255,255,255,0.85)",
        }}
      >
        <Typography
          variant="subtitle2"
          component="div"
          sx={{ fontWeight: 700, letterSpacing: -0.15, lineHeight: 1.4 }}
        >
          Tiempo invertido por estimación
        </Typography>
        <Chip
          label={`${total} min`}
          size="small"
          sx={{
            height: 30,
            fontWeight: 700,
            fontSize: "0.88rem",
            letterSpacing: 0.2,
            border: "none",
            bgcolor: TIEMPO_ACCENT,
            color: "#fff",
            boxShadow: `0 2px 8px ${TIEMPO_ACCENT}55`,
            "& .MuiChip-label": { px: 1.75, py: 0 },
          }}
        />
      </Box>
    </Paper>
  );
}
