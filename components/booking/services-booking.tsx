"use client";

import { useState } from "react";
import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { CloseIcon } from "@/components/icons";
import { Calendar } from "@/components/ui/calendar";
import { BottomSheet, Drawer } from "@/components/ui/drawer";
import { dayLabel, formatTime, startOfArDay, DAY_MS } from "@/lib/admin-dates";
import { isBookableDay, timesFor, type Booking, type TimeOption } from "@/lib/booking/availability";
import { bookingActions, useBookings } from "@/lib/booking/store";
import { depositOf, money, offerOf, say, staffOf, type Modality, type Offer, type Venue } from "@/lib/booking/venues";
import { useMediaQuery } from "@/lib/use-media-query";
import { useNow } from "@/lib/use-now";
import { Confirmation } from "./confirmation";
import { PaySheet, type Contact } from "./pay-sheet";
import { CalendarIcon, ClockIcon, PinIcon, primaryButton, UserIcon } from "./ui";

// The beauty center's customer page: a treatment, who does it, a day and a time, then the full price paid online.
// On a phone, choosing a treatment opens a bottom sheet with the rest (professional, day, time and the button), so
// nobody has to scroll down to continue; from `lg` up the same steps sit in a panel beside the list that stays in view.

const card =
  "cursor-pointer rounded-2xl bg-paper p-4 text-left ring-1 ring-line transition-[box-shadow,transform] outline-none hover:ring-brand/50 focus-visible:ring-2 focus-visible:ring-brand active:scale-[0.99] data-checked:bg-blush data-checked:ring-2 data-checked:ring-brand motion-reduce:active:scale-100";
const chip =
  "cursor-pointer rounded-xl bg-paper py-2.5 text-center text-sm font-medium tabular-nums ring-1 ring-line transition-colors outline-none hover:ring-brand/50 focus-visible:ring-2 focus-visible:ring-brand data-checked:bg-brand data-checked:text-white data-checked:ring-brand data-disabled:cursor-not-allowed data-disabled:opacity-40 data-disabled:line-through data-disabled:hover:ring-line";

