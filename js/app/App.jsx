/* app/App — raíz jagudeloe. Spaces → tickets/isp-svelte. Shell compartido front-shared. */
import { getReact, getMaterialUI } from "../core/platform.ts";
import { UI, Toast, Session } from "../core/platform.ts";
import { merge, subscribe, boot } from "../core/urlState.ts";
import { invalidateRevisadoCache } from "../api/client.ts";
import { useRealtimeNotifications } from "../ui/realtime.ts";

const { lazy, Suspense } = getReact();

/** Vistas con export nombrado (esbuild no genera default en _dist). */
function lazyNamed(loader, name) {
  return lazy(() => loader().then((m) => ({ default: m[name] })));
}

const TicketsView = lazyNamed(() => import("../views/TicketsView.jsx"), "TicketsView");
const IspSvelteView = lazyNamed(() => import("../views/IspSvelteView.jsx"), "IspSvelteView");

const SPACES = [
  { id: "general", label: "General", icon: "mdi:view-grid-outline" },
  { id: "patyia", label: "PatyIA", icon: "mdi:robot-happy-outline" },
  { id: "clientesis", label: "Clientes", icon: "mdi:account-group-outline" },
  { id: "isp-svelte", label: "ISP-Svelte", icon: "mdi:package-variant-closed" },
];
const SUBSPACES = [
  { id: "tickets", label: "Tickets", icon: "mdi:ticket-confirmation-outline" },
];

function normalizeSub(raw) {
  if (raw === "metricas" || raw === "bitacora" || raw === "checks") return "tickets";
  if (raw === "pendientes") return "tickets"; // legado 15-jul-2026: reasignados a TK reales
  return raw;
}

export function App() {
  const { useState, useEffect, useRef } = getReact();
  const { Box, CircularProgress } = getMaterialUI();
  const { LoginButton } = UI;
  const { show: toastShow } = Toast;
  const bootSpace = typeof boot.space === "string" ? boot.space : "";
  const bootSub = normalizeSub(typeof boot.sub === "string" ? boot.sub : "");
  const [space, setSpace] = useState(SPACES.some((s) => s.id === bootSpace) ? bootSpace : "patyia");
  const [sub, setSub] = useState(SUBSPACES.some((s) => s.id === bootSub) ? bootSub : "tickets");
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
        const nextSub = normalizeSub(s.sub);
        if (SUBSPACES.some((x) => x.id === nextSub) && nextSub !== sub) setSub(nextSub);
      }
    });
  }, [space, sub]);

  useEffect(() => {
    function onBrandHome() {
      setSpace("patyia");
      setSub("tickets");
      setReload((k) => k + 1);
    }
    window.addEventListener("isa:brand-home", onBrandHome);
    return () => window.removeEventListener("isa:brand-home", onBrandHome);
  }, []);

  function renderView() {
    const props = { project: space, reloadKey };
    const fallback = (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", flex: 1, py: 6 }}>
        <CircularProgress size={28} />
      </Box>
    );
    if (space === "isp-svelte") {
      return (
        <Suspense fallback={fallback}>
          <IspSvelteView {...props} />
        </Suspense>
      );
    }
    if (sub === "tickets") {
      return (
        <Suspense fallback={fallback}>
          <TicketsView {...props} />
        </Suspense>
      );
    }
    return null;
  }

  const Shell = window.ISAFront?.Layout?.AppShell;
  if (!Shell) throw new Error("AppShell no cargado — revisar loader y front-shared");

  const toolbarTools = <LoginButton />;

  const viewShellSx = {
    flex: 1,
    minHeight: 0,
    height: "100%",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  };

  return (
    <Shell
      ns="ISAJ"
      toolbarExtra={toolbarTools}
      navRows={[
        { id: "space", tier: "primary", value: space, onChange: setSpace, tabs: SPACES },
        { id: "sub", tier: "secondary", value: sub, onChange: setSub, tabs: SUBSPACES },
      ]}
    >
      <Box className="isa-view-shell" sx={viewShellSx}>{renderView()}</Box>
    </Shell>
  );
}
