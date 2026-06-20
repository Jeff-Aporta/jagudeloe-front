/**
 * Visor de diagramas full-page (query `d`) — sin shell de la app.
 * Monta DiagramLightbox a pantalla completa, no cerrable (solo visualizador).
 */
import { getReactDOM, getMaterialUI } from "../core/platform.ts";
import { DiagramLightbox } from "../ui/DiagramLightbox.jsx";
// Efecto: registra el kind `sequence` en el registro de diagramas.
import "../ui/TkDocSequence.jsx";

function useAppThemeMode() {
  const bag = window.ISAJ;
  if (!bag?.Theme?.useThemeMode) {
    throw new Error("ISAJ.Theme no registrado — ejecutar isa-setup.ts antes de diagram-viewer-web");
  }
  return bag.Theme.useThemeMode();
}

function DiagramViewerPage({ kind, payload }) {
  const { ThemeProvider, CssBaseline, Box } = getMaterialUI();
  const tm = useAppThemeMode();
  const ThemeSwitch = window.ISAJ?.UI?.ThemeSwitch;
  return (
    <ThemeProvider theme={tm.theme}>
      <CssBaseline />
      {ThemeSwitch ? (
        <Box sx={{ position: "fixed", top: 12, left: 12, zIndex: 2000 }}>
          <ThemeSwitch mode={tm.mode} onToggle={tm.toggle} />
        </Box>
      ) : null}
      <DiagramLightbox open kind={kind} payload={payload} closable={false} />
    </ThemeProvider>
  );
}

export function mountDiagramView(boot) {
  const rootEl = document.getElementById("root");
  if (!rootEl) throw new Error("#root no encontrado");
  getReactDOM().createRoot(rootEl).render(
    <DiagramViewerPage kind={boot?.kind || "sequence"} payload={boot?.payload || {}} />,
  );
}
