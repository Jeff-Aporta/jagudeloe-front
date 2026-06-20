/** Carril docLane / clasificación por título — módulo hoja (sin ciclos con interpreter). */

import type { TkDocBlock } from "./tk-doc-types.ts";

export const TK_DOC_LANES = {
  SOLICITUD: "solicitud",
  EVIDENCIAS: "evidencias",
  CAUSA: "causa",
  VERIFICACION: "verificacion",
  SOLUCION: "solucion",
  OTROS: "otros",
} as const;

export type TkDocBodyLane = "causa" | "verificacion" | "solucion" | "otros";
export type TkDocSectionLane = TkDocBodyLane | "solicitud" | "evidencias";
/** Alias usado en partitionBodyLanes. */
export type TkDocLane = TkDocBodyLane;

export function withDocLane(lane: TkDocSectionLane, payload: Record<string, unknown>): Record<string, unknown> {
  return { docLane: lane, ...payload };
}

export function blockPayloadTitle(b: TkDocBlock): string {
  return String(b.payload?.title ?? "").trim();
}

function normTitle(title: string): string {
  return title.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
}

/** Títulos legacy → carril estándar (null = heredar carril anterior). */
export function classifyBlockLane(title: string): TkDocLane | null {
  const t = normTitle(title);
  if (!t) return null;

  if (
    /hipotesis|causa identificada|causa del problema|^causa\b|antecedente|analisis realizado|diagnostico|modelo de datos|reglas de seleccion|restricciones\b|error tecnico|raiz del problema/i.test(
      t,
    )
  ) {
    return "causa";
  }

  if (
    /procesos? de verificacion|verificacion de causa|verificacion\b|validacion\b|investigacion y pruebas|como probar|criterios de evaluacion|pruebas realizadas|matriz completa|latencia por|calidad media|conversaciones involucradas|hoja de ruta|mejores celdas/i.test(
      t,
    )
  ) {
    return "verificacion";
  }

  if (/^proceso\b|proceso manual/i.test(t) && !/solucion/i.test(t)) {
    return "verificacion";
  }

  if (
    /solucion aplicada|solucion entregada|^solucion\b|flujo funcional|evidencia de pruebas|cambios en base de datos|resultado\b|instrucciones actualizadas|mejora posterior|conclusion|puntos clave|estrategia acordada|endpoints usados|referencias de configuracion|system-prompts|openai-infomap|alcance esperado|alcance del analisis|alcance tecnico|alcance numerico|^entrega\b|catalogo por tipo/i.test(
      t,
    )
  ) {
    return "solucion";
  }

  return "otros";
}

const SECTION_LANE_ALIASES: Record<string, TkDocSectionLane> = {
  solicitud: "solicitud",
  objetivo: "solicitud",
  requerimiento: "solicitud",
  evidencias: "evidencias",
  evidencia: "evidencias",
  causa: "causa",
  verificacion: "verificacion",
  validacion: "verificacion",
  solucion: "solucion",
  otros: "otros",
};

/** Lee carril explícito del JSON (`docLane` | `section` | `lane`). */
export function readBlockDocLane(block: TkDocBlock): TkDocSectionLane | null {
  const p = block.payload ?? {};
  const raw = String(p.docLane ?? p.section ?? p.lane ?? "").trim().toLowerCase();
  if (!raw) return null;
  return SECTION_LANE_ALIASES[raw] ?? null;
}

export function isBodyLane(lane: TkDocSectionLane | null): lane is TkDocBodyLane {
  return lane === "causa" || lane === "verificacion" || lane === "solucion" || lane === "otros";
}

/** Carril del cuerpo: JSON explícito → heurística por título/kind. */
export function resolveBlockBodyLane(block: TkDocBlock, sticky: TkDocBodyLane): TkDocBodyLane {
  const explicit = readBlockDocLane(block);
  if (explicit && isBodyLane(explicit)) return explicit;

  const title = blockPayloadTitle(block);
  const kind = String(block.kind ?? "").toLowerCase();
  const mapped = classifyBlockLane(title);

  if (mapped && mapped !== "otros") return mapped;

  if (/alcance esperado|alcance del analisis|alcance tecnico|alcance numerico|referencias de configuracion|system-prompts|openai-infomap|\.json\b/i.test(title)) {
    return "solucion";
  }
  if (kind === "file-tree" || kind === "filetree" || /archivos modificados|archivos tocados|tree de archivos/i.test(title)) {
    return "solucion";
  }
  if (kind === "steps" || kind === "stepper") return sticky === "otros" ? "verificacion" : sticky;
  if (kind === "code" || kind === "sql") return sticky === "otros" ? "solucion" : sticky;
  return mapped ?? sticky;
}
