/* app/App — raíz jagudeloe. Spaces → subspaces (bitácora/tickets). Shell compartido front-shared. */
import { getReact, getMaterialUI } from "../core/runtime.ts";
import { UI, Toast, Session } from "../core/platform.ts";
import { merge, subscribe, boot } from "../core/urlState.ts";
import { invalidateRevisadoCache } from "../api/client.ts";
import { useRealtimeNotifications } from "../ui/realtime.ts";
import { BitacoraView } from "../views/BitacoraView.jsx";
import { TicketsView } from "../views/TicketsView.jsx";
import { LoginButton } from "./Login.jsx";

const SPACES = [
  { id: "general", label: "General", icon: "mdi:view-grid-outline" },
  { id: "patyia", label: "PatyIA", icon: "mdi:robot-happy-outline" },
  { id: "clientesis", label: "Clientes", icon: "mdi:account-group-outline" },
];
const SUBSPACES = [
  { id: "bitacora", label: "Bitácora", icon: "mdi:notebook-outline" },
  { id: "tickets", label: "Tickets", icon: "mdi:ticket-confirmation-outline" },
];

export function App() {
  const { useState, useEffect, useRef } = getReact();
  const { Tooltip, IconButton } = getMaterialUI();
  const { Icon } = UI;
  const { show: toastShow } = Toast;
  const bootSpace = typeof boot.space === "string" ? boot.space : "";
  const bootSubRaw = typeof boot.sub === "string" ? boot.sub : "";
  const bootSub = bootSubRaw === "checks" ? "bitacora" : bootSubRaw === "metricas" ? "tickets" : bootSubRaw;
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
    function onAuth() { setReload((k) => k + 1); }
    window.addEventListener(Session.EVENT, onAuth);
    return () => window.removeEventListener(Session.EVENT, onAuth);
  }, []);
  useEffect(() => {
    return subscribe((s) => {
      if (typeof s.space === "string" && s.space !== space) setSpace(s.space);
      if (typeof s.sub === "string") {
        const nextSub = s.sub === "metricas" ? "tickets" : s.sub;
        if (nextSub !== sub) setSub(nextSub);
      }
    });
  }, [space, sub]);

  function renderView() {
    const props = { project: space, reloadKey };
    if (sub === "bitacora") return <BitacoraView {...props} />;
    if (sub === "tickets") return <TicketsView {...props} />;
    return null;
  }

  const Shell = window.ISAFront?.Layout?.AppShell;
  if (!Shell) throw new Error("AppShell no cargado — revisar loader.ts y front-shared");

  return (
    <Shell
      ns="ISAJ"
      icon="mdi:view-dashboard-variant-outline"
      showTitle={false}
      navRows={[
        { id: "space", value: space, onChange: setSpace, tabs: SPACES, minHeight: 48 },
        { id: "sub", value: sub, onChange: setSub, tabs: SUBSPACES, minHeight: 44 },
      ]}
      toolbarActions={(
        <Tooltip title="Recargar">
          <IconButton size="small" color="inherit" onClick={() => setReload(reloadKey + 1)}>
            <Icon icon="mdi:refresh" />
          </IconButton>
        </Tooltip>
      )}
      toolbarEnd={<LoginButton />}
    >
      {renderView()}
    </Shell>
  );
}
