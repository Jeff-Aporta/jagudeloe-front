/** Especificación y layout SVG de diagramas de secuencia TK (sin Mermaid). */

import {
  applyRectCost,
  blockRect,
  type CostGrid,
  makeCostGrid,
  snapDiagramGrid,
  TK_DIAGRAM_RADIUS_PX,
} from "./tk-diagram-grid.ts";
import { routeSequenceHorizontal, routeSequenceSelf } from "./tk-diagram-astar.ts";
import {
  countIconifyTokens,
  extractLeadingIconifyToken,
  hasIconifyJsonSugar,
  iconifyApiUrl,
  replaceIconifyTokensWeb,
} from "./tk-iconify-inline.ts";
import { richTextPlain } from "./tk-rich-text.ts";
import { resolveTkHue, tkHueToHex } from "./tk-hue.ts";
import { contrastFontColor } from "./tk-color.ts";

/** Ancho px estimado de una etiqueta, descontando tokens {{icon}} y sumando su ancho. */
const ICON_INLINE_W = 16;
function diagramLabelW(label: string): number {
  const plain = richTextPlain(label);
  const icons = countIconifyTokens(label);
  const est = Math.ceil(plain.length * 6.2) + 24 + icons * ICON_INLINE_W;
  return snapDiagramGrid(Math.min(360, Math.max(72, est)));
}

export interface SequenceActor {
  id: string;
  label: string;
  kind?: "actor" | "participant";
  icon?: string;
  hue?: number;
}

export interface SequenceMessage {
  id: string;
  from: string;
  to: string;
  /** Título corto del paso (lo que se ve en el diagrama). Soporta {{iconify}}. */
  label: string;
  /** Narración corta (chip de la tortuga) — campo BD: `log` (conciso, ≤70 visibles). */
  log?: string;
  /** Descripción extendida (tooltip hover): md/html/{{iconify}}/imágenes, sin límite.
   *  Campo BD: `desc`. Si falta, el tooltip usa `log` como fallback. */
  description?: string;
  /** Id del grupo (color por tono) al que pertenece el paso. */
  group?: string;
  kind?: "sync" | "async" | "self";
  step?: number;
}

export interface SequenceAltBranch {
  condition: string;
  messages: SequenceMessage[];
}

/** Grupo de pasos por color (tono 0–360). Se muestra como índice arriba-derecha. */
export interface SequenceGroup {
  id: string;
  name: string;
  hue: number;
}

export interface SequenceSpec {
  title?: string;
  subtitle?: string;
  actors: SequenceActor[];
  /** Grupos por color; cada mensaje puede referenciar uno por `group`. */
  groups?: SequenceGroup[];
  /** Lista plana (estilo Mermaid sequenceDiagram). */
  messages?: SequenceMessage[];
  preamble?: SequenceMessage[];
  alt?: { branches: SequenceAltBranch[] };
  epilogue?: SequenceMessage[];
}

export interface SequenceTheme {
  text: string;
  muted: string;
  grid: string;
  panel: string;
  border: string;
  accent: string;
  altFill: string;
  altBorder: string;
  /** Fondo semiopaco de las etiquetas (enmascara lifelines bajo el texto). */
  chipFill: string;
  /** Color del número dentro del dot de inicio (contrasta con accent). */
  dotText: string;
}

export interface SequenceActorLayout {
  id: string;
  x: number;
  y: number;
  w: number;
  label: string;
  icon: string;
  hue: number;
  kind: "actor" | "participant";
}

export interface SequenceMessageLayout {
  id: string;
  step: number;
  label: string;
  log?: string;
  description?: string;
  kind: "sync" | "async" | "self";
  y: number;
  fromX: number;
  toX: number;
  path: string;
  lineX1: number;
  lineX2: number;
  arrowTipX: number;
  arrowTipY: number;
  arrowDir: 1 | -1;
  /** Caja (chip) de la etiqueta: x/y esquina sup-izq, w ancho, h alto. Texto centrado. */
  labelX: number;
  labelW: number;
  labelY: number;
  labelH: number;
  branch?: string;
  branchFirst?: boolean;
  /** Tono del grupo (0–360) si el paso pertenece a uno. */
  groupHue?: number;
}

export interface SequenceLayout {
  width: number;
  height: number;
  title?: string;
  subtitle?: string;
  titleY: number;
  subtitleY: number;
  actors: SequenceActorLayout[];
  lifelines: { id: string; x: number; y1: number; y2: number }[];
  messages: SequenceMessageLayout[];
  altBox?: { x: number; y: number; w: number; h: number; label: string };
  /** Índice de grupos (leyenda arriba-derecha). */
  groups?: SequenceGroup[];
  legendX: number;
}

const DEFAULT_HUES = [239, 199, 210];
const DEFAULT_ICONS = ["mdi:account", "mdi:robot-outline", "simple-icons:openai"];

