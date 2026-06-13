/** Punto de entrada — monta la app React (isa-setup ya ejecutado en loader). */
import { getReact, getReactDOM } from "./core/runtime.ts";
import { App } from "./app/App.jsx";

const React = getReact();
const { createRoot } = getReactDOM();
const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("No se encontró #root");

class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      const msg = this.state.error instanceof Error
        ? (this.state.error.stack || this.state.error.message)
        : String(this.state.error);
      return React.createElement(
        "pre",
        { style: { color: "#ff8a80", padding: 24, fontFamily: "monospace", whiteSpace: "pre-wrap" } },
        msg,
      );
    }
    return this.props.children;
  }
}

createRoot(rootEl).render(
  React.createElement(RootErrorBoundary, null, React.createElement(App)),
);
