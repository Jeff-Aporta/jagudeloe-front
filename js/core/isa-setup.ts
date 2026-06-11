(function () {
  "use strict";
  const host = location.hostname;
  const isLocalFront = host === "localhost" || host === "127.0.0.1" || host === "[::1]";
  if (isLocalFront) {
    try {
      localStorage.setItem("jeff:gateway-local", "1");
    } catch (e) {
      /* ignore */
    }
  }
  window.ISAFront.registerApp({
    ns: "ISAJ",
    theme: { lsKey: "jagudeloe:theme" },
    widgets: { targetStyle: "chip" },
    session: true,
    realtime: true,
  });
})();
