/*
 * ui/tkHtml — driver HTML de tickets: JSON (kind + payload) → HTML email-safe.
 * Visualización con CodeMirror vía tkCodeHydrate.ts. Presentación web: TicketDocWebView.jsx.
 */

import { tkCommitGithubUrl } from "./tkCommitGithub.ts";
import { formatDocumentadoPor, formatTiqueteCreadoPor } from "./tkHeroAuthors.ts";

const C = {
  pageBg: "#eef2f7",
  navy: "#0b2e4e",
  blue: "#1e90ff",
  text: "#33414f",
  muted: "#6b7785",
  border: "#e2e8f0",
  band: "#f4f8ff",
  zebra: "#f7f9fc",
  chipBg: "#eef3fb",
  chipFg: "#234",
  green: "#2e9e5b",
  greenBg: "#f1faf3",
  greenBorder: "#cfe8d6",
  amber: "#b7791f",
  amberBg: "#fdf8ee",
  amberBorder: "#ecd9b0",
};

const FONT = "font-family:Tahoma,Arial,Helvetica,sans-serif;";
const MONO = "font-family:Consolas,Monaco,monospace;";

export function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function icon(name: string, color: string, size = 15): string {
  const c = encodeURIComponent(color);
  return `<img src="https://api.iconify.design/${name}.svg?color=${c}" width="${size}" height="${size}" alt="" style="display:block;border:0;"/>`;
}

function codeChip(text: string): string {
  return `<span style="${MONO}font-size:12px;background:${C.chipBg};color:${C.chipFg};padding:1px 5px;border-radius:3px;">${text}</span>`;
}

function codeChipWeb(text: string): string {
  return `<code class="tk-inline-code">${text}</code>`;
}

/** Inline markdown ligero: **negrilla**, `código`, [label](url). Escapa el resto. */
export function inlineMd(raw: string): string {
  let s = esc(raw);
  s = s.replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");
  s = s.replace(/`([^`]+)`/g, (_m, code) => codeChip(code));
  s = s.replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, `<a href="$2" target="_blank" rel="noreferrer" style="color:${C.blue};">$1</a>`);
  return s;
}

/** Igual que inlineMd, con `<code class="tk-inline-code">` para el driver JSX (tema claro/oscuro vía CSS). */
export function inlineMdWeb(raw: string): string {
  let s = esc(raw);
  s = s.replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");
  s = s.replace(/`([^`]+)`/g, (_m, code) => codeChipWeb(code));
  s = s.replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer" class="tk-inline-link">$1</a>');
  return s;
}

function bulletRow(iconName: string, html: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 8px 0;"><tr>
    <td width="22" style="vertical-align:top;padding-top:2px;">${icon(iconName, C.muted)}</td>
    <td style="${FONT}font-size:13px;color:${C.text};line-height:1.5;">${html}</td></tr></table>`;
}

/** Tarjeta de sección con banda de título e ícono. */
export function section(iconName: string, title: string, bodyHtml: string): string {
  return `<tr><td style="padding:0 0 16px 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:680px;max-width:680px;border:1px solid ${C.border};border-radius:8px;background:#ffffff;">
      <tr><td style="padding:11px 16px;background:${C.band};border-bottom:1px solid ${C.border};border-radius:8px 8px 0 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="padding-right:8px;vertical-align:middle;">${icon(iconName, C.blue, 18)}</td>
          <td style="vertical-align:middle;${FONT}font-size:13px;font-weight:bold;color:${C.navy};letter-spacing:.2px;text-transform:uppercase;">${title}</td>
        </tr></table></td></tr>
      <tr><td style="padding:14px 16px;${FONT}font-size:13px;color:${C.text};line-height:1.55;">${bodyHtml}</td></tr>
    </table></td></tr>`;
}

function plainCard(bodyHtml: string): string {
  return `<tr><td style="padding:0 0 16px 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:680px;max-width:680px;border:1px solid ${C.border};border-radius:8px;background:#ffffff;">
      <tr><td style="padding:14px 16px;${FONT}font-size:13px;color:${C.text};line-height:1.6;">${bodyHtml}</td></tr>
    </table></td></tr>`;
}

function dataTable(headers: string[], rows: unknown[][], opts: { title?: string; raw?: boolean } = {}): string {
  const cell = (c: unknown) => (opts.raw ? String(c ?? "") : inlineMd(String(c ?? "")));
  const th = headers.map((h) => `<th style="${FONT}font-size:11px;color:#fff;background:${C.navy};padding:6px 8px;text-align:left;font-weight:bold;">${inlineMd(String(h))}</th>`).join("");
  const trs = rows.map((row, i) => {
    const bg = i % 2 ? C.zebra : "#ffffff";
    const tds = (row || []).map((c) => `<td style="${FONT}font-size:12px;color:${C.text};padding:6px 8px;border-bottom:1px solid ${C.border};text-align:left;background:${bg};">${cell(c)}</td>`).join("");
    return `<tr>${tds}</tr>`;
  }).join("");
  const title = opts.title ? `<p style="margin:0 0 6px;font-weight:bold;color:${C.navy};">${esc(opts.title)}</p>` : "";
  return `${title}<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border:1px solid ${C.border};border-radius:6px;overflow:hidden;margin:6px 0;"><tr>${th}</tr>${trs}</table>`;
}

