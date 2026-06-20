/** Expande presets TK_DOC → JSON completo editable (diagramas, stepper, etc.). */

import type { TkDocEditableBlock } from "./tk-doc-types.ts";
import { flowSpecFromPayload, tk1437191FlowSpec } from "./tk-flow.ts";
import { fileTreeSpecFromPayload, tk1437191FileTreeSpec } from "./tk-file-tree.ts";
import { compactSequenceActorsInPayload, expandSequencePayloadForJson, resolveSequenceSpec } from "./tk-sequence.ts";
import { stepperSpecFromPayload, tk1437191StepperSpec } from "./tk-stepper.ts";
import { tableBlockPayload, tableSpecFromPayload, tk1437191ArchivosTableSpec } from "./tk-doc-table.ts";

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
}

function expandFlowPayloadForJson(payload: Record<string, unknown>): Record<string, unknown> {
  const out = { ...payload };
  if (flowSpecFromPayload(out)) return out;
  if (String(out.preset ?? "") === "tk1437191") {
    out.flow = tk1437191FlowSpec();
  }
  return out;
}

function expandStepperPayloadForJson(payload: Record<string, unknown>): Record<string, unknown> {
  const out = { ...payload };
  if (stepperSpecFromPayload(out)) return out;
  if (String(out.preset ?? "") === "tk1437191") {
    out.stepper = tk1437191StepperSpec();
  }
  return out;
}

function expandFileTreePayloadForJson(payload: Record<string, unknown>): Record<string, unknown> {
  const out = { ...payload };
  if (fileTreeSpecFromPayload(out)) return out;
  if (String(out.preset ?? "") === "tk1437191") {
    return { ...out, ...tk1437191FileTreeSpec() };
  }
  return out;
}

function expandTablePayloadForJson(payload: Record<string, unknown>): Record<string, unknown> {
  const out = { ...payload };
  if (tableSpecFromPayload(out)) return out;
  if (String(out.preset ?? "") === "tk1437191-archivos") {
    const lane = asRecord(out);
    const expanded = tableBlockPayload(tk1437191ArchivosTableSpec());
    return {
      ...expanded,
      ...(lane.docLane ? { docLane: lane.docLane } : {}),
      ...(lane.section ? { section: lane.section } : {}),
      ...(lane.lane ? { lane: lane.lane } : {}),
      title: String(out.title ?? expanded.title ?? ""),
    };
  }
  return out;
}

/** Resuelve presets y anida specs completas para el editor JSON. */
export function expandEditableBlockForJson(b: TkDocEditableBlock): TkDocEditableBlock {
  let kind = String(b.kind ?? "").toLowerCase();
  let payload = { ...(b.payload ?? {}) };

  if (kind === "flow" || kind === "flowchart" || kind === "flow-diagram") {
    if (String(payload.preset ?? "") === "tk1437191") {
      kind = "sequence";
      payload = expandSequencePayloadForJson(payload);
    } else {
      payload = expandFlowPayloadForJson(payload);
    }
  } else if (kind === "sequence" || kind === "sequence-diagram") {
    payload = expandSequencePayloadForJson(payload);
  } else if (kind === "mui-stepper") {
    payload = expandStepperPayloadForJson(payload);
  } else if (kind === "file-tree" || kind === "filetree") {
    payload = expandFileTreePayloadForJson(payload);
  } else if (kind === "table") {
    payload = expandTablePayloadForJson(payload);
  }

  if (b.blocks?.length) {
    return {
      ...b,
      kind,
      payload,
      blocks: b.blocks.map(expandEditableBlockForJson),
    };
  }

  return { ...b, kind, payload };
}

/** Tras guardar JSON inline, quitar preset para que no pise la spec editada. */
export function compactEditableBlockAfterJsonEdit(b: TkDocEditableBlock): TkDocEditableBlock {
  const kind = String(b.kind ?? "").toLowerCase();
  const payload = { ...(b.payload ?? {}) };

  if ((kind === "sequence" || kind === "sequence-diagram") && resolveSequenceSpec(payload)) {
    delete payload.preset;
    const compactPayload = compactSequenceActorsInPayload(payload);
    if (b.blocks?.length) {
      return {
        ...b,
        payload: compactPayload,
        blocks: b.blocks.map(compactEditableBlockAfterJsonEdit),
      };
    }
    return { ...b, payload: compactPayload };
  }
  if (kind === "flow" || kind === "flowchart" || kind === "flow-diagram") {
    if (flowSpecFromPayload(payload)) delete payload.preset;
  }
  if (kind === "mui-stepper" && stepperSpecFromPayload(payload)) delete payload.preset;
  if ((kind === "file-tree" || kind === "filetree") && fileTreeSpecFromPayload(payload)) delete payload.preset;
  if (kind === "table" && tableSpecFromPayload(payload)) delete payload.preset;

  if (b.blocks?.length) {
    return {
      ...b,
      payload,
      blocks: b.blocks.map(compactEditableBlockAfterJsonEdit),
    };
  }

  return { ...b, payload };
}
