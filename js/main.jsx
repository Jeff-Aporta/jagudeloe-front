/** Punto de entrada — monta la app React (isa-setup ya ejecutado en loader). */
import { getReact, getReactDOM } from "./core/runtime.ts";
import { App } from "./app/App.jsx";

const { createRoot } = getReactDOM();
const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("No se encontró #root");
createRoot(rootEl).render(getReact().createElement(App));
