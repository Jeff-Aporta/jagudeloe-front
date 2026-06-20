/** Especificación JSON → intérprete timeline de hitos (TK_CONTENT kind=timeline). */

import type { TicketMilestone } from "./tk-timeline.ts";
import type { TkDocBlock } from "./tk-doc-layout.ts";

export interface TimelineResumenItem {
  label: string;
  value: string;
  highlight?: boolean;
}

export interface TimelineMilestoneSpec {
  key: string;
  label: string;
  iso?: string | null;
  hora?: string;
  fechaTexto?: string;
  acumuladoHabilMin?: number;
  tramoHabilMin?: number | null;
  tramoDesdeAnteriorMin?: number | null;
  tramoCalendarioMin?: number | null;
  esExclusion?: boolean;
  esJornada?: boolean;
  lunchFinIso?: string | null;
  nota?: string;
  icon?: string;
}

export interface TimelineSpec {
  title?: string;
  milestones: TimelineMilestoneSpec[];
  resumen?: TimelineResumenItem[];
}

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
}

function readMilestone(raw: Record<string, unknown>, i: number): TimelineMilestoneSpec {
  return {
    key: String(raw.key ?? `ms-${i + 1}`),
    label: String(raw.label ?? raw.title ?? `Hito ${i + 1}`),
    iso: raw.iso != null ? String(raw.iso) : null,
    hora: raw.hora != null ? String(raw.hora) : undefined,
    fechaTexto: raw.fechaTexto != null ? String(raw.fechaTexto) : undefined,
    acumuladoHabilMin: raw.acumuladoHabilMin != null ? Number(raw.acumuladoHabilMin) : undefined,
    tramoHabilMin: raw.tramoHabilMin != null ? Number(raw.tramoHabilMin) : null,
    tramoDesdeAnteriorMin: raw.tramoDesdeAnteriorMin != null ? Number(raw.tramoDesdeAnteriorMin) : null,
    tramoCalendarioMin: raw.tramoCalendarioMin != null ? Number(raw.tramoCalendarioMin) : null,
    esExclusion: Boolean(raw.esExclusion),
    esJornada: raw.esJornada != null ? Boolean(raw.esJornada) : undefined,
    lunchFinIso: raw.lunchFinIso != null ? String(raw.lunchFinIso) : null,
    nota: raw.nota != null ? String(raw.nota) : undefined,
    icon: raw.icon != null ? String(raw.icon) : "mdi:circle-outline",
  };
}

function readResumen(raw: unknown): TimelineResumenItem[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  return raw.map((item) => {
    const r = asRecord(item);
    return {
      label: String(r.label ?? ""),
      value: String(r.value ?? ""),
      highlight: Boolean(r.highlight),
    };
  }).filter((r) => r.label && r.value);
}

/** Normaliza payload BD (`timeline.milestones[]` o legacy `milestones[]`). */
export function timelineSpecFromPayload(payload: unknown): TimelineSpec | null {
  const p = asRecord(payload);
  const nested = asRecord(p.timeline ?? p);
  const rawMs = (nested.milestones ?? p.milestones) as unknown[] | undefined;
  if (!Array.isArray(rawMs) || rawMs.length === 0) return null;

  return {
    title: String(nested.title ?? p.title ?? "Análisis del ticket"),
    milestones: (rawMs as Record<string, unknown>[]).map(readMilestone),
    resumen: readResumen(nested.resumen ?? p.resumen),
  };
}

export function milestonesFromSpec(spec: TimelineSpec): TicketMilestone[] {
  return spec.milestones.map((m) => ({
    key: m.key,
    label: m.label,
    iso: m.iso ?? null,
    hora: m.hora ?? "",
    fechaTexto: m.fechaTexto ?? "",
    acumuladoHabilMin: m.acumuladoHabilMin ?? 0,
    tramoHabilMin: m.tramoHabilMin ?? null,
    tramoDesdeAnteriorMin: m.tramoDesdeAnteriorMin ?? null,
    tramoCalendarioMin: m.tramoCalendarioMin ?? null,
    esExclusion: !!m.esExclusion,
    esJornada: m.esJornada,
    lunchFinIso: m.lunchFinIso ?? null,
    nota: m.nota,
    icon: m.icon ?? "mdi:circle-outline",
  }));
}

function normalizeTimelineKind(kind: unknown): string {
  const k = String(kind ?? "").toLowerCase();
  return k === "metrics-timeline" ? "timeline" : k;
}

export function findTimelineContentBlock(content: unknown[] | undefined): TkDocBlock | null {
  for (const raw of content ?? []) {
    const row = asRecord(raw);
    const kind = normalizeTimelineKind(row.kind ?? row.KIND);
    if (kind === "timeline" || kind === "metrics-timeline") {
      return {
        kind,
        sortKey: Number(row.sortKey ?? row.SORTKEY ?? 0),
        payload: asRecord(row.payload ?? row.PAYLOAD),
      };
    }
  }
  return null;
}

export function resolveTicketTimeline(
  tk: Record<string, unknown>,
  fallback: { milestones: TicketMilestone[]; resumen?: TimelineResumenItem[] },
): { milestones: TicketMilestone[]; resumen?: TimelineResumenItem[]; title: string } {
  const block = findTimelineContentBlock((tk.content as unknown[]) ?? []);
  const metaTimeline = asRecord(asRecord(tk.meta).metricas).timeline;
  const spec =
    timelineSpecFromPayload(block?.payload)
    ?? timelineSpecFromPayload(metaTimeline);

  if (spec) {
    return {
      milestones: milestonesFromSpec(spec),
      resumen: spec.resumen ?? fallback.resumen,
      title: spec.title ?? "Análisis del ticket",
    };
  }

  return {
    milestones: fallback.milestones,
    resumen: fallback.resumen,
    title: "Análisis del ticket",
  };
}

/** Helper seed — envuelve spec en payload canónico BD. */
export function timelineBlockPayload(spec: TimelineSpec, extra: Record<string, unknown> = {}): Record<string, unknown> {
  const { title, resumen, milestones } = spec;
  return {
    title,
    ...extra,
    timeline: {
      title,
      milestones,
      ...(resumen?.length ? { resumen } : {}),
    },
  };
}

export function timelineBlockHasContent(payload: unknown): boolean {
  return !!timelineSpecFromPayload(payload)?.milestones?.length;
}
