import { getMaterialUI } from "../../core/platform.ts";
import { formatTiqueteCreadoPor, resolveDocumentadorBlock } from "../tkHeroAuthors.ts";
import { TK_DOC_RADIUS } from "../../core/tk-table.ts";
import { SectionProgressDots } from "./SectionProgressDots.jsx";

export function HeroHeader({ tk, space, iticket, badges, sectionDots, activeSectionKey, onSectionClick, editAction }) {
  const { Box, Stack, Typography, Chip } = getMaterialUI();
  const creadoPor = formatTiqueteCreadoPor(tk.solicitante);
  const documentador = resolveDocumentadorBlock(tk);

  const heroBadgeSx = (tone, t) => {
    if (tone === "warning") {
      return {
        bgcolor: t.palette.mode === "dark" ? "rgba(245,158,11,0.22)" : "rgba(245,158,11,0.14)",
        color: t.palette.mode === "dark" ? "#fde68a" : "#b45309",
        borderColor: t.palette.mode === "dark" ? "rgba(245,158,11,0.55)" : "rgba(245,158,11,0.45)",
      };
    }
    if (tone === "success") {
      return {
        bgcolor: t.palette.mode === "dark" ? "rgba(16,185,129,0.2)" : "rgba(16,185,129,0.12)",
        color: t.palette.mode === "dark" ? "#a7f3d0" : "#047857",
        borderColor: t.palette.mode === "dark" ? "rgba(16,185,129,0.5)" : "rgba(16,185,129,0.4)",
      };
    }
    return {
      bgcolor: t.palette.mode === "dark" ? "rgba(255,255,255,0.15)" : "rgba(30,144,255,0.1)",
      color: t.palette.mode === "dark" ? "#fff" : t.palette.primary.dark,
      borderColor: t.palette.mode === "dark" ? "rgba(255,255,255,0.35)" : "rgba(30,144,255,0.35)",
    };
  };

  return (
    <Box
      sx={(t) => {
        const dark = t.palette.mode === "dark";
        return {
          position: "relative",
          overflow: "hidden",
          borderRadius: TK_DOC_RADIUS,
          mb: 3,
          p: { xs: 2.5, sm: 3, md: 3.5 },
          color: dark ? "#fff" : t.palette.text.primary,
          background: dark
            ? "linear-gradient(135deg, #0b2e4e 0%, #1e5a8a 38%, #1e90ff 72%, #6366f1 100%)"
            : "linear-gradient(135deg, #dbeafe 0%, #e8f4ff 38%, #f0f7ff 72%, #ffffff 100%)",
          border: dark ? "none" : `1px solid ${t.palette.divider}`,
          boxShadow: dark
            ? "0 20px 60px rgba(30,144,255,0.25)"
            : "0 8px 32px rgba(30,144,255,0.12)",
        };
      }}
    >
      <Box
        sx={(t) => ({
          position: "absolute",
          top: -40,
          right: -20,
          width: 180,
          height: 180,
          borderRadius: "50%",
          background:
            t.palette.mode === "dark" ? "rgba(255,255,255,0.12)" : "rgba(30,144,255,0.1)",
          filter: "blur(2px)",
        })}
      />
      <Box
        sx={(t) => ({
          position: "absolute",
          bottom: -60,
          left: -30,
          width: 220,
          height: 220,
          borderRadius: "50%",
          background:
            t.palette.mode === "dark" ? "rgba(99,102,241,0.35)" : "rgba(99,102,241,0.14)",
          filter: "blur(4px)",
        })}
      />
      {editAction}
      <Stack spacing={1} sx={{ position: "relative", zIndex: 1 }}>
        {sectionDots?.length > 0 && (
          <SectionProgressDots
            sections={sectionDots}
            activeKey={activeSectionKey}
            onSectionClick={onSectionClick}
          />
        )}
        <Stack direction="row" flexWrap="wrap" gap={1.5} alignItems="center">
          {iticket && (
            <Chip
              size="small"
              label={iticket}
              sx={(t) => ({
                bgcolor: t.palette.mode === "dark" ? "#fff" : t.palette.primary.main,
                color: t.palette.mode === "dark" ? "#0b2e4e" : "#fff",
                fontWeight: 800,
                fontSize: "0.8rem",
                mr: 0.5,
              })}
            />
          )}
          <Typography
            variant="caption"
            sx={(t) => ({
              opacity: 0.85,
              letterSpacing: 1.2,
              textTransform: "uppercase",
              fontWeight: 600,
              pl: 0.5,
              color: t.palette.mode === "dark" ? "inherit" : t.palette.text.secondary,
            })}
          >
            {space}
          </Typography>
        </Stack>

        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            lineHeight: 1.2,
            letterSpacing: -0.5,
            fontSize: { xs: "1.35rem", sm: "1.65rem", md: "1.85rem" },
          }}
        >
          {tk.titulo ?? tk.title ?? ""}
        </Typography>

        {creadoPor && (
          <Typography variant="body1" sx={(t) => ({ opacity: 0.9, maxWidth: 560, color: t.palette.mode === "dark" ? "inherit" : t.palette.text.primary })}>
            {creadoPor}
          </Typography>
        )}

        {documentador && (
          <Box sx={{ maxWidth: 560, mt: 0.25 }}>
            <Typography
              component="small"
              variant="caption"
              sx={(t) => ({
                display: "block",
                opacity: 0.8,
                lineHeight: 1.4,
                color: t.palette.mode === "dark" ? "inherit" : t.palette.text.secondary,
              })}
            >
              {documentador.label}
            </Typography>
            <Typography
              variant="body2"
              sx={(t) => ({
                fontWeight: 700,
                lineHeight: 1.45,
                color: t.palette.mode === "dark" ? "inherit" : t.palette.text.primary,
              })}
            >
              {documentador.nombre}
            </Typography>
            {documentador.cargo && (
              <Typography
                variant="body2"
                sx={(t) => ({
                  lineHeight: 1.45,
                  opacity: 0.9,
                  color: t.palette.mode === "dark" ? "inherit" : t.palette.text.secondary,
                })}
              >
                {documentador.cargo}
              </Typography>
            )}
            {documentador.nota && (
              <Typography
                variant="caption"
                sx={(t) => ({
                  display: "block",
                  mt: 0.5,
                  lineHeight: 1.45,
                  fontWeight: 600,
                  color: t.palette.mode === "dark" ? "#fde68a" : "#b45309",
                })}
              >
                {documentador.nota}
              </Typography>
            )}
          </Box>
        )}

        {badges.length > 0 && (
          <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ pt: 0.5 }}>
            {badges.map((b, i) => (
              <Chip
                key={i}
                size="small"
                label={b.payload?.label ?? b.payload?.text ?? ""}
                sx={(t) => ({
                  ...heroBadgeSx(b.payload?.tone, t),
                  backdropFilter: "blur(8px)",
                })}
                variant="outlined"
              />
            ))}
          </Stack>
        )}
      </Stack>
    </Box>
  );
}
