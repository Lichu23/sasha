import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { HeroIntro } from "@/components/home/hero-intro";
import { ScheduleLines } from "@/components/schedule-lines";
import { WeekSchedule } from "@/components/week-schedule";
import { ArrowIcon, BagIcon, ClockIcon, CupIcon, DeliveryIcon, PinIcon, StarIcon, WhatsappIcon } from "@/components/icons";
import {
  greeting,
  hasBranches,
  leadTimeLabel,
  locationLabel,
  locations,
  locationsSummary,
  noun,
  paysOnline,
  salonLabels,
  shop,
  shortName,
  whatsappLink,
} from "@/lib/shop";
import { formatPrice, rating, reviews, salonMenu, takeawayMenu } from "@/lib/menu";

const cakes = takeawayMenu.flatMap((c) => c.products).filter((p) => p.image);
const FEATURED_COUNT = 4;
// The shop's favourites first, topped up with other products that have a photo.
const featuredCakes = [
  ...(shop.home.featured ?? []).map((name) => cakes.find((p) => p.name === name)).filter((p) => p !== undefined),
  ...cakes,
]
  .filter((p, i, list) => list.indexOf(p) === i)
  .slice(0, FEATURED_COUNT);
const salonPhoto = salonMenu.flatMap((c) => c.products).find((p) => p.image)?.image;
const takeawayPhoto = featuredCakes[0]?.image;

const orderCta = shop.orders.cta ?? `Encargar ${noun.g("una", "un")} ${noun.one}`;
const takeawayText = [
  `${capitalizeFirst(noun.other)} por encargo${leadTimeLabel ? `, con ${leadTimeLabel} de anticipación` : ""}.`,
  paysOnline ? "Pagás online y retirás en el local." : "Nos llega por WhatsApp y retirás en el local.",
].join(" ");