function pill(text: string, fg: string, bg: string): string {
  return `<span style="${FONT}display:inline-block;font-size:11px;font-weight:bold;color:${fg};background:${bg};border-radius:10px;padding:1px 8px;white-space:nowrap;">${text}</span>`;
}

function codeBlock(code: string, lang = "sql"): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0;max-width:100%;table-layout:fixed;border:1px solid ${C.border};border-radius:6px;background:${C.zebra};overflow:visible;">
    <tr><td style="padding:5px 10px;border-bottom:1px solid ${C.border};${FONT}font-size:10px;color:${C.muted};text-transform:uppercase;letter-spacing:.5px;">${esc(lang)}</td></tr>
    <tr><td style="padding:0;max-width:100%;overflow:visible;"><div class="tk-code-wrap" data-lang="${esc(lang)}" style="max-width:100%;overflow:visible;"><pre class="tk-code-block" style="margin:0;${MONO}font-size:12px;color:${C.chipFg};line-height:1.5;white-space:pre-wrap;word-break:break-word;overflow:visible;">${esc(code)}</pre></div></td></tr></table>`;
}

const BULLET_ICONS: Record<string, string> = {
  objetivo: "mdi:target",
  restriccion: "mdi:shield-account-outline",
  default: "mdi:check",
};

/** Markdown por bloques: párrafos, viñetas "- ", subtítulos "## ". */
function mdBody(text: string): string {
  const out: string[] = [];
  let para: string[] = [];
  function flushPara() {
    if (para.length) { out.push(`<p style="margin:0 0 8px;">${inlineMd(para.join(" "))}</p>`); para = []; }
  }
  for (const rawLine of String(text).split("\n")) {
    const line = rawLine.trim();
    if (!line) { flushPara(); continue; }
    if (line.startsWith("## ") || line.startsWith("# ")) {
      flushPara();
      out.push(`<p style="margin:14px 0 4px;font-weight:bold;color:${C.navy};">${inlineMd(line.replace(/^#+\s*/, ""))}</p>`);
      continue;
    }
    if (/^[-*]\s+/.test(line)) {
      flushPara();
      const body = line.replace(/^[-*]\s+/, "");
      const key = /^objetivo/i.test(body) ? "objetivo" : /^restricci/i.test(body) ? "restriccion" : "default";
      out.push(bulletRow(BULLET_ICONS[key], inlineMd(body)));
      continue;
    }
    para.push(line);
  }
  flushPara();
  return out.join("");
}

const BADGE_TONES: Record<string, string> = {
  primary: C.blue, info: C.blue, secondary: C.muted, default: C.muted,
  success: C.green, warning: C.amber, error: "#c0392b",
};

function badgePill(payload: Record<string, unknown>): string {
  const tone = BADGE_TONES[String(payload.tone ?? "default")] || C.muted;
  const label = esc(payload.label ?? payload.text ?? "");
  return `<span style="${FONT}display:inline-block;font-size:11px;font-weight:bold;color:${tone};border:1px solid ${tone};border-radius:12px;padding:2px 10px;margin:0 6px 6px 0;background:#ffffff;">${label}</span>`;
}

