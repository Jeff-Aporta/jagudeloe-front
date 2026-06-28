/** Pantallazos InSoft en R2 — parche temporal hasta seed BD (solo evidencias, no tiempos). */

const R2_PUBLIC = "https://pub-1c290cc606c8478899f5764899278571.r2.dev";

type PantallazoJun25Evidencia = { r2Key: string; caption: string; hitos: ("apertura" | "atencion" | "cierre")[] };

const PANTALLAZO_JUN25_EVIDENCIAS: Record<string, PantallazoJun25Evidencia> = {
  "TK-1441246": { r2Key: "patyia/diligencias/tk1441246-solicitud-insoft.png", caption: "Captura de la solicitud en InSoft (Teams).", hitos: ["apertura"] },
  "TK-1442417": { r2Key: "patyia/diligencias/tk1442417-solicitud-insoft.png", caption: "Captura de la solicitud en InSoft (Teams).", hitos: ["apertura"] },
  "TK-1441252": { r2Key: "patyia/diligencias/tk1441252-solicitud-insoft.png", caption: "Captura de la solicitud en InSoft (Teams).", hitos: ["apertura"] },
};

function normIticket(raw: unknown): string {
  const s = String(raw ?? "").trim().toUpperCase();
  if (!s) return "";
  return s.startsWith("TK-") ? s : `TK-${s}`;
}

function mergeMetricasDoc(
  bag: Record<string, unknown> | undefined,
  r2SubidasNew: string[],
  evTiempoNew: { key: string; rol: string; hitos: string[] }[],
): Record<string, unknown> {
  const doc = { ...(bag ?? {}) } as Record<string, unknown>;

  // Acumular imagenesR2Subidas: union con las existentes, sin duplicados.
  const prevSubidas = Array.isArray(doc.imagenesR2Subidas)
    ? (doc.imagenesR2Subidas as unknown[]).map((v) => String(v))
    : [];
  const seenSub = new Set(prevSubidas.map((k) => k.toLowerCase()));
  const subidas = [...prevSubidas];
  for (const k of r2SubidasNew) {
    const lk = k.toLowerCase();
    if (seenSub.has(lk)) continue;
    seenSub.add(lk);
    subidas.push(k);
  }
  doc.imagenesR2Subidas = subidas;

  // Acumular evidenciasTiempo: union por `key`, fusionando hitos.
  const prevEv = Array.isArray(doc.evidenciasTiempo)
    ? (doc.evidenciasTiempo as { key: string; rol?: string; hitos?: string[] }[])
    : [];
  const map = new Map<string, { key: string; rol: string; hitos: string[] }>();
  for (const e of prevEv) {
    if (!e?.key) continue;
    map.set(String(e.key).toLowerCase(), { key: String(e.key), rol: String(e.rol ?? ""), hitos: Array.isArray(e.hitos) ? [...e.hitos] : [] });
  }
  for (const e of evTiempoNew) {
    if (!e?.key) continue;
    const lk = String(e.key).toLowerCase();
    const prev = map.get(lk);
    if (prev) {
      for (const h of e.hitos) if (!prev.hitos.includes(h)) prev.hitos.push(h);
      if (!prev.rol && e.rol) prev.rol = e.rol;
    } else {
      map.set(lk, { key: String(e.key), rol: String(e.rol ?? ""), hitos: [...e.hitos] });
    }
  }
  doc.evidenciasTiempo = Array.from(map.values());

  doc.evidenciasSubidas = true;
  delete doc.imagenesR2Pendientes;
  return doc;
}

function patchEvidenciasContent(tk: Record<string, unknown>, ev: PantallazoJun25Evidencia): Record<string, unknown>[] {
  const content = [...((tk.content as Record<string, unknown>[]) ?? [])];
  const file = ev.r2Key.split("/").pop() ?? "";
  const hasImage = content.some((b) => {
    if (String(b.kind ?? "").toLowerCase() !== "image") return false;
    return String((b.payload as Record<string, unknown>)?.url ?? "").includes(file);
  });
  if (hasImage) return content;
  const url = `${R2_PUBLIC}/${ev.r2Key}`;
  const block = { kind: "image", sortKey: 2.5, payload: { docLane: "evidencias", url, alt: `Solicitud InSoft ${normIticket(tk.iticket)}`, caption: ev.caption } };
  const idx = content.findIndex((b) => String(b.kind ?? "").toLowerCase() === "table");
  if (idx >= 0) content.splice(idx + 1, 0, block);
  else content.push(block);
  return content;
}

/** Pantallazos InSoft en R2 + bloque image (hasta seed BD). No altera tiempos. */
export function patchPantallazoJun25Evidencias(tk: Record<string, unknown>): Record<string, unknown> {
  const id = normIticket(tk.iticket);
  const ev = PANTALLAZO_JUN25_EVIDENCIAS[id];
  if (!ev) return tk;
  const r2Subidas = [ev.r2Key];
  const evTiempo = [{ key: ev.r2Key, rol: "solicitud", hitos: [...ev.hitos] }];
  const detallesExtra = { ...((tk.detallesExtra as Record<string, unknown>) ?? {}) };
  const meta = { ...((tk.meta as Record<string, unknown>) ?? {}) };
  detallesExtra.metricas = mergeMetricasDoc(detallesExtra.metricas as Record<string, unknown> | undefined, r2Subidas, evTiempo);
  meta.metricas = mergeMetricasDoc(meta.metricas as Record<string, unknown> | undefined, r2Subidas, evTiempo);
  return { ...tk, content: patchEvidenciasContent(tk, ev), detallesExtra, meta };
}
