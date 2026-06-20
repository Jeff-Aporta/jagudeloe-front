/**
 * Parche de commits/tiempos/contenido cuando la API aún no refleja el seed de BD.
 * Fuente canónica: backend-tks/scripts/lib/tk-content-*.mjs
 */

import {
  mergeTk1437191Content,
  needsTk1437191ContentPatch,
  TK1437191_COMMITS,
  TK1437191_TIEMPOS,
} from "./tk-doc-content-1437191.ts";
import {
  mergeTk1439155Content,
  needsTk1439155ContentPatch,
} from "./tk-doc-content-1439155.ts";

type TkCommitSeed = {
  hash: string;
  proyecto: string;
  tkRef: string;
  descripcion: string;
  insCount: number;
  delCount: number;
  minutos: number;
  sortKey: number;
  meta: { fecha: string; repo: string };
};

type TkTiempoSeed = {
  name: string;
  detail: string;
  minutos: number;
  sortKey: number;
  phase?: string;
};

type TkDocSeedOverride = {
  commits: TkCommitSeed[];
  tiempos: TkTiempoSeed[];
};

const TK1439155_COMMITS: TkCommitSeed[] = [
  {
    hash: "2df54c0",
    proyecto: "PatyIA",
    tkRef: "TK-1439155",
    descripcion: "feat: Se ignoró el archivo local de token de desarrollo",
    insCount: 1,
    delCount: 0,
    minutos: 2,
    sortKey: 0,
    meta: { fecha: "2026-06-17T17:08:52-05:00", repo: "ISS" },
  },
  {
    hash: "ee46028",
    proyecto: "PatyIA",
    tkRef: "TK-1439155",
    descripcion: "fix: Se eliminó ireferencia del modelo de mensaje calificado",
    insCount: 0,
    delCount: 2,
    minutos: 3,
    sortKey: 1,
    meta: { fecha: "2026-06-17T17:09:01-05:00", repo: "ISS" },
  },
  {
    hash: "4363ae3",
    proyecto: "PatyIA",
    tkRef: "TK-1439155",
    descripcion: "fix: Se unificó imensaje en MensajeOpenAI sin ireferencia",
    insCount: 1,
    delCount: 3,
    minutos: 3,
    sortKey: 2,
    meta: { fecha: "2026-06-17T17:09:01-05:00", repo: "ISS" },
  },
  {
    hash: "0969a9a",
    proyecto: "PatyIA",
    tkRef: "TK-1439155",
    descripcion: "fix: Se alineó imensaje del hilo con mensajes calificados",
    insCount: 22,
    delCount: 22,
    minutos: 8,
    sortKey: 3,
    meta: { fecha: "2026-06-17T17:09:02-05:00", repo: "ISS" },
  },
  {
    hash: "404d128",
    proyecto: "PatyIA",
    tkRef: "TK-1439155",
    descripcion: "fix: Se validó imensaje al calificar mensajes de conversación",
    insCount: 31,
    delCount: 4,
    minutos: 10,
    sortKey: 4,
    meta: { fecha: "2026-06-17T17:09:02-05:00", repo: "ISS" },
  },
  {
    hash: "138ba3a",
    proyecto: "PatyIA",
    tkRef: "TK-1439155",
    descripcion: "feat: Se aumentó a 5 los resultados de búsqueda en file_search",
    insCount: 1,
    delCount: 1,
    minutos: 3,
    sortKey: 5,
    meta: { fecha: "2026-06-17T17:09:02-05:00", repo: "ISS" },
  },
  {
    hash: "e9c116a",
    proyecto: "PatyIA",
    tkRef: "TK-1439155",
    descripcion: "fix: Se omitió ireferencia en mensajes calificados de la respuesta",
    insCount: 6,
    delCount: 1,
    minutos: 4,
    sortKey: 6,
    meta: { fecha: "2026-06-17T17:09:25-05:00", repo: "ISS" },
  },
  {
    hash: "a22e0ac",
    proyecto: "PatyIA",
    tkRef: "TK-1439155",
    descripcion: "fix: Se alineó el modelo del stream con la configuración en BD",
    insCount: 43,
    delCount: 14,
    minutos: 25,
    sortKey: 7,
    meta: { fecha: "2026-06-17T21:35:40-05:00", repo: "ISS" },
  },
  {
    hash: "87c954e",
    proyecto: "PatyIA",
    tkRef: "TK-1439155",
    descripcion: "fix: Se mejoró el fallback de modelo de instrucciones desde GENERAL en BD",
    insCount: 22,
    delCount: 7,
    minutos: 15,
    sortKey: 8,
    meta: { fecha: "2026-06-17T21:35:50-05:00", repo: "ISS" },
  },
];