export type TkBlock = { kind?: string; payload?: Record<string, unknown>; sortKey?: number };

/* ── Drivers por kind: payload JSON → HTML interno (sin tarjeta) ── */
const DRIVERS: Record<string, (p: Record<string, unknown>) => string> = {
  markdown: (p) => mdBody(String(p.text ?? p.body ?? "")),
  md: (p) => mdBody(String(p.text ?? p.body ?? "")),
  text: (p) => mdBody(String(p.text ?? p.body ?? "")),
  html: (p) => stripInfoTiquete(String(p.html ?? p.body ?? p.content ?? "")),
  body: (p) => stripInfoTiquete(String(p.html ?? p.body ?? p.content ?? "")),
  code: (p) => codeBlock(String(p.code ?? p.text ?? p.sql ?? ""), String(p.language ?? "sql")),
  sql: (p) => codeBlock(String(p.code ?? p.text ?? p.sql ?? ""), String(p.language ?? "sql")),
  table: (p) => dataTable((p.headers as string[]) ?? [], (p.rows as unknown[][]) ?? []),
  image: (p) => {
    const src = esc(p.url ?? p.src ?? "");
    const alt = esc(p.alt ?? p.caption ?? "");
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding:8px 0;">
      <a href="${src}" target="_blank" style="text-decoration:none;"><img src="${src}" alt="${alt}" style="display:block;width:100%;max-width:920px;height:auto;border:1px solid ${C.border};border-radius:6px;"/></a>
      ${alt ? `<div style="${FONT}font-size:11px;color:${C.muted};margin-top:6px;">${alt}</div>` : ""}</td></tr></table>`;
  },
  img: (p) => DRIVERS.image(p),
  badge: badgePill,
  chip: badgePill,
  url: (p) => {
    const href = esc(p.href ?? p.url ?? "#");
    return bulletRow("mdi:link-variant", `<a href="${href}" target="_blank" rel="noreferrer" style="color:${C.blue};font-weight:bold;">${esc(p.label ?? href)}</a>`);
  },
  link: (p) => DRIVERS.url(p),
  accordion: (p) => {
    const body = String(p.html ?? "") || (p.code ? codeBlock(String(p.code), String(p.language ?? "sql")) : "");
    return `<details style="margin:6px 0;border:1px solid ${C.border};border-radius:6px;padding:8px 12px;background:${C.zebra};">
      <summary style="${FONT}font-size:13px;font-weight:bold;color:${C.navy};cursor:pointer;">${esc(p.title ?? "Detalle")}</summary>
      <div style="margin-top:8px;">${body}</div></details>`;
  },
  "cambio-bd": (p) => {
    const head = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 6px 0;"><tr>
      <td width="22" style="vertical-align:top;padding-top:2px;">${icon("mdi:table", C.muted)}</td>
      <td style="${FONT}font-size:13px;color:${C.text};line-height:1.5;"><b>${codeChip(esc(p.tabla ?? ""))}</b> · ${esc(p.registro ?? "")}</td></tr></table>`;
    const intencion = p.intencion ? `<p style="margin:0 0 6px;color:${C.muted};">${inlineMd(String(p.intencion))}</p>` : "";
    const sqlSrc = String(p.sql ?? "");
    return head + intencion + (sqlSrc ? codeBlock(sqlSrc, "sql") : "");
  },
};
DRIVERS["cambios_bd"] = DRIVERS["cambio-bd"];

export function renderBlockBody(block: TkBlock): string {
  const kind = String(block.kind ?? "text").toLowerCase();
  const driver = DRIVERS[kind];
  if (!driver) return `<pre style="margin:0;${MONO}font-size:12px;color:${C.chipFg};white-space:pre-wrap;">${esc(JSON.stringify(block.payload ?? {}, null, 2))}</pre>`;
  return driver(block.payload ?? {});
}

