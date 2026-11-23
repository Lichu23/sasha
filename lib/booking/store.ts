import { useSyncExternalStore } from "react";
import { startOfArDay } from "@/lib/admin-dates";
import { toAr } from "@/lib/pickup";
import { classesOn, MINUTE, freeStaff, isBookableDay, type Booking, type Status } from "./availability";
import { depositOf, offerOf, type Venue, type VenueSlug } from "./venues";

// The bookings of a demo business live in localStorage, so the customer's page and the panel see each other in the
// same browser (and sync between tabs). The first time, they start from believable bookings around today. A real
// business needs a database with the seat / time check done on the server: see README, "Booking demos".

const EVENT = "booking-demo";
const key = (slug: VenueSlug) => `booking-demo-${slug}`;
const DAY = 24 * 60 * MINUTE;

const FIRST = ["Lucía", "Marta", "Carmen", "Paula", "Elena", "Sara", "Laura", "Irene", "Andrea", "Nuria", "Claudia", "Alba", "Raquel", "Ana", "Marina", "Silvia", "Cristina", "Patricia", "Beatriz", "Rocío", "Teresa", "Inma", "Julia", "Sonia", "Natalia", "Pilar"];
const LAST = ["García", "Martínez", "López", "Sánchez", "Pérez", "Gómez", "Ruiz", "Hernández", "Díaz", "Moreno", "Muñoz", "Álvarez", "Romero", "Navarro", "Torres", "Gil", "Serrano", "Blanco", "Molina", "Ortega"];

const FIRST_AR = ["Lucía", "Martina", "Camila", "Julieta", "Agustina", "Florencia", "Mariana", "Valentina", "Carolina", "Sofía", "Nicolás", "Matías", "Federico", "Lucas", "Julián", "Facundo", "Candela", "Milagros"];
const LAST_AR = ["González", "Rodríguez", "Fernández", "López", "Martínez", "Pérez", "Gómez", "Díaz", "Sosa", "Romero", "Álvarez", "Torres", "Ruiz", "Acosta", "Benítez", "Medina"];

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Bookings around `today` (a midnight): a few days back, and the next ones, so the panel is never empty. */
export function seedBookings(venue: Venue, today: number): Booking[] {
  const now = today + 9 * 60 * MINUTE; // the seed is stable through the day
  const out: Booking[] = [];
  const rand = rng(Math.floor(today / DAY) * 31 + (venue.slug === "estudio" ? 7 : venue.slug === "nutricion" ? 19 : 13));
  const ar = venue.locale === "es-AR";
  const person = () => (ar ? `${FIRST_AR[Math.floor(rand() * FIRST_AR.length)]} ${LAST_AR[Math.floor(rand() * LAST_AR.length)]}` : `${FIRST[Math.floor(rand() * FIRST.length)]} ${LAST[Math.floor(rand() * LAST.length)]}`);
  const phone = () => (ar ? `11 ${Math.floor(3000 + rand() * 6999)}-${Math.floor(1000 + rand() * 8999)}` : `6${Math.floor(10 + rand() * 89)} ${Math.floor(100 + rand() * 899)} ${Math.floor(100 + rand() * 899)}`);
  // A practice with clients that come back (patients view): a fixed pool of people instead of a new one each time.
  const pool = venue.patients ? Array.from({ length: 45 }, () => ({ name: person(), phone: phone() })) : null;
  const who = () => (pool ? pool[Math.floor(rand() * pool.length)] : { name: person(), phone: phone() });
  const ref = () => `${venue.refPrefix}-${Math.floor(rand() * 0xffffff).toString(16).toUpperCase().padStart(6, "0")}`;
  const status = (start: number, minutes: number): Status => {
    if (start + minutes * MINUTE > now) return "confirmada";
    return rand() < 0.1 ? "noshow" : "asistio";
  };
  const make = (offerId: string, staff: string, start: number, paid: (price: number) => number): Booking => {
    const offer = offerOf(venue, offerId)!;
    const patient = who();
    return {
      id: crypto.randomUUID(),
      ref: ref(),
      offer: offerId,
      staff,
      start,
      minutes: offer.minutes,
      name: patient.name,
      phone: patient.phone,
      notes: "",
      price: offer.price,
      paid: paid(offer.price),
      method: venue.payments[rand() < 0.4 ? 1 : 0],
      ...(offer.modes && offer.modes.length > 1 ? { modality: rand() < 0.35 ? ("online" as const) : ("presencial" as const) } : {}),
      status: status(start, offer.minutes),
      createdAt: start - Math.floor(rand() * 5 + 1) * DAY,
    };
  };

  for (let d = -60; d <= 10; d++) {
    const day = today + d * DAY;
    if (!isBookableDay(venue, day)) continue;

    if (venue.mode === "classes") {
      for (const session of classesOn(venue, day, [])) {
        const wanted = d === 1 && session.offer.id === "reformer" ? session.capacity - 2 : Math.round(session.capacity * (0.3 + rand() * 0.6));
        const taken = Math.min(session.capacity, d < 0 ? Math.max(2, wanted) : wanted);
        for (let i = 0; i < taken; i++) out.push(make(session.offer.id, session.staff, session.start, (price) => depositOf(venue, price)));
      }
    } else {
      const open = venue.open[toAr(day).weekday]!;
      for (const staff of venue.staff) {
        const mine = venue.offers.filter((o) => o.staff.includes(staff.id));
        for (let m = open[0]; m < open[1]; m += 30) {
          if (rand() > (d === 1 ? 0.3 : 0.2)) continue;
          const offer = mine[Math.floor(rand() * mine.length)];
          const start = day + m * MINUTE;
          if (m + offer.minutes > open[1] || !freeStaff(venue, offer, start, out).some((s) => s.id === staff.id)) continue;
          out.push(make(offer.id, staff.id, start, (price) => depositOf(venue, price)));
          m += Math.ceil(offer.minutes / 30) * 30 - 30;
        }
      }
    }
  }
  return out.sort((a, b) => a.start - b.start);
}

