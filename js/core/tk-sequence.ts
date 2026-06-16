/** Especificación y layout SVG de diagramas de secuencia TK (sin Mermaid). */

export interface SequenceActor {
  id: string;
  label: string;
  kind?: "actor" | "participant";
  icon?: string;
  color?: string;
}

export interface SequenceMessage {
  id: string;
  from: string;
  to: string;
  label: string;
  kind?: "sync" | "async" | "self";
  step?: number;
}

export interface SequenceAltBranch {
  condition: string;
  messages: SequenceMessage[];
}

export interface SequenceSpec {
  title?: string;
  subtitle?: string;
  actors: SequenceActor[];
  preamble?: SequenceMessage[];
  alt?: { branches: SequenceAltBranch[] };
  epilogue?: SequenceMessage[];
}

export interface SequenceTheme {
  text: string;
  muted: string;
  grid: string;
  panel: string;
  border: string;
  accent: string;
  altFill: string;
  altBorder: string;
}

export interface SequenceActorLayout {
  id: string;
  x: number;
  y: number;
  label: string;
  icon: string;
  color: string;
  kind: "actor" | "participant";
}

export interface SequenceMessageLayout {
  id: string;
  step: number;
  label: string;
  kind: "sync" | "async" | "self";
  y: number;
  fromX: number;
  toX: number;
  path: string;
  branch?: string;
  branchFirst?: boolean;
}

export interface SequenceLayout {
  width: number;
  height: number;
  title?: string;
  subtitle?: string;
  titleY: number;
  subtitleY: number;
  actors: SequenceActorLayout[];
  lifelines: { id: string; x: number; y1: number; y2: number }[];
  messages: SequenceMessageLayout[];
  altBox?: { x: number; y: number; w: number; h: number; label: string };
}

const DEFAULT_COLORS = ["#1e90ff", "#6366f1", "#0ea5e9"];
const DEFAULT_ICONS = ["mdi:account", "mdi:robot-outline", "simple-icons:openai"];

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
}

function iconifyUrl(icon: string, color: string): string {
  const path = icon.includes(":") ? icon.replace(":", "/") : `mdi/${icon}`;
  return `https://api.iconify.design/${path}.svg?color=${encodeURIComponent(color)}`;
}

export function sequenceThemeLight(): SequenceTheme {
  return {
    text: "#0b2e4e",
    muted: "#64748b",
    grid: "rgba(100,116,139,0.18)",
    panel: "rgba(248,250,252,0.96)",
    border: "rgba(30,144,255,0.18)",
    accent: "#1e90ff",
    altFill: "rgba(30,144,255,0.04)",
    altBorder: "rgba(30,144,255,0.35)",
  };
}

export function sequenceThemeDark(): SequenceTheme {
  return {
    text: "#e2e8f0",
    muted: "#94a3b8",
    grid: "rgba(148,163,184,0.16)",
    panel: "rgba(15,23,42,0.72)",
    border: "rgba(30,144,255,0.28)",
    accent: "#38bdf8",
    altFill: "rgba(30,144,255,0.08)",
    altBorder: "rgba(56,189,248,0.42)",
  };
}

function readMessage(raw: Record<string, unknown>, fallbackStep: number): SequenceMessage {
  return {
    id: String(raw.id ?? `m${fallbackStep}`),
    from: String(raw.from ?? ""),
    to: String(raw.to ?? ""),
    label: String(raw.label ?? ""),
    kind: (raw.kind as SequenceMessage["kind"]) ?? "sync",
    step: Number(raw.step ?? fallbackStep),
  };
}

function readActor(raw: Record<string, unknown>, i: number): SequenceActor {
  return {
    id: String(raw.id ?? `a${i}`),
    label: String(raw.label ?? `Actor ${i + 1}`),
    kind: (raw.kind as SequenceActor["kind"]) ?? "participant",
    icon: String(raw.icon ?? DEFAULT_ICONS[i % DEFAULT_ICONS.length]),
    color: String(raw.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]),
  };
}

