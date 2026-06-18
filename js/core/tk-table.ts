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

const TK_COMMIT_MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/** Fecha de commit para tabla doc — solo día y mes (ej. «17 jun»). */
export function formatTkCommitFecha(raw: unknown): string {
  const s = String(raw ?? "").trim();
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.getDate()} ${TK_COMMIT_MONTHS[d.getMonth()]}`;
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

/** Fila de resumen al pie de tablas de commits. */
export const TK_DOC_TABLE_TOTAL_ROW_SX = {
  bgcolor: "action.selected",
  "& td": {
    fontWeight: 700,
    borderTop: 2,
    borderColor: "divider",
    borderBottom: 0,
  },
  "&:hover": { bgcolor: "action.selected" },
};

/** Minutos de diligencia — siempre múltiplos de 5 (redondeo al más cercano). */
export function roundTkMinutosTo5(raw: unknown): number {
  const v = Math.round(Number(raw ?? 0));
  if (v <= 0) return 0;
  return Math.round(v / 5) * 5;
}

export function computeCommitTotals(commits: unknown[]): {
  count: number;
  ins: number;
  del: number;
  minutos: number;
} {
  const list = Array.isArray(commits) ? commits : [];
  return list.reduce(
    (acc, raw) => {
      const c = (raw ?? {}) as Record<string, unknown>;
      return {
        count: acc.count + 1,
        ins: acc.ins + Number(c.insCount ?? 0),
        del: acc.del + Number(c.delCount ?? 0),
        minutos: acc.minutos + Number(c.minutos ?? 0),
      };
    },
    { count: 0, ins: 0, del: 0, minutos: 0 },
  );
}

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

/** Chips del catálogo footer — fondo suave, sin outline. */
export function tkCatalogCurrentChipBg(theme: {
  palette: { mode: string; primary: { main: string } };
}): string {
  const main = theme.palette.primary.main;
  return theme.palette.mode === "dark"
    ? `color-mix(in srgb, ${main} 75%, black)`
    : `color-mix(in srgb, ${main} 85%, white)`;
}

export const TK_CATALOG_CHIP_SX = {
  height: 26,
  minHeight: 26,
  fontWeight: 600,
  fontSize: "0.72rem",
  fontFamily: "monospace",
  border: "none",
  boxShadow: "none",
  bgcolor: (theme: { palette: { mode: string } }) =>
    theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.06)" : "#f0f4f8",
  color: "text.primary",
  justifyContent: "flex-start",
  "& .MuiChip-label": {
    display: "inline-flex",
    alignItems: "center",
    gap: 0.5,
    px: 1,
    py: 0,
    lineHeight: 1,
  },
  "&:hover": {
    bgcolor: (theme: { palette: { mode: string } }) =>
      theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.1)" : "#e8eef5",
  },
};
