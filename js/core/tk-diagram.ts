/** Diagramas TK — fuente en BD, render vía mermaid.ink (default) con fallback Kroki. */

export type DiagramEngine = "mermaid" | "plantuml";
export type ThemeMode = "light" | "dark";

const FLOWCHART_INIT = {
  flowchart: {
    curve: "stepAfter",
    htmlLabels: true,
    nodeSpacing: 44,
    rankSpacing: 52,
    padding: 18,
  },
};

const SEQUENCE_INIT = {
  sequence: { mirrorActors: false, messageAlign: "center", noteAlign: "left" },
};

const ER_INIT = {
  er: { layoutDirection: "TB", minEntityWidth: 120, minEntityHeight: 80 },
};

const TK_MERMAID_LIGHT = {
  theme: "base",
  themeVariables: {
    background: "transparent",
    mainBkg: "transparent",
    primaryColor: "#e8f4ff",
    primaryTextColor: "#0a2540",
    primaryBorderColor: "#1e90ff",
    secondaryColor: "#f0f7ff",
    secondaryTextColor: "#0a2540",
    secondaryBorderColor: "#6366f1",
    tertiaryColor: "#fff7ed",
    tertiaryTextColor: "#92400e",
    tertiaryBorderColor: "#f59e0b",
    lineColor: "#1e90ff",
    textColor: "#0a2540",
    nodeBorder: "#1e90ff",
    clusterBkg: "transparent",
    titleColor: "#0a2540",
    actorBorder: "#1e90ff",
    actorBkg: "#f0f7ff",
    actorTextColor: "#0a2540",
    actorLineColor: "#6366f1",
    signalColor: "#1e90ff",
    signalTextColor: "#0a2540",
    labelBoxBkgColor: "#f0f7ff",
    labelBoxBorderColor: "#1e90ff",
    labelTextColor: "#0a2540",
    loopTextColor: "#0a2540",
    noteBorderColor: "#6366f1",
    noteBkgColor: "#f0f7ff",
    noteTextColor: "#0a2540",
    activationBorderColor: "#1e90ff",
    activationBkgColor: "#e8f4ff",
    sequenceNumberColor: "#ffffff",
    entityBorder: "#1e90ff",
    entityBkg: "#f0f7ff",
    attributeBackgroundColorOdd: "#ffffff",
    attributeBackgroundColorEven: "#f0f7ff",
  },
  ...FLOWCHART_INIT,
  ...SEQUENCE_INIT,
  ...ER_INIT,
};

const TK_MERMAID_DARK = {
  theme: "base",
  themeVariables: {
    background: "transparent",
    mainBkg: "transparent",
    primaryColor: "#1a3a5c",
    primaryTextColor: "#e8f4ff",
    primaryBorderColor: "#1e90ff",
    secondaryColor: "#0f2236",
    secondaryTextColor: "#e8f4ff",
    secondaryBorderColor: "#6366f1",
    tertiaryColor: "#3d2a14",
    tertiaryTextColor: "#fde68a",
    tertiaryBorderColor: "#f59e0b",
    lineColor: "#1e90ff",
    textColor: "#e8f4ff",
    nodeBorder: "#1e90ff",
    clusterBkg: "transparent",
    titleColor: "#e8f4ff",
    actorBorder: "#1e90ff",
    actorBkg: "#0f2236",
    actorTextColor: "#e8f4ff",
    actorLineColor: "#6366f1",
    signalColor: "#1e90ff",
    signalTextColor: "#9ec5eb",
    labelBoxBkgColor: "#0f2236",
    labelBoxBorderColor: "#1e90ff",
    labelTextColor: "#e8f4ff",
    loopTextColor: "#9ec5eb",
    noteBorderColor: "#6366f1",
    noteBkgColor: "#1a3a5c",
    noteTextColor: "#e8f4ff",
    activationBorderColor: "#1e90ff",
    activationBkgColor: "#1a3a5c",
    sequenceNumberColor: "#0b2e4e",
    entityBorder: "#1e90ff",
    entityBkg: "#0f2236",
    attributeBackgroundColorOdd: "#0f2236",
    attributeBackgroundColorEven: "#1a3a5c",
  },
  ...FLOWCHART_INIT,
  ...SEQUENCE_INIT,
  ...ER_INIT,
};

export function utf8ToBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_");
}

export function wrapMermaid(body: string, mode: ThemeMode = "light"): string {
  const init = mode === "dark" ? TK_MERMAID_DARK : TK_MERMAID_LIGHT;
  const trimmed = String(body || "").trim();
  if (/^%%\{init:/i.test(trimmed)) return trimmed;
  return `%%{init: ${JSON.stringify(init)}}%%\n${trimmed}`;
}

export function mermaidInkUrl(diagram: string, format: "img" | "svg" = "svg"): string {
  return `https://mermaid.ink/${format}/${utf8ToBase64Url(String(diagram).trim())}`;
}

export function diagramEngine(payload: Record<string, unknown>): DiagramEngine {
  const e = String(payload.engine ?? payload.format ?? "mermaid").toLowerCase();
  return e === "plantuml" || e === "puml" ? "plantuml" : "mermaid";
}

/** Texto del diagrama según tema (sourceDark opcional en payload). */
export function resolveDiagramSource(payload: Record<string, unknown>, dark: boolean): string {
  const engine = diagramEngine(payload);
  const raw = String(
    (dark && payload.sourceDark ? payload.sourceDark : payload.source ?? payload.text ?? payload.mermaid ?? "") || "",
  ).trim();
  if (!raw) return "";
  if (engine !== "mermaid") return raw;
  if (payload.sourceDark || /^%%\{init:/i.test(raw)) return raw;
  return wrapMermaid(raw, dark ? "dark" : "light");
}

export function mermaidInkDiagramUrl(payload: Record<string, unknown>, dark: boolean, format: "svg" | "img" = "svg"): string {
  const source = resolveDiagramSource(payload, dark);
  return source ? mermaidInkUrl(source, format) : "";
}

const KROKI_BASE = "https://kroki.io";

/** POST Kroki → blob URL (SVG). */
export async function fetchKrokiBlobUrl(engine: DiagramEngine, source: string): Promise<string> {
  const res = await fetch(`${KROKI_BASE}/${engine}/svg`, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: source,
  });
  if (!res.ok) throw new Error(`Kroki HTTP ${res.status}`);
  return URL.createObjectURL(await res.blob());
}
