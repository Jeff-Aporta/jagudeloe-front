/**
 * Línea de tiempo Mermaid para métricas de tickets (mermaid.ink).
 */
import {
  CO_HOLIDAYS,
  DEFAULT_SCHEDULE,
  JAGUDELOE_LAPSOS_MUERTOS,
  mergeMetricLapsos,
  type DeadLapse,
  type TicketMetricInput,
  type TicketMetricResult,
  type WorkSchedule,
  formatMinutos,
  formatTicketTs,
  formatHoraBogota,
  businessMinutesBetween,
  calendarMinutesBetween,
} from "./tk-metrics.ts";

export interface TimelineEvent {
  sortKey: number;
  timeLabel: string;
  title: string;
  detail?: string;
  kind: "jornada" | "almuerzo" | "ticket" | "muerto" | "habil" | "empresa";
  acumuladoHabilMin?: number | null;
  tramoHabilMin?: number | null;
  tramoCalendarioMin?: number | null;
}

export interface TicketMilestone {
  key: string;
  label: string;
  iso: string | null;
  hora: string;
  fechaTexto: string;
  acumuladoHabilMin: number;
  tramoHabilMin: number | null;
  /** Tiempo calendario desde el hito anterior inmediato (incluye jornada). */
  tramoDesdeAnteriorMin?: number | null;
  tramoCalendarioMin: number | null;
  esExclusion: boolean;
  /** Marcador de horario laboral (inicio/fin jornada); no altera la cadena hábil. */
  esJornada?: boolean;
  /** Fin del bloque almuerzo cuando inicio/fin van en una sola card. */
  lunchFinIso?: string | null;
  nota?: string;
  icon: string;
}

export interface TimelineDayDoc {
  ymd: string;
  dayLabel: string;
  dayKind: "habil" | "fin_semana" | "festivo";
  events: TimelineEvent[];
  mermaid: string;
  mermaidUrl: string;
}

export interface TicketTimelineDoc {
  iticket: string;
  titulo: string;
  macroTitle: string;
  macroMermaid: string;
  macroUrl: string;
  days: TimelineDayDoc[];
  scheduleLabel: string;
}

function bogotaYmd(d: Date): string {
  return d.toLocaleDateString("en-CA", { timeZone: "America/Bogota" });
}

function bogotaWeekday(ymd: string): number {
  const w = new Date(`${ymd}T12:00:00-05:00`).toLocaleDateString("en-US", {
    timeZone: "America/Bogota",
    weekday: "short",
  });
  return ({ Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 } as Record<string, number>)[w] ?? 0;
}