function capitalizeFirst(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export default function HomePage() {
  return (
    <>
      {/* On desktop the hero fills the viewport below the header (4rem + 1px border), so nothing needs scrolling. */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-6 pb-16 sm:px-6 md:min-h-[calc(100dvh-4rem-1px)] md:grid-cols-[1.05fr_1fr] md:py-8">
          <HeroIntro>
            <h1 className="font-display text-5xl leading-[1.02] font-semibold tracking-tight text-balance sm:text-6xl lg:text-7xl">
              {shop.home.title[0]}
              <em className="font-normal text-brand italic">{shop.home.title[1]}</em>
              {shop.home.title[2]}
            </h1>
            <p className="mt-5 max-w-md text-lg text-muted text-pretty">{shop.home.intro}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/take-away"
                className="group inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3.5 font-semibold text-white shadow-lg shadow-brand/25 transition-[background-color,transform] hover:bg-brand-ink active:scale-[0.97]"
              >
                {orderCta}
                <ArrowIcon className="transition-transform group-hover:translate-x-0.5" />
              </Link>
              {shop.salon ? (
                <Link
                  href="/salon"
                  className="inline-flex items-center gap-2 rounded-full bg-paper px-6 py-3.5 font-semibold ring-1 ring-line transition-[background-color,transform] hover:bg-blush active:scale-[0.97]"
                >
                  {salonLabels.cta}
                </Link>
              ) : null}
            </div>
            <dl className="mt-8 grid gap-3 text-sm sm:flex sm:flex-wrap sm:gap-x-8">
              {rating ? (
                <div className="flex items-center gap-2">
                  <dt className="sr-only">Reseñas</dt>
                  <StarIcon className="text-amber-500" />
                  <dd>
                    <a
                      href={reviews.length ? "#opiniones" : shop.mapsUrl}
                      target={reviews.length ? undefined : "_blank"}
                      rel={reviews.length ? undefined : "noreferrer"}
                      className="hover:underline"
                    >
                      <strong className="font-semibold tabular-nums">{rating.toLocaleString("es-AR")}</strong> en Google ·{" "}
                      {reviews.length ? "ver reseñas" : "reseñas"}
                    </a>
                  </dd>
                </div>
              ) : null}
              <div className="flex items-start gap-2">
                <dt className="sr-only">Días y horario</dt>
                <ClockIcon className="mt-0.5 shrink-0 text-brand" />
                <dd>
                  <ScheduleLines />
                </dd>
              </div>
              {locations.map((location) => (
                <div key={location.mapsUrl} className="flex items-center gap-2">
                  <dt className="sr-only">{hasBranches ? `Local ${location.name}` : "Dirección"}</dt>
                  <PinIcon className="shrink-0 text-brand" />
                  <dd>
                    <a href={location.mapsUrl} target="_blank" rel="noreferrer" className="hover:underline">
                      {locationLabel(location)}
                    </a>
                  </dd>
                </div>
              ))}
            </dl>
          </HeroIntro>

          {/* Desktop only. The cover is the LCP element there, so it renders without an entrance animation.
              No `preload`: a preload link ignores display:none and would make phones fetch the full photo;
              with the 1px mobile size they only get the smallest variant. */}
          <div className="relative hidden h-[min(calc(100dvh-8rem-1px),46rem)] overflow-hidden rounded-[2.5rem] rounded-tr-[8rem] bg-blush shadow-2xl shadow-ink/15 md:block">
            <Image
              src={shop.cover}
              alt={shop.coverAlt}
              fill
              loading="eager"
              fetchPriority="high"
              sizes="(min-width: 768px) 45vw, 1px"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* Only shops with a salón need the choice; otherwise ordering is the whole point. */}
      {shop.salon ? (
        <section aria-labelledby="como" className="mx-auto mb-24 max-w-6xl px-4 sm:px-6">
          <Reveal>
            <h2 id="como" className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              ¿Cómo querés disfrutar {shop.shortName}?
            </h2>
          </Reveal>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <Reveal>
              <ChoiceCard
                href="/salon"
                image={salonPhoto}
                icon={<CupIcon />}
                title={salonLabels.card}
                text={`${shop.salon.summary}.${shop.salon.stayLimit ? ` Tiempo de permanencia: ${shop.salon.stayLimit}.` : ""}`}
                cta={salonLabels.cta}
              />
            </Reveal>
            <Reveal delay={0.08}>
              <ChoiceCard
                href="/take-away"
                image={takeawayPhoto}
                icon={<BagIcon />}
                title="Take away"
                text={takeawayText}
                cta={orderCta}
              />
            </Reveal>
          </div>
        </section>
      ) : null}

      <section aria-labelledby="favoritas" className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold tracking-wide text-brand uppercase">Por encargo</p>
            <h2 id="favoritas" className="mt-1 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Las favoritas de la casa
            </h2>
          </div>
          <Link href="/take-away" className="inline-flex items-center gap-1.5 font-semibold text-brand-ink hover:underline">
            Ver {noun.g("las", "los")} {noun.count(cakes.length)} <ArrowIcon />
          </Link>
        </Reveal>
        <ul className="no-scrollbar -mx-4 mt-8 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto overflow-y-hidden overscroll-x-contain px-4 pb-2 after:w-px after:shrink-0 sm:mx-0 sm:after:hidden sm:scroll-px-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
          {featuredCakes.map((cake, i) => (
            <li key={cake.id} className="w-[72%] shrink-0 snap-start sm:w-auto">
              <Reveal delay={i * 0.06}>
                <Link href="/take-away" className="group block">
                  <div className="relative aspect-square overflow-hidden rounded-3xl bg-blush">
                    <Image
                      src={cake.image!}
                      alt={cake.name}
                      fill
                      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 72vw"
                      className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                    />
                  </div>
                  <p className="mt-3 font-semibold">{shortName(cake.name)}</p>
                  <p className="text-sm text-muted tabular-nums">
                    {cake.sizes.length > 1 ? "Desde " : ""}
                    {formatPrice(cake.price)}
                  </p>
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
      </section>

      {reviews.length ? (
        <section aria-labelledby="opiniones" className="mx-auto mt-24 max-w-6xl px-4 sm:px-6">
          <Reveal>
            <h2 id="opiniones" className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Lo que dicen en Google
            </h2>
          </Reveal>
          <ul className="mt-8 grid gap-5 md:grid-cols-3">
            {reviews.map((review, i) => (
              <li key={review.author}>
                <Reveal delay={i * 0.06} className="h-full">
                  <figure className="flex h-full flex-col rounded-3xl bg-paper p-6 ring-1 ring-line">
                    <div className="flex gap-0.5 text-amber-500" aria-label={`${review.rating} de 5 estrellas`}>
                      {Array.from({ length: review.rating }, (_, s) => (
                        <StarIcon key={s} width={16} height={16} />
                      ))}
                    </div>
                    <blockquote className="mt-3 line-clamp-6 flex-1 text-pretty">“{review.text}”</blockquote>
                    <figcaption className="mt-4 text-sm text-muted">
                      {review.author.split(" ")[0]} · {review.when.toLowerCase()}
                    </figcaption>
                  </figure>
                </Reveal>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="visitanos" className="mx-auto mt-24 max-w-6xl px-4 sm:px-6">
        <Reveal className="grid gap-8 overflow-hidden rounded-[2rem] bg-blush p-6 sm:p-10 md:grid-cols-2">
          <div>
            <h2 id="visitanos" className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Visitanos
            </h2>
            <p className="mt-3 text-muted">
              {locationsSummary}.
              {shop.salon?.stayLimit ? ` Tiempo de permanencia en el salón: ${shop.salon.stayLimit}.` : null}
            </p>
            {/* One place: "Cómo llegar" and WhatsApp side by side even on phones, PedidosYa on its own row.
                Several: one button per row, since branch names like "Cañada de Gómez" don't fit half a phone. */}
            <div className={`mt-6 grid max-w-md gap-3 ${hasBranches ? "" : "grid-cols-2"}`}>
              {locations.map((location) => (
                <a
                  key={location.mapsUrl}
                  href={location.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-4 py-3 font-semibold whitespace-nowrap text-cream hover:bg-brand-ink"
                >
                  <PinIcon className="shrink-0" /> {hasBranches ? location.name : "Cómo llegar"}
                </a>
              ))}
              <a
                href={whatsappLink(`${greeting} Tengo una consulta.`)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-paper px-4 py-3 font-semibold ring-1 ring-line hover:bg-cream"
              >
                <WhatsappIcon className="shrink-0" /> WhatsApp
              </a>
              {shop.pedidosYa ? (
                <a
                  href={shop.pedidosYa}
                  target="_blank"
                  rel="noreferrer"
                  className={`${hasBranches ? "" : "col-span-2"} inline-flex items-center justify-center gap-2 rounded-full bg-brand px-4 py-3 font-semibold text-white hover:bg-brand-ink`}
                >
                  <DeliveryIcon className="shrink-0" /> Pedí delivery por PedidosYa
                </a>
              ) : null}
            </div>
          </div>
          <div className="rounded-3xl bg-paper p-5 ring-1 ring-line">
            <h3 className="mb-1 flex items-center gap-2 font-semibold">
              <ClockIcon className="text-brand" /> Horarios
            </h3>
            <WeekSchedule />
          </div>
        </Reveal>
      </section>
    </>
  );
}

function ChoiceCard({
  href,
  image,
  icon,
  title,
  text,
  cta,
}: {
  href: string;
  image?: string | null;
  icon: React.ReactNode;
  title: string;
  text: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="group relative flex min-h-80 flex-col justify-end overflow-hidden rounded-[2rem] bg-ink p-6 text-cream sm:p-8"
    >
      {image ? (
        <Image
          src={image}
          alt=""
          fill
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-cover opacity-70 transition-[transform,opacity] duration-700 ease-out group-hover:scale-105 group-hover:opacity-60"
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-transparent" />
      <div className="relative">
        <span className="grid size-11 place-items-center rounded-full bg-cream/15 backdrop-blur">{icon}</span>
        <h3 className="mt-4 font-display text-3xl font-semibold">{title}</h3>
        <p className="mt-2 max-w-sm text-cream/80">{text}</p>
        <span className="mt-5 inline-flex items-center gap-2 font-semibold">
          {cta} <ArrowIcon className="transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}
