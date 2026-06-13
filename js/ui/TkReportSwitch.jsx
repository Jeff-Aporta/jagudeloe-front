/** Toggle diligencia ↔ métricas — mismo patrón visual que ThemeSwitch (ISA). */
import { getMaterialUI } from "../core/runtime.ts";
import { UI } from "../core/platform.ts";

export function TkReportSwitch({ mode, onToggle }) {
  const { Tooltip, IconButton } = getMaterialUI();
  const { Icon } = UI;
  const isDoc = mode !== "metricas";
  const title = isDoc ? "Ver métricas del ticket" : "Ver documentación del ticket";
  const icon = isDoc ? "mdi:chart-timeline-variant" : "mdi:clipboard-text-outline";

  return (
    <Tooltip title={title}>
      <IconButton
        color="inherit"
        size="small"
        onClick={onToggle}
        aria-label={title}
      >
        <Icon icon={icon} size={20} />
      </IconButton>
    </Tooltip>
  );
}
