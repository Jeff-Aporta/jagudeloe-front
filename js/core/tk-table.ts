/** Tablas en diligencias TK — columnas Descripción con máx. 2 líneas. */

/** Radio unificado de cards y tablas en vista doc TK. */
export const TK_DOC_RADIUS = "0.5rem";

export function isTkDescColumn(header: unknown): boolean {
  return /^descripci[oó]n\b/i.test(String(header ?? "").trim());
}

export const TK_TABLE_DESC_CLAMP_SX = {
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  lineHeight: 1.45,
  wordBreak: "break-word",
};

export const TK_TABLE_DESC_CLAMP_CSS =
  "display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;line-height:1.45;word-break:break-word;max-width:420px;";

export function tkTablePlainText(raw: unknown): string {
  return String(raw ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Estilo web unificado — tablas de diligencia (contenido + commits). */
export const TK_DOC_TABLE_PAPER_SX = { overflow: "auto", borderRadius: TK_DOC_RADIUS };

export const TK_DOC_TABLE_HEAD_CELL_SX = {
  fontWeight: 700,
  bgcolor: "action.hover",
  whiteSpace: "nowrap",
  borderBottom: 1,
  borderColor: "divider",
};

export const TK_DOC_TABLE_ROW_SX = { "&:hover": { bgcolor: "action.hover" } };

export const TK_DOC_TABLE_BODY_CELL_SX = {
  fontSize: "0.875rem",
  borderBottom: 1,
  borderColor: "divider",
  verticalAlign: "top",
};

/** Ins/Del en tabla de commits — fondo suave (alineado con pill del correo HTML). */
export const TK_COMMIT_INS_CHIP_SX = {
  height: 22,
  fontWeight: 600,
  fontSize: "0.75rem",
  border: "none",
  bgcolor: (theme: { palette: { mode: string } }) =>
    theme.palette.mode === "dark" ? "rgba(76, 175, 80, 0.2)" : "#e9f7ee",
  color: (theme: { palette: { mode: string; success: { dark: string; main: string } } }) =>
    theme.palette.mode === "dark" ? theme.palette.success.main : theme.palette.success.dark,
  "& .MuiChip-label": { px: 0.75 },
};

export const TK_COMMIT_DEL_CHIP_SX = {
  height: 22,
  fontWeight: 600,
  fontSize: "0.75rem",
  border: "none",
  bgcolor: (theme: { palette: { mode: string } }) =>
    theme.palette.mode === "dark" ? "rgba(211, 47, 47, 0.2)" : "#fdecea",
  color: (theme: { palette: { mode: string; error: { dark: string; main: string } } }) =>
    theme.palette.mode === "dark" ? theme.palette.error.main : "#c0392b",
  "& .MuiChip-label": { px: 0.75 },
};
