/**

 * Driver JSX — presentación web del ticket (MUI, tema de la app).

 * Layout estándar: solicitud → evidencias → causa → verificación → solución → otros → commits → tiempos.

 */

import { getMaterialUI } from "../../core/platform.ts";

import { ticketEstadoCierre } from "../tkHeroAuthors.ts";

import { buildTkDocViewModel } from "../../core/tk-doc-view-model.ts";

import { isStandardMappedTitle, blockPayloadTitle } from "../../core/tk-doc-sections.ts";

import { TicketMetricsEvidencias } from "../TicketMetricsEvidencias.jsx";

import { SECTION_META, TK_DOC_STANDARD } from "./constants.ts";

import { sortBlocks, groupImageBlocks, imageBlocksToGalleryItems, isImageBlock, isInfoTiquete, sectionMetaForBlock, sectionTitleForBlock } from "./blockUtils.ts";

import { HeroHeader } from "./HeroHeader.jsx";

import { SectionCard } from "./SectionCard.jsx";

import { BlockBody } from "./BlockBody.jsx";

import { MdBody } from "./MdBody.jsx";

import { CommitsTable } from "./CommitsTable.jsx";

import { TimeSummary } from "./TimeSummary.jsx";



function renderImageGallery(blocks, key) {
  const items = imageBlocksToGalleryItems(blocks);
  if (!items.length) return null;
  return <TicketMetricsEvidencias key={key} items={items} embedded />;
}

function renderLaneBlocks(blocks, commits) {
  const { Stack } = getMaterialUI();

  return (
    <Stack spacing={2.5}>
      {groupImageBlocks(blocks).map((b, i) => {
        const kind = String(b.kind || "").toLowerCase();

        if (kind === "image-group") {
          return renderImageGallery(b.blocks, i);
        }

        if (isImageBlock(b)) {
          return renderImageGallery([b], i);
        }

        return <BlockBody key={i} block={b} commits={commits} />;
      })}
    </Stack>
  );
}



function renderStandardLane(blocks, meta, sectionKey, commits) {

  if (!blocks?.length) return null;

  return (

    <SectionCard sectionKey={sectionKey} icon={meta.icon} title={meta.title} accent={meta.accent}>

      {renderLaneBlocks(blocks, commits)}

    </SectionCard>

  );

}



function renderBlockSection(b, key, commits) {

  const payloadTitle = blockPayloadTitle(b);

  if (payloadTitle && isStandardMappedTitle(payloadTitle)) return null;



  const kind = String(b.kind || "text").toLowerCase();

  const meta = sectionMetaForBlock(b);



  if (kind === "image-group") {
    const imgMeta = SECTION_META.image;
    return (
      <SectionCard key={key} icon={imgMeta.icon} title={imgMeta.title} accent={imgMeta.accent}>
        {renderImageGallery(b.blocks, key)}
      </SectionCard>
    );
  }

  if (isImageBlock(b)) {
    const imgMeta = SECTION_META.image;
    return (
      <SectionCard key={key} icon={imgMeta.icon} title={imgMeta.title} accent={imgMeta.accent}>
        {renderImageGallery([b], key)}
      </SectionCard>
    );
  }



  const title = sectionTitleForBlock(b, meta);

  return (

    <SectionCard key={key} icon={meta.icon} title={title} accent={meta.accent}>

      <BlockBody block={b} commits={commits} />

    </SectionCard>

  );

}



export function TicketDocWebView({ tk }) {

  const { Box, Stack, Typography } = getMaterialUI();



  if (!tk) return null;



  const space = String(tk.space ?? "").toUpperCase() || "PATYIA";

  const iticket = String(tk.iticket ?? "");

  const vm = buildTkDocViewModel(tk, {

    sortBlocks,

    isInfoTiquete,

    ticketEstadoCierre,

  });

  const std = TK_DOC_STANDARD;

  const p = vm.sectionPresence;



  return (

    <Box className="tk-doc-markdown" sx={{ maxWidth: 920, mx: "auto", width: "100%" }}>

      <HeroHeader

        tk={tk}

        space={space}

        iticket={iticket}

        badges={vm.badges}

        sectionDots={vm.sectionDots}

      />



      {p.solicitud && (

        <SectionCard sectionKey="solicitud" icon={std.solicitud.icon} title={std.solicitud.title} accent={std.solicitud.accent}>

          <Stack spacing={2}>

            {vm.solicitudParts.map((text, i) => (

              <MdBody key={i} text={text} />

            ))}

          </Stack>

        </SectionCard>

      )}



      {p.evidencias && (

        <SectionCard sectionKey="evidencias" icon={std.evidencias.icon} title={std.evidencias.title} accent={std.evidencias.accent}>

          {vm.evidenciaIntro && (

            <Box sx={{ mb: vm.docEvidencias.length ? 2 : 0 }}>

              <MdBody text={vm.evidenciaIntro} />

            </Box>

          )}

          {vm.docEvidencias.length > 0 && (

            <TicketMetricsEvidencias items={vm.docEvidencias} variant="doc" embedded />

          )}

        </SectionCard>

      )}



      {p.causa && renderStandardLane(vm.lanes.causa, std.causa, "causa", vm.allCommits)}

      {p.verificacion && renderStandardLane(vm.lanes.verificacion, std.verificacion, "verificacion", vm.allCommits)}

      {p.solucion && renderStandardLane(vm.lanes.solucion, std.solucion, "solucion", vm.allCommits)}



      {groupImageBlocks(vm.otrosBlocks)

        .map((b, i) => renderBlockSection(b, `otros-${i}`, vm.allCommits))

        .filter(Boolean)}



      {p.commits && (

        <SectionCard sectionKey="commits" icon={std.commits.icon} title={vm.commitsTitle} accent={std.commits.accent}>

          <CommitsTable commits={vm.allCommits} />

        </SectionCard>

      )}



      {p.tiempos && (
        <SectionCard sectionKey="tiempos" icon={std.tiempos.icon} title={std.tiempos.title} accent={std.tiempos.accent}>
          <TimeSummary tiempos={vm.tiempos} />
        </SectionCard>
      )}

    </Box>

  );

}

