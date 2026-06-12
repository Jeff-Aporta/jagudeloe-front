/** Chip prod/local — solo editable con sesión iniciada. */
import { getReact, getMaterialUI } from "../core/runtime.ts";
import { UI } from "../core/platform.ts";
import { useSession } from "../core/useSession.ts";

function gatewayLabel(isLocal) {
  return isLocal ? "Local" : "Producción";
}

export function GatewaySwitch() {
  const { useState, useEffect } = getReact();
  const { Chip, Tooltip } = getMaterialUI();
  const { Icon } = UI;
  const cfg = window.ISAJ.Config;
  const { loggedIn } = useSession();
  const [local, setLocal] = useState(() => (loggedIn ? cfg.isLocal() : false));

  useEffect(() => {
    function onTarget() { setLocal(loggedIn ? cfg.isLocal() : false); }
    window.addEventListener(cfg.EVENT, onTarget);
    return () => window.removeEventListener(cfg.EVENT, onTarget);
  }, [loggedIn]);

  useEffect(() => {
    if (!loggedIn) {
      if (cfg.isLocal()) cfg.setLocal(false);
      setLocal(false);
    }
  }, [loggedIn]);

  const isLocal = loggedIn && local;
  const tip = loggedIn
    ? "Conexión: " + gatewayLabel(isLocal)
    : "Producción (inicia sesión para cambiar el entorno)";

  return (
    <Tooltip title={tip}>
      <span>
        <Chip
          size="small"
          color={isLocal ? "warning" : "primary"}
          variant="outlined"
          disabled={!loggedIn}
          icon={<Icon icon={isLocal ? "mdi:laptop" : "mdi:cloud-outline"} size={16} />}
          label={gatewayLabel(isLocal)}
          onClick={loggedIn ? () => cfg.setLocal(!local) : undefined}
          sx={{
            cursor: loggedIn ? "pointer" : "default",
            height: "auto",
            minHeight: 28,
            py: 0.375,
            "& .MuiChip-label": { px: 1.25, py: 0.25 },
            "& .MuiChip-icon": { ml: 0.75, mr: -0.25 },
          }}
        />
      </span>
    </Tooltip>
  );
}
