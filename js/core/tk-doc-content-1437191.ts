/**
 * Bloques TK_CONTENT + commits para TK-1437191 — puente front hasta re-seed BD.
 * Mantener sync con backend-tks/scripts/lib/tk-content-1437191.mjs
 */

import { tk1437191StepperSpec } from "./tk-stepper.ts";
import { tk1437191FileTreeSpec } from "./tk-file-tree.ts";
import { tableBlockPayload, tk1437191ArchivosTableSpec, tk1437191SolucionTableSpec } from "./tk-doc-table.ts";
import { markdownTextIsTableOnly } from "./tk-markdown.ts";
import { withDocLane, TK_DOC_LANES } from "./tk-doc-interpreter.ts";

const R2 = "https://pub-1c290cc606c8478899f5764899278571.r2.dev/patyia/diligencias";

/** Migración PK compuesta MENSAJESCALIFICADOS (ISS-AyudasCPIA · commit 23121c3). */
export const TK1437191_MIGRATION_SQL = `SET NOCOUNT ON;

DECLARE @pk sysname;
SELECT @pk = kc.name
FROM sys.key_constraints kc
INNER JOIN sys.tables t ON t.object_id = kc.parent_object_id
WHERE kc.[type] = 'PK'
  AND t.[name] = N'MENSAJESCALIFICADOS'
  AND SCHEMA_NAME(t.[schema_id]) = N'dbo';

IF @pk IS NOT NULL
BEGIN
    DECLARE @dropPk nvarchar(300) = N'ALTER TABLE dbo.MENSAJESCALIFICADOS DROP CONSTRAINT ' + QUOTENAME(@pk);
    EXEC sp_executesql @dropPk;
END;

IF NOT EXISTS (
    SELECT 1
    FROM sys.key_constraints kc
    INNER JOIN sys.tables t ON t.object_id = kc.parent_object_id
    WHERE kc.[type] = 'PK'
      AND t.[name] = N'MENSAJESCALIFICADOS'
      AND SCHEMA_NAME(t.[schema_id]) = N'dbo'
)
BEGIN
    ALTER TABLE dbo.MENSAJESCALIFICADOS
    ADD CONSTRAINT PK_MENSAJESCALIFICADOS PRIMARY KEY (IMENSAJE, ICONVERSACION);
END;

IF NOT EXISTS (
    SELECT 1 FROM sys.foreign_keys WHERE [name] = N'FK_MENSAJESCALIFICADOS_CONVERSACIONES'
)
BEGIN
    ALTER TABLE dbo.MENSAJESCALIFICADOS
    ADD CONSTRAINT FK_MENSAJESCALIFICADOS_CONVERSACIONES
        FOREIGN KEY (ICONVERSACION) REFERENCES dbo.CONVERSACIONES (ICONVERSACION);
END;`;

