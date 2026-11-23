import Link from "next/link";
import { formatTime, dayLabel } from "@/lib/admin-dates";
import type { Booking } from "@/lib/booking/availability";
import { money, offerOf, payLabel, say, staffOf, type Venue } from "@/lib/booking/venues";
import { CheckIcon, ghostButton } from "./ui";

// What the customer sees right after paying: the booking, its reference and what was paid.

export function Confirmation({ venue, booking, now, onAgain }: { venue: Venue; booking: Booking; now: number; onAgain: () => void }) {
  const offer = offerOf(venue, booking.offer);
  const staff = staffOf(venue, booking.staff);
  const rest = booking.price - booking.paid;
  const rows: [string, string][] = [
    [venue.mode === "classes" ? "Clase" : venue.slug === "nutricion" ? "Consulta" : "Tratamiento", offer?.name ?? ""],
    ["Cuándo", `${dayLabel(booking.start, now)}, ${formatTime(booking.start)} h`],
    ...(booking.modality ? ([["Modalidad", booking.modality === "online" ? "Online, por videollamada" : "Presencial, en el consultorio"]] as [string, string][]) : []),
    ...(venue.solo ? [] : ([[venue.mode === "classes" ? "Con" : "Profesional", staff?.name ?? ""]] as [string, string][])),
    [say(venue, "A nombre de", "A nombre de"), booking.name],
    ...(venue.payAtVenue
      ? ([["Pago", `En el consultorio · ${money(venue, booking.price)}`]] as [string, string][])
      : ([[venue.deposit ? "Seña pagada" : "Pagado ahora", `${money(venue, booking.paid)} (${payLabel[booking.method]})`]] as [string, string][])),
    ...(rest > 0 && !venue.payAtVenue ? ([[`Resto en el ${venue.words.place}`, money(venue, rest)]] as [string, string][]) : []),
  ];
  return (
    <section aria-labelledby="confirmada" className="mx-auto w-full max-w-md px-4 pt-8 pb-10 lg:max-w-xl lg:pt-16 lg:pb-20">
      <div className="rounded-3xl bg-paper p-6 text-center shadow-sm ring-1 ring-line">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-brand text-white">
          <CheckIcon className="size-8" />
        </span>
        <h2 id="confirmada" className="mt-4 font-display text-3xl font-semibold">
          {venue.mode === "classes" ? "¡Plaza reservada!" : venue.slug === "nutricion" ? "¡Turno confirmado!" : "¡Cita confirmada!"}
        </h2>
        <p className="mt-1 text-muted">
          Referencia <b className="text-ink tabular-nums">{booking.ref}</b>
        </p>
        <dl className="mt-5 divide-y divide-line text-left">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-baseline justify-between gap-4 py-2.5">
              <dt className="text-sm text-muted">{label}</dt>
              <dd className="text-right font-medium first-letter:uppercase">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 rounded-2xl bg-blush px-4 py-3 text-sm text-brand-ink">
          {venue.payAtVenue
            ? `Te enviamos un email a ${booking.email} con todos los datos y el link para cancelar el turno.`
            : booking.modality === "online"
            ? "Te mandamos el link de la videollamada por WhatsApp, con un recordatorio el día antes. Si no podés conectarte, avisanos con 24 horas de anticipación."
            : venue.locale === "es-AR"
              ? "Te enviamos un recordatorio por WhatsApp el día antes. Si no podés venir, avisanos con 24 horas de anticipación y te devolvemos la seña."
              : "Te enviamos un recordatorio por WhatsApp el día antes. Si no puedes venir, avísanos con 12 horas de antelación."}
        </p>
        <div className="mt-5 grid gap-2">
          {venue.payAtVenue ? (
            <Link href={`/nutricion/email?ref=${encodeURIComponent(booking.ref)}`} data-cta="ver-email" className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-brand px-5 font-semibold text-white [touch-action:manipulation] active:scale-[0.98]">
              Abrir el email
            </Link>
          ) : null}
          <button type="button" onClick={onAgain} className={`${ghostButton} w-full`}>
            {say(venue, "Reservar otra", "Reservar otro turno")}
          </button>
        </div>
      </div>
    </section>
  );
}
