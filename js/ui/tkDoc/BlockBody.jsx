import { getMaterialUI } from "../../core/platform.ts";
import { UI } from "../../core/platform.ts";
import { inlineMdWeb, stripRedundantTicketHtml } from "../tkHtml.ts";
import { tkCodeLanguageForRender, TK_CODE_OMITTED_NOTE, isDisallowedTkCodeLanguage, tkCodeBlockIntro } from "../../core/tk-code-policy.ts";
import { tkLinkHref, tkLinkLabel, tkLinkShowsPath } from "../../core/tk-doc.ts";
import { TK_DOC_RADIUS } from "../../core/tk-table.ts";
import { LightboxImage } from "../ImageLightbox.jsx";
import { CodeBlock } from "../CodeBlock.jsx";
import { MdBody } from "./MdBody.jsx";
import { SoftBadges, tkDocSoftBadgeSx } from "./SoftBadges.jsx";
import { StepsBlock } from "./StepsBlock.jsx";
import { TkDocFlow } from "../TkDocFlow.jsx";
import { TkDocSequence } from "../TkDocSequence.jsx";
import { TkDocStepper } from "../TkDocStepper.jsx";
import { TkDocFileTree } from "../TkDocFileTree.jsx";
import { TkDocTable } from "../TkDocTable.jsx";
import { TkDocTimeline } from "../TkDocTimeline.jsx";

/** Intérprete de un bloque TK_CONTENT (kind + payload JSON). */
export function BlockBody({ block, commits }) {
  const { Box, Typography, Link, Accordion, AccordionSummary, AccordionDetails, Chip } = getMaterialUI();
  const { Icon } = UI;

  const kind = String(block.kind || "text").toLowerCase();
  const p = block.payload || {};

  if (kind === "markdown" || kind === "md" || kind === "text" || kind === "html" || kind === "body") {
    let raw = String(p.text ?? p.body ?? p.html ?? p.content ?? "");
    if (kind === "html" || kind === "body") raw = stripRedundantTicketHtml(raw);
    return <MdBody text={raw} />;
  }

  if (kind === "code" || kind === "sql") {
    const lang = tkCodeLanguageForRender(p.language || "sql");
    const intro = tkCodeBlockIntro(p);
    return (
      <Box>
        {intro ? <MdBody text={intro} /> : null}
        <CodeBlock code={p.code ?? p.sql ?? ""} language={lang} />
      </Box>
    );
  }

  if (kind === "table") {
    return <TkDocTable payload={p} />;
  }

  if (kind === "image" || kind === "img") {
    const src = p.url ?? p.src ?? "";
    return (
      <Box sx={{ textAlign: "center", my: 1 }}>
        <LightboxImage
          variant="grid"
          src={src}
          alt={p.alt ?? p.caption ?? "Evidencia"}
        />
      </Box>
    );
  }

  if (kind === "url" || kind === "link") {
    const href = tkLinkHref(p);
    const label = tkLinkLabel(p, href);
    const showPath = tkLinkShowsPath(p);
    const urlEllipsisSx = {
      display: "block",
      maxWidth: "100%",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    };
    return (
      <Box sx={{ minWidth: 0, maxWidth: "100%" }}>
        <Typography variant="body1" sx={{ minWidth: 0, maxWidth: "100%" }}>
          <Link
            href={href}
            target="_blank"
            rel="noreferrer"
            title={label}
            sx={{ fontWeight: 600, ...urlEllipsisSx }}
          >
            {label}
          </Link>
        </Typography>
        {showPath && (
          <Typography
            variant="caption"
            component="div"
            sx={{ mt: 0.25, minWidth: 0, maxWidth: "100%", fontFamily: "monospace", fontSize: "0.8rem", lineHeight: 1.45 }}
          >
            <Link
              href={href}
              target="_blank"
              rel="noreferrer"
              title={href}
              className="tk-doc-link-path"
              sx={{ color: "primary.main", fontWeight: 400, textDecoration: "none", "&:hover": { textDecoration: "underline" }, ...urlEllipsisSx }}
            >
              {href}
            </Link>
          </Typography>
        )}
      </Box>
    );
  }

  if (kind === "badge" || kind === "chip") {
    const tone = String(p.tone ?? "default");
    const useSoft = tone === "soft" || p.variant === "soft" || p.soft;
    return (
      <Chip
        size="small"
        label={p.label ?? p.text ?? ""}
        color={!useSoft && (p.tone === "success" ? "success" : p.tone === "warning" ? "warning" : "default")}
        variant="outlined"
        sx={useSoft
          ? (t) => ({ mr: 0.5, mb: 0.5, ...tkDocSoftBadgeSx(p.softTone ?? "primary", t) })
          : { mr: 0.5, mb: 0.5 }}
      />
    );
  }

  if (kind === "steps" || kind === "stepper") {
    return <StepsBlock phases={p.phases ?? p.steps ?? []} />;
  }

  if (kind === "sequence" || kind === "sequence-diagram") {
    return <TkDocSequence payload={p} />;
  }

  if (kind === "flow" || kind === "flowchart" || kind === "flow-diagram") {
    if (String(p.preset ?? "") === "tk1437191") {
      return <TkDocSequence payload={p} />;
    }
    return <TkDocFlow payload={p} />;
  }

  if (kind === "mui-stepper") {
    return <TkDocStepper payload={p} />;
  }

  if (kind === "badges" || kind === "badge-row") {
    return <SoftBadges items={p.items ?? p.badges ?? []} />;
  }

  if (kind === "file-tree" || kind === "filetree") {
    return <TkDocFileTree payload={p} commits={commits} />;
  }

  if (kind === "timeline" || kind === "metrics-timeline") {
    return <TkDocTimeline payload={p} />;
  }

  if (kind === "accordion") {
    const lang = String(p.language ?? "sql").toLowerCase();
    const code = String(p.code ?? "");
    const inner = code && !isDisallowedTkCodeLanguage(lang)
      ? <CodeBlock code={code} language={tkCodeLanguageForRender(lang)} />
      : code
        ? <MdBody text={TK_CODE_OMITTED_NOTE} />
        : <Box dangerouslySetInnerHTML={{ __html: inlineMdWeb(String(p.html ?? "")) }} />;

    return (
      <Accordion disableGutters variant="outlined" sx={{ my: 1, borderRadius: TK_DOC_RADIUS, "&:before": { display: "none" } }}>
        <AccordionSummary expandIcon={<Icon icon="mdi:chevron-down" size={20} />}>
          <Typography variant="subtitle2" fontWeight={600}>{p.title ?? "Detalle"}</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 0 }}>{inner}</AccordionDetails>
      </Accordion>
    );
  }

  if (kind === "cambio-bd" || kind === "cambios_bd") {
    return (
      <Box>
        <Typography variant="body1" sx={{ mb: 1 }}>
          <strong>{p.tabla}</strong>
          {p.registro ? ` · ${p.registro}` : ""}
        </Typography>
        {p.intencion && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }} dangerouslySetInnerHTML={{ __html: inlineMdWeb(String(p.intencion)) }} />
        )}
        {p.sql && <CodeBlock code={p.sql} language="sql" />}
      </Box>
    );
  }

  return <CodeBlock code={JSON.stringify(p, null, 2)} language="json" />;
}