const TK1439155_TIEMPOS: TkTiempoSeed[] = [
  {
    name: "Investigación y testing",
    detail: "conversación 2219 · causa del modelo y validación de solución",
    minutos: 40,
    sortKey: 0,
    phase: "investigacion",
  },
  {
    name: "Trabajo en commits ISS",
    detail: "9 commits · alineación modelo GENERAL",
    minutos: 73,
    sortKey: 1,
    phase: "commits",
  },
  {
    name: "Diligencia del ticket",
    detail: "evidencias + documentación TK-1439155",
    minutos: 60,
    sortKey: 2,
    phase: "diligencia",
  },
];

const DOC_SEED_OVERRIDES: Record<string, TkDocSeedOverride> = {
  "TK-1437191": {
    commits: [...TK1437191_COMMITS],
    tiempos: [...TK1437191_TIEMPOS],
  },
  "TK-1439155": { commits: TK1439155_COMMITS, tiempos: TK1439155_TIEMPOS },
};

const R2_PUBLIC = "https://pub-1c290cc606c8478899f5764899278571.r2.dev";

/** Pantallazos confirmados en R2 (sync pendiente en BD). */
const TK1439155_R2_SUBIDAS = [
  "patyia/diligencias/tk1439155-solicitud-insoft.png",
  "patyia/diligencias/tk1439155-metricas-insoft.png",
  "patyia/diligencias/tk1439155-bd-insoft.png",
  "patyia/diligencias/tk1439155-prompts-insoft.png",
  "patyia/diligencias/tk1439155-chat-insoft.png",
  "patyia/diligencias/tk1439155-trazabilidad-insoft.png",
  "patyia/diligencias/tk1439155-chatFix-insoft.png",
  "patyia/diligencias/tk1439155-promptsFix-insoft.png",
];

const TK1439155_EVIDENCIAS_TIEMPO = [
  {
    key: "patyia/diligencias/tk1439155-solicitud-insoft.png",
    rol: "solicitud",
    hitos: ["apertura"],
  },
  {
    key: "patyia/diligencias/tk1439155-metricas-insoft.png",
    rol: "metricas",
    hitos: ["apertura", "atencion", "cierre"],
  },
] as const;

const TK1439155_METRICAS_PATCH = {
  horaInicioAtencion: "17/jun./2026 09:38:47 pm",
  fechaCierre: "17/jun./2026 11:46:28 pm",
  fechaSolucion: "17/jun./2026 11:46:28 pm",
  documentacion: {
    cierreEmpresa: "Solucionado",
    imagenesR2Subidas: TK1439155_R2_SUBIDAS,
    evidenciasTiempo: [...TK1439155_EVIDENCIAS_TIEMPO],
    evidenciasSubidas: true,
  },
};

const TK1437191_R2_SUBIDAS = [
  "patyia/diligencias/tk1437191-problemafecha-insoft.png",
  "patyia/diligencias/tk1437191-problemaireferencia-insoft.png",
  "patyia/diligencias/tk1437191-metricas-insoft.png",
];

const TK1437191_EVIDENCIAS_TIEMPO = [
  {
    key: "patyia/diligencias/tk1437191-metricas-insoft.png",
    rol: "metricas",
    hitos: ["apertura", "atencion", "cierre"],
  },
] as const;

const TK1437191_METRICAS_PATCH = {
  horaInicioAtencion: "12/jun./2026 12:31:00 pm",
  fechaCierre: "19/jun./2026 09:26:00 pm",
  fechaSolucion: "19/jun./2026 09:26:00 pm",
  documentacion: {
    cierreEmpresa: "Solucionado",
    diligenciaMinutos: { investigacion: 35, commits: 111, ticket: 54, total: 200 },
    imagenesR2Subidas: TK1437191_R2_SUBIDAS,
    evidenciasTiempo: [...TK1437191_EVIDENCIAS_TIEMPO],
    evidenciasSubidas: true,
  },
};

const TK1439155_METRICAS_IMAGE = {
  kind: "image",
  sortKey: 3.5,
  payload: {
    url: `${R2_PUBLIC}/patyia/diligencias/tk1439155-metricas-insoft.png`,
    alt: "Métricas InSoft TK-1439155",
    caption: "Métricas InSoft · timeline y panel de tiempos (solucionado 17/jun).",
  },
};

function normIticket(raw: unknown): string {
  const t = String(raw ?? "").trim().toUpperCase();
  return t.startsWith("TK-") ? t : `TK-${t}`;
}

