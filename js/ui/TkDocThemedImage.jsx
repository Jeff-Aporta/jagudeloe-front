/** Imagen TK con variantes light/dark + lightbox (PhotoSwipe). */
import { getMaterialUI } from "../core/runtime.ts";
import { TkLightboxImage } from "./TkLightbox.jsx";

export function TkDocThemedImage({ payload }) {
  const { Box, Typography, useTheme } = getMaterialUI();
  const theme = useTheme();
  const dark = theme.palette.mode === "dark";
  const p = payload || {};
  const lightSrc = p.url ?? p.src ?? "";
  const src = dark && p.urlDark ? p.urlDark : lightSrc;
  const alt = p.alt ?? p.caption ?? "";
  const caption = p.caption ?? p.alt ?? "";

  if (!src) return null;

  return (
    <Box sx={{ textAlign: "center", my: 1 }} className="tk-doc-themed-image">
      <TkLightboxImage
        href={src}
        src={src}
        caption={caption}
        alt={alt}
        imgSx={{
          mx: "auto",
          borderRadius: 2,
          border: 1,
          borderColor: "divider",
          boxShadow: (t) =>
            t.palette.mode === "dark"
              ? "0 8px 32px rgba(0,0,0,0.4)"
              : "0 12px 40px rgba(15,23,42,0.12)",
        }}
        linkSx={{ mx: "auto" }}
      />
      {caption && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
          {caption}
        </Typography>
      )}
    </Box>
  );
}
