/** Hitos de tiempo por pantallazo InSoft — espejo de scripts/lib/tk-evidencias-tiempo-hitos.mjs */

export type TiempoHito = "apertura" | "atencion" | "cierre";

export interface EvidenciaTiempo {
  key: string;
  rol?: string;
  hitos: TiempoHito[];
  label?: string;
}

const PATYIA_TK = new Set([
  1429262, 1432903, 1433179, 1433943, 1433968, 1434846, 1435136, 1435328,
  1435713, 1436238, 1436248, 1436259, 1437191, 1439155,
]);

const TIEMPO_ROLES = new Set(["solicitud", "atencion", "metricas", "cierre", "entrega"]);

const LOCAL_TIEMPO_ROLES: Record<number, string[]> = {
  1401843: ["solicitud", "cierre", "entrega"],
  1401845: ["cierre"],
  1401847: ["solicitud", "cierre"],
  1401849: ["solicitud", "cierre"],
  1401850: ["cierre"],
  1401851: ["solicitud", "cierre"],
  1401852: ["solicitud", "cierre"],
  1401853: ["solicitud", "cierre", "entrega"],
  1401855: ["solicitud", "cierre", "entrega"],
  1401856: ["cierre"],
  1418894: ["solicitud", "cierre"],
  1425170: ["solicitud", "cierre"],
  1430974: ["solicitud"],
  1430975: ["solicitud"],
  1432903: ["solicitud", "cierre"],
  1433179: ["solicitud", "cierre"],
  1433943: ["solicitud", "cierre"],
  1433968: ["solicitud", "cierre"],
  1434846: ["solicitud", "cierre"],
  1435136: ["solicitud", "cierre"],
  1435328: ["solicitud", "cierre"],
  1435713: ["solicitud", "cierre"],
  1436238: ["solicitud"],
  1436248: ["solicitud"],
  1436259: ["entrega", "metricas"],
  1437191: ["solicitud"],
  1439155: ["solicitud", "metricas"],
};

const TIEMPO_HITOS_DEFAULT_BY_ROL: Record<string, TiempoHito[]> = {
  solicitud: ["apertura"],
  atencion: ["atencion"],
  metricas: ["apertura", "atencion"],
  cierre: ["cierre"],
  entrega: ["cierre"],
};

const TIEMPO_HITOS_OVERRIDES: Record<number, Record<string, TiempoHito[]>> = {
  1436259: {
    metricas: ["apertura", "atencion"],
    entrega: ["cierre"],
  },
  1439155: {
    metricas: ["apertura", "atencion", "cierre"],
  },
};

const ROL_FROM_KEY_RE = /^tk\d+-([a-z]+)-insoft\.(png|jpe?g|webp|gif)$/i;

export function ticketSpaceFor(codigoTk: number): string {
  return PATYIA_TK.has(codigoTk) ? "patyia" : "clientesis";
}

export function tiempoRolFromR2Key(key: string): string | null {
  const base = String(key ?? "").trim().split("/").pop() || "";
  const m = ROL_FROM_KEY_RE.exec(base);
  const rol = m ? m[1].toLowerCase() : null;
  return rol && TIEMPO_ROLES.has(rol) ? rol : null;
}

export function hitosForTiempoRol(codigoTk: number, rol: string): TiempoHito[] {
  const ov = TIEMPO_HITOS_OVERRIDES[codigoTk]?.[rol];
  if (ov?.length) return [...ov];
  return TIEMPO_HITOS_DEFAULT_BY_ROL[rol] ? [...TIEMPO_HITOS_DEFAULT_BY_ROL[rol]] : [];
}

export function catalogEvidenciasTiempo(codigoTk: number): EvidenciaTiempo[] {
  const roles = LOCAL_TIEMPO_ROLES[codigoTk];
  const space = ticketSpaceFor(codigoTk);
  if (!roles?.length) return [];
  return roles.map((rol) => ({
    key: `${space}/diligencias/tk${codigoTk}-${rol}-insoft.png`,
    rol,
    hitos: hitosForTiempoRol(codigoTk, rol),
  }));
}

export function catalogEvidenciasTiempoFromKeys(codigoTk: number, keys: string[]): EvidenciaTiempo[] {
  const space = ticketSpaceFor(codigoTk);
  const seen = new Set<string>();
  const out: EvidenciaTiempo[] = [];
  for (const raw of keys) {
    const key = String(raw ?? "").trim();
    if (!key || seen.has(key)) continue;
    const rol = tiempoRolFromR2Key(key);
    if (!rol) continue;
    seen.add(key);
    const hitos = hitosForTiempoRol(codigoTk, rol);
    if (!hitos.length) continue;
    out.push({
      key: key.includes("/") ? key : `${space}/diligencias/tk${codigoTk}-${rol}-insoft.png`,
      rol,
      hitos,
    });
  }
  return out;
}

const HITO_LABEL: Record<TiempoHito, string> = {
  apertura: "apertura",
  atencion: "atención",
  cierre: "cierre",
};

export function formatEvidenciaHitos(hitos: TiempoHito[]): string {
  return hitos.map((h) => HITO_LABEL[h]).join(", ");
}

export function labelWithHitos(base: string, hitos: TiempoHito[]): string {
  if (!hitos.length) return base;
  return `${base} · ${formatEvidenciaHitos(hitos)}`;
}
