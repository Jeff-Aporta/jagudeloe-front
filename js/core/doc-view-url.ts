import { buildShareUrl } from "../boot/url-s.mjs";
import { DEFAULT_DOC_DRIVER, type DocDriver } from "./doc-driver.ts";

export type { DocDriver };

/** URL para ver el ticket en modo documento (sin navegación de la app). */
export function buildDocViewUrl(space: string, iticket: string, driver: DocDriver = DEFAULT_DOC_DRIVER): string {
  return buildShareUrl({ view: "doc", space, sel: iticket, sub: "tickets", driver });
}

export function buildDocEmailUrl(space: string, iticket: string): string {
  return buildDocViewUrl(space, iticket, "html");
}

export function buildDocWebUrl(space: string, iticket: string): string {
  return buildDocViewUrl(space, iticket, "jsx");
}