/** Guía editorial: `log` ≤70 caracteres visibles (`**`, `{{iconify}}` no cuentan). Sin recorte automático. */
export const SEQUENCE_LOG_MAX_VISIBLE = 70;

/** Longitud visible del log — ignora marcado md/html/iconify. */
export function sequenceLogVisibleLength(raw: unknown): number {
  return richTextPlain(raw).length;
}

/** Normaliza `log`: solo trim; el texto debe ser conciso y completo en BD. */
export function normalizeSequenceLog(raw: unknown): string | undefined {
  const text = String(raw ?? "").trim();
  return text || undefined;
}

/** Normaliza `desc`: sin límite de longitud (md/html/iconify/imágenes). */
export function normalizeSequenceDesc(raw: unknown): string | undefined {
  const text = String(raw ?? "").trim();
  return text || undefined;
}

/** Texto del tooltip hover: `desc` tiene prioridad; `log` solo como fallback. */
export function sequenceMessageTooltipText(m: Pick<SequenceMessage, "description" | "log">): string | undefined {
  return normalizeSequenceDesc(m.description) ?? normalizeSequenceLog(m.log);
}

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
}

function readActor(raw: Record<string, unknown>, i: number): SequenceActor {
  // Conserva el label COMPLETO (con el sugar) para persistencia round-trip;
  // el ícono líder se extrae al avatar en computeSequenceLayout (display).
  const rawLabel = String(raw.label ?? `Actor ${i + 1}`);
  const leading = extractLeadingIconifyToken(rawLabel);
  return {
    id: String(raw.id ?? `a${i}`),
    label: rawLabel,
    kind: (raw.kind as SequenceActor["kind"]) ?? "participant",
    icon: leading?.iconId ?? String(raw.icon ?? DEFAULT_ICONS[i % DEFAULT_ICONS.length]),
    hue: leading?.hue ?? (raw.hue != null ? resolveTkHue(raw) : DEFAULT_HUES[i % DEFAULT_HUES.length]),
  };
}
export function sequenceThemeLight(): SequenceTheme {
  return {
    text: "#1e293b",
    muted: "#64748b",
    grid: "rgba(100,116,139,0.28)",
    panel: "transparent",
    border: "rgba(100,116,139,0.32)",
    accent: "#475569",
    altFill: "transparent",
    altBorder: "rgba(100,116,139,0.38)",
    chipFill: "rgba(255,255,255,0.9)",
    dotText: "#ffffff",
  };
}

export function sequenceThemeDark(): SequenceTheme {
  return {
    text: "#e2e8f0",
    muted: "#94a3b8",
    grid: "rgba(148,163,184,0.2)",
    panel: "transparent",
    border: "rgba(148,163,184,0.26)",
    accent: "#cbd5e1",
    altFill: "transparent",
    altBorder: "rgba(148,163,184,0.32)",
    chipFill: "rgba(13,27,42,0.9)",
    dotText: "#0b1f33",
  };
}

function readMessage(raw: Record<string, unknown>, fallbackStep: number): SequenceMessage {
  const log = normalizeSequenceLog(raw.log);
  const description = normalizeSequenceDesc(raw.desc ?? raw.description);
  const group = String(raw.group ?? "") || undefined;
  return {
    id: String(raw.id ?? `m${fallbackStep}`),
    from: String(raw.from ?? ""),
    to: String(raw.to ?? ""),
    label: String(raw.label ?? ""),
    log,
    description,
    group,
    kind: (raw.kind as SequenceMessage["kind"]) ?? "sync",
    step: Number(raw.step ?? fallbackStep),
  };
}

function readGroups(seq: Record<string, unknown>): SequenceGroup[] | undefined {
  const raw = (seq.groups as Record<string, unknown>[]) ?? [];
  if (!raw.length) return undefined;
  return raw.map((g, i) => ({
    id: String(g.id ?? `grp-${i}`),
    name: String(g.name ?? g.label ?? `Grupo ${i + 1}`),
    hue: resolveTkHue(g, DEFAULT_HUES[i % DEFAULT_HUES.length]),
  }));
}

export function sequenceSpecFromPayload(payload: unknown): SequenceSpec | null {
  const p = asRecord(payload);
  const seq = asRecord(p.sequence ?? p);
  const rawActors = (seq.actors as Record<string, unknown>[]) ?? [];
  if (!rawActors.length) return null;

  const actors = rawActors.map(readActor);
  const flatMessages = ((seq.messages as Record<string, unknown>[]) ?? []).map((m, i) => readMessage(m, i + 1));
  const preamble = flatMessages.length
    ? flatMessages
    : ((seq.preamble as Record<string, unknown>[]) ?? []).map((m, i) => readMessage(m, i + 1));
  const epilogue = ((seq.epilogue as Record<string, unknown>[]) ?? []).map((m, i) =>
    readMessage(m, preamble.length + 10 + i),
  );

  let alt: SequenceSpec["alt"];
  const rawAlt = asRecord(seq.alt);
  const branches = (rawAlt.branches as Record<string, unknown>[]) ?? [];
  if (branches.length) {
    alt = {
      branches: branches.map((b) => ({
        condition: String(b.condition ?? ""),
        messages: ((b.messages as Record<string, unknown>[]) ?? []).map((m, i) => readMessage(m, i + 1)),
      })),
    };
  }

  return {
    title: String(seq.title ?? p.title ?? ""),
    subtitle: String(seq.subtitle ?? p.subtitle ?? ""),
    actors,
    groups: readGroups(seq),
    messages: flatMessages.length ? flatMessages : undefined,
    preamble,
    alt,
    epilogue,
  };
}

