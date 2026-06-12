/**
 * Métricas de tickets — tiempo hábil (7–17, almuerzo 12:30–14:00, sin fines de semana/festivos).
 * Zona: America/Bogota (UTC-5, sin DST).
 */

export interface WorkSchedule {
  dayStart: { h: number; m: number };
  dayEnd: { h: number; m: number };
  lunchStart: { h: number; m: number };
  lunchEnd: { h: number; m: number };
  tzOffset: string;
}

export interface DeadLapse {
  desde: string;
  hasta: string;
  motivo: string;
  tipo?: "permiso" | "vacaciones" | "cumpleanos" | "festivo" | "almuerzo" | "fin_semana" | "fuera_horario" | "otro";
}

export interface TicketMetricInput {
  fechaCreacion?: string | null;
  horaInicioAtencion?: string | null;
  fechaCierre?: string | null;
  lapsosMuertos?: DeadLapse[];
  festivosExtra?: string[];
}

export interface ExclusionRow {
  motivo: string;
  tipo: string;
  minutos: number;
}

export interface TicketMetricResult {
  fechaCreacion: string | null;
  horaInicioAtencion: string | null;
  fechaCierre: string | null;
  minutosHastaAtencion: number | null;
  minutosAtencionActiva: number | null;
  minutosTotalSolucion: number | null;
  minutosExcluidosTotal: number;
  minutosCalendarioCreacionCierre: number | null;
  minutosCalendarioAtencionCierre: number | null;
  diasCalendario: number;
  diasHabilesEnRango: number;
  exclusiones: ExclusionRow[];
  lapsosMuertos: DeadLapse[];
  horario: WorkSchedule;
}

export const DEFAULT_SCHEDULE: WorkSchedule = {
  dayStart: { h: 7, m: 0 },
  dayEnd: { h: 17, m: 0 },
  lunchStart: { h: 12, m: 30 },
  lunchEnd: { h: 14, m: 0 },
  tzOffset: "-05:00",
};

/** Entrada de festivo con nombre (catálogo anual). */
export interface CoHolidayEntry {
  ymd: string;
  nombre: string;
}

/**
 * Catálogo oficial de festivos Colombia por año (Ley 51/1983 — Ley Emiliani).
 * Fuente: MinHacienda / festivos.com.co. Ampliar aquí al inicio de cada año.
 */
export const CO_HOLIDAYS_BY_YEAR: Record<number, CoHolidayEntry[]> = {
  2025: [
    { ymd: "2025-01-01", nombre: "Año Nuevo" },
    { ymd: "2025-01-06", nombre: "Reyes Magos" },
    { ymd: "2025-03-24", nombre: "San José" },
    { ymd: "2025-04-17", nombre: "Jueves Santo" },
    { ymd: "2025-04-18", nombre: "Viernes Santo" },
    { ymd: "2025-05-01", nombre: "Día del Trabajo" },
    { ymd: "2025-06-02", nombre: "Ascensión del Señor" },
    { ymd: "2025-06-23", nombre: "Corpus Christi" },
    { ymd: "2025-06-30", nombre: "Sagrado Corazón de Jesús" },
    { ymd: "2025-07-20", nombre: "Independencia de Colombia" },
    { ymd: "2025-08-07", nombre: "Batalla de Boyacá" },
    { ymd: "2025-08-18", nombre: "Asunción de la Virgen" },
    { ymd: "2025-10-13", nombre: "Día de la Raza" },
    { ymd: "2025-11-03", nombre: "Todos los Santos" },
    { ymd: "2025-11-17", nombre: "Independencia de Cartagena" },
    { ymd: "2025-12-08", nombre: "Inmaculada Concepción" },
    { ymd: "2025-12-25", nombre: "Navidad" },
  ],
  2026: [
    { ymd: "2026-01-01", nombre: "Año Nuevo" },
    { ymd: "2026-01-12", nombre: "Reyes Magos" },
    { ymd: "2026-03-23", nombre: "San José" },
    { ymd: "2026-04-02", nombre: "Jueves Santo" },
    { ymd: "2026-04-03", nombre: "Viernes Santo" },
    { ymd: "2026-05-01", nombre: "Día del Trabajo" },
    { ymd: "2026-05-18", nombre: "Ascensión del Señor" },
    { ymd: "2026-06-08", nombre: "Corpus Christi" },
    { ymd: "2026-06-15", nombre: "Sagrado Corazón de Jesús" },
    { ymd: "2026-06-29", nombre: "San Pedro y San Pablo" },
    { ymd: "2026-07-20", nombre: "Independencia de Colombia" },
    { ymd: "2026-08-07", nombre: "Batalla de Boyacá" },
    { ymd: "2026-08-17", nombre: "Asunción de la Virgen" },
    { ymd: "2026-10-12", nombre: "Día de la Raza" },
    { ymd: "2026-11-02", nombre: "Todos los Santos" },
    { ymd: "2026-11-16", nombre: "Independencia de Cartagena" },
    { ymd: "2026-12-08", nombre: "Inmaculada Concepción" },
    { ymd: "2026-12-25", nombre: "Navidad" },
  ],
  2027: [
    { ymd: "2027-01-01", nombre: "Año Nuevo" },
    { ymd: "2027-01-11", nombre: "Reyes Magos" },
    { ymd: "2027-03-22", nombre: "San José" },
    { ymd: "2027-03-25", nombre: "Jueves Santo" },
    { ymd: "2027-03-26", nombre: "Viernes Santo" },
    { ymd: "2027-05-01", nombre: "Día del Trabajo" },
    { ymd: "2027-05-10", nombre: "Ascensión del Señor" },
    { ymd: "2027-05-31", nombre: "Corpus Christi" },
    { ymd: "2027-06-07", nombre: "Sagrado Corazón de Jesús" },
    { ymd: "2027-07-05", nombre: "San Pedro y San Pablo" },
    { ymd: "2027-07-20", nombre: "Independencia de Colombia" },
    { ymd: "2027-08-07", nombre: "Batalla de Boyacá" },
    { ymd: "2027-08-16", nombre: "Asunción de la Virgen" },
    { ymd: "2027-10-18", nombre: "Día de la Raza" },
    { ymd: "2027-11-01", nombre: "Todos los Santos" },
    { ymd: "2027-11-15", nombre: "Independencia de Cartagena" },
    { ymd: "2027-12-08", nombre: "Inmaculada Concepción" },
    { ymd: "2027-12-25", nombre: "Navidad" },
  ],
};

