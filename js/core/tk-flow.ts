import { resolveTkHue } from "./tk-hue.ts";

export type FlowDirection = "TB" | "LR";
export type FlowNodeShape = "rect" | "round" | "diamond" | "terminal";

export interface FlowNode {
  id: string;
  label: string;
  icon?: string;
  hue?: number;
  shape?: FlowNodeShape;
  step?: number;
}

export interface FlowEdge {
  id?: string;
  from: string;
  to: string;
  label?: string;
  style?: "solid" | "dashed";
}

export interface FlowSpec {
  title?: string;
  subtitle?: string;
  direction?: FlowDirection;
  nodes: FlowNode[];
  edges: FlowEdge[];
}

export interface FlowTheme {
  text: string;
  muted: string;
  grid: string;
  panel: string;
  border: string;
  accent: string;
  edge: string;
  edgeLabel: string;
}

export interface FlowNodeLayout {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  cx: number;
  cy: number;
  label: string;
  lines: string[];
  icon: string;
  hue: number;
  shape: FlowNodeShape;
  step?: number;
}

export interface FlowEdgeLayout {
  id: string;
  path: string;
  label?: string;
  labelX: number;
  labelY: number;
  dashed: boolean;
  fromId: string;
  toId: string;
}

export interface FlowLayout {
  width: number;
  height: number;
  title?: string;
  subtitle?: string;
  titleY: number;
  subtitleY: number;
  direction: FlowDirection;
  nodes: FlowNodeLayout[];
  edges: FlowEdgeLayout[];
}

const DEFAULT_HUES = [239, 210, 199, 173, 38, 258, 160];
const DEFAULT_ICONS = [
  "mdi:checkbox-blank-circle-outline",
  "mdi:arrow-right-bold-circle-outline",
  "mdi:cog-outline",
  "mdi:check-circle-outline",
];

const NODE_W = 196;
const NODE_MIN_H = 52;
const LINE_H = 14;
const PAD_X = 14;
const LAYER_GAP = 72;
const SIBLING_GAP = 28;
const MARGIN = 36;

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
}

function wrapLabel(text: string, maxChars = 30): string[] {
  const raw = String(text ?? "").trim();
  if (!raw) return [""];
  const chunks: string[] = [];
  for (const part of raw.split(/\n/)) {
    const words = part.split(/\s+/).filter(Boolean);
    let line = "";
    for (const w of words) {
      const next = line ? `${line} ${w}` : w;
      if (next.length > maxChars && line) {
        chunks.push(line);
        line = w;
      } else {
        line = next;
      }
    }
    if (line) chunks.push(line);
  }
  return chunks.length ? chunks : [""];
}

function readNode(raw: Record<string, unknown>, i: number): FlowNode {
  return {
    id: String(raw.id ?? `n${i + 1}`),
    label: String(raw.label ?? raw.text ?? `Paso ${i + 1}`),
    icon: String(raw.icon ?? DEFAULT_ICONS[i % DEFAULT_ICONS.length]),
    hue: resolveTkHue(raw, DEFAULT_HUES[i % DEFAULT_HUES.length]),
    shape: (raw.shape as FlowNodeShape) ?? "round",
    step: raw.step != null ? Number(raw.step) : i + 1,
  };
}

function readEdge(raw: Record<string, unknown>, i: number): FlowEdge {
  return {
    id: String(raw.id ?? `e${i + 1}`),
    from: String(raw.from ?? raw.source ?? ""),
    to: String(raw.to ?? raw.target ?? ""),
    label: raw.label != null ? String(raw.label) : undefined,
    style: (raw.style as FlowEdge["style"]) ?? "solid",
  };
}

export function flowThemeLight(): FlowTheme {
  return {
    text: "#0b2e4e",
    muted: "#64748b",
    grid: "rgba(100,116,139,0.12)",
    panel: "rgba(248,250,252,0.96)",
    border: "rgba(30,144,255,0.18)",
    accent: "#1e90ff",
    edge: "rgba(30,144,255,0.55)",
    edgeLabel: "#475569",
  };
}