export const TK1437191_COMMITS = [
  {
    hash: "d4b2bfc",
    proyecto: "PatyIA",
    tkRef: "TK-1437191",
    descripcion: "feat: Se expuso imensaje e ireferencia en mensajesOpenAI",
    insCount: 108,
    delCount: 4,
    minutos: 15,
    sortKey: 0,
    meta: { fecha: "2026-06-16T17:15:21-05:00", repo: "ISS-AyudasCPIA" },
  },
  {
    hash: "3358255",
    proyecto: "PatyIA",
    tkRef: "TK-1437191",
    descripcion: "feat: Se cruzó imensaje calificado en GET conversación",
    insCount: 2,
    delCount: 1,
    minutos: 8,
    sortKey: 1,
    meta: { fecha: "2026-06-16T17:15:21-05:00", repo: "ISS-AyudasCPIA" },
  },
  {
    hash: "ee46028",
    proyecto: "PatyIA",
    tkRef: "TK-1437191",
    descripcion: "fix: Se eliminó ireferencia del modelo de mensaje calificado",
    insCount: 0,
    delCount: 2,
    minutos: 3,
    sortKey: 2,
    meta: { fecha: "2026-06-17T17:09:01-05:00", repo: "ISS-AyudasCPIA" },
  },
  {
    hash: "4363ae3",
    proyecto: "PatyIA",
    tkRef: "TK-1437191",
    descripcion: "fix: Se unificó imensaje en MensajeOpenAI sin ireferencia",
    insCount: 1,
    delCount: 3,
    minutos: 3,
    sortKey: 3,
    meta: { fecha: "2026-06-17T17:09:01-05:00", repo: "ISS-AyudasCPIA" },
  },
  {
    hash: "0969a9a",
    proyecto: "PatyIA",
    tkRef: "TK-1437191",
    descripcion: "fix: Se alineó imensaje del hilo con mensajes calificados",
    insCount: 22,
    delCount: 22,
    minutos: 8,
    sortKey: 4,
    meta: { fecha: "2026-06-17T17:09:02-05:00", repo: "ISS-AyudasCPIA" },
  },
  {
    hash: "404d128",
    proyecto: "PatyIA",
    tkRef: "TK-1437191",
    descripcion: "fix: Se validó imensaje al calificar mensajes de conversación",
    insCount: 31,
    delCount: 4,
    minutos: 10,
    sortKey: 5,
    meta: { fecha: "2026-06-17T17:09:02-05:00", repo: "ISS-AyudasCPIA" },
  },
  {
    hash: "e9c116a",
    proyecto: "PatyIA",
    tkRef: "TK-1437191",
    descripcion: "fix: Se omitió ireferencia en mensajes calificados de la respuesta",
    insCount: 6,
    delCount: 1,
    minutos: 4,
    sortKey: 6,
    meta: { fecha: "2026-06-17T17:09:25-05:00", repo: "ISS-AyudasCPIA" },
  },
  {
    hash: "23121c3",
    proyecto: "PatyIA",
    tkRef: "TK-1437191",
    descripcion: "feat: Se añadió migración de PK compuesta en mensajes calificados",
    insCount: 49,
    delCount: 0,
    minutos: 20,
    sortKey: 7,
    meta: { fecha: "2026-06-18T11:41:17-05:00", repo: "ISS-AyudasCPIA" },
  },
  {
    hash: "4eabff6",
    proyecto: "PatyIA",
    tkRef: "TK-1437191",
    descripcion: "fix: Se documentó la clave compuesta imensaje e iconversacion en calificaciones",
    insCount: 1,
    delCount: 1,
    minutos: 5,
    sortKey: 8,
    meta: { fecha: "2026-06-18T11:41:17-05:00", repo: "ISS-AyudasCPIA" },
  },
  {
    hash: "70a0351",
    proyecto: "PatyIA",
    tkRef: "TK-1437191",
    descripcion: "feat: Se devolvió imensaje al persistir turno y cruce por conversación",
    insCount: 21,
    delCount: 6,
    minutos: 12,
    sortKey: 9,
    meta: { fecha: "2026-06-18T11:41:17-05:00", repo: "ISS-AyudasCPIA" },
  },
  {
    hash: "d369e5d",
    proyecto: "PatyIA",
    tkRef: "TK-1437191",
    descripcion: "feat: Se expuso imensaje en el evento end del stream de conversación",
    insCount: 10,
    delCount: 7,
    minutos: 8,
    sortKey: 10,
    meta: { fecha: "2026-06-18T11:41:18-05:00", repo: "ISS-AyudasCPIA" },
  },
  {
    hash: "543c174",
    proyecto: "PatyIA",
    tkRef: "TK-1437191",
    descripcion: "feat: Se habilitó calificar mensajes por par imensaje e iconversacion",
    insCount: 25,
    delCount: 8,
    minutos: 15,
    sortKey: 11,
    meta: { fecha: "2026-06-18T11:41:18-05:00", repo: "ISS-AyudasCPIA" },
  },
] as const;

