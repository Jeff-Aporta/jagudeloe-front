/** Preferencia de tema jagudeloe — oscuro por defecto si el usuario no eligió. */
export const THEME_LS_KEY = "jagudeloe:theme";

export type ThemeMode = "light" | "dark";

export function readStoredThemeMode(): ThemeMode {
  try {
    const v = localStorage.getItem(THEME_LS_KEY);
    if (v === "light" || v === "dark") return v;
  } catch { /* ignore */ }
  return "dark";
}

/** Aplica `data-mui-color-scheme` antes de montar React (evita flash claro). */
export function applyThemeModeToDocument(mode: ThemeMode = readStoredThemeMode()): ThemeMode {
  document.documentElement.setAttribute("data-mui-color-scheme", mode);
  document.documentElement.style.colorScheme = mode;
  return mode;
}
