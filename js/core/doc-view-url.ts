import { buildShareUrl } from "../boot/url-s.mjs";

/** URL para ver solo el HTML del ticket (sin React, shell ni navegación). */
export function buildDocViewUrl(space: string, iticket: string): string {
  return buildShareUrl({ view: "doc", space, sel: iticket, sub: "tickets" });
}
