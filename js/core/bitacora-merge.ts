/** Consolidar bitácoras de varios spaces (General = PatyIA + Clientes). */
import { spacesFor, projectLabel } from "./tk-spaces.ts";

const reDate = /(\d{4}-\d{2}-\d{2})/;

type LayoutNode = {
  type?: string;
  title?: string;
  segmentId?: string;
  checkKey?: string;
  children?: LayoutNode[];
  _space?: string;
};

type BitacoraDay = {
  id: string;
  date: string;
  title: string;
  spaces: string[];
  children: LayoutNode[];
};

function spaceShortLabel(space: string): string {
  if (space === "patyia") return "PatyIA";
  if (space === "clientesis") return "Clientes";
  return space;
}

function daySubtitle(title: string): string {
  return title.replace(reDate, "").replace(/^\s*[—-]\s*/, "").trim();
}

function remapSegmentIds(nodes: LayoutNode[] | undefined, space: string): LayoutNode[] {
  return (nodes || []).map((n) => {
    if (!n) return n;
    if (n.type === "md" || n.type === "sql" || n.type === "video") {
      return { ...n, segmentId: space + "::" + n.segmentId, _space: space };
    }
    if (n.children?.length) {
      return { ...n, children: remapSegmentIds(n.children, space), _space: space };
    }
    return { ...n, _space: space };
  });
}

function normalizeBitacoraSegments(data: { segments?: Record<string, unknown>; md?: Record<string, unknown>; sql?: Record<string, unknown>; video?: Record<string, unknown> }): Record<string, unknown> {
  if (data.segments && Object.keys(data.segments).length) return data.segments;
  return { ...(data.md || {}), ...(data.sql || {}), ...(data.video || {}) };
}

function prefixSegments(segments: Record<string, unknown>, space: string): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(segments || {})) out[space + "::" + k] = v;
  return out;
}

function extractDaysFromLayout(layout: { nodes?: LayoutNode[] }, space: string): BitacoraDay[] {
  const days: BitacoraDay[] = [];
  const seen = new Set<string>();

  function collect(nodes: LayoutNode[] | undefined) {
    (nodes || []).forEach((n) => {
      if (!n) return;
      const m = reDate.exec(n.title || "");
      const isLeaf = n.type === "md" || n.type === "sql" || n.type === "widget" || n.type === "video";
      const isDay = n.type === "day" || (!!m && !isLeaf && !!(n.children && n.children.length));
      if (isDay) {
        const date = m ? m[1] : "";
        const id = date || space + ":" + (n.title || "");
        if (!seen.has(id)) {
          seen.add(id);
          days.push({
            id,
            date,
            title: n.title || "Día",
            spaces: [space],
            children: remapSegmentIds(n.children, space),
          });
        }
      } else if (n.children?.length) collect(n.children);
    });
  }

  collect(layout?.nodes || []);
  return days;
}

function wrapAsSection(day: BitacoraDay): LayoutNode {
  return {
    type: "section",
    title: spaceShortLabel(day.spaces[0]) + " — " + daySubtitle(day.title),
    _space: day.spaces[0],
    children: day.children,
  };
}

/** Une días por fecha y prefija segmentId para evitar colisiones entre spaces. */
export function mergeBitacoraBundles(
  bundles: { space: string; data: { layout?: { nodes?: LayoutNode[] }; segments?: Record<string, unknown> } | null }[],
): { segments: Record<string, unknown>; days: BitacoraDay[] } {
  const segments: Record<string, unknown> = {};
  const byKey = new Map<string, BitacoraDay>();

  for (const { space, data } of bundles) {
    if (!data) continue;
    const layout = data.layout || data;
    Object.assign(segments, prefixSegments(normalizeBitacoraSegments(data), space));
    for (const day of extractDaysFromLayout(layout as { nodes?: LayoutNode[] }, space)) {
      const key = day.date || day.id;
      const existing = byKey.get(key);
      if (!existing) {
        byKey.set(key, day);
        continue;
      }
      if (existing.spaces.length === 1) {
        existing.children = [wrapAsSection(existing)];
      }
      existing.spaces.push(space);
      existing.children.push(wrapAsSection(day));
      if (day.date) {
        existing.title = day.date + " — " + existing.spaces.map(spaceShortLabel).join(" + ");
      }
    }
  }

  const days = [...byKey.values()].sort((a, b) => (a.date < b.date ? 1 : -1));
  return { segments, days };
}

export function segmentProject(segmentId: string | undefined, fallback: string): string {
  const id = String(segmentId || "");
  const i = id.indexOf("::");
  return i > 0 ? id.slice(0, i) : fallback;
}

export { reDate, spacesFor, projectLabel };