export function flowThemeDark(): FlowTheme {
  return {
    text: "#e2e8f0",
    muted: "#94a3b8",
    grid: "rgba(148,163,184,0.1)",
    panel: "rgba(15,23,42,0.72)",
    border: "rgba(30,144,255,0.28)",
    accent: "#38bdf8",
    edge: "rgba(56,189,248,0.62)",
    edgeLabel: "#cbd5e1",
  };
}

export function flowSpecFromPayload(payload: unknown): FlowSpec | null {
  const p = asRecord(payload);
  const flow = asRecord(p.flow ?? p);
  const rawNodes = (flow.nodes as Record<string, unknown>[]) ?? [];
  if (!rawNodes.length) return null;

  const nodes = rawNodes.map(readNode);
  const edges = ((flow.edges as Record<string, unknown>[]) ?? []).map(readEdge);

  return {
    title: String(flow.title ?? p.title ?? ""),
    subtitle: String(flow.subtitle ?? p.subtitle ?? ""),
    direction: (flow.direction as FlowDirection) ?? "TB",
    nodes,
    edges,
  };
}

function nodeHeight(lines: string[]): number {
  return Math.max(NODE_MIN_H, PAD_X + lines.length * LINE_H + 10);
}

function assignLayers(spec: FlowSpec): Map<string, number> {
  const ids = spec.nodes.map((n) => n.id);
  const incoming = new Map<string, number>();
  ids.forEach((id) => incoming.set(id, 0));
  for (const e of spec.edges) {
    if (incoming.has(e.to)) incoming.set(e.to, (incoming.get(e.to) ?? 0) + 1);
  }

  const layers = new Map<string, number>();
  const queue = ids.filter((id) => (incoming.get(id) ?? 0) === 0);
  if (!queue.length) queue.push(ids[0]);

  queue.forEach((id) => layers.set(id, 0));
  const out = new Map<string, string[]>();
  for (const e of spec.edges) {
    if (!out.has(e.from)) out.set(e.from, []);
    out.get(e.from)!.push(e.to);
  }

  const seen = new Set(queue);
  while (queue.length) {
    const id = queue.shift()!;
    const layer = layers.get(id) ?? 0;
    for (const to of out.get(id) ?? []) {
      layers.set(to, Math.max(layers.get(to) ?? 0, layer + 1));
      if (!seen.has(to)) {
        seen.add(to);
        queue.push(to);
      }
    }
  }

  for (const id of ids) {
    if (!layers.has(id)) layers.set(id, 0);
  }
  return layers;
}

function anchorPoint(node: FlowNodeLayout, side: "top" | "bottom" | "left" | "right") {
  if (side === "top") return { x: node.cx, y: node.y };
  if (side === "bottom") return { x: node.cx, y: node.y + node.h };
  if (side === "left") return { x: node.x, y: node.cy };
  return { x: node.x + node.w, y: node.cy };
}

function edgePath(from: FlowNodeLayout, to: FlowNodeLayout, direction: FlowDirection): string {
  if (direction === "LR") {
    const a = anchorPoint(from, "right");
    const b = anchorPoint(to, "left");
    const midX = (a.x + b.x) / 2;
    return `M ${a.x} ${a.y} C ${midX} ${a.y}, ${midX} ${b.y}, ${b.x} ${b.y}`;
  }
  const a = anchorPoint(from, "bottom");
  const b = anchorPoint(to, "top");
  const midY = (a.y + b.y) / 2;
  return `M ${a.x} ${a.y} C ${a.x} ${midY}, ${b.x} ${midY}, ${b.x} ${b.y}`;
}

