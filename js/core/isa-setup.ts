(function () {
  "use strict";
  window.ISAFront.registerApp({
    ns: "ISAJ",
    api: {
      local: "http://localhost:8783",
      online: "https://jagudeloe.jeffaporta.workers.dev",
      lsKey: "jagudeloe:api-local",
      event: "jagudeloe:api-target",
    },
    theme: { lsKey: "jagudeloe:theme" },
    widgets: { targetStyle: "chip" },
    session: true,
  });
})();
