/** Superficie glass — cards transparentes con blur y degradados alfa internos. */
import { getMaterialUI } from "../core/runtime.ts";

type GlassTone = "default" | "hi" | "blue" | "warn" | "err" | "node" | "chip" | "excl" | "jornadaIn" | "jornadaOut";

const GRADIENTS: Record<"dark" | "light", Record<GlassTone, string>> = {
  dark: {
    default:
      "linear-gradient(165deg, rgba(30,144,255,0.12) 0%, rgba(99,102,241,0.07) 38%, rgba(15,34,54,0.26) 100%)",
    hi:
      "linear-gradient(145deg, rgba(30,144,255,0.20) 0%, rgba(0,229,255,0.08) 45%, rgba(26,58,92,0.32) 100%)",
    blue:
      "linear-gradient(160deg, rgba(30,144,255,0.14) 0%, rgba(15,34,54,0.22) 100%)",
    warn:
      "linear-gradient(155deg, rgba(237,108,2,0.14) 0%, rgba(237,108,2,0.05) 40%, rgba(15,34,54,0.24) 100%)",
    err:
      "linear-gradient(155deg, rgba(244,67,54,0.14) 0%, rgba(244,67,54,0.05) 40%, rgba(15,34,54,0.24) 100%)",
    node:
      "linear-gradient(160deg, rgba(30,144,255,0.09) 0%, rgba(99,102,241,0.05) 50%, rgba(15,34,54,0.20) 100%)",
    chip:
      "linear-gradient(145deg, rgba(30,144,255,0.14) 0%, rgba(26,58,92,0.28) 100%)",
    excl:
      "linear-gradient(160deg, rgba(237,108,2,0.12) 0%, rgba(237,108,2,0.04) 55%, rgba(15,34,54,0.18) 100%)",
    jornadaIn:
      "linear-gradient(160deg, rgba(0,188,212,0.14) 0%, rgba(0,188,212,0.04) 55%, rgba(15,34,54,0.18) 100%)",
    jornadaOut:
      "linear-gradient(160deg, rgba(213,0,249,0.12) 0%, rgba(213,0,249,0.04) 55%, rgba(15,34,54,0.18) 100%)",
  },
  light: {
    default:
      "linear-gradient(165deg, rgba(30,144,255,0.10) 0%, rgba(99,102,241,0.06) 38%, rgba(255,255,255,0.38) 100%)",
    hi:
      "linear-gradient(145deg, rgba(30,144,255,0.16) 0%, rgba(240,247,255,0.55) 55%, rgba(255,255,255,0.42) 100%)",
    blue:
      "linear-gradient(160deg, rgba(30,144,255,0.12) 0%, rgba(255,255,255,0.45) 100%)",
    warn:
      "linear-gradient(155deg, rgba(237,108,2,0.12) 0%, rgba(255,255,255,0.42) 100%)",
    err:
      "linear-gradient(155deg, rgba(244,67,54,0.10) 0%, rgba(255,255,255,0.42) 100%)",
    node:
      "linear-gradient(160deg, rgba(30,144,255,0.08) 0%, rgba(255,255,255,0.40) 100%)",
    chip:
      "linear-gradient(145deg, rgba(30,144,255,0.10) 0%, rgba(240,247,255,0.55) 100%)",
    excl:
      "linear-gradient(160deg, rgba(237,108,2,0.10) 0%, rgba(255,255,255,0.38) 100%)",
    jornadaIn:
      "linear-gradient(160deg, rgba(0,188,212,0.12) 0%, rgba(255,255,255,0.38) 100%)",
    jornadaOut:
      "linear-gradient(160deg, rgba(213,0,249,0.10) 0%, rgba(255,255,255,0.38) 100%)",
  },
};

function isDarkGlass(c: { cardBg: string }) {
  return String(c.cardBg).includes("15, 34, 54");
}

export function glassGradient(c: { cardBg: string }, tone: GlassTone = "default") {
  return GRADIENTS[isDarkGlass(c) ? "dark" : "light"][tone];
}

export function useGlassColors() {
  const { useTheme } = getMaterialUI();
  const dark = useTheme().palette.mode === "dark";
  return {
    pageBg: "transparent",
    cardBg: dark ? "rgba(15, 34, 54, 0.28)" : "rgba(255, 255, 255, 0.38)",
    cardHi: dark ? "rgba(26, 58, 92, 0.38)" : "rgba(240, 247, 255, 0.52)",
    border: dark ? "rgba(30,144,255,0.28)" : "rgba(30,144,255,0.18)",
    text: dark ? "#e8f4ff" : "#0a2540",
    muted: dark ? "#9ec5eb" : "#4a6278",
    preBg: dark ? "rgba(13, 33, 55, 0.45)" : "rgba(232, 238, 245, 0.55)",
    errTint: dark ? "rgba(211,47,47,0.08)" : "rgba(211,47,47,0.06)",
    warnTint: dark ? "rgba(237,108,2,0.08)" : "rgba(237,108,2,0.06)",
  };
}

function glassShadow(dark: boolean) {
  return dark
    ? "0 8px 32px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,255,255,0.06)"
    : "0 8px 28px rgba(15,23,42,0.05), inset 0 1px 0 rgba(255,255,255,0.55)";
}

/** Card plana glass (compat). */
export function glassCardSx(c: ReturnType<typeof useGlassColors>, extra: Record<string, unknown> = {}) {
  return glassCardGradientSx(c, { tone: "default", ...extra });
}

/** Card con degradado alfa — deja ver mesh/orbes del fondo. */
export function glassCardGradientSx(
  c: ReturnType<typeof useGlassColors>,
  opts: { tone?: GlassTone; borderColor?: string; borderWidth?: number } & Record<string, unknown> = {},
) {
  const dark = isDarkGlass(c);
  const { tone = "default", borderColor, borderWidth, ...extra } = opts;
  return {
    background: glassGradient(c, tone),
    backgroundColor: "transparent",
    borderColor: borderColor ?? c.border,
    ...(borderWidth != null ? { borderWidth } : {}),
    color: c.text,
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    boxShadow: glassShadow(dark),
    ...extra,
  };
}

/** Superficie interna (nodos, filas, chips). */
export function glassInnerSx(
  c: ReturnType<typeof useGlassColors>,
  tone: GlassTone = "node",
  extra: Record<string, unknown> = {},
) {
  return {
    background: glassGradient(c, tone),
    backgroundColor: "transparent",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    ...extra,
  };
}
