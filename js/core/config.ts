/* core/config — API jagudeloe (Cloudflare Worker): switch local/online. */

interface ISAJConfig {
  isLocalMode(): boolean;
  setLocalMode(enabled: boolean): void;
  getLabBase(): string;
  getLabTargetLabel(): string;
  apiUrl(path: string): string;
  EVENT: string;
  LAB_LOCAL: string;
  LAB_ONLINE: string;
}

(function () {
  "use strict";

  const LAB_LOCAL = "http://localhost:8787";
  const LAB_ONLINE = "https://jagudeloe.jeffaporta.workers.dev";
  const LS_KEY = "jagudeloe:api-local";
  const EVT = "jagudeloe:api-target";

  function isLocalMode(): boolean {
    try { return localStorage.getItem(LS_KEY) === "1"; } catch (e) { return false; }
  }
  function setLocalMode(enabled: boolean): void {
    try { localStorage.setItem(LS_KEY, enabled ? "1" : "0"); } catch (e) {}
    window.dispatchEvent(new Event(EVT));
  }
  function getLabBase(): string {
    return (isLocalMode() ? LAB_LOCAL : LAB_ONLINE).replace(/\/$/, "");
  }
  function getLabTargetLabel(): string {
    return isLocalMode() ? "local :8787" : "online";
  }
  function apiUrl(path: string): string {
    return getLabBase() + (path.charAt(0) === "/" ? path : "/" + path);
  }

  const w = window as any;
  w.ISAJ = w.ISAJ || {};
  w.ISAJ.Config = {
    isLocalMode, setLocalMode, getLabBase, getLabTargetLabel, apiUrl,
    EVENT: EVT, LAB_LOCAL, LAB_ONLINE,
  } as ISAJConfig;
})();
