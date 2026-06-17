/* ui/realtime — escucha notificaciones WebSocket del orquestador. */
import { getReact } from "../core/platform.ts";
import { Realtime } from "../core/platform.ts";
import { getRealtimeConstants } from "../core/platform.ts";

export function useRealtimeNotifications(opts: { project: string; onChecksUpdated?: (msg: ChecksUpdatedMessage) => void }) {
  const { useState, useEffect, useRef } = getReact();
  const { getStatus } = Realtime;
  const [status, setStatus] = useState("disconnected");
  const projectRef = useRef(opts.project);
  const cbRef = useRef(opts.onChecksUpdated);
  projectRef.current = opts.project;
  cbRef.current = opts.onChecksUpdated;

  useEffect(() => {
    const { REALTIME, REALTIME_EVENT } = getRealtimeConstants();
    if (getStatus) setStatus(getStatus() || "disconnected");
    function onRealtime(e: Event) {
      const msg = (e as CustomEvent).detail as ChecksUpdatedMessage | undefined;
      if (!msg || msg.type !== REALTIME.CHECKS_UPDATED) return;
      if (msg.project !== projectRef.current) return;
      cbRef.current?.(msg);
    }
    window.addEventListener(REALTIME_EVENT, onRealtime);
    return () => window.removeEventListener(REALTIME_EVENT, onRealtime);
  }, [opts.project]);

  useEffect(() => {
    const id = setInterval(() => { if (getStatus) setStatus(getStatus() || "disconnected"); }, 2000);
    return () => clearInterval(id);
  }, []);

  return status;
}
