import { Lightbox } from "../core/platform.ts";
import { getLightboxUi } from "../core/app-manifest.ts";

/** Puente local → ISAComponents.LightboxZoom. */
export function LightboxImage(props) {
  const Comp = Lightbox.LightboxImage;
  const { thumbSize } = getLightboxUi();
  return <Comp ns="ISAJ" thumbSize={props.thumbSize ?? thumbSize} {...props} />;
}

export function ImageLightboxDialog(props) {
  const Comp = Lightbox.ImageLightboxDialog;
  return <Comp ns="ISAJ" {...props} />;
}

export function LightboxZoomInline(props) {
  const Comp = Lightbox.LightboxZoomInline;
  if (!Comp) return props.children ?? null;
  return <Comp ns="ISAJ" {...props} />;
}
