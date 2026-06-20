/**
 * Dot "tortuga cometa" controlable: recorre los flujos en orden, con cola de cometa
 * (color del grupo) y un chip (índice + log) que persigue al dot sin salirse del
 * lienzo. Expone una API imperativa por `controlRef` (play/pause/stop/next/prev) y
 * reporta estado por `onState` ({ playing, idx, total, replay }).
 */
import { getReact } from "../core/platform.ts";
import { tkHueToHex } from "../core/tk-hue.ts";
import { contrastFontColor } from "../core/tk-color.ts";
import { inlineMdWeb } from "./tkHtml.ts";

const { useRef, useState, useEffect, useCallback } = getReact();

const TRAIL = 14;
const SPEED = 2.5; // ms por unidad de longitud
const MIN_DUR = 360;
const PAUSE_BETWEEN = 200; // ms entre tramos
const AUTO_GAP = 45000; // ms del contador de auto-anim (avanza solo en idle, sin hover)
const CHIP_W = 216;
const CHIP_H = 46;
const MARGIN = 10; // margen mínimo para que el chip no se corte

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

export function SequenceTurtle({ messages, theme, viewW, viewH, paused, autoLoop, controlRef, onState }) {
  const pathRef = useRef(null);
  const rafRef = useRef(0);
  const st = useRef({ idx: 0, elapsed: 0, autoElapsed: 0, phase: "idle", lastTs: 0, gapStart: 0, lastPct: -1 });
  const pausedRef = useRef(paused);
  const [head, setHead] = useState(null);
  const total = messages?.length ?? 0;

  // `replay` = fracción restante del contador de auto-anim (1 lleno → 0 vacío → arranca).
  const report = useCallback(() => {
    const s = st.current;
    const active = s.phase === "playing" || s.phase === "between";
    const replay = autoLoop ? clamp(1 - s.autoElapsed / AUTO_GAP, 0, 1) : 0;
    s.lastPct = Math.round(replay * 100);
    onState?.({ playing: active, idx: s.idx, total, replay });
  }, [onState, total, autoLoop]);

  const measure = useCallback(
    (idx) => {
      const m = messages?.[idx];
      if (!m || !m.path || !pathRef.current) return null;
      pathRef.current.setAttribute("d", m.path);
      const len = pathRef.current.getTotalLength() || 1;
      return { m, len, dur: Math.max(MIN_DUR, len * SPEED) };
    },
    [messages],
  );

  const renderAt = useCallback(
    (idx, t) => {
      const info = measure(idx);
      if (!info) {
        setHead(null);
        return;
      }
      const el = pathRef.current;
      const pt = el.getPointAtLength(info.len * t);
      const color = (info.m.groupHue != null && tkHueToHex(info.m.groupHue)) || theme.accent;
      const trail = [];
      const span = 0.16;
      for (let i = TRAIL; i >= 0; i--) {
        const tt = Math.max(0, t - (span * i) / TRAIL);
        const p = el.getPointAtLength(info.len * tt);
        trail.push({ x: p.x, y: p.y });
      }
      setHead({ x: pt.x, y: pt.y, color, log: info.m.log || "", step: info.m.step, trail });
    },
    [measure, theme],
  );

  const stopRaf = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
  }, []);

  // Bucle único conducido por la fase.
  const loop = useCallback(
    (ts) => {
      const s = st.current;
      if (pausedRef.current) {
        rafRef.current = 0; // hover: congela (el efecto de hover reanuda)
        return;
      }
      const finishRun = () => {
        setHead(null);
        if (autoLoop) {
          s.phase = "waiting";
          s.autoElapsed = 0; // contador vuelve a empezar tras completar
          s.lastTs = ts;
        } else {
          s.phase = "done";
        }
        report();
      };

      if (s.phase === "playing") {
        const info = measure(s.idx);
        if (!info) {
          s.idx += 1;
          s.elapsed = 0;
          if (s.idx >= total) finishRun();
        } else {
          if (!s.lastTs) s.lastTs = ts;
          s.elapsed += ts - s.lastTs;
          s.lastTs = ts;
          const t = Math.min(1, s.elapsed / info.dur);
          renderAt(s.idx, t);
          if (t >= 1) {
            s.phase = "between";
            s.gapStart = ts;
          }
        }
      } else if (s.phase === "between") {
        if (ts - s.gapStart >= PAUSE_BETWEEN) {
          s.idx += 1;
          s.elapsed = 0;
          s.lastTs = ts;
          if (s.idx >= total) finishRun();
          else {
            s.phase = "playing";
            report();
          }
        }
      } else if (s.phase === "waiting") {
        if (!s.lastTs) s.lastTs = ts;
        s.autoElapsed += ts - s.lastTs;
        s.lastTs = ts;
        if (s.autoElapsed >= AUTO_GAP) {
          // El ring llegó a 0 → arranca la auto-anim (autoElapsed se queda en GAP → ring 0 mientras anima).
          s.phase = "playing";
          s.idx = 0;
          s.elapsed = 0;
          s.autoElapsed = AUTO_GAP;
          setHead(null);
          report();
        } else {
          const pct = Math.round(clamp(1 - s.autoElapsed / AUTO_GAP, 0, 1) * 100);
          if (pct !== s.lastPct) report();
        }
      } else {
        rafRef.current = 0; // idle / paused / done → detener bucle
        return;
      }
      rafRef.current = requestAnimationFrame(loop);
    },
    [measure, renderAt, total, autoLoop, report],
  );

  useEffect(() => {
    pausedRef.current = paused;
    const phase = st.current.phase;
    const active = phase === "playing" || phase === "between" || phase === "waiting";
    if (paused) stopRaf();
    else if (active && !rafRef.current) {
      st.current.lastTs = 0; // no contar el tiempo de hover
      rafRef.current = requestAnimationFrame(loop);
    }
  }, [paused, loop, stopRaf]);

  const ensureLoop = useCallback(() => {
    if (!rafRef.current && !pausedRef.current) {
      st.current.lastTs = 0;
      rafRef.current = requestAnimationFrame(loop);
    }
  }, [loop]);

  // API imperativa.
  useEffect(() => {
    if (!controlRef) return undefined;
    controlRef.current = {
      play() {
        const s = st.current;
        // Reanuda desde el tramo actual (incl. tras usar << / >> o waiting); reinicia solo si terminó.
        if (s.phase === "done" || s.idx >= total) {
          s.idx = 0;
          s.elapsed = 0;
        }
        s.phase = "playing";
        s.lastTs = 0;
        s.autoElapsed = AUTO_GAP; // ring vacío (0) mientras anima; se rellena al terminar
        report();
        ensureLoop();
      },
      pause() {
        st.current.phase = "paused";
        stopRaf();
        report();
      },
      stop() {
        const s = st.current;
        s.idx = 0;
        s.elapsed = 0;
        s.autoElapsed = 0; // el contador de auto-anim vuelve a empezar en 0
        s.lastTs = 0;
        s.phase = autoLoop ? "waiting" : "idle";
        stopRaf();
        setHead(null);
        report();
        if (autoLoop) ensureLoop();
      },
      // << / >>: saltan de tramo y quedan EN PAUSA en ese tramo (play reanuda desde ahí).
      next() {
        const s = st.current;
        s.idx = Math.min(total - 1, s.idx + 1);
        s.elapsed = 0;
        s.lastTs = 0;
        s.phase = "paused";
        stopRaf();
        renderAt(s.idx, 0.0001);
        report();
      },
      prev() {
        const s = st.current;
        s.idx = Math.max(0, s.idx - 1);
        s.elapsed = 0;
        s.lastTs = 0;
        s.phase = "paused";
        stopRaf();
        renderAt(s.idx, 0.0001);
        report();
      },
    };
    return () => {
      if (controlRef.current) controlRef.current = null;
    };
  }, [controlRef, total, autoLoop, report, ensureLoop, renderAt, stopRaf]);

  // Viewer (autoLoop): arranca el CONTADOR de 45s (no la anim) — sin iniciar en t=0.
  useEffect(() => {
    stopRaf();
    st.current = { idx: 0, elapsed: 0, autoElapsed: 0, phase: "idle", lastTs: 0, gapStart: 0, lastPct: -1 };
    setHead(null);
    if (autoLoop && total) {
      st.current.phase = "waiting";
      report();
      if (!pausedRef.current) ensureLoop();
    }
    return () => stopRaf();
  }, [messages, autoLoop, total, ensureLoop, stopRaf, report]);

  // Posición del chip: arriba-derecha del dot, con clamp y margen dentro del lienzo.
  let chipX = 0;
  let chipY = 0;
  if (head) {
    chipX = clamp(head.x + 12, MARGIN, Math.max(MARGIN, (viewW || 0) - CHIP_W - MARGIN));
    chipY = clamp(head.y - CHIP_H - 6, MARGIN, Math.max(MARGIN, (viewH || 0) - CHIP_H - MARGIN));
  }

  return (
    <g className="tk-doc-seq-turtle" pointerEvents="none" aria-hidden="true">
      <path ref={pathRef} fill="none" stroke="none" />
      {head && (
        <>
          {head.trail.map((p, i) => {
            const k = (i + 1) / head.trail.length;
            return <circle key={i} cx={p.x} cy={p.y} r={1 + 4 * k} fill={head.color} opacity={0.05 + 0.34 * k} />;
          })}
          <circle cx={head.x} cy={head.y} r={7} fill={head.color} opacity={0.22} />
          <circle cx={head.x} cy={head.y} r={3.6} fill={head.color} />
          <foreignObject x={chipX} y={chipY} width={CHIP_W} height={CHIP_H} overflow="visible">
            <div xmlns="http://www.w3.org/1999/xhtml" className="tk-doc-seq-turtle-chip tk-doc-markdown" style={{ borderColor: head.color }}>
              <span
                className="tk-doc-seq-turtle-chip__idx"
                style={{ background: head.color, color: contrastFontColor(head.color) }}
              >
                {head.step}
              </span>
              {head.log ? <span dangerouslySetInnerHTML={{ __html: inlineMdWeb(head.log) }} /> : null}
            </div>
          </foreignObject>
        </>
      )}
    </g>
  );
}
