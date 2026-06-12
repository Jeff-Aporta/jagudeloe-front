/* Bloque de código de solo lectura con CodeMirror. */
import { getReact, getMaterialUI } from "../core/runtime.ts";

function cmMode(lang) {
  const l = String(lang || "sql").toLowerCase();
  if (l === "json") return { name: "javascript", json: true };
  if (l === "javascript" || l === "js") return "javascript";
  if (l === "typescript" || l === "ts") return "text/typescript";
  return "text/x-sql";
}

function cmTheme(paletteMode) {
  return paletteMode === "dark" ? "dracula" : "default";
}

export function CodeBlock(props) {
  const { useRef, useEffect } = getReact();
  const { useTheme } = getMaterialUI();
  const { Box, Typography } = getMaterialUI();
  const wrapRef = useRef(null);
  const cmRef = useRef(null);
  const theme = useTheme();
  const lang = props.language || "sql";
  const code = String(props.code ?? "");

  useEffect(() => {
    const CM = window.CodeMirror;
    const el = wrapRef.current;
    if (!el || !CM) return;
    if (!cmRef.current) {
      cmRef.current = CM(el, {
        value: code,
        mode: cmMode(lang),
        theme: cmTheme(theme.palette.mode),
        lineNumbers: true,
        lineWrapping: true,
        readOnly: true,
        viewportMargin: Infinity,
      });
      setTimeout(() => cmRef.current && cmRef.current.refresh(), 30);
    } else {
      cmRef.current.setOption("theme", cmTheme(theme.palette.mode));
      if (cmRef.current.getValue() !== code) cmRef.current.setValue(code);
    }
  }, [code, lang, theme.palette.mode]);

  useEffect(() => () => {
    if (cmRef.current) {
      cmRef.current.toTextArea?.();
      cmRef.current = null;
    }
  }, []);

  const CM = window.CodeMirror;
  if (!CM) {
    return (
      <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1, overflow: "hidden" }}>
        {lang && (
          <Typography variant="caption" sx={{ display: "block", px: 1.25, py: 0.5, bgcolor: "action.hover", textTransform: "uppercase", letterSpacing: 0.5 }}>
            {lang}
          </Typography>
        )}
        <Box component="pre" sx={{ m: 0, p: 1.25, fontSize: 12, fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          {code}
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1, overflow: "visible", my: 1, maxWidth: "100%" }}>
      {lang && (
        <Typography variant="caption" sx={{ display: "block", px: 1.25, py: 0.5, bgcolor: "action.hover", color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.5 }}>
          {lang}
        </Typography>
      )}
      <Box ref={wrapRef} className="tk-code-cm sql-cm" sx={{ maxWidth: "100%" }} />
    </Box>
  );
}
