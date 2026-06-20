import { resolveTkHue } from "./tk-hue.ts";

export type StepperOrientation = "vertical" | "horizontal";
export type StepperStepState = "default" | "error" | "optional";

export interface StepperStep {
  id?: string;
  label: string;
  description?: string;
  optional?: boolean;
  optionalLabel?: string;
  error?: boolean;
  state?: StepperStepState;
  icon?: string;
  hue?: number;
}

export interface StepperSpec {
  title?: string;
  subtitle?: string;
  orientation?: StepperOrientation;
  linear?: boolean;
  alternativeLabel?: boolean;
  steps: StepperStep[];
}

const DEFAULT_HUES = [239, 210, 199, 173, 38, 258, 160];
const DEFAULT_ICONS = [
  "mdi:numeric-1-circle-outline",
  "mdi:numeric-2-circle-outline",
  "mdi:numeric-3-circle-outline",
  "mdi:numeric-4-circle-outline",
  "mdi:numeric-5-circle-outline",
];

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
}

function readStep(raw: Record<string, unknown>, i: number): StepperStep {
  return {
    id: String(raw.id ?? `step-${i + 1}`),
    label: String(raw.label ?? raw.title ?? `Paso ${i + 1}`),
    description: raw.description != null ? String(raw.description) : raw.text != null ? String(raw.text) : undefined,
    optional: Boolean(raw.optional),
    optionalLabel: raw.optionalLabel != null ? String(raw.optionalLabel) : undefined,
    error: Boolean(raw.error),
    state: (raw.state as StepperStepState) ?? (raw.error ? "error" : raw.optional ? "optional" : "default"),
    icon: String(raw.icon ?? DEFAULT_ICONS[i % DEFAULT_ICONS.length]),
    hue: resolveTkHue(raw, DEFAULT_HUES[i % DEFAULT_HUES.length]),
  };
}

export function stepperSpecFromPayload(payload: unknown): StepperSpec | null {
  const p = asRecord(payload);
  const spec = asRecord(p.stepper ?? p);
  const rawSteps = (spec.steps as Record<string, unknown>[]) ?? [];
  if (!rawSteps.length) return null;

  return {
    title: String(spec.title ?? p.title ?? ""),
    subtitle: String(spec.subtitle ?? p.subtitle ?? ""),
    orientation: (spec.orientation as StepperOrientation) ?? "vertical",
    linear: spec.linear !== false,
    alternativeLabel: Boolean(spec.alternativeLabel),
    steps: rawSteps.map(readStep),
  };
}

/** Plan de pruebas TK-1437191 — imensaje + calificación. */
export function tk1437191StepperSpec(): StepperSpec {
  return {
    title: "Cómo probar",
    subtitle: "Staging PatyIA · conv. + SSE end + calificación",
    orientation: "vertical",
    linear: true,
    steps: [
      {
        id: "conv",
        label: "Crear conversación en staging",
        description: "Anotar **`imensaje`** del evento SSE **`end`**.",
        icon: "mdi:chat-plus-outline",
        hue: 239,
      },
      {
        id: "get",
        label: "GET conversación",
        description: "Verificar **`fecha_hora`** e **`imensaje`** en mensajes del asistente.",
        icon: "mdi:download-outline",
        hue: 199,
      },
      {
        id: "post",
        label: "POST /api/mensaje",
        description: "Enviar calificación con ese **`imensaje`** → respuesta OK.",
        icon: "mdi:thumb-up-outline",
        hue: 38,
      },
      {
        id: "dup",
        label: "Repetir POST duplicado",
        description: "Mismo par **`iconversacion` + `imensaje`** → debe rechazar duplicado.",
        icon: "mdi:shield-alert-outline",
        hue: 25,
      },
      {
        id: "link",
        label: "Verificar enlace en hilo",
        description: "**GET conversación** → calificación coincide con el turno Paty evaluado.",
        icon: "mdi:link-variant",
        hue: 160,
      },
    ],
  };
}
