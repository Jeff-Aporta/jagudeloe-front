/** Diligencias TK: solo SQL y JSON como bloques de código; no TS/JS en la vista. */

export type TkContentBlock = {
  kind?: string;
  payload?: Record<string, unknown>;
  sortKey?: number;
};

const ALLOWED = new Set(["sql", "json"]);

const DISALLOWED_LANG_RX = /^(typescript|ts|tsx|javascript|js|jsx)$/i;

export const TK_CODE_OMITTED_NOTE =
  "Fragmento de implementación omitido en la diligencia (solo se documentan **SQL** y **JSON**). " +
  "Ver commits del ticket en el repositorio.";

export function isAllowedTkCodeLanguage(lang: unknown): boolean {
  return ALLOWED.has(String(lang ?? "sql").toLowerCase());
}

export function isDisallowedTkCodeLanguage(lang: unknown): boolean {
  const l = String(lang ?? "").trim().toLowerCase();
  if (!l) return false;
  if (isAllowedTkCodeLanguage(l)) return false;
  return DISALLOWED_LANG_RX.test(l) || !ALLOWED.has(l);
}

/** Quita bloques ```typescript|js|... del markdown. */
export function stripDisallowedCodeFences(text: unknown): string {
  const raw = String(text ?? "");
  if (!raw.includes("```")) return raw;
  return raw.replace(
    /```(?:typescript|ts|tsx|javascript|js|jsx)\r?\n[\s\S]*?```/gi,
    `\n\n${TK_CODE_OMITTED_NOTE}\n\n`,
  );
}

/** Quita tablas de código legacy (tk-code-wrap / etiqueta TYPESCRIPT) del HTML passthrough. */
export function stripDisallowedCodeFromHtml(html: unknown): string {
  let out = String(html ?? "");
  if (!out) return out;

  out = out.replace(
    /<table[^>]*>[\s\S]*?data-lang=["'](?:typescript|ts|tsx|javascript|js|jsx)["'][\s\S]*?<\/table>/gi,
    `<p>${TK_CODE_OMITTED_NOTE}</p>`,
  );

  out = out.replace(
    /<pre[^>]*class=["'][^"']*(?:typescript|language-ts)[^"']*["'][\s\S]*?<\/pre>/gi,
    `<p>${TK_CODE_OMITTED_NOTE}</p>`,
  );

  return out;
}

function markdownPayloadFromOmitted(title: string, note = TK_CODE_OMITTED_NOTE): Record<string, unknown> {
  return title ? { title, text: `**${title}**\n\n${note}` } : { text: note };
}

function normalizePayloadTextFields(payload: Record<string, unknown>): Record<string, unknown> {
  const out = { ...payload };
  for (const key of ["text", "body"] as const) {
    if (typeof out[key] === "string") out[key] = stripDisallowedCodeFences(out[key]);
  }
  for (const key of ["html", "content"] as const) {
    if (typeof out[key] === "string") out[key] = stripDisallowedCodeFromHtml(out[key]);
  }
  return out;
}

/** Convierte bloques code/sql/accordion con lenguaje no permitido a markdown (legacy en BD). */
export function normalizeTkContentBlock(block: TkContentBlock): TkContentBlock {
  const kind = String(block.kind ?? "text").toLowerCase();
  const p0 = block.payload ?? {};
  const p = normalizePayloadTextFields(p0);

  if (kind === "markdown" || kind === "md" || kind === "text" || kind === "html" || kind === "body") {
    if (p === p0) return block;
    return { ...block, payload: p };
  }

  if (kind === "accordion") {
    const lang = String(p.language ?? "text").toLowerCase();
    if (p.code && isDisallowedTkCodeLanguage(lang)) {
      const title = String(p.title ?? "").trim();
      return { ...block, kind: "markdown", payload: markdownPayloadFromOmitted(title) };
    }
    return p === p0 ? block : { ...block, payload: p };
  }

  if (kind !== "code" && kind !== "sql") return block;

  const lang = String(p.language ?? (kind === "sql" ? "sql" : "text")).toLowerCase();
  if (isAllowedTkCodeLanguage(lang)) {
    if (kind === "sql") return { ...block, kind: "code", payload: { ...p, language: "sql" } };
    return p === p0 ? block : { ...block, payload: p };
  }

  const title = String(p.title ?? "").trim();
  return {
    ...block,
    kind: "markdown",
    payload: markdownPayloadFromOmitted(title),
  };
}

export function normalizeTkContentBlocks(blocks: TkContentBlock[] | undefined): TkContentBlock[] {
  return (blocks ?? []).map(normalizeTkContentBlock);
}

/** Lenguaje seguro para CodeBlock / codeBlock HTML (solo sql | json). */
export function tkCodeLanguageForRender(lang: unknown): "sql" | "json" {
  return String(lang ?? "sql").toLowerCase() === "json" ? "json" : "sql";
}
