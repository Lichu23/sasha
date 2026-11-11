"use client";

import { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, m } from "motion/react";
import { Checkbox } from "@base-ui/react/checkbox";
import { Input } from "@base-ui/react/input";
import { AlertIcon, CalendarIcon, CheckIcon, PinIcon, WhatsappIcon } from "@/components/icons";
import { DateTimeSheet } from "@/components/ui/date-sheet";
import { Segmented } from "@/components/ui/segmented";
import { capitalize, dayLabel, formatTime, startOfArDay } from "@/lib/admin-dates";
import { formatPrice } from "@/lib/menu";
import { orderActions, useOrders, type Order } from "@/lib/orders";
import { useNow } from "@/lib/use-now";
import { formatPickup, fromAr, pickupHours, toAr } from "@/lib/pickup";
import { REFERENCE, isConsulta, noun, paysOnline, shop, simulatedWhatsapp } from "@/lib/shop";

type Filter = "pendiente" | "consulta" | "confirmado" | "completado" | "todos";

// Shops that take consultas start with the ones waiting for an answer.
const FILTERS: readonly { value: Filter; label: string }[] = isConsulta
  ? [
      { value: "consulta", label: "Consultas" },
      { value: "confirmado", label: "Por entregar" },
      { value: "completado", label: "Entregados" },
      { value: "todos", label: "Todos" },
    ]
  : [
      { value: "pendiente", label: "Por entregar" },
      { value: "completado", label: "Entregados" },
      { value: "todos", label: "Todos" },
    ];

const inFilter = (o: Order, filter: Filter) => filter === "todos" || o.status === filter;
const isUpcoming = (filter: Filter) => filter === "pendiente" || filter === "consulta" || filter === "confirmado";

const MAX_DELIVERED = 40;

/** Reads ?nuevo=REF (the order just placed in the store) and pins it at the top. */
export function OrdersBoardFromUrl() {
  const ref = useSearchParams().get("nuevo");
  return <OrdersBoard highlight={ref && REFERENCE.test(ref) ? ref : null} />;
}

