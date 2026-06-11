/*
 * ui/signalr — conexión SignalR opcional (notificaciones en tiempo real).
 * Se conecta solo si hay sesión; degrada en silencio si el negotiate no está.
 */

(function () {
  "use strict";

  function useSignalR(onMessage?: (payload: unknown) => void): SignalRStatus {
    const [status, setStatus] = React.useState<SignalRStatus>("disconnected");

    React.useEffect(() => {
      if (!window.signalR || !window.ISAJ.Session.isLoggedIn()) return;
      let conn: SignalRHub | null = null;
      let stopped = false;
      try {
        const base = window.ISAJ.Config.base?.() || "";
        conn = new window.signalR.HubConnectionBuilder()
          .withUrl(base + "/api/signalr", {
            accessTokenFactory: () => {
              const s = window.ISAJ.Session.current();
              return s ? s.token : "";
            },
          })
          .withAutomaticReconnect()
          .build();
        conn.on("notify", (payload: unknown) => { if (onMessage) onMessage(payload); });
        conn.onreconnecting(() => { if (!stopped) setStatus("reconnecting"); });
        conn.onreconnected(() => { if (!stopped) setStatus("connected"); });
        setStatus("connecting");
        conn.start().then(() => { if (!stopped) setStatus("connected"); })
          .catch(() => { if (!stopped) setStatus("error"); });
      } catch (_e) { setStatus("error"); }
      return () => { stopped = true; if (conn) { void conn.stop().catch(() => {}); } };
    }, []);

    return status;
  }

  window.ISAJ = window.ISAJ || ({} as IsajNs);
  window.ISAJ.useSignalR = useSignalR;
})();
