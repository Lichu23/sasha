"use client";

import { useState } from "react";
import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { dayLabel, formatTime, startOfArDay, DAY_MS } from "@/lib/admin-dates";
import { isBookableDay, timesFor, type Booking } from "@/lib/booking/availability";
import { bookingActions, useBookings } from "@/lib/booking/store";
import { euros, offerOf, staffOf, type Venue } from "@/lib/booking/venues";
import { useNow } from "@/lib/use-now";
import { Confirmation } from "./confirmation";
import { PaySheet, type Contact } from "./pay-sheet";
import { CalendarIcon, ClockIcon, primaryButton, UserIcon } from "./ui";

// The beauty center's customer page: a treatment, who does it, a day and a time, then a small deposit to hold it.

const card =
  "cursor-pointer rounded-2xl bg-paper p-4 text-left ring-1 ring-line transition-[box-shadow,transform] outline-none hover:ring-brand/50 focus-visible:ring-2 focus-visible:ring-brand active:scale-[0.99] data-checked:bg-blush data-checked:ring-2 data-checked:ring-brand motion-reduce:active:scale-100";
const chip =
  "cursor-pointer rounded-xl bg-paper py-2.5 text-center text-sm font-medium tabular-nums ring-1 ring-line transition-colors outline-none hover:ring-brand/50 focus-visible:ring-2 focus-visible:ring-brand data-checked:bg-brand data-checked:text-white data-checked:ring-brand data-disabled:cursor-not-allowed data-disabled:opacity-40 data-disabled:line-through data-disabled:hover:ring-line";