export function OrdersBoard({ highlight }: { highlight: string | null }) {
  const orders = useOrders();
  const now = useNow();
  const [filter, setFilter] = useState<Filter>(FILTERS[0].value);
  const [query, setQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<number | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const search = useDeferredValue(query.trim().toLowerCase());

  const view = useMemo(() => {
    if (!orders || now === null) return null;
    const today = startOfArDay(now);
    const fresh = highlight ? orders.find((o) => o.ref === highlight) ?? null : null;

    const matches = (o: Order) =>
      !search ||
      o.name.toLowerCase().includes(search) ||
      o.ref.toLowerCase().includes(search) ||
      o.location?.toLowerCase().includes(search) ||
      o.items.some((i) => i.label.toLowerCase().includes(search));

    const list = orders
      .filter((o) => o !== fresh && inFilter(o, filter) && matches(o) && (dateFilter === null || startOfArDay(o.pickup) === dateFilter))
      .sort((a, b) => (isUpcoming(filter) ? a.pickup - b.pickup : b.pickup - a.pickup))
      .slice(0, isUpcoming(filter) ? undefined : MAX_DELIVERED);

    const groups = new Map<number, Order[]>();
    for (const o of list) {
      const day = startOfArDay(o.pickup);
      groups.set(day, [...(groups.get(day) ?? []), o]);
    }

    // What the calendar shows on each pickup day: how many orders are still on.
    const perDay = new Map<number, number>();
    for (const o of orders) if (o.status !== "cancelado") perDay.set(startOfArDay(o.pickup), (perDay.get(startOfArDay(o.pickup)) ?? 0) + 1);

    const pending = orders.filter((o) => o.status === (isConsulta ? "confirmado" : "pendiente"));
    return {
      today,
      perDay,
      fresh,
      groups: [...groups.entries()],
      stats: {
        today: pending.filter((o) => startOfArDay(o.pickup) === today).length,
        pending: pending.length,
        unpaid: pending.filter((o) => o.payment === "pendiente").length,
        consultas: orders.filter((o) => o.status === "consulta").length,
      },
    };
  }, [orders, now, filter, search, highlight, dateFilter]);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Pedidos</h1>
          <p className="text-sm text-muted">{shop.orders.title} para retirar en el local.</p>
        </div>
        <dl className="flex gap-2 text-sm">
          {isConsulta ? <Stat label="Consultas" value={view?.stats.consultas} warn /> : null}
          <Stat label="Para hoy" value={view?.stats.today} />
          <Stat label="Por entregar" value={view?.stats.pending} />
          {/* Online payments that haven't cleared need attention; paying on pickup is the norm. */}
          {isConsulta ? null : <Stat label={paysOnline ? "Pago pendiente" : "A cobrar"} value={view?.stats.unpaid} warn={paysOnline} />}
        </dl>
      </div>

      {view?.fresh ? (
        <section aria-labelledby="fresh-title" className="mt-6">
          <h2 id="fresh-title" className="mb-2 flex items-center gap-2 text-sm font-semibold text-brand-ink">
            <span className="relative flex size-2.5">
              <span className="absolute inset-0 animate-ping rounded-full bg-brand/60 motion-reduce:animate-none" />
              <span className="relative size-2.5 rounded-full bg-brand" />
            </span>
            Recién llegado de la tienda
          </h2>
          <div className="rounded-3xl ring-2 ring-brand">
            <OrderCard order={view.fresh} now={now!} />
          </div>
        </section>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Segmented label="Mostrar" value={filter} onChange={setFilter} options={FILTERS} />
        {/* The pickup date: the calendar opens over the page, with how many orders each day has. */}
        <button
          type="button"
          data-calendar
          aria-haspopup="dialog"
          onClick={() => setCalendarOpen(true)}
          className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold ring-1 transition-transform [touch-action:manipulation] active:scale-[0.97] motion-reduce:active:scale-100 ${
            dateFilter === null ? "bg-paper ring-line" : "bg-ink text-cream ring-ink"
          }`}
        >
          <CalendarIcon width={18} height={18} />
          {dateFilter === null || now === null ? "Todas las fechas" : capitalize(dayLabel(dateFilter, now))}
        </button>
        <label className="min-w-48 flex-1 sm:max-w-xs">
          <span className="sr-only">Buscar pedidos</span>
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Buscar por nombre, ${noun.one} o número…`}
            className="w-full rounded-full bg-paper px-4 py-2 text-base ring-1 ring-line outline-none focus:ring-2 focus:ring-brand sm:text-sm"
          />
        </label>
      </div>

      {view === null ? (
        <div className="mt-6 space-y-3" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-3xl bg-paper" />
          ))}
        </div>
      ) : view.groups.length === 0 ? (
        <p className="mt-10 text-center text-muted">
          {search ? "No hay pedidos que coincidan con la búsqueda." : "No hay pedidos en esta lista."}
        </p>
      ) : (
        <div className="mt-6 space-y-8">
          {view.groups.map(([day, list]) => (
            <section key={day} aria-label={dayLabel(day, now!)}>
              <h2 className="mb-2 text-sm font-semibold text-muted">
                {dayLabel(day, now!)} · {list.length} {list.length === 1 ? "pedido" : "pedidos"}
              </h2>
              <ul className="space-y-3">
                <AnimatePresence initial={false}>
                  {list.map((order) => (
                    <m.li
                      key={order.ref}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 40, transition: { duration: 0.25 } }}
                    >
                      <OrderCard order={order} now={now!} />
                    </m.li>
                  ))}
                </AnimatePresence>
              </ul>
            </section>
          ))}
        </div>
      )}

      {view ? (
        <DateTimeSheet
          open={calendarOpen}
          onOpenChange={setCalendarOpen}
          title="Fecha de retiro"
          today={view.today}
          value={dateFilter}
          onConfirm={setDateFilter}
          onClear={() => setDateFilter(null)}
          confirmLabel="Ver esta fecha"
          marks={(d) => {
            const n = view.perDay.get(d);
            return n ? { label: String(n) } : undefined;
          }}
        />
      ) : null}
    </>
  );
}

function Stat({ label, value, warn }: { label: string; value?: number; warn?: boolean }) {
  return (
    <div className={`rounded-2xl px-3 py-2 ring-1 ${warn && value ? "bg-warn-bg ring-warn-ink/20" : "bg-paper ring-line"}`}>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="text-lg font-semibold">{value ?? "–"}</dd>
    </div>
  );
}

