/** Especificación y render SVG de gráficos de documentación TK (sin Chart.js). */

export interface ChartDataset {
  label: string;
  data: number[];
  color?: string | string[];
}

export interface ChartSpec {
  type: "bar";
  title?: string;
  subtitle?: string;
  labels: string[];
  datasets: ChartDataset[];
  yAxisLabel?: string;
  rotateLabels?: number;
  showValues?: boolean;
  beginAtZero?: boolean;
}

export interface ChartTheme {
  text: string;
  muted: string;
  grid: string;
  panel: string;
  border: string;
}

const DEFAULT_COLORS = ["#1e90ff", "#2e7d32", "#ed6c02", "#7b1fa2", "#00838f"];

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
}

function pickColor(raw: unknown, i: number): string {
  if (Array.isArray(raw)) return String(raw[i] ?? raw[0] ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]);
  if (typeof raw === "string" && raw) return raw;
  return DEFAULT_COLORS[i % DEFAULT_COLORS.length];
}

function barColor(ds: ChartDataset, datasetIndex: number, labelIndex: number): string {
  const c = ds.color;
  if (Array.isArray(c)) return String(c[labelIndex] ?? c[datasetIndex] ?? DEFAULT_COLORS[datasetIndex]);
  return pickColor(c, datasetIndex);
}

function readChartJsBody(body: Record<string, unknown>): ChartSpec | null {
  const data = asRecord(body.data);
  const labels = (data.labels as string[]) ?? [];
  const rawSets = (data.datasets as Record<string, unknown>[]) ?? [];
  if (!labels.length || !rawSets.length) return null;

  const options = asRecord(body.options);
  const plugins = asRecord(options.plugins);
  const titlePlug = asRecord(plugins.title);
  const subtitlePlug = asRecord(plugins.subtitle);
  const scales = asRecord(options.scales);
  const yScale = asRecord(scales.y);
  const yTitle = asRecord(yScale.title);
  const xScale = asRecord(scales.x);
  const xTicks = asRecord(xScale.ticks);
  const dataLabels = asRecord(plugins.datalabels);

  return {
    type: "bar",
    title: titlePlug.display !== false ? String(titlePlug.text ?? "") : "",
    subtitle: subtitlePlug.display !== false ? String(subtitlePlug.text ?? "") : "",
    labels: labels.map(String),
    datasets: rawSets.map((ds, i) => ({
      label: String(ds.label ?? `Serie ${i + 1}`),
      data: ((ds.data as number[]) ?? []).map(Number),
      color: ds.backgroundColor as string | string[] | undefined,
    })),
    yAxisLabel: yTitle.display !== false ? String(yTitle.text ?? "") : "",
    rotateLabels: Number(xTicks.maxRotation ?? xTicks.minRotation ?? 0) || 0,
    showValues: dataLabels.display === true,
    beginAtZero: yScale.beginAtZero !== false,
  };
}

/** Normaliza payload de bloque `chart` (Chart.js-like o spec nativa). */
export function chartSpecFromPayload(payload: Record<string, unknown> | undefined | null): ChartSpec | null {
  if (!payload) return null;

  if (payload.chart && typeof payload.chart === "object") {
    return readChartJsBody(asRecord(payload.chart));
  }

  if (payload.type === "bar" && Array.isArray(payload.labels) && Array.isArray(payload.datasets)) {
    const labels = (payload.labels as unknown[]).map(String);
    const datasets = (payload.datasets as Record<string, unknown>[]).map((ds, i) => ({
      label: String(ds.label ?? `Serie ${i + 1}`),
      data: ((ds.data as number[]) ?? []).map(Number),
      color: pickColor(ds.color ?? ds.backgroundColor, i),
    }));
    return {
      type: "bar",
      title: String(payload.title ?? ""),
      subtitle: String(payload.subtitle ?? ""),
      labels,
      datasets,
      yAxisLabel: String(payload.yAxisLabel ?? ""),
      rotateLabels: Number(payload.rotateLabels ?? 0) || 0,
      showValues: payload.showValues !== false,
      beginAtZero: payload.beginAtZero !== false,
    };
  }

  if (payload.data && typeof payload.data === "object") {
    return readChartJsBody(payload);
  }

  return null;
}

function niceMax(max: number): number {
  if (max <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(max));
  const n = max / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * pow;
}

