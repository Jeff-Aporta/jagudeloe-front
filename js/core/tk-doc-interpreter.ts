/**
 * Intérprete JSON universal de documentos TK (TK_DOC + metadatos ticket).
 * Fuente canónica: BD_ISADOC.TK_DOC — el front interpreta `{ blocks[] }` o `content[]` API.
 */

import type { TkDocBlock } from "./tk-doc-types.ts";
import type { TkDocSectionKey } from "./tk-doc-constants.ts";
import { normalizeTkContentBlock as policyNormalizeBlock, type TkContentBlock } from "./tk-code-policy.ts";
import { stepsBlockHasContent } from "./tk-doc-steps.ts";
import { flowSpecFromPayload } from "./tk-flow.ts";
import { sequenceSpecFromPayload } from "./tk-sequence.ts";
import { stepperSpecFromPayload } from "./tk-stepper.ts";
import { fileTreeSpecFromPayload } from "./tk-file-tree.ts";
import { tableSpecFromPayload } from "./tk-doc-table.ts";
import { normalizeDocContentBlocks } from "./tk-doc-normalize.ts";
import { timelineBlockHasContent } from "./tk-timeline-spec.ts";
import { blockPayloadTitle } from "./tk-doc-lanes.ts";
import type { TkDocSectionLane } from "./tk-doc-lanes.ts";

export {
  TK_DOC_LANES,
  withDocLane,
  readBlockDocLane,
  resolveBlockBodyLane,
  isBodyLane,
} from "./tk-doc-lanes.ts";
export type { TkDocBodyLane, TkDocSectionLane } from "./tk-doc-lanes.ts";

const MD_KIND = new Set(["markdown", "md", "text", "html", "body"]);

/** Alias de kind → kind canónico del registro de componentes. */
export const TK_DOC_KIND_ALIASES: Record<string, string> = {
  md: "markdown",
  text: "markdown",
  img: "image",
  filetree: "file-tree",
  flowchart: "flow",
  "flow-diagram": "flow",
  sequencediagram: "sequence",
  "sequence-diagram": "sequence",
  stepper: "steps",
  "badge-row": "badges",
  cambios_bd: "cambio-bd",
  sql: "code",
  "metrics-timeline": "timeline",
};

export const TK_DOC_JSON_COMPONENTS = new Set([
  "markdown",
  "code",
  "table",
  "image",
  "url",
  "link",
  "badge",
  "badges",
  "steps",
  "flow",
  "sequence",
  "mui-stepper",
  "file-tree",
  "timeline",
  "metrics-timeline",
  "accordion",
  "cambio-bd",
  "html",
  "image-group",
]);

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
}

function parsePayload(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === "object") return raw as Record<string, unknown>;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      return asRecord(parsed);
    } catch {
      return { text: raw };
    }
  }
  return {};
}

export function normalizeBlockKind(kind: unknown): string {
  const k = String(kind ?? "markdown").trim().toLowerCase();
  return TK_DOC_KIND_ALIASES[k] ?? k;
}

/** Fila API/BD → bloque canónico `{ kind, payload, sortKey }`. */
export function normalizeTkContentBlock(raw: unknown): TkDocBlock {
  const row = asRecord(raw);
  const nested = row.blocks as unknown[] | undefined;
  const kind = normalizeBlockKind(row.kind ?? row.KIND);
  const payload = parsePayload(row.payload ?? row.PAYLOAD);
  const sortKey = Number(row.sortKey ?? row.SORTKEY ?? 0);

  if (Array.isArray(nested) && nested.length) {
    return {
      kind: kind || "image-group",
      sortKey,
      blocks: nested.map(normalizeTkContentBlock),
      payload,
    };
  }

  return { kind, payload, sortKey };
}

export function normalizeTkContentBlocks(blocks: unknown[] | undefined): TkDocBlock[] {
  const base = (blocks ?? [])
    .map((raw) => policyNormalizeBlock(normalizeTkContentBlock(raw) as TkContentBlock) as TkDocBlock)
    .sort((a, b) => (a.sortKey ?? 0) - (b.sortKey ?? 0));
  return normalizeDocContentBlocks(base) as TkDocBlock[];
}