// What the shop tells the customer on WhatsApp about their order (it opens the chat with the text ready).
function whatsappText(order: Order, firstName: string) {
  if (isConsulta) {
    const summary = [
      ...order.items.map((i) => `• ${i.quantity} × ${i.label}`),
      `Total: ${formatPrice(order.total)}`,
      `Retiro: ${formatPickup(order.pickup)}`,
      order.shopNote ?? "",
    ];
    switch (order.status) {
      case "consulta":
        return [`¡Hola ${firstName}! Sobre tu consulta ${order.ref}${order.modified ? ", te propongo esto" : ""}:`, ...summary, "¿Te sirve?"].filter(Boolean).join("\n");
      case "confirmado":
        return [`¡Hola ${firstName}! Tu pedido ${order.ref} quedó confirmado${order.modified ? " con estos cambios" : ""}:`, ...summary, "Pagás al retirar. ¡Gracias!"].filter(Boolean).join("\n");
      case "cancelado":
        return `¡Hola ${firstName}! Tuvimos que cancelar tu pedido ${order.ref}. Perdón: escribinos y lo resolvemos.`;
    }
  }
  return `¡Hola ${firstName}! Te escribimos de ${shop.name} por tu pedido ${order.ref}.`;
}

const STATUS_CHIP: Partial<Record<Order["status"], { label: string; tone: string }>> = {
  consulta: { label: "Consulta", tone: "bg-warn-bg text-warn-ink" },
  confirmado: { label: "Confirmado", tone: "bg-emerald-100 text-emerald-700" },
  cancelado: { label: "Cancelado", tone: "bg-line text-muted" },
};

const HOUR_MS = 60 * 60 * 1000;
const choice =
  "min-h-11 rounded-full px-4 text-sm font-semibold ring-1 ring-line transition-[background-color,transform] [touch-action:manipulation] active:scale-[0.97] motion-reduce:active:scale-100";
const stepper =
  "grid size-11 place-items-center rounded-full bg-paper text-xl leading-none ring-1 ring-line [touch-action:manipulation] active:scale-95 motion-reduce:active:scale-100 disabled:opacity-40";

/** A consulta: confirm it as it is, edit it first (after talking to the customer on WhatsApp) or cancel it. */
function ConsultaActions({ order, now }: { order: Order; now: number }) {
  const [editing, setEditing] = useState(false);
  if (editing) return <Editor order={order} now={now} onDone={() => setEditing(false)} />;
  return (
    // Phone: Confirmar across the whole width, the other two below it. Wider screens: one row.
    <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
      <button type="button" onClick={() => orderActions.confirm(order.ref)} className={`${choice} col-span-2 bg-emerald-600 text-white ring-emerald-600 hover:bg-emerald-700 sm:col-span-1`}>
        Confirmar
      </button>
      <button type="button" onClick={() => setEditing(true)} className={`${choice} bg-paper hover:bg-cream`}>
        Modificar
      </button>
      <button type="button" onClick={() => orderActions.cancel(order.ref)} className={`${choice} bg-paper text-muted hover:bg-cream`}>
        Cancelar pedido
      </button>
    </div>
  );
}