export function computeFlowLayout(spec: FlowSpec): FlowLayout {
  const direction: FlowDirection = spec.direction ?? "TB";
  const layers = assignLayers(spec);
  const byLayer = new Map<number, FlowNode[]>();
  for (const n of spec.nodes) {
    const layer = layers.get(n.id) ?? 0;
    if (!byLayer.has(layer)) byLayer.set(layer, []);
    byLayer.get(layer)!.push(n);
  }

  const layerKeys = [...byLayer.keys()].sort((a, b) => a - b);
  const nodeMap = new Map<string, FlowNodeLayout>();
  let maxW = 0;
  let cursorY = MARGIN + (spec.title ? 28 : 0) + (spec.subtitle ? 18 : 0);

  for (const layer of layerKeys) {
    const row = byLayer.get(layer) ?? [];
    row.sort((a, b) => (a.step ?? 0) - (b.step ?? 0));
    const heights = row.map((n) => nodeHeight(wrapLabel(n.label)));
    const rowH = Math.max(...heights, NODE_MIN_H);
    const totalW = row.length * NODE_W + Math.max(0, row.length - 1) * SIBLING_GAP;
    maxW = Math.max(maxW, totalW);
    const startX = MARGIN + Math.max(0, (820 - totalW) / 2);

    row.forEach((n, i) => {
      const lines = wrapLabel(n.label);
      const h = nodeHeight(lines);
      const x = startX + i * (NODE_W + SIBLING_GAP);
      const y = cursorY + (rowH - h) / 2;
      nodeMap.set(n.id, {
        id: n.id,
        x,
        y,
        w: NODE_W,
        h,
        cx: x + NODE_W / 2,
        cy: y + h / 2,
        label: n.label,
        lines,
        icon: n.icon ?? DEFAULT_ICONS[0],
        hue: n.hue ?? DEFAULT_HUES[0],
        shape: n.shape ?? "round",
        step: n.step,
      });
    });

    cursorY += rowH + LAYER_GAP;
  }

  const width = Math.max(820, maxW + MARGIN * 2);
  const height = cursorY + MARGIN;
  const titleY = MARGIN + 12;
  const subtitleY = spec.title ? titleY + 18 : titleY;

  const edges: FlowEdgeLayout[] = spec.edges
    .map((e, i) => {
      const from = nodeMap.get(e.from);
      const to = nodeMap.get(e.to);
      if (!from || !to) return null;
      const path = edgePath(from, to, direction);
      const labelX = (from.cx + to.cx) / 2;
      const labelY = direction === "TB" ? (from.y + from.h + to.y) / 2 : (from.x + from.w + to.x) / 2;
      return {
        id: e.id ?? `e${i + 1}`,
        path,
        label: e.label,
        labelX,
        labelY,
        dashed: e.style === "dashed",
        fromId: e.from,
        toId: e.to,
      };
    })
    .filter(Boolean) as FlowEdgeLayout[];

  return {
    width,
    height,
    title: spec.title,
    subtitle: spec.subtitle,
    titleY,
    subtitleY,
    direction,
    nodes: [...nodeMap.values()],
    edges,
  };
}

/** Flujo TK-1437191 — imensaje + calificación. */
export function tk1437191FlowSpec(): FlowSpec {
  return {
    title: "Flujo funcional",
    subtitle: "imensaje · mensajesOpenAI · calificación",
    direction: "TB",
    nodes: [
      { id: "turno", step: 1, shape: "terminal", hue: 239, icon: "mdi:account-arrow-right", label: "Usuario envía turno" },
      { id: "log", step: 2, hue: 239, icon: "mdi:database-outline", label: "Persiste CONVERSACION_LOG\nasigna imensaje al asistente" },
      { id: "get", step: 3, hue: 199, icon: "mdi:api", label: "GET /api/conversacion/{id}" },
      { id: "hilo", step: 4, hue: 199, icon: "mdi:message-text-outline", label: "mensajesOpenAI[] con fecha_hora, mensaje e imensaje" },
      { id: "post", step: 5, hue: 38, icon: "mdi:thumb-up-outline", label: "POST /api/mensaje\n{ iconversacion, imensaje, butil }" },
      { id: "valid", step: 6, hue: 38, icon: "mdi:shield-check-outline", label: "Valida imensaje en log\ny rechaza duplicados" },
      { id: "done", step: 7, shape: "terminal", hue: 38, icon: "mdi:link-variant", label: "Calificación enlazada al turno Paty" },
    ],
    edges: [
      { from: "turno", to: "log" },
      { from: "log", to: "get" },
      { from: "get", to: "hilo" },
      { from: "hilo", to: "post", label: "UI {{thumb-up}}/{{thumb-down}}" },
      { from: "post", to: "valid" },
      { from: "valid", to: "done" },
    ],
  };
}
