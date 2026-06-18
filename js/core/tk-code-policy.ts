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

function collapseBlankLines(code: string): string {
  return code.replace(/\n{3,}/g, "\n\n").trim();
}

function stripSqlComments(code: string): string {
  let out = String(code ?? "").replace(/\/\*[\s\S]*?\*\//g, "");
  const lines = out.split(/\r?\n/).map((line) => {
    const trimmed = line.trimStart();
    if (trimmed.startsWith("--")) return "";
    return line;
  });
  return collapseBlankLines(lines.join("\n"));
}

function stripJsonComments(code: string): string {
  let out = String(code ?? "").replace(/\/\*[\s\S]*?\*\//g, "");
  const lines = out.split(/\r?\n/).map((line) => (/^\s*\/\//.test(line) ? "" : line));
  return collapseBlankLines(lines.join("\n"));
}

/** Quita comentarios de bloques SQL/JSON en diligencias (sin guiones dobles, barras ni bloques de comentario). */
export function stripTkCodeComments(code: unknown, lang: unknown): string {
  const raw = String(code ?? "");
  if (!raw.trim()) return raw;
  return tkCodeLanguageForRender(lang) === "json" ? stripJsonComments(raw) : stripSqlComments(raw);
}

/** Código listo para CodeMirror / HTML (sin comentarios). */
export function tkCodeForRender(code: unknown, lang: unknown): string {
  return stripTkCodeComments(code, lang);
}

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

function normalizeStepsItems(items: unknown): unknown {
  if (!Array.isArray(items)) return items;
  return items.map((raw) => {
    if (typeof raw === "string") return raw;
    if (!raw || typeof raw !== "object") return raw;
    const item = raw as Record<string, unknown>;
    const kind = String(item.kind ?? "").toLowerCase();
    if (kind !== "sql" && kind !== "code") return item;
    const lang = kind === "sql" ? "sql" : item.language;
    const codeKey = item.code != null ? "code" : item.sql != null ? "sql" : "code";
    const codeRaw = String(item[codeKey] ?? "");
    const cleaned = stripTkCodeComments(codeRaw, lang);
    if (cleaned === codeRaw) return item;
    return { ...item, [codeKey]: cleaned };
  });
}

function normalizeStepsPhases(phases: unknown): unknown {
  if (!Array.isArray(phases)) return phases;
  return phases.map((raw) => {
    if (!raw || typeof raw !== "object") return raw;
    const phase = raw as Record<string, unknown>;
    const items = normalizeStepsItems(phase.items);
    if (items === phase.items) return phase;
    return { ...phase, items };
  });
}

function normalizeCodePayload(p: Record<string, unknown>, lang: string): Record<string, unknown> {
  const codeKey = p.code != null ? "code" : p.sql != null ? "sql" : p.text != null ? "text" : "";
  if (!codeKey) return p;
  const cleaned = stripTkCodeComments(p[codeKey], lang);
  if (cleaned === String(p[codeKey] ?? "")) return p;
  return { ...p, [codeKey]: cleaned };
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
    const next = isAllowedTkCodeLanguage(lang) && p.code
      ? normalizeCodePayload(p, lang)
      : p;
    return next === p0 ? block : { ...block, payload: next };
  }

  if (kind === "steps" || kind === "stepper") {
    const phases = normalizeStepsPhases(p.phases ?? p.steps);
    if (phases === (p.phases ?? p.steps)) {
      return p === p0 ? block : { ...block, payload: p };
    }
    const payload = { ...p, ...(Array.isArray(p.phases) ? { phases } : { steps: phases }) };
    return { ...block, payload };
  }

  if (kind !== "code" && kind !== "sql") return block;

  const lang = String(p.language ?? (kind === "sql" ? "sql" : "text")).toLowerCase();
  if (isAllowedTkCodeLanguage(lang)) {
    const cleaned = normalizeCodePayload(p, lang);
    if (kind === "sql") return { ...block, kind: "code", payload: { ...cleaned, language: "sql" } };
    return cleaned === p ? block : { ...block, payload: cleaned };
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

/** Texto contextual opcional antes de un bloque code/sql (intro, context, lead). */
export function tkCodeBlockIntro(payload: Record<string, unknown> | undefined): string {
  const p = payload ?? {};
  return String(p.intro ?? p.context ?? p.lead ?? "").trim();
}

/** Lenguaje seguro para CodeBlock / codeBlock HTML (solo sql | json). */
export function tkCodeLanguageForRender(lang: unknown): "sql" | "json" {
  return String(lang ?? "sql").toLowerCase() === "json" ? "json" : "sql";
}