const SECTION_META: Record<string, { icon: string; title: string }> = {
  markdown: { icon: "mdi:clipboard-text-outline", title: "Solicitud y objetivo" },
  md: { icon: "mdi:clipboard-text-outline", title: "Solicitud y objetivo" },
  text: { icon: "mdi:clipboard-text-outline", title: "Solicitud y objetivo" },
  table: { icon: "mdi:table-large", title: "Tabla" },
  code: { icon: "mdi:code-tags", title: "Código" },
  sql: { icon: "mdi:database-search-outline", title: "SQL" },
  image: { icon: "mdi:eye-outline", title: "Evidencia" },
  img: { icon: "mdi:eye-outline", title: "Evidencia" },
  url: { icon: "mdi:link-variant", title: "Enlaces" },
  link: { icon: "mdi:link-variant", title: "Enlaces" },
  accordion: { icon: "mdi:unfold-more-horizontal", title: "Detalle" },
  "cambio-bd": { icon: "mdi:database-cog-outline", title: "Cambios en base de datos" },
  cambios_bd: { icon: "mdi:database-cog-outline", title: "Cambios en base de datos" },
  html: { icon: "mdi:file-document-outline", title: "Detalle" },
  body: { icon: "mdi:file-document-outline", title: "Detalle" },
};

function sortBlocks(blocks: TkBlock[]): TkBlock[] {
  return blocks.slice().sort((a, b) => (a.sortKey ?? 0) - (b.sortKey ?? 0));
}

/* Tablas "Información del tiquete": datos inferibles desde la cabecera, no se renderizan. */
function isInfoTiquete(b: TkBlock): boolean {
  const title = String((b.payload && (b.payload.title as string)) || "").toLowerCase();
  return title.includes("información del tiquete") || title.includes("informacion del tiquete");
}

/**
 * Elimina del HTML passthrough (diligencias antiguas guardadas como kind:"html")
 * las secciones tarjeta cuyo título es "Información del tiquete". Localiza el
 * <tr><td style="padding:0 0 16px 0;"> que envuelve la tarjeta y recorta hasta
 * el cierre balanceado de su <table>.
 */
const SECTION_OPEN = '<tr><td style="padding:0 0 16px 0;">';
export function stripInfoTiquete(html: string): string {
  const rx = /informaci(?:ó|&oacute;|o)n del tiquete/i;
  let out = html;
  for (let guard = 0; guard < 10; guard++) {
    const m = rx.exec(out);
    if (!m) break;
    const start = out.lastIndexOf(SECTION_OPEN, m.index);
    if (start < 0) break;
    // balancea <table…> / </table> desde el inicio de la sección
    let depth = 0;
    let i = start;
    let end = -1;
    const tag = /<table\b|<\/table>/gi;
    tag.lastIndex = start;
    let t: RegExpExecArray | null;
    while ((t = tag.exec(out))) {
      depth += t[0].toLowerCase() === "</table>" ? -1 : 1;
      if (depth === 0) { i = tag.lastIndex; break; }
    }
    if (depth !== 0) break;
    const close = out.indexOf("</td></tr>", i);
    end = close >= 0 ? close + "</td></tr>".length : i;
    out = out.slice(0, start) + out.slice(end);
  }
  return out;
}

function commitsTable(commits: Record<string, unknown>[]): string {
  const rows = commits.map((c) => {
    const hash = String(c.hash ?? "");
    const short = esc(hash.slice(0, 9));
    const url = esc(tkCommitGithubUrl(String(c.proyecto ?? ""), hash));
    const hashCell = hash
      ? `<a href="${url}" target="_blank" rel="noopener noreferrer" style="${MONO}font-size:12px;color:${C.blue};text-decoration:none;">${short}</a>`
      : short;
    return [
      hashCell,
      esc(String(c.proyecto ?? "")),
      inlineMd(String(c.descripcion ?? "")),
      pill("+" + Number(c.insCount ?? 0), C.green, "#e9f7ee"),
      pill("−" + Number(c.delCount ?? 0), "#c0392b", "#fdecea"),
      esc(`${Number(c.minutos ?? 0)} min`),
    ];
  });
  return dataTable(["Commit", "Proyecto", "Descripción", "Ins", "Del", "Tiempo"], rows, { raw: true });
}

