"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { dayLabel, formatTime } from "@/lib/admin-dates";
import { bookingActions, useBookings } from "@/lib/booking/store";
import { offerOf, type Venue } from "@/lib/booking/venues";
import { useNow } from "@/lib/use-now";
import { ConfirmationEmail } from "./email-preview";
import { CheckIcon, ghostButton, primaryButton } from "./ui";

// The two pages a patient reaches from the booking: the confirmation email (as it arrives in the inbox) and the page
// the cancel link of that email opens. Both find the booking by its reference (?ref=).

function useFound(venue: Venue) {
  const now = useNow();
  const bookings = useBookings(venue);
  const ref = useSearchParams().get("ref");
  const booking = bookings?.find((b) => b.ref === ref);
  return { now, loading: now === null || bookings === null, booking };
}

const shell = "mx-auto w-full max-w-md px-4 pt-6 pb-12";

export function EmailView({ venue }: { venue: Venue }) {
  const { now, loading, booking } = useFound(venue);
  if (loading) return <p className="px-5 py-10 text-center text-muted">Abriendo el email…</p>;
  if (!booking || now === null) return <NotFound venue={venue} />;
  return (
    <section className={shell}>
      <p className="mb-3 text-sm font-semibold text-brand-ink">Bandeja de entrada</p>
      <ConfirmationEmail venue={venue} booking={booking} now={now} />
    </section>
  );
}

export function CancelView({ venue }: { venue: Venue }) {
  const { now, loading, booking } = useFound(venue);
  if (loading) return <p className="px-5 py-10 text-center text-muted">Buscando tu turno…</p>;
  if (!booking || now === null) return <NotFound venue={venue} />;
  const cancelled = booking.status === "cancelada";
  return (
    <section aria-labelledby="cancelar-titulo" className={shell}>
      <div className="rounded-3xl bg-paper p-6 text-center shadow-sm ring-1 ring-line">
        {cancelled ? (
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-brand text-white">
            <CheckIcon className="size-7" />
          </span>
        ) : null}
        <h1 id="cancelar-titulo" className="mt-3 font-display text-3xl font-semibold">
          {cancelled ? "Turno cancelado" : "¿Cancelar tu turno?"}
        </h1>
        <p className="mt-2 text-muted first-letter:uppercase">
          {offerOf(venue, booking.offer)?.name} · {dayLabel(booking.start, now)}, {formatTime(booking.start)} h
        </p>
        <p className="mt-1 text-sm text-muted">Referencia {booking.ref}</p>
        {cancelled ? (
          <>
            <p className="mt-4 rounded-2xl bg-blush px-4 py-3 text-sm text-brand-ink">Listo, el horario quedó libre. Cuando quieras, podés reservar otro turno.</p>
            <Link href={venue.bookingPath ?? "/"} className={`${primaryButton} mt-5 flex items-center justify-center`}>
              Reservar otro turno
            </Link>
          </>
        ) : (
          <div className="mt-5 grid gap-2">
            <button type="button" data-cta="confirmar-cancelacion" onClick={() => bookingActions(venue).setStatus(booking.id, "cancelada")} className={primaryButton}>
              Sí, cancelar mi turno
            </button>
            <Link href="/nutricion" className={`${ghostButton} flex items-center justify-center`}>
              No, lo mantengo
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

function NotFound({ venue }: { venue: Venue }) {
  return (
    <section className={shell}>
      <p className="rounded-2xl bg-paper px-4 py-8 text-center text-muted ring-1 ring-line">No encontramos ese turno.</p>
      <Link href={venue.bookingPath ?? "/"} className={`${primaryButton} mt-4 flex items-center justify-center`}>
        Reservar un turno
      </Link>
    </section>
  );
}
