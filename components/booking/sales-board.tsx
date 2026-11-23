"use client";

import { useMemo, useState } from "react";
import { ColumnChart, DataTable, RankedBars, type Datum } from "@/components/admin/charts";
import { Segmented } from "@/components/ui/segmented";
import { DAY_MS, shortDay, startOfArDay } from "@/lib/admin-dates";
import { isActive, saleValue, type Booking } from "@/lib/booking/availability";
import { useBookings } from "@/lib/booking/store";
import { money, offerOf, payLabel, staffOf, type PayMethod, type Venue } from "@/lib/booking/venues";
import { toAr } from "@/lib/pickup";
import { useNow } from "@/lib/use-now";

// The panel's sales view: what the business earned in the last 7 or 30 days against the ones before, by day, by
// class / treatment, by weekday and by who gave it, how they pay, and how many came (the no-shows that already paid).

const PERIODS = [
  { value: 7, label: "Últimos 7 días" },
  { value: 30, label: "Últimos 30 días" },
] as const;
const WEEKDAYS = [
  { day: 1, label: "Lun" },
  { day: 2, label: "Mar" },
  { day: 3, label: "Mié" },
  { day: 4, label: "Jue" },
  { day: 5, label: "Vie" },
  { day: 6, label: "Sáb" },
  { day: 0, label: "Dom" },
];
const count = (v: number) => String(v);