export function sequenceSpecFromPayload(payload: unknown): SequenceSpec | null {
  const p = asRecord(payload);
  const seq = asRecord(p.sequence ?? p);
  const rawActors = (seq.actors as Record<string, unknown>[]) ?? [];
  if (!rawActors.length) return null;

  const actors = rawActors.map(readActor);
  const preamble = ((seq.preamble as Record<string, unknown>[]) ?? []).map((m, i) => readMessage(m, i + 1));
  const epilogue = ((seq.epilogue as Record<string, unknown>[]) ?? []).map((m, i) =>
    readMessage(m, preamble.length + 10 + i),
  );

  let alt: SequenceSpec["alt"];
  const rawAlt = asRecord(seq.alt);
  const branches = (rawAlt.branches as Record<string, unknown>[]) ?? [];
  if (branches.length) {
    alt = {
      branches: branches.map((b) => ({
        condition: String(b.condition ?? ""),
        messages: ((b.messages as Record<string, unknown>[]) ?? []).map((m, i) => readMessage(m, i + 1)),
      })),
    };
  }

  return {
    title: String(seq.title ?? p.title ?? ""),
    subtitle: String(seq.subtitle ?? p.subtitle ?? ""),
    actors,
    preamble,
    alt,
    epilogue,
  };
}

function actorX(index: number, count: number, padL: number, padR: number, W: number): number {
  if (count <= 1) return W / 2;
  const innerW = W - padL - padR;
  return padL + (innerW * index) / (count - 1);
}

function selfPath(x: number, y: number, w = 56): string {
  const top = y - 10;
  return `M ${x} ${y} L ${x + w} ${y} L ${x + w} ${top} L ${x + 6} ${top} L ${x + 6} ${y - 2}`;
}

function arrowPath(fromX: number, toX: number, y: number, kind: "sync" | "async" | "self"): string {
  if (kind === "self" || fromX === toX) return selfPath(fromX, y);
  const dir = toX >= fromX ? 1 : -1;
  const x1 = fromX + dir * 8;
  const x2 = toX - dir * 10;
  return `M ${x1} ${y} L ${x2} ${y}`;
}

export function computeSequenceLayout(spec: SequenceSpec): SequenceLayout {
  const W = 820;
  const padL = 56;
  const padR = 56;
  const padT = 78;
  const padB = 28;
  const rowH = 54;
  const title = spec.title ?? "";
  const subtitle = spec.subtitle ?? "";
  const titleY = title ? 22 : 12;
  const subtitleY = title ? 38 : 24;
  const headerY = padT - 18;

  const actorLayouts: SequenceActorLayout[] = spec.actors.map((a, i) => ({
    id: a.id,
    x: actorX(i, spec.actors.length, padL, padR, W),
    y: headerY,
    label: a.label,
    icon: a.icon ?? DEFAULT_ICONS[i % DEFAULT_ICONS.length],
    color: a.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length],
    kind: a.kind ?? "participant",
  }));

  const xMap = Object.fromEntries(actorLayouts.map((a) => [a.id, a.x]));
  const messages: SequenceMessageLayout[] = [];
  let row = 0;
  let stepCounter = 1;

  const pushMsg = (m: SequenceMessage, branch?: string, branchFirst = false) => {
    const kind = m.kind ?? (m.from === m.to ? "self" : "sync");
    const y = padT + row * rowH;
    const fromX = xMap[m.from] ?? padL;
    const toX = xMap[m.to] ?? fromX;
    messages.push({
      id: m.id,
      step: m.step ?? stepCounter++,
      label: m.label,
      kind,
      y,
      fromX,
      toX,
      path: arrowPath(fromX, toX, y, kind),
      branch,
      branchFirst,
    });
    row += 1;
  };

  (spec.preamble ?? []).forEach((m) => pushMsg(m));

  let altBox: SequenceLayout["altBox"];
  if (spec.alt?.branches?.length) {
    const altStartRow = row;
    spec.alt.branches.forEach((branch, bi) => {
      branch.messages.forEach((m, mi) => {
        pushMsg(m, branch.condition, mi === 0);
      });
      if (bi < spec.alt!.branches.length - 1) row += 0;
    });
    const altEndRow = row;
    const y1 = padT + altStartRow * rowH - 18;
    const y2 = padT + altEndRow * rowH + 14;
    altBox = {
      x: padL - 12,
      y: y1,
      w: W - padL - padR + 24,
      h: y2 - y1,
      label: "alt",
    };
  }

  (spec.epilogue ?? []).forEach((m) => pushMsg(m));

  const lifelineY2 = padT + row * rowH + 8;
  const lifelines = actorLayouts.map((a) => ({
    id: a.id,
    x: a.x,
    y1: a.y + 22,
    y2: lifelineY2,
  }));

  const H = lifelineY2 + padB;

  return {
    width: W,
    height: H,
    title: title || undefined,
    subtitle: subtitle || undefined,
    titleY,
    subtitleY,
    actors: actorLayouts,
    lifelines,
    messages,
    altBox,
  };
}

