"use client";

import { useSyncExternalStore } from "react";
import { dayLabel } from "@/lib/admin-dates";
import { FIRST_NAMES, LAST_NAMES, random, type ChatMessage } from "@/lib/orders";
import { fromAr, toAr } from "@/lib/pickup";
import { reservations, shiftsOn, shop } from "@/lib/shop";
import { slug } from "@/shops/current";

// Table reservations (shops with `reservations` in shop.ts). A customer asks for a day, a time and a party size on
// /reservas; the shop confirms, modifies or cancels it in /admin/reservas and tells them on WhatsApp, like a consulta.
// Demo only: reservations live in this browser's localStorage. A real deployment needs a database behind a login.

export type ReservationStatus = "consulta" | "confirmada" | "cancelada" | "asistio" | "noshow";

export type Reservation = {
  ref: string;
  createdAt: number;
  /** When the table is wanted: a timestamp, on the half hour. */
  at: number;
  people: number;
  name: string;
  phone: string;
  notes: string;
  /** consulta → confirmada → asistio | noshow, or cancelada. */
  status: ReservationStatus;
  /** The shop changed what the customer asked for (time, people). */
  modified?: boolean;
  /** What the customer asked for, kept the first time the shop edits the reservation. */
  requested?: { at: number; people: number };
  /** A note from the shop for the customer. */
  shopNote?: string;
  /** The (simulated) WhatsApp chat about this reservation, as in lib/orders.ts. */
  messages?: ChatMessage[];
  draft?: string;
  /** Sample data generated for the demo, as opposed to a reservation made in the site. */
  sample: boolean;
};

const SEATS = reservations?.seats ?? 0;
const STAY_MS = (reservations?.stayMinutes ?? 90) * 60 * 1000;
const NOTICE_MS = (reservations?.minNoticeHours ?? 2) * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const BOOKING_WINDOW_DAYS = 14;
const HOUR_MS = 60 * 60 * 1000;

export const maxPartySize = reservations?.maxPartySize ?? 0;
export const totalSeats = SEATS;

/** Reservations that hold seats. */
const HOLDING: readonly ReservationStatus[] = ["consulta", "confirmada", "asistio"];

/** Start times offered on a weekday, as ms after midnight: every half hour while the stay still fits before closing. */
function slotOffsets(weekday: number): number[] {
  const stayHours = STAY_MS / HOUR_MS;
  return shiftsOn(weekday).flatMap(([opens, closes]) => {
    const offsets: number[] = [];
    for (let hour = Math.ceil(opens * 2) / 2; hour + stayHours <= closes + 1e-9; hour += 0.5) offsets.push(hour * HOUR_MS);
    return offsets;
  });
}

/** The times of a day (given its midnight) a table can be asked for. Empty when the shop is closed. */
export const daySlots = (dayStart: number): number[] => slotOffsets(toAr(dayStart).weekday).map((offset) => dayStart + offset);

/**
 * Seats taken around a time: the parties whose table overlaps it (a conservative count: it adds up everyone who
 * starts within a stay of that time). `ignore` leaves out one reservation, when it is the one being edited.
 */
export function seatsUsed(at: number, list: readonly Reservation[], ignore?: string): number {
  return list
    .filter((r) => HOLDING.includes(r.status) && r.ref !== ignore && r.at > at - STAY_MS && r.at < at + STAY_MS)
    .reduce((sum, r) => sum + r.people, 0);
}

export const seatsLeft = (at: number, list: readonly Reservation[], ignore?: string) => Math.max(0, SEATS - seatsUsed(at, list, ignore));

/** The busiest moment of a day: its most taken seats. */
export const peakSeats = (dayStart: number, list: readonly Reservation[]) => Math.max(0, ...daySlots(dayStart).map((t) => seatsUsed(t, list)));

export type ReservationDay = { key: string; dayStart: number; label: string; slots: number[] };

/** The days a customer can ask for, with their times from the notice onward. Days with none left are left out. */
export function reservationDays(now: number): ReservationDay[] {
  const today = toAr(now);
  const days: ReservationDay[] = [];
  for (let offset = 0; offset < BOOKING_WINDOW_DAYS; offset++) {
    const dayStart = fromAr(today.year, today.month, today.date + offset, 0);
    const slots = daySlots(dayStart).filter((t) => t >= now + NOTICE_MS);
    if (slots.length) days.push({ key: String(dayStart), dayStart, label: dayLabel(dayStart, now), slots });
  }
  return days;
}

// ---------------------------------------------------------------------------
// The store: localStorage, read through useSyncExternalStore (null while rendering on the server).