function buildHolidaySet(catalog: Record<number, CoHolidayEntry[]>): Set<string> {
  const out = new Set<string>();
  for (const list of Object.values(catalog)) {
    for (const h of list) out.add(h.ymd);
  }
  return out;
}

/** Set plano YYYY-MM-DD — derivado del catálogo (todos los años cargados). */
export const CO_HOLIDAYS = buildHolidaySet(CO_HOLIDAYS_BY_YEAR);

/** Años disponibles en el catálogo, orden descendente. */
export const CO_HOLIDAY_YEARS = Object.keys(CO_HOLIDAYS_BY_YEAR).map(Number).sort((a, b) => b - a);

export function getCoHolidays(year: number): CoHolidayEntry[] {
  return CO_HOLIDAYS_BY_YEAR[year] || [];
}

/** @deprecated Usar getCoHolidays(2026) o CO_HOLIDAYS_BY_YEAR */
export const CO_HOLIDAYS_YTD_2026 = CO_HOLIDAYS_BY_YEAR[2026];

/**
 * Vacaciones disfrutadas — legalización 2026 (período trabajado 1/sep/2025–9/abr/2026).
 * 4 días: 27/mar, 30–31/mar y 1/abr/2026. No suman al tiempo hábil.
 */
export const JAGUDELOE_VACACIONES_2026: DeadLapse[] = [
  {
    desde: "2026-03-27T07:00:00-05:00",
    hasta: "2026-03-27T17:00:00-05:00",
    motivo: "Vacaciones disfrutadas (legalización 2026)",
    tipo: "vacaciones",
  },
  {
    desde: "2026-03-30T07:00:00-05:00",
    hasta: "2026-03-30T17:00:00-05:00",
    motivo: "Vacaciones disfrutadas (legalización 2026)",
    tipo: "vacaciones",
  },
  {
    desde: "2026-03-31T07:00:00-05:00",
    hasta: "2026-03-31T17:00:00-05:00",
    motivo: "Vacaciones disfrutadas (legalización 2026)",
    tipo: "vacaciones",
  },
  {
    desde: "2026-04-01T07:00:00-05:00",
    hasta: "2026-04-01T17:00:00-05:00",
    motivo: "Vacaciones disfrutadas (legalización 2026)",
    tipo: "vacaciones",
  },
];

/**
 * Lapsos muertos personales JAGUDELOE (horario hábil 7:00–17:00).
 * Se aplican a todos los cálculos de métricas de tickets.
 */
