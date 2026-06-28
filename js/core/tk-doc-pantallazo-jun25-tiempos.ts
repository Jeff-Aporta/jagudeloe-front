/** Tiempos y commits pantallazo 25/jun — espejo de tk-content-pantallazo-jun25.mjs (solo seed bridge). */

export const TK1441245_COMMITS = [
  { hash: "832231c", proyecto: "PatyIA", tkRef: "TK-1441245", descripcion: "feat: Las conversaciones registran qué archivos consultó la búsqueda documental", insCount: 32, delCount: 3, minutos: 35, sortKey: 0, meta: { fecha: "2026-06-25T19:49:47-05:00", repo: "ISS-AyudasCPIA" } },
  { hash: "04ebec0", proyecto: "PatyIA", tkRef: "TK-1441245", descripcion: "feat: Las trazas de búsqueda documental enriquecen el registro operativo de cada conversación", insCount: 143, delCount: 25, minutos: 45, sortKey: 1, meta: { fecha: "2026-06-26T14:37:17-05:00", repo: "ISS-AyudasCPIA" } },
] as const;

export const TK1441246_COMMITS = [
  { hash: "adc13e4", proyecto: "PatyIA", tkRef: "TK-1441246", descripcion: "feat: Se añadió campo imagenes en mensajes OpenAI de conversación", insCount: 2, delCount: 0, minutos: 3, sortKey: 0, meta: { fecha: "2026-06-18T12:11:10-05:00", repo: "ISS-AyudasCPIA" } },
  { hash: "43fd7f2", proyecto: "PatyIA", tkRef: "TK-1441246", descripcion: "feat: Se expusieron imágenes adjuntas fuera de meta en mensajes OpenAI", insCount: 63, delCount: 1, minutos: 10, sortKey: 1, meta: { fecha: "2026-06-18T12:11:22-05:00", repo: "ISS-AyudasCPIA" } },
  { hash: "2597a07", proyecto: "PatyIA", tkRef: "TK-1441246", descripcion: "fix: Se envían imagenes_cliente al registrar turno en log", insCount: 1, delCount: 0, minutos: 2, sortKey: 2, meta: { fecha: "2026-06-18T21:44:03-05:00", repo: "ISS-AyudasCPIA" } },
  { hash: "8dcd360", proyecto: "PatyIA", tkRef: "TK-1441246", descripcion: "fix: Se resuelven imagenes_adjuntas con file_id y preview comprimido", insCount: 51, delCount: 4, minutos: 10, sortKey: 3, meta: { fecha: "2026-06-18T21:44:02-05:00", repo: "ISS-AyudasCPIA" } },
  { hash: "3625795", proyecto: "PatyIA", tkRef: "TK-1441246", descripcion: "fix: Se persisten adjuntos del cliente en appendConvTurno", insCount: 4, delCount: 2, minutos: 2, sortKey: 4, meta: { fecha: "2026-06-18T21:44:02-05:00", repo: "ISS-AyudasCPIA" } },
  { hash: "e08ce8d", proyecto: "PatyIA", tkRef: "TK-1441246", descripcion: "fix: Se comprime vista previa de adjuntos grandes para el log", insCount: 40, delCount: 0, minutos: 8, sortKey: 5, meta: { fecha: "2026-06-18T21:44:01-05:00", repo: "ISS-AyudasCPIA" } },
  { hash: "4632e26", proyecto: "PatyIA", tkRef: "TK-1441246", descripcion: "feat: Se catalogaron modelos con vision y fallback multimodal", insCount: 19, delCount: 0, minutos: 5, sortKey: 6, meta: { fecha: "2026-06-18T21:51:51-05:00", repo: "ISS-AyudasCPIA" } },
  { hash: "b755d06", proyecto: "PatyIA", tkRef: "TK-1441246", descripcion: "feat: Se añadió resolución de modelo con vision para adjuntos", insCount: 40, delCount: 0, minutos: 8, sortKey: 7, meta: { fecha: "2026-06-18T21:52:02-05:00", repo: "ISS-AyudasCPIA" } },
  { hash: "a5606a0", proyecto: "PatyIA", tkRef: "TK-1441246", descripcion: "feat: Se implementó autoswitch a mini cuando hay imagenes adjuntas", insCount: 15, delCount: 2, minutos: 8, sortKey: 8, meta: { fecha: "2026-06-18T21:52:11-05:00", repo: "ISS-AyudasCPIA" } },
  { hash: "09428a8", proyecto: "PatyIA", tkRef: "TK-1441246", descripcion: "feat: Se registró autoswitch de vision en logs de conversación", insCount: 9, delCount: 1, minutos: 5, sortKey: 9, meta: { fecha: "2026-06-18T21:52:20-05:00", repo: "ISS-AyudasCPIA" } },
  { hash: "65e400c", proyecto: "PatyIA", tkRef: "TK-1441246", descripcion: "feat: Se amplió resolución de prompts para consultas con adjuntos", insCount: 80, delCount: 4, minutos: 15, sortKey: 10, meta: { fecha: "2026-06-18T22:35:26-05:00", repo: "ISS-AyudasCPIA" } },
  { hash: "d1cba0b", proyecto: "PatyIA", tkRef: "TK-1441246", descripcion: "fix: Se incluyeron metadatos de conversación en GET logs enriquecido", insCount: 5, delCount: 0, minutos: 5, sortKey: 11, meta: { fecha: "2026-06-18T22:35:26-05:00", repo: "ISS-AyudasCPIA" } },
  { hash: "39ea584", proyecto: "PatyIA", tkRef: "TK-1441246", descripcion: "fix: Se ajustó resolución de adjuntos visión para el log de conversación", insCount: 13, delCount: 21, minutos: 5, sortKey: 12, meta: { fecha: "2026-06-18T22:35:09-05:00", repo: "ISS-AyudasCPIA" } },
  { hash: "ebb839d", proyecto: "PatyIA", tkRef: "TK-1441246", descripcion: "fix: Se priorizó receive al reconstruir texto visible en logs de conversación", insCount: 51, delCount: 24, minutos: 10, sortKey: 13, meta: { fecha: "2026-06-18T22:34:55-05:00", repo: "ISS-AyudasCPIA" } },
  { hash: "f55383b", proyecto: "PatyIA", tkRef: "TK-1441246", descripcion: "fix: Se preservó el texto del asistente cuando el stream falla parcialmente", insCount: 24, delCount: 10, minutos: 5, sortKey: 14, meta: { fecha: "2026-06-18T22:34:42-05:00", repo: "ISS-AyudasCPIA" } },
  { hash: "5dd8310", proyecto: "PatyIA", tkRef: "TK-1441246", descripcion: "fix: Se optimizó la normalización de imágenes visión conservando el ratio", insCount: 34, delCount: 13, minutos: 8, sortKey: 15, meta: { fecha: "2026-06-18T23:58:52-05:00", repo: "ISS-AyudasCPIA" } },
  { hash: "e0c0884", proyecto: "PatyIA", tkRef: "TK-1441246", descripcion: "feat: Se implementó módulo de transcripción de notas de voz con Whisper", insCount: 136, delCount: 0, minutos: 20, sortKey: 16, meta: { fecha: "2026-06-19T07:51:55-05:00", repo: "ISS-AyudasCPIA" } },
  { hash: "11bcafc", proyecto: "PatyIA", tkRef: "TK-1441246", descripcion: "feat: Catálogo, almacenamiento de prompts y entradas multimodales se mantienen consistentes", insCount: 58, delCount: 114, minutos: 15, sortKey: 17, meta: { fecha: "2026-06-22T12:30:02-05:00", repo: "ISS-AyudasCPIA" } },
  { hash: "a8d8fb3", proyecto: "PatyIA", tkRef: "TK-1441246", descripcion: "fix: Se calificó por imensaje y se leyeron imágenes fuera de meta", insCount: 41, delCount: 52, minutos: 8, sortKey: 18, meta: { fecha: "2026-06-18T12:15:35-05:00", repo: "isa-patyia" } },
  { hash: "b0f6046", proyecto: "PatyIA", tkRef: "TK-1441246", descripcion: "fix: El visor de log recupera hilos, muestra imágenes y expande el editor JSON", insCount: 133, delCount: 51, minutos: 12, sortKey: 19, meta: { fecha: "2026-06-22T10:58:25-05:00", repo: "isa-patyia" } },
  { hash: "64d097e", proyecto: "PatyIA", tkRef: "TK-1441246", descripcion: "fix: El historial conserva la instrucción y el vector store usados por el clasificador cuando hay imágenes adjuntas", insCount: 21, delCount: 2, minutos: 30, sortKey: 20, meta: { fecha: "2026-06-27T18:57:17-05:00", repo: "ISS-AyudasCPIA" } },
] as const;

