/** Constantes y utilidades del runtime compartido ISAFront (global). */
export function getRealtimeConstants() {
  const f = window.ISAFront || {};
  return {
    REALTIME: f.REALTIME || { CHECKS_UPDATED: "checks.updated" },
    REALTIME_EVENT: f.REALTIME_EVENT || "isa:realtime",
  };
}

export function formatLocalDateTime(iso: string): string {
  const fn = window.ISAFront?.formatLocalDateTime;
  if (typeof fn === "function") return fn(iso);
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? String(iso) : d.toLocaleString(undefined, {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  });
}
