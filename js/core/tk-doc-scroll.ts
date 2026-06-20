/** Scroll a secciones estándar del visor doc TK (`#tk-doc-section-*`). */

import type { TkDocSectionKey } from "./tk-doc-constants.ts";

const FOCUS_CLASS = "tk-doc-section--focus";
const FOCUS_MS = 1400;

function findScrollParent(el: Element | null): HTMLElement | null {
  let node = el?.parentElement ?? null;
  while (node) {
    const style = getComputedStyle(node);
    const oy = style.overflowY;
    if ((oy === "auto" || oy === "scroll" || oy === "overlay") && node.scrollHeight > node.clientHeight + 1) {
      return node;
    }
    node = node.parentElement;
  }
  const scrolling = document.scrollingElement;
  return scrolling instanceof HTMLElement ? scrolling : null;
}

/** Contenedor scroll real del doc (panel tickets o body full-page). */
export function tkDocScrollRoot(): HTMLElement | null {
  const anchor =
    document.querySelector<HTMLElement>("[data-tk-doc-section]") ??
    document.querySelector<HTMLElement>(".tk-doc-web-surface");
  return findScrollParent(anchor) ?? document.querySelector<HTMLElement>(".tk-doc-web-surface");
}

export function tkDocSectionElement(sectionKey: TkDocSectionKey | string): HTMLElement | null {
  const key = String(sectionKey ?? "").trim();
  if (!key) return null;
  return (
    document.getElementById(`tk-doc-section-${key}`) ??
    document.querySelector<HTMLElement>(`[data-tk-doc-section="${key}"]`)
  );
}

export function scrollToTkDocSection(
  sectionKey: TkDocSectionKey | string,
  opts: { behavior?: ScrollBehavior; offset?: number } = {},
): boolean {
  const el = tkDocSectionElement(sectionKey);
  if (!el) return false;

  const behavior = opts.behavior ?? "smooth";
  const offset = opts.offset ?? 16;
  const scrollParent = findScrollParent(el);

  if (scrollParent) {
    const parentRect = scrollParent.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const top = scrollParent.scrollTop + (elRect.top - parentRect.top) - offset;
    scrollParent.scrollTo({ top: Math.max(0, top), behavior });
  } else {
    el.scrollIntoView({ behavior, block: "start" });
  }

  el.classList.remove(FOCUS_CLASS);
  // reflow para reiniciar animación si ya estaba activa
  void el.offsetWidth;
  el.classList.add(FOCUS_CLASS);
  window.setTimeout(() => el.classList.remove(FOCUS_CLASS), FOCUS_MS);

  return true;
}