export const TK1441252_COMMITS = [
  { hash: "39c5fb3", proyecto: "PatyIA", tkRef: "TK-1441252", descripcion: "feat: La búsqueda en documentos del asistente amplía el número de fragmentos consultados por respuesta", insCount: 1, delCount: 1, minutos: 5, sortKey: 0, meta: { fecha: "2026-06-23T10:48:20-05:00", repo: "ISS-AyudasCPIA" } },
  { hash: "dbbe4bf", proyecto: "PatyIA", tkRef: "TK-1441252", descripcion: "feat: La configuración operativa de OpenAI queda centralizada en tablas de sistema", insCount: 175, delCount: 1, minutos: 25, sortKey: 1, meta: { fecha: "2026-06-24T16:50:09-05:00", repo: "ISS-AyudasCPIA" } },
  { hash: "18521b4", proyecto: "PatyIA", tkRef: "TK-1441252", descripcion: "fix: PUT openai y GET permisos segun USR_PERMISSIONS por rol", insCount: 43, delCount: 18, minutos: 5, sortKey: 2, meta: { fecha: "2026-06-26T06:44:05-05:00", repo: "ISS-AyudasCPIA" } },
  { hash: "457c0a9", proyecto: "PatyIA", tkRef: "TK-1441252", descripcion: "feat: rediseño neon-glass panel OpenAI en Config", insCount: 351, delCount: 31, minutos: 45, sortKey: 3, meta: { fecha: "2026-06-26T06:51:29-05:00", repo: "isa-patyia" } },
  { hash: "7e0de28", proyecto: "PatyIA", tkRef: "TK-1441252", descripcion: "feat: Los modelos operativos y de conversación se centralizan en la configuración OpenAI", insCount: 146, delCount: 42, minutos: 25, sortKey: 4, meta: { fecha: "2026-06-26T12:13:45-05:00", repo: "ISS-AyudasCPIA" } },
  { hash: "14e6e3f", proyecto: "PatyIA", tkRef: "TK-1441252", descripcion: "feat: El catálogo central de tablas del sistema queda definido en un único origen", insCount: 78, delCount: 55, minutos: 20, sortKey: 5, meta: { fecha: "2026-06-26T12:13:45-05:00", repo: "ISS-AyudasCPIA" } },
  { hash: "262f84a", proyecto: "PatyIA", tkRef: "TK-1441252", descripcion: "feat: El backend del asistente consume la configuración OpenAI y prompts sin metadatos mezclados", insCount: 75, delCount: 67, minutos: 15, sortKey: 6, meta: { fecha: "2026-06-26T12:13:46-05:00", repo: "ISS-AyudasCPIA" } },
  { hash: "fddb586", proyecto: "PatyIA", tkRef: "TK-1441252", descripcion: "fix: Config OpenAI y Permisos por rol USR_PERMISSIONS sin modal login", insCount: 66, delCount: 79, minutos: 35, sortKey: 7, meta: { fecha: "2026-06-26T06:44:05-05:00", repo: "isa-patyia" } },
  { hash: "8605033", proyecto: "PatyIA", tkRef: "TK-1441252", descripcion: "feat: Se registra el preview validado para publicar la versión estable", insCount: 2, delCount: 0, minutos: 2, sortKey: 8, meta: { fecha: "2026-06-26T15:22:58-05:00", repo: "isa-patyia" } },
  { hash: "8b09e42", proyecto: "PatyIA", tkRef: "TK-1441252", descripcion: "feat: La configuración del asistente separa modelos y prompts operativos", insCount: 836, delCount: 184, minutos: 55, sortKey: 9, meta: { fecha: "2026-06-26T15:39:09-05:00", repo: "isa-patyia" } },
] as const;

