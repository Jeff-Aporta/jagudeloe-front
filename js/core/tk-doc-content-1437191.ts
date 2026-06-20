/**
 * Bloques TK_CONTENT + commits para TK-1437191 — puente front hasta re-seed BD.
 * Mantener sync con backend-tks/scripts/lib/tk-content-1437191.mjs
 */

const R2 = "https://pub-1c290cc606c8478899f5764899278571.r2.dev/patyia/diligencias";

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
    minutos: 111,
    sortKey: 1,
    phase: "commits",
  },
  {
    name: "Diligencia del ticket",
    detail: "documentación TK-1437191 · evidencias problema + métricas InSoft (200 min)",
    minutos: 54,
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
        "**Culminado y entregado.** Se restableció el vínculo entre **`mensajesCalificados`** y el hilo **`mensajesOpenAI`** usando el identificador interno **`imensaje`** (slot del turno en `CONVERSACION_LOG`), con **`fecha_hora`** visible en cada mensaje del hilo. La calificación 👍/👎 queda asociada al mensaje concreto de Paty que el usuario evaluó.",
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
        "El cruce con **`mensajesCalificados`** dependía de **`ireferencia`**, que en producción llegaba en **0** y no identificaba el turno Paty que el usuario calificó. **`imensaje`** (slot del turno en el log) **no se devolvía** de forma estable en el hilo, en **POST `/api/mensaje`** ni en el evento SSE **`end`**, por lo que la UI no podía anclar 👍/👎 al mensaje correcto.\n\n" +
        "En base de datos, la clave de calificaciones **no estaba alineada** al par **`(imensaje, iconversacion)`** que exige el contrato API.",
    },
  },
  {
    kind: "markdown",
    sortKey: 4,
    payload: {
      title: "Solución aplicada",
      text:
        "| Aspecto | Antes | Después |\n| --- | --- | --- |\n| Identificador | `ireferencia` / fechas inconsistentes | **`imensaje`** + **`iconversacion`** (PK compuesta) |\n| Hilo OpenAI | `fecha_hora` vacío | Epoch desde `created_at` / meta del log |\n| POST calificar | Sin validación de pertenencia | Solo **`imensaje`** de asistente existente en el log |\n| GET conversación | Calificaciones sueltas | **`attachCalificadosToMensajesOpenAI`** cruza por par |\n| Stream SSE | Sin slot para UI | Evento **`end`** incluye **`imensaje`** del turno |",
    },
  },
  {
    kind: "markdown",
    sortKey: 5,
    payload: {
      title: "Flujo funcional",
      text:
        "1. El usuario envía un turno → el backend persiste **`CONVERSACION_LOG`** y asigna **`imensaje`** al slot del asistente.\n" +
        "2. **GET `/api/conversacion/{id}`** devuelve `mensajesOpenAI[]` con **`fecha_hora`**, **`mensaje`** e **`imensaje`** en respuestas Paty.\n" +
        "3. La UI envía **POST `/api/mensaje`** con `{ iconversacion, imensaje, butil, contenido }`.\n" +
        "4. El servidor valida que **`imensaje`** exista en el log de la conversación y que no esté duplicado.\n" +
        "5. Al reconsultar la conversación, la calificación queda enlazada al mensaje correcto del hilo.",
    },
  },
  {
    kind: "table",
    sortKey: 6,
    payload: {
      title: "Archivos modificados (ISS-AyudasCPIA)",
      headers: ["Ruta", "Rol"],
      rows: [
        ["schema/migrations/001-mensajescalificados-pk-composite.sql", "PK (imensaje, iconversacion)"],
        ["src/lib/logs/UlMetrics.ts", "imensaje, fecha_hora, cruce calificados"],
        ["src/lib/controller/010-conversacion/010 - ConversacionesServer.ts", "Enriquecimiento GET conversación"],
        ["src/lib/controller/010-conversacion/020 - MensajesCalificadosServer.ts", "Validación POST calificar"],
        ["src/lib/controller/000-core/005 - OpenIAServer.ts", "imensaje en stream end"],
        ["src/lib/constants/UlConst.ts", "Contrato MensajeOpenAI"],
        ["src/lib/model/010-conversacion/020 - TMensaje.ts", "Modelo calificado sin ireferencia"],
      ],
    },
  },
  {
    kind: "file-tree",
    sortKey: 7,
    payload: {
      title: "Árbol de cambios",
      paths: [
        "schema/migrations/001-mensajescalificados-pk-composite.sql",
        "src/lib/logs/UlMetrics.ts",
        "src/lib/controller/010-conversacion/010 - ConversacionesServer.ts",
        "src/lib/controller/010-conversacion/020 - MensajesCalificadosServer.ts",
        "src/lib/controller/000-core/005 - OpenIAServer.ts",
        "src/lib/constants/UlConst.ts",
        "src/lib/model/010-conversacion/020 - TMensaje.ts",
      ],
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
    kind: "markdown",
    sortKey: 9,
    payload: {
      title: "Cómo probar",
      text:
        "1. Crear conversación en staging y anotar **`imensaje`** del evento SSE **`end`**.\n" +
        "2. **GET conversación** → verificar **`fecha_hora`** e **`imensaje`** en mensajes del asistente.\n" +
        "3. **POST `/api/mensaje`** con ese **`imensaje`** → respuesta OK.\n" +
        "4. Repetir POST con el mismo par → debe rechazar duplicado.\n" +
        "5. **GET conversación** → el mensaje calificado coincide con el turno Paty evaluado.",
    },
  },
  {
    kind: "markdown",
    sortKey: 10,
    payload: {
      title: "Migración base de datos",
      text:
        "Script **`001-mensajescalificados-pk-composite.sql`**: PK compuesta **`(IMENSAJE, ICONVERSACION)`** en `MENSAJESCALIFICADOS`, alineada con el contrato API y Postman.",
    },
  },
  {
    kind: "markdown",
    sortKey: 11,
    payload: {
      title: "Métricas InSoft (200 min)",
      text:
        "Tiempo registrado en el sistema de tickets: **200 minutos** (~3 h 20 min). Timeline: apertura **11/jun** · inicio atención **12/jun 12:31** · solucionado **19/jun 21:26**. Desglose jagudeloe: 35 min investigación + 111 min implementación + 54 min diligencia.",
    },
  },
  {
    kind: "image",
    sortKey: 12,
    payload: {
      url: `${R2}/tk1437191-metricas-insoft.png`,
      alt: "Métricas InSoft TK-1437191 — 200 min",
      caption:
        "InSoft TK-1437191 — timeline del ticket (apertura, inicio atención y cierre Solucionado) · **200 min** registrados.",
    },
  },
];

const CONTENT_MARKER = "tk1437191-problemafecha-insoft.png";

export function needsTk1437191ContentPatch(content: unknown[]): boolean {
  if (!Array.isArray(content) || content.length === 0) return true;
  let hasProblemaImg = false;
  let hasCausa = false;
  for (const block of content) {
    if (!block || typeof block !== "object") continue;
    const p = ((block as Record<string, unknown>).payload || {}) as Record<string, unknown>;
    if (String(p.url ?? p.src ?? "").includes(CONTENT_MARKER)) hasProblemaImg = true;
    if (/causa del problema/i.test(String(p.title ?? ""))) hasCausa = true;
  }
  return !hasProblemaImg || !hasCausa;
}

export function mergeTk1437191Content(content: unknown[]): unknown[] {
  if (needsTk1437191ContentPatch(content)) return [...TK1437191_CONTENT];
  return content;
}
