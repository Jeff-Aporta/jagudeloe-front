/* app/Login — diálogo de login contra system-login. */
import { getReact, getMaterialUI } from "../core/runtime.ts";
import { UI, Session } from "../core/platform.ts";
import { formatLocalDateTime as fmtIso } from "../core/isa-front.ts";

function fmtExp(iso) { return iso ? fmtIso(iso) : ""; }

export function LoginButton() {
  const { useState, useEffect } = getReact();
  const { Stack, Tooltip, Chip, IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions, Typography, Alert, TextField } = getMaterialUI();
  const { Icon } = UI;
  const { current, isLoggedIn, username, login, logout, EVENT } = Session;
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [, setSess] = useState(current());

  useEffect(() => {
    const onAuth = () => setSess(current());
    window.addEventListener(EVENT, onAuth);
    return () => window.removeEventListener(EVENT, onAuth);
  }, []);

  function submit() {
    setBusy(true);
    setErr(null);
    login(user, pass).then(() => { setOpen(false); setPass(""); }).catch((e) => setErr(e instanceof Error ? e.message : String(e))).finally(() => setBusy(false));
  }

  if (isLoggedIn()) {
    const sess = current();
    const tip = sess?.expiresAt ? ("Expira: " + fmtExp(sess.expiresAt)) : "Sesión activa";
    return (
      <Stack direction="row" spacing={1} alignItems="center">
        <Tooltip title={tip}>
          <Chip size="small" color="success" icon={<Icon icon="mdi:account-check" size={16} />} label={username()} />
        </Tooltip>
        <Tooltip title="Cerrar sesión">
          <IconButton size="small" color="inherit" onClick={() => logout()}>
            <Icon icon="mdi:logout" />
          </IconButton>
        </Tooltip>
      </Stack>
    );
  }

  return (
    <>
      <Button size="small" variant="outlined" color="inherit" startIcon={<Icon icon="mdi:login" />} onClick={() => setOpen(true)}>Iniciar sesión</Button>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Iniciar sesión</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Use su usuario y contraseña de la organización. La sesión se comparte entre todas las aplicaciones.
          </Typography>
          {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
          <TextField label="Usuario" fullWidth size="small" sx={{ mb: 2 }} value={user} onChange={(e) => setUser(e.target.value)} />
          <TextField label="Contraseña" type="password" fullWidth size="small" value={pass} onChange={(e) => setPass(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") submit(); }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" disabled={busy || !user} onClick={submit}>{busy ? "Entrando…" : "Entrar"}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