export const JAGUDELOE_LAPSOS_MUERTOS: DeadLapse[] = [
  ...JAGUDELOE_VACACIONES_2026,
  {
    desde: "2026-05-19T07:00:00-05:00",
    hasta: "2026-05-19T17:00:00-05:00",
    motivo: "Día libre por cumpleaños",
    tipo: "cumpleanos",
  },
  {
    desde: "2026-05-20T07:00:00-05:00",
    hasta: "2026-05-20T17:00:00-05:00",
    motivo: "Día de vacaciones",
    tipo: "vacaciones",
  },
  {
    desde: "2026-06-03T14:00:00-05:00",
    hasta: "2026-06-03T17:00:00-05:00",
    motivo: "Tarde libre (miércoles 3 jun)",
    tipo: "permiso",
  },
];

export function mergeMetricLapsos(ticketLapsos: DeadLapse[] = []): DeadLapse[] {
  return [...JAGUDELOE_LAPSOS_MUERTOS, ...ticketLapsos];
}

const MS_MIN = 60_000;
const ABBR: Record<string, string> = {
  ene: "01", feb: "02", mar: "03", abr: "04", may: "05", jun: "06",
  jul: "07", ago: "08", sep: "09", oct: "10", nov: "11", dic: "12",
};

export function parseTicketDate(raw: unknown): string | null {
  if (!raw) return null;
  const s = String(raw).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  const m = /(\d{1,2})\/([a-záéíóú]+)\.?\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})\s*(am|pm)?/i.exec(s);
  if (m) {
    const mm = ABBR[m[2].slice(0, 3).toLowerCase()];
    if (!mm) return null;
    let hh = Number(m[4]);
    const ap = (m[7] || "").toLowerCase();
    if (ap === "pm" && hh < 12) hh += 12;
    if (ap === "am" && hh === 12) hh = 0;
    const iso = `${m[3]}-${mm}-${m[1].padStart(2, "0")}T${String(hh).padStart(2, "0")}:${m[5]}:${m[6]}-05:00`;
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  const dOnly = /^(\d{1,2})\/([a-záéíóú]+)\.?\/(\d{4})$/i.exec(s);
  if (dOnly) {
    const mm = ABBR[dOnly[2].slice(0, 3).toLowerCase()];
    if (!mm) return null;
    const iso = `${dOnly[3]}-${mm}-${dOnly[1].padStart(2, "0")}T12:00:00-05:00`;
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  return null;
}

function bogotaYmd(d: Date): string {
  return d.toLocaleDateString("en-CA", { timeZone: "America/Bogota" });
}

function bogotaWeekday(d: Date): number {
  const w = d.toLocaleDateString("en-US", { timeZone: "America/Bogota", weekday: "short" });
  return ({ Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 } as Record<string, number>)[w] ?? 0;
}

function bogotaMs(ymd: string, h: number, m: number, s = 0, off = "-05:00"): number {
  return new Date(`${ymd}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}${off}`).getTime();
}

function intersectMs(a0: number, a1: number, b0: number, b1: number): number {
  const s = Math.max(a0, b0);
  const e = Math.min(a1, b1);
  return e > s ? e - s : 0;
}

function nextDayYmd(ymd: string): string {
  const d = new Date(`${ymd}T12:00:00-05:00`);
  d.setUTCDate(d.getUTCDate() + 1);
  return bogotaYmd(d);
}

function isHoliday(ymd: string, extra: Set<string>): boolean {
  return CO_HOLIDAYS.has(ymd) || extra.has(ymd);
}

function businessMsBetween(
  startMs: number,
  endMs: number,
  schedule: WorkSchedule,
  extraHolidays: Set<string>,
  deadLapses: DeadLapse[],
): { ms: number; exclusions: ExclusionRow[]; diasHabiles: number } {
  if (endMs <= startMs) return { ms: 0, exclusions: [], diasHabiles: 0 };

  const exclusions: ExclusionRow[] = [];
  let business = 0;
  let lunchExcluded = 0;
  let weekendExcluded = 0;
  let holidayExcluded = 0;
  let offHoursExcluded = 0;

  let ymd = bogotaYmd(new Date(startMs));
  const endYmd = bogotaYmd(new Date(endMs));
  const seenHabiles = new Set<string>();

  while (ymd <= endYmd) {
    const dow = bogotaWeekday(new Date(bogotaMs(ymd, 12, 0)));
    const dayStart = bogotaMs(ymd, schedule.dayStart.h, schedule.dayStart.m, 0, schedule.tzOffset);
    const dayEnd = bogotaMs(ymd, schedule.dayEnd.h, schedule.dayEnd.m, 0, schedule.tzOffset);
    const lunch0 = bogotaMs(ymd, schedule.lunchStart.h, schedule.lunchStart.m, 0, schedule.tzOffset);
    const lunch1 = bogotaMs(ymd, schedule.lunchEnd.h, schedule.lunchEnd.m, 0, schedule.tzOffset);
    const day0 = bogotaMs(ymd, 0, 0, 0, schedule.tzOffset);
    const day1 = day0 + 86400000;

    const seg0 = Math.max(startMs, day0);
    const seg1 = Math.min(endMs, day1);

    if (seg1 > seg0) {
      if (dow === 0 || dow === 6) {
        weekendExcluded += seg1 - seg0;
      } else if (isHoliday(ymd, extraHolidays)) {
        holidayExcluded += seg1 - seg0;
      } else {
        seenHabiles.add(ymd);
        const inWork = intersectMs(seg0, seg1, dayStart, dayEnd);
        const inLunch = intersectMs(seg0, seg1, lunch0, lunch1);
        const inMorning = intersectMs(seg0, seg1, dayStart, lunch0);
        const inAfternoon = intersectMs(seg0, seg1, lunch1, dayEnd);
        business += inMorning + inAfternoon;
        lunchExcluded += inLunch;
        const beforeWork = intersectMs(seg0, seg1, day0, dayStart);
        const afterWork = intersectMs(seg0, seg1, dayEnd, day1);
        offHoursExcluded += beforeWork + afterWork;
      }
    }
    ymd = nextDayYmd(ymd);
  }

  let deadExcluded = 0;
  for (const lapse of deadLapses) {
    const l0 = new Date(lapse.desde).getTime();
    const l1 = new Date(lapse.hasta).getTime();
    if (Number.isNaN(l0) || Number.isNaN(l1) || l1 <= l0) continue;
    const overlap = intersectMs(startMs, endMs, l0, l1);
    if (overlap <= 0) continue;
    const inner = businessMsBetween(
      Math.max(startMs, l0),
      Math.min(endMs, l1),
      schedule,
      extraHolidays,
      [],
    ).ms;
    deadExcluded += inner;
    exclusions.push({ motivo: lapse.motivo, tipo: lapse.tipo || "otro", minutos: Math.round(inner / MS_MIN) });
  }
  business = Math.max(0, business - deadExcluded);

  if (lunchExcluded > 0) exclusions.push({ motivo: "Almuerzo (12:30–14:00)", tipo: "almuerzo", minutos: Math.round(lunchExcluded / MS_MIN) });
  if (weekendExcluded > 0) exclusions.push({ motivo: "Fin de semana", tipo: "fin_semana", minutos: Math.round(weekendExcluded / MS_MIN) });
  if (holidayExcluded > 0) exclusions.push({ motivo: "Festivo", tipo: "festivo", minutos: Math.round(holidayExcluded / MS_MIN) });
  if (offHoursExcluded > 0) exclusions.push({ motivo: "Fuera de horario (7:00–17:00)", tipo: "fuera_horario", minutos: Math.round(offHoursExcluded / MS_MIN) });

  return { ms: business, exclusions, diasHabiles: seenHabiles.size };
}

function calendarMinutes(a: string | null, b: string | null): number | null {
  if (!a || !b) return null;
  const d0 = new Date(a).getTime();
  const d1 = new Date(b).getTime();
  if (Number.isNaN(d0) || Number.isNaN(d1)) return null;
  return Math.round((d1 - d0) / MS_MIN);
}

function diasCalendario(a: string | null, b: string | null): number {
  if (!a || !b) return 0;
  const d0 = bogotaYmd(new Date(a));
  const d1 = bogotaYmd(new Date(b));
  if (d0 === d1) return 1;
  let n = 0;
  let y = d0;
  while (y <= d1) { n++; y = nextDayYmd(y); }
  return n;
}

export function formatMinutos(min: number | null): string {
  if (min == null || Number.isNaN(min)) return "—";
  const m = Math.max(0, Math.round(min));
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h === 0) return `${r} min`;
  if (r === 0) return `${h} h`;
  return `${h} h ${r} min`;
}

