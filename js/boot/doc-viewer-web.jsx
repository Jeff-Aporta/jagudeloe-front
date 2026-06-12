/**
 * Vista documento full-page — driver JSX (MUI + tema dodger ISAJ, igual que la app).
 */
import { getReactDOM, getMaterialUI } from "../core/runtime.ts";
import { TicketDocWebView } from "../ui/TicketDocWebView.jsx";
import { tkDocPageSx } from "../ui/tkDocSurface.ts";

function useAppThemeMode() {
  const bag = window.ISAJ;
  if (!bag?.Theme?.useThemeMode) {
    throw new Error("ISAJ.Theme no registrado — ejecutar isa-setup.ts antes de doc-viewer-web");
  }
  return bag.Theme.useThemeMode();
}

function DocWebPage({ tk }) {
  const { ThemeProvider, CssBaseline, Box } = getMaterialUI();
  const UI = window.ISAJ?.UI;
  const tm = useAppThemeMode();

  return (
    <ThemeProvider theme={tm.theme}>
      <CssBaseline />
      {UI?.ThemeSwitch && (
        <Box sx={{ position: "fixed", top: 12, right: 12, zIndex: 1200 }}>
          <UI.ThemeSwitch mode={tm.mode} onToggle={tm.toggle} />
        </Box>
      )}
      <Box className="tk-doc-web-surface" sx={tkDocPageSx()}>
        <TicketDocWebView tk={tk} />
      </Box>
    </ThemeProvider>
  );
}

export function mountDocWebView(tk) {
  const rootEl = document.getElementById("root");
  if (!rootEl) throw new Error("#root no encontrado");
  rootEl.classList.add("tk-doc-web");
  getReactDOM().createRoot(rootEl).render(<DocWebPage tk={tk} />);
}
