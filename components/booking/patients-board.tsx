"use client";

import { useMemo, useState } from "react";
import { dayLabel, formatTime } from "@/lib/admin-dates";
import { isActive, saleValue, type Booking } from "@/lib/booking/availability";
import { useBookings } from "@/lib/booking/store";
import { money, offerOf, type Venue } from "@/lib/booking/venues";
import { useNow } from "@/lib/use-now";
import { control } from "./ui";

// The panel's patients view (a practice with clients that come back): everyone who has booked, grouped by phone, with
// how many times they came, the last consultation, the next turno and what they have paid. A search box finds one.

type Patient = { key: string; name: string; phone: string; visits: number; last?: Booking; next?: Booking; total: number; bookings: number };

export function PatientsBoard({ venue }: { venue: Venue }) {
  const now = useNow();
  const bookings = useBookings(venue);
  const [query, setQuery] = useState("");

  const patients = useMemo(() => {
    if (!bookings || now === null) return null;
    const map = new Map<string, Patient>();
    for (const b of bookings.filter(isActive)) {
      const key = b.phone.replace(/\D/g, "");
      const p = map.get(key) ?? { key, name: b.name, phone: b.phone, visits: 0, total: 0, bookings: 0 };
      p.bookings += 1;
      p.total += saleValue(b);
      if (b.status === "asistio") {
        p.visits += 1;
        if (!p.last || b.start > p.last.start) p.last = b;
      }
      if (b.status === "confirmada" && b.start >= now && (!p.next || b.start < p.next.start)) p.next = b;
      map.set(key, p);
    }
    return [...map.values()].sort((a, b) => (a.next?.start ?? Infinity) - (b.next?.start ?? Infinity) || (b.last?.start ?? 0) - (a.last?.start ?? 0));
  }, [bookings, now]);

  if (now === null || patients === null) return <p className="px-5 py-10 text-center text-muted">Cargando los pacientes…</p>;

  const q = query.trim().toLowerCase();
  const shown = q ? patients.filter((p) => p.name.toLowerCase().includes(q) || p.phone.replace(/\D/g, "").includes(q.replace(/\D/g, "") || "no-digits")) : patients;
  const returning = patients.filter((p) => p.visits >= 2).length;
  const upcoming = patients.filter((p) => p.next).length;

  return (
    <main className="mx-auto w-full max-w-md px-4 pt-5 pb-12 lg:max-w-6xl lg:px-8 lg:pt-8">
      <div className="lg:flex lg:items-end lg:justify-between lg:gap-6">
        <h1 className="font-display text-3xl font-semibold lg:text-4xl">Pacientes</h1>
        <label className="mt-3 block lg:mt-0 lg:w-96">
          <span className="sr-only">Buscar paciente</span>
          <input type="search" name="q" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nombre o teléfono…" autoComplete="off" className={control} />
        </label>
      </div>

      <section aria-label="Resumen" className="mt-4 grid grid-cols-3 gap-2">
        <Tile label="Pacientes" value={patients.length} />
        <Tile label="Vuelven" value={returning} hint="2 o más consultas" />
        <Tile label="Con turno" value={upcoming} hint="próximo agendado" />
      </section>

      {shown.length === 0 ? <p className="mt-4 rounded-2xl bg-paper px-4 py-8 text-center text-muted ring-1 ring-line">No hay pacientes con esa búsqueda.</p> : null}
      <ul aria-label="Pacientes" className="mt-4 grid gap-3 lg:grid-cols-2 lg:items-start">
        {shown.map((p) => {
          const last = p.last;
          const next = p.next;
          return (
            <li key={p.key} data-patient={p.key} className="rounded-2xl bg-paper p-4 ring-1 ring-line">
              <div className="flex items-start gap-3">
                <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-full bg-blush font-semibold text-brand-ink">
                  {p.name
                    .split(" ")
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join("")}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-semibold">{p.name}</p>
                    {p.visits === 0 ? <span className="shrink-0 rounded-full bg-brand px-2 py-0.5 text-xs font-semibold text-white">Nuevo</span> : null}
                  </div>
                  <p className="text-sm text-muted tabular-nums">{p.phone}</p>
                </div>
              </div>
              <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-line pt-3 text-sm">
                <div>
                  <dt className="text-xs text-muted">Consultas</dt>
                  <dd className="font-semibold tabular-nums">{p.visits}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Pagado</dt>
                  <dd className="font-semibold tabular-nums">{money(venue, p.total)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Última</dt>
                  <dd className="font-semibold first-letter:uppercase">{last ? dayLabel(last.start, now) : "–"}</dd>
                </div>
              </dl>
              {next ? (
                <p className="mt-3 rounded-xl bg-blush px-3 py-2 text-sm text-brand-ink">
                  Próximo turno: <b className="first-letter:uppercase">{dayLabel(next.start, now)}</b>, {formatTime(next.start)} h · {offerOf(venue, next.offer)?.name}
                  {next.modality === "online" ? " · online" : ""}
                </p>
              ) : (
                <p className="mt-3 rounded-xl bg-cream px-3 py-2 text-sm text-muted">Sin turno agendado</p>
              )}
            </li>
          );
        })}
      </ul>
      <p className="mt-6 text-center text-xs text-muted">Datos de ejemplo. Los pacientes salen de los turnos reservados desde la web.</p>
    </main>
  );
}

function Tile({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="rounded-2xl bg-paper px-3 py-3 ring-1 ring-line">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-0.5 font-sans text-2xl font-semibold tabular-nums">{value}</p>
      {hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </div>
  );
}