/** Horas decimales para lectura rápida, p. ej. 5789 min → "96.5". */
export function formatHorasDecimal(min: number | null, decimals = 1): string | null {
  if (min == null || Number.isNaN(min)) return null;
  return (Math.max(0, min) / 60).toFixed(decimals);
}

export function formatHoraBogota(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    timeZone: "America/Bogota",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function businessMinutesBetween(
  fromIso: string | null,
  toIso: string | null,
  input: TicketMetricInput = {},
  schedule = DEFAULT_SCHEDULE,
): number | null {
  if (!fromIso || !toIso) return null;
  const t0 = new Date(fromIso).getTime();
  const t1 = new Date(toIso).getTime();
  if (Number.isNaN(t0) || Number.isNaN(t1) || t1 <= t0) return 0;
  const extra = new Set(input.festivosExtra || []);
  const lapsos = mergeMetricLapsos(input.lapsosMuertos || []);
  return Math.round(businessMsBetween(t0, t1, schedule, extra, lapsos).ms / MS_MIN);
}

export function calendarMinutesBetween(fromIso: string | null, toIso: string | null): number | null {
  return calendarMinutes(fromIso, toIso);
}

export function formatTicketTs(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-CO", {
    timeZone: "America/Bogota",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

export function extractMetricInput(tk: Record<string, unknown>): TicketMetricInput {
  const meta = (tk.meta || {}) as Record<string, unknown>;
  const metricas = (meta.metricas || meta.metrics || tk.metricas || {}) as Record<string, unknown>;
  const det = (tk.detallesExtra || {}) as Record<string, unknown>;
  const detMet = (det.metricas || {}) as Record<string, unknown>;
  const src = { ...detMet, ...metricas };

  let horaInicio = parseTicketDate(src.horaInicioAtencion || src.horaInicio || src.inicioAtencion);
  let fechaCierre = parseTicketDate(src.fechaCierre || src.horaCierre || src.cierre || tk.fechaEntrega);
  let fechaCreacion = parseTicketDate(src.fechaCreacion || src.creacion || tk.fechaSolicitud);

  const contexts = (tk.contexts || []) as Record<string, unknown>[];
  if (!horaInicio && contexts[0]?.horaInicio) horaInicio = parseTicketDate(contexts[0].horaInicio);
  if (!fechaCierre && contexts[0]?.horaFin) fechaCierre = parseTicketDate(contexts[0].horaFin);

  const lapsos = (src.lapsosMuertos || src.deadLapses || []) as DeadLapse[];
  const festivosExtra = (src.festivosExtra || []) as string[];

  return { fechaCreacion, horaInicioAtencion: horaInicio, fechaCierre, lapsosMuertos: lapsos, festivosExtra };
}

export function computeTicketMetrics(input: TicketMetricInput, schedule = DEFAULT_SCHEDULE): TicketMetricResult {
  const extra = new Set(input.festivosExtra || []);
  const lapsos = mergeMetricLapsos(input.lapsosMuertos || []);
  const cre = input.fechaCreacion || null;
  const ini = input.horaInicioAtencion || null;
  const cie = input.fechaCierre || null;

  let minutosHastaAtencion: number | null = null;
  let minutosAtencionActiva: number | null = null;
  let minutosTotalSolucion: number | null = null;
  let exclusiones: ExclusionRow[] = [];
  let diasHabiles = 0;

  if (cre && ini) {
    const r = businessMsBetween(new Date(cre).getTime(), new Date(ini).getTime(), schedule, extra, lapsos);
    minutosHastaAtencion = Math.round(r.ms / MS_MIN);
    diasHabiles = r.diasHabiles || 0;
  }
  if (ini && cie) {
    const r = businessMsBetween(new Date(ini).getTime(), new Date(cie).getTime(), schedule, extra, lapsos);
    minutosAtencionActiva = Math.round(r.ms / MS_MIN);
    diasHabiles = Math.max(diasHabiles, r.diasHabiles || 0);
  }
  if (cre && cie) {
    const r = businessMsBetween(new Date(cre).getTime(), new Date(cie).getTime(), schedule, extra, lapsos);
    minutosTotalSolucion = Math.round(r.ms / MS_MIN);
    exclusiones = r.exclusions;
    diasHabiles = Math.max(diasHabiles, r.diasHabiles || 0);
  }

  const minutosExcluidosTotal = exclusiones.reduce((s, e) => s + e.minutos, 0);

  return {
    fechaCreacion: cre,
    horaInicioAtencion: ini,
    fechaCierre: cie,
    minutosHastaAtencion,
    minutosAtencionActiva,
    minutosTotalSolucion,
    minutosExcluidosTotal,
    minutosCalendarioCreacionCierre: calendarMinutes(cre, cie),
    minutosCalendarioAtencionCierre: calendarMinutes(ini, cie),
    diasCalendario: diasCalendario(cre, cie),
    diasHabilesEnRango: diasHabiles,
    exclusiones,
    lapsosMuertos: lapsos,
    horario: schedule,
  };
}

export function computeFromTicket(tk: Record<string, unknown>): TicketMetricResult {
  return computeTicketMetrics(extractMetricInput(tk));
}
