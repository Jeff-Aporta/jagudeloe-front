/**
 * Driver JSX — presentación web del ticket (MUI, tema de la app).
 * Layout estándar: solicitud → evidencias → causa → verificación → solución → otros → commits → tiempos.
 */

import { getReact, getMaterialUI } from "../../core/platform.ts";
import { ticketEstadoCierre } from "../tkHeroAuthors.ts";
import { buildTkDocViewModel } from "../../core/tk-doc-view-model.ts";
import { isStandardMappedTitle, blockPayloadTitle } from "../../core/tk-doc-sections.ts";
import { tkDocScrollRoot } from "../../core/tk-doc-scroll.ts";
import { TicketMetricsEvidencias } from "../TicketMetricsEvidencias.jsx";
import { patchTicketDoc } from "../../api/client.ts";
import {
  contentForApi,
  docJsonBlocksForCard,
  docJsonBlocksFromTicket,
  mergeDocContentBlocks,
} from "../../core/tk-doc-persist.ts";
import { docJsonBlocksForStandardSection } from "../../core/tk-doc-section-blocks.ts";
import { SECTION_META, TK_DOC_STANDARD } from "./constants.ts";
import {
  sortBlocks,
  groupImageBlocks,
  imageBlocksToGalleryItems,
  isImageBlock,
  isInfoTiquete,
  sectionMetaForBlock,
  sectionTitleForBlock,
} from "./blockUtils.ts";
import { HeroHeader } from "./HeroHeader.jsx";
import { TkHeroEditButton } from "./TkHeroEditDialog.jsx";
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

