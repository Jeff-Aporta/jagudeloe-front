/** Clasificación de bloques TK_CONTENT en secciones estándar del visor doc. */

import type { TkDocBlock } from "./tk-doc-layout.ts";

export type TkDocLane = "causa" | "verificacion" | "solucion" | "otros";

export type TkDocBodyLanes = Record<TkDocLane, TkDocBlock[]>;

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
    /solucion aplicada|solucion entregada|^solucion\b|evidencia de pruebas|cambios en base de datos|resultado\b|instrucciones actualizadas|mejora posterior|conclusion|puntos clave|estrategia acordada|endpoints usados|referencias de configuracion|system-prompts|openai-infomap|alcance esperado|alcance del analisis|alcance tecnico|alcance numerico|^entrega\b|catalogo por tipo/i.test(
      t,
    )
  ) {
    return "solucion";
  }

  return "otros";
}

/** true si el título no puede ser encabezado de subsección (solo cards estándar). */
export function isStandardMappedTitle(title: string): boolean {
  const mapped = classifyBlockLane(title);
  return mapped != null && mapped !== "otros";
}

function isStepsKind(kind: string): boolean {
  return kind === "steps" || kind === "stepper";
}

function isFileTreeKind(kind: string): boolean {
  return kind === "file-tree" || kind === "filetree";
}

function isCodeKind(kind: string): boolean {
  return kind === "code" || kind === "sql";
}

function isConfigArtifactTitle(title: string): boolean {
  return /referencias de configuracion|system-prompts|openai-infomap|\.json\b/i.test(normTitle(title));
}

function isSolutionScopeTitle(title: string): boolean {
  return /alcance esperado|alcance del analisis|alcance tecnico|alcance numerico/i.test(normTitle(title));
}

/** Quita payload.title cuando pertenece a un carril estándar (no duplicar header). */
export function stripStandardBlockTitle(b: TkDocBlock): TkDocBlock {
  const title = blockPayloadTitle(b);
  if (!isStandardMappedTitle(title)) return b;
  const payload = { ...(b.payload ?? {}) };
  delete payload.title;
  return { ...b, payload };
}

function targetLaneForBlock(b: TkDocBlock, sticky: TkDocLane): TkDocLane {
  const title = blockPayloadTitle(b);
  const kind = String(b.kind ?? "").toLowerCase();
  const mapped = classifyBlockLane(title);

  if (mapped && mapped !== "otros") return mapped;
  if (isSolutionScopeTitle(title) || isConfigArtifactTitle(title)) return "solucion";
  if (isFileTreeKind(kind) || /archivos modificados|archivos tocados|tree de archivos/i.test(normTitle(title))) {
    return "solucion";
  }
  if (isStepsKind(kind)) return sticky === "otros" ? "verificacion" : sticky;
  if (isCodeKind(kind)) return sticky === "otros" ? "solucion" : sticky;
  return mapped ?? sticky;
}

function sweepOtrosIntoStandard(lanes: TkDocBodyLanes): TkDocBodyLanes {
  const out = { ...lanes, otros: [...lanes.otros] };
  const keep: TkDocBlock[] = [];

  for (const b of out.otros) {
    const title = blockPayloadTitle(b);
    const kind = String(b.kind ?? "").toLowerCase();
    const mapped = classifyBlockLane(title);

    if (mapped && mapped !== "otros") {
      out[mapped].push(stripStandardBlockTitle(b));
      continue;
    }
    if (isSolutionScopeTitle(title) || isConfigArtifactTitle(title) || isCodeKind(kind) || isFileTreeKind(kind)) {
      out.solucion.push(stripStandardBlockTitle(b));
      continue;
    }
    if (isStepsKind(kind)) {
      out.verificacion.push(stripStandardBlockTitle(b));
      continue;
    }
    keep.push(b);
  }

  out.otros = keep;
  return out;
}

/** Agrupa bloques del cuerpo en causas → verificación → solución → otros. */
export function partitionBodyLanes(blocks: TkDocBlock[]): TkDocBodyLanes {
  const out: TkDocBodyLanes = { causa: [], verificacion: [], solucion: [], otros: [] };
  let sticky: TkDocLane = "otros";

  for (const raw of blocks) {
    const lane = targetLaneForBlock(raw, sticky);
    sticky = lane;
    out[lane].push(stripStandardBlockTitle(raw));
  }

  return sweepOtrosIntoStandard(out);
}
