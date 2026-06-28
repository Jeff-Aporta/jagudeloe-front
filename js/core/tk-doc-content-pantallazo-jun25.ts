/** Bloques doc pantallazo 25/jun — puente front hasta re-seed BD. Espejo de tk-content-pantallazo-jun25.mjs */

const R2 = "https://pub-1c290cc606c8478899f5764899278571.r2.dev/patyia/diligencias";

type DocBlock = Record<string, unknown>;

function lane(key: string, payload: Record<string, unknown>): DocBlock {
  return { ...payload, docLane: key };
}

function md(sortKey: number, docLane: string, title: string, text: string): DocBlock {
  return { kind: "markdown", sortKey, payload: lane(docLane, title ? { title, text } : { text }) };
}

function img(sortKey: number, codigo: number, caption: string): DocBlock {
  return {
    kind: "image",
    sortKey,
    payload: lane("evidencias", {
      url: `${R2}/tk${codigo}-solicitud-insoft.png`,
      alt: `Solicitud InSoft TK-${codigo}`,
      caption,
    }),
  };
}

const TECHNICAL_MARKERS = /CONVERSACION_LOG|file_search|archivos_citados|Evidencia JSON \(R2\)|max_num_results|instruction\/vector|SYS_VALUES|permFixFilter|AYUDASCP_IA|OpenIAServer|isa-patyia/i;

function blockText(b: DocBlock): string {
  const p = (b.payload ?? {}) as Record<string, unknown>;
  return `${p.title ?? ""} ${p.text ?? ""} ${p.caption ?? ""}`;
}

function hasTechnicalRedaction(blocks: DocBlock[]): boolean {
  return blocks.some((b) => TECHNICAL_MARKERS.test(blockText(b)));
}

function mergeBlocks(existing: DocBlock[], canonical: DocBlock[]): DocBlock[] {
  const canonKeys = new Set(canonical.map((b) => Number(b.sortKey ?? 0)));
  const head = existing.filter((b) => !canonKeys.has(Number(b.sortKey ?? 0)));
  return [...head, ...canonical].sort((a, b) => Number(a.sortKey ?? 0) - Number(b.sortKey ?? 0));
}

const TK1441245_TAIL: DocBlock[] = [
  md(4, "causa", "Causa del problema",
    "El historial de conversaciones **no guardaba** qué archivos de ayuda se revisaron ni las consultas internas de búsqueda en cada respuesta.\n\nSolo quedaba el intercambio de mensajes entre el usuario y Paty. Para auditoría interna faltaba ese detalle."),
  md(4.5, "verificacion", "Procesos de verificación de causa",
    "Se repitió el caso en ambiente de pruebas con la conversación de Laura:\n\n- **Antes:** no se veían archivos consultados ni preguntas de búsqueda.\n- **Tras la primera entrega:** empezaron a aparecer nombres de archivos.\n- **Tras la segunda entrega:** también quedan las consultas y el detalle de la búsqueda."),
  md(5, "solucion", "Solución aplicada",
    "1. El registro de cada conversación ahora incluye archivos consultados y datos de la búsqueda documental.\n2. El servicio pide a OpenAI el detalle completo de esa búsqueda.\n3. En Paty IA se muestran los archivos citados y la información de búsqueda al abrir un mensaje.\n\nTiempo estimado: **300 minutos**."),
  md(6.2, "verificacion", "Pruebas en ambiente de pruebas",
    "Conversación de prueba de Laura (correo de facturación electrónica):\n\n| Qué se comprobó | Resultado |\n|----------|----------|\n| Archivos de ayuda citados | Correcto |\n| Preguntas internas de búsqueda | Correcto |\n| Detalle de cada resultado | Correcto |\n| Texto completo de cada fragmento | Pendiente tras nueva publicación |\n\nReportes de apoyo:\n- [Detalle de la conversación de prueba](https://pub-1c290cc606c8478899f5764899278571.r2.dev/patyia/diligencias/tk1441245-qa-offline-conv-2427.json)\n- [Resumen de las pruebas](https://pub-1c290cc606c8478899f5764899278571.r2.dev/patyia/diligencias/tk1441245-qa-report.json)"),
];

const TK1441246_TAIL: DocBlock[] = [
  img(2.5, 1441246, "Captura de la solicitud en InSoft (Teams)."),
  md(4, "causa", "Causa del problema",
    "Cuando el clasificador usa **imagen y texto**, el sistema no guardaba en el historial la instrucción ni la base de conocimiento de ese paso. Con solo texto sí quedaba ese rastro."),
  md(5, "verificacion", "Procesos de verificación de causa",
    "1. Solo texto → el historial muestra instrucción y base usada.\n2. Con imagen → faltan esos datos de clasificación.\n3. Se revisó en qué paso del servicio se pierde la información.\n\n**Para cerrar:** con imagen debe quedar todo visible en el historial."),
  md(6, "solucion", "Solución planificada",
    "Pendiente: guardar instrucción y base al clasificar con imagen, mostrarlo al consultar la conversación y probar con el área funcional.\n\nTiempo estimado: **360 minutos**."),
];

const TK1442417_TAIL: DocBlock[] = [
  img(2.5, 1442417, "Captura de la solicitud en InSoft (Teams)."),
  md(5, "causa", "Causa del problema",
    "Los perfiles de especialistas no tenían un rol que limite el acceso **solo al chat**. Podían llegar a pantallas administrativas que no les corresponden."),
  md(6, "verificacion", "Procesos de verificación de causa",
    "Se probará con los perfiles listados: ingreso ContaPyme, solo pantalla de chat, ver conversaciones de otros y enviar solo desde el propio usuario."),
  md(7, "solucion", "Solución planificada",
    "Entrega estimada **480 minutos**: ajustes en agente y aplicación, pruebas con el área y cierre formal."),
];

