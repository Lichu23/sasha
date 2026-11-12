import { formatTime, dayLabel } from "@/lib/admin-dates";
import type { Booking } from "@/lib/booking/availability";
import { euros, offerOf, staffOf, type Venue } from "@/lib/booking/venues";
import { CheckIcon, ghostButton } from "./ui";

// What the customer sees right after paying: the booking, its reference and what was paid.

export function Confirmation({ venue, booking, now, onAgain }: { venue: Venue; booking: Booking; now: number; onAgain: () => void }) {
  const offer = offerOf(venue, booking.offer);
  const staff = staffOf(venue, booking.staff);
  const rest = booking.price - booking.paid;
  const rows: [string, string][] = [
    [venue.mode === "classes" ? "Clase" : "Tratamiento", offer?.name ?? ""],
    ["Cuándo", `${dayLabel(booking.start, now)}, ${formatTime(booking.start)} h`],
    [venue.mode === "classes" ? "Con" : "Profesional", staff?.name ?? ""],
    ["A nombre de", booking.name],
    ["Pagado ahora", `${euros(booking.paid)} (${booking.method === "bizum" ? "Bizum" : "tarjeta"})`],
    ...(rest > 0 ? ([["Pendiente en el centro", euros(rest)]] as [string, string][]) : []),
  ];
  return (
    <section aria-labelledby="confirmada" className="mx-auto w-full max-w-md px-4 pt-8 pb-10">
      <div className="rounded-3xl bg-paper p-6 text-center shadow-sm ring-1 ring-line">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-brand text-white">
          <CheckIcon className="size-8" />
        </span>
        <h2 id="confirmada" className="mt-4 font-display text-3xl font-semibold">
          {venue.mode === "classes" ? "¡Plaza reservada!" : "¡Cita confirmada!"}
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
        <p className="mt-4 rounded-2xl bg-blush px-4 py-3 text-sm text-brand-ink">Te enviamos un recordatorio por WhatsApp el día antes. Si no puedes venir, avísanos con 12 horas de antelación.</p>
        <div className="mt-5 grid gap-2">
          <button type="button" onClick={onAgain} className={`${ghostButton} w-full`}>
            Reservar otra
          </button>
        </div>
      </div>
    </section>
  );
}
