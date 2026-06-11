/*
 * app/App — raíz de jagudeloe. Notion-like: spaces (proyectos) → subspaces
 * (bitácora/tickets). Checks inline en cada SQL y ticket. Navegación en `s`.
 */

interface SpaceDef { id: string; label: string; icon: string; }

(function () {
  "use strict";
  const MUI = MaterialUI;
  const UI = window.ISAJ.UI;

  const SPACES: SpaceDef[] = [
    { id: "patyia", label: "PatyIA", icon: "mdi:robot-happy-outline" },
    { id: "clientesis", label: "Clientes", icon: "mdi:account-group-outline" },
  ];
  const SUBSPACES: SpaceDef[] = [
    { id: "bitacora", label: "Bitácora", icon: "mdi:notebook-outline" },
    { id: "tickets", label: "Tickets", icon: "mdi:ticket-confirmation-outline" },
  ];

  function App() {
    const tm = window.ISAJ.Theme.useThemeMode();

    const boot = window.ISAJ.UrlState.boot || {};
    const bootSpace = typeof boot.space === "string" ? boot.space : "";
    const bootSubRaw = typeof boot.sub === "string" ? boot.sub : "";
    const bootSub = bootSubRaw === "checks" ? "bitacora" : bootSubRaw;
    const [space, setSpace] = React.useState(SPACES.some((s) => s.id === bootSpace) ? bootSpace : "patyia");
    const [sub, setSub] = React.useState(SUBSPACES.some((s) => s.id === bootSub) ? bootSub : "bitacora");
    const [reloadKey, setReload] = React.useState(0);
    const skipToastRef = React.useRef<Record<string, number>>({});

    React.useEffect(() => { window.ISAJ.UrlState.merge({ space, sub }); }, [space, sub]);

    window.ISAJ.useRealtimeNotifications({
      project: space,
      onChecksUpdated: (msg) => {
        setReload((k) => k + 1);
        const last = skipToastRef.current[msg.revisadoKey] || 0;
        if (Date.now() - last < 2500) return;
        const label = msg.checked ? "marcado" : "desmarcado";
        window.ISAJ.Toast?.show({
          message: "Check actualizado: " + msg.revisadoKey + " (" + label + ")",
          severity: "info",
        });
      },
    });

    React.useEffect(() => {
      function onLocal(e: Event) {
        const key = (e as CustomEvent).detail?.revisadoKey;
        if (key) skipToastRef.current[key] = Date.now();
      }
      window.addEventListener("isaj:checks-local", onLocal);
      return () => window.removeEventListener("isaj:checks-local", onLocal);
    }, []);

    React.useEffect(() => {
      return window.ISAJ.UrlState.subscribe((s) => {
        if (typeof s.space === "string" && s.space !== space) setSpace(s.space);
        if (typeof s.sub === "string" && s.sub !== sub) setSub(s.sub);
      });
    }, [space, sub]);

    function renderView() {
      const props = { project: space, reloadKey };
      if (sub === "bitacora") return React.createElement(window.ISAJ.BitacoraView, props);
      if (sub === "tickets") return React.createElement(window.ISAJ.TicketsView, props);
      return null;
    }

    // Header con DOS filas de tabs: fila 1 = áreas (spaces) + controles; fila 2 = subspaces.
    const header = React.createElement(MUI.AppBar, {
      position: "static", color: "default", elevation: 0,
      sx: { borderBottom: 1, borderColor: "divider", flexShrink: 0 },
    },
      // Fila 1: marca + tabs de áreas + controles
      React.createElement(MUI.Toolbar, { variant: "dense", sx: { gap: 1, minHeight: 52 } },
        React.createElement(UI.Icon, { icon: "mdi:view-dashboard-variant-outline", size: 24 }),
        React.createElement(MUI.Tabs, {
          value: space, onChange: (_e: unknown, v: string) => setSpace(v),
          variant: "scrollable", sx: { minHeight: 48, flexGrow: 1 },
        },
          SPACES.map((s) =>
            React.createElement(MUI.Tab, {
              key: s.id, value: s.id, label: s.label, sx: { minHeight: 48 },
              icon: React.createElement(UI.Icon, { icon: s.icon }), iconPosition: "start",
            }))),
        React.createElement(UI.TargetSwitch, null),
        React.createElement(MUI.Tooltip, { title: "Recargar" },
          React.createElement(MUI.IconButton, { size: "small", color: "inherit", onClick: () => setReload(reloadKey + 1) },
            React.createElement(UI.Icon, { icon: "mdi:refresh" }))),
        React.createElement(UI.ThemeSwitch, { mode: tm.mode, onToggle: tm.toggle }),
        React.createElement(window.ISAJ.LoginButton, null)),
      // Fila 2: tabs de subspaces
      React.createElement(MUI.Tabs, {
        value: sub, onChange: (_e: unknown, v: string) => setSub(v),
        sx: { px: 1, borderTop: 1, borderColor: "divider", minHeight: 44 }, variant: "scrollable",
      },
        SUBSPACES.map((ss) =>
          React.createElement(MUI.Tab, {
            key: ss.id, value: ss.id, label: ss.label, sx: { minHeight: 44, py: 0 },
            icon: React.createElement(UI.Icon, { icon: ss.icon }), iconPosition: "start",
          }))));

    const main = React.createElement(MUI.Box, {
      sx: { flex: 1, minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" },
    },
      header,
      React.createElement(MUI.Box, { sx: { flex: 1, minHeight: 0, overflow: "hidden" } }, renderView()));

    return React.createElement(MUI.ThemeProvider, { theme: tm.theme },
      React.createElement(MUI.CssBaseline, null),
      React.createElement(MUI.Box, { sx: { display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" } }, main));
  }

  window.ISAJ = window.ISAJ || ({} as IsajNs);
  window.ISAJ.mount = function () {
    const root = document.getElementById("root");
    if (!root) throw new Error("No se encontró #root");
    ReactDOM.createRoot(root).render(React.createElement(App));
  };
  window.ISAJ.mount();
})();
