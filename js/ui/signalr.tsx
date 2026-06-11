/*
 * ui/signalr — conexión SignalR opcional (notificaciones en tiempo real).
 * Se conecta solo si hay sesión; degrada en silencio si el negotiate no está.
 */

type SignalRStatus = "disconnected" | "connecting" | "connected" | "reconnecting" | "error";

(function () {
  "use strict";
  const React = (window as any).React;
  const w = window as any;

  function useSignalR(onMessage?: (payload: unknown) => void): SignalRStatus {
    const [status, setStatus] = React.useState<SignalRStatus>("disconnected");

    React.useEffect(() => {
      if (!w.signalR || !w.ISAJ.Session.isLoggedIn()) return;
      let conn: any = null;
      let stopped = false;
      try {
        const base = w.ISAJ.Config.getLabBase();
        conn = new w.signalR.HubConnectionBuilder()
          .withUrl(base + "/api", {
            accessTokenFactory: () => {
              const s = w.ISAJ.Session.current();
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
      } catch (e) { setStatus("error"); }
      return () => { stopped = true; if (conn) { try { conn.stop(); } catch (e) {} } };
    }, []);

    return status;
  }

  w.ISAJ = w.ISAJ || {};
  w.ISAJ.useSignalR = useSignalR;
})();
