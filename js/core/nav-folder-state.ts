/** Estado abierto/cerrado de carpetas del navegador lateral (solo sessionStorage). */

export type NavTreeMode = "items" | "day";

/** Claves y/mo/día según modo del árbol. */
export function folderKeysForDate(date: string, mode: NavTreeMode = "items"): string[] {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(date || ""));
  if (!m) return [];
  const y = m[1];
  const mKey = `${y}/${m[2]}`;
  const keys = [y, mKey];
  if (mode === "items") keys.push(`${mKey}/${m[3]}`);
  return keys;
}

export function loadNavFolderOpen(storageKey: string): Record<string, boolean> {
  if (!storageKey) return {};
  try {
    const raw = sessionStorage.getItem(storageKey);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const out: Record<string, boolean> = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof v === "boolean") out[k] = v;
    }
    return out;
  } catch {
    return {};
  }
}

export function saveNavFolderOpen(storageKey: string, open: Record<string, boolean>): void {
  if (!storageKey) return;
  try {
    sessionStorage.setItem(storageKey, JSON.stringify(open));
  } catch {
    /* quota / privado */
  }
}

/** Fuerza abierta la cadena de ancestros (p. ej. TK seleccionado por URL). */
export function mergeAncestryOpen(
  open: Record<string, boolean>,
  keys: string[],
): Record<string, boolean> {
  if (!keys.length) return open;
  const next = { ...open };
  for (const k of keys) next[k] = true;
  return next;
}