export const TK1442417_COMMITS = [
  { hash: "39e911b", proyecto: "PatyIA", tkRef: "TK-1442417", descripcion: "feat: Modo Libre y PatyIA quedan diferenciados en conversaciones y trazas", insCount: 105, delCount: 36, minutos: 15, sortKey: 0, meta: { fecha: "2026-06-23T08:33:13-05:00", repo: "ISS-AyudasCPIA" } },
  { hash: "7839bd7", proyecto: "PatyIA", tkRef: "TK-1442417", descripcion: "fix: Cada usuario ve únicamente sus conversaciones en el asistente", insCount: 37, delCount: 14, minutos: 8, sortKey: 1, meta: { fecha: "2026-06-23T08:57:35-05:00", repo: "ISS-AyudasCPIA" } },
  { hash: "cd0ac21", proyecto: "PatyIA", tkRef: "TK-1442417", descripcion: "feat: Config Permisos CRUD (dev_lead) y tab OpenAI", insCount: 472, delCount: 38, minutos: 35, sortKey: 2, meta: { fecha: "2026-06-25T19:44:43-05:00", repo: "isa-patyia" } },
  { hash: "f1e8bea", proyecto: "PatyIA", tkRef: "TK-1442417", descripcion: "feat: Cada usuario del asistente queda sujeto a roles definidos por la aplicación", insCount: 166, delCount: 5, minutos: 20, sortKey: 3, meta: { fecha: "2026-06-25T19:49:46-05:00", repo: "ISS-AyudasCPIA" } },
  { hash: "a06da26", proyecto: "PatyIA", tkRef: "TK-1442417", descripcion: "feat: El líder técnico puede consultar y ajustar roles desde la configuración del asistente", insCount: 188, delCount: 0, minutos: 20, sortKey: 4, meta: { fecha: "2026-06-25T19:49:47-05:00", repo: "ISS-AyudasCPIA" } },
  { hash: "698b80f", proyecto: "PatyIA", tkRef: "TK-1442417", descripcion: "feat: tab Permisos visible para todos en modo solo lectura", insCount: 74, delCount: 38, minutos: 15, sortKey: 5, meta: { fecha: "2026-06-25T20:11:48-05:00", repo: "isa-patyia" } },
  { hash: "9bdaf56", proyecto: "PatyIA", tkRef: "TK-1442417", descripcion: "fix: GET system/permisos lectura autenticados, canManage en respuesta", insCount: 11, delCount: 5, minutos: 10, sortKey: 6, meta: { fecha: "2026-06-25T20:11:49-05:00", repo: "ISS-AyudasCPIA" } },
  { hash: "c19fe71", proyecto: "PatyIA", tkRef: "TK-1442417", descripcion: "refactor: swagger_editors SYSTEM a rol documentador USR_PERMISSIONS", insCount: 19, delCount: 52, minutos: 5, sortKey: 7, meta: { fecha: "2026-06-26T06:56:39-05:00", repo: "ISS-AyudasCPIA" } },
  { hash: "f4a0628", proyecto: "PatyIA", tkRef: "TK-1442417", descripcion: "feat: prompts_operativos SYSTEM editable por rol dev_iss", insCount: 195, delCount: 3, minutos: 25, sortKey: 8, meta: { fecha: "2026-06-26T07:07:18-05:00", repo: "ISS-AyudasCPIA" } },
  { hash: "5f52818", proyecto: "PatyIA", tkRef: "TK-1442417", descripcion: "feat: tab Sistema con editor prompts_operativos dev_iss", insCount: 214, delCount: 141, minutos: 30, sortKey: 9, meta: { fecha: "2026-06-26T07:07:18-05:00", repo: "isa-patyia" } },
  { hash: "2a6aaa1", proyecto: "PatyIA", tkRef: "TK-1442417", descripcion: "feat: Se habilitan rutas dedicadas para guardar roles y mover usuarios entre permisos", insCount: 162, delCount: 0, minutos: 25, sortKey: 10, meta: { fecha: "2026-06-26T12:13:44-05:00", repo: "ISS-AyudasCPIA" } },
  { hash: "48dfc7a", proyecto: "PatyIA", tkRef: "TK-1442417", descripcion: "fix: La consulta de permisos del panel de configuración vuelve a responder sin error interno", insCount: 183, delCount: 21, minutos: 25, sortKey: 11, meta: { fecha: "2026-06-26T12:13:44-05:00", repo: "ISS-AyudasCPIA" } },
  { hash: "f6096fe", proyecto: "PatyIA", tkRef: "TK-1442417", descripcion: "feat: Se normalizan claves de roles y metadatos dentro del documento de permisos", insCount: 90, delCount: 12, minutos: 15, sortKey: 12, meta: { fecha: "2026-06-26T12:13:45-05:00", repo: "ISS-AyudasCPIA" } },
  { hash: "b5a62e9", proyecto: "PatyIA", tkRef: "TK-1442417", descripcion: "fix: La resolución efectiva de permisos usa el modelo unificado almacenado en base de datos", insCount: 142, delCount: 53, minutos: 25, sortKey: 13, meta: { fecha: "2026-06-26T12:13:45-05:00", repo: "ISS-AyudasCPIA" } },
  { hash: "fae7731", proyecto: "PatyIA", tkRef: "TK-1442417", descripcion: "fix: Las auditoras vuelven a ver el contenido de las conversaciones en modo lectura", insCount: 93, delCount: 26, minutos: 20, sortKey: 14, meta: { fecha: "2026-06-26T14:31:49-05:00", repo: "isa-patyia" } },
  { hash: "3541973", proyecto: "PatyIA", tkRef: "TK-1442417", descripcion: "fix: El detalle de conversación deja de fallar por caché ORM sin ISEncrypt inicializado", insCount: 3, delCount: 0, minutos: 3, sortKey: 15, meta: { fecha: "2026-06-26T14:56:59-05:00", repo: "ISS-AyudasCPIA" } },
  { hash: "d377c46", proyecto: "PatyIA", tkRef: "TK-1442417", descripcion: "fix: El chat vuelve a mostrar el estado de lectura en la sesión", insCount: 25, delCount: 8, minutos: 5, sortKey: 16, meta: { fecha: "2026-06-26T15:59:10-05:00", repo: "isa-patyia" } },
  { hash: "4c78f22", proyecto: "PatyIA", tkRef: "TK-1442417", descripcion: "feat: El listado de conversaciones respeta permisos de alcance y filtros fijos por sesión", insCount: 171, delCount: 12, minutos: 15, sortKey: 17, meta: { fecha: "2026-06-26T14:36:55-05:00", repo: "ISS-AyudasCPIA" } },
  { hash: "37b26c5", proyecto: "PatyIA", tkRef: "TK-1442417", descripcion: "feat: El rol visitante y la administración de permisos quedan definidos con reglas claras de lectura", insCount: 112, delCount: 7, minutos: 20, sortKey: 18, meta: { fecha: "2026-06-26T14:37:06-05:00", repo: "ISS-AyudasCPIA" } },
  { hash: "c17d8bf", proyecto: "PatyIA", tkRef: "TK-1442417", descripcion: "fix: El modo lectura evita indicadores redundantes en el chat", insCount: 3, delCount: 26, minutos: 10, sortKey: 19, meta: { fecha: "2026-06-26T15:30:10-05:00", repo: "isa-patyia" } },
  { hash: "f542dc3", proyecto: "PatyIA", tkRef: "TK-1442417", descripcion: "feat: Los permisos se organizan en un tablero editable por rol", insCount: 1451, delCount: 128, minutos: 45, sortKey: 20, meta: { fecha: "2026-06-26T15:39:37-05:00", repo: "isa-patyia" } },
  { hash: "0aa414f", proyecto: "PatyIA", tkRef: "TK-1442417", descripcion: "fix: La auditoría de conversaciones mantiene historial sin ruido visual", insCount: 19, delCount: 31, minutos: 10, sortKey: 21, meta: { fecha: "2026-06-26T15:40:25-05:00", repo: "isa-patyia" } },
  { hash: "68d34ba", proyecto: "PatyIA", tkRef: "TK-1442417", descripcion: "feat: La pantalla de configuración conserva el layout publicado", insCount: 840, delCount: 153, minutos: 15, sortKey: 22, meta: { fecha: "2026-06-26T15:40:02-05:00", repo: "isa-patyia" } },
  { hash: "e2fdc9e", proyecto: "PatyIA", tkRef: "TK-1442417", descripcion: "feat: Config/Permisos/Prompts local — auth worker, bridge 8800 e ISS 4500", insCount: 752, delCount: 285, minutos: 45, sortKey: 23, meta: { fecha: "2026-06-26T18:01:59-05:00", repo: "isa-patyia" } },
] as const;

