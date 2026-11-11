import { shop } from "@/shops/current";
import type { Shift } from "@/shops/types";

export { shop };

// Days use Date#getUTCDay() numbering on Argentina wall-clock time (0 = domingo).
const DAYS = [
  { key: "domingo", label: "Domingo", plural: "domingos" },
  { key: "lunes", label: "Lunes", plural: "lunes" },
  { key: "martes", label: "Martes", plural: "martes" },
  { key: "miercoles", label: "Miércoles", plural: "miércoles" },
  { key: "jueves", label: "Jueves", plural: "jueves" },
  { key: "viernes", label: "Viernes", plural: "viernes" },
  { key: "sabado", label: "Sábado", plural: "sábados" },
] as const;

/** Opening shifts for a weekday (0 = domingo): none when closed, two for split hours. */
export function shiftsOn(weekday: number): readonly Shift[] {
  const hours = shop.hours[DAYS[weekday].key];
  if (!hours) return [];
  return typeof hours[0] === "number" ? [hours as Shift] : (hours as readonly Shift[]);
}

export const isClosedDay = (weekday: number) => shiftsOn(weekday).length === 0;

// 8 → "8", 7.5 → "7:30".
const formatHour = (hour: number) => (Number.isInteger(hour) ? String(hour) : `${Math.floor(hour)}:30`);

// "8 a 20 hs", or "8 a 13 y 16 a 21 hs" for split hours.
const formatHours = (shifts: readonly Shift[]) => `${shifts.map(([opens, closes]) => `${formatHour(opens)} a ${formatHour(closes)}`).join(" y ")} hs`;

/** The week from Monday, as shown in schedules. */
export const weekSchedule = [1, 2, 3, 4, 5, 6, 0].map((weekday) => {
  const shifts = shiftsOn(weekday);
  return { weekday, day: DAYS[weekday].label, short: DAYS[weekday].label.slice(0, 3), hours: shifts.length ? formatHours(shifts) : null };
});

const closedDays = weekSchedule.filter((d) => d.hours === null);

/** "Lunes cerrado", "Sábados y domingos cerrados", or null when it never closes. */
export const closedLabel =
  closedDays.length === 0
    ? null
    : closedDays.length === 1
      ? `${closedDays[0].day} cerrado`
      : capitalize(`${joinList(closedDays.map((d) => DAYS[d.weekday].plural))} cerrados`);

/** "Los lunes estamos cerrados", for the order notice. */
export const closedSentence = closedDays.length
  ? `Los ${joinList(closedDays.map((d) => DAYS[d.weekday].plural))} estamos cerrados`
  : null;

/**
 * Compact schedule: runs of consecutive days with the same hours, e.g.
 * [{ days: "Lunes a viernes", hours: "8 a 19 hs" }, { days: "Sábado", hours: "9 a 13 hs" }].
 */
export const scheduleRuns = (() => {
  const runs: { from: string; to: string; hours: string }[] = [];
  for (const d of weekSchedule) {
    if (!d.hours) continue;
    const last = runs.at(-1);
    const previous = weekSchedule[weekSchedule.indexOf(d) - 1];
    if (last && previous?.hours === d.hours) last.to = d.day;
    else runs.push({ from: d.day, to: d.day, hours: d.hours });
  }
  if (runs.length === 1 && runs[0].from === "Lunes" && runs[0].to === "Domingo") return [{ days: "Todos los días", hours: runs[0].hours }];
  return runs.map((r) => ({
    days: r.from === r.to ? r.from : `${r.from} ${nextDay(r.from) === r.to ? "y" : "a"} ${r.to.toLowerCase()}`,
    hours: r.hours,
  }));
})();

// "Sábado y domingo" rather than "Sábado a domingo" for two days in a row.
function nextDay(day: string) {
  const i = weekSchedule.findIndex((d) => d.day === day);
  return weekSchedule[i + 1]?.day;
}

