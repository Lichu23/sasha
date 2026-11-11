"use client";

import { useMemo, useState } from "react";
import { RankedBars } from "@/components/admin/charts";
import { CalendarIcon, CheckIcon } from "@/components/icons";
import { DateTimeSheet } from "@/components/ui/date-sheet";
import { dayLabel, formatTime, startOfArDay } from "@/lib/admin-dates";
import { formatPrice } from "@/lib/menu";
import { byMethod, CASH, counted, KIND_LABEL, salesActions, salesOnDay, sumOf, topProducts, useSales, type Sale } from "@/lib/sales";
import { useNow } from "@/lib/use-now";

// The day's sales: the totals, how it was paid, the best sellers, every ticket (that can be taken out if it was a
// mistake) and the cash closing, with a calendar to go to any other day.

const DAY_MS = 24 * 60 * 60 * 1000;
const SHOWN = 12;

const press = "[touch-action:manipulation] transition-[transform,background-color] duration-100 active:scale-[0.97] motion-reduce:active:scale-100";
const arrow = `${press} grid size-11 shrink-0 place-items-center rounded-full bg-paper text-xl leading-none ring-1 ring-line`;

/** 182.400 → "182k", for the calendar's small cells. */
const thousands = (value: number) => `${Math.round(value / 1000)}k`;