export function renderSequenceSvg(spec: SequenceSpec, theme: SequenceTheme): string {
  const layout = computeSequenceLayout(spec);
  const uid = `tk-seq-${Math.random().toString(36).slice(2, 8)}`;
  const { width: W, height: H } = layout;

  const actorBoxes = layout.actors
    .map((a) => {
      const bw = a.kind === "actor" ? 92 : 108;
      const bx = a.x - bw / 2;
      const icon = iconifyUrl(a.icon, a.color);
      return `<g>
        <rect x="${bx}" y="${a.y - 14}" width="${bw}" height="36" rx="8" fill="${theme.panel}" stroke="${a.color}" stroke-width="1.2"/>
        <image href="${icon}" x="${a.x - 28}" y="${a.y - 10}" width="16" height="16"/>
        <text x="${a.x + (a.kind === "actor" ? -6 : 2)}" y="${a.y + 8}" text-anchor="middle" fill="${theme.text}" font-size="11" font-weight="700" font-family="Tahoma,Arial,sans-serif">${a.label}</text>
      </g>`;
    })
    .join("");

  const lifelines = layout.lifelines
    .map(
      (l) =>
        `<line x1="${l.x}" y1="${l.y1}" x2="${l.x}" y2="${l.y2}" stroke="${theme.grid}" stroke-width="1.2" stroke-dasharray="5 4"/>`,
    )
    .join("");

  const altSvg = layout.altBox
    ? `<rect x="${layout.altBox.x}" y="${layout.altBox.y}" width="${layout.altBox.w}" height="${layout.altBox.h}" rx="10" fill="${theme.altFill}" stroke="${theme.altBorder}" stroke-width="1.2" stroke-dasharray="6 4"/>
       <text x="${layout.altBox.x + 10}" y="${layout.altBox.y + 14}" fill="${theme.accent}" font-size="10" font-weight="700" font-family="Tahoma,Arial,sans-serif">${layout.altBox.label}</text>`
    : "";

  const msgs = layout.messages
    .map((m) => {
      const dash = m.kind === "async" ? ' stroke-dasharray="6 4"' : "";
      const branchLabel = m.branchFirst
        ? `<text x="${layout.altBox?.x ? layout.altBox.x + 14 : 20}" y="${m.y - 6}" fill="${theme.muted}" font-size="9" font-family="Tahoma,Arial,sans-serif">[${m.branch}]</text>`
        : "";
      const arrowHead =
        m.kind === "self"
          ? `<polygon points="${m.toX + 56},${m.y} ${m.toX + 6},${m.y - 2} ${m.toX + 6},${m.y + 2}" fill="${theme.accent}"/>`
          : `<polygon points="${m.toX >= m.fromX ? m.toX - 10 : m.toX + 10},${m.y - 4} ${m.toX >= m.fromX ? m.toX - 10 : m.toX + 10},${m.y + 4} ${m.toX >= m.fromX ? m.toX - 2 : m.toX + 2},${m.y}" fill="${theme.accent}"/>`;
      return `<g>
        ${branchLabel}
        <circle cx="18" cy="${m.y}" r="9" fill="${theme.accent}"/>
        <text x="18" y="${m.y + 4}" text-anchor="middle" fill="#fff" font-size="9" font-weight="700" font-family="Tahoma,Arial,sans-serif">${m.step}</text>
        <path d="${m.path}" fill="none" stroke="${theme.accent}" stroke-width="1.6"${dash}/>
        ${arrowHead}
        <rect x="${W / 2 - 170}" y="${m.y - 11}" width="340" height="22" rx="4" fill="${theme.panel}" stroke="${theme.border}" stroke-width="0.8"/>
        <text x="${W / 2}" y="${m.y + 4}" text-anchor="middle" fill="${theme.text}" font-size="10" font-family="Consolas,Menlo,monospace">${m.label.replace(/</g, "&lt;")}</text>
      </g>`;
    })
    .join("");

  const titleSvg = layout.title
    ? `<text x="${W / 2}" y="${layout.titleY}" text-anchor="middle" fill="${theme.text}" font-size="13" font-weight="700" font-family="Tahoma,Arial,sans-serif">${layout.title}</text>`
    : "";
  const subtitleSvg = layout.subtitle
    ? `<text x="${W / 2}" y="${layout.subtitleY}" text-anchor="middle" fill="${theme.muted}" font-size="11" font-family="Tahoma,Arial,sans-serif">${layout.subtitle}</text>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${layout.title || "Diagrama de secuencia"}" style="width:100%;max-width:${W}px;height:auto;display:block">
    <defs>
      <linearGradient id="${uid}-panel" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="rgba(30,144,255,0.06)"/>
        <stop offset="100%" stop-color="${theme.panel}"/>
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="${W}" height="${H}" rx="12" fill="url(#${uid}-panel)" stroke="${theme.border}" stroke-width="1"/>
    ${titleSvg}${subtitleSvg}
    ${actorBoxes}${lifelines}${altSvg}${msgs}
  </svg>`;
}