export const TK1437191_TIEMPOS = [
  {
    name: "Análisis vínculo calificados ↔ hilo",
    detail: "ISS-AyudasCPIA · CONVERSACION_LOG + mensajesOpenAI · conv. 2173",
    minutos: 35,
    sortKey: 0,
    phase: "investigacion",
  },
  {
    name: "Implementación ISS-AyudasCPIA",
    detail: "12 commits · imensaje + PK compuesta + validación POST /api/mensaje",
    minutos: 110,
    sortKey: 1,
    phase: "commits",
  },
  {
    name: "Diligencia del ticket",
    detail: "documentación TK-1437191 · evidencias problema + métricas InSoft (200 min)",
    minutos: 55,
    sortKey: 2,
    phase: "diligencia",
  },
] as const;

export const TK1437191_CONTENT: Record<string, unknown>[] = [
  {
    kind: "markdown",
    sortKey: 0,
    payload: {
      text:
        "**Culminado y entregado.** Se restableció el vínculo entre **`mensajesCalificados`** y el hilo **`mensajesOpenAI`** usando el identificador interno **`imensaje`** (slot del turno en `CONVERSACION_LOG`), con **`fecha_hora`** visible en cada mensaje del hilo. La calificación {{thumb-up}}/{{thumb-down}} queda asociada al mensaje concreto de Paty que el usuario evaluó.",
    },
  },
  {
    kind: "badge",
    sortKey: 1,
    payload: { label: "Solucionado · imensaje + iconversacion", tone: "success" },
  },
  {
    kind: "markdown",
    sortKey: 2,
    payload: {
      title: "Solicitud InSoft (TK-1437191)",
      text:
        "No existía forma de relacionar un mensaje calificado con su entrada en `mensajesOpenAI`. Antes se intentaba por fechas, pero **`fecha_hora`** llegaba vacío al consultar la conversación.",
    },
  },
  {
    kind: "image",
    sortKey: 3,
    payload: {
      url: `${R2}/tk1437191-solicitud-insoft.png`,
      alt: "Solicitud InSoft TK-1437191",
      caption: "Solicitud InSoft · ticket 1437191 (Viviana Restrepo).",
    },
  },
  {
    kind: "markdown",
    sortKey: 3.5,
    payload: {
      title: "Evidencia del problema (conv. 2173)",
      text:
        "Antes del fix, **GET `/api/conversacion/2173`** mostraba:\n" +
        "- **`mensajesOpenAI[].fecha_hora`** vacío (`\"\"`) pese a existir `meta.ts` en el log del asistente.\n" +
        "- **`mensajesCalificados`** con **`ireferencia: 0`** sin vínculo usable al hilo (`imensaje: 188`, `iconversacion: 2173`).",
    },
  },
  {
    kind: "image",
    sortKey: 3.6,
    payload: {
      url: `${R2}/tk1437191-problemafecha-insoft.png`,
      alt: "mensajesOpenAI fecha_hora vacío conv 2173",
      caption:
        "GET conversación 2173 — `fecha_hora` vacío en Usuario y Asistente; timestamp solo en `meta.ts` del asistente.",
    },
  },
  {
    kind: "image",
    sortKey: 3.7,
    payload: {
      url: `${R2}/tk1437191-problemaireferencia-insoft.png`,
      alt: "mensajesCalificados ireferencia 0 conv 2173",
      caption:
        "GET conversación 2173 — calificación con `ireferencia: 0`, `imensaje: 188` y `butil: false` sin cruce al hilo.",
    },
  },
  {
    kind: "markdown",
    sortKey: 3.8,
    payload: {
      title: "Causa del problema",
      text:
        "Al reconstruir el hilo en **GET `/api/conversacion`**, el backend **no propagaba `fecha_hora`** en `mensajesOpenAI` (llegaba `\"\"`) aunque en `CONVERSACION_LOG` del asistente sí existía `meta.ts` con timestamp.\n\n" +
        "El cruce con **`mensajesCalificados`** dependía de **`ireferencia`**, que en producción llegaba en **0** y no identificaba el turno Paty que el usuario calificó. **`imensaje`** (slot del turno en el log) **no se devolvía** de forma estable en el hilo, en **POST `/api/mensaje`** ni en el evento SSE **`end`**, por lo que la UI no podía anclar {{thumb-up}}/{{thumb-down}} al mensaje correcto.\n\n" +
        "En base de datos, la clave de calificaciones **no estaba alineada** al par **`(imensaje, iconversacion)`** que exige el contrato API.",
    },
  },
  {
    kind: "table",
    sortKey: 4,
    payload: withDocLane(TK_DOC_LANES.SOLUCION, tableBlockPayload(tk1437191SolucionTableSpec())),
  },
  {
    kind: "sequence",
    sortKey: 5,
    payload: {
      title: "Diagrama de secuencia",
      preset: "tk1437191",
      caption: "Turno → log → GET conversación → calificar → validar → enlace en el hilo",
    },
  },
  {
    kind: "table",
    sortKey: 6,
    payload: tableBlockPayload(tk1437191ArchivosTableSpec()),
  },
  {
    kind: "file-tree",
    sortKey: 7,
    payload: {
      title: "Árbol de cambios",
      ...tk1437191FileTreeSpec(),
    },
  },
  {
    kind: "code",
    sortKey: 8,
    payload: {
      language: "json",
      title: "Contrato resultante (extracto)",
      code:
        '{\n  "mensajesOpenAI": [\n    { "fecha_hora": 1757081809, "autor": "Usuario", "mensaje": "…" },\n    { "fecha_hora": 1757081812, "autor": "Asistente", "mensaje": "…", "imensaje": 42 }\n  ],\n  "mensajesCalificados": [\n    { "imensaje": 42, "iconversacion": 99, "butil": true, "contenido": "…" }\n  ]\n}',
    },
  },
  {
    kind: "mui-stepper",
    sortKey: 9,
    payload: {
      title: "Cómo probar",
      stepper: tk1437191StepperSpec(),
    },
  },
  {
    kind: "code",
    sortKey: 10,
    payload: {
      title: "Migración base de datos",
      language: "sql",
      intro:
        "PK compuesta **(IMENSAJE, ICONVERSACION)** en `MENSAJESCALIFICADOS`, alineada con el contrato API y Postman.",
      code: TK1437191_MIGRATION_SQL,
    },
  },
];

