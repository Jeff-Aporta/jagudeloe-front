import { getMaterialUI } from "../../core/platform.ts";
import { UI } from "../../core/platform.ts";
import { inlineMdWeb, stripRedundantTicketHtml } from "../tkHtml.ts";
import { tkCodeLanguageForRender, TK_CODE_OMITTED_NOTE, isDisallowedTkCodeLanguage, tkCodeBlockIntro } from "../../core/tk-code-policy.ts";
import { tkLinkHref, tkLinkLabel, tkLinkShowsPath } from "../../core/tk-doc.ts";
import { isStandardMappedTitle } from "../../core/tk-doc-sections.ts";
import { TK_DOC_RADIUS } from "../../core/tk-table.ts";
import { LightboxImage } from "../ImageLightbox.jsx";
import { CodeBlock } from "../CodeBlock.jsx";
import { MdBody } from "./MdBody.jsx";
import { DataTable } from "./DataTable.jsx";
import { FileTree } from "./FileTree.jsx";
import { SoftBadges, tkDocSoftBadgeSx } from "./SoftBadges.jsx";
import { StepsBlock } from "./StepsBlock.jsx";

export function BlockBody({ block, commits }) {
  const { Box, Typography, Link, Accordion, AccordionSummary, AccordionDetails, Chip } = getMaterialUI();
  const { Icon } = UI;

  const kind = String(block.kind || "text").toLowerCase();
  const p = block.payload || {};

  if (kind === "markdown" || kind === "md" || kind === "text") {
    return <MdBody text={p.text ?? p.body ?? ""} />;
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
    const tableTitle = isStandardMappedTitle(String(p.title ?? "")) ? undefined : p.title;
    return <DataTable headers={p.headers} rows={p.rows} title={tableTitle} />;
  }

  if (kind === "image" || kind === "img") {
    const src = p.url ?? p.src ?? "";
    return (
      <Box sx={{ textAlign: "center", my: 1 }}>
        <LightboxImage
          src={src}
          alt={p.alt ?? p.caption ?? ""}
          caption={p.caption}
        />
        {p.caption && (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
            {p.caption}
          </Typography>
        )}
      </Box>
    );
  }

  if (kind === "url" || kind === "link") {
    const href = tkLinkHref(p);
    const label = tkLinkLabel(p, href);
    const showPath = tkLinkShowsPath(p);
    return (
      <Box>
        <Typography variant="body1">
          <Link href={href} target="_blank" rel="noreferrer" sx={{ fontWeight: 600 }}>
            {label}
          </Link>
        </Typography>
        {showPath && (
          <Typography
            variant="caption"
            component="div"
            sx={{ mt: 0.25, wordBreak: "break-all", fontFamily: "monospace", fontSize: "0.8rem", lineHeight: 1.45 }}
          >
            <Link href={href} target="_blank" rel="noreferrer" sx={{ color: "primary.main", fontWeight: 400, textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>
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

  if (kind === "badges" || kind === "badge-row") {
    return <SoftBadges items={p.items ?? p.badges ?? []} />;
  }

  if (kind === "file-tree" || kind === "filetree") {
    return (
      <FileTree
        paths={p.paths ?? p.files ?? []}
        rootLabel={p.rootLabel ?? p.root ?? "ISS"}
        hints={p.hints ?? p.notes}
        commits={commits}
        commitHash={p.commitHash ?? p.hash}
        commitProyecto={p.commitProyecto ?? p.proyecto}
      />
    );
  }

  if (kind === "accordion") {
    const lang = String(p.language ?? "sql").toLowerCase();
    const code = String(p.code ?? "");
    const inner = code && !isDisallowedTkCodeLanguage(lang)
      ? <CodeBlock code={code} language={tkCodeLanguageForRender(lang)} />
      : code
        ? <MdBody text={TK_CODE_OMITTED_NOTE} />
        : <Box dangerouslySetInnerHTML={{ __html: String(p.html ?? "") }} />;

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

  if (kind === "html" || kind === "body") {
    const cleaned = stripRedundantTicketHtml(String(p.html ?? p.body ?? p.content ?? ""));
    return <Box className="tk-doc-markdown tk-doc-legacy-html" sx={{ "& p": { mb: 1.25, lineHeight: 1.65 }, "& ul, & ol": { pl: 2.5, mb: 1.25 }, "& h3": { fontSize: "0.95rem", fontWeight: 700, mt: 2, mb: 0.75 } }} dangerouslySetInnerHTML={{ __html: cleaned }} />;
  }

  return <CodeBlock code={JSON.stringify(p, null, 2)} language="json" />;
}
