/*
 * Orquestador de arranque. Descarga cada módulo (.ts/.tsx), lo transpila con
 * Babel standalone (typescript + react) y lo ejecuta en orden de dependencias.
 */
declare const Babel: { transform(code: string, opts: unknown): { code: string } };

(function () {
  "use strict";

  const FILES: string[] = [
    // core (infraestructura)
    "js/core/config.ts",
    "js/core/auth-api.ts",
    "js/core/caesar.ts",
    "js/core/urlState.ts",
    "js/core/storage.ts",
    // api (backend lab-langgraph)
    "js/api/session.ts",
    "js/api/client.ts",
    // ui (presentación compartida)
    "js/ui/theme.tsx",
    "js/ui/signalr.tsx",
    "js/ui/widgets.tsx",
    // views (subspaces)
    "js/views/BitacoraView.tsx",
    "js/views/TicketsView.tsx",
    "js/views/ChecksView.tsx",
    // app (raíz)
    "js/app/Login.tsx",
    "js/app/App.tsx",
  ];

  function showError(msg: string): void {
    const root = document.getElementById("root");
    if (root) root.innerHTML = '<pre style="color:#ff8a80;padding:24px;font-family:monospace">' + msg + "</pre>";
  }

  async function run(): Promise<void> {
    try {
      for (const file of FILES) {
        const res = await fetch(file + "?v=" + Date.now());
        if (!res.ok) throw new Error("No se pudo cargar " + file + " (" + res.status + ")");
        const src = await res.text();
        const preset = file.endsWith(".tsx") ? ["typescript", "react"] : ["typescript"];
        const out = Babel.transform(src, { presets: preset, filename: file }).code;
        new Function(out)();
      }
      (window as any).ISAJ.mount();
    } catch (e: any) {
      showError("Error de arranque:\n" + (e && e.stack ? e.stack : e));
    }
  }

  run();
})();