/** Inline `sequence` gana sobre `preset` (editable en TK_DOC JSON). */
export function resolveSequenceSpec(payload: unknown): SequenceSpec | null {
  const inline = sequenceSpecFromPayload(payload);
  if (inline) return inline;
  const preset = String(asRecord(payload).preset ?? "");
  if (preset === "tk1437191") return tk1437191SequenceSpec();
  if (preset === "tk1431662") return tk1431662SequenceSpec();
  return null;
}

/** Serializa un mensaje para JSON en BD (`log` + `desc`). */
function sequenceMessageToJson(m: SequenceMessage): Record<string, unknown> {
  const row: Record<string, unknown> = {
    id: m.id,
    from: m.from,
    to: m.to,
    label: m.label,
    step: m.step,
  };
  if (m.kind && m.kind !== "sync") row.kind = m.kind;
  if (m.log) row.log = normalizeSequenceLog(m.log);
  if (m.description) row.desc = m.description;
  if (m.group) row.group = m.group;
  return row;
}

/** Serializa actor para BD — icono y tono solo en `label` (sugar iconify). */
function sequenceActorToJson(a: SequenceActor): Record<string, unknown> {
  const row: Record<string, unknown> = { id: a.id, label: a.label };
  if (a.kind && a.kind !== "participant") row.kind = a.kind;
  return row;
}

/** Spec de secuencia → objeto `sequence` listo para persistir en TK_CONTENT. */
export function sequenceSpecToJson(spec: SequenceSpec): Record<string, unknown> {
  const seq: Record<string, unknown> = { actors: spec.actors.map(sequenceActorToJson) };
  if (spec.title) seq.title = spec.title;
  if (spec.subtitle) seq.subtitle = spec.subtitle;
  if (spec.groups?.length) seq.groups = spec.groups;

  if (spec.messages?.length) {
    seq.messages = spec.messages.map(sequenceMessageToJson);
    return seq;
  }

  if (spec.preamble?.length) seq.preamble = spec.preamble.map(sequenceMessageToJson);
  if (spec.alt?.branches?.length) {
    seq.alt = {
      branches: spec.alt.branches.map((b) => ({
        condition: b.condition,
        messages: b.messages.map(sequenceMessageToJson),
      })),
    };
  }
  if (spec.epilogue?.length) seq.epilogue = spec.epilogue.map(sequenceMessageToJson);
  return seq;
}

/** Payload TK_DOC con `sequence` materializada (presets expandidos, `log` en mensajes). */
export function expandSequencePayloadForJson(payload: Record<string, unknown>): Record<string, unknown> {
  const out = { ...payload };
  const spec = resolveSequenceSpec(out);
  if (spec) out.sequence = sequenceSpecToJson(spec);
  return out;
}

/**
 * Payload con los mensajes de los grupos en `hiddenIds` OCULTOS (re-diseña sin esas
 * aristas). Materializa la spec (sin preset). Solo afecta render / `d` / código — no BD.
 */
export function sequencePayloadHideGroups(
  payload: Record<string, unknown>,
  hiddenIds: Set<string>,
): Record<string, unknown> {
  if (!hiddenIds || hiddenIds.size === 0) return payload;
  const spec = resolveSequenceSpec(payload);
  if (!spec) return payload;
  const keep = (m: SequenceMessage) => !m.group || !hiddenIds.has(m.group);
  const filtered: SequenceSpec = {
    ...spec,
    messages: spec.messages ? spec.messages.filter(keep) : undefined,
    preamble: spec.preamble ? spec.preamble.filter(keep) : undefined,
    epilogue: spec.epilogue ? spec.epilogue.filter(keep) : undefined,
    alt: spec.alt
      ? { branches: spec.alt.branches.map((b) => ({ ...b, messages: b.messages.filter(keep) })) }
      : undefined,
  };
  const out = { ...payload, sequence: sequenceSpecToJson(filtered) };
  delete out.preset;
  return out;
}

/** Quita `icon`/`hue` sueltos de actores — deben ir solo en el sugar del `label`. */
export function compactSequenceActorsInPayload(payload: Record<string, unknown>): Record<string, unknown> {
  const seq = asRecord(payload.sequence);
  const rawActors = seq.actors;
  if (!Array.isArray(rawActors)) return payload;
  return {
    ...payload,
    sequence: {
      ...seq,
      actors: rawActors.map((raw, i) => {
        const a = asRecord(raw);
        const spec = readActor(a, i);
        return sequenceActorToJson(spec);
      }),
    },
  };
}