export const TK1441245_TIEMPOS = [
  { name: "Análisis del requerimiento", detail: "Conversación de prueba Laura", minutos: 25, sortKey: 0, phase: "investigacion" },
  { name: "Desarrollo en el agente", detail: "2 commits · registro de archivos consultados", minutos: 80, sortKey: 1, phase: "commits" },
  { name: "Pruebas iniciales", detail: "Validación en ambiente de pruebas", minutos: 45, sortKey: 2, phase: "diligencia" },
  { name: "Pendiente publicación y cierre", detail: "Nueva publicación · cierre en InSoft", minutos: 150, sortKey: 3, phase: "solucion" },
] as const;

export const TK1441246_TIEMPOS = [
  { name: "Análisis del clasificador con imágenes", detail: "Pruebas con foto adjunta", minutos: 45, sortKey: 0, phase: "investigacion" },
  { name: "Desarrollo en el agente", detail: "21 commits · modelo vision, logs y visor", minutos: 194, sortKey: 1, phase: "commits" },
  { name: "Pruebas con imagen", detail: "Validación en el historial", minutos: 90, sortKey: 2, phase: "diligencia" },
  { name: "Diligencia y cierre InSoft", detail: "Documentación y cierre", minutos: 60, sortKey: 3, phase: "solucion" },
] as const;