export function ServicesBooking({ venue }: { venue: Venue }) {
  const now = useNow();
  const bookings = useBookings(venue);
  const [offerId, setOfferId] = useState<string | null>(null);
  const [staffId, setStaffId] = useState("any");
  const [picked, setPicked] = useState<number | null>(null);
  const [start, setStart] = useState<number | null>(null);
  const [paying, setPaying] = useState(false);
  const [done, setDone] = useState<Booking | null>(null);

  if (now === null || bookings === null) return <p className="px-5 py-10 text-center text-muted">Cargando la agenda…</p>;
  const stamp: number = now; // narrowed: closures below keep it a number
  if (done) return <Confirmation venue={venue} booking={done} now={now} onAgain={() => setDone(null)} />;

  const today = startOfArDay(now);
  const offer = offerId ? offerOf(venue, offerId) : undefined;
  const staffChoice = offer && (staffId === "any" || offer.staff.includes(staffId)) ? staffId : "any";
  const day = picked ?? today;
  const times = offer ? timesFor(venue, day, offer, staffChoice, bookings, now) : [];
  const chosen = times.find((t) => t.start === start && t.free);
  const groups = [...new Set(venue.offers.map((o) => o.group))];

  function paid(contact: Contact) {
    if (!offer || !chosen?.staff) return;
    const booking: Booking = {
      id: crypto.randomUUID(),
      ref: `${venue.refPrefix}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
      offer: offer.id,
      staff: chosen.staff,
      start: chosen.start,
      minutes: offer.minutes,
      name: contact.name,
      phone: contact.phone,
      notes: contact.notes,
      price: offer.price,
      paid: venue.deposit,
      method: contact.method,
      status: "confirmada",
      createdAt: stamp,
    };
    bookingActions(venue).add(booking);
    setPaying(false);
    setDone(booking);
    setOfferId(null);
    setStart(null);
    setPicked(null);
    window.scrollTo({ top: 0 });
  }

  return (
    <section id="reservar" aria-labelledby="reservar-titulo" className="mx-auto w-full max-w-md px-4 pt-8 pb-32">
      <h2 id="reservar-titulo" className="font-display text-3xl font-semibold">
        Reserva tu cita
      </h2>
      <p className="mt-1 text-muted">Elige el tratamiento, el día y la hora. La señal de {euros(venue.deposit)} asegura tu hueco.</p>

      <h3 className="mt-6 text-lg font-semibold">1 · ¿Qué te hacemos?</h3>
      <RadioGroup
        aria-label="Tratamiento"
        value={offerId ?? ""}
        onValueChange={(value: string) => {
          setOfferId(value);
          setStart(null);
        }}
      >
        {groups.map((group) => (
          <div key={group} className="mt-4">
            <p className="mb-2 text-sm font-semibold tracking-wide text-brand-ink uppercase">{group}</p>
            <div className="grid gap-2.5">
              {venue.offers
                .filter((o) => o.group === group)
                .map((o) => (
                  <Radio.Root key={o.id} value={o.id} aria-label={`${o.name}, ${o.minutes} minutos, ${euros(o.price)}`} className={card}>
                    <span className="flex items-start justify-between gap-3">
                      <span className="min-w-0">
                        <span className="block font-semibold">{o.name}</span>
                        <span className="mt-0.5 block text-sm text-muted">{o.blurb}</span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block font-semibold tabular-nums">{euros(o.price)}</span>
                        <span className="block text-sm text-muted tabular-nums">{o.minutes} min</span>
                      </span>
                    </span>
                  </Radio.Root>
                ))}
            </div>
          </div>
        ))}
      </RadioGroup>

      {offer ? (
        <>
          <h3 className="mt-8 flex items-center gap-2 text-lg font-semibold">
            <UserIcon className="text-brand" /> 2 · ¿Con quién?
          </h3>
          <RadioGroup
            aria-label="Profesional"
            value={staffChoice}
            onValueChange={(value: string) => {
              setStaffId(value);
              setStart(null);
            }}
            className="mt-3 grid grid-cols-2 gap-2.5"
          >
            <Radio.Root value="any" className={card}>
              <span className="block font-semibold">Cualquiera</span>
              <span className="block text-sm text-muted">La primera libre</span>
            </Radio.Root>
            {offer.staff.map((id) => (
              <Radio.Root key={id} value={id} className={card}>
                <span className="block font-semibold">{staffOf(venue, id)?.name}</span>
                <span className="block text-sm text-muted">{staffOf(venue, id)?.role}</span>
              </Radio.Root>
            ))}
          </RadioGroup>

          <h3 className="mt-8 flex items-center gap-2 text-lg font-semibold">
            <CalendarIcon className="text-brand" /> 3 · ¿Qué día?
          </h3>
          <Calendar
            today={today}
            value={day}
            onChange={(d) => {
              setPicked(d);
              setStart(null);
            }}
            minDay={today}
            maxDay={today + venue.windowDays * DAY_MS}
            isDisabled={(d) => !isBookableDay(venue, d)}
            className="mt-3 rounded-2xl bg-paper p-3 ring-1 ring-line"
          />

          <h3 className="mt-8 flex items-center gap-2 text-lg font-semibold">
            <ClockIcon className="text-brand" /> 4 · ¿A qué hora?
          </h3>
          {times.length === 0 ? <p className="mt-3 rounded-2xl bg-paper px-4 py-5 text-center text-muted ring-1 ring-line">No hay horas este día. Elige otro en el calendario.</p> : null}
          <RadioGroup aria-label="Hora de la cita" value={chosen ? String(chosen.start) : ""} onValueChange={(value: string) => setStart(Number(value))} className="mt-3 grid grid-cols-4 gap-2">
            {times.map((t) => (
              <Radio.Root key={t.start} value={String(t.start)} disabled={!t.free} aria-label={`${formatTime(t.start)}${t.free ? "" : ", ocupado"}`} className={chip}>
                {formatTime(t.start)}
              </Radio.Root>
            ))}
          </RadioGroup>
          {times.some((t) => !t.free) ? <p className="mt-2 text-sm text-muted">Las horas tachadas ya están ocupadas.</p> : null}
        </>
      ) : null}

      {offer && chosen ? (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-cream/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur">
          <div className="mx-auto max-w-md">
            <p className="mb-2 text-sm">
              <b>{offer.name}</b> · <span className="first-letter:uppercase">{dayLabel(chosen.start, now)}</span>, {formatTime(chosen.start)} h
            </p>
            <button type="button" onClick={() => setPaying(true)} className={primaryButton}>
              Reservar · señal {euros(venue.deposit)}
            </button>
          </div>
        </div>
      ) : null}

      <PaySheet
        open={paying && Boolean(offer && chosen)}
        onOpenChange={setPaying}
        title="Confirma tu cita"
        lines={
          offer && chosen
            ? [`${offer.name} · ${offer.minutes} min`, `${dayLabel(chosen.start, now)}, ${formatTime(chosen.start)} h · con ${staffOf(venue, chosen.staff ?? "")?.name}`]
            : []
        }
        amount={venue.deposit}
        total={offer?.price ?? 0}
        askNotes
        notesLabel="¿Algo que debamos saber? (opcional)"
        onPaid={paid}
      />
    </section>
  );
}
