/** Manifiesto del front (index.json), cargado en boot. */

export type LightboxUiConfig = {
  thumbSize: number;
  evidenciasLabelMax: number;
};

const DEFAULT_LIGHTBOX_UI: LightboxUiConfig = {
  thumbSize: 100,
  evidenciasLabelMax: 160,
};

declare global {
  interface Window {
    __JAGUDELOE_MANIFEST__?: {
      ui?: { lightbox?: Partial<LightboxUiConfig> };
    };
  }
}

export async function fetchAppManifest(): Promise<Record<string, unknown>> {
  const base = document.querySelector("base")?.href ?? new URL(".", location.href).href;
  const res = await fetch(new URL("index.json", base), { cache: "no-store" });
  if (!res.ok) throw new Error(`No se pudo cargar index.json (${res.status})`);
  return res.json() as Promise<Record<string, unknown>>;
}

export function installAppManifest(manifest: Record<string, unknown>): void {
  window.__JAGUDELOE_MANIFEST__ = manifest as Window["__JAGUDELOE_MANIFEST__"];
}

export function getLightboxUi(): LightboxUiConfig {
  const raw = window.__JAGUDELOE_MANIFEST__?.ui?.lightbox;
  return {
    thumbSize: Number(raw?.thumbSize) || DEFAULT_LIGHTBOX_UI.thumbSize,
    evidenciasLabelMax: Number(raw?.evidenciasLabelMax) || DEFAULT_LIGHTBOX_UI.evidenciasLabelMax,
  };
}
