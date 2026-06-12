/*
 * core/storage — almacenamiento extenso (no va a la URL).
 */

const NS = "jagudeloe:";
const DB_NAME = "jagudeloe";
const STORE = "kv";
let dbPromise: Promise<IDBDatabase> | null = null;

function lsGet<T = unknown>(key: string): T | null {
  try {
    const v = localStorage.getItem(NS + key);
    return v == null ? null : (JSON.parse(v) as T);
  } catch {
    return null;
  }
}

function lsSet(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(NS + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function lsDel(key: string): void {
  try { localStorage.removeItem(NS + key); } catch { /* ignore */ }
}

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function idbGet<T = unknown>(key: string): Promise<T | null> {
  return openDb().then((db) => new Promise<T | null>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly").objectStore(STORE).get(key);
    tx.onsuccess = () => resolve(tx.result == null ? null : (tx.result as T));
    tx.onerror = () => reject(tx.error);
  }));
}

function idbSet(key: string, value: unknown): Promise<boolean> {
  return openDb().then((db) => new Promise<boolean>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite").objectStore(STORE).put(value, key);
    tx.onsuccess = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  }));
}

function idbDel(key: string): Promise<boolean> {
  return openDb().then((db) => new Promise<boolean>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite").objectStore(STORE).delete(key);
    tx.onsuccess = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  }));
}

export const storage = {
  local: { get: lsGet, set: lsSet, del: lsDel },
  big: { get: idbGet, set: idbSet, del: idbDel },
};
