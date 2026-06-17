/* Copiar enlace shareable del ticket (diligencia o métricas). */
import { getReact, getMaterialUI } from "../core/platform.ts";
import { UI } from "../core/platform.ts";
import { buildDocEmailUrl, buildDocMetricasUrl, buildDocWebUrl } from "../core/tk-doc.ts";

export function CopyReportLinkButton({ space, iticket, report = "diligencia", driver = "jsx" }) {
  const { useState } = getReact();
  const { Tooltip, IconButton } = getMaterialUI();
  const { Icon } = UI;
  const [done, setDone] = useState(false);

  if (!space || !iticket) return null;

  const url =
    report === "metricas"
      ? buildDocMetricasUrl(space, iticket)
      : driver === "jsx"
        ? buildDocWebUrl(space, iticket)
        : buildDocEmailUrl(space, iticket);

  const tip =
    report === "metricas"
      ? "Copiar enlace métricas (tiempo hábil)"
      : driver === "jsx"
        ? "Copiar enlace web (JSX)"
        : "Copiar enlace HTML (correo)";

  function copy() {
    navigator.clipboard.writeText(url);
    setDone(true);
    setTimeout(() => setDone(false), 1500);
  }

  return (
    <Tooltip title={done ? "Enlace copiado" : tip}>
      <IconButton size="small" onClick={copy} aria-label={tip}>
        <Icon icon={done ? "mdi:check" : "mdi:link-variant"} size={20} />
      </IconButton>
    </Tooltip>
  );
}
