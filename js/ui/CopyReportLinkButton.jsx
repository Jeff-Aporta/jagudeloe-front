/* Copiar enlace shareable del ticket (diligencia o métricas). */
import { getReact, getMaterialUI } from "../core/platform.ts";
import { UI } from "../core/platform.ts";
import {
  buildDocShareHtmlSnippet,
  copyRichHtmlToClipboard,
  resolveDocReportUrl,
} from "../core/tk-doc.ts";
import { parseDocReportView } from "../boot/url-s.mjs";

function resolveEffectiveReport(reportProp) {
  if (reportProp === "metricas") return "metricas";
  try {
    if (parseDocReportView() === "metricas") return "metricas";
  } catch {
    /* ignore */
  }
  return "diligencia";
}

function useCopyFeedback() {
  const { useState } = getReact();
  const [done, setDone] = useState(false);
  const flash = () => {
    setDone(true);
    setTimeout(() => setDone(false), 1500);
  };
  return { done, flash };
}

export function CopyReportLinkButton({ space, iticket, report = "diligencia", driver = "jsx" }) {
  const { Tooltip, IconButton } = getMaterialUI();
  const { Icon } = UI;
  const { done, flash } = useCopyFeedback();

  if (!space || !iticket) return null;

  const effectiveReport = resolveEffectiveReport(report);
  const tip =
    effectiveReport === "metricas"
      ? "Copiar enlace métricas (tiempo hábil)"
      : driver === "jsx"
        ? "Copiar enlace web (JSX)"
        : "Copiar enlace HTML (correo)";

  function copy() {
    const reportNow = resolveEffectiveReport(report);
    const url = resolveDocReportUrl(space, iticket, reportNow, driver);
    navigator.clipboard.writeText(url);
    flash();
  }

  return (
    <Tooltip title={done ? "Enlace copiado" : tip}>
      <IconButton size="small" onClick={copy} aria-label={tip}>
        <Icon icon={done ? "mdi:check" : "mdi:link-variant"} size={20} />
      </IconButton>
    </Tooltip>
  );
}

/** Copia tarjeta HTML con CSS inline (pegar en InSoft / correo). */
export function CopyReportLinkHtmlButton({
  space,
  iticket,
  report = "diligencia",
  driver = "jsx",
  titulo,
}) {
  const { Tooltip, IconButton } = getMaterialUI();
  const { Icon } = UI;
  const { done, flash } = useCopyFeedback();

  if (!space || !iticket) return null;

  const effectiveReport = resolveEffectiveReport(report);
  const tip =
    effectiveReport === "metricas"
      ? "Copiar HTML métricas (tarjeta email)"
      : "Copiar HTML diligencias (tarjeta email)";

  async function copy() {
    const reportNow = resolveEffectiveReport(report);
    const url = resolveDocReportUrl(space, iticket, reportNow, driver);
    const opts = { url, report: reportNow, iticket, titulo, space };
    const html = buildDocShareHtmlSnippet(opts);
    await copyRichHtmlToClipboard(html, html);
    flash();
  }

  return (
    <Tooltip title={done ? "HTML copiado" : tip}>
      <IconButton size="small" onClick={copy} aria-label={tip}>
        <Icon icon={done ? "mdi:check" : "mdi:code-tags"} size={20} />
      </IconButton>
    </Tooltip>
  );
}
