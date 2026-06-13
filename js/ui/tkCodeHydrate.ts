/** Monta CodeMirror en bloques `.tk-code-wrap` generados por el driver HTML. */
function readStoredThemeMode(): "light" | "dark" {
  const key = window.ThemeInit?.lsKey ?? "jagudeloe:theme";
  const mode = window.ThemeInit?.readMode?.(key);
  return mode === "light" || mode === "dark" ? mode : "dark";
}

function cmMode(lang: string): string | { name: string; json?: boolean } {
  const l = lang.toLowerCase();
  if (l === "json") return { name: "javascript", json: true };
  if (l === "javascript" || l === "js") return "javascript";
  return "text/x-sql";
}

type CmGlobal = Window & { CodeMirror?: { (el: HTMLElement, opts: Record<string, unknown>): { setOption: (k: string, v: unknown) => void; refresh: () => void } } };

export function hydrateTkCodeBlocks(root: HTMLElement, paletteMode: "light" | "dark" = readStoredThemeMode()): void {
  const CM = (window as CmGlobal).CodeMirror;
  if (!CM) return;
  const theme = paletteMode === "dark" ? "dracula" : "default";

  root.querySelectorAll<HTMLElement>(".tk-code-wrap").forEach((wrap) => {
    if (wrap.dataset.cmMounted === "1") return;
    const pre = wrap.querySelector("pre.tk-code-block");
    if (!pre) return;
    wrap.dataset.cmMounted = "1";
    const code = pre.textContent || "";
    const lang = wrap.getAttribute("data-lang") || "sql";
    wrap.innerHTML = "";
    wrap.classList.add("tk-code-cm", "sql-cm");
    const editor = CM(wrap, {
      value: code,
      mode: cmMode(lang),
      theme,
      lineNumbers: true,
      lineWrapping: true,
      readOnly: true,
      viewportMargin: Infinity,
    });
    requestAnimationFrame(() => editor.refresh());
  });
}

export function refreshTkCodeThemes(root: HTMLElement, paletteMode: "light" | "dark"): void {
  const theme = paletteMode === "dark" ? "dracula" : "default";
  root.querySelectorAll<HTMLElement>(".tk-code-wrap[data-cm-mounted='1'] .CodeMirror").forEach((el) => {
    const cm = (el as HTMLElement & { CodeMirror?: { setOption: (k: string, v: unknown) => void } }).CodeMirror;
    if (cm) {
      cm.setOption("theme", theme);
      cm.setOption("lineWrapping", true);
      cm.refresh();
    }
  });
}