export function SalesBoard({ venue }: { venue: Venue }) {
  const bookings = useBookings(venue);
  const now = useNow();
  const [days, setDays] = useState<number>(30);
  const euroRound = (v: number) => money(venue, Math.round(v));
  const [firstPay, secondPay] = venue.payments;

  const data = useMemo(() => {
    if (!bookings || now === null) return null;
    const today = startOfArDay(now);
    const from = today - (days - 1) * DAY_MS;
    const prevFrom = from - days * DAY_MS;
    const end = today + DAY_MS;
    const inPeriod = bookings.filter((b) => b.start >= from && b.start < end);
    const inPrev = bookings.filter((b) => b.start >= prevFrom && b.start < from);
    const sum = (list: typeof bookings) => list.reduce((s, b) => s + saleValue(b), 0);
    const revenue = sum(inPeriod);
    const prevRevenue = sum(inPrev);
    const active = inPeriod.filter(isActive);
    const came = active.filter((b) => b.status === "asistio").length;
    const missed = active.filter((b) => b.status === "noshow");

    const byDay: Datum[] = Array.from({ length: days }, (_, i) => {
      const start = from + i * DAY_MS;
      return { key: String(start), label: shortDay(start), value: sum(inPeriod.filter((b) => startOfArDay(b.start) === start)) };
    });

    const group = (key: (b: Booking) => string, label: (id: string) => string, limit: number): Datum[] => {
      const totals = new Map<string, number>();
      for (const b of inPeriod) totals.set(key(b), (totals.get(key(b)) ?? 0) + saleValue(b));
      return [...totals.entries()]
        .filter(([, value]) => value > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([id, value]) => ({ key: id, label: label(id), value }));
    };
    const byOffer = group((b) => b.offer, (id) => offerOf(venue, id)?.name ?? id, 6);
    const byStaff = group((b) => b.staff, (id) => staffOf(venue, id)?.name ?? id, 5);

    const byWeekday: Datum[] = WEEKDAYS.map((w) => ({ key: String(w.day), label: w.label, value: active.filter((b) => toAr(b.start).weekday === w.day).length }));
    const card = active.filter((b) => b.method === venue.payments[0]).reduce((s, b) => s + b.paid, 0);
    const bizum = active.filter((b) => b.method === venue.payments[1]).reduce((s, b) => s + b.paid, 0);

    return {
      revenue,
      delta: prevRevenue > 0 ? (revenue - prevRevenue) / prevRevenue : null,
      count: active.length,
      avg: active.length ? revenue / active.length : 0,
      attendance: came + missed.length ? came / (came + missed.length) : null,
      missed: missed.length,
      kept: missed.reduce((s, b) => s + b.paid, 0),
      online: active.reduce((s, b) => s + b.paid, 0),
      byDay,
      byOffer,
      byStaff,
      byWeekday,
      card,
      bizum,
    };
  }, [bookings, now, days, venue]);

  const unit = venue.words.appts;

  return (
    <main className="mx-auto w-full max-w-md px-4 pt-5 pb-12 lg:max-w-6xl lg:px-8 lg:pt-8">
      <div className="lg:flex lg:items-end lg:justify-between lg:gap-6">
        <h1 className="font-display text-3xl font-semibold lg:text-4xl">Ventas</h1>
        <Segmented label="Período" value={days} onChange={setDays} options={PERIODS} className="mt-3 lg:mt-0 lg:w-96" />
      </div>

      <section aria-label="Resumen del período" className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-6 lg:gap-3">
        <div className="col-span-2 rounded-2xl bg-ink p-5 text-cream">
          <p className="text-sm text-cream/70">Ingresos</p>
          <p className="mt-1 font-sans text-5xl font-semibold tracking-tight tabular-nums">{data ? euroRound(data.revenue) : "–"}</p>
          {data?.delta != null ? (
            <p className={`mt-2 text-sm font-medium ${data.delta >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
              {data.delta >= 0 ? "▲" : "▼"} {Math.abs(Math.round(data.delta * 100))} % <span className="font-normal text-cream/70">frente a los {days} días anteriores</span>
            </p>
          ) : (
            <p className="mt-2 text-sm text-cream/70">Sin datos anteriores para comparar</p>
          )}
        </div>
        <Tile label={unit[0].toUpperCase() + unit.slice(1)} value={data ? String(data.count) : "–"} />
        <Tile label={venue.mode === "classes" ? "Por reserva" : "Ticket medio"} value={data ? money(venue, venue.locale === "es-AR" ? Math.round(data.avg) : Math.round(data.avg * 10) / 10) : "–"} />
        <Tile label={venue.payAtVenue ? "Cobrado" : "Cobrado online"} value={data ? euroRound(data.online) : "–"} hint={venue.payAtVenue ? "confirmado en el panel" : "pagos al reservar"} />
        <Tile label="Asistencia" value={data?.attendance != null ? `${Math.round(data.attendance * 100)} %` : "–"} hint={data ? `${data.missed} no vinieron` : undefined} />
      </section>

      {data && data.missed > 0 && !venue.payAtVenue ? (
        <p className="mt-3 rounded-2xl bg-blush px-4 py-3 text-sm text-brand-ink">
          Los {data.missed} plantones de este período dejaron <b>{money(venue, data.kept)}</b> ya cobrados por adelantado, en vez de huecos vacíos sin ingreso.
        </p>
      ) : null}

      <div className={`mt-3 grid gap-3 lg:grid-cols-2 lg:gap-4 ${data ? "" : "opacity-50"}`}>
        <Panel id="by-day" title="Ingresos por día" hint={`${venue.locale === "es-AR" ? "Pesos" : "Euros"} de cada día`} className="lg:col-span-2">
          {data ? (
            <>
              <ColumnChart data={data.byDay} format={euroRound} labelEvery={days > 7 ? 5 : 1} />
              <DataTable data={data.byDay} valueLabel="Ingresos" format={euroRound} />
            </>
          ) : null}
        </Panel>

        <Panel id="by-offer" title={venue.mode === "classes" ? "Clases que más ingresan" : venue.slug === "nutricion" ? "Consultas que más ingresan" : "Tratamientos que más ingresan"} hint={`${venue.locale === "es-AR" ? "Pesos" : "Euros"} en el período`}>
          {data?.byOffer.length ? <RankedBars data={data.byOffer} format={euroRound} /> : <p className="text-sm text-muted">Sin ventas en el período.</p>}
        </Panel>

        {venue.solo ? null : (
          <Panel id="by-staff" title={venue.mode === "classes" ? "Por profesor" : "Por profesional"} hint={`${venue.locale === "es-AR" ? "Pesos" : "Euros"} en el período`}>
            {data?.byStaff.length ? <RankedBars data={data.byStaff} format={euroRound} /> : <p className="text-sm text-muted">Sin ventas en el período.</p>}
          </Panel>
        )}

        <Panel id="by-weekday" title={`${unit[0].toUpperCase()}${unit.slice(1)} por día de la semana`} hint="Qué días se llena más">
          {data ? (
            <>
              <ColumnChart data={data.byWeekday} format={count} height={140} valueOnCap />
              <DataTable data={data.byWeekday} valueLabel={unit[0].toUpperCase() + unit.slice(1)} format={count} />
            </>
          ) : null}
        </Panel>

        <Panel id="methods" title="Cómo pagan" hint={venue.payAtVenue ? "Cobros del período" : "Pagos online del período"}>
          {data ? <Methods venue={venue} first={firstPay} second={secondPay} card={data.card} bizum={data.bizum} /> : null}
        </Panel>
      </div>
      <p className="mt-6 text-center text-xs text-muted">Datos de ejemplo. Los ingresos cuentan lo que vale cada {venue.words.appt}: completa si vino, lo ya pagado si no vino, nada si se canceló (se devuelve).</p>
    </main>
  );
}

function Tile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl bg-paper p-4 ring-1 ring-line">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-0.5 font-sans text-2xl font-semibold tabular-nums">{value}</p>
      {hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

function Panel({ id, title, hint, className = "", children }: { id: string; title: string; hint: string; className?: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className={`rounded-2xl bg-paper p-5 ring-1 ring-line ${className}`}>
      <h2 id={id} className="font-semibold">
        {title}
      </h2>
      <p className="mb-5 text-xs text-muted">{hint}</p>
      {children}
    </section>
  );
}

function Methods({ venue, first, second, card, bizum }: { venue: Venue; first: PayMethod; second: PayMethod; card: number; bizum: number }) {
  const total = card + bizum;
  if (total === 0) return <p className="text-sm text-muted">Sin pagos en el período.</p>;
  const pct = Math.round((card / total) * 100);
  return (
    <>
      <div className="flex h-4 overflow-hidden rounded-full ring-1 ring-line" role="img" aria-label={`${payLabel[first]} ${pct} %, ${payLabel[second]} ${100 - pct} %`}>
        <span className="bg-brand" style={{ width: `${pct}%` }} />
        <span className="bg-brand/35" style={{ width: `${100 - pct}%` }} />
      </div>
      <dl className="mt-3 grid gap-1.5 text-sm">
        <div className="flex items-center justify-between">
          <dt className="flex items-center gap-2">
            <span aria-hidden className="size-3 rounded-full bg-brand" /> {payLabel[first]}
          </dt>
          <dd className="font-semibold tabular-nums">
            {money(venue, card)} · {pct} %
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="flex items-center gap-2">
            <span aria-hidden className="size-3 rounded-full bg-brand/35" /> {payLabel[second]}
          </dt>
          <dd className="font-semibold tabular-nums">
            {money(venue, bizum)} · {100 - pct} %
          </dd>
        </div>
      </dl>
    </>
  );
}