export function DaySales() {
  const state = useSales();
  const now = useNow();
  const [picked, setPicked] = useState<number | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const view = useMemo(() => {
    if (!state || now === null) return null;
    const today = startOfArDay(now);
    const day = picked ?? today;
    const list = salesOnDay(state.sales, day);
    const perDay = new Map<number, number>();
    for (const s of counted(state.sales)) perDay.set(startOfArDay(s.at), (perDay.get(startOfArDay(s.at)) ?? 0) + s.total);
    const total = sumOf(list);
    const tickets = counted(list).length;
    const methods = byMethod(list);
    return {
      today,
      day,
      list,
      perDay,
      total,
      tickets,
      average: tickets ? total / tickets : 0,
      methods,
      cash: methods.find((m) => m.method === CASH)?.total ?? 0,
      top: topProducts(list, 5),
      closure: state.closures[day],
    };
  }, [state, now, picked]);

  return (
    <>
      <h1 className="font-display text-3xl font-semibold tracking-tight">Ventas</h1>
      <p className="text-sm text-muted">Lo que se vendió, cómo se pagó y el cierre de caja.</p>

      {/* The day: arrows for the next and the previous one, and the calendar (it opens over the page) to jump to any. */}
      {view ? (
        <div role="group" aria-label="Día" className="mt-5 flex items-center gap-2">
          <button type="button" aria-label="Día anterior" onClick={() => setPicked(view.day - DAY_MS)} className={arrow}>
            ‹
          </button>
          <button
            type="button"
            data-calendar
            aria-haspopup="dialog"
            onClick={() => setCalendarOpen(true)}
            className={`${press} flex min-h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-full bg-paper px-4 text-sm font-semibold ring-1 ring-line`}
          >
            <CalendarIcon width={18} height={18} className="shrink-0 text-brand" />
            <span className="truncate">{dayLabel(view.day, now!)}</span>
          </button>
          <button type="button" aria-label="Día siguiente" disabled={view.day >= view.today} onClick={() => setPicked(view.day + DAY_MS)} className={`${arrow} disabled:opacity-40`}>
            ›
          </button>
        </div>
      ) : null}

      {view ? (
        <>
          <section aria-label="Resumen del día" className="mt-4 grid grid-cols-2 gap-3">
            <div className="col-span-2 rounded-3xl bg-ink p-5 text-cream">
              <p className="text-sm text-cream/70">Vendido</p>
              <p className="mt-1 text-4xl font-semibold tracking-tight tabular-nums">{formatPrice(view.total)}</p>
            </div>
            <Tile label="Ventas" value={String(view.tickets)} />
            <Tile label="Ticket promedio" value={formatPrice(view.average)} />
          </section>

          <section aria-labelledby="methods-title" className="mt-3 rounded-3xl bg-paper p-5 ring-1 ring-line">
            <h2 id="methods-title" className="font-semibold">
              Cómo se pagó
            </h2>
            <ul className="mt-3 space-y-3">
              {view.methods.map((m) => (
                <li key={m.method}>
                  <div className="flex items-baseline justify-between text-sm">
                    <span>
                      {m.method} <span className="text-muted">· {m.count}</span>
                    </span>
                    <span className="font-semibold tabular-nums">{formatPrice(m.total)}</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-blush">
                    <div className="h-2 rounded-full bg-brand" style={{ width: `${view.total ? (m.total / view.total) * 100 : 0}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <CashClosing key={view.day} day={view.day} expected={view.cash} closure={view.closure} />

          {view.top.length > 0 ? (
            <section aria-labelledby="top-title" className="mt-3 rounded-3xl bg-paper p-5 ring-1 ring-line">
              <h2 id="top-title" className="font-semibold">
                Lo más vendido
              </h2>
              <p className="mb-4 text-xs text-muted">Unidades del día</p>
              <RankedBars data={view.top.map((t) => ({ key: t.name, label: t.name, value: t.units }))} format={String} />
            </section>
          ) : null}

          <section aria-labelledby="tickets-title" className="mt-6">
            <h2 id="tickets-title" className="text-sm font-semibold text-muted">
              {view.list.length} {view.list.length === 1 ? "venta" : "ventas"} · la última primero
            </h2>
            {view.list.length === 0 ? <p className="mt-6 text-center text-muted">No hubo ventas este día.</p> : null}
            <ul className="mt-2 space-y-2">
              {(showAll ? view.list : view.list.slice(0, SHOWN)).map((s) => (
                <li key={s.ref}>
                  <SaleCard sale={s} />
                </li>
              ))}
            </ul>
            {!showAll && view.list.length > SHOWN ? (
              <button type="button" onClick={() => setShowAll(true)} className={`${press} mt-3 min-h-11 w-full rounded-full bg-paper text-sm font-semibold ring-1 ring-line`}>
                Mostrar las {view.list.length} ventas
              </button>
            ) : null}
          </section>

          <DateTimeSheet
            open={calendarOpen}
            onOpenChange={setCalendarOpen}
            title="Elegí el día"
            today={view.today}
            value={view.day}
            onConfirm={(d) => {
              setPicked(d);
              setShowAll(false);
            }}
            confirmLabel="Ver este día"
            maxDay={view.today}
            marks={(d) => {
              const total = view.perDay.get(d);
              return total ? { label: thousands(total) } : undefined;
            }}
          />
        </>
      ) : (
        <div className="mt-6 space-y-3" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-3xl bg-paper" />
          ))}
        </div>
      )}
    </>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-paper p-4 ring-1 ring-line">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

/** The drawer's cash against what was counted: the difference, and closing the day with it. */
function CashClosing({ day, expected, closure }: { day: number; expected: number; closure?: { at: number; expectedCash: number; countedCash: number } }) {
  const [text, setText] = useState("");
  const countedCash = Number(text.replace(/\D/g, ""));
  const entered = text.trim() !== "";
  const diff = (closure ? closure.countedCash - closure.expectedCash : countedCash - expected);
  const verdict = diff === 0 ? "Justo: no sobra ni falta nada" : diff > 0 ? `Sobran ${formatPrice(diff)}` : `Faltan ${formatPrice(-diff)}`;

  return (
    <section aria-labelledby="closing-title" className="mt-3 rounded-3xl bg-paper p-5 ring-1 ring-line">
      <h2 id="closing-title" className="font-semibold">
        Cierre de caja
      </h2>
      <div className="mt-3 flex items-baseline justify-between text-sm">
        <span className="text-muted">Efectivo que debería haber</span>
        <span className="font-semibold tabular-nums">{formatPrice(closure ? closure.expectedCash : expected)}</span>
      </div>

      {closure ? (
        <>
          <div className="mt-1 flex items-baseline justify-between text-sm">
            <span className="text-muted">Efectivo contado</span>
            <span className="font-semibold tabular-nums">{formatPrice(closure.countedCash)}</span>
          </div>
          <p className={`mt-3 flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold ${diff === 0 ? "bg-emerald-100 text-emerald-800" : "bg-warn-bg text-warn-ink"}`}>
            <CheckIcon width={16} height={16} className="shrink-0" /> Día cerrado a las {formatTime(closure.at)} hs · {verdict}
          </p>
          <button type="button" onClick={() => salesActions.reopenDay(day)} className={`${press} mt-3 min-h-11 w-full rounded-full bg-paper text-sm font-semibold text-muted ring-1 ring-line`}>
            Reabrir el día
          </button>
        </>
      ) : (
        <>
          <label className="mt-3 block text-sm font-semibold">
            Efectivo contado
            <input
              name="counted"
              inputMode="numeric"
              value={text}
              onChange={(e) => setText(e.target.value)}
              autoComplete="off"
              placeholder="Ej: 85000"
              className="mt-1 block min-h-11 w-full rounded-xl bg-paper px-3 py-2.5 text-base font-normal ring-1 ring-line outline-none focus:ring-2 focus:ring-brand"
            />
          </label>
          {entered ? (
            <p aria-live="polite" className={`mt-3 rounded-2xl px-3 py-2 text-sm font-semibold ${diff === 0 ? "bg-emerald-100 text-emerald-800" : "bg-warn-bg text-warn-ink"}`}>
              {verdict}
            </p>
          ) : null}
          <button
            type="button"
            data-close-day
            disabled={!entered}
            onClick={() => salesActions.closeDay(day, { at: Date.now(), expectedCash: expected, countedCash })}
            className={`${press} mt-3 min-h-12 w-full rounded-full bg-brand px-5 font-semibold text-white hover:bg-brand-ink disabled:opacity-50`}
          >
            Cerrar el día
          </button>
        </>
      )}
    </section>
  );
}

function SaleCard({ sale }: { sale: Sale }) {
  const [asking, setAsking] = useState(false);
  const summary = sale.lines.map((l) => `${l.quantity} × ${l.label}`).join(", ");
  return (
    <article className={`rounded-2xl bg-paper p-3.5 ring-1 ring-line ${sale.voided ? "opacity-60" : ""}`} aria-label={`Venta ${sale.n}, ${formatTime(sale.at)} hs`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <span className="font-semibold tabular-nums">#{sale.n}</span>
            <span className="text-muted tabular-nums">{formatTime(sale.at)} hs</span>
            <span className="rounded-full bg-blush px-2 py-0.5 text-xs font-semibold text-brand-ink">
              {KIND_LABEL[sale.kind]}
              {sale.note ? ` · ${sale.note}` : ""}
            </span>
            {sale.voided ? <span className="rounded-full bg-line px-2 py-0.5 text-xs font-semibold text-muted">Anulada</span> : null}
          </p>
          <p className={`mt-1 text-[15px] leading-snug ${sale.voided ? "line-through" : ""}`}>{summary}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className={`font-semibold tabular-nums ${sale.voided ? "line-through" : ""}`}>{formatPrice(sale.total)}</p>
          <p className="text-xs text-muted">{sale.method}</p>
        </div>
      </div>
      <div className="mt-2 flex justify-end">
        {sale.voided ? (
          <button type="button" onClick={() => salesActions.setVoided(sale.ref, false)} className={`${press} min-h-11 rounded-full px-3 text-sm font-semibold text-muted`}>
            Restaurar
          </button>
        ) : asking ? (
          <span className="flex items-center gap-1">
            <button type="button" onClick={() => { salesActions.setVoided(sale.ref, true); setAsking(false); }} className={`${press} min-h-11 rounded-full bg-warn-bg px-4 text-sm font-semibold text-warn-ink`}>
              Sí, anular
            </button>
            <button type="button" onClick={() => setAsking(false)} className={`${press} min-h-11 rounded-full px-3 text-sm font-semibold text-muted`}>
              No
            </button>
          </span>
        ) : (
          <button type="button" onClick={() => setAsking(true)} className={`${press} min-h-11 rounded-full px-3 text-sm font-semibold text-muted`}>
            Anular
          </button>
        )}
      </div>
    </article>
  );
}
