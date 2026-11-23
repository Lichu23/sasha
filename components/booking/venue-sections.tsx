import Image from "next/image";
import Link from "next/link";
import { bookingHref, money, say, type Venue } from "@/lib/booking/venues";
import { CheckIcon, ClockIcon, PinIcon, primaryButton, StarIcon, Stars } from "./ui";

// The sections of a photo-led customer page (a venue with `photos`): hero, gallery, reviews, how to visit. Minimal on
// purpose: one photo, few words, the booking button always in reach. Written for the phone first (one column, a strip
// to swipe) and widened from `lg` up (side-by-side hero, a row of photos). The booking itself is its own component.

const container = "mx-auto w-full max-w-md px-5 lg:max-w-6xl lg:px-8";

export function PhotoHero({ venue }: { venue: Venue }) {
  const photos = venue.photos;
  if (!photos) return null;
  return (
    <section className="mx-auto w-full max-w-md lg:max-w-6xl lg:px-8 lg:pt-10 lg:pb-6">
      <div className="lg:grid lg:grid-cols-[1fr_1.15fr] lg:items-center lg:gap-14">
        <div className="relative aspect-[4/3] overflow-hidden bg-blush lg:order-2 lg:aspect-[5/4] lg:rounded-3xl">
          <Image src={photos.hero.src} alt={photos.hero.alt} fill sizes="(min-width: 1024px) 640px, 100vw" loading="eager" fetchPriority="high" className="object-cover" />
        </div>
        <div className="px-5 pt-6 pb-9 lg:p-0">
          <p className="text-sm font-medium tracking-wide text-brand-ink uppercase">{venue.kind}</p>
          <h1 className="mt-2 font-display text-[2.6rem] leading-[1.05] font-semibold text-balance lg:text-6xl">{venue.name}</h1>
          <p className="mt-3 max-w-xs text-lg text-muted text-pretty lg:max-w-md lg:text-xl">{venue.tagline}</p>
          <Link href={bookingHref(venue)} className={`${primaryButton} mt-6 lg:w-auto lg:px-8`}>
            {`Reservar mi ${venue.words.appt}`}
          </Link>
          <p className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted">
            <span className="inline-flex items-center gap-1.5">
              <StarIcon className="size-4 text-amber-500" /> <b className="text-ink">{venue.rating}</b> en Google · +300 opiniones
            </span>
            <span className="inline-flex items-center gap-1.5">
              <PinIcon className="size-4" /> {venue.address}
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}

/** A strip to swipe on the phone, a row of six on a desktop. */
export function VenueGallery({ venue }: { venue: Venue }) {
  const photos = venue.photos;
  if (!photos) return null;
  return (
    <section aria-labelledby="galeria-titulo" className="pt-2 pb-4 lg:pt-14">
      <div className={container}>
        <h2 id="galeria-titulo" className="font-display text-3xl font-semibold lg:text-4xl">
          Nuestro trabajo
        </h2>
        <p className="mt-1 text-muted">Diseños hechos en el centro.</p>
      </div>
      <ul
        tabIndex={0}
        aria-label="Galería de trabajos"
        className="mt-5 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pb-3 [scrollbar-width:none] lg:mx-auto lg:grid lg:max-w-6xl lg:grid-cols-6 lg:overflow-visible lg:px-8 lg:pb-0"
      >
        {photos.gallery.map((photo) => (
          <li key={photo.src} className="relative aspect-[4/5] w-[62%] shrink-0 snap-start overflow-hidden rounded-2xl bg-blush lg:w-auto">
            <Image src={photo.src} alt={photo.alt} fill sizes="(min-width: 1024px) 180px, 62vw" className="object-cover" />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function VenueReviews({ venue }: { venue: Venue }) {
  if (!venue.reviews?.length) return null;
  return (
    <section aria-labelledby="opiniones-titulo" className="bg-paper py-10 lg:py-16">
      <div className={container}>
        <h2 id="opiniones-titulo" className="font-display text-3xl font-semibold lg:text-4xl">
          Lo que dicen
        </h2>
        <ul className="mt-5 grid gap-3 lg:mt-8 lg:grid-cols-3 lg:gap-4">
          {venue.reviews.map((review) => (
            <li key={review.name} className="rounded-2xl bg-cream p-5">
              <Stars />
              <p className="sr-only">5 de 5 estrellas</p>
              <blockquote className="mt-3 text-pretty">“{review.text}”</blockquote>
              <p className="mt-3 text-sm font-medium text-muted">{review.name}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** The home page's last word: one button to the booking page. */
export function VenueCta({ venue }: { venue: Venue }) {
  if (!venue.bookingPath) return null;
  return (
    <section aria-labelledby="reservar-cta" className="bg-brand py-12 text-center text-white lg:py-16">
      <div className={container}>
        <h2 id="reservar-cta" className="font-display text-3xl font-semibold text-balance lg:text-4xl">
          {say(venue, "Reserva tu próxima cita", `Reservá tu ${venue.words.appt}`)}
        </h2>
        <p className="mt-2 text-white/85">{say(venue, "En un minuto, sin llamar ni esperar respuesta.", "En un minuto, sin chatear ni esperar respuesta.")}</p>
        <Link
          href={venue.bookingPath}
          className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-white px-8 font-semibold text-brand-ink [touch-action:manipulation] transition-transform active:scale-95 motion-reduce:active:scale-100 lg:w-auto"
        >
          {`Reservar mi ${venue.words.appt}`}
        </Link>
      </div>
    </section>
  );
}

/** Where, when and the house rules, next to a photo of the place. */
export function VenueInfo({ venue }: { venue: Venue }) {
  const photos = venue.photos;
  return (
    <section id="visitanos" aria-labelledby="visitanos-titulo" className="py-10 lg:py-20">
      <div className={`${container} ${photos ? "lg:grid lg:grid-cols-2 lg:items-center lg:gap-16" : "lg:max-w-3xl"}`}>
        {photos ? (
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-blush lg:aspect-square lg:rounded-3xl">
            <Image src={photos.studio.src} alt={photos.studio.alt} fill sizes="(min-width: 1024px) 560px, 100vw" className="object-cover object-[50%_40%]" />
          </div>
        ) : null}
        <div className={photos ? "mt-7 lg:mt-0" : ""}>
          <h2 id="visitanos-titulo" className="font-display text-3xl font-semibold lg:text-4xl">
            {say(venue, "Visítanos", "Dónde atiendo")}
          </h2>
          <dl className="mt-5 grid gap-4">
            <div className="flex items-start gap-3">
              <PinIcon className="mt-0.5 size-5 shrink-0 text-brand" />
              <div>
                <dt className="sr-only">Dirección</dt>
                <dd>
                  {venue.address}
                  <br />
                  <a href={`tel:${venue.phone.replace(/\s/g, "")}`} className="text-muted underline-offset-4 hover:underline">
                    {venue.phone}
                  </a>
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <ClockIcon className="mt-0.5 size-5 shrink-0 text-brand" />
              <div>
                <dt className="sr-only">Horario</dt>
                <dd className="grid gap-0.5">
                  {venue.hours.map((h) => (
                    <span key={h.label}>
                      {h.label}: <b className="font-semibold">{h.value}</b>
                    </span>
                  ))}
                </dd>
              </div>
            </div>
          </dl>
          {venue.policies?.length ? (
            <ul className="mt-6 grid gap-2.5 border-t border-line pt-6 text-muted">
              {venue.policies.map((rule) => (
                <li key={rule} className="flex items-start gap-3">
                  <CheckIcon className="mt-0.5 size-5 shrink-0 text-brand" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </section>
  );
}

// ---------- The sections of a consulting practice's home (venue.home): services, how it works, who, tips, questions ----------

/** The consultations with their duration and price: each one opens the booking. */
export function VenueServices({ venue }: { venue: Venue }) {
  const groups = [...new Set(venue.offers.map((o) => o.group))];
  return (
    <section id="servicios" aria-labelledby="servicios-titulo" className="py-10 lg:py-16">
      <div className={container}>
        <h2 id="servicios-titulo" className="font-display text-3xl font-semibold lg:text-4xl">
          Consultas
        </h2>
        <p className="mt-1 text-muted">Presenciales o por videollamada, según lo que necesites.</p>
        <div className="mt-5 grid gap-6 lg:mt-8 lg:grid-cols-2 lg:gap-x-10">
          {groups.map((group) => (
            <div key={group}>
              <p className="mb-2 text-sm font-semibold tracking-wide text-brand-ink uppercase">{group}</p>
              <ul className="grid gap-2.5">
                {venue.offers
                  .filter((o) => o.group === group)
                  .map((o) => (
                    <li key={o.id} className="rounded-2xl bg-paper p-4 ring-1 ring-line">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold">{o.name}</p>
                          <p className="mt-0.5 text-sm text-muted text-pretty">{o.blurb}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="font-semibold tabular-nums">{money(venue, o.price)}</p>
                          <p className="text-sm text-muted tabular-nums">{o.minutes} min</p>
                        </div>
                      </div>
                      {o.modes?.length ? (
                        <p className="mt-2 flex gap-1.5 text-xs font-semibold">
                          {o.modes.map((m) => (
                            <span key={m} className="rounded-full bg-blush px-2 py-0.5 text-brand-ink">
                              {m === "online" ? "Online" : "Presencial"}
                            </span>
                          ))}
                        </p>
                      ) : null}
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
        <Link href={bookingHref(venue)} className={`${primaryButton} mt-6 lg:w-auto lg:px-8`}>
          {`Reservar mi ${venue.words.appt}`}
        </Link>
      </div>
    </section>
  );
}

/** Three numbered steps: how a booking goes. */
export function VenueSteps({ venue }: { venue: Venue }) {
  if (!venue.home) return null;
  return (
    <section aria-labelledby="pasos-titulo" className="bg-paper py-10 lg:py-16">
      <div className={container}>
        <h2 id="pasos-titulo" className="font-display text-3xl font-semibold lg:text-4xl">
          Cómo funciona
        </h2>
        <ol className="mt-5 grid gap-3 lg:mt-8 lg:grid-cols-3 lg:gap-4">
          {venue.home.steps.map((step, i) => (
            <li key={step.title} className="rounded-2xl bg-cream p-5">
              <span className="grid size-9 place-items-center rounded-full bg-brand font-semibold text-white tabular-nums">{i + 1}</span>
              <p className="mt-3 font-semibold">{step.title}</p>
              <p className="mt-1 text-muted text-pretty">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/** Who the professional is: name, title and a few credentials. */
export function VenueAbout({ venue }: { venue: Venue }) {
  const about = venue.home?.about;
  if (!about) return null;
  const initials = about.name
    .replace("Lic. ", "")
    .split(" ")
    .map((w) => w[0])
    .join("");
  return (
    <section aria-labelledby="sobre-titulo" className="py-10 lg:py-16">
      <div className={`${container} lg:grid lg:grid-cols-[1fr_1.4fr] lg:items-center lg:gap-14`}>
        <div className="grid aspect-[5/3] place-items-center rounded-3xl bg-blush lg:aspect-square" aria-hidden>
          <span className="grid size-24 place-items-center rounded-full bg-brand text-4xl font-semibold text-white">{initials}</span>
        </div>
        <div className="mt-6 lg:mt-0">
          <p className="text-sm font-medium tracking-wide text-brand-ink uppercase">{about.role}</p>
          <h2 id="sobre-titulo" className="mt-1 font-display text-3xl font-semibold lg:text-4xl">
            {about.name}
          </h2>
          <p className="mt-3 text-pretty text-muted lg:text-lg">{about.bio}</p>
          <ul className="mt-4 grid gap-2">
            {about.credentials.map((c) => (
              <li key={c} className="flex items-start gap-3">
                <CheckIcon className="mt-0.5 size-5 shrink-0 text-brand" />
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/** Recipes and tips to read before or after the consultation. */
export function VenueTips({ venue }: { venue: Venue }) {
  const tips = venue.home?.tips;
  if (!tips?.length) return null;
  return (
    <section aria-labelledby="tips-titulo" className="bg-paper py-10 lg:py-16">
      <div className={container}>
        <h2 id="tips-titulo" className="font-display text-3xl font-semibold lg:text-4xl">
          Recetas y tips
        </h2>
        <p className="mt-1 text-muted">Ideas simples para comer mejor todos los días.</p>
        <ul className="mt-5 grid gap-3 lg:mt-8 lg:grid-cols-3 lg:gap-4">
          {tips.map((tip) => (
            <li key={tip.title} className="rounded-2xl bg-cream p-5">
              <span className="rounded-full bg-blush px-2.5 py-0.5 text-xs font-semibold text-brand-ink">{tip.tag}</span>
              <p className="mt-3 font-display text-xl leading-snug font-semibold text-balance">{tip.title}</p>
              <p className="mt-1.5 text-muted text-pretty">{tip.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Questions people ask before booking: native details elements, no script needed. */
export function VenueFaq({ venue }: { venue: Venue }) {
  const faq = venue.home?.faq;
  if (!faq?.length) return null;
  return (
    <section aria-labelledby="faq-titulo" className="py-10 lg:py-16">
      <div className={`${container} lg:max-w-3xl`}>
        <h2 id="faq-titulo" className="font-display text-3xl font-semibold lg:text-4xl">
          Preguntas frecuentes
        </h2>
        <div className="mt-5 divide-y divide-line rounded-2xl bg-paper ring-1 ring-line">
          {faq.map((item) => (
            <details key={item.q} className="group px-4 py-1">
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 font-semibold [&::-webkit-details-marker]:hidden">
                {item.q}
                <span aria-hidden className="text-xl text-brand transition-transform group-open:rotate-45 motion-reduce:transition-none">
                  +
                </span>
              </summary>
              <p className="pb-3 text-muted text-pretty">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