/* ───────────────────────── auto-layout ───────────────────────── */

const LOOP_W = 40;
const LOOP_H = 24;
const ROW_H = 48;
const MIN_GAP = 140;
const LABEL_PAD = 16;
const CHIP_H = 18;

/** Ancho de la caja del actor según su etiqueta (descuenta tokens {{icon}}). */
function actorBoxWidth(label: string, _kind: "actor" | "participant"): number {
  const plain = richTextPlain(label);
  const icons = countIconifyTokens(label);
  // Reserva ~50px para el avatar (icono) + paddings, a la izquierda del label.
  const avatarPad = hasIconifyJsonSugar(label) ? 16 : 50;
  const est = Math.ceil(plain.length * 6.4) + avatarPad + icons * ICON_INLINE_W;
  return snapDiagramGrid(Math.min(240, Math.max(96, est)));
}

/** Mensaje aplanado con su contexto de rama y los índices de actor resueltos. */
interface FlatMsg {
  m: SequenceMessage;
  kind: "sync" | "async" | "self";
  fromIdx: number;
  toIdx: number;
  labelW: number;
  branch?: string;
  branchFirst?: boolean;
}

/**
 * Posiciones X de las lifelines. La separación entre columnas se deriva del
 * ancho real de las etiquetas (y de los self-loops), de modo que con el JSON
 * mínimo el diagrama se auto-dimensiona sin solapes ni recortes.
 */
function layoutActorPositions(
  boxW: number[],
  flat: FlatMsg[],
): { x: number[]; rightMargin: number; selfSide: (1 | -1)[] } {
  const n = boxW.length;
  const selfSide: (1 | -1)[] = new Array(n).fill(1);
  if (n <= 1) {
    const x0 = snapDiagramGrid(48 + (boxW[0] ?? 88) / 2);
    return { x: [x0], rightMargin: Math.max((boxW[0] ?? 88) / 2 + 12, 24), selfSide };
  }

  // Espacio que reclama a su derecha el self-loop de cada actor.
  const selfExtent = new Array(n).fill(0);
  for (const f of flat) {
    if (f.kind === "self") selfExtent[f.fromIdx] = Math.max(selfExtent[f.fromIdx], LOOP_W + 12 + f.labelW);
  }
  // El último actor dibuja su self-loop hacia la izquierda (no hay columna a la derecha).
  selfSide[n - 1] = -1;

  const gaps = new Array(n - 1);
  for (let i = 0; i < n - 1; i++) {
    gaps[i] = Math.max(MIN_GAP, boxW[i] / 2 + boxW[i + 1] / 2 + 24);
    if (selfExtent[i] > 0) gaps[i] = Math.max(gaps[i], selfExtent[i] + 24);
  }
  // El self del último actor va a la izquierda → asegura hueco en el último gap.
  if (selfExtent[n - 1] > 0) gaps[n - 2] = Math.max(gaps[n - 2], selfExtent[n - 1] + 24);

  // Relajación: ensanchar huecos para que las etiquetas multi-columna quepan.
  for (let pass = 0; pass < 2; pass++) {
    const pos = [0];
    for (let i = 1; i < n; i++) pos[i] = pos[i - 1] + gaps[i - 1];
    for (const f of flat) {
      const lo = Math.min(f.fromIdx, f.toIdx);
      const hi = Math.max(f.fromIdx, f.toIdx);
      if (hi <= lo) continue;
      const need = f.labelW + LABEL_PAD;
      const span = pos[hi] - pos[lo];
      if (span < need) {
        const add = (need - span) / (hi - lo);
        for (let i = lo; i < hi; i++) gaps[i] += add;
      }
    }
  }

  const pos = [0];
  for (let i = 1; i < n; i++) pos[i] = pos[i - 1] + gaps[i - 1];
  const leftMargin = 48 + boxW[0] / 2;
  const x = pos.map((p) => snapDiagramGrid(leftMargin + p));
  const rightMargin = Math.max(boxW[n - 1] / 2 + 12, 24);
  return { x, rightMargin, selfSide };
}