/** Spec predefinida TK-1431662 — resolución de modelo por turno. */
export function tk1431662SequenceSpec(): SequenceSpec {
  return {
    title: "Resolución del modelo por turno",
    subtitle: "Clasificación operativa → MODELO en BD → respuesta final",
    actors: [
      { id: "U", label: "Usuario", kind: "actor", icon: "mdi:account", color: "#64748b" },
      { id: "P", label: "PatyIA", kind: "participant", icon: "mdi:robot-outline", color: "#1e90ff" },
      { id: "O", label: "OpenAI", kind: "participant", icon: "simple-icons:openai", color: "#10a37f" },
    ],
    preamble: [
      { id: "m1", from: "U", to: "P", label: "Mensaje del usuario", step: 1 },
      { id: "m2", from: "P", to: "O", label: "clasificar · PR_TIPO_CONSULTAS · gpt-4.1-nano", step: 2 },
      { id: "m3", from: "O", to: "P", label: "tipo_consulta (JSON)", kind: "async", step: 3 },
      { id: "m4", from: "P", to: "P", label: "resolverPorTipo · MODELO en BD", kind: "self", step: 4 },
    ],
    alt: {
      branches: [
        {
          condition: "MODELO en fila",
          messages: [{ id: "m5", from: "P", to: "O", label: "responses.create(MODELO)", step: 5 }],
        },
        {
          condition: "fallback system-prompts",
          messages: [{ id: "m6", from: "P", to: "O", label: "responses.create(modeloConversacion)", step: 6 }],
        },
      ],
    },
    epilogue: [
      { id: "m7", from: "O", to: "P", label: "respuesta", kind: "async", step: 7 },
      { id: "m8", from: "P", to: "P", label: "log turno · modelo + tokens + costo", kind: "self", step: 8 },
    ],
  };
}