function joinList(items: string[], conjunction = "y") {
  return items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} ${conjunction} ${items.at(-1)}`;
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** The ordered item, in the right gender: "una torta", "un budín". */
const { item } = shop.orders;
export const noun = {
  one: item.one,
  other: item.other,
  count: (n: number) => `${n} ${n === 1 ? item.one : item.other}`,
  /** Picks the feminine or masculine form: g("agregada", "agregado"). */
  g: (feminine: string, masculine: string) => (item.feminine ? feminine : masculine),
};

/** "Rogel" from "Torta Rogel", for compact lists. */
export const shortName = (name: string) =>
  shop.orders.namePrefix && name.startsWith(shop.orders.namePrefix) ? name.slice(shop.orders.namePrefix.length) : name;

/** Label for a product and size, as stored with each order: "Torta Rogel (28 cm)". */
export const lineLabel = (name: string, size: { id: string; label: string }) =>
  size.id === "unica" ? name : `${name} (${size.label})`;

// Whole days read better from 3 days up: "5 días" rather than "120 hs hábiles".
const { leadTimeHours } = shop.orders;
export const leadTimeLabel =
  leadTimeHours === 0 ? null : leadTimeHours >= 72 && leadTimeHours % 24 === 0 ? `${leadTimeHours / 24} días` : `${leadTimeHours} hs hábiles`;

export const paysOnline = shop.orders.payment === "mercadopago";

/** Orders are consultas agreed on WhatsApp (payment "whatsapp"): the shop edits and confirms them in /admin. */
export const isConsulta = !paysOnline;

/** Table reservations: the shop has a salón and set `reservations`. */
export const reservations = shop.salon && shop.reservations ? { stayMinutes: 90, minNoticeHours: 2, ...shop.reservations } : null;

/** Demo: consultas open the simulated chat at /whatsapp instead of the real WhatsApp. */
export const simulatedWhatsapp = isConsulta && Boolean(shop.orders.simulatedWhatsapp);

/** Order numbers: PREFIX-1A2B3C4D. */
export const REFERENCE = new RegExp(`^${shop.orders.referencePrefix}-[0-9A-F]{8}$`);

export const addressWithArea = shop.neighborhood ? `${shop.address}, ${shop.neighborhood}` : shop.address;

export type Location = { name: string; address: string; mapsUrl: string };

/** Pickup points. A shop with one place gets a single entry built from its address. */
export const locations: Location[] = shop.locations?.length
  ? shop.locations
  : [{ name: "", address: addressWithArea, mapsUrl: shop.mapsUrl }];

/** Customers only choose where to pick up when there is more than one place. */
export const hasBranches = locations.length > 1;

/** "Cuffia 1386, Armstrong", or just the address for a single place. */
export const locationLabel = (location: Location) =>
  location.name ? `${location.address}, ${location.name}` : location.address;

/** Every pickup place in one line: "Rosario y Roldán · Retiro a coordinar" when they share an address. */
export const locationsSummary =
  hasBranches && locations.every((l) => l.address === locations[0].address)
    ? `${joinList(locations.map((l) => l.name))} · ${locations[0].address}`
    : locations.map(locationLabel).join(" · ");

/** "Armstrong o Cañada de Gómez", or the address for a single place. */
export const pickupPlaces = hasBranches
  ? joinList(locations.map((l) => l.name), "o")
  : shop.address;

export function whatsappLink(text: string) {
  return `https://wa.me/${shop.whatsapp}?text=${encodeURIComponent(text)}`;
}

/** Wording for the browse-only menu: a dine-in "Salón", or a plain "Menú" when it has a name. */
const menuName = shop.salon?.name;
export const salonLabels = menuName
  ? { nav: menuName, card: menuName, title: menuName, cta: `Ver ${menuName.toLowerCase()}`, eyebrow: "Todo lo que hacemos" }
  : { nav: "Salón", card: "En el salón", title: "Menú del salón", cta: "Ver menú del salón", eyebrow: "Para disfrutar acá" };

export const greeting = `¡Hola ${shop.shortName}!`;
