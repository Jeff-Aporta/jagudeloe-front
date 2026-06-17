/** Monta CodeMirror en bloques `.tk-code-wrap` generados por el driver HTML. */
function readStoredThemeMode(): "light" | "dark" {
  const key = window.ThemeInit?.lsKey ?? "jagudeloe:theme";
  const mode = window.ThemeInit?.readMode?.(key);
  return mode === "light" || mode === "dark" ? mode : "dark";
}

function isJsonLang(lang: string): boolean {
  return lang.toLowerCase() === "json";
}

type CmEditor = { setOption: (k: string, v: unknown) => void; refresh: () => void };
type CmGlobal = Window & {
  CodeMirror?: { (el: HTMLElement, opts: Record<string, unknown>): CmEditor };
  ISAFront?: { mountCodeMirror?: (host: HTMLElement, opts: Record<string, unknown>) => CmEditor | null };
};

function mountBlocks(root: HTMLElement, paletteMode: "light" | "dark"): void {
  const mount = (window as CmGlobal).ISAFront?.mountCodeMirror;
  const CM = (window as CmGlobal).CodeMirror;
  if (!mount && !CM) return;

  const theme = paletteMode === "dark" ? "dracula" : "default";

  root.querySelectorAll<HTMLElement>(".tk-code-wrap").forEach((wrap) => {
    if (wrap.dataset.cmMounted === "1") return;
    const pre = wrap.querySelector("pre.tk-code-block");
    if (!pre) return;
    wrap.dataset.cmMounted = "1";
    const code = pre.textContent || "";
    const lang = wrap.getAttribute("data-lang") || "sql";
    const json = isJsonLang(lang);
    wrap.innerHTML = "";
    wrap.classList.add("tk-code-cm", "sql-cm", "isa-cm-host");

    const opts = {
      value: code,
      json,
      mode: json ? undefined : "sql",
      theme,
      lineWrapping: true,
      readOnly: true,
      viewportMargin: Infinity,
    };

    const editor = mount ? mount(wrap, opts) : CM!(wrap, {
      value: code,
      mode: json ? { name: "javascript", json: true } : "text/x-sql",
      theme,
      lineNumbers: true,
      lineWrapping: true,
      readOnly: true,
      viewportMargin: Infinity,
    });

    if (editor) requestAnimationFrame(() => editor.refresh());
  });
}

export function hydrateTkCodeBlocks(root: HTMLElement, paletteMode: "light" | "dark" = readStoredThemeMode()): void {
  const load = (window as CmGlobal).ISAFront?.ensureCodeMirrorLoaded;
  if (typeof load !== "function") return;

  load({ sql: true })
    .then(() => mountBlocks(root, paletteMode))
    .catch((err) => console.warn("CodeMirror lazy load:", err));
}

export function refreshTkCodeThemes(root: HTMLElement, paletteMode: "light" | "dark"): void {
  const theme = paletteMode === "dark" ? "dracula" : "default";
  root.querySelectorAll<HTMLElement>(".tk-code-wrap[data-cm-mounted='1'] .CodeMirror").forEach((el) => {
    const cm = (el as HTMLElement & { CodeMirror?: CmEditor }).CodeMirror;
    if (cm) {
      cm.setOption("theme", theme);
      cm.setOption("lineWrapping", true);
      cm.refresh();
    }
  });
}
