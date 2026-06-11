/* ui/theme — tema MUI dark/light en tonos dodgerblue, con switch persistido. */

type ThemeMode = "dark" | "light";

(function () {
  "use strict";
  const React = (window as any).React;
  const MUI = (window as any).MaterialUI;
  const LS = "jagudeloe:theme";
  const DODGER = "#1e90ff";

  function makeTheme(mode: ThemeMode) {
    const dark = mode === "dark";
    return MUI.createTheme({
      palette: {
        mode,
        primary: { main: DODGER, light: "#63b3ff", dark: "#1565c0" },
        secondary: { main: "#63b3ff" },
        background: dark
          ? { default: "#0a1929", paper: "#0f2236" }
          : { default: "#f0f6ff", paper: "#ffffff" },
        text: dark
          ? { primary: "#e3f2fd", secondary: "#7fb4e6" }
          : { primary: "#0a2540", secondary: "#3a6ea5" },
      },
      shape: { borderRadius: 10 },
      typography: { fontFamily: '"IBM Plex Sans", system-ui, sans-serif' },
    });
  }

  function getInitialMode(): ThemeMode {
    try { const v = localStorage.getItem(LS); if (v === "light" || v === "dark") return v; } catch (e) {}
    return "dark";
  }

  function useThemeMode(): { mode: ThemeMode; toggle: () => void } {
    const [mode, setMode] = React.useState(getInitialMode());
    const toggle = React.useCallback(() => {
      setMode((m: ThemeMode) => {
        const next: ThemeMode = m === "dark" ? "light" : "dark";
        try { localStorage.setItem(LS, next); } catch (e) {}
        return next;
      });
    }, []);
    return { mode, toggle };
  }

  const w = window as any;
  w.ISAJ = w.ISAJ || {};
  w.ISAJ.Theme = { makeTheme, useThemeMode, DODGER };
})();
