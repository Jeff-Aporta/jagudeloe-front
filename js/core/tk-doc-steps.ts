/** Modelo de ítems anidables dentro de bloques `steps` (texto, badges, sql, json). */

export type TkStepRow =
  | { type: "step"; num: number; text: string; key: string }
  | { type: "badges"; items: Record<string, unknown>[]; key: string }
  | { type: "code"; code: string; language: string; key: string };

function isObject(v: unknown): v is Record<string, unknown> {
  return v != null && typeof v === "object" && !Array.isArray(v);
}

function stepItemKind(raw: Record<string, unknown>): string {
  return String(raw.kind ?? "").toLowerCase();
}

/** Normaliza `phase.items`: strings + bloques anidados (badges, sql, code). */
export function parsePhaseItems(items: unknown[], startNum: number): { rows: TkStepRow[]; stepCount: number } {
  const list = Array.isArray(items) ? items : [];
  const rows: TkStepRow[] = [];
  let num = startNum;

  list.forEach((raw, i) => {
    const key = `item-${i}`;

    if (typeof raw === "string") {
      const text = raw.trim();
      if (!text) return;
      rows.push({ type: "step", num, text, key });
      num += 1;
      return;
    }

    if (!isObject(raw)) return;

    const kind = stepItemKind(raw);

    if (kind === "badges" || kind === "badge-row" || kind === "badge" || kind === "chip") {
      const badgeItems = (raw.items ?? raw.badges ?? []) as Record<string, unknown>[];
      if (badgeItems.length) rows.push({ type: "badges", items: badgeItems, key });
      return;
    }

    if (kind === "sql" || kind === "code") {
      const code = String(raw.code ?? raw.sql ?? "").trim();
      if (!code) return;
      const language = kind === "sql" ? "sql" : String(raw.language ?? "json").toLowerCase();
      rows.push({ type: "code", code, language, key });
      return;
    }

    const text = String(raw.text ?? raw.body ?? "").trim();
    if (text) {
      rows.push({ type: "step", num, text, key });
      num += 1;
    }
  });

  return { rows, stepCount: num - startNum };
}

export function phaseListFromPayload(phases: unknown): Record<string, unknown>[] {
  return Array.isArray(phases) ? (phases as Record<string, unknown>[]) : [];
}

/** Cuenta pasos de texto en todas las fases (para validar contenido). */
export function stepsBlockHasContent(phases: unknown): boolean {
  const list = phaseListFromPayload(phases);
  if (!list.length) return false;
  let n = 0;
  for (const phase of list) {
    const { stepCount, rows } = parsePhaseItems(phase.items as unknown[], 1);
    n += stepCount;
    if (rows.some((r) => r.type !== "step")) return true;
  }
  return n > 0;
}
