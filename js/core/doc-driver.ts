/** Driver de documento TK: html (correo) | jsx (web). Persiste en query `s`. */
export type DocDriver = "html" | "jsx";

export const DEFAULT_DOC_DRIVER: DocDriver = "jsx";

export function resolveDocDriver(state: { driver?: unknown } | null | undefined): DocDriver {
  return state?.driver === "html" ? "html" : DEFAULT_DOC_DRIVER;
}
