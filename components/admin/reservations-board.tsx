"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertIcon, CalendarIcon, CheckIcon, WhatsappIcon } from "@/components/icons";
import { DateTimeSheet } from "@/components/ui/date-sheet";
import { capitalize, dayLabel, formatTime, startOfArDay } from "@/lib/admin-dates";
import { formatPickup } from "@/lib/pickup";
import {
  daySlots,
  maxPartySize,
  peakSeats,
  reservationActions,
  seatsLeft,
  totalSeats,
  useReservations,
  type Reservation,
  type ReservationStatus,
} from "@/lib/reservations";
import { REFERENCE, shop, simulatedWhatsapp } from "@/lib/shop";
import { useNow } from "@/lib/use-now";

// The shop's side of the table reservations: the day's reservations, to confirm, modify or cancel after talking to
// the customer on WhatsApp, and to mark who came. Same cards as the orders' (components/admin/orders-board.tsx).

const DAY_MS = 24 * 60 * 60 * 1000;

const choice =
  "min-h-11 rounded-full px-4 text-sm font-semibold ring-1 ring-line transition-[background-color,transform] [touch-action:manipulation] active:scale-[0.97] motion-reduce:active:scale-100";
const stepper =
  "grid size-11 place-items-center rounded-full bg-paper text-xl leading-none ring-1 ring-line [touch-action:manipulation] active:scale-95 motion-reduce:active:scale-100 disabled:opacity-40";

const STATUS_CHIP: Record<ReservationStatus, { label: string; tone: string }> = {
  consulta: { label: "Consulta", tone: "bg-warn-bg text-warn-ink" },
  confirmada: { label: "Confirmada", tone: "bg-emerald-100 text-emerald-700" },
  asistio: { label: "Asistió", tone: "bg-emerald-100 text-emerald-700" },
  noshow: { label: "No vino", tone: "bg-line text-muted" },
  cancelada: { label: "Cancelada", tone: "bg-line text-muted" },
};

const people = (n: number) => `${n} ${n === 1 ? "persona" : "personas"}`;

/** What the shop tells the customer on WhatsApp about their reservation (the chat opens with the text ready). */
function whatsappText(r: Reservation, firstName: string) {
  const detail = [`• ${capitalize(formatPickup(r.at))}`, `• ${people(r.people)}`, r.shopNote ?? ""];
  switch (r.status) {
    case "consulta":
      return [`¡Hola ${firstName}! Sobre tu reserva ${r.ref}${r.modified ? ", te propongo esto" : ""}:`, ...detail, "¿Te sirve?"].filter(Boolean).join("\n");
    case "confirmada":
      return [`¡Hola ${firstName}! Tu reserva ${r.ref} quedó confirmada${r.modified ? " con estos cambios" : ""}:`, ...detail, "¡Te esperamos!"].filter(Boolean).join("\n");
    case "cancelada":
      return `¡Hola ${firstName}! Tuvimos que cancelar tu reserva ${r.ref}. Perdón: escribinos y buscamos otro horario.`;
    default:
      return `¡Hola ${firstName}! Te escribimos de ${shop.name} por tu reserva ${r.ref}.`;
  }
}

/** Reads ?nuevo=REF (the reservation just asked for in the site) and pins it at the top. */
export function ReservationsBoardFromUrl() {
  const ref = useSearchParams().get("nuevo");
  return <ReservationsBoard highlight={ref && REFERENCE.test(ref) ? ref : null} />;
}