/** Changes what the customer asked for: quantities (0 removes a product), pickup time and a note. The total follows. */
function Editor({ order, now, onDone }: { order: Order; now: number; onDone: () => void }) {
  const [items, setItems] = useState(order.items);
  const [pickup, setPickup] = useState(order.pickup);
  const [note, setNote] = useState(order.shopNote ?? "");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const today = startOfArDay(now);
  const total = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const setQuantity = (index: number, quantity: number) =>
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, quantity: Math.max(0, Math.min(20, quantity)) } : item)));
  const field =
    "mt-1 block min-h-11 w-full rounded-xl bg-paper px-3 py-2.5 text-base font-normal ring-1 ring-line outline-none focus:ring-2 focus:ring-brand";

  return (
    <form
      aria-label="Modificar el pedido"
      className="mt-3 space-y-4 rounded-2xl bg-cream/70 p-3 ring-1 ring-line"
      onSubmit={(e) => {
        e.preventDefault();
        orderActions.edit(order.ref, { items, pickup, shopNote: note });
        onDone();
      }}
    >
      <fieldset>
        <legend className="text-sm font-semibold">Productos</legend>
        <ul className="mt-2 divide-y divide-line">
          {items.map((item, i) => (
            <li key={`${item.productId}-${item.sizeId}`} className="flex items-center gap-3 py-2 first:pt-0 last:pb-0">
              <span className={`min-w-0 flex-1 text-[15px] leading-snug ${item.quantity === 0 ? "text-muted line-through" : ""}`}>{item.label}</span>
              <div className="flex shrink-0 items-center gap-1" role="group" aria-label={`Cantidad de ${item.label}`}>
                <button type="button" aria-label="Restar uno" disabled={item.quantity === 0} onClick={() => setQuantity(i, item.quantity - 1)} className={stepper}>
                  −
                </button>
                <span className="w-7 text-center text-base font-semibold tabular-nums">{item.quantity}</span>
                <button type="button" aria-label="Sumar uno" onClick={() => setQuantity(i, item.quantity + 1)} className={stepper}>
                  +
                </button>
              </div>
            </li>
          ))}
        </ul>
      </fieldset>

      <div>
        <p className="text-sm font-semibold">Retiro</p>
        <button
          type="button"
          data-field="pickup"
          aria-haspopup="dialog"
          onClick={() => setCalendarOpen(true)}
          className={`${field} flex items-center justify-between gap-2 text-left font-medium [touch-action:manipulation]`}
        >
          <span className="min-w-0 truncate">
            {capitalize(dayLabel(pickup, now))} · {formatTime(pickup)} hs
          </span>
          <CalendarIcon width={18} height={18} className="shrink-0 text-brand" />
        </button>
      </div>

      <label className="block text-sm font-semibold">
        Nota para el cliente (opcional)
        <input name="note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={140} autoComplete="off" placeholder="Ej: sin semillas, como pediste…" className={field} />
      </label>

      <div className="flex items-baseline justify-between border-t border-line pt-3">
        <span className="text-sm text-muted">Nuevo total</span>
        <span className="text-xl font-semibold tabular-nums">{formatPrice(total)}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:flex">
        <button type="submit" disabled={items.every((i) => i.quantity === 0)} className={`${choice} bg-brand text-white ring-brand hover:bg-brand-ink disabled:opacity-50`}>
          Guardar cambios
        </button>
        <button type="button" onClick={onDone} className={`${choice} bg-paper text-muted hover:bg-cream`}>
          Descartar
        </button>
      </div>

      <DateTimeSheet
        open={calendarOpen}
        onOpenChange={setCalendarOpen}
        title="Día y horario de retiro"
        today={today}
        value={pickup}
        onConfirm={setPickup}
        confirmLabel="Usar este horario"
        minDay={today}
        maxDay={today + 60 * 24 * HOUR_MS}
        isDayDisabled={(d) => pickupHours(toAr(d).weekday).length === 0}
        slotsFor={(d) => {
          const t = toAr(d);
          return pickupHours(t.weekday).map((hour) => ({ at: fromAr(t.year, t.month, t.date, hour), label: `${hour}:00` }));
        }}
      />
    </form>
  );
}

