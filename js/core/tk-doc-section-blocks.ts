/** Bloques TK_DOC editables por sección estándar (solicitud / evidencias). */

import { readBlockDocLane } from "./tk-doc-lanes.ts";
import { isDocEvidenciaImageBlock } from "./tk-evidencias.ts";
import type { TkDocEditableBlock } from "./tk-doc-types.ts";

const MD_KIND = new Set(["markdown", "md", "text"]);

function blockText(b: TkDocEditableBlock): string {
  const p = b.payload ?? {};
  return String(p.text ?? p.body ?? p.html ?? p.content ?? "");
}

function isSolicitudTitle(title: string): boolean {
  return /^(solicitud|objetivo|requerimiento)\b/i.test(title.trim());
}

function isEvidenciaTitle(title: string): boolean {
  return /evidencia/i.test(title.trim());
}

function isTiempoSectionTitle(title: string): boolean {
  return /^resumen de tiempos\b/i.test(title.trim());
}

export type TkDocStandardSectionKey = "solicitud" | "evidencias";

/** Clasifica bloques raw del doc en solicitud / evidencias (misma heurística que partitionTkDocStandard). */
export function partitionStandardSectionBlocks(blocks: TkDocEditableBlock[]): {
  solicitud: TkDocEditableBlock[];
  evidencias: TkDocEditableBlock[];
} {
  const sorted = [...(blocks ?? [])].sort((a, b) => Number(a.sortKey) - Number(b.sortKey));
  const solicitud: TkDocEditableBlock[] = [];
  const evidencias: TkDocEditableBlock[] = [];
  let mdIndex = 0;
  let consumedUntitledIntro = false;

  for (const b of sorted) {
    const kind = String(b.kind ?? "").toLowerCase();
    const title = String(b.payload?.title ?? "").trim();
    const docLane = readBlockDocLane(b);

    if (docLane === "solicitud") {
      solicitud.push(b);
      continue;
    }

    if (docLane === "evidencias") {
      evidencias.push(b);
      continue;
    }

    if (isDocEvidenciaImageBlock(b)) {
      evidencias.push(b);
      continue;
    }

    if (MD_KIND.has(kind)) {
      const isEarly = mdIndex < 2 || Number(b.sortKey) < 3;
      mdIndex += 1;

      if (isTiempoSectionTitle(title)) continue;

      if (!consumedUntitledIntro && !title && isEarly && blockText(b).trim()) {
        solicitud.push(b);
        consumedUntitledIntro = true;
        continue;
      }

      if (isEvidenciaTitle(title)) {
        if (docLane && docLane !== "evidencias") continue;
        evidencias.push(b);
        continue;
      }

      if (isEarly && isSolicitudTitle(title)) {
        solicitud.push(b);
      }
    }
  }

  return { solicitud, evidencias };
}

export function docJsonBlocksForStandardSection(
  blocks: TkDocEditableBlock[],
  section: TkDocStandardSectionKey,
): TkDocEditableBlock[] {
  const parts = partitionStandardSectionBlocks(blocks);
  return parts[section];
}