export function ReservationsBoard({ highlight }: { highlight: string | null }) {
  const list = useReservations();
  const now = useNow();
  const [picked, setPicked] = useState<number | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const view = useMemo(() => {
    if (!list || now === null) return null;
    const today = startOfArDay(now);
    const day = picked ?? today;
    const fresh = highlight ? (list.find((r) => r.ref === highlight) ?? null) : null;

    const holding = (r: Reservation) => r.status === "consulta" || r.status === "confirmada" || r.status === "asistio";
    const onDay = list.filter((r) => startOfArDay(r.at) === day);
    // What the calendar shows for each day: how many reservations it has, and a dot if one waits for an answer.
    const perDay = new Map<number, { count: number; toConfirm: boolean }>();
    for (const r of list) {
      const key = startOfArDay(r.at);
      const entry = perDay.get(key) ?? { count: 0, toConfirm: false };
      if (holding(r)) entry.count += 1;
      if (r.status === "consulta") entry.toConfirm = true;
      perDay.set(key, entry);
    }
    const active = onDay.filter(holding);

    return {
      today,
      day,
      fresh,
      perDay,
      dayList: onDay.filter((r) => r !== fresh).sort((a, b) => a.at - b.at),
      summary: { reservations: active.length, people: active.reduce((s, r) => s + r.people, 0), peak: peakSeats(day, list) },
      toConfirm: list.filter((r) => r.status === "consulta").length,
    };
  }, [list, now, picked, highlight]);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Reservas</h1>
          <p className="text-sm text-muted">Mesas del salón, para confirmar y llevar el día.</p>
        </div>
        <dl className="flex gap-2 text-sm">
          <Stat label="Por confirmar" value={view?.toConfirm} warn />
          <Stat label="Personas ese día" value={view?.summary.people} />
        </dl>
      </div>

      {view?.fresh ? (
        <section aria-labelledby="fresh-title" className="mt-6">
          <h2 id="fresh-title" className="mb-2 flex items-center gap-2 text-sm font-semibold text-brand-ink">
            <span className="relative flex size-2.5">
              <span className="absolute inset-0 animate-ping rounded-full bg-brand/60 motion-reduce:animate-none" />
              <span className="relative size-2.5 rounded-full bg-brand" />
            </span>
            Recién llegada de la web
          </h2>
          <div className="rounded-3xl ring-2 ring-brand">
            <ReservationCard r={view.fresh} now={now!} list={list!} />
          </div>
        </section>
      ) : null}

      {/* The day: arrows for the next and the previous one, and the calendar (it opens over the page) to jump to any. */}
      {view ? (
        <div role="group" aria-label="Día" className="mt-6 flex items-center gap-2">
          <button
            type="button"
            aria-label="Día anterior"
            onClick={() => setPicked(view.day - DAY_MS)}
            className="grid size-11 shrink-0 place-items-center rounded-full bg-paper text-xl leading-none ring-1 ring-line [touch-action:manipulation] transition-transform active:scale-95 motion-reduce:active:scale-100"
          >
            ‹
          </button>
          <button
            type="button"
            data-calendar
            aria-haspopup="dialog"
            onClick={() => setCalendarOpen(true)}
            className="flex min-h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-full bg-paper px-4 text-sm font-semibold ring-1 ring-line transition-transform [touch-action:manipulation] active:scale-[0.98] motion-reduce:active:scale-100"
          >
            <CalendarIcon width={18} height={18} className="shrink-0 text-brand" />
            <span className="truncate">{dayLabel(view.day, now!)}</span>
          </button>
          <button
            type="button"
            aria-label="Día siguiente"
            onClick={() => setPicked(view.day + DAY_MS)}
            className="grid size-11 shrink-0 place-items-center rounded-full bg-paper text-xl leading-none ring-1 ring-line [touch-action:manipulation] transition-transform active:scale-95 motion-reduce:active:scale-100"
          >
            ›
          </button>
        </div>
      ) : null}

      {view ? (
        <section aria-labelledby="day-title" className="mt-4">
          <h2 id="day-title" className="text-sm font-semibold text-muted">
            {view.summary.reservations} {view.summary.reservations === 1 ? "reserva" : "reservas"} · {people(view.summary.people)}
          </h2>
          {view.summary.reservations > 0 ? (
            <div className="mt-2 rounded-2xl bg-paper p-3 ring-1 ring-line">
              <div className="flex items-baseline justify-between text-sm">
                <span className="text-muted">Momento más ocupado</span>
                <span className="font-semibold tabular-nums">
                  {view.summary.peak} de {totalSeats} lugares
                </span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-blush" role="img" aria-label={`${view.summary.peak} de ${totalSeats} lugares ocupados`}>
                <div className="h-2 rounded-full bg-brand" style={{ width: `${Math.min(100, (view.summary.peak / totalSeats) * 100)}%` }} />
              </div>
            </div>
          ) : null}

          {view.dayList.length === 0 && !view.fresh ? (
            <p className="mt-8 text-center text-muted">No hay reservas este día.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {view.dayList.map((r) => (
                <li key={r.ref}>
                  <ReservationCard r={r} now={now!} list={list!} />
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        <div className="mt-6 space-y-3" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-3xl bg-paper" />
          ))}
        </div>
      )}

      {view ? (
        <DateTimeSheet
          open={calendarOpen}
          onOpenChange={setCalendarOpen}
          title="Elegí el día"
          today={view.today}
          value={view.day}
          onConfirm={setPicked}
          confirmLabel="Ver este día"
          marks={(d) => {
            const entry = view.perDay.get(d);
            return entry && entry.count > 0 ? { label: String(entry.count), dot: entry.toConfirm } : undefined;
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

/** A reservation: confirm it as it is, edit it first (after talking to the customer on WhatsApp) or cancel it. */
function ConsultaActions({ r, onEdit }: { r: Reservation; onEdit: () => void }) {
  return (
    <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
      <button type="button" onClick={() => reservationActions.confirm(r.ref)} className={`${choice} col-span-2 bg-emerald-600 text-white ring-emerald-600 hover:bg-emerald-700 sm:col-span-1`}>
        Confirmar
      </button>
      <button type="button" onClick={onEdit} className={`${choice} bg-paper hover:bg-cream`}>
        Modificar
      </button>
      <button type="button" onClick={() => reservationActions.cancel(r.ref)} className={`${choice} bg-paper text-muted hover:bg-cream`}>
        Cancelar reserva
      </button>
    </div>
  );
}

/** Changes the day and time (a calendar opens over the page, with the seats left at each time) or the party size, and adds a note. */
function Editor({ r, list, now, onDone }: { r: Reservation; list: readonly Reservation[]; now: number; onDone: () => void }) {
  const [at, setAt] = useState(r.at);
  const [size, setSize] = useState(r.people);
  const [note, setNote] = useState(r.shopNote ?? "");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const today = startOfArDay(now);
  const field = "mt-1 block min-h-11 w-full rounded-xl bg-paper px-3 py-2.5 text-base font-normal ring-1 ring-line outline-none focus:ring-2 focus:ring-brand";

  return (
    <form
      aria-label="Modificar la reserva"
      className="mt-3 space-y-4 rounded-2xl bg-cream/70 p-3 ring-1 ring-line"
      onSubmit={(e) => {
        e.preventDefault();
        reservationActions.edit(r.ref, { at, people: size, shopNote: note });
        onDone();
      }}
    >
      <div>
        <p className="text-sm font-semibold">Día y horario</p>
        <button
          type="button"
          data-field="time"
          aria-haspopup="dialog"
          onClick={() => setCalendarOpen(true)}
          className={`${field} flex items-center justify-between gap-2 text-left font-medium [touch-action:manipulation]`}
        >
          <span className="min-w-0 truncate">
            {capitalize(dayLabel(at, now))} · {formatTime(at)} hs
          </span>
          <CalendarIcon width={18} height={18} className="shrink-0 text-brand" />
        </button>
      </div>

      <div>
        <p className="text-sm font-semibold">Personas</p>
        <div className="mt-1 flex items-center gap-3" role="group" aria-label="Cantidad de personas">
          <button type="button" aria-label="Una persona menos" disabled={size <= 1} onClick={() => setSize((n) => Math.max(1, n - 1))} className={stepper}>
            −
          </button>
          <span className="min-w-24 text-center text-lg font-semibold tabular-nums">{people(size)}</span>
          <button type="button" aria-label="Una persona más" disabled={size >= maxPartySize} onClick={() => setSize((n) => Math.min(maxPartySize, n + 1))} className={stepper}>
            +
          </button>
        </div>
      </div>

      <label className="block text-sm font-semibold">
        Nota para el cliente (opcional)
        <input name="note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={140} autoComplete="off" placeholder="Ej: mesa en la ventana, como pediste…" className={field} />
      </label>

      <div className="grid grid-cols-2 gap-2 sm:flex">
        <button type="submit" className={`${choice} bg-brand text-white ring-brand hover:bg-brand-ink`}>
          Guardar cambios
        </button>
        <button type="button" onClick={onDone} className={`${choice} bg-paper text-muted hover:bg-cream`}>
          Descartar
        </button>
      </div>

      <DateTimeSheet
        open={calendarOpen}
        onOpenChange={setCalendarOpen}
        title="Día y horario"
        today={today}
        value={at}
        onConfirm={setAt}
        confirmLabel="Usar este horario"
        minDay={today}
        maxDay={today + 60 * DAY_MS}
        isDayDisabled={(d) => daySlots(d).length === 0}
        marks={(d) => {
          const n = list.filter((x) => x.ref !== r.ref && startOfArDay(x.at) === d && (x.status === "consulta" || x.status === "confirmada")).length;
          return n > 0 ? { label: String(n) } : undefined;
        }}
        slotsFor={(d) =>
          daySlots(d).map((t) => {
            const left = seatsLeft(t, list, r.ref);
            return { at: t, label: formatTime(t), hint: `${left} lug.`, disabled: left < size };
          })
        }
      />
    </form>
  );
}

function ReservationCard({ r, now, list }: { r: Reservation; now: number; list: readonly Reservation[] }) {
  const [editing, setEditing] = useState(false);
  const firstName = r.name.split(" ")[0];
  const chip = STATUS_CHIP[r.status];
  const text = whatsappText(r, firstName);
  const answered = r.status === "confirmada" || r.status === "cancelada";
  const chatLabel = r.status === "consulta" ? `Abrir chat con ${firstName}` : answered ? `Avisar a ${firstName} por WhatsApp` : `Abrir chat con ${firstName}`;
  const whatsapp = `https://wa.me/549${r.phone.replace(/\D/g, "").replace(/^0/, "")}?text=${encodeURIComponent(text)}`;
  const chatClass = "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold ring-1 ring-line transition-colors hover:bg-cream sm:w-auto";
  const closed = r.status === "cancelada" || r.status === "noshow";

  return (
    <article
      className={`rounded-3xl bg-paper p-4 ring-1 ring-line transition-opacity sm:p-5 ${closed ? "opacity-60" : ""}`}
      aria-label={`Reserva de ${r.name}, ${formatTime(r.at)} hs, ${people(r.people)}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-baseline gap-1.5 rounded-xl bg-cream px-2.5 py-1">
            <span className="text-base font-semibold tabular-nums">{formatTime(r.at)}</span>
            <span className="text-xs text-muted">hs</span>
          </span>
          <span className="rounded-xl bg-blush px-2.5 py-1 text-sm font-semibold text-brand-ink">{people(r.people)}</span>
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${chip.tone}`}>{chip.label}</span>
          {r.modified ? <span className="rounded-full bg-blush px-2.5 py-1 text-xs font-semibold text-brand-ink">Modificada</span> : null}
        </div>
        <p className="shrink-0 pt-1.5 text-xs text-muted tabular-nums">{r.ref}</p>
      </div>

      <h3 className="mt-3 text-lg leading-snug font-semibold">{r.name}</h3>
      {r.notes ? <p className="mt-1 text-sm text-muted italic">“{r.notes}”</p> : null}
      {r.requested ? (
        <p className="mt-2 rounded-xl bg-cream px-3 py-2 text-sm text-muted">
          <span className="font-semibold text-ink">Pidió:</span> {formatTime(r.requested.at)} hs · {people(r.requested.people)}
        </p>
      ) : null}
      {r.shopNote ? <p className="mt-2 text-sm text-muted">Nota para el cliente: {r.shopNote}</p> : null}

      {r.status === "consulta" ? (
        editing ? <Editor r={r} list={list} now={now} onDone={() => setEditing(false)} /> : <ConsultaActions r={r} onEdit={() => setEditing(true)} />
      ) : null}

      {r.status === "confirmada" ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => reservationActions.setStatus(r.ref, "asistio")} className={`${choice} bg-emerald-600 text-white ring-emerald-600 hover:bg-emerald-700`}>
            <span className="inline-flex items-center gap-1.5">
              <CheckIcon width={16} height={16} /> Llegó
            </span>
          </button>
          <button type="button" onClick={() => reservationActions.setStatus(r.ref, "noshow")} className={`${choice} bg-paper text-muted hover:bg-cream`}>
            <span className="inline-flex items-center gap-1.5">
              <AlertIcon width={16} height={16} /> No vino
            </span>
          </button>
        </div>
      ) : null}

      {r.phone ? (
        <div className="mt-3">
          {simulatedWhatsapp ? (
            <Link
              href={`/whatsapp?ref=${r.ref}&vista=local`}
              // After answering, the chat opens with the message for this moment already written.
              onClick={() => reservationActions.setDraft(r.ref, r.status === "consulta" ? undefined : text)}
              className={chatClass}
            >
              <WhatsappIcon width={18} height={18} /> {chatLabel}
            </Link>
          ) : (
            <a href={whatsapp} target="_blank" rel="noreferrer" className={chatClass}>
              <WhatsappIcon width={18} height={18} /> {chatLabel}
            </a>
          )}
        </div>
      ) : null}
      <p className="sr-only">{capitalize(dayLabel(r.at, now))}</p>
    </article>
  );
}
