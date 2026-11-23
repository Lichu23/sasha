"use client";

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { dayLabel, formatTime, startOfArDay, DAY_MS } from "@/lib/admin-dates";
import { classesOn, isBookableDay, NOTICE_MINUTES, MINUTE, type Booking, type ClassSession } from "@/lib/booking/availability";
import { bookingActions, useBookings } from "@/lib/booking/store";
import { money, staffOf, type Venue } from "@/lib/booking/venues";
import { useNow } from "@/lib/use-now";
import { Confirmation } from "./confirmation";
import { PaySheet, type Contact } from "./pay-sheet";
import { CalendarIcon, ClockIcon, primaryButton, UserIcon } from "./ui";

// The studio's customer page: pick a day, see its classes with the seats left, take one and pay for it.

export function ClassesBooking({ venue }: { venue: Venue }) {
  const now = useNow();
  const bookings = useBookings(venue);
  const [picked, setPicked] = useState<number | null>(null);
  const [session, setSession] = useState<ClassSession | null>(null);
  const [done, setDone] = useState<Booking | null>(null);

  if (now === null || bookings === null) return <p className="px-5 py-10 text-center text-muted">Cargando las clases…</p>;
  const today = startOfArDay(now);
  const day = picked ?? today;
  const classes = classesOn(venue, day, bookings).filter((c) => c.start >= now + NOTICE_MINUTES * MINUTE);

  const stamp: number = now; // narrowed: closures below keep it a number
  if (done) return <Confirmation venue={venue} booking={done} now={now} onAgain={() => setDone(null)} />;

  function paid(contact: Contact) {
    if (!session) return;
    const booking: Booking = {
      id: crypto.randomUUID(),
      ref: `${venue.refPrefix}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
      offer: session.offer.id,
      staff: session.staff,
      start: session.start,
      minutes: session.offer.minutes,
      name: contact.name,
      phone: contact.phone,
      notes: contact.notes,
      price: session.offer.price,
      paid: session.offer.price,
      method: contact.method,
      status: "confirmada",
      createdAt: stamp,
    };
    bookingActions(venue).add(booking);
    setSession(null);
    setDone(booking);
    window.scrollTo({ top: 0 });
  }

  return (
    <section id="reservar" aria-labelledby="reservar-titulo" className="mx-auto w-full max-w-md px-4 pt-8 pb-10 lg:max-w-6xl lg:px-8 lg:pt-16 lg:pb-20">
      <h2 id="reservar-titulo" className="font-display text-3xl font-semibold lg:text-5xl">
        Reserva tu clase
      </h2>
      <p className="mt-1 text-muted lg:text-lg">Elige un día y verás las clases con plazas libres.</p>

      {/* From lg up: the calendar stays on the left while the day's classes fill the right. */}
      <div className="lg:mt-8 lg:grid lg:grid-cols-[22rem_minmax(0,1fr)] lg:items-start lg:gap-12">
      <div className="lg:sticky lg:top-20">
      <div className="mt-5 flex items-center gap-2 font-semibold lg:mt-0">
        <CalendarIcon className="text-brand" /> ¿Qué día?
      </div>
      <Calendar
        today={today}
        value={day}
        onChange={setPicked}
        minDay={today}
        maxDay={today + venue.windowDays * DAY_MS}
        isDisabled={(d) => !isBookableDay(venue, d)}
        className="mt-3 rounded-2xl bg-paper p-3 ring-1 ring-line"
      />

      </div>

      <div>
      <div className="mt-7 flex items-center gap-2 font-semibold lg:mt-0">
        <ClockIcon className="text-brand" /> Clases del {dayLabel(day, now).toLowerCase()}
      </div>
      {classes.length === 0 ? <p className="mt-3 rounded-2xl bg-paper px-4 py-5 text-center text-muted ring-1 ring-line">Ya no quedan clases este día. Elige otro en el calendario.</p> : null}
      <ul aria-label="Clases" className="mt-3 grid gap-3 lg:grid-cols-2">
        {classes.map((c) => {
          const left = c.capacity - c.taken;
          const full = left <= 0;
          return (
            <li key={c.key} data-class={c.offer.id} className="rounded-2xl bg-paper p-4 ring-1 ring-line">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display text-xl leading-tight font-semibold">{c.offer.name}</p>
                  <p className="mt-0.5 text-sm text-muted">{c.offer.blurb}</p>
                </div>
                <p className="shrink-0 rounded-xl bg-blush px-2.5 py-1 text-lg font-semibold text-brand-ink tabular-nums">{formatTime(c.start)}</p>
              </div>
              <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <ClockIcon className="size-4" /> {c.offer.minutes} min
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <UserIcon className="size-4" /> {staffOf(venue, c.staff)?.name}
                </span>
                <span className={full ? "font-semibold text-brand-ink" : left <= 3 ? "font-semibold text-warn-ink" : ""}>{full ? "Completa" : left === 1 ? "Queda 1 plaza" : `Quedan ${left} plazas`}</span>
              </p>
              <button type="button" disabled={full} onClick={() => setSession(c)} className={`${primaryButton} mt-3`}>
                {full ? "Sin plazas" : `Reservar plaza · ${money(venue, c.offer.price)}`}
              </button>
            </li>
          );
        })}
      </ul>
      </div>
      </div>

      <PaySheet
        venue={venue}
        open={session !== null}
        onOpenChange={(open) => !open && setSession(null)}
        title="Confirma tu plaza"
        lines={
          session
            ? [`${session.offer.name} · ${session.offer.minutes} min`, `${dayLabel(session.start, now)}, ${formatTime(session.start)} h · con ${staffOf(venue, session.staff)?.name}`]
            : []
        }
        amount={session?.offer.price ?? 0}
        onPaid={paid}
      />
    </section>
  );
}
