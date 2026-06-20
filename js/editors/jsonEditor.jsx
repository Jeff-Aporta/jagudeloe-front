import { CodeMirrorPanel } from "../core/platform.ts";

/** Editor JSON editable (CodeMirror compartido + copiar + pantalla completa). */
export function JsonCodeEditor({
  value = "",
  onChange,
  placeholder = "",
  minHeight = "20rem",
  fullPageTitle = "JSON",
  toolbarExtra = null,
}) {
  return (
    <CodeMirrorPanel
      value={value}
      onChange={onChange}
      json
      readOnly={false}
      minHeight={minHeight}
      lineWrapping
      enableFullPage
      fullPageTitle={fullPageTitle}
      placeholder={placeholder}
      className="tk-code-cm"
      toolbarExtra={toolbarExtra}
    />
  );
}
