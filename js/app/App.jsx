/* app/App — raíz jagudeloe. Spaces (proyectos) → subspaces (bitácora/tickets). */
import { getReact, getMaterialUI } from "../core/runtime.ts";
import { useThemeMode } from "../core/theme.ts";
import { UI, Toast } from "../core/platform.ts";
import { merge, subscribe, boot } from "../core/urlState.ts";
import { invalidateRevisadoCache } from "../api/client.ts";
import { useRealtimeNotifications } from "../ui/realtime.ts";
import { BitacoraView } from "../views/BitacoraView.jsx";
import { TicketsView } from "../views/TicketsView.jsx";
import { TicketMetricsView } from "../views/TicketMetricsView.jsx";
import { LoginButton } from "./Login.jsx";

/* "general" no es un space real: combina todos los spaces (sin filtro). */
const SPACES = [
  { id: "general", label: "General", icon: "mdi:view-grid-outline" },
  { id: "patyia", label: "PatyIA", icon: "mdi:robot-happy-outline" },
  { id: "clientesis", label: "Clientes", icon: "mdi:account-group-outline" },
];
const SUBSPACES = [
  { id: "bitacora", label: "Bitácora", icon: "mdi:notebook-outline" },
  { id: "tickets", label: "Tickets", icon: "mdi:ticket-confirmation-outline" },
  { id: "metricas", label: "Métricas TK", icon: "mdi:chart-timeline-variant" },
];

export function App() {
  const { useState, useEffect, useRef } = getReact();
  const { ThemeProvider, CssBaseline, Box, AppBar, Toolbar, Tabs, Tab, Tooltip, IconButton } = getMaterialUI();
  const { Icon, TargetSwitch, ThemeSwitch } = UI;
  const { show: toastShow } = Toast;
  const { theme, mode, toggle } = useThemeMode();
  const bootSpace = typeof boot.space === "string" ? boot.space : "";
  const bootSubRaw = typeof boot.sub === "string" ? boot.sub : "";
  const bootSub = bootSubRaw === "checks" ? "bitacora" : bootSubRaw;
  const [space, setSpace] = useState(SPACES.some((s) => s.id === bootSpace) ? bootSpace : "patyia");
  const [sub, setSub] = useState(SUBSPACES.some((s) => s.id === bootSub) ? bootSub : "bitacora");
  const [reloadKey, setReload] = useState(0);
  const skipToastRef = useRef({});

  useEffect(() => { merge({ space, sub }); }, [space, sub]);
  useRealtimeNotifications({
    project: space,
    onChecksUpdated: (msg) => {
      invalidateRevisadoCache(msg.project || space);
      try { window.dispatchEvent(new CustomEvent("isaj:checks-sync", { detail: msg })); } catch { /* ignore */ }
      const last = skipToastRef.current[msg.revisadoKey] || 0;
      if (Date.now() - last < 2500) return;
      toastShow({ message: "Check actualizado: " + msg.revisadoKey + " (" + (msg.checked ? "marcado" : "desmarcado") + ")", severity: "info" });
    },
  });
  useEffect(() => {
    function onLocal(e) { const key = e.detail?.revisadoKey; if (key) skipToastRef.current[key] = Date.now(); }
    window.addEventListener("isaj:checks-local", onLocal);
    return () => window.removeEventListener("isaj:checks-local", onLocal);
  }, []);
  useEffect(() => {
    return subscribe((s) => {
      if (typeof s.space === "string" && s.space !== space) setSpace(s.space);
      if (typeof s.sub === "string" && s.sub !== sub) setSub(s.sub);
    });
  }, [space, sub]);

  function renderView() {
    const props = { project: space, reloadKey };
    if (space === "general" && sub === "bitacora") {
      const { Alert } = getMaterialUI();
      return <Alert severity="info" sx={{ m: 2 }}>La bitácora se consulta por espacio: selecciona PatyIA o Clientes.</Alert>;
    }
    if (sub === "bitacora") return <BitacoraView {...props} />;
    if (sub === "tickets") return <TicketsView {...props} />;
    if (sub === "metricas") return <TicketMetricsView {...props} />;
    return null;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        <AppBar position="static" color="default" elevation={0} sx={{ borderBottom: 1, borderColor: "divider", flexShrink: 0 }}>
          <Toolbar variant="dense" sx={{ gap: 1, minHeight: 52 }}>
            <Icon icon="mdi:view-dashboard-variant-outline" size={24} />
            <Tabs value={space} onChange={(_e, v) => setSpace(v)} variant="scrollable" sx={{ minHeight: 48, flexGrow: 1 }}>
              {SPACES.map((s) => (
                <Tab key={s.id} value={s.id} label={s.label} sx={{ minHeight: 48 }} icon={<Icon icon={s.icon} />} iconPosition="start" />
              ))}
            </Tabs>
            <TargetSwitch />
            <Tooltip title="Recargar">
              <IconButton size="small" color="inherit" onClick={() => setReload(reloadKey + 1)}>
                <Icon icon="mdi:refresh" />
              </IconButton>
            </Tooltip>
            <ThemeSwitch mode={mode} onToggle={toggle} />
            <LoginButton />
          </Toolbar>
          <Tabs value={sub} onChange={(_e, v) => setSub(v)} sx={{ px: 1, borderTop: 1, borderColor: "divider", minHeight: 44 }} variant="scrollable">
            {SUBSPACES.map((ss) => (
              <Tab key={ss.id} value={ss.id} label={ss.label} sx={{ minHeight: 44, py: 0 }} icon={<Icon icon={ss.icon} />} iconPosition="start" />
            ))}
          </Tabs>
        </AppBar>
        <Box sx={{ flex: 1, minHeight: 0, overflow: "hidden" }}>{renderView()}</Box>
      </Box>
    </ThemeProvider>
  );
}
