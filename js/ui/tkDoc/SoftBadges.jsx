import { getMaterialUI } from "../../core/platform.ts";
import { TK_DOC_RADIUS } from "../../core/tk-table.ts";

/** Fondo suave para chips de archivos / artefactos en diligencias. */
export function tkDocSoftBadgeSx(tone, t) {
  const dark = t.palette.mode === "dark";
  const tones = {
    primary: {
      bgcolor: dark ? "rgba(30,144,255,0.22)" : "rgba(30,144,255,0.1)",
      color: dark ? "#bfdbfe" : t.palette.primary.dark,
      borderColor: dark ? "rgba(30,144,255,0.45)" : "rgba(30,144,255,0.28)",
    },
    secondary: {
      bgcolor: dark ? "rgba(148,163,184,0.18)" : "rgba(100,116,139,0.1)",
      color: dark ? "#e2e8f0" : "#475569",
      borderColor: dark ? "rgba(148,163,184,0.4)" : "rgba(100,116,139,0.25)",
    },
    success: {
      bgcolor: dark ? "rgba(16,185,129,0.2)" : "rgba(16,185,129,0.12)",
      color: dark ? "#a7f3d0" : "#047857",
      borderColor: dark ? "rgba(16,185,129,0.5)" : "rgba(16,185,129,0.35)",
    },
    warning: {
      bgcolor: dark ? "rgba(245,158,11,0.22)" : "rgba(245,158,11,0.14)",
      color: dark ? "#fde68a" : "#b45309",
      borderColor: dark ? "rgba(245,158,11,0.55)" : "rgba(245,158,11,0.4)",
    },
    danger: {
      bgcolor: dark ? "rgba(239,68,68,0.2)" : "rgba(239,68,68,0.1)",
      color: dark ? "#fecaca" : "#b91c1c",
      borderColor: dark ? "rgba(239,68,68,0.45)" : "rgba(239,68,68,0.3)",
    },
  };
  return tones[tone] ?? tones.secondary;
}

export function SoftBadges({ items }) {
  const { Box, Chip } = getMaterialUI();
  const list = Array.isArray(items) ? items : [];

  if (!list.length) return null;

  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, my: 1 }}>
      {list.map((item, i) => {
        const label = String(item?.label ?? item?.text ?? "");
        const tone = String(item?.tone ?? "secondary");
        return (
          <Chip
            key={i}
            size="small"
            label={label}
            variant="outlined"
            sx={(t) => ({
              height: 24,
              fontSize: "0.72rem",
              fontWeight: 600,
              fontFamily: /[./]/.test(label) ? "monospace" : "inherit",
              borderRadius: TK_DOC_RADIUS,
              ...tkDocSoftBadgeSx(tone, t),
            })}
          />
        );
      })}
    </Box>
  );
}
