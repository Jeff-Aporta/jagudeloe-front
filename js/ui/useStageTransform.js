/**
 * Transformación del "stage" de un lightbox: zoom (rueda + pinch), pan (arrastre) y
 * rotación (dos dedos). Devuelve el transform CSS, los handlers a montar en el stage,
 * y acciones para la toolbar (zoomIn/zoomOut/reset).
 *
 * Regla táctil: a escala 1, un dedo NO traslada — hace swipe (onSwipe) para cambiar de
 * imagen. Con zoom (>1) o con mouse, un puntero siempre traslada (pan).
 */
import { getReact } from "../core/platform.ts";

const { useState, useRef, useCallback, useEffect } = getReact();

const MIN = 0.25;
const MAX = 8;
const SWIPE_PX = 60; // umbral horizontal (cambiar imagen)
const clampScale = (v) => Math.max(MIN, Math.min(MAX, v));

const CLOSE_VH = 0.3; // 30% del viewport para cerrar
const closeThreshold = () => (typeof window !== "undefined" ? window.innerHeight : 800) * CLOSE_VH;

export function useStageTransform({ onSwipe, onSwipeDown } = {}) {
  const [t, setT] = useState({ s: 1, x: 0, y: 0, r: 0 });
  const [pull, setPull] = useState({ active: false, progress: 0, dy: 0 });
  const stageRef = useRef(null);
  const ptrs = useRef(new Map());
  const single = useRef(null);
  const gest = useRef(null);
  const mode = useRef("pan"); // "pan" | "swipe"
  const swipe = useRef({ x: 0, y: 0 });
  const scaleRef = useRef(1);
  const onSwipeRef = useRef(onSwipe);
  const onSwipeDownRef = useRef(onSwipeDown);

  useEffect(() => {
    scaleRef.current = t.s;
  }, [t.s]);
  useEffect(() => {
    onSwipeRef.current = onSwipe;
    onSwipeDownRef.current = onSwipeDown;
  }, [onSwipe, onSwipeDown]);

  const rel = (e) => {
    const el = stageRef.current || e.currentTarget;
    const r = el.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const reset = useCallback(() => setT({ s: 1, x: 0, y: 0, r: 0 }), []);
  const zoomIn = useCallback(() => setT((p) => ({ ...p, s: clampScale(p.s * 1.2) })), []);
  const zoomOut = useCallback(() => setT((p) => ({ ...p, s: clampScale(p.s / 1.2) })), []);

  const onWheel = useCallback((e) => {
    if (e.cancelable) e.preventDefault();
    const k = e.deltaY < 0 ? 1.12 : 1 / 1.12;
    setT((p) => ({ ...p, s: clampScale(p.s * k) }));
  }, []);

  const onPointerDown = useCallback((e) => {
    const { x, y } = rel(e);
    ptrs.current.set(e.pointerId, { x, y });
    if (ptrs.current.size === 1) {
      single.current = { x, y };
      gest.current = null;
      // Táctil a escala 1 → swipe; mouse o con zoom → pan.
      mode.current = e.pointerType === "touch" && scaleRef.current === 1 ? "swipe" : "pan";
      swipe.current = { x: 0, y: 0 };
    } else {
      // Segundo dedo durante el gesto → cancela el cierre.
      single.current = null;
      gest.current = null;
      mode.current = "pan";
      setPull((p) => (p.active ? { active: false, progress: 0, dy: 0 } : p));
    }
  }, []);

  const onPointerMove = useCallback((e) => {
    if (!ptrs.current.has(e.pointerId)) return;
    const { x, y } = rel(e);
    ptrs.current.set(e.pointerId, { x, y });
    const pts = [...ptrs.current.values()];
    if (pts.length === 1 && single.current) {
      const dx = x - single.current.x;
      const dy = y - single.current.y;
      single.current = { x, y };
      if (mode.current === "swipe") {
        const sx = swipe.current.x + dx;
        const sy = swipe.current.y + dy;
        swipe.current = { x: sx, y: sy };
        // Pull-to-close: arrastre vertical hacia abajo dominante.
        if (sy > 0 && sy > Math.abs(sx)) {
          setPull({ active: true, dy: sy, progress: Math.min(1, sy / closeThreshold()) });
        } else {
          setPull((p) => (p.active ? { active: false, progress: 0, dy: 0 } : p));
        }
      } else {
        setT((p) => ({ ...p, x: p.x + dx, y: p.y + dy }));
      }
    } else if (pts.length >= 2) {
      const [a, b] = pts;
      const dist = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      const ang = Math.atan2(b.y - a.y, b.x - a.x);
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      if (gest.current) {
        const k = dist / (gest.current.dist || dist);
        const dr = ((ang - gest.current.ang) * 180) / Math.PI;
        const dmx = mx - gest.current.mx;
        const dmy = my - gest.current.my;
        setT((p) => ({ ...p, s: clampScale(p.s * k), r: p.r + dr, x: p.x + dmx, y: p.y + dmy }));
      }
      gest.current = { dist, ang, mx, my };
    }
  }, []);

  const endPtr = useCallback((e) => {
    ptrs.current.delete(e.pointerId);
    if (ptrs.current.size === 0) {
      if (mode.current === "swipe") {
        const { x, y } = swipe.current;
        if (Math.abs(x) > Math.abs(y)) {
          if (Math.abs(x) >= SWIPE_PX) onSwipeRef.current?.(x < 0 ? "next" : "prev");
        } else if (y >= closeThreshold()) {
          onSwipeDownRef.current?.(); // arrastre ≥30% del viewport → cerrar
        }
      }
      setPull((p) => (p.active ? { active: false, progress: 0, dy: 0 } : p));
      single.current = null;
      gest.current = null;
      mode.current = "pan";
    } else if (ptrs.current.size === 1) {
      const v = [...ptrs.current.values()][0];
      single.current = v ? { ...v } : null;
      gest.current = null;
      mode.current = "pan"; // tras pinch, el dedo restante traslada
    }
  }, []);

  const transform = `translate(${t.x}px, ${t.y}px) scale(${t.s}) rotate(${t.r}deg)`;
  const bind = {
    onWheel,
    onPointerDown,
    onPointerMove,
    onPointerUp: endPtr,
    onPointerCancel: endPtr,
  };
  const transformed = t.s !== 1 || t.x !== 0 || t.y !== 0 || t.r !== 0;
  return { stageRef, transform, bind, reset, zoomIn, zoomOut, scalePct: Math.round(t.s * 100), transformed, pull };
}
