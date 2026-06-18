import { getMaterialUI } from "../../core/platform.ts";
import { inlineMdWeb } from "../tkHtml.ts";

/** Lista ordenada o con viñetas para bloques markdown del doc TK. */
export function MdList({ ordered = true, items }) {
  const { Box, Typography } = getMaterialUI();
  const list = (items ?? []).filter((t) => String(t ?? "").trim());

  if (!list.length) return null;

  const Tag = ordered ? "ol" : "ul";

  return (
    <Box
      component={Tag}
      sx={{
        pl: 2.75,
        mt: 0.5,
        mb: 1.25,
        listStyleType: ordered ? "decimal" : "disc",
        "& > li": {
          pl: 0.5,
          mb: 0.75,
          lineHeight: 1.65,
          "&::marker": ordered
            ? { fontWeight: 600, color: "primary.main" }
            : { color: "primary.main" },
        },
        "& > li:last-of-type": { mb: 0 },
      }}
    >
      {list.map((item, i) => (
        <Box component="li" key={i}>
          <Typography
            variant="body1"
            component="div"
            sx={{ lineHeight: 1.65, color: "text.primary" }}
            dangerouslySetInnerHTML={{ __html: inlineMdWeb(String(item)) }}
          />
        </Box>
      ))}
    </Box>
  );
}
