import { getReact } from "../core/platform.ts";
import { resolveTicketTimeline } from "../core/tk-timeline-spec.ts";
import { buildTicketMilestones } from "../core/tk-timeline.ts";
import { formatMinutos } from "../core/tk-metrics.ts";
import { TicketAnalysisTimeline } from "./TicketAnalysisTimeline.jsx";

const { useMemo } = getReact();

/** Timeline de métricas — JSON BD primero, cómputo local como fallback. */
export function TkDocMetricsTimeline({ tk, metrics, metricInput }) {
  const fallbackResumen = useMemo(
    () => [
      { label: "Hasta atención", value: formatMinutos(metrics.minutosHastaAtencion) },
      { label: "Atención activa", value: formatMinutos(metrics.minutosAtencionActiva) },
      { label: "Total hábil", value: formatMinutos(metrics.minutosTotalSolucion), highlight: true },
    ],
    [metrics],
  );

  const resolved = useMemo(() => {
    const computed = buildTicketMilestones(metrics, metricInput);
    return resolveTicketTimeline(tk, { milestones: computed, resumen: fallbackResumen });
  }, [tk, metrics, metricInput, fallbackResumen]);

  if (!resolved.milestones.length) return null;

  return (
    <TicketAnalysisTimeline
      milestones={resolved.milestones}
      resumen={resolved.resumen}
    />
  );
}
