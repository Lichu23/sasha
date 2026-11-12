import type { DateKey, Time } from "./types";

const pad = (n: number) => String(n).padStart(2, "0");

export function toDateKey(d: Date): DateKey {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromDateKey(key: DateKey): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function isDateKey(value: string): value is DateKey {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return toDateKey(fromDateKey(value)) === value;
}

export function addDays(key: DateKey, days: number): DateKey {
  const d = fromDateKey(key);
  d.setDate(d.getDate() + days);
  return toDateKey(d);
}

export function weekdayOf(key: DateKey): number {
  return fromDateKey(key).getDay();
}

export function toMinutes(time: Time): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function toTime(minutes: number): Time {
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}

export function minutesOfDay(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

const shortDay = new Intl.DateTimeFormat("es-AR", { weekday: "short", day: "numeric", month: "short" });
const longDay = new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", month: "long" });
const weekdayOnly = new Intl.DateTimeFormat("es-AR", { weekday: "short" });

// Only the first letter: CSS `capitalize` would also turn "de" into "De".
const upperFirst = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export const formatShortDay = (key: DateKey) => upperFirst(shortDay.format(fromDateKey(key)));
export const formatLongDay = (key: DateKey) => upperFirst(longDay.format(fromDateKey(key)));
export const formatWeekday = (key: DateKey) => upperFirst(weekdayOnly.format(fromDateKey(key)));
export const dayNumber = (key: DateKey) => fromDateKey(key).getDate();

/** "20260512" + "0930" → "20260512T093000", for calendar links. */
export function toCalendarStamp(date: DateKey, time: Time): string {
  return `${date.replaceAll("-", "")}T${time.replace(":", "")}00`;
}

export function formatPrice(ars: number): string {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(ars);
}