export const TK1441252_TIEMPOS = [
  { name: "Análisis del parámetro y la pantalla", detail: "Pantalla de configuración Paty IA", minutos: 45, sortKey: 0, phase: "investigacion" },
  { name: "Ajuste en el servicio", detail: "Valor 8 y catálogo de tablas", minutos: 95, sortKey: 1, phase: "commits" },
  { name: "Pantalla de configuración", detail: "Campo editable y rediseño", minutos: 137, sortKey: 2, phase: "solucion" },
  { name: "Pruebas funcionales", detail: "Valor guardado y búsqueda", minutos: 45, sortKey: 3, phase: "diligencia" },
  { name: "Diligencia y cierre InSoft", detail: "Documentación y cierre", minutos: 60, sortKey: 4, phase: "diligencia" },
] as const;

export const TK1442417_TIEMPOS = [
  { name: "Análisis de permisos", detail: "Perfiles especialistas · login ContaPyme", minutos: 60, sortKey: 0, phase: "investigacion" },
  { name: "Ajustes en el agente", detail: "Roles, visitante y tablero editable", minutos: 318, sortKey: 1, phase: "commits" },
  { name: "Ajustes en la aplicación", detail: "Pantalla permisos y auth local", minutos: 185, sortKey: 2, phase: "solucion" },
  { name: "Pruebas con perfiles del área", detail: "Ingreso ContaPyme · solo chat", minutos: 80, sortKey: 3, phase: "diligencia" },
  { name: "Diligencia y cierre InSoft", detail: "Documentación y cierre", minutos: 40, sortKey: 4, phase: "diligencia" },
] as const;

export const PANTALLAZO_JUN25_TIEMPOS: Record<string, readonly (typeof TK1441245_TIEMPOS)[number][]> = {
  "TK-1441245": TK1441245_TIEMPOS,
  "TK-1441246": TK1441246_TIEMPOS,
  "TK-1441252": TK1441252_TIEMPOS,
  "TK-1442417": TK1442417_TIEMPOS,
};