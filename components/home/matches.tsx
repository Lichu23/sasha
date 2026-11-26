"use client";

import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { ArrowIcon } from "@/components/icons";
import { capitalize, dayLabel, formatTime } from "@/lib/admin-dates";
import { fromAr, toAr } from "@/lib/pickup";
import { shop } from "@/lib/shop";
import { useNow } from "@/lib/use-now";

const HOUR_MS = 60 * 60 * 1000;

/** "Partidos": the matches shown in the salón, each with a button that opens the reservation form with its day and time. */
export function MatchesSection() {
  const now = useNow();
  // Dates depend on today: nothing renders on the server, so there is no mismatch while hydrating.
  if (now === null || !shop.matches) return null;
  const today = toAr(now);

  return (
    <section aria-labelledby="partidos" className="mx-auto mt-24 max-w-6xl px-4 sm:px-6">
      <Reveal>
        <p className="text-sm font-semibold tracking-wide text-brand uppercase">Partidos</p>
        <h2 id="partidos" className="mt-1 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Mirá el partido con nosotros
        </h2>
        <p className="mt-3 max-w-xl text-muted text-pretty">Transmitimos en el salón. Reservá tu mesa para el día del partido y llegás con lugar.</p>
      </Reveal>
      <ul className="mt-8 grid gap-4 md:grid-cols-3">
        {shop.matches.map((m, i) => {
          const at = fromAr(today.year, today.month, today.date + m.inDays, 0) + m.hour * HOUR_MS;
          return (
            <li key={m.id}>
              <Reveal delay={i * 0.06} className="h-full">
                <div className="flex h-full flex-col rounded-3xl bg-ink p-6 text-cream">
                  <p className="text-xs font-semibold tracking-wide text-cream/70 uppercase">{m.competition}</p>
                  <h3 className="mt-2 font-display text-2xl leading-tight">
                    {m.home} <span className="text-brand-ink/0 text-cream/60">vs</span> {m.away}
                  </h3>
                  <p className="mt-2 flex-1 text-cream/80 tabular-nums">
                    {capitalize(dayLabel(at, now))} · {formatTime(at)} hs
                  </p>
                  <Link
                    href={`/reservas?partido=${m.id}`}
                    data-cta="reservar-partido"
                    className="group mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-brand px-5 py-3 font-semibold text-white transition-[background-color,transform] [touch-action:manipulation] hover:bg-brand-ink active:scale-[0.98]"
                  >
                    Reservar mesa
                    <ArrowIcon className="transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </Reveal>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