function nextDayYmd(ymd: string): string {
  const d = new Date(`${ymd}T12:00:00-05:00`);
  d.setUTCDate(d.getUTCDate() + 1);
  return bogotaYmd(d);
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function bogotaHm(iso: string): { h: number; m: number; label: string; sortKey: number } {
  const d = new Date(iso);
  const parts = d.toLocaleString("en-GB", {
    timeZone: "America/Bogota",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).split(":");
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  return { h, m, label: `${pad2(h)}:${pad2(m)}`, sortKey: h * 60 + m };
}

function dayLabel(ymd: string): string {
  return new Date(`${ymd}T12:00:00-05:00`).toLocaleDateString("es-CO", {
    timeZone: "America/Bogota",
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function shortDayLabel(ymd: string): string {
  return new Date(`${ymd}T12:00:00-05:00`).toLocaleDateString("es-CO", {
    timeZone: "America/Bogota",
    day: "numeric",
    month: "short",
  });
}

function sanitizeMermaidText(s: string): string {
  return s.replace(/:/g, "–").replace(/\n/g, " ").trim();
}

function utf8ToBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_");
}

export function mermaidInkUrl(diagram: string, format: "img" | "svg" = "img"): string {
  return `https://mermaid.ink/${format}/${utf8ToBase64Url(diagram.trim())}`;
}

function mermaidPeriod(label: string): string {
  if (/^\d{1,2}:\d{2}$/.test(label)) return label;
  return label.replace(/:/g, "h");
}

function eventsToMermaid(title: string, events: TimelineEvent[]): string {
  const sorted = events.slice().sort((a, b) => a.sortKey - b.sortKey || a.title.localeCompare(b.title));
  const lines = ["timeline", `    title ${sanitizeMermaidText(title)}`];
  let lastPeriod = "";

  for (const ev of sorted) {
    const period = mermaidPeriod(ev.timeLabel);
    let eventLine = sanitizeMermaidText(ev.detail ? `${ev.title} (${ev.detail})` : ev.title);
    if (ev.acumuladoHabilMin != null && ev.kind === "ticket") {
      eventLine = sanitizeMermaidText(`${ev.title} · Σ ${formatMinutos(ev.acumuladoHabilMin)}`);
    } else if (ev.kind === "almuerzo" && ev.detail) {
      eventLine = sanitizeMermaidText(`${ev.title} · ${ev.detail}`);
    }
    if (period !== lastPeriod) {
      lines.push(`    ${period} : ${eventLine}`);
      lastPeriod = period;
    } else {
      lines.push(`         : ${eventLine}`);
    }
  }

  if (lines.length <= 2) {
    lines.push("    — : Sin eventos registrados");
  }
  return lines.join("\n");
}

function isHoliday(ymd: string, extra: Set<string>): boolean {
  return CO_HOLIDAYS.has(ymd) || extra.has(ymd);
}

function addEvent(
  list: TimelineEvent[],
  timeLabel: string,
  sortKey: number,
  title: string,
  kind: TimelineEvent["kind"],
  detail?: string,
  extra?: Partial<TimelineEvent>,
) {
  list.push({ timeLabel, sortKey, title, detail, kind, ...extra });
}

function lunchIso(ymd: string, h: number, m: number, schedule: WorkSchedule): string {
  return `${ymd}T${pad2(h)}:${pad2(m)}:00${schedule.tzOffset}`;
}

function fullDayVacation(ymd: string, lapsos: DeadLapse[], schedule: WorkSchedule): DeadLapse | null {
  const dayStartMs = new Date(lunchIso(ymd, schedule.dayStart.h, schedule.dayStart.m, schedule)).getTime();
  const dayEndMs = new Date(lunchIso(ymd, schedule.dayEnd.h, schedule.dayEnd.m, schedule)).getTime();
  for (const lapse of lapsos) {
    if (lapse.tipo !== "vacaciones") continue;
    const l0 = new Date(lapse.desde).getTime();
    const l1 = new Date(lapse.hasta).getTime();
    if (l0 <= dayStartMs && l1 >= dayEndMs) return lapse;
  }
  return null;
}

/** Hitos ordenados con tiempos acumulados hábiles (desde creación) y almuerzo explícito. */
export function buildTicketMilestones(
  metrics: TicketMetricResult,
  input: TicketMetricInput,
  schedule = DEFAULT_SCHEDULE,
): TicketMilestone[] {
  const cre = metrics.fechaCreacion;
  const ini = metrics.horaInicioAtencion;
  const cie = metrics.fechaCierre;
  const fin = cie || ini;
  if (!cre || !fin) return [];

  type Pt = {
    key: string;
    iso: string;
    label: string;
    icon: string;
    esExclusion: boolean;
    esJornada?: boolean;
    lunchEndIso?: string;
    nota?: string;
  };
  const points: Pt[] = [
    { key: "cre", iso: cre, label: "Creación / solicitud", icon: "mdi:ticket-outline", esExclusion: false },
  ];
  if (ini && ini !== cre) {
    points.push({ key: "ini", iso: ini, label: "Inicio de atención", icon: "mdi:play-circle-outline", esExclusion: false });
  }

  let ymd = bogotaYmd(new Date(cre));
  const endYmd = bogotaYmd(new Date(fin));
  const extra = new Set(input.festivosExtra || []);
  const lapsos = mergeMetricLapsos(input.lapsosMuertos || []);
  const t0 = new Date(cre).getTime();
  const t1 = new Date(fin).getTime();

  while (ymd <= endYmd) {
    const dow = bogotaWeekday(ymd);
    if (dow !== 0 && dow !== 6 && !isHoliday(ymd, extra)) {
      const vac = fullDayVacation(ymd, lapsos, schedule);
      if (vac) {
        const vs = lunchIso(ymd, schedule.dayStart.h, schedule.dayStart.m, schedule);
        if (new Date(vs).getTime() >= t0 && new Date(vs).getTime() <= t1) {
          points.push({
            key: `vac-${ymd}`,
            iso: vs,
            label: "Vacaciones",
            icon: "mdi:beach",
            esExclusion: true,
            nota: vac.motivo,
          });
        }
        ymd = nextDayYmd(ymd);
        continue;
      }
      const dayStartIso = lunchIso(ymd, schedule.dayStart.h, schedule.dayStart.m, schedule);
      const dayEndIso = lunchIso(ymd, schedule.dayEnd.h, schedule.dayEnd.m, schedule);
      const dayStartMs = new Date(dayStartIso).getTime();
      const dayEndMs = new Date(dayEndIso).getTime();
      if (dayEndMs >= t0 && dayStartMs <= t1) {
        if (dayStartMs >= t0 && dayStartMs <= t1) {
          points.push({
            key: `jor-in-${ymd}`,
            iso: dayStartIso,
            label: "Inicio jornada laboral",
            icon: "mdi:briefcase-clock-outline",
            esExclusion: false,
            esJornada: true,
          });
        }
        if (dayEndMs >= t0 && dayEndMs <= t1) {
          points.push({
            key: `jor-out-${ymd}`,
            iso: dayEndIso,
            label: "Fin jornada laboral",
            icon: "mdi:briefcase-off-outline",
            esExclusion: false,
            esJornada: true,
          });
        }
      }
      const ls = lunchIso(ymd, schedule.lunchStart.h, schedule.lunchStart.m, schedule);
      const le = lunchIso(ymd, schedule.lunchEnd.h, schedule.lunchEnd.m, schedule);
      const l0 = new Date(ls).getTime();
      const l1 = new Date(le).getTime();
      const lunchMin = schedule.lunchEnd.h * 60 + schedule.lunchEnd.m - (schedule.lunchStart.h * 60 + schedule.lunchStart.m);
      const lunchRange = `${pad2(schedule.lunchStart.h)}:${pad2(schedule.lunchStart.m)}–${pad2(schedule.lunchEnd.h)}:${pad2(schedule.lunchEnd.m)}`;
      if (l1 > t0 && l0 < t1) {
        const hasStart = l0 >= t0 && l0 <= t1;
        const hasEnd = l1 > t0 && l1 <= t1;
        if (hasStart && hasEnd) {
          points.push({
            key: `lunch-${ymd}`,
            iso: ls,
            label: "Almuerzo",
            icon: "mdi:food-fork-drink",
            esExclusion: true,
            lunchEndIso: le,
            nota: `${lunchRange} · No hábil · ${lunchMin} min excluidos · no suma al cómputo`,
          });
        } else if (hasStart) {
          points.push({
            key: `lunch0-${ymd}`,
            iso: ls,
            label: "Inicio almuerzo",
            icon: "mdi:food-fork-drink",
            esExclusion: true,
            nota: `No hábil · ${lunchMin} min excluidos (${lunchRange})`,
          });
        } else if (hasEnd) {
          points.push({
            key: `lunch1-${ymd}`,
            iso: le,
            label: "Fin almuerzo",
            icon: "mdi:food-off",
            esExclusion: true,
            nota: "Reanuda cómputo hábil",
          });
        }
      }
    }
    ymd = nextDayYmd(ymd);
  }

  if (cie) {
    points.push({ key: "cie", iso: cie, label: "Cierre / solución", icon: "mdi:check-circle-outline", esExclusion: false });
  }

  const sorted = points
    .slice()
    .sort((a, b) => new Date(a.iso).getTime() - new Date(b.iso).getTime())
    .filter((p) => {
      if (p.key === "cre" || p.key === "cie") return true;
      const t = new Date(p.iso).getTime();
      return t >= t0 && t <= t1;
    });

  let prevIso: string | null = null;
  let prevTimelineIso: string | null = null;
  const rows: TicketMilestone[] = [];

  for (const p of sorted) {
    const acum = businessMinutesBetween(cre, p.iso, input, schedule) ?? 0;
    const tramoDesdeAnterior = prevTimelineIso
      ? (businessMinutesBetween(prevTimelineIso, p.iso, input, schedule) ?? 0)
      : null;
    const tramoHabil = prevIso ? (businessMinutesBetween(prevIso, p.iso, input, schedule) ?? 0) : null;
    const tramoCal = prevTimelineIso ? (calendarMinutesBetween(prevTimelineIso, p.iso) ?? 0) : null;

    let nota = p.nota;
    if (p.esJornada) {
      nota =
        p.key.startsWith("jor-in-")
          ? `Horario laboral desde ${pad2(schedule.dayStart.h)}:${pad2(schedule.dayStart.m)}`
          : `Horario laboral hasta ${pad2(schedule.dayEnd.h)}:${pad2(schedule.dayEnd.m)}`;
    } else if (p.esExclusion && tramoHabil === 0 && prevIso) {
      nota = nota || "Sin tiempo hábil en este tramo";
    } else if (!p.esExclusion && p.key !== "cre" && tramoHabil != null && tramoHabil > 0) {
      nota = `+${formatMinutos(tramoHabil)} hábil en este tramo`;
    }

    const hora = p.lunchEndIso
      ? `${formatHoraBogota(p.iso)} – ${formatHoraBogota(p.lunchEndIso)}`
      : formatHoraBogota(p.iso);

    rows.push({
      key: p.key,
      label: p.label,
      iso: p.iso,
      hora,
      fechaTexto: formatTicketTs(p.iso),
      acumuladoHabilMin: acum,
      tramoHabilMin: tramoHabil,
      tramoDesdeAnteriorMin: tramoDesdeAnterior,
      tramoCalendarioMin: tramoCal,
      esExclusion: p.esExclusion,
      esJornada: p.esJornada,
      lunchFinIso: p.lunchEndIso ?? null,
      nota,
      icon: p.icon,
    });

    if (p.esJornada) {
      /* marcador visual — no avanza cadena hábil */
    } else if (p.key.startsWith("lunch-")) {
      prevIso = p.lunchEndIso || p.iso;
    } else if (!p.esExclusion || p.key.startsWith("lunch1")) {
      prevIso = p.iso;
    } else if (p.key.startsWith("lunch0") || p.key.startsWith("vac-")) {
      prevIso = p.iso;
    }
    prevTimelineIso = p.lunchEndIso || p.iso;
  }

  return rows;
}

/** Diagrama Mermaid único del ticket (hitos + exclusiones), sin desglose por jornada. */
export function buildTicketAnalysisTimeline(
  iticket: string,
  metrics: TicketMetricResult,
  input: TicketMetricInput,
  schedule = DEFAULT_SCHEDULE,
): { title: string; mermaid: string; mermaidUrl: string } | null {
  const milestones = buildTicketMilestones(metrics, input, schedule);
  if (!milestones.length) return null;

  const cre = metrics.fechaCreacion;
  const cie = metrics.fechaCierre;
  const creYmd = cre ? bogotaYmd(new Date(cre)) : "";
  const cieYmd = cie ? bogotaYmd(new Date(cie)) : "";
  const multiDay = creYmd !== cieYmd;

  const events: TimelineEvent[] = milestones.map((ms, i) => {
    const ymd = ms.iso ? bogotaYmd(new Date(ms.iso)) : creYmd;
    const timeLabel = multiDay ? `${shortDayLabel(ymd)} ${ms.hora}` : ms.hora;
    const sortKey = ms.iso ? new Date(ms.iso).getTime() : i;
    return {
      sortKey,
      timeLabel,
      title: ms.label,
      detail: ms.esExclusion ? ms.nota : undefined,
      kind: ms.esExclusion ? "almuerzo" : "ticket",
      acumuladoHabilMin: ms.acumuladoHabilMin,
    };
  });

  const title = `${iticket} — análisis del ticket`;
  const mermaid = eventsToMermaid(title, events);
  return { title, mermaid, mermaidUrl: mermaidInkUrl(mermaid) };
}

function enrichEventsWithAccumulation(
  events: TimelineEvent[],
  ymd: string,
  cre: string | null,
  input: TicketMetricInput,
  schedule: WorkSchedule,
): TimelineEvent[] {
  if (!cre) return events;
  const sorted = events.slice().sort((a, b) => a.sortKey - b.sortKey || a.title.localeCompare(b.title));
  let prevIso: string | null = null;

  return sorted.map((ev) => {
    if (ev.timeLabel === "Día completo" || !/^\d{1,2}:\d{2}$/.test(ev.timeLabel)) {
      return ev;
    }
    const iso = `${ymd}T${ev.timeLabel}:00${schedule.tzOffset}`;
    const acum = businessMinutesBetween(cre, iso, input, schedule);
    const tramoH = prevIso ? businessMinutesBetween(prevIso, iso, input, schedule) : null;
    const tramoC = prevIso ? calendarMinutesBetween(prevIso, iso) : null;
    if (ev.kind !== "almuerzo" || ev.title.includes("Fin")) prevIso = iso;
    else if (ev.title.includes("Inicio almuerzo")) prevIso = iso;
    const detailParts = [ev.detail];
    if (acum != null && (ev.kind === "ticket" || ev.kind === "jornada")) {
      detailParts.push(`Σ ${formatMinutos(acum)}`);
    }
    if (tramoH != null && tramoH > 0 && ev.kind === "ticket") {
      detailParts.push(`+${formatMinutos(tramoH)} tramo`);
    }
    return {
      ...ev,
      acumuladoHabilMin: acum,
      tramoHabilMin: tramoH,
      tramoCalendarioMin: tramoC,
      detail: detailParts.filter(Boolean).join(" · ") || ev.detail,
    };
  });
}

function eventsForDay(
  ymd: string,
  cre: string | null,
  ini: string | null,
  cie: string | null,
  lapsos: DeadLapse[],
  schedule: WorkSchedule,
  extra: Set<string>,
): { events: TimelineEvent[]; dayKind: TimelineDayDoc["dayKind"] } {
  const dow = bogotaWeekday(ymd);
  const events: TimelineEvent[] = [];

  if (dow === 0 || dow === 6) {
    addEvent(events, "Día completo", 0, "Fin de semana — no laborable", "muerto");
    return { events, dayKind: "fin_semana" };
  }
  if (isHoliday(ymd, extra)) {
    addEvent(events, "Día completo", 0, "Festivo Colombia — no laborable", "muerto");
    return { events, dayKind: "festivo" };
  }

  const ds = schedule.dayStart;
  const de = schedule.dayEnd;
  const ls = schedule.lunchStart;
  const le = schedule.lunchEnd;

  addEvent(events, `${pad2(ds.h)}:${pad2(ds.m)}`, ds.h * 60 + ds.m, "Inicio jornada laboral", "jornada");
  addEvent(events, `${pad2(ls.h)}:${pad2(ls.m)}`, ls.h * 60 + ls.m, "Inicio almuerzo", "almuerzo", "tiempo muerto");
  addEvent(events, `${pad2(le.h)}:${pad2(le.m)}`, le.h * 60 + le.m, "Fin almuerzo", "almuerzo");
  addEvent(events, `${pad2(de.h)}:${pad2(de.m)}`, de.h * 60 + de.m, "Fin jornada laboral", "jornada");

  if (cre && bogotaYmd(new Date(cre)) === ymd) {
    const t = bogotaHm(cre);
    addEvent(events, t.label, t.sortKey, "Creación de solicitud", "ticket");
  }
  if (ini && bogotaYmd(new Date(ini)) === ymd) {
    const t = bogotaHm(ini);
    addEvent(events, t.label, t.sortKey, "Inicio de atención", "ticket");
  }
  if (cie && bogotaYmd(new Date(cie)) === ymd) {
    const t = bogotaHm(cie);
    addEvent(events, t.label, t.sortKey, "Cierre / solución", "ticket");
  }

  for (const lapse of lapsos) {
    const l0 = new Date(lapse.desde).getTime();
    const l1 = new Date(lapse.hasta).getTime();
    if (Number.isNaN(l0) || Number.isNaN(l1)) continue;
    const day0 = new Date(`${ymd}T00:00:00${schedule.tzOffset}`).getTime();
    const day1 = day0 + 86400000;
    if (l1 <= day0 || l0 >= day1) continue;
    const from = bogotaHm(new Date(Math.max(l0, day0)).toISOString());
    const to = bogotaHm(new Date(Math.min(l1, day1)).toISOString());
    addEvent(events, from.label, from.sortKey, lapse.motivo || "Permiso / lapso muerto", "muerto", lapse.tipo || "otro");
    if (to.sortKey > from.sortKey) {
      addEvent(events, to.label, to.sortKey, "Fin lapso muerto", "muerto", lapse.motivo);
    }
  }

  return { events, dayKind: "habil" };
}

function buildMacroEvents(cre: string | null, ini: string | null, cie: string | null, days: TimelineDayDoc[]): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  if (cre) {
    const ymd = bogotaYmd(new Date(cre));
    const t = bogotaHm(cre);
    addEvent(events, shortDayLabel(ymd), t.sortKey, "Creación solicitud", "ticket", t.label);
  }
  if (ini && ini !== cre) {
    const ymd = bogotaYmd(new Date(ini));
    const t = bogotaHm(ini);
    addEvent(events, shortDayLabel(ymd), t.sortKey + 1, "Inicio atención", "ticket", t.label);
  }
  for (const day of days) {
    if (day.dayKind !== "habil") {
      addEvent(events, shortDayLabel(day.ymd), 720, day.dayKind === "festivo" ? "Festivo" : "Fin de semana", "muerto");
    }
  }
  if (cie) {
    const ymd = bogotaYmd(new Date(cie));
    const t = bogotaHm(cie);
    addEvent(events, shortDayLabel(ymd), t.sortKey + 2, "Cierre / solución", "ticket", t.label);
  }
  return events;
}

export function buildTicketTimeline(
  iticket: string,
  titulo: string,
  metrics: TicketMetricResult,
  input: TicketMetricInput,
  schedule = DEFAULT_SCHEDULE,
): TicketTimelineDoc | null {
  const cre = metrics.fechaCreacion;
  const cie = metrics.fechaCierre;
  if (!cre || !cie) return null;

  const extra = new Set(input.festivosExtra || []);
  const lapsos = metrics.lapsosMuertos.length ? metrics.lapsosMuertos : mergeMetricLapsos(input.lapsosMuertos || []);
  let ymd = bogotaYmd(new Date(cre));
  const endYmd = bogotaYmd(new Date(cie));
  const days: TimelineDayDoc[] = [];

  while (ymd <= endYmd) {
    const { events, dayKind } = eventsForDay(ymd, cre, metrics.horaInicioAtencion, cie, lapsos, schedule, extra);
    const enriched = enrichEventsWithAccumulation(events, ymd, cre, input, schedule);
    const title = `${iticket} — ${dayLabel(ymd)}`;
    const mermaid = eventsToMermaid(title, enriched);
    days.push({
      ymd,
      dayLabel: dayLabel(ymd),
      dayKind,
      events: enriched,
      mermaid,
      mermaidUrl: mermaidInkUrl(mermaid),
    });
    ymd = nextDayYmd(ymd);
  }

  const macroEvents = buildMacroEvents(cre, metrics.horaInicioAtencion, cie, days);
  const macroTitle = `${iticket} — ventana completa`;
  const macroMermaid = eventsToMermaid(macroTitle, macroEvents);

  const sch = schedule;
  const scheduleLabel =
    `${pad2(sch.dayStart.h)}:${pad2(sch.dayStart.m)}–${pad2(sch.dayEnd.h)}:${pad2(sch.dayEnd.m)}, ` +
    `almuerzo ${pad2(sch.lunchStart.h)}:${pad2(sch.lunchStart.m)}–${pad2(sch.lunchEnd.h)}:${pad2(sch.lunchEnd.m)}`;

  return {
    iticket,
    titulo,
    macroTitle,
    macroMermaid,
    macroUrl: mermaidInkUrl(macroMermaid),
    days,
    scheduleLabel,
  };
}

export { formatMinutos, formatTicketTs, formatHoraBogota };