export function computeSequenceLayout(spec: SequenceSpec): SequenceLayout {
  const title = spec.title ?? "";
  const subtitle = spec.subtitle ?? "";
  const hasHeader = !!(title || subtitle);
  const titleY = title ? 24 : 16;
  const subtitleY = title ? 44 : 26;

  const actors = spec.actors;
  const idx = new Map(actors.map((a, i) => [a.id, i]));
  // Etiqueta sin el sugar líder (el ícono va al avatar circular).
  const actorLabels = actors.map((a) => extractLeadingIconifyToken(a.label)?.rest ?? a.label);
  const boxW = actors.map((a, i) => actorBoxWidth(actorLabels[i], a.kind ?? "participant"));
  const groupHueMap = new Map((spec.groups ?? []).map((gp) => [gp.id, gp.hue]));

  // 1) Aplanar mensajes en orden de render (preamble/messages → alt → epilogue).
  const flat: FlatMsg[] = [];
  const toFlat = (m: SequenceMessage, branch?: string, branchFirst = false): FlatMsg => {
    const kind = m.kind ?? (m.from === m.to ? "self" : "sync");
    const fromIdx = idx.get(m.from) ?? 0;
    const toIdx = idx.get(m.to) ?? fromIdx;
    return { m, kind, fromIdx, toIdx, labelW: diagramLabelW(m.label), branch, branchFirst };
  };
  (spec.messages ?? spec.preamble ?? []).forEach((m) => flat.push(toFlat(m)));
  const altStart = flat.length;
  spec.alt?.branches?.forEach((b) => b.messages.forEach((m, mi) => flat.push(toFlat(m, b.condition, mi === 0))));
  const altEnd = flat.length;
  (spec.epilogue ?? []).forEach((m) => flat.push(toFlat(m)));

  // 2) Posiciones X (auto) y ancho del lienzo.
  const { x: ax, rightMargin, selfSide } = layoutActorPositions(boxW, flat);
  const legendGroups = spec.groups?.length ? spec.groups : undefined;
  const legendW = legendGroups ? Math.max(...legendGroups.map((gp) => Math.ceil(gp.name.length * 6) + 30)) : 0;
  const baseW = snapDiagramGrid((ax[ax.length - 1] ?? 88) + rightMargin);
  const W = legendGroups ? Math.max(baseW, legendW + 200) : baseW;
  const legendX = legendGroups ? Math.max(8, W - legendW - 8) : 0;

  // 3) Métricas verticales (más aire bajo el subtítulo).
  const headerCenterY = hasHeader ? 100 : 56;
  const lifelineY1 = headerCenterY + 22;
  const messagesTop = snapDiagramGrid(headerCenterY + 58);
  const yAt = (r: number) => snapDiagramGrid(messagesTop + r * ROW_H);
  const rowCount = flat.length;
  const lifelineY2 = snapDiagramGrid((rowCount ? yAt(rowCount - 1) : lifelineY1 + 40) + 30);
  const H = lifelineY2 + 24;

  const actorLayouts: SequenceActorLayout[] = actors.map((a, i) => ({
    id: a.id,
    x: ax[i],
    y: headerCenterY,
    w: boxW[i],
    label: actorLabels[i],
    icon: a.icon ?? DEFAULT_ICONS[i % DEFAULT_ICONS.length],
    hue: a.hue ?? DEFAULT_HUES[i % DEFAULT_HUES.length],
    kind: a.kind ?? "participant",
  }));

  // 4) Rejilla de costos: cajas de actor bloqueadas + lifelines con costo suave.
  const g: CostGrid = makeCostGrid(W, H);
  actorLayouts.forEach((a, i) => blockRect(g, a.x - boxW[i] / 2, a.y - 16, boxW[i], 34));
  for (const a of actorLayouts) applyRectCost(g, a.x - 4, lifelineY1, 8, lifelineY2 - lifelineY1, 5, true);

  // 5) Rutear cada mensaje y colocar su etiqueta (registrada como obstáculo).
  const messages: SequenceMessageLayout[] = [];
  let stepCounter = 1;
  flat.forEach((f, row) => {
    const y = yAt(row);
    const fromX = ax[f.fromIdx];
    const toX = ax[f.toIdx];
    let labelX: number;
    let labelY: number;
    let route;

    if (f.kind === "self") {
      const side = selfSide[f.fromIdx];
      route = routeSequenceSelf(fromX, y, g, side, LOOP_W, LOOP_H);
      labelX =
        side === 1
          ? snapDiagramGrid(fromX + LOOP_W + 8)
          : snapDiagramGrid(fromX - LOOP_W - 8 - f.labelW);
      labelY = snapDiagramGrid(y - LOOP_H / 2 - CHIP_H / 2);
      applyRectCost(g, Math.min(fromX, fromX + side * LOOP_W), y - LOOP_H, LOOP_W, LOOP_H, 8, true);
    } else {
      route = routeSequenceHorizontal(fromX, toX, y, g);
      labelX = snapDiagramGrid((fromX + toX) / 2 - f.labelW / 2);
      labelY = snapDiagramGrid(y - 24);
    }
    applyRectCost(g, labelX, labelY, f.labelW, CHIP_H, 6, true);

    messages.push({
      id: f.m.id,
      step: f.m.step ?? stepCounter++,
      label: f.m.label,
      log: f.m.log,
      description: f.m.description,
      kind: f.kind,
      y,
      fromX,
      toX,
      path: route.path,
      lineX1: fromX,
      lineX2: toX,
      arrowTipX: route.arrowTipX,
      arrowTipY: route.arrowTipY,
      arrowDir: route.arrowDir,
      labelX,
      labelW: f.labelW,
      labelY,
      labelH: CHIP_H,
      branch: f.branch,
      branchFirst: f.branchFirst,
      groupHue: f.m.group ? groupHueMap.get(f.m.group) : undefined,
    });
  });

  // 6) Caja alt (si hay ramas).
  let altBox: SequenceLayout["altBox"];
  if (altEnd > altStart) {
    const y1 = yAt(altStart) - 28;
    const y2 = yAt(altEnd - 1) + 26;
    const x0 = ax[0] - boxW[0] / 2 - 8;
    const x1 = ax[ax.length - 1] + boxW[boxW.length - 1] / 2 + 8;
    altBox = { x: x0, y: y1, w: x1 - x0, h: y2 - y1, label: "alt" };
  }

  const lifelines = actorLayouts.map((a) => ({ id: a.id, x: a.x, y1: lifelineY1, y2: lifelineY2 }));

  return {
    width: W,
    height: H,
    title: title || undefined,
    subtitle: subtitle || undefined,
    titleY,
    subtitleY,
    actors: actorLayouts,
    lifelines,
    messages,
    altBox,
    groups: legendGroups,
    legendX,
  };
}

