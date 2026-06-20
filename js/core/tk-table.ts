/** Tablas en diligencias TK — columnas Descripción con máx. 2 líneas. */

import { richTextPlain } from "./tk-rich-text.ts";

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
  return richTextPlain(raw);
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
  const raw = list.reduce(
    (acc, row) => {
      const c = (row ?? {}) as Record<string, unknown>;
      return {
        count: acc.count + 1,
        ins: acc.ins + Number(c.insCount ?? 0),
        del: acc.del + Number(c.delCount ?? 0),
        minutos: acc.minutos + Number(c.minutos ?? 0),
      };
    },
    { count: 0, ins: 0, del: 0, minutos: 0 },
  );
  return { ...raw, minutos: roundTkMinutosTo5(raw.minutos) };
}

/** Ins/Del en tabla de commits — fondo suave (alineado con pill del correo HTML). */
export const TK_COMMIT_INS_CHIP_SX = {
  height: 22,
  fontWeight: 600,
  fontSize: "0.75rem",
  bgcolor: (theme: { palette: { mode: string } }) =>
    theme.palette.mode === "dark" ? "rgba(16, 185, 129, 0.34)" : "#e9f7ee",
  color: (theme: { palette: { mode: string } }) =>
    theme.palette.mode === "dark" ? "#bbf7d0" : "#047857",
  border: (theme: { palette: { mode: string } }) =>
    theme.palette.mode === "dark" ? "1px solid rgba(52, 211, 153, 0.55)" : "1px solid transparent",
  "& .MuiChip-label": {
    px: 0.75,
    color: "inherit",
    fontWeight: 600,
  },
};

export const TK_COMMIT_DEL_CHIP_SX = {
  height: 22,
  fontWeight: 600,
  fontSize: "0.75rem",
  bgcolor: (theme: { palette: { mode: string } }) =>
    theme.palette.mode === "dark" ? "rgba(239, 68, 68, 0.34)" : "#fdecea",
  color: (theme: { palette: { mode: string } }) =>
    theme.palette.mode === "dark" ? "#fecaca" : "#c0392b",
  border: (theme: { palette: { mode: string } }) =>
    theme.palette.mode === "dark" ? "1px solid rgba(248, 113, 113, 0.55)" : "1px solid transparent",
  "& .MuiChip-label": {
    px: 0.75,
    color: "inherit",
    fontWeight: 600,
  },
};

/** Fondo suave para chips TK (diligencias, toolbar, catálogo). */
export function tkDocSoftBadgeSx(tone: string, t: { palette: { mode: string; primary: { dark: string } } }) {
  const dark = t.palette.mode === "dark";
  const tones: Record<string, { bgcolor: string; color: string; borderColor: string }> = {
    primary: {
      bgcolor: dark ? "rgba(30,144,255,0.22)" : "rgba(30,144,255,0.1)",
      color: dark ? "#bfdbfe" : t.palette.primary.dark,
      borderColor: dark ? "rgba(30,144,255,0.45)" : "rgba(30,144,255,0.28)",
    },
    secondary: {
      bgcolor: dark ? "rgba(148,163,184,0.18)" : "rgba(100,116,139,0.1)",
      color: dark ? "#e2e8f0" : "#475569",
      borderColor: dark ? "rgba(148,163,184,0.4)" : "rgba(100,116,139,0.25)",
    },
    success: {
      bgcolor: dark ? "rgba(16,185,129,0.2)" : "rgba(16,185,129,0.12)",
      color: dark ? "#a7f3d0" : "#047857",
      borderColor: dark ? "rgba(16,185,129,0.5)" : "rgba(16,185,129,0.35)",
    },
    warning: {
      bgcolor: dark ? "rgba(245,158,11,0.22)" : "rgba(245,158,11,0.14)",
      color: dark ? "#fde68a" : "#b45309",
      borderColor: dark ? "rgba(245,158,11,0.55)" : "rgba(245,158,11,0.4)",
    },
    danger: {
      bgcolor: dark ? "rgba(239,68,68,0.2)" : "rgba(239,68,68,0.1)",
      color: dark ? "#fecaca" : "#b91c1c",
      borderColor: dark ? "rgba(239,68,68,0.45)" : "rgba(239,68,68,0.3)",
    },
    violet: {
      bgcolor: dark ? "rgba(124,58,237,0.22)" : "rgba(124,58,237,0.12)",
      color: dark ? "#ede9fe" : "#5b21b6",
      borderColor: dark ? "rgba(167,139,250,0.55)" : "rgba(124,58,237,0.35)",
    },
  };
  return tones[tone] ?? tones.secondary;
}

/** Chip soft de la toolbar de detalle (space, total minutos). */
export function tkToolbarSoftChipSx(tone: string, t: { palette: { mode: string; primary: { dark: string } } }) {
  const chip = tkDocSoftBadgeSx(tone, t);
  return {
    height: 32,
    fontWeight: 600,
    fontSize: "0.75rem",
    borderRadius: TK_DOC_RADIUS,
    border: "1px solid",
    bgcolor: chip.bgcolor,
    color: chip.color,
    borderColor: chip.borderColor,
    boxShadow: t.palette.mode === "dark"
      ? "0 1px 0 rgba(255,255,255,0.06) inset"
      : "0 1px 0 rgba(255,255,255,0.9) inset",
    "& .MuiChip-label": { px: 1.1 },
  };
}

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
