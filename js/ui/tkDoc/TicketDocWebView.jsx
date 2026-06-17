/**
 * Driver JSX — presentación web del ticket (MUI, tema de la app).
 * Diseño libre: gradientes, glass, responsive. Paralelo a tkHtml.ts (correo).
 */
import { getMaterialUI } from "../../core/platform.ts";
import { inlineMdWeb } from "../tkHtml.ts";
import { ticketEstadoCierre } from "../tkHeroAuthors.ts";
import { extractTicketDocEvidencias, filterDocViewContentBlocks } from "../../core/tk-evidencias.ts";
import { shouldShowTkResumenPaper, normalizeTkDocBlocks } from "../../core/tk-doc-layout.ts";
import { TK_DOC_RADIUS } from "../../core/tk-table.ts";
import { TicketMetricsEvidencias } from "../TicketMetricsEvidencias.jsx";
import { SECTION_META } from "./constants.ts";
import { sortBlocks, groupImageBlocks, isInfoTiquete, sectionMetaForBlock, sectionTitleForBlock } from "./blockUtils.ts";
import { HeroHeader } from "./HeroHeader.jsx";
import { SectionCard } from "./SectionCard.jsx";
import { BlockBody } from "./BlockBody.jsx";
import { CommitsTable } from "./CommitsTable.jsx";
import { TimeSummary } from "./TimeSummary.jsx";

function renderBlockSection(b, key) {
  const kind = String(b.kind || "text").toLowerCase();
  const meta = sectionMetaForBlock(b);

  if (kind === "image-group") {
    const imgMeta = SECTION_META.image;
    const { Stack } = getMaterialUI();
    return (
      <SectionCard key={key} icon={imgMeta.icon} title={imgMeta.title} accent={imgMeta.accent}>
        <Stack spacing={2.5}>
          {(b.blocks || []).map((img, idx) => (
            <BlockBody key={idx} block={img} />
          ))}
        </Stack>
      </SectionCard>
    );
  }

  const title = sectionTitleForBlock(b, meta);
  return (
    <SectionCard key={key} icon={meta.icon} title={title} accent={meta.accent}>
      <BlockBody block={b} />
    </SectionCard>
  );
}

export function TicketDocWebView({ tk }) {
  const { Box, Paper, Typography } = getMaterialUI();

  if (!tk) return null;

  const space = String(tk.space ?? "").toUpperCase() || "PATYIA";
  const iticket = String(tk.iticket ?? "");
  const tiempos = (tk.tiempos || [])
    .map((t) => ({ name: String(t.name ?? ""), detail: String(t.detail ?? ""), minutos: Math.round(Number(t.minutos ?? 0)) }))
    .filter((t) => t.name && t.minutos > 0);

  const content = sortBlocks(tk.content).filter((b) => !isInfoTiquete(b, tk));
  const badges = content.filter((b) => ["badge", "chip"].includes(String(b.kind).toLowerCase()));
  const docEvidencias = extractTicketDocEvidencias(tk);
  const blocks = filterDocViewContentBlocks(
    normalizeTkDocBlocks(tk, content).filter((b) => !["badge", "chip"].includes(String(b.kind).toLowerCase())),
  );
  const showResumenPaper = shouldShowTkResumenPaper(tk, content);
  const contexts = tk.contexts || [];
  const allCommits = [...contexts.flatMap((c) => c.commits || []), ...(tk.rootCommits || [])];
  const estadoCierre = ticketEstadoCierre(tk);

  return (
    <Box className="tk-doc-markdown" sx={{ maxWidth: 920, mx: "auto", width: "100%" }}>
      <HeroHeader tk={tk} space={space} iticket={iticket} badges={badges} />

      {showResumenPaper && tk.resumen && (
        <Paper
          elevation={0}
          sx={{
            mb: 2.5,
            p: { xs: 2, sm: 2.5 },
            borderRadius: TK_DOC_RADIUS,
            border: 1,
            borderColor: "divider",
            background: (t) =>
              t.palette.mode === "dark"
                ? "linear-gradient(145deg, rgba(30,41,59,0.6), rgba(15,23,42,0.8))"
                : "linear-gradient(145deg, #ffffff, #f0f7ff)",
            boxShadow: (t) => (t.palette.mode === "dark" ? "none" : "0 8px 32px rgba(30,144,255,0.08)"),
          }}
        >
          <Typography
            variant="body1"
            sx={{ lineHeight: 1.65 }}
            dangerouslySetInnerHTML={{ __html: inlineMdWeb(String(tk.resumen)) }}
          />
        </Paper>
      )}

      {groupImageBlocks(blocks).map((b, i) => renderBlockSection(b, i))}

      {docEvidencias.length > 0 && (
        <Box sx={{ mb: 2.5 }}>
          <TicketMetricsEvidencias items={docEvidencias} variant="doc" />
        </Box>
      )}

      {contexts.map((ctx, ci) =>
        groupImageBlocks(
          filterDocViewContentBlocks(
            sortBlocks(ctx.content).filter((b) => !isInfoTiquete(b, tk)),
          ),
        ).map((b, bi) => renderBlockSection(b, `ctx-${ci}-${bi}`)),
      )}

      {allCommits.length > 0 && (
        <SectionCard icon="mdi:source-commit" title={estadoCierre === "cerrado" ? "Commits que entregan la solución" : "Commits relacionados"} accent="#10b981">
          <CommitsTable commits={allCommits} />
        </SectionCard>
      )}

      {tiempos.length > 0 && (
        <SectionCard icon="mdi:clock-outline" title="Resumen de tiempos" accent="#f59e0b">
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Distribución del esfuerzo según la naturaleza del trabajo.
          </Typography>
          <TimeSummary tiempos={tiempos} />
        </SectionCard>
      )}
    </Box>
  );
}