const TK1441252_TAIL: DocBlock[] = [
  img(2.5, 1441252, "Captura de la solicitud en InSoft (Teams)."),
  md(4, "causa", "Causa del problema",
    "El límite de resultados de búsqueda no estaba en **8** como pidió el área, o no se podía cambiar fácilmente desde la configuración."),
  md(5, "verificacion", "Procesos de verificación de causa",
    "1. Ver en configuración que el valor es 8.\n2. Probar una consulta con documentos adjuntos.\n3. Cambiar el número desde la pantalla y comprobar que se guarda."),
  md(6, "solucion", "Solución aplicada / avance",
    "El servicio usa el límite desde configuración (default 8) y Paty IA tiene un campo para cambiarlo. Falta validación final con Viviana.\n\nTiempo estimado: **360 minutos**."),
];

const PANTALLAZO_CONTENT: Record<string, DocBlock[]> = {
  "TK-1441245": TK1441245_TAIL,
  "TK-1441246": TK1441246_TAIL,
  "TK-1442417": TK1442417_TAIL,
  "TK-1441252": TK1441252_TAIL,
};

const PANTALLAZO_META: Record<string, { titulo?: string; resumen?: string }> = {
  "TK-1441245": {
    titulo: "Registrar en cada conversación qué documentos se consultaron (auditoría interna)",
    resumen:
      "Agregar al historial de cada conversación qué documentos de ayuda se consultaron y qué búsquedas internas se hicieron, para auditoría interna (como se ve en la plataforma de OpenAI).",
  },
  "TK-1441246": {
    titulo: "Clasificador con imágenes — conservar trazabilidad en la conversación",
    resumen:
      "Pruebas con imágenes: el clasificador debe entender foto y texto. Al usar un modelo que lee imágenes, el historial deja de mostrar qué instrucción y qué base de conocimiento se usaron. Se pide corregirlo.",
  },
  "TK-1442417": {
    resumen:
      "Ajustar permisos de la app QA Testing para que los especialistas entren con ContaPyme y accedan solo al chat de Paty IA, sin pantallas administrativas ni configuración de prompts.",
  },
  "TK-1441252": {
    titulo: "Ajustar cantidad de resultados de búsqueda y pantalla de configuración en Paty IA",
    resumen:
      "Dejar en 8 la cantidad de resultados al buscar en documentos de ayuda y evaluar si se puede cambiar ese valor desde la pantalla de Paty IA.",
  },
};

function normIticket(raw: unknown): string {
  const s = String(raw ?? "").trim().toUpperCase();
  if (!s) return "";
  return s.startsWith("TK-") ? s : `TK-${s}`;
}

export function needsPantallazoJun25ContentPatch(content: unknown[], iticket: string): boolean {
  const tail = PANTALLAZO_CONTENT[iticket];
  if (!tail?.length) return false;
  const blocks = (content ?? []) as DocBlock[];
  if (!blocks.length) return true;
  if (hasTechnicalRedaction(blocks)) return true;
  return tail.some((c) => !blocks.some((b) => Number(b.sortKey ?? -1) === Number(c.sortKey ?? -2)));
}

export function mergePantallazoJun25Content(content: unknown[], iticket: string): unknown[] {
  const tail = PANTALLAZO_CONTENT[iticket];
  if (!tail?.length) return content ?? [];
  let merged = mergeBlocks((content ?? []) as DocBlock[], tail);
  merged = merged.map((b) => {
    if (Number(b.sortKey ?? -1) !== 0 || String(b.kind ?? "").toLowerCase() !== "markdown") return b;
    const p = (b.payload ?? {}) as Record<string, unknown>;
    const text = String(p.text ?? "");
    if (!TECHNICAL_MARKERS.test(text)) return b;
    const resumen = PANTALLAZO_META[iticket]?.resumen ?? text.split("\n\n")[0];
    const suffix =
      iticket === "TK-1441245"
        ? "\n\nSe necesita que, en cada conversación, quede registrado **qué documentos se consultaron** y **qué preguntas internas hizo el sistema** al buscar en la ayuda. Ejemplo de prueba: conversación de Laura sobre un correo de facturación electrónica."
        : "";
    return { ...b, payload: lane(String(p.docLane ?? "solicitud"), { ...p, title: p.title ?? "Solicitud", text: resumen + suffix }) };
  });
  return merged.map((b) => {
    if (String(b.kind ?? "") !== "badge") return b;
    const sk = Number(b.sortKey ?? -1);
    const p = (b.payload ?? {}) as Record<string, unknown>;
    if (iticket === "TK-1441245" && sk === 1) return { ...b, payload: { ...p, label: "Pruebas parciales OK · pendiente cierre" } };
    if (iticket === "TK-1441245" && sk === 3) return { ...b, payload: { ...p, label: "Paty IA · Búsqueda en documentos" } };
    if (iticket === "TK-1441252" && sk === 1) return { ...b, payload: { ...p, label: "En atención · evaluación de pantalla" } };
    if (iticket === "TK-1441252" && sk === 3) return { ...b, payload: { ...p, label: "Paty IA · Búsqueda en documentos" } };
    return b;
  });
}

export function patchPantallazoJun25Meta(tk: Record<string, unknown>): Record<string, unknown> {
  const id = normIticket(tk.iticket);
  const meta = PANTALLAZO_META[id];
  if (!meta) return tk;
  const out = { ...tk };
  if (meta.titulo) out.titulo = meta.titulo;
  if (meta.resumen && (TECHNICAL_MARKERS.test(String(tk.resumen ?? "")) || !String(tk.resumen ?? "").trim())) {
    out.resumen = meta.resumen;
  }
  return out;
}
