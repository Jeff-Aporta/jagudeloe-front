import { getMaterialUI } from "../../core/platform.ts";
import { UI } from "../../core/platform.ts";
import { TK_DOC_RADIUS } from "../../core/tk-table.ts";
import { useGlassColors, glassCardGradientSx, glassInnerSx, glassGradient } from "../glassSurface.ts";

export function SectionCard({ icon, title, accent, children, sectionKey }) {
  const { Paper, Stack, Typography, Box } = getMaterialUI();
  const { Icon } = UI;
  const c = useGlassColors();
  const color = accent || "#1e90ff";

  return (
    <Paper
      id={sectionKey ? `tk-doc-section-${sectionKey}` : undefined}
      data-tk-doc-section={sectionKey || undefined}
      variant="outlined"
      sx={glassCardGradientSx(c, {
        mb: 2.5,
        borderRadius: TK_DOC_RADIUS,
        overflow: "hidden",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        "&:hover": {
          transform: { sm: "translateY(-2px)" },
        },
      })}
    >
      <Box
        sx={{
          px: { xs: 2, sm: 2.5 },
          py: 1.5,
          borderBottom: 1,
          borderColor: c.border,
          borderLeft: 4,
          borderLeftColor: color,
          ...glassInnerSx(c, "blue", {
            background: `linear-gradient(90deg, ${color}22, transparent 72%), ${glassGradient(c, "blue")}`,
          }),
        }}
      >
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 1.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: `linear-gradient(135deg, ${color}, ${color}99)`,
              color: "#fff",
              boxShadow: `0 4px 12px ${color}44`,
            }}
          >
            <Icon icon={icon} size={18} />
          </Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, letterSpacing: -0.2, color: c.text }}>
            {title}
          </Typography>
        </Stack>
      </Box>
      <Box sx={{ p: { xs: 2, sm: 2.5 }, color: c.text }}>{children}</Box>
    </Paper>
  );
}
