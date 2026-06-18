/**
 * Bloques cuerpo TK-1439155 (sortKey ≥ 8) — puente front hasta re-seed BD.
 * Mantener sync con backend-tks/scripts/lib/tk-content-1439155.mjs
 */

export const TK1439155_CONTENT_TAIL: Record<string, unknown>[] = [
  {
    kind: "markdown",
    sortKey: 8,
    payload: {
      title: "Causa del problema",
      text:
        "El stream principal de conversación resolvía el modelo con una cadena que **priorizaba** el valor de **`system-prompts.json`** (`modeloConversacion: gpt-5-nano`) por encima de **`INSTRUCCION.GENERAL.JCONFIG.model`** (`gpt-4o-mini`).\n\n" +
        "Las consultas operativas (clasificador, extractor, etc.) sí leían `jconfig.model` de su instrucción; el desfase afectaba el **turno conversacional** con `file_search` y la trazabilidad mostrada en UI, log y OpenAI Platform.",
    },
  },
  {
    kind: "markdown",
    sortKey: 9,
    payload: {
      title: "Procesos de verificación de causa",
      text:
        "Para entender por qué Paty mostraba un modelo distinto al configurado, se revisó el caso **paso a paso**: primero lo que reportó la asesora y lo que se ve en pantalla, después cómo responde el servicio en ambiente de pruebas, y por último si la corrección dejó todo coherente.\n\n" +
        "A continuación se resume ese recorrido en lenguaje claro, con consultas, archivos revisados y registros **integrados en cada fase**. La matriz de pruebas queda al final como detalle de soporte.",
    },
  },
  {
    kind: "steps",
    sortKey: 10,
    payload: {
      phases: [
        {
          title: "Fase 1 — Lo que se ve en InSoft y en pruebas",
          items: [
            "Se leyó la solicitud de Viviana Restrepo y se reprodujo el escenario con la **conversación 2219** (solicitud de restablecer la clave del usuario jperez).",
            "Se comparó la pantalla donde se configura Paty —que indica **gpt-4o-mini**— con lo que aparece en el chat y en la plataforma de OpenAI, donde figuraba **gpt-5-nano**.",
            "Se confirmó en base de datos que la configuración general del catálogo **sí tenía** guardado gpt-4o-mini; es decir, el problema no era un dato mal digitado en administración.",
          ],
        },
        {
          title: "Fase 2 — Cómo viaja la pregunta hasta la respuesta",
          items: [
            "Se siguió el recorrido de una pregunta del usuario hasta la respuesta de Paty, para ubicar **en qué momento** el sistema elige qué modelo de inteligencia artificial utilizar.",
            "Ahí se constató que, al responder en el chat, el servicio **no estaba priorizando** la configuración del catálogo y terminaba usando otro valor por defecto.",
            "También se revisaron los mensajes de la conversación de prueba, para descartar que la diferencia de modelo se explicara solo por mensajes calificados o por datos viejos del hilo.",
            {
              kind: "badges",
              items: [
                { label: "005 - OpenIAServer.ts", tone: "primary" },
                { label: "120 - TInstruccionServer.ts", tone: "primary" },
                { label: "010 - ConversacionesServer.ts", tone: "secondary" },
                { label: "020 - MensajesCalificadosServer.ts", tone: "secondary" },
                { label: "020 - TMensaje.ts", tone: "secondary" },
                { label: "UlPrompts.ts", tone: "warning" },
                { label: "system-prompts.json", tone: "warning" },
                { label: "CONVERSACION_LOG", tone: "success" },
              ],
            },
          ],
        },
        {
          title: "Fase 3 — Cruce con base de datos y registros",
          items: [
            "Se consultó en base de datos qué modelo tiene registrada la instrucción GENERAL:",
            {
              kind: "sql",
              code:
                "SELECT\n" +
                "  i.iinstruccion,\n" +
                "  i.ninstruccion,\n" +
                "  i.jconfig,\n" +
                "  JSON_VALUE(i.jconfig, '$.model') AS modelo_configurado\n" +
                "FROM INSTRUCCION i\n" +
                "WHERE i.iinstruccion IN ('GENERAL', 'PROMPT_GENERAL')\n" +
                "  AND i.bactivo = 1;",
            },
            "Se cotejaron los archivos de configuración del servicio y el registro de la conversación, para tener una foto completa del desfase:",
            {
              kind: "code",
              language: "json",
              code:
                '{\n' +
                '  "fuentes_contrastadas": {\n' +
                '    "INSTRUCCION.GENERAL.JCONFIG.model": "gpt-4o-mini",\n' +
                '    "system-prompts.json.modeloConversacion": "gpt-5-nano",\n' +
                '    "UI_chat_badge": "gpt-5-nano-2025-08-07",\n' +
                '    "OpenAI_Responses.model": "gpt-5-nano-2025-08-07"\n' +
                '  },\n' +
                '  "iconversacion_prueba": 2219,\n' +
                '  "criterio_cierre": "send.model = gpt-4o-mini en CONVERSACION_LOG y UI"\n' +
                '}',
            },
            "Se verificó que el modelo anotado en el historial del sistema coincidiera con el de la pantalla y con el que reporta OpenAI.",
          ],
        },
        {
          title: "Fase 4 — Pruebas con el área funcional y cierre",
          items: [
            "Se probó de nuevo en ambiente de pruebas con la conversación 2219 y se observó qué modelo muestra Paty al responder.",
            "Se atendieron ajustes pedidos para estabilizar las pruebas del área (mensajes calificados y búsqueda en documentos adjuntos).",
            "Se pasó una revisión automática de calidad sobre el código del repositorio, sin hallazgos que bloquearan la entrega.",
            "Tras publicar los cambios, se repitió la prueba: el criterio de cierre fue ver el **mismo modelo** en configuración, chat, historial y OpenAI.",
          ],
        },
      ],
    },
  },
  {
    kind: "table",
    sortKey: 15,
    payload: {
      title: "Matriz de pruebas realizadas",
      headers: ["Qué se comprobó", "Cómo", "Qué debía ocurrir", "Resultado"],
      rows: [
        ["Modelo en catálogo (base de datos)", "Consulta SQL + SSMS", "gpt-4o-mini configurado", "Correcto desde el inicio"],
        ["Modelo en pantalla del chat (2219)", "Prueba manual en staging", "Igual al del catálogo", "Fallaba antes; corregido"],
        ["Modelo en OpenAI", "Revisión en plataforma", "Igual al del catálogo", "Fallaba antes; corregido"],
        ["Mensajes calificados en pruebas", "Conversación de prueba", "Sin errores al calificar", "Correcto tras ajustes"],
        ["Búsqueda en archivos adjuntos", "Consulta con documentos", "Hasta 5 resultados útiles", "Correcto"],
        ["Calidad del código entregado", "Revisión automática (oxlint)", "Sin errores bloqueantes", "Correcto"],
      ],
    },
  },
  {
    kind: "markdown",
    sortKey: 16,
    payload: {
      text:
        "**Conclusión de la verificación:** la configuración en base de datos **ya estaba bien**; lo que fallaba era que, al responder al usuario, Paty tomaba otro modelo por defecto. Una vez corregido ese comportamiento, lo que se ve en administración, en el chat y en OpenAI **vuelve a coincidir**. Con esto el área funcional puede continuar las pruebas con tranquilidad.",
    },
  },
  {
    kind: "markdown",
    sortKey: 20,
    payload: {
      title: "Solución aplicada",
      text:
        "Se ajustó el servicio de **Paty V3** para que, al conversar con un usuario, utilice el **mismo modelo de inteligencia artificial** que está definido en el catálogo de la aplicación (**gpt-4o-mini** en la instrucción general).\n\n" +
        "La tarde del **17 de junio** se publicaron **nueve mejoras** en el repositorio del agente. Incluyen soporte a las pruebas que venía haciendo el área sobre la conversación 2219 y el cierre de la inconsistencia del modelo que motivó este ticket.\n\n" +
        "**Qué quedó resuelto para el usuario y el área funcional:**\n" +
        "1. Paty responde con el modelo configurado en administración, no con uno distinto guardado en archivos internos del servicio.\n" +
        "2. La pantalla de Paty, el historial del sistema y la trazabilidad en OpenAI muestran **el mismo modelo**.\n" +
        "3. El ambiente de pruebas quedó listo para que se valide de nuevo con conversaciones reales, como la de restablecimiento de clave.",
    },
  },
  {
    kind: "markdown",
    sortKey: 20.5,
    payload: {
      title: "Evidencia de pruebas post-fix",
      text:
        "Tras republicar en staging se repitió la conversación de prueba (reset de clave **jperez**). Las capturas confirman el modelo **`gpt-4o-mini-2024-07-18`** en la respuesta de Paty y **`gpt-4o-mini`** en el catálogo de instrucciones por tipo (**SOLICITUD_NO_PERMITIDA**), alineado con la configuración del área funcional.",
    },
  },
  {
    kind: "image",
    sortKey: 20.6,
    payload: {
      docLane: "solucion",
      url: "https://pub-1c290cc606c8478899f5764899278571.r2.dev/patyia/diligencias/tk1439155-chatFix-insoft.png",
      alt: "Chat PatyIA post-fix — modelo gpt-4o-mini",
      caption:
        "Prueba staging — chat PatyIA: **gpt-4o-mini-2024-07-18** en respuesta (clasificación SOLICITUD_NO_PERMITIDA + turno conversacional).",
    },
  },
  {
    kind: "image",
    sortKey: 20.7,
    payload: {
      docLane: "solucion",
      url: "https://pub-1c290cc606c8478899f5764899278571.r2.dev/patyia/diligencias/tk1439155-promptsFix-insoft.png",
      alt: "Prompts PatyIA — catálogo gpt-4o-mini por tipo",
      caption:
        "ISA PatyIA Prompts — instrucciones por tipo (p. ej. **SOLICITUD_NO_PERMITIDA**) en **gpt-4o-mini**.",
    },
  },
  {
    kind: "file-tree",
    sortKey: 21,
    payload: {
      rootLabel: "ISS",
      paths: [
        "src/lib/constants/UlConst.ts",
        "src/lib/controller/000-core/005 - OpenIAServer.ts",
        "src/lib/controller/010-conversacion/010 - ConversacionesServer.ts",
        "src/lib/controller/010-conversacion/020 - MensajesCalificadosServer.ts",
        "src/lib/controller/110-catalogo/120 - TInstruccionServer.ts",
        "src/lib/logs/UlMetrics.ts",
        "src/lib/model/010-conversacion/020 - TMensaje.ts",
      ],
      hints: {
        "005 - OpenIAServer.ts":
          "Corrección central del ticket: al responder en el chat, Paty elige el modelo configurado en el catálogo (gpt-4o-mini) en lugar del valor por defecto de archivos internos. También se amplió la búsqueda en documentos adjuntos a 5 resultados para las pruebas del área.",
        "120 - TInstruccionServer.ts":
          "Se reforzó el respaldo que lee el modelo desde la instrucción GENERAL en base de datos cuando la configuración local no trae un valor explícito, evitando que el servicio use un modelo distinto al del catálogo.",
        "020 - MensajesCalificadosServer.ts":
          "Se validó y normalizó el identificador de mensaje (imensaje) al calificar respuestas en conversación de prueba, corrigiendo fallos que interrumpían la validación funcional del caso 2219.",
        "010 - ConversacionesServer.ts":
          "Se ajustó la respuesta de mensajes calificados para que el imensaje devuelto coincida con el hilo de la conversación, necesario para que las pruebas del área no fallen al revisar mensajes calificados.",
        "020 - TMensaje.ts":
          "Se unificó el modelo de mensaje calificado eliminando el campo ireferencia, que generaba inconsistencias entre lo mostrado en pantalla, el historial del sistema y la trazabilidad en OpenAI.",
        "UlConst.ts":
          "Se consolidó el tipo MensajeOpenAI compartido por el stream conversacional y los mensajes calificados, para que todos los puntos del servicio usen el mismo formato de mensaje.",
        "UlMetrics.ts":
          "Se alineó el imensaje registrado en las métricas del hilo con los mensajes reales de la conversación, coherente con los ajustes de calificación y trazabilidad del ticket.",
      },
    },
  },
  {
    kind: "code",
    sortKey: 22,
    payload: {
      language: "json",
      intro:
        "Tras republicar los cambios en staging, se contrastó el modelo en todas las fuentes involucradas. El siguiente registro resume el **estado después del fix** y confirma la entrega en el repositorio:",
      code:
        '{\n' +
        '  "resultado_post_fix": {\n' +
        '    "INSTRUCCION.GENERAL.JCONFIG.model": "gpt-4o-mini",\n' +
        '    "stream_resolveStreamModel": "gpt-4o-mini",\n' +
        '    "CONVERSACION_LOG.send.model": "gpt-4o-mini",\n' +
        '    "UI_y_OpenAI": "gpt-4o-mini"\n' +
        '  },\n' +
        '  "commits_entrega": 9,\n' +
        '  "repositorio": "ISS"\n' +
        '}',
    },
  },
];

/** Siempre aplicar cola canónica en puente front (evita textos viejos cacheados en API). */
export function needsTk1439155ContentPatch(_content: unknown[]): boolean {
  return true;
}

export function mergeTk1439155Content(content: unknown[]): unknown[] {
  const head = (content as { sortKey?: number }[]).filter((b) => Number(b.sortKey ?? 0) < 8);
  return [...head, ...TK1439155_CONTENT_TAIL];
}
