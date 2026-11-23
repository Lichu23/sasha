import { startOfArDay } from "@/lib/admin-dates";
import { toAr } from "@/lib/pickup";
import { offerOf, type Modality, type Offer, type PayMethod, type Staff, type Venue } from "./venues";

// What can be booked: the classes of a day with their seats left (studio), and the free times of a treatment with
// each professional (beauty center). Both read the same bookings the panel shows, so a booking made on the
// customer's page takes its seat or its time out right away.

export const MINUTE = 60_000;
/** How long before the start a booking is still accepted. */
export const NOTICE_MINUTES = 60;

/** What the practice did after the consultation: a private note, and the email sent to the patient. */
export type Visit = { note?: string; mail?: { template: string; images: string[]; sentAt: number } };

export type Status = "confirmada" | "asistio" | "noshow" | "cancelada";
export type Booking = {
  id: string;
  ref: string;
  offer: string;
  staff: string;
  /** The start, as a timestamp. */
  start: number;
  minutes: number;
  name: string;
  phone: string;
  notes: string;
  price: number;
  /** What was paid online: the full price, or the deposit when the venue asks for one. */
  paid: number;
  method: PayMethod;
  /** The patient's email (for the confirmation and the emails after the visit). */
  email?: string;
  /** Booked without paying online: what is paid is whatever the panel has confirmed by hand. */
  onSite?: boolean;
  visit?: Visit;
  /** In person or by video call (offers that can be both). */
  modality?: Modality;
  status: Status;
  createdAt: number;
};

export const isActive = (b: Booking) => b.status !== "cancelada";

export type ClassSession = { key: string; offer: Offer; staff: string; start: number; capacity: number; taken: number };

/** The classes of one day (midnight timestamp), by start time, with the seats taken by active bookings. */
export function classesOn(venue: Venue, day: number, bookings: readonly Booking[]): ClassSession[] {
  const weekday = toAr(day).weekday;
  return venue.timetable
    .filter((row) => row.weekdays.includes(weekday))
    .map((row) => {
      const offer = offerOf(venue, row.offer)!;
      const start = day + row.at * MINUTE;
      const taken = bookings.filter((b) => isActive(b) && b.offer === offer.id && b.start === start).length;
      return { key: `${offer.id}-${start}`, offer, staff: offer.staff[0], start, capacity: offer.capacity ?? 10, taken };
    })
    .sort((a, b) => a.start - b.start);
}

/** Professionals of the offer who are free for the whole treatment starting at `start`. */
export function freeStaff(venue: Venue, offer: Offer, start: number, bookings: readonly Booking[]): Staff[] {
  const end = start + offer.minutes * MINUTE;
  return venue.staff.filter(
    (s) => offer.staff.includes(s.id) && !bookings.some((b) => isActive(b) && b.staff === s.id && b.start < end && b.start + b.minutes * MINUTE > start),
  );
}

export type TimeOption = { start: number; free: boolean; staff: string | null };

/** Every start (every 30 minutes) a treatment fits in on a day, and whether `staffId` ("any" = anyone) is free then. */
export function timesFor(venue: Venue, day: number, offer: Offer, staffId: string, bookings: readonly Booking[], now: number): TimeOption[] {
  const open = venue.open[toAr(day).weekday];
  if (!open) return [];
  const out: TimeOption[] = [];
  for (let m = open[0]; m + offer.minutes <= open[1]; m += 30) {
    const start = day + m * MINUTE;
    if (start < now + NOTICE_MINUTES * MINUTE) continue;
    const free = freeStaff(venue, offer, start, bookings);
    const who = staffId === "any" ? free[0]?.id : free.find((s) => s.id === staffId)?.id;
    out.push({ start, free: Boolean(who), staff: who ?? null });
  }
  return out;
}

/** Days with something to book: the studio has classes, the center is open. */
export const isBookableDay = (venue: Venue, day: number) => (venue.mode === "classes" ? venue.timetable.some((r) => r.weekdays.includes(toAr(day).weekday)) : Boolean(venue.open[toAr(day).weekday]));

export const today = (now: number) => startOfArDay(now);

/**
 * What a booking is worth in the sales: a customer who came is worth the full price, a no-show keeps what was already
 * paid online, a cancellation is refunded, and one still to come counts what was paid.
 */
export const saleValue = (b: Booking) => (b.status === "cancelada" ? 0 : b.onSite ? b.paid : b.status === "asistio" ? b.price : b.paid);
