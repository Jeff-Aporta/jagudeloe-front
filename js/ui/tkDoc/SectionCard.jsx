import { getMaterialUI } from "../../core/platform.ts";
import { UI } from "../../core/platform.ts";
import { TK_DOC_RADIUS } from "../../core/tk-table.ts";

export function SectionCard({ icon, title, accent, children }) {
  const { Paper, Stack, Typography, Box } = getMaterialUI();
  const { Icon } = UI;
  const color = accent || "#1e90ff";

  return (
    <Paper
      elevation={0}
      sx={{
        mb: 2.5,
        borderRadius: TK_DOC_RADIUS,
        overflow: "hidden",
        border: 1,
        borderColor: "divider",
        bgcolor: "background.paper",
        boxShadow: (t) =>
          t.palette.mode === "dark"
            ? "0 4px 24px rgba(0,0,0,0.25)"
            : "0 8px 32px rgba(15,23,42,0.07)",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        "&:hover": {
          transform: { sm: "translateY(-2px)" },
          boxShadow: (t) =>
            t.palette.mode === "dark"
              ? "0 8px 32px rgba(0,0,0,0.35)"
              : "0 16px 48px rgba(15,23,42,0.1)",
        },
      }}
    >
      <Box
        sx={{
          px: { xs: 2, sm: 2.5 },
          py: 1.5,
          borderBottom: 1,
          borderColor: "divider",
          background: (t) =>
            t.palette.mode === "dark"
              ? `linear-gradient(90deg, ${color}22, transparent 70%)`
              : `linear-gradient(90deg, ${color}14, transparent 70%)`,
          borderLeft: 4,
          borderLeftColor: color,
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
          <Typography variant="subtitle1" sx={{ fontWeight: 700, letterSpacing: -0.2 }}>
            {title}
          </Typography>
        </Stack>
      </Box>
      <Box sx={{ p: { xs: 2, sm: 2.5 } }}>{children}</Box>
    </Paper>
  );
}
