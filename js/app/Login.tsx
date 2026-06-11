/* app/Login — diálogo de login contra lab-langgraph (/api/auth/token). */
(function () {
  "use strict";
  const MUI = MaterialUI;
  const UI = window.ISAJ.UI;

  function fmtExp(iso: string | null | undefined): string {
    if (!iso) return "";
    const F = window.ISAFront && (window.ISAFront as { formatLocalDateTime?: (v: string) => string }).formatLocalDateTime;
    if (F) return F(iso);
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? String(iso) : d.toLocaleString(undefined, {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
    });
  }

  function LoginButton() {
    const [open, setOpen] = React.useState(false);
    const [user, setUser] = React.useState("");
    const [pass, setPass] = React.useState("");
    const [err, setErr] = React.useState<string | null>(null);
    const [busy, setBusy] = React.useState(false);
    const [, setSess] = React.useState(window.ISAJ.Session.current());

    React.useEffect(() => {
      const onAuth = () => setSess(window.ISAJ.Session.current());
      window.addEventListener(window.ISAJ.Session.EVENT, onAuth);
      return () => window.removeEventListener(window.ISAJ.Session.EVENT, onAuth);
    }, []);

    function submit() {
      setBusy(true); setErr(null);
      window.ISAJ.Session.login(user, pass)
        .then(() => { setOpen(false); setPass(""); })
        .catch((e) => setErr(e instanceof Error ? e.message : String(e)))
        .finally(() => setBusy(false));
    }

    if (window.ISAJ.Session.isLoggedIn()) {
      const sess = window.ISAJ.Session.current();
      const tip = sess?.expiresAt ? ("Expira: " + fmtExp(sess.expiresAt)) : "Sesión activa";
      return React.createElement(MUI.Stack, { direction: "row", spacing: 1, alignItems: "center" },
        React.createElement(MUI.Tooltip, { title: tip },
          React.createElement(MUI.Chip, {
            size: "small", color: "success",
            icon: React.createElement(UI.Icon, { icon: "mdi:account-check", size: 16 }),
            label: window.ISAJ.Session.username(),
          })),
        React.createElement(MUI.Tooltip, { title: "Cerrar sesión" },
          React.createElement(MUI.IconButton, { size: "small", color: "inherit", onClick: () => window.ISAJ.Session.logout() },
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
            "Use su usuario y contraseña de la organización. La sesión se comparte entre todas las aplicaciones."),
          err && React.createElement(MUI.Alert, { severity: "error", sx: { mb: 2 } }, err),
          React.createElement(MUI.TextField, {
            label: "Usuario", fullWidth: true, size: "small", sx: { mb: 2 },
            value: user, onChange: (e: Event) => setUser((e.target as HTMLInputElement).value),
          }),
          React.createElement(MUI.TextField, {
            label: "Contraseña", type: "password", fullWidth: true, size: "small",
            value: pass, onChange: (e: Event) => setPass((e.target as HTMLInputElement).value),
            onKeyDown: (e: KeyboardEvent) => { if (e.key === "Enter") submit(); },
          })),
        React.createElement(MUI.DialogActions, null,
          React.createElement(MUI.Button, { onClick: () => setOpen(false) }, "Cancelar"),
          React.createElement(MUI.Button, { variant: "contained", disabled: busy || !user, onClick: submit },
            busy ? "Entrando…" : "Entrar"))));
  }

  window.ISAJ = window.ISAJ || ({} as IsajNs);
  window.ISAJ.LoginButton = LoginButton;
})();
