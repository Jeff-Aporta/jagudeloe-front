/*
 * Estado de navegación en ?s= — tabs cortos (space, sub, …).
 */
const urlState = window.ISAFront.createUrlState({
  param: "s",
  debounceMs: 300,
  maxValue: 100,
  initial: () => ({}),
  normalize: (raw) => (raw && typeof raw === "object" ? raw : {}),
});

export const MAX_VALUE = urlState.MAX_VALUE;
export const get = urlState.get;
export const merge = urlState.merge;
export const subscribe = urlState.subscribe;
export const boot = urlState.boot;
