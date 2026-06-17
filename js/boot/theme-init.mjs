/** Init síncrono — importado desde index.html antes del CSS de la app. */
const LEGACY_KEYS = ["isaj:theme", "jagudeloe:theme"];

function resolveThemeKey() {
  const fromMeta = document.querySelector('meta[name="app-theme-ls-key"]')?.getAttribute("content");
  return (fromMeta && fromMeta.trim()) || "jagudeloe:theme";
}

const lsKey = resolveThemeKey();

function readThemeMode(key) {
  const keys = [key || lsKey, ...LEGACY_KEYS.filter((k) => k !== key && k !== lsKey)];
  try {
    for (const k of keys) {
      const v = localStorage.getItem(k);
      if (v === "light" || v === "dark") return v;
    }
  } catch { /* ignore */ }
  return "dark";
}

function applyThemeMode(mode) {
  const m = mode === "light" ? "light" : "dark";
  document.documentElement.setAttribute("data-mui-color-scheme", m);
  if (document.body) document.body.setAttribute("data-mui-color-scheme", m);
  document.documentElement.style.colorScheme = m;
  return m;
}

const initialMode = readThemeMode(lsKey);
applyThemeMode(initialMode);

if (!document.body) {
  document.addEventListener("DOMContentLoaded", () => applyThemeMode(readThemeMode(lsKey)), { once: true });
}

window.ThemeInit = { lsKey, readThemeMode, applyThemeMode, readMode: () => readThemeMode(lsKey) };
