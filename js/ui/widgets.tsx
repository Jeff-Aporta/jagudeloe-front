/* ui/widgets — componentes UI compartidos: ícono, switches, carga, error. */

interface IconProps { icon: string; size?: number; style?: Record<string, unknown>; }

(function () {
  "use strict";
  const React = (window as any).React;
  const MUI = (window as any).MaterialUI;
  const w = window as any;

  function Icon(props: IconProps) {
    return React.createElement("iconify-icon", {
      icon: props.icon,
      style: Object.assign({ fontSize: props.size || 20, verticalAlign: "middle" }, props.style),
    });
  }

  function ThemeSwitch(props: { mode: string; onToggle: () => void }) {
    return React.createElement(MUI.Tooltip, { title: props.mode === "dark" ? "Cambiar a claro" : "Cambiar a oscuro" },
      React.createElement(MUI.IconButton, { color: "inherit", onClick: props.onToggle, size: "small" },
        React.createElement(Icon, { icon: props.mode === "dark" ? "mdi:weather-sunny" : "mdi:weather-night" })));
  }

  function LabTargetSwitch() {
    const [local, setLocal] = React.useState(w.ISAJ.Config.isLocalMode());
    React.useEffect(() => {
      const onEvt = () => setLocal(w.ISAJ.Config.isLocalMode());
      window.addEventListener(w.ISAJ.Config.EVENT, onEvt);
      return () => window.removeEventListener(w.ISAJ.Config.EVENT, onEvt);
    }, []);
    return React.createElement(MUI.Tooltip, { title: "Origen de datos: " + w.ISAJ.Config.getLabTargetLabel() },
      React.createElement(MUI.Chip, {
        size: "small",
        color: local ? "warning" : "primary",
        variant: "outlined",
        icon: React.createElement(Icon, { icon: local ? "mdi:laptop" : "mdi:cloud-outline", size: 16 }),
        label: local ? "local" : "online",
        onClick: () => w.ISAJ.Config.setLocalMode(!local),
        sx: { cursor: "pointer" },
      }));
  }

  function Loading(props: { label?: string }) {
    return React.createElement(MUI.Box, { sx: { display: "flex", alignItems: "center", gap: 1, p: 3, color: "text.secondary" } },
      React.createElement(MUI.CircularProgress, { size: 20 }),
      React.createElement("span", null, props.label || "Cargando…"));
  }

  function ErrorBox(props: { message?: string }) {
    return React.createElement(MUI.Alert, { severity: "error", sx: { my: 2 } }, props.message || "Error");
  }

  w.ISAJ = w.ISAJ || {};
  w.ISAJ.UI = { Icon, ThemeSwitch, LabTargetSwitch, Loading, ErrorBox };
})();
