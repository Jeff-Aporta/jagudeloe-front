import { getMaterialUI } from "../../core/platform.ts";
import { TK_DOC_SECTION_GRAY } from "../../core/tk-doc-constants.ts";
import { scrollToTkDocSection } from "../../core/tk-doc-scroll.ts";

function dotAriaLabel(section) {
  if (section.notApplicable) return `${section.title} (no aplica)`;
  if (section.hasContent) return `${section.title} — ir a la sección`;
  return `${section.title} (sin contenido)`;
}

function dotTooltip(section) {
  if (section.notApplicable) {
    return `${section.title} — no aplica (mejora / requerimiento)`;
  }
  if (section.hasContent) {
    return `${section.title} — clic para ir`;
  }
  return `${section.title} (sin contenido)`;
}

/**
 * Indicador de secciones estándar del doc.
 * Dot coloreado = sección con contenido; gris = vacía; color + slash = no aplica.
 * Clic en dot con contenido → scroll a `#tk-doc-section-{key}`.
 */
export function SectionProgressDots({ sections, activeKey, onSectionClick }) {
  const { Stack, Box, Tooltip } = getMaterialUI();
  const items = sections ?? [];

  function handleClick(section) {
    if (!section?.hasContent) return;
    onSectionClick?.(section.key);
    scrollToTkDocSection(section.key);
  }

  return (
    <Stack
      direction="row"
      spacing={0.75}
      alignItems="center"
      role="list"
      aria-label="Secciones del documento"
      sx={{ mb: 0.25, minHeight: 14 }}
    >
      {items.map((s) => {
        const na = !!s.notApplicable;
        const filled = na || s.hasContent;
        const clickable = !!s.hasContent;
        const active = activeKey === s.key;
        return (
          <Tooltip key={s.key} title={dotTooltip(s)} placement="top" arrow>
            <Box
              component={clickable ? "button" : "span"}
              type={clickable ? "button" : undefined}
              role="listitem"
              aria-label={dotAriaLabel(s)}
              aria-current={active ? "true" : undefined}
              disabled={clickable ? undefined : true}
              onClick={clickable ? () => handleClick(s) : undefined}
              sx={{
                position: "relative",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: active ? 12 : 10,
                height: active ? 12 : 10,
                borderRadius: "50%",
                flexShrink: 0,
                p: 0,
                border: 0,
                bgcolor: filled ? s.accent : TK_DOC_SECTION_GRAY,
                opacity: filled ? (na ? 0.9 : 1) : 0.38,
                boxShadow: active
                  ? `0 0 0 3px ${s.accent}66, 0 0 10px ${s.accent}55`
                  : filled
                    ? `0 0 0 2px ${s.accent}33`
                    : "none",
                cursor: clickable ? "pointer" : "default",
                transition: "opacity 0.2s ease, box-shadow 0.2s ease, width 0.15s ease, height 0.15s ease",
                "&:focus-visible": clickable
                  ? {
                      outline: "2px solid #fff",
                      outlineOffset: 2,
                    }
                  : {},
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
