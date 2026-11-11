"use client";

import { useMemo, useState } from "react";
import { ColumnChart, DataTable, RankedBars, type Datum } from "@/components/admin/charts";
import { Segmented } from "@/components/ui/segmented";
import { DAY_MS, dayLabel, formatTime, shortDay, startOfArDay } from "@/lib/admin-dates";
import { formatPrice } from "@/lib/menu";
import { useOrders } from "@/lib/orders";
import { toAr } from "@/lib/pickup";
import { useNow } from "@/lib/use-now";
import { closedLabel, isConsulta, noun, paysOnline, shortName, weekSchedule } from "@/lib/shop";

const PERIODS = [
  { value: 7, label: "Últimos 7 días" },
  { value: 30, label: "Últimos 30 días" },
] as const;

// Open days only, in the order of the week.
const WEEKDAYS = weekSchedule.filter((d) => d.hours).map((d) => ({ day: d.weekday, label: d.short }));
const otherCapitalized = noun.other.charAt(0).toUpperCase() + noun.other.slice(1);

const count = (v: number) => String(v);

export function SalesDashboard() {
  const orders = useOrders();
  const now = useNow();
  const [days, setDays] = useState<number>(30);

  const data = useMemo(() => {
    if (!orders || now === null) return null;
    const today = startOfArDay(now);
    const from = today - (days - 1) * DAY_MS;
    const prevFrom = from - days * DAY_MS;

    // Sales are counted on the day the order was placed. Online payments only count once paid;
    // shops paid on pickup count every order, or the last days (not picked up yet) would look empty.
    // Shops that confirm orders only count the ones they accepted (not the waiting, rejected or rescheduled).
    const paid = paysOnline
      ? orders.filter((o) => o.payment === "pagado")
      : isConsulta
        ? orders.filter((o) => o.status === "confirmado" || o.status === "completado")
        : orders;
    const inPeriod = paid.filter((o) => o.createdAt >= from);
    const inPrev = paid.filter((o) => o.createdAt >= prevFrom && o.createdAt < from);
    const revenue = inPeriod.reduce((s, o) => s + o.total, 0);
    const prevRevenue = inPrev.reduce((s, o) => s + o.total, 0);
    const cakes = inPeriod.reduce((s, o) => s + o.items.reduce((n, i) => n + i.quantity, 0), 0);

    const byDay: Datum[] = Array.from({ length: days }, (_, i) => {
      const start = from + i * DAY_MS;
      return {
        key: String(start),
        label: days > 7 ? shortDay(start) : dayLabel(start, now),
        value: inPeriod.filter((o) => startOfArDay(o.createdAt) === start).reduce((s, o) => s + o.total, 0),
      };
    });

    const units = new Map<string, number>();
    for (const o of inPeriod) {
      for (const i of o.items) {
        const name = shortName(i.label.replace(/ \(.*\)$/, ""));
        units.set(name, (units.get(name) ?? 0) + i.quantity);
      }
    }
    const top: Datum[] = [...units.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({ key: name, label: name, value }));

    const byWeekday: Datum[] = WEEKDAYS.map((w) => ({
      key: String(w.day),
      label: w.label,
      value: inPeriod.filter((o) => toAr(o.pickup).weekday === w.day).length,
    }));

    // Today's pickups sit outside the period filter: they're about now, not the range.
    const todayPickups = orders
      .filter((o) => o.status === "pendiente" && startOfArDay(o.pickup) === today)
      .sort((a, b) => a.pickup - b.pickup);
    const upcoming = orders.filter((o) => o.status === "pendiente" && o.pickup >= now).sort((a, b) => a.pickup - b.pickup);

    return {
      revenue,
      delta: prevRevenue > 0 ? (revenue - prevRevenue) / prevRevenue : null,
      orders: inPeriod.length,
      avgTicket: inPeriod.length ? revenue / inPeriod.length : 0,
      cakes,
      byDay,
      top,
      byWeekday,
      todayPickups,
      next: upcoming[0] ?? null,
    };
  }, [orders, now, days]);

  return (
    <>
      <h1 className="font-display text-3xl font-semibold tracking-tight">Ventas</h1>

      {/* Today: independent of the period filter below. */}
      <section aria-label="Hoy" className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="min-w-0 rounded-3xl bg-ink p-5 text-cream">
          <p className="text-sm text-cream/70">Retiros de hoy</p>
          <p className="mt-1 text-4xl font-semibold">{data ? data.todayPickups.length : "–"}</p>
          <p className="mt-1 truncate text-sm text-cream/70">
            {data?.todayPickups.length
              ? data.todayPickups.map((o) => `${formatTime(o.pickup)} ${o.name.split(" ")[0]}`).join(" · ")
              : "Sin retiros pendientes para hoy"}
          </p>
        </div>
        <div className="min-w-0 rounded-3xl bg-paper p-5 ring-1 ring-line">
          <p className="text-sm text-muted">Próximo retiro</p>
          {data?.next ? (
            <>
              <p className="mt-1 text-2xl font-semibold">
                {dayLabel(data.next.pickup, now!)}, {formatTime(data.next.pickup)} hs
              </p>
              <p className="mt-1 truncate text-sm text-muted">
                {data.next.name} · {data.next.items.map((i) => `${i.quantity} × ${i.label}`).join(", ")}
              </p>
            </>
          ) : (
            <p className="mt-1 text-2xl font-semibold">–</p>
          )}
        </div>
      </section>

      {/* One filter row; it scopes everything below it. */}
      <Segmented label="Período" value={days} onChange={setDays} options={PERIODS} className="mt-8" />

      <section aria-label="Resumen del período" className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-3xl bg-paper p-5 ring-1 ring-line sm:col-span-3">
          <p className="text-sm text-muted">{paysOnline ? "Ventas cobradas" : "Ventas"}</p>
          <p className="mt-1 text-5xl font-semibold tracking-tight">{data ? formatPrice(data.revenue) : "–"}</p>
          {data?.delta != null ? (
            <p className={`mt-2 text-sm font-medium ${data.delta >= 0 ? "text-emerald-700" : "text-brand-ink"}`}>
              {data.delta >= 0 ? "▲" : "▼"} {Math.abs(Math.round(data.delta * 100))}%{" "}
              <span className="font-normal text-muted">vs. los {days} días anteriores</span>
            </p>
          ) : (
            <p className="mt-2 text-sm text-muted">Sin datos del período anterior para comparar</p>
          )}
        </div>
        <Tile label="Pedidos" value={data ? String(data.orders) : "–"} />
        <Tile label="Ticket promedio" value={data ? formatPrice(data.avgTicket) : "–"} />
        <Tile label={`${otherCapitalized} ${noun.g("vendidas", "vendidos")}`} value={data ? String(data.cakes) : "–"} />
      </section>

      <div className={`mt-3 grid gap-3 lg:grid-cols-5 ${data ? "" : "opacity-50"}`}>
        <section aria-labelledby="by-day" className="rounded-3xl bg-paper p-5 ring-1 ring-line lg:col-span-3">
          <h2 id="by-day" className="font-semibold">Ventas por día</h2>
          <p className="mb-5 text-xs text-muted">{paysOnline ? "Pesos cobrados cada día" : "Pesos en pedidos cada día"}</p>
          {data ? (
            <>
              <ColumnChart data={data.byDay} format={formatPrice} labelEvery={days > 7 ? 5 : 1} />
              <DataTable data={data.byDay} valueLabel="Ventas" format={formatPrice} />
            </>
          ) : null}
        </section>

        <section aria-labelledby="top" className="rounded-3xl bg-paper p-5 ring-1 ring-line lg:col-span-2">
          <h2 id="top" className="font-semibold">
            {otherCapitalized} más {noun.g("vendidas", "vendidos")}
          </h2>
          <p className="mb-5 text-xs text-muted">Unidades en el período</p>
          {data?.top.length ? <RankedBars data={data.top} format={count} /> : <p className="text-sm text-muted">Sin ventas en el período.</p>}
        </section>

        <section aria-labelledby="by-weekday" className="rounded-3xl bg-paper p-5 ring-1 ring-line lg:col-span-5">
          <h2 id="by-weekday" className="font-semibold">Retiros por día de la semana</h2>
          <p className="mb-5 text-xs text-muted">
            Qué días se retiran más {noun.other}
            {closedLabel ? ` (${closedLabel.toLowerCase()})` : ""}
          </p>
          {data ? (
            <>
              <ColumnChart data={data.byWeekday} format={count} height={140} valueOnCap />
              <DataTable data={data.byWeekday} valueLabel="Pedidos" format={count} />
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
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