const CONTENT_MARKER = "tk1437191-problemafecha-insoft.png";

export function needsTk1437191ContentPatch(content: unknown[]): boolean {
  if (!Array.isArray(content) || content.length === 0) return true;
  let hasProblemaImg = false;
  let hasCausa = false;
  let hasSequence = false;
  let hasStepper = false;
  let hasFileTree = false;
  let hasSolucionTable = false;
  let hasArchivosTable = false;
  let hasLegacyMarkdownTable = false;
  let hasMigrationSql = false;
  let hasLegacyMigrationMarkdown = false;
  let hasLegacyMetricasInContent = false;
  let hasLegacyThumbEmojis = false;
  let sequenceMissingLog = false;
  let sequenceMissingDesc = false;
  let hasDocLanes = false;
  let hasTimeline = false;
  for (const block of content) {
    if (!block || typeof block !== "object") continue;
    const b = block as Record<string, unknown>;
    const p = (b.payload || {}) as Record<string, unknown>;
    if (String(p.url ?? p.src ?? "").includes(CONTENT_MARKER)) hasProblemaImg = true;
    if (String(p.url ?? p.src ?? "").includes("tk1437191-metricas-insoft.png")) hasLegacyMetricasInContent = true;
    if (/causa del problema/i.test(String(p.title ?? ""))) hasCausa = true;
    if (String(b.kind ?? "").toLowerCase() === "sequence") {
      if (String(p.preset ?? "") === "tk1437191") hasSequence = true;
      else {
        const seq = p.sequence as Record<string, unknown> | undefined;
        hasSequence = Array.isArray(seq?.actors) && (seq.actors as unknown[]).length > 0;
        const msgs = (seq?.messages as Record<string, unknown>[]) ?? [];
        if (msgs.length > 0) {
          if (msgs.some((m) => !String(m?.log ?? "").trim())) sequenceMissingLog = true;
          if (msgs.some((m) => !String(m?.desc ?? m?.description ?? "").trim())) sequenceMissingDesc = true;
        }
      }
    }
    if (String(b.kind ?? "").toLowerCase() === "flow") {
      if (String(p.preset ?? "") === "tk1437191") hasSequence = true;
    }
    if (String(b.kind ?? "").toLowerCase() === "mui-stepper") {
      hasStepper = String(p.preset ?? "") === "tk1437191" || !!p.stepper;
    }
    if (String(b.kind ?? "").toLowerCase() === "file-tree") {
      if (String(p.preset ?? "") === "tk1437191") hasFileTree = true;
      else {
        const tree = p.tree ?? (p.fileTree as Record<string, unknown> | undefined)?.tree;
        hasFileTree = Array.isArray(tree) && tree.length > 0;
      }
    }
    const kind = String(b.kind ?? "").toLowerCase();
    if (kind === "markdown" || kind === "md" || kind === "text") {
      const text = String(p.text ?? p.body ?? "");
      if (markdownTextIsTableOnly(text)) hasLegacyMarkdownTable = true;
      if (/migraci[oó]n base de datos/i.test(String(p.title ?? "")) && /\.sql/i.test(text)) {
        hasLegacyMigrationMarkdown = true;
      }
      if (/m[eé]tricas insoft/i.test(String(p.title ?? ""))) hasLegacyMetricasInContent = true;
      if (text.includes("👍") || text.includes("👎")) hasLegacyThumbEmojis = true;
    }
    if ((kind === "code" || kind === "sql") && /migraci[oó]n base de datos/i.test(String(p.title ?? ""))) {
      const code = String(p.code ?? p.sql ?? "");
      if (code.includes("MENSAJESCALIFICADOS") && code.includes("PRIMARY KEY")) hasMigrationSql = true;
    }
    if (kind === "table") {
      const table = p.table as Record<string, unknown> | undefined;
      const hasMatrix = Array.isArray(table?.matrix) && (table.matrix as unknown[]).length >= 2;
      const hasLegacyRows = Array.isArray(table?.rows) && (table.rows as unknown[]).length > 0;
      const lane = String(p.docLane ?? p.section ?? p.lane ?? "").toLowerCase();
      if (String(p.preset ?? "") === "tk1437191-archivos" || /archivos modificados/i.test(String(p.title ?? table?.title ?? ""))) {
        hasArchivosTable = hasMatrix || hasLegacyRows;
      } else if (lane === "solucion" || /aspecto/i.test(String((table?.matrix as unknown[][])?.[0]?.[0] ?? ""))) {
        hasSolucionTable = hasMatrix || hasLegacyRows;
      } else if (hasMatrix || hasLegacyRows) {
        hasArchivosTable = true;
      }
    }
    if (p.docLane || p.section || p.lane) hasDocLanes = true;
    if (String(b.kind ?? "").toLowerCase() === "timeline") {
      const tl = p.timeline as Record<string, unknown> | undefined;
      hasTimeline = Array.isArray(tl?.milestones) && (tl.milestones as unknown[]).length > 0;
    }
  }
  return (
    !hasProblemaImg ||
    !hasCausa ||
    !hasSequence ||
    !hasStepper ||
    !hasFileTree ||
    !hasSolucionTable ||
    !hasArchivosTable ||
    hasLegacyMarkdownTable ||
    hasLegacyMigrationMarkdown ||
    hasLegacyMetricasInContent ||
    hasLegacyThumbEmojis ||
    sequenceMissingLog ||
    sequenceMissingDesc ||
    !hasMigrationSql ||
    !hasDocLanes ||
    !hasTimeline
  );
}

export function mergeTk1437191Content(content: unknown[]): unknown[] {
  if (needsTk1437191ContentPatch(content)) return [...TK1437191_CONTENT];
  return content;
}