const KEY = `${slug}-reservations:v1`;

let cached: Reservation[] | null = null;
const listeners = new Set<() => void>();

function read(): Reservation[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as Reservation[];
    }
  } catch {}
  const seeded = sampleReservations(Date.now());
  write(seeded);
  return seeded;
}

function write(list: Reservation[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {}
}

const store = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    const onStorage = (e: StorageEvent) => {
      if (e.key !== KEY) return;
      cached = null;
      listener();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  },
  getSnapshot: () => (cached ??= read()),
  update(updater: (list: Reservation[]) => Reservation[]) {
    cached = updater(store.getSnapshot());
    write(cached);
    listeners.forEach((l) => l());
  },
};

export function useReservations(): Reservation[] | null {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, () => null);
}

const patch = (ref: string, change: (r: Reservation) => Reservation) => store.update((list) => list.map((r) => (r.ref === ref ? change(r) : r)));

export const reservationActions = {
  /** Records a reservation asked for in the site. Safe to call twice with the same ref. */
  add(reservation: Reservation) {
    store.update((list) => (list.some((r) => r.ref === reservation.ref) ? list : [reservation, ...list]));
  },
  confirm: (ref: string) => patch(ref, (r) => ({ ...r, status: "confirmada" })),
  cancel: (ref: string) => patch(ref, (r) => ({ ...r, status: "cancelada" })),
  setStatus: (ref: string, status: ReservationStatus) => patch(ref, (r) => ({ ...r, status })),
  /** The shop changes the time or the party size after talking to the customer; what was asked for is kept. */
  edit: (ref: string, change: { at: number; people: number; shopNote: string }) =>
    patch(ref, (r) => {
      const changed = change.at !== r.at || change.people !== r.people;
      return {
        ...r,
        at: change.at,
        people: change.people,
        shopNote: change.shopNote.trim() || undefined,
        modified: r.modified || changed,
        requested: r.requested ?? (changed ? { at: r.at, people: r.people } : undefined),
      };
    }),
  addMessage: (ref: string, message: ChatMessage) => patch(ref, (r) => ({ ...r, messages: [...(r.messages ?? []), message] })),
  setDraft: (ref: string, draft?: string) => patch(ref, (r) => ({ ...r, draft })),
};

// ---------------------------------------------------------------------------
// Sample data: a few reservations a day, never over the seats. Tomorrow has a lunch full of parties of eight, so the
// demo shows a time with no room.

const NOTES = ["", "", "", "Cumpleaños", "Con cochecito", "Mesa tranquila, por favor", "Una persona celíaca"];

function sampleReservations(now: number): Reservation[] {
  const today = toAr(now);
  const rand = random(today.year * 10000 + today.month * 100 + today.date + 7);
  const pick = <T,>(items: readonly T[]) => items[Math.floor(rand() * items.length)];
  const out: Reservation[] = [];

  const make = (at: number, people: number, status: ReservationStatus, notes: string): Reservation => ({
    ref: `${shop.orders.referencePrefix}-${Math.floor(rand() * 0xffffffff).toString(16).toUpperCase().padStart(8, "0")}`,
    createdAt: Math.min(now - HOUR_MS, at - (1 + rand() * 3) * DAY_MS),
    at,
    people,
    name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
    phone: `11 ${String(2000 + Math.floor(rand() * 7999))}-${String(1000 + Math.floor(rand() * 8999))}`,
    notes,
    status,
    sample: true,
  });

  for (let offset = -3; offset <= 7; offset++) {
    const dayStart = fromAr(today.year, today.month, today.date + offset, 0);
    const slots = daySlots(dayStart);
    if (!slots.length) continue;

    if (offset === 1) {
      const busy = slots[Math.floor(slots.length / 2)];
      for (let i = 0; i < SEATS / 8; i++) out.push(make(busy, 8, "confirmada", i === 0 ? "Almuerzo de la empresa" : ""));
    }

    const count = offset < 0 ? 3 + Math.floor(rand() * 3) : 2 + Math.floor(rand() * 4);
    for (let i = 0; i < count; i++) {
      const at = pick(slots);
      const people = 2 + Math.floor(rand() * 5);
      if (SEATS - seatsUsed(at, out) < people) continue;
      const status: ReservationStatus = at < now ? (rand() < 0.88 ? "asistio" : "noshow") : rand() < 0.3 ? "consulta" : "confirmada";
      out.push(make(at, people, status, pick(NOTES)));
    }
  }
  return out.sort((a, b) => b.createdAt - a.createdAt);
}
