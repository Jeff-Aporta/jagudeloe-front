import { getMaterialUI } from "../../core/platform.ts";
import { TK_DOC_SECTION_GRAY } from "../../core/tk-doc-constants.ts";

function dotAriaLabel(section) {
  if (section.notApplicable) return `${section.title} (no aplica)`;
  if (section.hasContent) return section.title;
  return `${section.title} (sin contenido)`;
}

function dotTooltip(section) {
  if (section.notApplicable) {
    return `${section.title} — no aplica (mejora / requerimiento)`;
  }
  return section.title;
}

/**
 * Indicador fijo de secciones estándar del doc.
 * Dot coloreado = sección con contenido; gris = vacía; color + slash = no aplica.
 */
export function SectionProgressDots({ sections }) {
  const { Stack, Box, Tooltip } = getMaterialUI();
  const items = sections ?? [];

  return (
    <Stack
      direction="row"
      spacing={0.75}
      alignItems="center"
      role="list"
      aria-label="Secciones del documento"
      sx={{ mb: 0.25 }}
    >
      {items.map((s) => {
        const na = !!s.notApplicable;
        const filled = na || s.hasContent;
        return (
          <Tooltip key={s.key} title={dotTooltip(s)} placement="top" arrow>
            <Box
              component="span"
              role="listitem"
              aria-label={dotAriaLabel(s)}
              sx={{
                position: "relative",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 10,
                height: 10,
                borderRadius: "50%",
                flexShrink: 0,
                bgcolor: filled ? s.accent : TK_DOC_SECTION_GRAY,
                opacity: filled ? (na ? 0.9 : 1) : 0.38,
                boxShadow: filled ? `0 0 0 2px ${s.accent}33` : "none",
                transition: "opacity 0.2s ease, box-shadow 0.2s ease",
                ...(na
                  ? {
                      "&::after": {
                        content: '""',
                        position: "absolute",
                        top: "50%",
                        left: "8%",
                        width: "84%",
                        height: 1.5,
                        borderRadius: 1,
                        bgcolor: "common.white",
                        boxShadow: "0 0 0 0.5px rgba(15,23,42,0.45)",
                        transform: "translateY(-50%) rotate(-45deg)",
                        pointerEvents: "none",
                      },
                    }
                  : {}),
              }}
            />
          </Tooltip>
        );
      })}
    </Stack>
  );
}