function collectCommits(tk: Record<string, unknown>): Record<string, unknown>[] {
  const contexts = (tk.contexts as { commits?: unknown[] }[]) ?? [];
  const fromCtx = contexts.flatMap((c) => (c.commits as Record<string, unknown>[]) ?? []);
  const root = (tk.rootCommits as Record<string, unknown>[]) ?? [];
  return [...fromCtx, ...root];
}

function needsCommitPatch(current: Record<string, unknown>[], expected: TkCommitSeed[]): boolean {
  if (current.length !== expected.length) return true;
  const byHash = new Map(current.map((c) => [String(c.hash ?? "").toLowerCase(), c]));
  for (const exp of expected) {
    const row = byHash.get(exp.hash.toLowerCase());
    if (!row) return true;
    const desc = String(row.descripcion ?? "");
    if (desc !== exp.descripcion) return true;
    if (/fix\(TK-/i.test(desc)) return true;
  }
  return false;
}

function needsTiemposPatch(
  current: Record<string, unknown>[],
  expected: TkTiempoSeed[],
): boolean {
  if (current.length !== expected.length) return true;
  const byName = new Map(current.map((t) => [String(t.name ?? ""), t]));
  for (const exp of expected) {
    const row = byName.get(exp.name);
    if (!row) return true;
    if (Number(row.minutos ?? 0) !== exp.minutos) return true;
    if (String(row.detail ?? "") !== exp.detail) return true;
    if (exp.phase && String(row.phase ?? "") !== exp.phase) return true;
  }
  return false;
}

function metricasDocBag(tk: Record<string, unknown>): Record<string, unknown> {
  for (const root of [tk.detallesExtra, tk.meta, tk]) {
    if (!root || typeof root !== "object") continue;
    const metricas = (root as Record<string, unknown>).metricas;
    if (!metricas || typeof metricas !== "object") continue;
    const doc = (metricas as Record<string, unknown>).documentacion;
    if (doc && typeof doc === "object") return doc as Record<string, unknown>;
  }
  return {};
}

function needsMetricasEvidenciasPatch(tk: Record<string, unknown>): boolean {
  const doc = metricasDocBag(tk);
  const subidas = Array.isArray(doc.imagenesR2Subidas) ? doc.imagenesR2Subidas : [];
  const pendientes = Array.isArray(doc.imagenesR2Pendientes) ? doc.imagenesR2Pendientes : [];
  const keys = [...subidas, ...pendientes].map((k) => String(k).toLowerCase());
  const hasMetricasKey = keys.some((k) => k.includes("metricas-insoft"));
  if (!hasMetricasKey) return true;
  if (doc.evidenciasSubidas !== true && subidas.length === 0) return true;
  const detMet = ((tk.detallesExtra as Record<string, unknown> | undefined)?.metricas || {}) as Record<
    string,
    unknown
  >;
  if (!detMet.horaInicioAtencion || !detMet.fechaCierre) return true;
  const cierreEmp = String(doc.cierreEmpresa ?? "").toLowerCase();
  if (!cierreEmp.includes("solucionado") && !cierreEmp.includes("cerrado")) return true;
  return false;
}

function mergeMetricasRoot(
  current: Record<string, unknown> | undefined,
  patch: typeof TK1439155_METRICAS_PATCH,
): Record<string, unknown> {
  const base = { ...(current || {}) };
  const doc = {
    ...((base.documentacion as Record<string, unknown>) || {}),
    ...patch.documentacion,
  };
  return { ...base, ...patch, documentacion: doc };
}

function ensureMetricasImageInContent(content: unknown[]): unknown[] {
  const marker = "tk1439155-metricas-insoft.png";
  const has = content.some((block) => {
    if (!block || typeof block !== "object") return false;
    const p = ((block as Record<string, unknown>).payload || {}) as Record<string, unknown>;
    return String(p.url ?? p.src ?? "").includes(marker);
  });
  if (has) return content;
  const blocks = [...content];
  const solicitudIdx = blocks.findIndex((block) => {
    if (!block || typeof block !== "object") return false;
    const p = ((block as Record<string, unknown>).payload || {}) as Record<string, unknown>;
    return String(p.url ?? p.src ?? "").includes("solicitud-insoft");
  });
  if (solicitudIdx >= 0) blocks.splice(solicitudIdx + 1, 0, TK1439155_METRICAS_IMAGE);
  else blocks.push(TK1439155_METRICAS_IMAGE);
  return blocks.sort(
    (a, b) => Number((a as Record<string, unknown>).sortKey ?? 0) - Number((b as Record<string, unknown>).sortKey ?? 0),
  );
}

function patchTk1439155Metricas(tk: Record<string, unknown>): Record<string, unknown> {
  if (!needsMetricasEvidenciasPatch(tk)) return tk;

  const detallesExtra = { ...((tk.detallesExtra as Record<string, unknown>) || {}) };
  detallesExtra.metricas = mergeMetricasRoot(
    detallesExtra.metricas as Record<string, unknown> | undefined,
    TK1439155_METRICAS_PATCH,
  );

  let meta = tk.meta;
  if (meta && typeof meta === "object") {
    meta = {
      ...(meta as Record<string, unknown>),
      metricas: mergeMetricasRoot(
        (meta as Record<string, unknown>).metricas as Record<string, unknown> | undefined,
        TK1439155_METRICAS_PATCH,
      ),
    };
  }

  const content = ensureMetricasImageInContent((tk.content as unknown[]) ?? []);

  return { ...tk, detallesExtra, meta, content };
}

function needsTk1437191MetricasPatch(tk: Record<string, unknown>): boolean {
  if (needsTk1437191ContentPatch((tk.content as unknown[]) ?? [])) return true;
  if (Number(tk.diligenciaMinutos ?? 0) !== 200) return true;
  if (Number(tk.tiempoTotalMinutos ?? 0) !== 200) return true;
  const doc = metricasDocBag(tk);
  const subidas = Array.isArray(doc.imagenesR2Subidas) ? doc.imagenesR2Subidas : [];
  if (!subidas.some((k) => String(k).toLowerCase().includes("1437191-metricas"))) return true;
  const detMet = ((tk.detallesExtra as Record<string, unknown> | undefined)?.metricas || {}) as Record<
    string,
    unknown
  >;
  if (!detMet.horaInicioAtencion || !detMet.fechaCierre) return true;
  return false;
}

function patchTk1437191Metricas(tk: Record<string, unknown>): Record<string, unknown> {
  if (!needsTk1437191MetricasPatch(tk)) return tk;

  const detallesExtra = { ...((tk.detallesExtra as Record<string, unknown>) || {}) };
  detallesExtra.metricas = mergeMetricasRoot(
    detallesExtra.metricas as Record<string, unknown> | undefined,
    TK1437191_METRICAS_PATCH,
  );

  let meta = tk.meta;
  if (meta && typeof meta === "object") {
    meta = {
      ...(meta as Record<string, unknown>),
      metricas: mergeMetricasRoot(
        (meta as Record<string, unknown>).metricas as Record<string, unknown> | undefined,
        TK1437191_METRICAS_PATCH,
      ),
    };
  }

  const content = mergeTk1437191Content((tk.content as unknown[]) ?? []);

  return {
    ...tk,
    detallesExtra,
    meta,
    content,
    tiempos: [...TK1437191_TIEMPOS],
    diligenciaMinutos: 200,
    tiempoTotalMinutos: 200,
    estado: tk.estado ?? "cerrado",
  };
}

/** Sustituye commits/tiempos/contenido del ticket si la API aún no coincide con el seed. */
export function patchTkDocSeed(tk: Record<string, unknown>): Record<string, unknown> {
  const iticket = normIticket(tk.iticket);
  let out = { ...tk };

  const override = DOC_SEED_OVERRIDES[iticket];
  if (override) {
    const currentCommits = collectCommits(out);
    const currentTiempos = (out.tiempos as Record<string, unknown>[]) ?? [];
    const patchCommits = needsCommitPatch(currentCommits, override.commits);
    const patchTiempos = needsTiemposPatch(currentTiempos, override.tiempos);

    if (patchCommits || patchTiempos) {
      const contexts = [...((out.contexts as Record<string, unknown>[]) ?? [])];
      if (patchCommits) {
        if (!contexts.length) {
          contexts.push({ sortKey: 0, commits: override.commits });
        } else {
          contexts[0] = { ...contexts[0], commits: override.commits };
        }
      }
      out = {
        ...out,
        contexts: patchCommits ? contexts : out.contexts,
        rootCommits: patchCommits ? [] : out.rootCommits,
        tiempos: override.tiempos,
      };
    }
  }

  const content = (out.content as unknown[]) ?? [];
  if (iticket === "TK-1437191" && needsTk1437191ContentPatch(content)) {
    out = { ...out, content: mergeTk1437191Content(content) };
  }

  if (iticket === "TK-1439155" && needsTk1439155ContentPatch(content)) {
    out = { ...out, content: mergeTk1439155Content(content) };
  }

  if (iticket === "TK-1439155") {
    out = patchTk1439155Metricas(out);
  }

  if (iticket === "TK-1437191") {
    out = patchTk1437191Metricas(out);
  }

  if (iticket === "TK-1437976") {
    out = patchTk1437976Content(out);
  }

  return out;
}

const TK1437976_SOLICITUD =
  "Este ticket documenta la integración de un **conector MCP de prueba** para el asistente de IA y una **pestaña de chat** en la aplicación de herramientas interna, para validar conversaciones en el entorno de pruebas del portal de soporte, con el mismo flujo funcional que el canal que usan los asesores.";

const TK1437976_RESUMEN =
  "Se atendió la solicitud de habilitar un conector MCP de prueba y una pestaña de chat en la aplicación de herramientas interna, para validar el asistente de IA contra el entorno de pruebas del portal de soporte. Alcance solo interno; no expuesto a clientes finales.";

const TK1437976_LEGACY_MARKERS = [
  "ISA PatyIA AppTools",
  "AyudasCP staging",
  "jeff-aporta.github.io",
  "AppTools una pestaña Chat",
  "isa-patyia",
  "JAGUDELOE",
  "VRESTREPO",
  "soporte-staging",
  "ayudascp-ia-staging",
  "ia.contapyme.com/runtime/webhooks/mcp",
];

const TK1437976_BLOCK_TEXT: Record<string, string> = {
  "Requerimiento InSoft (TK-1437976)":
    "Se solicitó registrar el conector MCP en el entorno de pruebas para integrarlo con el asistente de IA. **Solo modo pruebas** — no disponible para clientes finales.",
  "Solución entregada":
    "- **Pestaña Chat:** conversaciones contra la API del portal de soporte en entorno de pruebas, autenticadas con JWT del staging.\n" +
    "- **Token JWT:** modal dedicado; cada usuario autorizado guarda **su** token en el almacenamiento de sesión del navegador.\n" +
    "- **Permisos:** usuarios con rol interactivo pueden enviar y eliminar **solo** con su propio token; demás usuarios autenticados ven **solo lectura**.\n" +
    "- **Imágenes:** pegar desde portapapeles (Ctrl+V) en el campo de entrada.\n" +
    "- **MCP:** conector registrado para pruebas internas; el backend del asistente lo consume en entorno de pruebas.",
  "Cómo probar":
    "1. Abrir la aplicación de herramientas interna e iniciar sesión con un usuario autorizado para pruebas.\n" +
    "2. Ir a la pestaña **Chat** → botón de credenciales → pegar el token JWT obtenido del portal de soporte en entorno de pruebas (cabecera Authorization en las herramientas de desarrollo del navegador).\n" +
    "3. **Nueva conversación** → escribir consulta o pegar imagen → **Enviar**.\n" +
    "4. Verificar historial en la barra lateral (solo conversaciones del contacto asociado al token).\n" +
    "5. Con otro usuario sin rol interactivo: debe verse **Solo lectura** sin botón Enviar.\n" +
    "6. Validar en el servidor de pruebas que el webhook del conector MCP responde correctamente.",
};

function hasTk1437976LegacyText(text: string): boolean {
  const t = String(text ?? "");
  if (!t) return false;
  return TK1437976_LEGACY_MARKERS.some((m) => t.includes(m)) || /\bPaty IA\b/.test(t);
}

function patchTk1437976Content(tk: Record<string, unknown>): Record<string, unknown> {
  let out = { ...tk };
  const resumen = String(out.resumen ?? "");
  if (resumen && hasTk1437976LegacyText(resumen)) {
    out = { ...out, resumen: TK1437976_RESUMEN };
  }

  let content = [...((out.content as Record<string, unknown>[]) ?? [])];
  let changed = false;

  content = content.map((block) => {
    if (String(block?.kind ?? "").toLowerCase() !== "markdown") return block;
    const payload = (block.payload || {}) as Record<string, unknown>;
    const title = String(payload.title ?? "");
    const text = String(payload.text ?? "");
    const sortKey = Number(block.sortKey ?? -1);

    if (sortKey === 0 && text && hasTk1437976LegacyText(text)) {
      changed = true;
      return { ...block, payload: { ...payload, text: TK1437976_SOLICITUD } };
    }

    const replacement = title ? TK1437976_BLOCK_TEXT[title] : undefined;
    if (replacement && hasTk1437976LegacyText(text)) {
      changed = true;
      return { ...block, payload: { ...payload, text: replacement } };
    }

    return block;
  });

  if (changed) out = { ...out, content };
  return out;
}
