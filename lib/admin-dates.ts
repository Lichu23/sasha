import { fromAr, toAr } from "@/lib/pickup";

const TZ = "America/Argentina/Buenos_Aires";
const DAY_MS = 24 * 60 * 60 * 1000;

const dayFormat = new Intl.DateTimeFormat("es-AR", { weekday: "short", day: "numeric", month: "short", timeZone: TZ });
const shortDayFormat = new Intl.DateTimeFormat("es-AR", { weekday: "short", day: "numeric", timeZone: TZ });
const timeFormat = new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: TZ });

/** Midnight (Argentina) of the day containing `time`, as a timestamp. */
export function startOfArDay(time: number) {
  const p = toAr(time);
  return fromAr(p.year, p.month, p.date, 0);
}

export const capitalize = (s: string) => s.replace(/^./, (c) => c.toUpperCase());

/** "Hoy", "Mañana", "Ayer" or "Viernes 30 de octubre". */
export function dayLabel(time: number, now: number) {
  const diff = Math.round((startOfArDay(time) - startOfArDay(now)) / DAY_MS);
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Mañana";
  if (diff === -1) return "Ayer";
  return capitalize(dayFormat.format(time).replace(/\./g, ""));
}

export const shortDay = (time: number) => shortDayFormat.format(time).replace(".", "");
export const formatTime = (time: number) => timeFormat.format(time);
export { DAY_MS };