function escXml(s: string): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Etiqueta de mensaje: `<text>` plano, o `<foreignObject>` con iconos si trae {{icon}}. */
function labelSvgContent(m: SequenceMessageLayout, color: string): string {
  if (!m.label) return "";
  if (m.label.includes("{{")) {
    const html = replaceIconifyTokensWeb(m.label, escXml, { size: "1em" });
    return `<foreignObject x="${m.labelX}" y="${m.labelY}" width="${m.labelW}" height="${m.labelH}" overflow="visible"><div xmlns="http://www.w3.org/1999/xhtml" style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;font:10px Consolas,Menlo,monospace;color:${color};line-height:1.2;text-align:center">${html}</div></foreignObject>`;
  }
  return `<text x="${m.labelX + m.labelW / 2}" y="${m.labelY + 13}" text-anchor="middle" fill="${color}" font-size="10" font-family="Consolas,Menlo,monospace">${escXml(m.label)}</text>`;
}

function arrowHeadSvg(m: SequenceMessageLayout, theme: SequenceTheme, color?: string): string {
  const tipX = m.arrowTipX;
  const tipY = m.arrowTipY;
  const dir = m.arrowDir;
  const head =
    dir > 0
      ? `${tipX},${tipY} ${tipX - 7},${tipY - 3.5} ${tipX - 7},${tipY + 3.5}`
      : `${tipX},${tipY} ${tipX + 7},${tipY - 3.5} ${tipX + 7},${tipY + 3.5}`;
  const c = color || theme.accent;
  if (m.kind === "async") {
    return `<polyline points="${head}" fill="none" stroke="${c}" stroke-width="1.15" stroke-linejoin="miter"/>`;
  }
  return `<polygon points="${head}" fill="${c}"/>`;
}