export function TicketDocWebView({ tk, project, onTicketUpdated }) {
  const { useState, useCallback, useMemo, useEffect } = getReact();
  const { Box, Stack } = getMaterialUI();
  const [docSaving, setDocSaving] = useState(false);
  const [activeSectionKey, setActiveSectionKey] = useState(null);

  const allDocBlocks = useMemo(() => docJsonBlocksFromTicket(tk ?? {}), [tk]);

  const editableDocBlocks = useMemo(
    () => allDocBlocks.filter((b) => !isInfoTiquete(b, tk ?? {})),
    [allDocBlocks, tk],
  );

  const solicitudJsonBlocks = useMemo(
    () => docJsonBlocksForStandardSection(editableDocBlocks, "solicitud"),
    [editableDocBlocks],
  );

  const evidenciasJsonBlocks = useMemo(
    () => docJsonBlocksForStandardSection(editableDocBlocks, "evidencias"),
    [editableDocBlocks],
  );

  const saveDocSection = useCallback(
    async (sectionBlocks, edited) => {
      const space = String(project || tk?.space || "patyia").toLowerCase();
      const iticket = String(tk?.iticket ?? "");
      if (!iticket) throw new Error("iticket requerido");

      setDocSaving(true);
      try {
        const merged = mergeDocContentBlocks(allDocBlocks, sectionBlocks, edited);
        const res = await patchTicketDoc(space, iticket, contentForApi(merged));
        if (!res?.ticket) throw new Error("Respuesta inválida del worker");
        onTicketUpdated?.(res.ticket);
      } finally {
        setDocSaving(false);
      }
    },
    [allDocBlocks, onTicketUpdated, project, tk?.iticket, tk?.space],
  );

  const makeDocSaveHandler = useCallback(
    (sectionBlocks) => (edited) => saveDocSection(sectionBlocks, edited),
    [saveDocSection],
  );

  const vm = useMemo(() => {
    if (!tk) return null;
    return buildTkDocViewModel(tk, {
      sortBlocks,
      isInfoTiquete,
      ticketEstadoCierre,
    });
  }, [tk]);

  const sectionPresence = vm?.sectionPresence;

  useEffect(() => {
    if (!vm) return undefined;
    const root = tkDocScrollRoot();
    if (!root) return undefined;

    const observe = () => {
      const nodes = root.querySelectorAll("[data-tk-doc-section]");
      if (!nodes.length) return null;

      const observer = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((e) => e.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
          const top = visible[0]?.target.getAttribute("data-tk-doc-section");
          if (top) setActiveSectionKey(top);
        },
        { root, rootMargin: "-12% 0px -58% 0px", threshold: [0, 0.15, 0.35, 0.55] },
      );

      nodes.forEach((node) => observer.observe(node));
      return observer;
    };

    let observer = observe();
    const retry = window.setTimeout(() => {
      observer?.disconnect();
      observer = observe();
    }, 120);

    return () => {
      window.clearTimeout(retry);
      observer?.disconnect();
    };
  }, [
    vm,
    sectionPresence?.solicitud,
    sectionPresence?.evidencias,
    sectionPresence?.causa,
    sectionPresence?.verificacion,
    sectionPresence?.solucion,
    sectionPresence?.commits,
    sectionPresence?.tiempos,
  ]);

  const onSectionClick = useCallback((key) => {
    setActiveSectionKey(key);
  }, []);

  if (!tk || !vm) return null;

  const space = String(tk.space ?? "").toUpperCase() || "PATYIA";
  const iticket = String(tk.iticket ?? "");
  const std = TK_DOC_STANDARD;
  const p = vm.sectionPresence;

  function renderStandardLane(blocks, meta, sectionKey, commits) {
    if (!blocks?.length) return null;
    const flatBlocks = blocks.flatMap((b) => docJsonBlocksForCard(b));

    return (
      <SectionCard
        sectionKey={sectionKey}
        icon={meta.icon}
        title={meta.title}
        accent={meta.accent}
        docJsonBlocks={flatBlocks}
        onDocJsonSave={makeDocSaveHandler(flatBlocks)}
        docJsonDisabled={docSaving}
      >
        {renderLaneBlocks(blocks, commits)}
      </SectionCard>
    );
  }

  function renderBlockSection(b, key, commits) {
    const payloadTitle = blockPayloadTitle(b);
    if (payloadTitle && isStandardMappedTitle(payloadTitle)) return null;

    const kind = String(b.kind || "text").toLowerCase();
    const meta = sectionMetaForBlock(b);
    const cardBlocks = docJsonBlocksForCard(b);

    if (kind === "image-group") {
      const imgMeta = SECTION_META.image;
      return (
        <SectionCard
          key={key}
          icon={imgMeta.icon}
          title={imgMeta.title}
          accent={imgMeta.accent}
          docJsonBlocks={cardBlocks}
          onDocJsonSave={makeDocSaveHandler(cardBlocks)}
          docJsonDisabled={docSaving}
        >
          {renderImageGallery(b.blocks, key)}
        </SectionCard>
      );
    }

    if (isImageBlock(b)) {
      const imgMeta = SECTION_META.image;
      return (
        <SectionCard
          key={key}
          icon={imgMeta.icon}
          title={imgMeta.title}
          accent={imgMeta.accent}
          docJsonBlocks={cardBlocks}
          onDocJsonSave={makeDocSaveHandler(cardBlocks)}
          docJsonDisabled={docSaving}
        >
          {renderImageGallery([b], key)}
        </SectionCard>
      );
    }

    const title = sectionTitleForBlock(b, meta);

    return (
      <SectionCard
        key={key}
        icon={meta.icon}
        title={title}
        accent={meta.accent}
        docJsonBlocks={cardBlocks}
        onDocJsonSave={makeDocSaveHandler(cardBlocks)}
        docJsonDisabled={docSaving}
      >
        <BlockBody block={b} commits={commits} />
      </SectionCard>
    );
  }

  return (
    <Box className="tk-doc-markdown" sx={{ maxWidth: 920, mx: "auto", width: "100%" }}>
      <HeroHeader
        tk={tk}
        space={space}
        iticket={iticket}
        badges={vm.badges}
        sectionDots={vm.sectionDots}
        activeSectionKey={activeSectionKey}
        onSectionClick={onSectionClick}
        editAction={
          <TkHeroEditButton
            tk={tk}
            project={project}
            disabled={docSaving}
            onSaved={onTicketUpdated}
          />
        }
      />

      {p.solicitud && (
        <SectionCard
          sectionKey="solicitud"
          icon={std.solicitud.icon}
          title={std.solicitud.title}
          accent={std.solicitud.accent}
          docJsonBlocks={solicitudJsonBlocks}
          onDocJsonSave={makeDocSaveHandler(solicitudJsonBlocks)}
          docJsonDisabled={docSaving}
        >
          <Stack spacing={2}>
            {vm.solicitudParts.map((text, i) => (
              <MdBody key={i} text={text} />
            ))}
          </Stack>
        </SectionCard>
      )}

      {p.evidencias && (
        <SectionCard
          sectionKey="evidencias"
          icon={std.evidencias.icon}
          title={std.evidencias.title}
          accent={std.evidencias.accent}
          docJsonBlocks={evidenciasJsonBlocks}
          onDocJsonSave={makeDocSaveHandler(evidenciasJsonBlocks)}
          docJsonDisabled={docSaving}
        >
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
