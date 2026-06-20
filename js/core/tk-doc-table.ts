/** Especificación JSON → intérprete tabla MUI (TK_CONTENT kind=table).

 *  Formato canónico BD: `table.matrix` — fila 0 = cabecera, resto = cuerpo (celdas md/html).

 *  Legacy `headers` + `rows` se acepta al leer y se normaliza a matrix al persistir.

 */



export type TableCellValue = string | number | boolean | null;



/** Matriz canónica: [0] cabecera, [1..n] filas del cuerpo. */

export type TableMatrix = TableCellValue[][];



export interface TableSpec {

  title?: string;

  caption?: string;

  headers: string[];

  rows: TableCellValue[][];

  matrix?: TableMatrix;

}



function asRecord(v: unknown): Record<string, unknown> {

  return v && typeof v === "object" ? (v as Record<string, unknown>) : {};

}



function readCell(cell: unknown): string {

  return cell == null ? "" : String(cell);

}



function readRow(raw: unknown): string[] {

  if (!Array.isArray(raw)) return [];

  return raw.map(readCell);

}



function readMatrix(raw: unknown): TableMatrix | null {

  if (!Array.isArray(raw) || raw.length < 2) return null;

  const matrix = raw.map(readRow).filter((row) => row.length > 0);

  if (matrix.length < 2) return null;

  const width = matrix[0].length;

  if (!width) return null;

  if (!matrix.every((row) => row.length === width)) return null;

  return matrix;

}



export function matrixFromHeadersRows(headers: string[], rows: TableCellValue[][]): TableMatrix {

  return [headers.map((h) => String(h ?? "")), ...rows.map((row) => (row ?? []).map(readCell))];

}



export function specFromMatrix(matrix: TableMatrix, meta?: { title?: string; caption?: string }): TableSpec {

  const headers = matrix[0]?.map(readCell) ?? [];

  const rows = matrix.slice(1).map((row) => row.map(readCell));

  return {

    title: meta?.title,

    caption: meta?.caption,

    headers,

    rows,

    matrix: matrix.map((row) => row.map(readCell)),

  };

}



/** Matriz cruda del payload (algoritmos — recorridos simples sin parser md). */

export function tableMatrixFromPayload(payload: unknown): TableMatrix | null {

  const spec = tableSpecFromPayload(payload);

  if (!spec) return null;

  return spec.matrix ?? matrixFromHeadersRows(spec.headers, spec.rows);

}



/** Normaliza payload BD (nested `table`, matrix, headers/rows en raíz). */

export function tableSpecFromPayload(payload: unknown): TableSpec | null {

  const p = asRecord(payload);

  const nested = asRecord(p.table ?? p);



  const title = String(nested.title ?? p.title ?? "");

  const caption = nested.caption != null ? String(nested.caption) : p.caption != null ? String(p.caption) : undefined;



  const matrixRaw = nested.matrix ?? p.matrix;

  const matrix = readMatrix(matrixRaw);

  if (matrix) {

    return specFromMatrix(matrix, { title: title || undefined, caption });

  }



  const headersRaw = (nested.headers ?? p.headers) as unknown;

  const rowsRaw = (nested.rows ?? p.rows) as unknown;



  if (!Array.isArray(headersRaw) || headersRaw.length === 0) return null;

  if (!Array.isArray(rowsRaw) || rowsRaw.length === 0) return null;



  const headers = headersRaw.map((h) => String(h ?? ""));

  const rows = rowsRaw.map(readRow);

  return {

    title: title || undefined,

    caption,

    headers,

    rows,

    matrix: matrixFromHeadersRows(headers, rows),

  };

}



/** Payload canónico BD — solo `table.matrix` (+ title/caption/docLane en raíz). */

export function tableBlockPayload(

  spec: TableSpec,

  lane?: Record<string, unknown>,

): Record<string, unknown> {

  const matrix = spec.matrix ?? matrixFromHeadersRows(spec.headers, spec.rows);

  const payload: Record<string, unknown> = {

    ...(spec.title ? { title: spec.title } : {}),

    ...(lane ?? {}),

    table: {

      matrix,

      ...(spec.caption ? { caption: spec.caption } : {}),

    },

  };

  return payload;

}



/** Convierte legacy headers/rows → matrix; elimina claves redundantes. */

export function normalizeTablePayload(payload: unknown): Record<string, unknown> {

  const p = asRecord(payload);

  const spec = tableSpecFromPayload(p);

  if (!spec) return p;



  const laneKeys = ["docLane", "section", "lane", "preset"] as const;

  const lane: Record<string, unknown> = {};

  for (const k of laneKeys) {

    if (p[k] != null && String(p[k]).trim()) lane[k] = p[k];

  }



  return tableBlockPayload(spec, Object.keys(lane).length ? lane : undefined);

}



/** Tabla comparativa Antes/Después TK-1437191. */

export function tk1437191SolucionTableSpec(): TableSpec {

  return specFromMatrix(

    [

      ["Aspecto", "Antes", "Después"],

      [

        "Identificador",

        "`ireferencia` / fechas inconsistentes",

        "**`imensaje`** + **`iconversacion`** (PK compuesta)",

      ],

      ["Hilo OpenAI", "`fecha_hora` vacío", "Epoch desde `created_at` / meta del log"],

      [

        "POST calificar",

        "Sin validación de pertenencia",

        "Solo **`imensaje`** de asistente existente en el log",

      ],

      [

        "GET conversación",

        "Calificaciones sueltas",

        "**`attachCalificadosToMensajesOpenAI`** cruza por par",

      ],

      ["Stream SSE", "Sin slot para UI", "Evento **`end`** incluye **`imensaje`** del turno"],

    ],

    { title: "Solución aplicada" },

  );

}



/** Filas compartidas TK-1437191 — archivos ISS-AyudasCPIA. */

export const TK1437191_ARCHIVOS: Array<{ path: string; hint: string }> = [

  { path: "schema/migrations/001-mensajescalificados-pk-composite.sql", hint: "PK (imensaje, iconversacion)" },

  { path: "src/lib/logs/UlMetrics.ts", hint: "imensaje, fecha_hora, cruce calificados" },

  { path: "src/lib/controller/010-conversacion/010 - ConversacionesServer.ts", hint: "Enriquecimiento GET conversación" },

  { path: "src/lib/controller/010-conversacion/020 - MensajesCalificadosServer.ts", hint: "Validación POST calificar" },

  { path: "src/lib/controller/000-core/005 - OpenIAServer.ts", hint: "imensaje en stream end" },

  { path: "src/lib/constants/UlConst.ts", hint: "Contrato MensajeOpenAI" },

  { path: "src/lib/model/010-conversacion/020 - TMensaje.ts", hint: "Modelo calificado sin ireferencia" },

];



/** Tabla de archivos modificados TK-1437191. */

export function tk1437191ArchivosTableSpec(): TableSpec {

  return specFromMatrix(

    [

      ["Ruta", "Rol"],

      ...TK1437191_ARCHIVOS.map((f) => [f.path, f.hint]),

    ],

    { title: "Archivos modificados (ISS-AyudasCPIA)" },

  );

}


