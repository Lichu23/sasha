import { addDays, minutesOfDay, toDateKey, toMinutes, toTime, weekdayOf } from "./dates";
import type { Appointment, ClinicConfig, DateKey, Service, Time } from "./types";

export type Slot = { time: Time; professionalId: string };

/** Days a patient can pick: today through today + bookingWindowDays. */
export function bookableDays(clinic: ClinicConfig, today: DateKey): DateKey[] {
  return Array.from({ length: clinic.bookingWindowDays + 1 }, (_, i) => addDays(today, i));
}

type SlotQuery = {
  clinic: ClinicConfig;
  service: Service;
  /** A professional id, or "any" to offer every free start time across the team. */
  professionalId: string;
  date: DateKey;
  appointments: Appointment[];
  now: Date;
  /** Minimum notice in minutes (0 for appointments the clinic enters by hand). */
  leadMinutes: number;
};

/** Free start times for one service on one day. */
export function getSlots({ clinic, service, professionalId, date, appointments, now, leadMinutes }: SlotQuery): Slot[] {
  const today = toDateKey(now);
  if (date < today || date > addDays(today, clinic.bookingWindowDays)) return [];

  const earliest = date === today ? minutesOfDay(now) + leadMinutes : 0;
  const weekday = weekdayOf(date);
  const byTime = new Map<Time, Slot>();

  for (const pro of clinic.professionals) {
    if (!pro.serviceIds.includes(service.id)) continue;
    if (professionalId !== "any" && pro.id !== professionalId) continue;

    // Cancelled visits free the slot; no-shows and completed ones keep it taken.
    const busy = appointments
      .filter((a) => a.professionalId === pro.id && a.date === date && a.status !== "cancelado")
      .map((a) => [toMinutes(a.time), toMinutes(a.time) + a.minutes] as const);

    for (const [from, to] of pro.schedule[weekday] ?? []) {
      const end = toMinutes(to);
      for (let start = toMinutes(from); start + service.minutes <= end; start += clinic.slotStepMinutes) {
        if (start < earliest) continue;
        const finish = start + service.minutes;
        if (busy.some(([b0, b1]) => start < b1 && finish > b0)) continue;
        const time = toTime(start);
        if (!byTime.has(time)) byTime.set(time, { time, professionalId: pro.id });
      }
    }
  }

  return [...byTime.values()].sort((a, b) => a.time.localeCompare(b.time));
}
