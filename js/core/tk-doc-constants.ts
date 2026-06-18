/** Secciones estándar del visor doc TK — orden, colores e iconos. */

export const TK_DOC_SECTION_GRAY = "#94a3b8";

export const TK_DOC_STANDARD = {
  solicitud: { icon: "mdi:clipboard-text-outline", title: "Solicitud y objetivo", accent: "#1e90ff" },
  evidencias: { icon: "mdi:image-multiple-outline", title: "Evidencias del problema", accent: "#8b5cf6" },
  causa: { icon: "mdi:magnify-scan", title: "Causa del problema", accent: "#ef4444" },
  verificacion: {
    icon: "mdi:clipboard-check-outline",
    title: "Procesos de verificación de causa",
    accent: "#f59e0b",
  },
  solucion: {
    icon: "mdi:check-decagram",
    title: "Solución aplicada",
    accent: "#10b981",
    /** Tras el texto introductorio: bloque `file-tree` (archivos modificados). */
    fileTreeKind: "file-tree",
  },
  commits: {
    icon: "mdi:source-commit",
    title: "Commits relacionados",
    titleCerrado: "Commits que entregan la solución",
    accent: "#6366f1",
  },
  tiempos: {
    icon: "mdi:clock-outline",
    title: "Resumen de tiempos",
    accent: "#06b6d4",
  },
} as const;

/** Orden fijo de dots y secciones — agregar aquí nuevas secciones estándar. */
export const TK_DOC_SECTION_ORDER = [
  "solicitud",
  "evidencias",
  "causa",
  "verificacion",
  "solucion",
  "commits",
  "tiempos",
] as const;

export type TkDocSectionKey = (typeof TK_DOC_SECTION_ORDER)[number];
