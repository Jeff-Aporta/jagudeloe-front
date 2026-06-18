import { getMaterialUI } from "../../core/platform.ts";
import { TK_DOC_SECTION_GRAY } from "../../core/tk-doc-constants.ts";

/**
 * Indicador fijo de secciones estándar del doc.
 * Dot coloreado = sección con contenido; gris = vacía (no se renderiza la sección).
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
      {items.map((s) => (
        <Tooltip key={s.key} title={s.title} placement="top" arrow>
          <Box
            component="span"
            role="listitem"
            aria-label={`${s.title}${s.hasContent ? "" : " (sin contenido)"}`}
            sx={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              flexShrink: 0,
              bgcolor: s.hasContent ? s.accent : TK_DOC_SECTION_GRAY,
              opacity: s.hasContent ? 1 : 0.38,
              boxShadow: s.hasContent ? `0 0 0 2px ${s.accent}33` : "none",
              transition: "opacity 0.2s ease, box-shadow 0.2s ease",
            }}
          />
        </Tooltip>
      ))}
    </Stack>
  );
}