/** Normaliza ticket completo — content + contexts (acepta `doc.blocks` o `content[]`). */
export function normalizeTkDocument(tk: Record<string, unknown>): Record<string, unknown> {
  let rawContent = (tk.content as unknown[]) ?? [];
  if (!rawContent.length) {
    const doc = asRecord(tk.doc);
    if (Array.isArray(doc.blocks) && doc.blocks.length) rawContent = doc.blocks;
  }
  const content = normalizeTkContentBlocks(rawContent);
  const contexts = ((tk.contexts as Record<string, unknown>[]) ?? []).map((ctx) => ({
    ...ctx,
    content: normalizeTkContentBlocks((ctx.content as unknown[]) ?? []),
  }));
  return { ...tk, content, contexts };
}

function isDevHost(): boolean {
  if (typeof window === "undefined") return false;
  const h = window.location.hostname;
  return h === "localhost" || h === "127.0.0.1" || h === "[::1]";
}

/** Fusiona JSON canónico solo en localhost (o ?tkPatch=1). Prod GitHub Pages no entra aquí. */
export function tkDocLocalContentPatchEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (window.localStorage?.getItem("tkDocLocalPatch") === "0") return false;
    if (window.localStorage?.getItem("tkDocLocalPatch") === "1") return true;
    const q = new URLSearchParams(window.location.search);
    if (q.get("tkPatch") === "0") return false;
    if (q.get("tkPatch") === "1") return true;
    return isDevHost();
  } catch {
    return false;
  }
}

function blockText(b: TkDocBlock): string {
  const p = b.payload ?? {};
  return String(p.text ?? p.body ?? p.html ?? p.content ?? "").trim();
}

/** true si el bloque JSON aporta contenido renderizable. */
export function interpreterBlockHasContent(b: TkDocBlock): boolean {
  const kind = normalizeBlockKind(b.kind);

  if (kind === "image-group") {
    return (b.blocks ?? []).some(interpreterBlockHasContent);
  }

  if (kind === "image") {
    const p = b.payload ?? {};
    return !!(String(p.url ?? p.src ?? "").trim());
  }

  if (kind === "table") {
    return !!tableSpecFromPayload(b.payload);
  }

  if (kind === "code") {
    return !!String(b.payload?.code ?? b.payload?.sql ?? "").trim();
  }

  if (kind === "file-tree") {
    return !!fileTreeSpecFromPayload(b.payload);
  }

  if (kind === "badges") {
    const items = b.payload?.items ?? b.payload?.badges;
    return Array.isArray(items) && items.length > 0;
  }

  if (kind === "steps") {
    const phases = b.payload?.phases ?? b.payload?.steps;
    return stepsBlockHasContent(phases);
  }

  if (kind === "flow") {
    const p = b.payload ?? {};
    if (String(p.preset ?? "") === "tk1437191") return true;
    return !!flowSpecFromPayload(b.payload);
  }

  if (kind === "sequence") {
    const p = b.payload ?? {};
    if (String(p.preset ?? "") === "tk1437191" || String(p.preset ?? "") === "tk1431662") return true;
    return !!sequenceSpecFromPayload(b.payload);
  }

  if (kind === "mui-stepper") {
    return !!stepperSpecFromPayload(b.payload);
  }

  if (kind === "timeline" || kind === "metrics-timeline") {
    return timelineBlockHasContent(b.payload);
  }

  if (kind === "url" || kind === "link") {
    return !!String(b.payload?.url ?? b.payload?.href ?? "").trim();
  }

  if (MD_KIND.has(kind)) {
    return blockText(b).length > 0;
  }

  return blockText(b).length > 0 || !!blockPayloadTitle(b);
}

export function sectionKeyFromLane(lane: TkDocSectionLane | null): TkDocSectionKey | null {
  if (!lane) return null;
  if (lane === "solicitud") return "solicitud";
  if (lane === "evidencias") return "evidencias";
  if (lane === "causa") return "causa";
  if (lane === "verificacion") return "verificacion";
  if (lane === "solucion") return "solucion";
  return null;
}
