import { getReact } from "../core/platform.ts";
import {
  milestonesFromSpec,
  timelineSpecFromPayload,
} from "../core/tk-timeline-spec.ts";
import { TicketAnalysisTimeline } from "./TicketAnalysisTimeline.jsx";

const { useMemo } = getReact();

/** Intérprete payload BD → timeline visual de hitos. */
export function TkDocTimeline({ payload }) {
  const spec = useMemo(() => timelineSpecFromPayload(payload), [payload]);
  const milestones = useMemo(
    () => (spec ? milestonesFromSpec(spec) : []),
    [spec],
  );

  if (!milestones.length) return null;

  return (
    <TicketAnalysisTimeline
      milestones={milestones}
      resumen={spec?.resumen}
    />
  );
}
