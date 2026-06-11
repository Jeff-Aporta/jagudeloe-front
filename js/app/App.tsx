/*
 * app/App — raíz de jagudeloe (ISA-DOC). Notion-like: spaces (proyectos) → subspaces
 * (bitácora/tickets/checks). El estado de navegación va en el query param `s`.
 */

interface SpaceDef { id: string; label: string; icon: string; }

(function () {
  "use strict";
  const React = (window as any).React;
  const ReactDOM = (window as any).ReactDOM;
  const MUI = (window as any).MaterialUI;
  const w = window as any;
  const UI = w.ISAJ.UI;

  const SPACES: SpaceDef[] = [
    { id: "patyia", label: "PatyIA", icon: "mdi:robot-happy-outline" },
    { id: "clientesis", label: "ClientesIS", icon: "mdi:account-group-outline" },
  ];
  const SUBSPACES: SpaceDef[] = [
    { id: "bitacora", label: "Bitácora", icon: "mdi:notebook-outline" },
    { id: "tickets", label: "Tickets", icon: "mdi:ticket-confirmation-outline" },
    { id: "checks", label: "Checks", icon: "mdi:check-circle-outline" },
  ];

  function App() {
    const tm = w.ISAJ.Theme.useThemeMode();
    const theme = React.useMemo(() => w.ISAJ.Theme.makeTheme(tm.mode), [tm.mode]);

    const boot = w.ISAJ.UrlState.boot || {};
    const [space, setSpace] = React.useState(SPACES.some((s: SpaceDef) => s.id === boot.space) ? boot.space : "patyia");
    const [sub, setSub] = React.useState(SUBSPACES.some((s: SpaceDef) => s.id === boot.sub) ? boot.sub : "bitacora");
    const [reloadKey, setReload] = React.useState(0);

    React.useEffect(() => { w.ISAJ.UrlState.merge({ space, sub }); }, [space, sub]);

    React.useEffect(() => {
      return w.ISAJ.UrlState.subscribe((s: any) => {
        if (s.space && s.space !== space) setSpace(s.space);
        if (s.sub && s.sub !== sub) setSub(s.sub);
      });
    }, [space, sub]);

    function renderView() {
      const props = { project: space, reloadKey };
      if (sub === "bitacora") return React.createElement(w.ISAJ.BitacoraView, props);
      if (sub === "tickets") return React.createElement(w.ISAJ.TicketsView, props);
      if (sub === "checks") return React.createElement(w.ISAJ.ChecksView, props);
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
              React.createElement(MUI.Typography, { variant: "h6" }, "ISA·J"))),
          React.createElement(MUI.Divider, { sx: { flexShrink: 0 } }),
          React.createElement(MUI.Box, { sx: { flex: 1, minHeight: 0, overflow: "auto" } },
            React.createElement(MUI.List, { subheader: React.createElement(MUI.ListSubheader, null, "Spaces") },
              SPACES.map((s: SpaceDef) =>
                React.createElement(MUI.ListItemButton, {
                  key: s.id, selected: space === s.id, onClick: () => setSpace(s.id),
                },
                  React.createElement(MUI.ListItemIcon, { sx: { minWidth: 36 } }, React.createElement(UI.Icon, { icon: s.icon })),
                  React.createElement(MUI.ListItemText, { primary: s.label }))))));

    const main = React.createElement(MUI.Box, {
      sx: { flex: 1, minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" },
    },
      React.createElement(MUI.AppBar, { position: "static", color: "default", elevation: 0, sx: { borderBottom: 1, borderColor: "divider", flexShrink: 0 } },
        React.createElement(MUI.Toolbar, { sx: { gap: 1 } },
          React.createElement(MUI.Typography, { variant: "h6", sx: { textTransform: "capitalize" } }, space),
          React.createElement(MUI.Box, { sx: { flexGrow: 1 } }),
          React.createElement(UI.LabTargetSwitch, null),
          React.createElement(MUI.Tooltip, { title: "Recargar" },
            React.createElement(MUI.IconButton, { size: "small", color: "inherit", onClick: () => setReload(reloadKey + 1) },
              React.createElement(UI.Icon, { icon: "mdi:refresh" }))),
          React.createElement(UI.ThemeSwitch, { mode: tm.mode, onToggle: tm.toggle }),
          React.createElement(w.ISAJ.LoginButton, null))),
      React.createElement(MUI.Tabs, {
        value: sub, onChange: (_e: any, v: string) => setSub(v),
        sx: { px: 2, borderBottom: 1, borderColor: "divider", flexShrink: 0 }, variant: "scrollable",
      },
        SUBSPACES.map((ss: SpaceDef) =>
          React.createElement(MUI.Tab, {
            key: ss.id, value: ss.id, label: ss.label,
            icon: React.createElement(UI.Icon, { icon: ss.icon }), iconPosition: "start",
          }))),
      React.createElement(MUI.Box, { sx: { p: 3, flex: 1, minHeight: 0, overflow: "auto" } }, renderView()));

    return React.createElement(MUI.ThemeProvider, { theme },
      React.createElement(MUI.CssBaseline, null),
      React.createElement(MUI.Box, { sx: { display: "flex", height: "100%", overflow: "hidden" } }, drawer, main));
  }

  w.ISAJ = w.ISAJ || {};
  w.ISAJ.mount = function () {
    ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App));
  };
  w.ISAJ.mount();
})();
