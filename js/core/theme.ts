/** Tema dodger local — mismo criterio que front-shared, usando el React del stack. */
import { getMaterialUI, getReact } from "./runtime.ts";

const LS_KEY = "jagudeloe:theme";
const DODGER = "#1e90ff";
const componentOverrides = {
  MuiButton: { styleOverrides: { root: { textTransform: "none" } } },
  MuiTab: { styleOverrides: { root: { textTransform: "none" } } },
  MuiToggleButton: { styleOverrides: { root: { textTransform: "none" } } },
  MuiChip: {
    styleOverrides: {
      root: {
        "&.MuiChip-sizeSmall": { height: "auto", minHeight: 28, py: "3px" },
      },
      label: { paddingLeft: 10, paddingRight: 10, paddingTop: 2, paddingBottom: 2 },
      icon: { marginLeft: 8 },
    },
  },
};

function initialMode() {
  try { const v = localStorage.getItem(LS_KEY); if (v === "light" || v === "dark") return v; } catch { /* ignore */ }
  return "dark";
}

function makeTheme(mode: string) {
  const { createTheme } = getMaterialUI();
  const dark = mode === "dark";
  return createTheme({
    palette: {
      mode, primary: { main: DODGER, light: "#63b3ff", dark: "#1565c0" }, secondary: { main: "#63b3ff" },
      background: dark ? { default: "#0a1929", paper: "#0f2236" } : { default: "#f0f6ff", paper: "#ffffff" },
      text: dark ? { primary: "#e3f2fd", secondary: "#7fb4e6" } : { primary: "#0a2540", secondary: "#3a6ea5" },
    },
    shape: { borderRadius: 10 },
    typography: { fontFamily: '"IBM Plex Sans", system-ui, sans-serif' },
    components: componentOverrides,
  });
}

export function useThemeMode() {
  const { useState, useCallback, useMemo } = getReact();
  const [mode, setMode] = useState(initialMode);
  const toggle = useCallback(() => {
    setMode((m) => {
      const n = m === "dark" ? "light" : "dark";
      try { localStorage.setItem(LS_KEY, n); } catch { /* ignore */ }
      return n;
    });
  }, [setMode]);
  const theme = useMemo(() => makeTheme(mode), [mode]);
  return { mode, toggle, theme };
}