function fmtNum(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function escapeXml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Render SVG estático (email / HTML driver). */
export function renderChartSvg(spec: ChartSpec, theme: ChartTheme): string {
  const labels = spec.labels;
  const datasets = spec.datasets;
  const series = datasets.length || 1;
  const n = labels.length;
  if (!n || !datasets.length) return "";

  const allVals = datasets.flatMap((d) => d.data);
  const rawMax = Math.max(...allVals, 0);
  const yMax = spec.beginAtZero === false ? rawMax * 1.1 : niceMax(rawMax * 1.08);
  const yMin = spec.beginAtZero === false ? Math.min(...allVals, 0) : 0;
  const ySpan = yMax - yMin || 1;

  const W = Math.max(480, Math.min(920, 56 + n * (series > 1 ? 42 : 72)));
  const H = spec.rotateLabels ? 340 : 300;
  const padL = 56;
  const padR = 16;
  const padT = spec.title ? 36 : 16;
  const padB = spec.rotateLabels ? 88 : 52;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const parts: string[] = [];
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" class="tk-doc-chart-svg" style="width:100%;max-width:${W}px;height:auto;display:block;">`);
  parts.push(`<rect x="0" y="0" width="${W}" height="${H}" rx="12" fill="${theme.panel}" stroke="${theme.border}" stroke-width="1"/>`);

  if (spec.title) {
    parts.push(`<text x="${W / 2}" y="22" text-anchor="middle" fill="${theme.text}" font-size="13" font-weight="700" font-family="Tahoma,Arial,sans-serif">${escapeXml(spec.title)}</text>`);
  }
  if (spec.subtitle) {
    parts.push(`<text x="${W / 2}" y="${spec.title ? 38 : 22}" text-anchor="middle" fill="${theme.muted}" font-size="11" font-family="Tahoma,Arial,sans-serif">${escapeXml(spec.subtitle)}</text>`);
  }

  const legendY = padT - 6;
  let legendX = padL;
  datasets.forEach((ds, di) => {
    const c = Array.isArray(ds.color) ? pickColor(ds.color, 0) : pickColor(ds.color, di);
    parts.push(`<rect x="${legendX}" y="${legendY - 8}" width="10" height="10" rx="2" fill="${c}"/>`);
    parts.push(`<text x="${legendX + 14}" y="${legendY}" fill="${theme.muted}" font-size="10" font-family="Tahoma,Arial,sans-serif">${escapeXml(ds.label)}</text>`);
    legendX += 14 + ds.label.length * 6.2 + 18;
  });

  const gridLines = 5;
  for (let g = 0; g <= gridLines; g += 1) {
    const y = padT + plotH - (g / gridLines) * plotH;
    const val = yMin + (g / gridLines) * ySpan;
    parts.push(`<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="${theme.grid}" stroke-width="1"/>`);
    parts.push(`<text x="${padL - 6}" y="${y + 4}" text-anchor="end" fill="${theme.muted}" font-size="9" font-family="Tahoma,Arial,sans-serif">${escapeXml(fmtNum(val))}</text>`);
  }

  if (spec.yAxisLabel) {
    parts.push(`<text x="14" y="${padT + plotH / 2}" transform="rotate(-90 14 ${padT + plotH / 2})" text-anchor="middle" fill="${theme.muted}" font-size="10" font-family="Tahoma,Arial,sans-serif">${escapeXml(spec.yAxisLabel)}</text>`);
  }

  const slotW = plotW / n;
  const gap = series > 1 ? 4 : 8;
  const barW = Math.max(6, (slotW - gap * (series + 1)) / series);

  labels.forEach((label, li) => {
    const slotX = padL + li * slotW;
    datasets.forEach((ds, di) => {
      const v = Number(ds.data[li] ?? 0);
      const h = Math.max(0, ((v - yMin) / ySpan) * plotH);
      const x = slotX + gap + di * (barW + gap);
      const y = padT + plotH - h;
      const c = barColor(ds, di, li);
      parts.push(`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW.toFixed(1)}" height="${h.toFixed(1)}" rx="3" fill="${c}" opacity="0.92"/>`);
      if (spec.showValues !== false && h > 12) {
        parts.push(`<text x="${(x + barW / 2).toFixed(1)}" y="${(y - 4).toFixed(1)}" text-anchor="middle" fill="${theme.text}" font-size="9" font-weight="600" font-family="Tahoma,Arial,sans-serif">${escapeXml(fmtNum(v))}</text>`);
      }
    });

    const lx = slotX + slotW / 2;
    const ly = padT + plotH + (spec.rotateLabels ? 14 : 18);
    if (spec.rotateLabels) {
      parts.push(`<text x="${lx}" y="${ly}" transform="rotate(-${spec.rotateLabels} ${lx} ${ly})" text-anchor="end" fill="${theme.muted}" font-size="9" font-family="Tahoma,Arial,sans-serif">${escapeXml(label)}</text>`);
    } else {
      parts.push(`<text x="${lx}" y="${ly}" text-anchor="middle" fill="${theme.muted}" font-size="9" font-family="Tahoma,Arial,sans-serif">${escapeXml(label)}</text>`);
    }
  });

  parts.push("</svg>");
  return parts.join("");
}

export function chartThemeLight(): ChartTheme {
  return { text: "#0b2e4e", muted: "#6b7785", grid: "#e2e8f0", panel: "#ffffff", border: "#e2e8f0" };
}

export function chartThemeDark(): ChartTheme {
  return { text: "#e2e8f0", muted: "#94a3b8", grid: "rgba(148,163,184,0.2)", panel: "rgba(15,23,42,0.6)", border: "rgba(148,163,184,0.25)" };
}
