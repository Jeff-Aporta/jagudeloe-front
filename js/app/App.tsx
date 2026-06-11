/*
 * app/App — raíz de jagudeloe (ISA-DOC). Notion-like: spaces (proyectos) → subspaces
 * (bitácora/tickets/checks). El estado de navegación va en el query param `s`.
 */

interface SpaceDef { id: string; label: string; icon: string; }

(function () {
  "use strict";
  const MUI = MaterialUI;
  const UI = window.ISAJ.UI;

  const SPACES: SpaceDef[] = [
    { id: "patyia", label: "Asistente IA", icon: "mdi:robot-happy-outline" },
    { id: "clientesis", label: "Clientes", icon: "mdi:account-group-outline" },
  ];
  const SUBSPACES: SpaceDef[] = [
    { id: "bitacora", label: "Bitácora", icon: "mdi:notebook-outline" },
    { id: "tickets", label: "Tickets", icon: "mdi:ticket-confirmation-outline" },
    { id: "checks", label: "Checks", icon: "mdi:check-circle-outline" },
  ];

  function App() {
    const tm = window.ISAJ.Theme.useThemeMode();

    const boot = window.ISAJ.UrlState.boot || {};
    const bootSpace = typeof boot.space === "string" ? boot.space : "";
    const bootSub = typeof boot.sub === "string" ? boot.sub : "";
    const [space, setSpace] = React.useState(SPACES.some((s) => s.id === bootSpace) ? bootSpace : "patyia");
    const [sub, setSub] = React.useState(SUBSPACES.some((s) => s.id === bootSub) ? bootSub : "bitacora");
    const [reloadKey, setReload] = React.useState(0);

    React.useEffect(() => { window.ISAJ.UrlState.merge({ space, sub }); }, [space, sub]);

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
      if (sub === "checks") return React.createElement(window.ISAJ.ChecksView, props);
      return null;
    }

    const drawer = React.createElement(MUI.Drawer, {
          variant: "permanent",
          sx: {
            width: 220, flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: 220, boxSizing: "border-box",
              display: "flex", flexDirection: "column", overflow: "hidden",
            },
          },
        },
          React.createElement(MUI.Toolbar, { sx: { flexShrink: 0 } },
            React.createElement(MUI.Stack, { direction: "row", spacing: 1, alignItems: "center" },
              React.createElement(UI.Icon, { icon: "mdi:view-dashboard-variant-outline", size: 26 }),
              React.createElement(MUI.Typography, { variant: "h6" }, "Panel"))),
          React.createElement(MUI.Divider, { sx: { flexShrink: 0 } }),
          React.createElement(MUI.Box, { sx: { flex: 1, minHeight: 0, overflow: "auto" } },
            React.createElement(MUI.List, { subheader: React.createElement(MUI.ListSubheader, null, "Áreas") },
              SPACES.map((s) =>
                React.createElement(MUI.ListItemButton, {
                  key: s.id, selected: space === s.id, onClick: () => setSpace(s.id),
                },
                  React.createElement(MUI.ListItemIcon, { sx: { minWidth: 36 } }, React.createElement(UI.Icon, { icon: s.icon })),
                  React.createElement(MUI.ListItemText, { primary: s.label }))))));

    const spaceLabel = SPACES.find((s) => s.id === space)?.label || space;

    const main = React.createElement(MUI.Box, {
      sx: { flex: 1, minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" },
    },
      React.createElement(MUI.AppBar, { position: "static", color: "default", elevation: 0, sx: { borderBottom: 1, borderColor: "divider", flexShrink: 0 } },
        React.createElement(MUI.Toolbar, { sx: { gap: 1 } },
          React.createElement(MUI.Typography, { variant: "h6" }, spaceLabel),
          React.createElement(MUI.Box, { sx: { flexGrow: 1 } }),
          React.createElement(UI.TargetSwitch, null),
          React.createElement(MUI.Tooltip, { title: "Recargar" },
            React.createElement(MUI.IconButton, { size: "small", color: "inherit", onClick: () => setReload(reloadKey + 1) },
              React.createElement(UI.Icon, { icon: "mdi:refresh" }))),
          React.createElement(UI.ThemeSwitch, { mode: tm.mode, onToggle: tm.toggle }),
          React.createElement(window.ISAJ.LoginButton, null))),
      React.createElement(MUI.Tabs, {
        value: sub, onChange: (_e: unknown, v: string) => setSub(v),
        sx: { px: 2, borderBottom: 1, borderColor: "divider", flexShrink: 0 }, variant: "scrollable",
      },
        SUBSPACES.map((ss) =>
          React.createElement(MUI.Tab, {
            key: ss.id, value: ss.id, label: ss.label,
            icon: React.createElement(UI.Icon, { icon: ss.icon }), iconPosition: "start",
          }))),
      React.createElement(MUI.Box, { sx: { p: 3, flex: 1, minHeight: 0, overflow: "auto" } }, renderView()));

    return React.createElement(MUI.ThemeProvider, { theme: tm.theme },
      React.createElement(MUI.CssBaseline, null),
      React.createElement(MUI.Box, { sx: { display: "flex", height: "100%", overflow: "hidden" } }, drawer, main));
  }

  window.ISAJ = window.ISAJ || ({} as IsajNs);
  window.ISAJ.mount = function () {
    const root = document.getElementById("root");
    if (!root) throw new Error("No se encontró #root");
    ReactDOM.createRoot(root).render(React.createElement(App));
  };
  window.ISAJ.mount();
})();
