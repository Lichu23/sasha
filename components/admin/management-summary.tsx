"use client";

import { useMemo, useState } from "react";
import { ColumnChart, DataTable, RankedBars, type Datum } from "@/components/admin/charts";
import { Segmented } from "@/components/ui/segmented";
import { DAY_MS, dayLabel, shortDay, startOfArDay } from "@/lib/admin-dates";
import { formatPrice } from "@/lib/menu";
import { byMethod, counted, sumOf, topProducts, useSales } from "@/lib/sales";
import { toAr } from "@/lib/pickup";
import { useNow } from "@/lib/use-now";

// The management shop's summary: how the sales go over the last days, what sells, how it is paid and at what hours.

const PERIODS = [
  { value: 7, label: "Últimos 7 días" },
  { value: 30, label: "Últimos 30 días" },
] as const;

const count = (v: number) => String(v);

export function ManagementSummary() {
  const state = useSales();
  const now = useNow();
  const [days, setDays] = useState<number>(30);

  const data = useMemo(() => {
    if (!state || now === null) return null;
    const today = startOfArDay(now);
    const from = today - (days - 1) * DAY_MS;
    const prevFrom = from - days * DAY_MS;
    const sales = counted(state.sales);
    const inPeriod = sales.filter((s) => s.at >= from);
    const inPrev = sales.filter((s) => s.at >= prevFrom && s.at < from);
    const revenue = sumOf(inPeriod);
    const prevRevenue = sumOf(inPrev);

    const byDay: Datum[] = Array.from({ length: days }, (_, i) => {
      const start = from + i * DAY_MS;
      return {
        key: String(start),
        label: days > 7 ? shortDay(start) : dayLabel(start, now),
        value: sumOf(inPeriod.filter((s) => startOfArDay(s.at) === start)),
      };
    });

    // Tickets by the hour they were sold: when the counter is busiest.
    const hours = inPeriod.map((s) => toAr(s.at).hour);
    const first = Math.min(...hours, 8);
    const last = Math.max(...hours, 20);
    const byHour: Datum[] = Array.from({ length: last - first + 1 }, (_, i) => ({
      key: String(first + i),
      label: `${first + i}`,
      value: hours.filter((h) => h === first + i).length,
    }));

    return {
      revenue,
      delta: prevRevenue > 0 ? (revenue - prevRevenue) / prevRevenue : null,
      tickets: inPeriod.length,
      average: inPeriod.length ? revenue / inPeriod.length : 0,
      units: inPeriod.reduce((sum, s) => sum + s.lines.reduce((n, l) => n + l.quantity, 0), 0),
      byDay,
      top: topProducts(inPeriod, 6).map((t): Datum => ({ key: t.name, label: t.name, value: t.units })),
      methods: byMethod(inPeriod).map((m): Datum => ({ key: m.method, label: m.method, value: m.total })),
      byHour,
    };
  }, [state, now, days]);

  return (
    <>
      <h1 className="font-display text-3xl font-semibold tracking-tight">Resumen</h1>
      <p className="text-sm text-muted">Cómo van las ventas.</p>

      <Segmented label="Período" value={days} onChange={setDays} options={PERIODS} className="mt-5" />

      <section aria-label="Resumen del período" className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-3xl bg-paper p-5 ring-1 ring-line sm:col-span-3">
          <p className="text-sm text-muted">Ventas</p>
          <p className="mt-1 text-5xl font-semibold tracking-tight">{data ? formatPrice(data.revenue) : "–"}</p>
          {data?.delta != null ? (
            <p className={`mt-2 text-sm font-medium ${data.delta >= 0 ? "text-emerald-700" : "text-brand-ink"}`}>
              {data.delta >= 0 ? "▲" : "▼"} {Math.abs(Math.round(data.delta * 100))}% <span className="font-normal text-muted">vs. los {days} días anteriores</span>
            </p>
          ) : (
            <p className="mt-2 text-sm text-muted">Sin datos del período anterior para comparar</p>
          )}
        </div>
        <Tile label="Ventas" value={data ? String(data.tickets) : "–"} />
        <Tile label="Ticket promedio" value={data ? formatPrice(data.average) : "–"} />
        <Tile label="Productos vendidos" value={data ? String(data.units) : "–"} />
      </section>

      <div className={`mt-3 grid gap-3 lg:grid-cols-5 ${data ? "" : "opacity-50"}`}>
        <section aria-labelledby="by-day" className="rounded-3xl bg-paper p-5 ring-1 ring-line lg:col-span-3">
          <h2 id="by-day" className="font-semibold">
            Ventas por día
          </h2>
          <p className="mb-5 text-xs text-muted">Pesos vendidos cada día</p>
          {data ? (
            <>
              <ColumnChart data={data.byDay} format={formatPrice} labelEvery={days > 7 ? 5 : 1} />
              <DataTable data={data.byDay} valueLabel="Ventas" format={formatPrice} />
            </>
          ) : null}
        </section>

        <section aria-labelledby="top" className="rounded-3xl bg-paper p-5 ring-1 ring-line lg:col-span-2">
          <h2 id="top" className="font-semibold">
            Lo más vendido
          </h2>
          <p className="mb-5 text-xs text-muted">Unidades en el período</p>
          {data?.top.length ? <RankedBars data={data.top} format={count} /> : <p className="text-sm text-muted">Sin ventas en el período.</p>}
        </section>

        <section aria-labelledby="methods" className="rounded-3xl bg-paper p-5 ring-1 ring-line lg:col-span-2">
          <h2 id="methods" className="font-semibold">
            Cómo pagan
          </h2>
          <p className="mb-5 text-xs text-muted">Pesos por medio de pago</p>
          {data ? <RankedBars data={data.methods} format={formatPrice} /> : null}
        </section>

        <section aria-labelledby="by-hour" className="rounded-3xl bg-paper p-5 ring-1 ring-line lg:col-span-3">
          <h2 id="by-hour" className="font-semibold">
            Horas con más ventas
          </h2>
          <p className="mb-5 text-xs text-muted">Cuántas ventas se hicieron en cada hora</p>
          {data ? (
            <>
              <ColumnChart data={data.byHour} format={count} height={140} valueOnCap />
              <DataTable data={data.byHour} valueLabel="Ventas" format={count} />
            </>
          ) : null}
        </section>
      </div>
    </>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-paper p-5 ring-1 ring-line">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}
