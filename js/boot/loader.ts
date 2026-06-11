(function () {
  "use strict";
  const HELPER = "https://cdn.jsdelivr.net/gh/Jeff-Aporta/front-shared@main/cdn/boot-helper.mjs";
  const FILES: string[] = [
    "js/core/isa-setup.ts",
    "js/core/urlState.ts",
    "js/core/storage.ts",
    "js/api/client.ts",
    "js/ui/signalr.tsx",
    "js/views/BitacoraView.tsx",
    "js/views/TicketsView.tsx",
    "js/views/ChecksView.tsx",
    "js/app/Login.tsx",
    "js/app/App.tsx",
  ];

  async function boot(): Promise<void> {
    const { bootApp } = await import(HELPER);
    await bootApp({ files: FILES, Babel });
  }

  function showErr(err: unknown): void {
    const root = document.getElementById("root");
    const msg = err instanceof Error ? err.stack || err.message : String(err);
    if (root) root.innerHTML = '<pre style="color:#ff8a80;padding:24px;font-family:monospace">Error de arranque:\n' + msg + "</pre>";
    console.error(err);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => boot().catch(showErr));
  else boot().catch(showErr);
})();
