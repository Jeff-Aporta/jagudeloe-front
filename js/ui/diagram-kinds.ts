/**
 * Registro de tipos de diagrama (kind → componente React).
 * Rompe el ciclo TkDocSequence ↔ DiagramLightbox y permite anexar
 * nuevos tipos (flow, er, …) sin tocar el visor.
 */

type DiagramComponent = (props: { payload: unknown }) => unknown;

const REGISTRY: Record<string, DiagramComponent> = {};

export function registerDiagramKind(kind: string, component: DiagramComponent): void {
  REGISTRY[String(kind || "").toLowerCase()] = component;
}

export function getDiagramComponent(kind: string): DiagramComponent | null {
  return REGISTRY[String(kind || "").toLowerCase()] ?? null;
}
