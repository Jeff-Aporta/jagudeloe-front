/* app/Login — diálogo de login contra lab-langgraph (/api/auth/token). */
(function () {
  "use strict";
  const React = (window as any).React;
  const MUI = (window as any).MaterialUI;
  const w = window as any;
  const UI = w.ISAJ.UI;

  function LoginButton() {
    const [open, setOpen] = React.useState(false);
    const [user, setUser] = React.useState("");
    const [pass, setPass] = React.useState("");
    const [err, setErr] = React.useState<string | null>(null);
    const [busy, setBusy] = React.useState(false);
    const [, setSess] = React.useState(w.ISAJ.Session.current());

    React.useEffect(() => {
      const onAuth = () => setSess(w.ISAJ.Session.current());
      window.addEventListener(w.ISAJ.Session.EVENT, onAuth);
      return () => window.removeEventListener(w.ISAJ.Session.EVENT, onAuth);
    }, []);

    function submit() {
      setBusy(true); setErr(null);
      w.ISAJ.Session.login(user, pass)
        .then(() => { setOpen(false); setPass(""); })
        .catch((e: any) => setErr(e.message))
        .finally(() => setBusy(false));
    }

    if (w.ISAJ.Session.isLoggedIn()) {
      return React.createElement(MUI.Stack, { direction: "row", spacing: 1, alignItems: "center" },
        React.createElement(MUI.Chip, {
          size: "small", color: "success",
          icon: React.createElement(UI.Icon, { icon: "mdi:account-check", size: 16 }),
          label: w.ISAJ.Session.username(),
        }),
        React.createElement(MUI.Tooltip, { title: "Cerrar sesión" },
          React.createElement(MUI.IconButton, { size: "small", color: "inherit", onClick: () => w.ISAJ.Session.logout() },
            React.createElement(UI.Icon, { icon: "mdi:logout" }))));
    }

    return React.createElement(React.Fragment, null,
      React.createElement(MUI.Button, {
        size: "small", variant: "outlined", color: "inherit",
        startIcon: React.createElement(UI.Icon, { icon: "mdi:login" }),
        onClick: () => setOpen(true),
      }, "Iniciar sesión"),
      React.createElement(MUI.Dialog, { open, onClose: () => setOpen(false), maxWidth: "xs", fullWidth: true },
        React.createElement(MUI.DialogTitle, null, "Iniciar sesión"),
        React.createElement(MUI.DialogContent, null,
          React.createElement(MUI.Typography, { variant: "body2", color: "text.secondary", sx: { mb: 2 } },
            "Auth centralizado vía system-login (sesión compartida con PatyIA, flsjeff, iatools)."),
          err && React.createElement(MUI.Alert, { severity: "error", sx: { mb: 2 } }, err),
          React.createElement(MUI.TextField, {
            label: "Usuario", fullWidth: true, size: "small", sx: { mb: 2 },
            value: user, onChange: (e: any) => setUser(e.target.value),
          }),
          React.createElement(MUI.TextField, {
            label: "Contraseña", type: "password", fullWidth: true, size: "small",
            value: pass, onChange: (e: any) => setPass(e.target.value),
            onKeyDown: (e: any) => { if (e.key === "Enter") submit(); },
          })),
        React.createElement(MUI.DialogActions, null,
          React.createElement(MUI.Button, { onClick: () => setOpen(false) }, "Cancelar"),
          React.createElement(MUI.Button, { variant: "contained", disabled: busy || !user, onClick: submit },
            busy ? "Entrando…" : "Entrar"))));
  }

  w.ISAJ = w.ISAJ || {};
  w.ISAJ.LoginButton = LoginButton;
})();
