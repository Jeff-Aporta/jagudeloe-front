/** Paleta y endpoints compartidos â€” Jeff-Aporta ISA fronts. */
export const DODGER = "#1e90ff";

/**
 * Orquestador central de APIs (Cloudflare Worker main-orchestrator).
 * ÃšNICO lugar donde se define la URL de producciÃ³n/local para todos los fronts.
 */
export const MAIN_ORCHESTRATOR_URL_PROD = "https://main-orchestrator.jeffaporta.workers.dev";
export const MAIN_ORCHESTRATOR_URL_LOCAL = "http://localhost:8790";
/** Panel hub del ecosistema (GitHub Pages). */
export const MAIN_ORCHESTRATOR_PAGES_URL = "https://jeff-aporta.github.io/main-orchestrator-front/";
export const MAIN_ORCHESTRATOR_LS_KEY = "jeff:gateway-local";
export const MAIN_ORCHESTRATOR_EVENT = "jeff:gateway-target";

/** @deprecated Usar MAIN_ORCHESTRATOR_* â€” alias temporal */
export const GATEWAY_URL_PROD = MAIN_ORCHESTRATOR_URL_PROD;
/** @deprecated */
export const GATEWAY_URL_LOCAL = MAIN_ORCHESTRATOR_URL_LOCAL;
/** @deprecated */
export const GATEWAY_LS_KEY = MAIN_ORCHESTRATOR_LS_KEY;
/** @deprecated */
export const GATEWAY_EVENT = MAIN_ORCHESTRATOR_EVENT;

export const AUTH_DEFAULTS = {
  sessionKey: "system-login:session",
  authEvent: "system-login:auth",
  authLocalKey: MAIN_ORCHESTRATOR_LS_KEY,
  authLocal: MAIN_ORCHESTRATOR_URL_LOCAL,
  authOnline: MAIN_ORCHESTRATOR_URL_PROD,
  loginUrl: "https://jeff-aporta.github.io/system-login-front/",
};

/** jsDelivr â€” pin de commit (mismo ref que boot-helper.mjs FRONT_SHARED_REF). */
export const FRONT_SHARED_REF = "a13fc29";
export const CDN_BASE = "https://cdn.jsdelivr.net/gh/Jeff-Aporta/front-shared@" + FRONT_SHARED_REF + "/cdn/isa";
export const UI_CDN_BASE = "https://cdn.jsdelivr.net/gh/Jeff-Aporta/front-shared@" + FRONT_SHARED_REF + "/cdn/ui";
export const FEEDBACK_CSS_URL = CDN_BASE + "/css/feedback.css";

/** CodeMirror 5 â€” CDN compartido (lazy-assets). */
export const CODEMIRROR_VERSION = "5.65.18";
export const CODEMIRROR_CDN = "https://cdnjs.cloudflare.com/ajax/libs/codemirror/" + CODEMIRROR_VERSION;

/** marked â€” carga lazy (lazy-assets / markdown). */
export const MARKED_CDN_URL = "https://cdn.jsdelivr.net/npm/marked@12.0.2/marked.min.js";