function OrderCard({ order, now }: { order: Order; now: number }) {
  const done = order.status === "completado";
  const isNew = !order.sample || now - order.createdAt < 24 * 60 * 60 * 1000;
  const firstName = order.name.split(" ")[0];
  const chip = isConsulta ? STATUS_CHIP[order.status] : undefined;
  // Consultas: the chat with the customer is one tap away, with the message for this moment ready.
  const chatLabel = !isConsulta ? order.phone : order.status === "consulta" ? `Abrir chat con ${firstName}` : `Avisar a ${firstName} por WhatsApp`;
  const text = whatsappText(order, firstName);
  const whatsapp = `https://wa.me/549${order.phone.replace(/\D/g, "").replace(/^0/, "")}?text=${encodeURIComponent(text)}`;
  const chatClass =
    "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold ring-1 ring-line transition-colors hover:bg-cream sm:w-auto";
  const canDeliver = !isConsulta || order.status === "confirmado" || done;

  return (
    <article
      className={`rounded-3xl bg-paper p-4 ring-1 ring-line transition-opacity sm:p-5 ${done || order.status === "cancelado" ? "opacity-60" : ""}`}
      aria-label={`Pedido de ${order.name}, retiro ${formatTime(order.pickup)} hs`}
    >
      {/* When, and where the order stands */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-baseline gap-1.5 rounded-xl bg-cream px-2.5 py-1">
            <span className="text-base font-semibold tabular-nums">{formatTime(order.pickup)}</span>
            <span className="text-xs text-muted">retiro</span>
          </span>
          {chip ? <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${chip.tone}`}>{chip.label}</span> : null}
          {order.modified ? <span className="rounded-full bg-blush px-2.5 py-1 text-xs font-semibold text-brand-ink">Modificado</span> : null}
          {isNew && !done && !chip ? <span className="rounded-full bg-blush px-2.5 py-1 text-xs font-semibold text-brand-ink">Nuevo</span> : null}
        </div>
        <p className="shrink-0 pt-1.5 text-xs text-muted tabular-nums">{order.ref}</p>
      </div>

      {/* Who and what */}
      <h3 className="mt-3 text-lg leading-snug font-semibold">{order.name}</h3>
      <ul className="mt-1.5 space-y-0.5 text-[15px] leading-snug">
        {order.items.map((item) => (
          <li key={`${item.productId}-${item.sizeId}`}>
            <span className="font-semibold tabular-nums">{item.quantity} ×</span> {item.label}
          </li>
        ))}
      </ul>
      {order.location ? (
        <p className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-brand-ink">
          <PinIcon width={14} height={14} /> Retira en {order.location}
        </p>
      ) : null}
      {order.notes ? <p className="mt-2 text-sm text-muted italic">“{order.notes}”</p> : null}
      {order.requested ? (
        <p className="mt-2 rounded-xl bg-cream px-3 py-2 text-sm text-muted">
          <span className="font-semibold text-ink">Pidió:</span> {order.requested.items.map((i) => `${i.quantity} × ${i.label}`).join(", ")} · {formatPickup(order.requested.pickup)}
        </p>
      ) : null}
      {order.shopNote ? <p className="mt-2 text-sm text-muted">Nota para el cliente: {order.shopNote}</p> : null}

      {/* How much */}
      <div className="mt-3 flex items-end justify-between gap-3 border-t border-line pt-3">
        <div>
          <p className="text-xs text-muted">Total</p>
          <p className="text-xl leading-tight font-semibold tabular-nums">{formatPrice(order.total)}</p>
        </div>
        {order.payment === "pagado" ? (
          <p className="inline-flex items-center gap-1 pb-0.5 text-sm text-emerald-700">
            <CheckIcon width={16} height={16} /> Pagado
          </p>
        ) : paysOnline ? (
          <p className="inline-flex items-center gap-1 pb-0.5 text-sm text-warn-ink">
            <AlertIcon width={16} height={16} /> Pago pendiente
          </p>
        ) : (
          <p className="pb-0.5 text-sm text-muted">Paga al retirar</p>
        )}
      </div>

      {isConsulta && order.status === "consulta" ? <ConsultaActions order={order} now={now} /> : null}

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {order.phone ? (
          simulatedWhatsapp ? (
            <Link
              href={`/whatsapp?ref=${order.ref}&vista=local`}
              // After answering, the chat opens with the message for this moment already written.
              onClick={() => orderActions.setDraft(order.ref, order.status === "consulta" ? undefined : text)}
              className={chatClass}
            >
              <WhatsappIcon width={18} height={18} /> {chatLabel}
            </Link>
          ) : (
            <a href={whatsapp} target="_blank" rel="noreferrer" className={chatClass}>
              <WhatsappIcon width={18} height={18} /> {chatLabel}
            </a>
          )
        ) : (
          <span />
        )}
        {canDeliver ? (
          <label className="inline-flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-full py-1 pr-1 pl-4 text-sm font-semibold select-none sm:justify-end">
            {done ? "Entregado" : "Marcar entregado"}
            <Checkbox.Root
              checked={done}
              onCheckedChange={(checked) => orderActions.setStatus(order.ref, checked ? "completado" : isConsulta ? "confirmado" : "pendiente")}
              className="grid size-9 place-items-center rounded-full bg-paper ring-2 ring-line transition-colors outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand data-checked:bg-emerald-600 data-checked:text-white data-checked:ring-emerald-600"
            >
              <Checkbox.Indicator>
                <CheckIcon width={18} height={18} />
              </Checkbox.Indicator>
            </Checkbox.Root>
          </label>
        ) : null}
      </div>
      <p className="sr-only">{capitalize(dayLabel(order.pickup, now))}</p>
    </article>
  );
}