export function renderSequenceSvg(spec: SequenceSpec, theme: SequenceTheme): string {
  const layout = computeSequenceLayout(spec);
  const { width: W, height: H } = layout;
  const r = TK_DIAGRAM_RADIUS_PX;

  const actorBoxes = layout.actors
    .map((a) => {
      const bw = a.w;
      const bx = a.x - bw / 2;
      const icon = iconifyApiUrl(a.icon, a.hue);
      const iconInLabel = hasIconifyJsonSugar(a.label);
      const fillHex = tkHueToHex(a.hue) ?? "#64748b";
      const iconCx = bx + 18;
      const labelLeft = iconInLabel ? bx + 8 : bx + 32;
      const labelRight = bx + bw - 8;
      const labelCx = (labelLeft + labelRight) / 2;
      const labelEl = a.label.includes("{{")
        ? `<foreignObject x="${labelLeft}" y="${a.y - 10}" width="${labelRight - labelLeft}" height="20" overflow="visible"><div xmlns="http://www.w3.org/1999/xhtml" style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;font:600 11px Tahoma,Arial,sans-serif;color:${theme.text};line-height:1">${replaceIconifyTokensWeb(a.label, escXml, { size: "1em" })}</div></foreignObject>`
        : `<text x="${labelCx}" y="${a.y + 4}" text-anchor="middle" fill="${theme.text}" font-size="11" font-weight="600" font-family="Tahoma,Arial,sans-serif">${escXml(a.label)}</text>`;
      const avatarEl = iconInLabel
        ? ""
        : `<circle cx="${iconCx}" cy="${a.y}" r="11.8" fill="${fillHex}" opacity="0.16"/>
        <image href="${escXml(icon)}" x="${iconCx - 8}" y="${a.y - 8}" width="16" height="16"/>`;
      return `<g>
        <rect x="${bx}" y="${a.y - 16}" width="${bw}" height="32" rx="${r}" fill="transparent" stroke="${theme.border}" stroke-width="1"/>
        ${avatarEl}
        ${labelEl}
      </g>`;
    })
    .join("");

  const lifelines = layout.lifelines
    .map(
      (l) =>
        `<line x1="${l.x}" y1="${l.y1}" x2="${l.x}" y2="${l.y2}" stroke="${theme.grid}" stroke-width="1" stroke-dasharray="4 4"/>`,
    )
    .join("");

  const altSvg = layout.altBox
    ? `<rect x="${layout.altBox.x}" y="${layout.altBox.y}" width="${layout.altBox.w}" height="${layout.altBox.h}" rx="${r}" fill="transparent" stroke="${theme.altBorder}" stroke-width="1" stroke-dasharray="5 4"/>
       <text x="${layout.altBox.x + 10}" y="${layout.altBox.y + 14}" fill="${theme.muted}" font-size="10" font-weight="600" font-family="Tahoma,Arial,sans-serif">${layout.altBox.label}</text>`
    : "";

  const msgs = layout.messages
    .map((m) => {
      const dash = m.kind === "async" ? ' stroke-dasharray="5 3"' : "";
      const branchLabel = m.branchFirst
        ? `<text x="${layout.altBox?.x ? layout.altBox.x + 36 : 52}" y="${m.y - 10}" fill="${theme.muted}" font-size="9" font-family="Tahoma,Arial,sans-serif">[${m.branch}]</text>`
        : "";
      const chip = m.label
        ? `<rect x="${m.labelX}" y="${m.labelY}" width="${m.labelW}" height="${m.labelH}" rx="4" fill="${theme.chipFill}"/>`
        : "";
      const col = (m.groupHue != null && tkHueToHex(m.groupHue)) || theme.accent;
      return `<g>
        ${branchLabel}
        <path d="${m.path}" fill="none" stroke="${col}" stroke-width="1.15" stroke-linecap="square" stroke-linejoin="miter"${dash}/>
        ${arrowHeadSvg(m, theme, col)}
        <circle cx="${m.fromX}" cy="${m.y}" r="8" fill="${col}"/>
        <text x="${m.fromX}" y="${m.y + 3.2}" text-anchor="middle" fill="${contrastFontColor(col)}" font-size="9" font-weight="700" font-family="Tahoma,Arial,sans-serif">${m.step}</text>
        ${chip}
        ${labelSvgContent(m, theme.muted)}
      </g>`;
    })
    .join("");

  const titleSvg = layout.title
    ? `<text x="${W / 2}" y="${layout.titleY}" text-anchor="middle" fill="${theme.text}" font-size="13" font-weight="600" font-family="Tahoma,Arial,sans-serif">${layout.title}</text>`
    : "";
  const subtitleSvg = layout.subtitle
    ? `<text x="${W / 2}" y="${layout.subtitleY}" text-anchor="middle" fill="${theme.muted}" font-size="11" font-family="Tahoma,Arial,sans-serif">${layout.subtitle}</text>`
    : "";

  const legendSvg = (layout.groups ?? [])
    .map((grp, gi) => {
      const ly = 18 + gi * 16;
      const c = tkHueToHex(grp.hue) ?? theme.accent;
      return `<circle cx="${layout.legendX + 5}" cy="${ly}" r="4.5" fill="${c}"/>
        <text x="${layout.legendX + 16}" y="${ly + 3.5}" fill="${theme.muted}" font-size="10" font-family="Tahoma,Arial,sans-serif">${escXml(grp.name)}</text>`;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${layout.title || "Diagrama de secuencia"}" style="width:100%;max-width:${W}px;height:auto;display:block;margin:0 auto">
    ${titleSvg}${subtitleSvg}${legendSvg}
    ${actorBoxes}${lifelines}${altSvg}${msgs}
  </svg>`;
}

/** Mensajes TK-1437191 — `log`: animación tortuga; `desc`: tooltip hover (extendida). */
const TK1437191_SEQUENCE_MESSAGES: SequenceMessage[] = [
  {
    id: "m1",
    group: "grp-turno",
    from: "U",
    to: "A",
    label: "turno conversación (stream)",
    step: 1,
    log: "Usuario envía mensaje; Paty responde en stream",
    description:
      "El usuario escribe en el chat del portal. **ISS-AyudasCPIA** atiende el turno en **SSE/stream**: tokens del asistente y evento **`end`** con el slot **`imensaje`**.",
  },
  {
    id: "m2",
    group: "grp-turno",
    from: "A",
    to: "A",
    label: "Persiste CONVERSACION_LOG · asigna imensaje",
    kind: "self",
    step: 2,
    log: "Backend persiste turno y asigna imensaje",
    description:
      "Se persiste el turno en **`CONVERSACION_LOG`** (usuario + asistente). Al turno del asistente se le asigna **`imensaje`** secuencial dentro de **`iconversacion`**.",
  },
  {
    id: "m3",
    group: "grp-hilo",
    from: "UI",
    to: "A",
    label: "GET /api/conversacion/{id}",
    step: 3,
    log: "Portal solicita la conversación por GET",
    description:
      "El portal PatyIA consulta **`GET /api/conversacion/{iconversacion}`** para reconstruir el hilo visible y preparar la UI de calificación.",
  },
  {
    id: "m4",
    group: "grp-hilo",
    from: "A",
    to: "UI",
    label: "mensajesOpenAI[] · fecha_hora · imensaje",
    kind: "async",
    step: 4,
    log: "API devuelve hilo con fecha_hora e imensaje",
    description:
      "La API devuelve **`mensajesOpenAI[]`** con **`fecha_hora`** (desde `meta.ts` del log) e **`imensaje`** en cada turno del asistente, habilitando el cruce con **`mensajesCalificados`**.",
  },
  {
    id: "m5",
    group: "grp-calif",
    from: "U",
    to: "A",
    label: "POST /api/mensaje · calificar {{thumb-up}}/{{thumb-down}}",
    step: 5,
    log: "Usuario califica mensaje del asistente",
    description:
      "El usuario califica un mensaje del asistente con {{thumb-up}} o {{thumb-down}}. **`POST /api/mensaje`** envía **`imensaje`**, **`iconversacion`** y **`butil`**.",
  },
  {
    id: "m6",
    group: "grp-calif",
    from: "A",
    to: "A",
    label: "Valida imensaje en log · rechaza duplicados",
    kind: "self",
    step: 6,
    log: "API valida imensaje y rechaza duplicado",
    description:
      "Se valida que **`imensaje`** exista en el log de la conversación. Un segundo **`POST`** con el mismo par **`(imensaje, iconversacion)`** se rechaza como duplicado.",
  },
  {
    id: "m7",
    group: "grp-calif",
    from: "A",
    to: "UI",
    label: "Calificación enlazada al turno Paty",
    kind: "async",
    step: 7,
    log: "Calificación queda enlazada al turno Paty",
    description:
      "Tras **GET conversación**, la calificación queda en **`mensajesCalificados`**, enlazada al turno Paty evaluado mediante **`imensaje`**.",
  },
];

/** Spec predefinida TK-1437191 — imensaje + calificación (estilo sequenceDiagram). */
export function tk1437191SequenceSpec(): SequenceSpec {
  return {
    title: "Diagrama de secuencia",
    subtitle: "imensaje · mensajesOpenAI · calificación",
    groups: [
      { id: "grp-turno", name: "Turno y persistencia", hue: 239 },
      { id: "grp-hilo", name: "Consulta del hilo", hue: 199 },
      { id: "grp-calif", name: "Calificación", hue: 38 },
    ],
    actors: [
      { id: "U", label: '{{iconify: {icon: "mdi:account", hue: 239}}} Usuario', kind: "actor" },
      { id: "UI", label: '{{iconify: {icon: "mdi:monitor-dashboard", hue: 199}}} Portal PatyIA', kind: "participant" },
      { id: "A", label: '{{iconify: {icon: "mdi:api", hue: 210}}} ISS-AyudasCPIA', kind: "participant" },
    ],
    messages: TK1437191_SEQUENCE_MESSAGES,
  };
}

/** Spec predefinida TK-1431662 — resolución de modelo por turno. */
export function tk1431662SequenceSpec(): SequenceSpec {
  return {
    title: "Resolución del modelo por turno",
    subtitle: "Clasificación operativa → MODELO en BD → respuesta final",
    actors: [
      { id: "U", label: "Usuario", kind: "actor", icon: "mdi:account", hue: 215 },
      { id: "P", label: "PatyIA", kind: "participant", icon: "mdi:robot-outline", hue: 210 },
      { id: "O", label: "OpenAI", kind: "participant", icon: "simple-icons:openai", hue: 160 },
    ],
    preamble: [
      { id: "m1", from: "U", to: "P", label: "Mensaje del usuario", step: 1 },
      { id: "m2", from: "P", to: "O", label: "clasificar · PR_TIPO_CONSULTAS · gpt-4.1-nano", step: 2 },
      { id: "m3", from: "O", to: "P", label: "tipo_consulta (JSON)", kind: "async", step: 3 },
      { id: "m4", from: "P", to: "P", label: "resolverPorTipo · MODELO en BD", kind: "self", step: 4 },
    ],
    alt: {
      branches: [
        {
          condition: "MODELO en fila",
          messages: [{ id: "m5", from: "P", to: "O", label: "responses.create(MODELO)", step: 5 }],
        },
        {
          condition: "fallback system-prompts",
          messages: [{ id: "m6", from: "P", to: "O", label: "responses.create(modeloConversacion)", step: 6 }],
        },
      ],
    },
    epilogue: [
      { id: "m7", from: "O", to: "P", label: "respuesta", kind: "async", step: 7 },
      { id: "m8", from: "P", to: "P", label: "log turno · modelo + tokens + costo", kind: "self", step: 8 },
    ],
  };
}