let memory: Partial<Record<VenueSlug, Booking[]>> = {};
const cache = new Map<VenueSlug, { raw: string | null; day: number; list: Booking[] }>();

function read(venue: Venue): Booking[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(key(venue.slug));
  } catch {}
  const day = startOfArDay(Date.now());
  const hit = cache.get(venue.slug);
  if (hit && hit.raw === raw && (raw !== null || hit.day === day)) return hit.list;
  let list: Booking[] | undefined;
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) list = parsed;
    } catch {}
  }
  list ??= memory[venue.slug] ?? seedBookings(venue, day);
  cache.set(venue.slug, { raw, day, list });
  return list;
}

function write(venue: Venue, list: Booking[]) {
  memory[venue.slug] = list;
  let raw: string | null = null;
  try {
    raw = JSON.stringify(list);
    localStorage.setItem(key(venue.slug), raw);
  } catch {
    raw = null;
  }
  cache.set(venue.slug, { raw, day: startOfArDay(Date.now()), list });
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** The business's bookings; null while rendering on the server. */
export function useBookings(venue: Venue): Booking[] | null {
  return useSyncExternalStore(
    subscribe,
    () => read(venue),
    () => null,
  );
}

export const bookingActions = (venue: Venue) => ({
  add(booking: Booking) {
    write(venue, [...read(venue), booking].sort((a, b) => a.start - b.start));
  },
  setStatus(id: string, status: Status) {
    write(venue, read(venue).map((b) => (b.id === id ? { ...b, status } : b)));
  },
  reset() {
    memory = {};
    try {
      localStorage.removeItem(key(venue.slug));
    } catch {}
    cache.delete(venue.slug);
    window.dispatchEvent(new Event(EVENT));
  },
});