export function ServicesBooking({ venue }: { venue: Venue }) {
  const now = useNow();
  const bookings = useBookings(venue);
  const desktop = useMediaQuery("(min-width: 1024px)");
  const [offerId, setOfferId] = useState<string | null>(null);
  const [staffId, setStaffId] = useState("any");
  const [how, setHow] = useState<Modality>("presencial");
  const [picked, setPicked] = useState<number | null>(null);
  const [start, setStart] = useState<number | null>(null);
  const [sheet, setSheet] = useState(false);
  const [paying, setPaying] = useState(false);
  const [done, setDone] = useState<Booking | null>(null);

  if (now === null || bookings === null) return <p className="px-5 py-10 text-center text-muted">Cargando la agenda…</p>;
  const stamp: number = now; // narrowed: closures below keep it a number
  if (done) return <Confirmation venue={venue} booking={done} now={now} onAgain={() => setDone(null)} />;

  const today = startOfArDay(now);
  const offer = offerId ? offerOf(venue, offerId) : undefined;
  const staffChoice = offer && (staffId === "any" || offer.staff.includes(staffId)) ? staffId : "any";
  const modes = offer?.modes ?? [];
  const modality: Modality | undefined = modes.length ? (modes.includes(how) ? how : modes[0]) : undefined;
  const due = offer ? depositOf(venue, offer.price) : 0; // what is paid online now
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
      paid: due,
      method: contact.method,
      ...(modality ? { modality } : {}),
      status: "confirmada",
      createdAt: stamp,
    };
    bookingActions(venue).add(booking);
    setPaying(false);
    setSheet(false);
    setDone(booking);
    setOfferId(null);
    setStart(null);
    setPicked(null);
    window.scrollTo({ top: 0 });
  }

  /** The rest of the steps, in the sheet (phone) or the side panel (desktop): the same content with the same state. */
  const steps = offer ? (
    <Steps
      venue={venue}
      offer={offer}
      first={desktop ? 2 : 1}
      modality={modality}
      onModality={setHow}
      staffChoice={staffChoice}
      onStaff={(id) => {
        setStaffId(id);
        setStart(null);
      }}
      today={today}
      day={day}
      onDay={(d) => {
        setPicked(d);
        setStart(null);
      }}
      times={times}
      chosenStart={chosen ? chosen.start : null}
      onTime={setStart}
    />
  ) : null;
  const checkout = offer ? (
    <Checkout
      venue={venue}
      offer={offer}
      when={chosen ? `${dayLabel(chosen.start, now)}, ${formatTime(chosen.start)} h` : null}
      onPay={() => {
        setSheet(false); // the payment sheet takes over; dismissing it brings this one back
        setPaying(true);
      }}
    />
  ) : null;

  return (
    <section id="reservar" aria-labelledby="reservar-titulo" className="mx-auto w-full max-w-md px-4 pt-8 pb-10 lg:max-w-6xl lg:px-8 lg:pt-16 lg:pb-20">
      <h1 id="reservar-titulo" className="font-display text-3xl font-semibold lg:text-5xl">
        {say(venue, "Reserva tu cita", "Reservá tu turno")}
      </h1>
      <p className="mt-1 text-muted lg:text-lg">
        {venue.deposit
          ? `Elegí ${venue.slug === "nutricion" ? "la consulta" : "el servicio"}, el día y la hora. Señás el ${Math.round(venue.deposit * 100)} % online y tu turno queda asegurado.`
          : "Elige el tratamiento, el día y la hora. Pagas online y tu hueco queda asegurado."}
      </p>

      {/* From lg up: the treatments on the left, the rest of the steps in a panel that stays in view on the right. */}
      <div className="lg:mt-8 lg:grid lg:grid-cols-[minmax(0,1fr)_26rem] lg:items-start lg:gap-12">
        <div>
          <h2 className="mt-6 text-lg font-semibold lg:mt-0">{venue.slug === "nutricion" ? "1 · ¿Qué consulta necesitás?" : "1 · ¿Qué te hacemos?"}</h2>
          <RadioGroup
            aria-label={venue.slug === "nutricion" ? "Consulta" : "Tratamiento"}
            value={offerId ?? ""}
            onValueChange={(value: string) => {
              setOfferId(value);
              setStart(null);
              setSheet(true);
            }}
          >
            {groups.map((group) => (
              <div key={group} className="mt-4">
                <p className="mb-2 text-sm font-semibold tracking-wide text-brand-ink uppercase">{group}</p>
                <div className="grid gap-2.5 lg:grid-cols-2">
                  {venue.offers
                    .filter((o) => o.group === group)
                    .map((o) => (
                      <Radio.Root
                        key={o.id}
                        value={o.id}
                        aria-label={`${o.name}, ${o.minutes} minutos, ${money(venue, o.price)}`}
                        onClick={() => setSheet(true)} // picking the same treatment again reopens the sheet
                        className={card}
                      >
                        <span className="flex items-start justify-between gap-3">
                          <span className="min-w-0">
                            <span className="block font-semibold">{o.name}</span>
                            <span className="mt-0.5 block text-sm text-muted">{o.blurb}</span>
                          </span>
                          <span className="shrink-0 text-right">
                            <span className="block font-semibold tabular-nums">{money(venue, o.price)}</span>
                            <span className="block text-sm text-muted tabular-nums">{o.minutes} min</span>
                          </span>
                        </span>
                      </Radio.Root>
                    ))}
                </div>
              </div>
            ))}
          </RadioGroup>
        </div>

        {desktop ? (
          <div className="sticky top-20 max-h-[calc(100dvh-6rem)] overflow-y-auto rounded-3xl bg-paper/60 p-6 ring-1 ring-line">
            {steps ?? <p className="rounded-2xl bg-blush px-4 py-6 text-center text-brand-ink">{say(venue, "Elige un tratamiento para ver los profesionales, los días y las horas libres.", venue.solo ? "Elegí una consulta para ver los días y las horas libres." : "Elegí un tratamiento para ver los profesionales, los días y las horas libres.")}</p>}
            {checkout ? <div className="mt-6 border-t border-line pt-3">{checkout}</div> : null}
          </div>
        ) : null}
      </div>

      {/* Phone: the sheet that opens when a treatment is chosen. */}
      <Drawer.Root open={sheet && !desktop && Boolean(offer)} onOpenChange={setSheet} swipeDirection="down">
        <BottomSheet>
          {offer ? (
            <>
              <div className="flex items-start justify-between gap-3 px-5 pt-7 pb-1">
                <div className="min-w-0">
                  <Drawer.Title className="font-display text-2xl leading-tight font-semibold">{offer.name}</Drawer.Title>
                  <Drawer.Description className="mt-0.5 text-sm text-muted tabular-nums">
                    {offer.minutes} min · {money(venue, offer.price)}
                  </Drawer.Description>
                </div>
                <Drawer.Close className="grid size-10 shrink-0 place-items-center rounded-full hover:bg-blush" aria-label="Cerrar">
                  <CloseIcon />
                </Drawer.Close>
              </div>
              <div className="px-5 pb-4">{steps}</div>
              <div className="sticky bottom-[calc(-1*env(safe-area-inset-bottom))] z-10 border-t border-line bg-cream px-5 pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">{checkout}</div>
            </>
          ) : null}
        </BottomSheet>
      </Drawer.Root>

      <PaySheet
        venue={venue}
        open={paying && Boolean(offer && chosen)}
        onOpenChange={(open) => {
          setPaying(open);
          if (!open) setSheet(true); // dismissed without paying: back to the choice, as it was
        }}
        title={say(venue, "Confirma tu cita", "Confirmá tu turno")}
        lines={
          offer && chosen
            ? [
                `${offer.name} · ${offer.minutes} min${modality ? ` · ${modality === "online" ? "videollamada" : "en el consultorio"}` : ""}`,
                `${dayLabel(chosen.start, now)}, ${formatTime(chosen.start)} h${venue.solo ? "" : ` · con ${staffOf(venue, chosen.staff ?? "")?.name}`}`,
                ...(offer && due < offer.price ? [`Total ${money(venue, offer.price)} · el resto (${money(venue, offer.price - due)}) lo abonás en la consulta`] : []),
              ]
            : []
        }
        amount={due}
        askNotes
        notesLabel={venue.solo ? "¿Algo que debamos saber? (alergias, objetivo…)" : "¿Algo que debamos saber? (opcional)"}
        onPaid={paid}
      />
    </section>
  );
}