function timeRow(label: string, hint: string, mins: number, bold = false): string {
  const style = bold
    ? `${FONT}font-size:14px;color:${C.navy};font-weight:bold;padding:8px 0;`
    : `${FONT}font-size:13px;color:${C.text};padding:6px 0;border-bottom:1px solid ${C.border};`;
  return `<tr><td style="${style}">${esc(label)}${hint ? ` <span style="color:${C.muted};">(${esc(hint)})</span>` : ""}</td>
    <td align="right" style="${style}white-space:nowrap;">${mins} min</td></tr>`;
}


/** Cuerpo del ticket (filas <tr> del contenedor de 680px). */
export function renderTicketRows(tk: Record<string, unknown>): string {
  const rows: string[] = [];
  const space = String(tk.space ?? "").toUpperCase() || "PATYIA";
  const iticket = esc(tk.iticket ?? "");
  const titulo = esc(tk.titulo ?? tk.title ?? "");
  const creadoPor = esc(formatTiqueteCreadoPor(String(tk.solicitante ?? "")));
  const documentadoPor = esc(formatDocumentadoPor(tk));
  const estado = String(tk.estado ?? "").toLowerCase();

  const content = sortBlocks((tk.content as TkBlock[]) ?? []).filter((b) => !isInfoTiquete(b));
  const badges = content.filter((b) => ["badge", "chip"].includes(String(b.kind).toLowerCase()));
  const blocks = content.filter((b) => !["badge", "chip"].includes(String(b.kind).toLowerCase()));

  // Hero — badge TK (blanco/negro) primero; solicitante sin fecha
  const heroBadge = (b: TkBlock) =>
    `<span style="${FONT}display:inline-block;font-size:11px;font-weight:bold;color:#cfe4fa;border:1px solid #3d6c9c;border-radius:12px;padding:2px 10px;margin:0 6px 6px 0;background:rgba(255,255,255,0.06);">${esc((b.payload && (b.payload.label ?? b.payload.text)) ?? "")}</span>`;
  const badgesHtml = badges.length ? `<div style="margin-top:10px;">${badges.map(heroBadge).join("")}</div>` : "";
  const tkBadge = iticket
    ? `<span style="${FONT}display:inline-block;font-size:11px;font-weight:700;color:#111111;background:#ffffff;border-radius:4px;padding:3px 10px;margin:0 0 8px 0;letter-spacing:0.3px;">${iticket}</span>`
    : "";
  rows.push(`<tr><td style="padding:0 0 16px 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:680px;max-width:680px;border-radius:8px;background:${C.navy};">
      <tr><td style="padding:18px 20px;">
        ${tkBadge}
        <div style="${FONT}font-size:11px;color:#7fb4e6;letter-spacing:1px;text-transform:uppercase;">${esc(space)}</div>
        <div style="${FONT}font-size:18px;color:#ffffff;font-weight:bold;margin-top:3px;line-height:1.3;">${titulo}</div>
        ${creadoPor ? `<div style="${FONT}font-size:12px;color:#a9c7e6;margin-top:4px;">${creadoPor}</div>` : ""}
        ${documentadoPor ? `<div style="${FONT}font-size:12px;color:#a9c7e6;margin-top:2px;">${documentadoPor}</div>` : ""}
        ${badgesHtml}
      </td></tr></table></td></tr>`);

  // Resumen (el estado se infiere de los chips de la cabecera, sin alerts)
  if (tk.resumen) rows.push(plainCard(inlineMd(String(tk.resumen))));

  const est = Number(tk.estimacionMinutos ?? 0);
  const dil = Number(tk.diligenciaMinutos ?? 0);
  const com = Number(tk.commitMinutos ?? 0);
  const extra = Number(tk.extraMinutos ?? 0);
  const total = Number(tk.tiempoTotalMinutos ?? dil + com);

  // Bloques de contenido raíz → secciones
  for (const b of blocks) {
    const kind = String(b.kind ?? "text").toLowerCase();
    const meta = SECTION_META[kind] || { icon: "mdi:file-document-outline", title: "Detalle" };
    const title = String((b.payload && (b.payload.title as string)) || meta.title);
    rows.push(section(meta.icon, esc(title), renderBlockBody(b)));
  }

  // Contextos: asesor/horario se infieren de la cabecera, no se emiten como sección.
  // Sus bloques de contenido se renderizan como secciones normales y sus commits
  // se agrupan con los commits raíz en una sola sección.
  const contexts = (tk.contexts as Record<string, unknown>[]) ?? [];
  const allCommits: Record<string, unknown>[] = [];
  for (const ctx of contexts) {
    for (const b of sortBlocks((ctx.content as TkBlock[]) ?? []).filter((x) => !isInfoTiquete(x))) {
      const kind = String(b.kind ?? "text").toLowerCase();
      const meta = SECTION_META[kind] || { icon: "mdi:file-document-outline", title: "Detalle" };
      const title = String((b.payload && (b.payload.title as string)) || meta.title);
      rows.push(section(meta.icon, esc(title), renderBlockBody(b)));
    }
    allCommits.push(...(((ctx.commits as Record<string, unknown>[]) ?? [])));
  }
  allCommits.push(...(((tk.rootCommits as Record<string, unknown>[]) ?? [])));
  if (allCommits.length) rows.push(section("mdi:source-commit", "Commits que entregan la solución", commitsTable(allCommits)));

  // Resumen de tiempos — usa tk.tiempos (name + detail + minutos) si existe;
  // los ítems con minutos <= 0 no se muestran. Fallback: tiempos derivados del ticket.
  // Si una diligencia antigua (bloque html) ya trae su propio "Resumen de tiempos", no se duplica.
  const embeddedTiempos = blocks.some((b) => {
    const kind = String(b.kind ?? "").toLowerCase();
    if (kind !== "html" && kind !== "body") return false;
    return /resumen de tiempos/i.test(String((b.payload && (b.payload.html ?? b.payload.body ?? b.payload.content)) ?? ""));
  });
  const tiempos = ((tk.tiempos as Record<string, unknown>[]) ?? [])
    .map((t) => ({ name: String(t.name ?? ""), detail: String(t.detail ?? ""), minutos: Math.round(Number(t.minutos ?? 0)) }))
    .filter((t) => t.name && t.minutos > 0);
  let timeRows = "";
  let timeTotal = 0;
  if (tiempos.length) {
    timeRows = tiempos.map((t) => timeRow(t.name, t.detail, t.minutos)).join("");
    timeTotal = tiempos.reduce((s, t) => s + t.minutos, 0);
  } else if (est || dil || com || extra) {
    const derived = [
      { name: "Estimación", detail: "tiempo previsto", minutos: est },
      { name: "Documentación", detail: "diligencia y cierre del ticket", minutos: dil },
      { name: "Tiempo en commits", detail: "código entregado en repositorio", minutos: com },
      { name: "Tiempo extra", detail: "ajustes fuera del alcance inicial", minutos: extra },
    ].filter((t) => t.minutos > 0);
    timeRows = derived.map((t) => timeRow(t.name, t.detail, t.minutos)).join("");
    timeTotal = total + extra;
  }
  if (timeRows && !embeddedTiempos) {
    const body = `<p style="margin:0 0 8px;color:${C.muted};">Distribución del esfuerzo según la naturaleza del trabajo.</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
        ${timeRows}
        ${timeRow("Total", "", timeTotal, true)}
      </table>`;
    rows.push(section("mdi:clock-outline", "Resumen de tiempos", body));
  }

  return rows.join("\n");
}

/** HTML para incrustar en la vista (contenedor centrado sobre fondo claro). */
export function renderTicketViewHtml(tk: Record<string, unknown>): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.pageBg};padding:18px 0;${FONT}">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:680px;max-width:680px;">
        ${renderTicketRows(tk)}
      </table></td></tr></table>`;
}

/** Documento HTML completo, listo para pegar en un correo. */
export function renderTicketEmailHtml(tk: Record<string, unknown>): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta http-equiv="Content-Type" content="text/html;charset=utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${esc(tk.iticket ?? "")} · ${esc(tk.titulo ?? "")}</title></head><body style="margin:0;padding:0;background:${C.pageBg};">${renderTicketViewHtml(tk)}</body></html>`;
}
