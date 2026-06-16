/** Lightbox TK — PhotoSwipe 5 vía CDN (zoom, pan, galería, captions). */
import { createContext, useContext, useEffect, useState } from "react";
import { getMaterialUI } from "../core/runtime.ts";
import { openTkLightboxGallery, probeImageSize, watchTkLightboxTheme } from "../core/tk-lightbox.ts";

const TkLightboxGalleryContext = createContext("tk-doc");

export function useTkLightboxGallery() {
  return useContext(TkLightboxGalleryContext);
}

/** Activa sincronización de tema light/dark para PhotoSwipe. */
export function TkLightboxHost({ galleryId, children }) {
  useEffect(() => watchTkLightboxTheme(), []);
  return (
    <TkLightboxGalleryContext.Provider value={galleryId || "tk-doc"}>
      {children}
    </TkLightboxGalleryContext.Provider>
  );
}

function useImageDimensions(url) {
  const [size, setSize] = useState({ width: 1920, height: 1080 });
  useEffect(() => {
    let alive = true;
    probeImageSize(url).then((s) => {
      if (alive) setSize(s);
    });
    return () => {
      alive = false;
    };
  }, [url]);
  return size;
}

/**
 * Imagen enlazada a la galería del ticket.
 * @param {object} props
 * @param {string} props.href — URL en tamaño completo (lightbox)
 * @param {string} [props.src] — miniatura en página (default: href)
 * @param {string} [props.caption] — descripción en lightbox
 * @param {string} [props.alt]
 * @param {string} [props.galleryId] — override del contexto
 * @param {object} [props.linkSx] — estilos del enlace
 * @param {object} [props.imgSx] — estilos de la imagen
 * @param {string} [props.className]
 * @param {(e: Event) => void} [props.onImgError]
 */
export function TkLightboxImage({
  href,
  src,
  caption = "",
  alt = "",
  galleryId: galleryIdProp,
  linkSx = {},
  imgSx = {},
  className = "",
  onImgError,
}) {
  const { Box } = getMaterialUI();
  const galleryId = galleryIdProp || useTkLightboxGallery();
  const fullSrc = href || src || "";
  const thumbSrc = src || href || "";
  const { width, height } = useImageDimensions(fullSrc);

  if (!fullSrc) return null;

  const onOpen = (e) => {
    e.preventDefault();
    openTkLightboxGallery(galleryId, e.currentTarget);
  };

  return (
    <Box
      component="a"
      href={fullSrc}
      className={`tk-lightbox-link ${className}`.trim()}
      data-pswp-gallery={galleryId}
      data-pswp-width={width}
      data-pswp-height={height}
      data-pswp-caption={caption || alt}
      onClick={onOpen}
      sx={{
        display: "block",
        textDecoration: "none",
        cursor: "zoom-in",
        position: "relative",
        "&:focus-visible": {
          outline: "2px solid",
          outlineColor: "primary.main",
          outlineOffset: 3,
          borderRadius: 2,
        },
        ...linkSx,
      }}
      aria-label={caption || alt || "Ampliar imagen"}
    >
      <Box
        component="img"
        src={thumbSrc}
        alt={alt || caption}
        loading="lazy"
        onError={onImgError}
        sx={{
          maxWidth: "100%",
          height: "auto",
          display: "block",
          bgcolor: "transparent",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
          ".tk-lightbox-link:hover &": {
            transform: "scale(1.008)",
          },
          ...imgSx,
        }}
      />
      <Box
        className="tk-lightbox-hint"
        aria-hidden
        sx={{
          position: "absolute",
          right: 10,
          bottom: 10,
          width: 32,
          height: 32,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: (t) =>
            t.palette.mode === "dark" ? "rgba(15,34,54,0.72)" : "rgba(10,37,64,0.72)",
          color: "#e8f4ff",
          fontSize: 18,
          opacity: 0,
          transition: "opacity 0.2s ease",
          pointerEvents: "none",
          boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
          ".tk-lightbox-link:hover &": { opacity: 1 },
        }}
      >
        ⤢
      </Box>
    </Box>
  );
}