/** Professional, day and time of the chosen treatment (numbered from `first`). */
function Steps({
  venue,
  offer,
  first,
  modality,
  onModality,
  staffChoice,
  onStaff,
  today,
  day,
  onDay,
  times,
  chosenStart,
  onTime,
}: {
  venue: Venue;
  offer: Offer;
  first: number;
  modality?: Modality;
  onModality: (m: Modality) => void;
  staffChoice: string;
  onStaff: (id: string) => void;
  today: number;
  day: number;
  onDay: (day: number) => void;
  times: TimeOption[];
  chosenStart: number | null;
  onTime: (start: number) => void;
}) {
  const askHow = Boolean(modality && (offer.modes?.length ?? 0) > 1);
  const askStaff = !venue.solo;
  const dayNo = first + (askHow ? 1 : 0) + (askStaff ? 1 : 0);
  return (
    <>
      {askHow ? (
        <>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <PinIcon className="text-brand" /> {first} · ¿Cómo la querés?
          </h2>
          <RadioGroup aria-label="Modalidad" value={modality ?? ""} onValueChange={(value: string) => onModality(value as Modality)} className="mt-3 grid grid-cols-2 gap-2.5">
            <Radio.Root value="presencial" aria-label="Presencial, en el consultorio" className={card}>
              <span className="block font-semibold">Presencial</span>
              <span className="block text-sm text-muted">En el consultorio</span>
            </Radio.Root>
            <Radio.Root value="online" aria-label="Online, por videollamada" className={card}>
              <span className="block font-semibold">Online</span>
              <span className="block text-sm text-muted">Por videollamada</span>
            </Radio.Root>
          </RadioGroup>
        </>
      ) : null}

      {askStaff ? (
        <>
          <h2 className={`${askHow ? "mt-8 " : ""}flex items-center gap-2 text-lg font-semibold`}>
            <UserIcon className="text-brand" /> {first + (askHow ? 1 : 0)} · ¿Con quién?
          </h2>
          <RadioGroup aria-label="Profesional" value={staffChoice} onValueChange={(value: string) => onStaff(value)} className="mt-3 grid grid-cols-2 gap-2.5">
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
        </>
      ) : null}

      <h2 className={`${askHow || askStaff ? "mt-8 " : ""}flex items-center gap-2 text-lg font-semibold`}>
        <CalendarIcon className="text-brand" /> {dayNo} · ¿Qué día?
      </h2>
      <Calendar
        today={today}
        value={day}
        onChange={onDay}
        minDay={today}
        maxDay={today + venue.windowDays * DAY_MS}
        isDisabled={(d) => !isBookableDay(venue, d)}
        className="mt-3 rounded-2xl bg-paper p-3 ring-1 ring-line"
      />

      <h2 className="mt-8 flex items-center gap-2 text-lg font-semibold">
        <ClockIcon className="text-brand" /> {dayNo + 1} · ¿A qué hora?
      </h2>
      {times.length === 0 ? <p className="mt-3 rounded-2xl bg-paper px-4 py-5 text-center text-muted ring-1 ring-line">{say(venue, "No hay horas este día. Elige otro en el calendario.", "No hay horarios este día. Elegí otro en el calendario.")}</p> : null}
      <RadioGroup aria-label={`Hora del ${venue.words.appt}`} value={chosenStart !== null ? String(chosenStart) : ""} onValueChange={(value: string) => onTime(Number(value))} className="mt-3 grid grid-cols-4 gap-2">
        {times.map((t) => (
          <Radio.Root key={t.start} value={String(t.start)} disabled={!t.free} aria-label={`${formatTime(t.start)}${t.free ? "" : ", ocupado"}`} className={chip}>
            {formatTime(t.start)}
          </Radio.Root>
        ))}
      </RadioGroup>
      {times.some((t) => !t.free) ? <p className="mt-2 text-sm text-muted">Las horas tachadas ya están ocupadas.</p> : null}
    </>
  );
}

/** What is being booked and the button to pay for it; the button waits for a time. */
function Checkout({ venue, offer, when, onPay }: { venue: Venue; offer: Offer; when: string | null; onPay: () => void }) {
  return (
    <>
      <p className="mb-2 text-sm">
        <b>{offer.name}</b> · {when ? <span className="first-letter:uppercase">{when}</span> : <span className="text-muted">{say(venue, "elige una hora", "elegí un horario")}</span>}
      </p>
      <button type="button" data-cta="reservar" disabled={!when} onClick={onPay} className={primaryButton}>
        {venue.deposit ? `Reservar y señar · ${money(venue, depositOf(venue, offer.price))}` : `Reservar y pagar · ${money(venue, offer.price)}`}
      </button>
    </>
  );
}
