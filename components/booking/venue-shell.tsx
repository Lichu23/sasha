import Link from "next/link";
import { bookingHref, type Venue } from "@/lib/booking/venues";
import { ClockIcon, PinIcon, StarIcon, VenueMark } from "./ui";
import { PhotoHero } from "./venue-sections";

// The frame of a booking demo: the venue's colors and fonts replace the template's. They are set on the page itself
// (`html:root`, !important to beat the shop's own), not on a wrapper, because the sheets (calendar, payment) are
// drawn in a portal outside of it. The style tag goes away when the visitor leaves the demo. The fonts come from the
// layout (next/font); a small header links the customer's page and the panel.

export function VenueShell({ venue, fonts, children }: { venue: Venue; fonts: { display: string; body: string }; children: React.ReactNode }) {
  const colors = Object.entries(venue.theme).map(([name, value]) => `--${name}:${value}!important;`).join("");
  const css = `html:root{${colors}--font-display:${fonts.display}!important;--font-body:${fonts.body}!important}`;
  return (
    <div data-venue={venue.slug} className="flex flex-1 flex-col overscroll-none bg-cream font-sans text-ink">
      <style>{css}</style>
      {children}
    </div>
  );
}

/**
 * The customer's header: the venue and a way to the booking (on the booking page itself, a way back instead). The
 * business's panel is a separate address, not linked here.
 */
export function VenueHeader({ venue, onBookingPage = false }: { venue: Venue; onBookingPage?: boolean }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-cream/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-md items-center justify-between gap-2 px-4 py-2 lg:max-w-6xl lg:px-8 lg:py-3">
        <Link href={`/${venue.slug}`} className="flex min-w-0 items-center gap-2" aria-label={`${venue.name}: inicio`}>
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand text-white">
            <VenueMark venue={venue} size={22} />
          </span>
          <span className="truncate font-display text-lg font-semibold">{venue.name}</span>
        </Link>
        {onBookingPage ? (
          <Link href={`/${venue.slug}`} className="inline-flex min-h-11 shrink-0 items-center px-1 text-sm font-semibold text-brand-ink [touch-action:manipulation] active:opacity-70">
            Volver
          </Link>
        ) : (
          <Link
            href={bookingHref(venue)}
            className="inline-flex min-h-11 shrink-0 items-center rounded-full bg-brand px-4 text-sm font-semibold text-white [touch-action:manipulation] transition-transform active:scale-95 motion-reduce:active:scale-100"
          >
            {venue.mode === "classes" ? "Reservar clase" : `Reservar ${venue.words.appt}`}
          </Link>
        )}
      </div>
    </header>
  );
}

export function VenueHero({ venue }: { venue: Venue }) {
  if (venue.photos) return <PhotoHero venue={venue} />; // a venue with photos gets the photo-led hero
  return (
    <section className="relative overflow-hidden bg-brand text-white">
      <div aria-hidden className="absolute -top-16 -right-16 size-64 rounded-full bg-white/10" />
      <div aria-hidden className="absolute -bottom-24 -left-10 size-56 rounded-full bg-white/10" />
      <div className="relative mx-auto w-full max-w-md px-5 pt-9 pb-8 lg:grid lg:max-w-6xl lg:grid-cols-[1.25fr_1fr] lg:items-center lg:gap-16 lg:px-8 lg:pt-20 lg:pb-20">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-medium">
            <VenueMark venue={venue} size={16} /> {venue.kind}
          </p>
          <h1 className="mt-4 font-display text-[2.6rem] leading-[1.05] font-semibold text-balance lg:text-7xl">{venue.name}</h1>
          <p className="mt-3 max-w-xs text-lg text-white/90 text-pretty lg:max-w-lg lg:text-2xl">{venue.tagline}</p>
          <Link
            href={bookingHref(venue)}
            className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-white px-6 font-semibold text-brand-ink [touch-action:manipulation] transition-transform active:scale-95 motion-reduce:active:scale-100 lg:mt-8 lg:px-8"
          >
            {venue.mode === "classes" ? "Reservar mi clase" : `Reservar mi ${venue.words.appt}`}
          </Link>
        </div>

        <dl className="mt-7 grid gap-2.5 text-[15px] lg:mt-0 lg:gap-4 lg:rounded-3xl lg:bg-white/10 lg:p-8 lg:text-base">
          <div className="flex items-center gap-2.5">
            <StarIcon className="size-5 text-amber-300" />
            <dt className="sr-only">Valoración</dt>
            <dd>
              <b>{venue.rating}</b> en Google · +300 opiniones
            </dd>
          </div>
          <div className="flex items-center gap-2.5">
            <PinIcon className="size-5" />
            <dt className="sr-only">Dirección</dt>
            <dd>{venue.address}</dd>
          </div>
          <div className="flex items-start gap-2.5">
            <ClockIcon className="mt-0.5 size-5" />
            <dt className="sr-only">Horario</dt>
            <dd className="grid gap-0.5">
              {venue.hours.map((h) => (
                <span key={h.label}>
                  {h.label}: <b>{h.value}</b>
                </span>
              ))}
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}

export function VenueFooter({ venue }: { venue: Venue }) {
  return (
    <footer className="mt-auto border-t border-line px-5 py-8 text-center text-sm text-muted">
      <p className="font-display text-lg font-semibold text-ink">{venue.name}</p>
      <p className="mt-1">
        {venue.address} · {venue.phone}
      </p>
      <p className="mx-auto mt-4 max-w-xl rounded-2xl bg-blush px-4 py-3 text-brand-ink">Página web de prueba: los datos son de ejemplo y el pago está simulado, no se cobra nada.</p>
    </footer>
  );
}
