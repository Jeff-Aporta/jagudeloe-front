/* Bloque de código de solo lectura — delega en ISAFront.CodeMirrorPanel. */
import { getMaterialUI } from "../core/runtime.ts";
import { TK_DOC_RADIUS } from "../core/tk-table.ts";

function cmMode(lang) {
  const l = String(lang || "sql").toLowerCase();
  if (l === "json") return { json: true };
  return { mode: "sql" };
}

export function CodeBlock(props) {
  const Panel = window.ISAFront?.CodeMirrorPanel;
  const { Box, Typography } = getMaterialUI();
  const lang = (() => {
    const l = String(props.language || "sql").toLowerCase();
    return l === "json" ? "json" : "sql";
  })();
  const code = String(props.code ?? "");
  const modeOpts = cmMode(lang);

  if (!Panel) {
    return (
      <Box sx={{ border: 1, borderColor: "divider", borderRadius: TK_DOC_RADIUS, overflow: "hidden" }}>
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
    <Box sx={{ border: 1, borderColor: "divider", borderRadius: TK_DOC_RADIUS, overflow: "visible", my: 1, maxWidth: "100%" }}>
      {lang && (
        <Typography variant="caption" sx={{ display: "block", px: 1.25, py: 0.5, bgcolor: "action.hover", color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.5 }}>
          {lang}
        </Typography>
      )}
      <Panel
        value={code}
        readOnly
        lineWrapping
        minHeight="4rem"
        className="tk-code-cm sql-cm"
        {...modeOpts}
      />
    </Box>
  );
}
