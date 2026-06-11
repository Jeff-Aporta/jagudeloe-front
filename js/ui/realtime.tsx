/*
 * ui/realtime — escucha notificaciones WebSocket del orquestador (Cloudflare Realtime).
 */

(function () {
  "use strict";

  const RT = window.ISAFront.REALTIME;
  const EVT = window.ISAFront.REALTIME_EVENT;

  function useRealtimeNotifications(opts: {
    project: string;
    onChecksUpdated?: (msg: ChecksUpdatedMessage) => void;
  }): RealtimeStatus {
    const [status, setStatus] = React.useState<RealtimeStatus>("disconnected");
    const projectRef = React.useRef(opts.project);
    const cbRef = React.useRef(opts.onChecksUpdated);
    projectRef.current = opts.project;
    cbRef.current = opts.onChecksUpdated;

    React.useEffect(() => {
      const rt = window.ISAJ.Realtime;
      if (rt) setStatus((rt.getStatus() as RealtimeStatus) || "disconnected");

      function onRealtime(e: Event) {
        const msg = (e as CustomEvent).detail as ChecksUpdatedMessage;
        if (!msg || msg.type !== RT.CHECKS_UPDATED) return;
        if (msg.project !== projectRef.current) return;
        if (cbRef.current) cbRef.current(msg);
      }

      window.addEventListener(EVT, onRealtime);
      return () => window.removeEventListener(EVT, onRealtime);
    }, [opts.project]);

    React.useEffect(() => {
      const id = setInterval(() => {
        const rt = window.ISAJ.Realtime;
        if (rt) setStatus((rt.getStatus() as RealtimeStatus) || "disconnected");
      }, 2000);
      return () => clearInterval(id);
    }, []);

    return status;
  }

  window.ISAJ = window.ISAJ || ({} as IsajNs);
  window.ISAJ.useRealtimeNotifications = useRealtimeNotifications;
})();
