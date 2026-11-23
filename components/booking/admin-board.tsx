"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DateTimeSheet } from "@/components/ui/date-sheet";
import { Segmented } from "@/components/ui/segmented";
import { DAY_MS, dayLabel, formatTime, shortDay, startOfArDay } from "@/lib/admin-dates";
import { classesOn, isActive, MINUTE, saleValue, type Booking, type Status } from "@/lib/booking/availability";
import { bookingActions, useBookings } from "@/lib/booking/store";
import { money, offerOf, staffOf, type Venue } from "@/lib/booking/venues";
import { toAr } from "@/lib/pickup";
import { useNow } from "@/lib/use-now";
import { CalendarIcon, ChevronIcon, ClockIcon, UserIcon } from "./ui";

// The panel's reservations view: one day at a time (arrows, or the calendar with how many bookings each day has) or a
// week at a glance, with a filter by status and the attendance of each booking. A booking just made on the customer's
// page (?nuevo=REF) opens on its day, pinned on top.

const statusChip: Record<Status, { label: string; className: string }> = {
  confirmada: { label: "Confirmada", className: "bg-blush text-brand-ink" },
  asistio: { label: "Vino", className: "bg-emerald-100 text-emerald-800" },
  noshow: { label: "No vino", className: "bg-warn-bg text-warn-ink" },
  cancelada: { label: "Cancelada", className: "bg-paper text-muted line-through ring-1 ring-line" },
};

type Filter = "todas" | Status;
const FILTERS: { value: Filter; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "confirmada", label: "Por venir" },
  { value: "asistio", label: "Vinieron" },
  { value: "noshow", label: "No vinieron" },
  { value: "cancelada", label: "Canceladas" },
];
const VIEWS = [
  { value: "dia", label: "Día" },
  { value: "semana", label: "Semana" },
] as const;

const small =
  "inline-flex min-h-11 flex-1 items-center justify-center rounded-full px-3 text-sm font-semibold [touch-action:manipulation] transition-[background-color,transform] active:scale-95 motion-reduce:active:scale-100";

export function AdminBoard({ venue }: { venue: Venue }) {
  const now = useNow();
  const bookings = useBookings(venue);
  const fresh = useSearchParams().get("nuevo");
  const [picked, setPicked] = useState<number | null>(null);
  const [view, setView] = useState<"dia" | "semana">("dia");
  const [filter, setFilter] = useState<Filter>("todas");
  const [sheet, setSheet] = useState(false);

  const counts = useMemo(() => {
    const map = new Map<number, number>();
    for (const b of bookings ?? []) if (isActive(b)) map.set(startOfArDay(b.start), (map.get(startOfArDay(b.start)) ?? 0) + 1);
    return map;
  }, [bookings]);

  if (now === null || bookings === null) return <p className="px-5 py-10 text-center text-muted">Cargando la agenda…</p>;

  const today = startOfArDay(now);
  const freshBooking = fresh ? bookings.find((b) => b.ref === fresh) : undefined;
  const day = picked ?? (freshBooking ? startOfArDay(freshBooking.start) : today);
  const weekStart = day - ((toAr(day).weekday + 6) % 7) * DAY_MS;
  const step = view === "dia" ? DAY_MS : 7 * DAY_MS;
  const actions = bookingActions(venue);
  const closed = venue.mode === "services" && !venue.open[toAr(day).weekday];
  const mine = bookings.filter((b) => startOfArDay(b.start) === day);
  const shown = filter === "todas" ? mine : mine.filter((b) => b.status === filter);
  const label = view === "dia" ? dayLabel(day, now) : `${shortDay(weekStart)} – ${shortDay(weekStart + 6 * DAY_MS)}`;

  return (
    <main className="mx-auto w-full max-w-md px-4 pt-5 pb-12 lg:grid lg:max-w-6xl lg:grid-cols-[21rem_minmax(0,1fr)] lg:items-start lg:gap-x-10 lg:px-8 lg:pt-8">
      {/* From lg up the controls (view, day, figures, filter) are a sidebar that stays in view; the bookings fill the rest. */}
      <div className="lg:sticky lg:top-20">
      <h1 className="font-display text-3xl font-semibold lg:text-4xl">{venue.mode === "classes" ? "Reservas" : "Agenda"}</h1>

      <Segmented label="Vista" value={view} onChange={setView} options={VIEWS} className="mt-3" />

      <div role="group" aria-label="Día" className="mt-3 flex items-center gap-2">
        <button type="button" aria-label={view === "dia" ? "Día anterior" : "Semana anterior"} onClick={() => setPicked(day - step)} className="grid size-11 shrink-0 place-items-center rounded-full bg-paper ring-1 ring-line [touch-action:manipulation] active:scale-95">
          <ChevronIcon className="rotate-180" />
        </button>
        <button type="button" data-calendar onClick={() => setSheet(true)} className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-paper px-4 font-semibold ring-1 ring-line [touch-action:manipulation] active:scale-[0.98]">
          <CalendarIcon className="text-brand" />
          <span className="first-letter:uppercase">{label}</span>
        </button>
        <button type="button" aria-label={view === "dia" ? "Día siguiente" : "Semana siguiente"} onClick={() => setPicked(day + step)} className="grid size-11 shrink-0 place-items-center rounded-full bg-paper ring-1 ring-line [touch-action:manipulation] active:scale-95">
          <ChevronIcon />
        </button>
      </div>
      {day !== today ? (
        <button type="button" onClick={() => setPicked(today)} className="mt-1 min-h-11 w-full rounded-full text-sm font-semibold text-brand-ink [touch-action:manipulation]">
          Volver a hoy
        </button>
      ) : null}

      <DateTimeSheet
        open={sheet}
        onOpenChange={setSheet}
        title="Elegir día"
        today={today}
        value={day}
        onConfirm={setPicked}
        confirmLabel="Ver este día"
        marks={(d) => ({ label: counts.get(d) ? String(counts.get(d)) : undefined })}
      />

      {view !== "semana" && !closed ? <DayStats venue={venue} day={day} bookings={bookings} mine={mine} /> : null}
      </div>

      <div>
      {view === "semana" ? (
        <WeekView
          venue={venue}
          bookings={bookings}
          weekStart={weekStart}
          today={today}
          open={(d) => {
            setPicked(d);
            setView("dia");
          }}
        />
      ) : closed ? (
        <p className="mt-6 rounded-2xl bg-paper px-4 py-8 text-center text-muted ring-1 ring-line lg:mt-0">El {venue.words.place} está cerrado este día.</p>
      ) : (
        <>
          <div className="mt-4 -mx-4 overflow-x-auto px-4 [scrollbar-width:none] lg:mx-0 lg:mt-0 lg:mb-4 lg:px-0">
            <Segmented label="Estado" value={filter} onChange={setFilter} options={FILTERS} />
          </div>
          {venue.mode === "classes" ? (
            <ClassesDay venue={venue} day={day} bookings={bookings} shown={shown} fresh={freshBooking?.ref} setStatus={actions.setStatus} filtered={filter !== "todas"} />
          ) : (
            <ServicesDay venue={venue} shown={shown} fresh={freshBooking?.ref} setStatus={actions.setStatus} />
          )}
        </>
      )}
      </div>
    </main>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl bg-paper px-3 py-3 ring-1 ring-line">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-0.5 font-sans text-2xl font-semibold tabular-nums">{value}</p>
      {hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

function NewTag() {
  return <span className="rounded-full bg-brand px-2 py-0.5 text-xs font-semibold text-white">Nueva</span>;
}

/** The day's three figures. */
function DayStats({ venue, day, bookings, mine }: { venue: Venue; day: number; bookings: Booking[]; mine: Booking[] }) {
  const active = mine.filter(isActive);
  if (venue.mode === "classes") {
    const free = classesOn(venue, day, bookings).reduce((sum, s) => sum + (s.capacity - s.taken), 0);
    return (
      <div className="mt-4 grid grid-cols-3 gap-2">
        <Stat label="Reservas" value={String(active.length)} />
        <Stat label="Plazas libres" value={String(free)} />
        <Stat label="Cobrado" value={money(venue, active.reduce((sum, b) => sum + b.paid, 0))} />
      </div>
    );
  }
  const open = venue.open[toAr(day).weekday];
  const capacity = open ? (open[1] - open[0]) * venue.staff.length : 0;
  const booked = active.reduce((sum, b) => sum + b.minutes, 0);
  return (
    <div className="mt-4 grid grid-cols-3 gap-2">
      <Stat label={venue.words.appts[0].toUpperCase() + venue.words.appts.slice(1)} value={String(active.length)} />
      <Stat label="Cobrado" value={money(venue, active.reduce((sum, b) => sum + b.paid, 0))} hint={venue.deposit ? "señas online" : "online"} />
      <Stat label="Ocupación" value={capacity ? `${Math.round((booked / capacity) * 100)} %` : "–"} />
    </div>
  );
}

// ---------- The week: one row per day, a tap opens it ----------

function WeekView({ venue, bookings, weekStart, today, open }: { venue: Venue; bookings: Booking[]; weekStart: number; today: number; open: (day: number) => void }) {
  const days = Array.from({ length: 7 }, (_, i) => weekStart + i * DAY_MS);
  return (
    <ul aria-label="Semana" className="mt-4 grid gap-2 lg:mt-0 lg:grid-cols-2 lg:gap-3">
      {days.map((d) => {
        const mine = bookings.filter((b) => startOfArDay(b.start) === d && isActive(b));
        const closed = venue.mode === "services" ? !venue.open[toAr(d).weekday] : classesOn(venue, d, []).length === 0;
        const income = mine.reduce((sum, b) => sum + saleValue(b), 0);
        const detail =
          venue.mode === "classes"
            ? `${classesOn(venue, d, bookings).length} ${classesOn(venue, d, bookings).length === 1 ? "clase" : "clases"} · ${mine.length} ${mine.length === 1 ? "reserva" : "reservas"}`
            : `${mine.length} ${venue.words.appts} · ${Math.round((mine.reduce((sum, b) => sum + b.minutes, 0) / Math.max(1, ((venue.open[toAr(d).weekday]?.[1] ?? 0) - (venue.open[toAr(d).weekday]?.[0] ?? 0)) * venue.staff.length)) * 100)} % ocupado`;
        return (
          <li key={d}>
            <button
              type="button"
              data-week-day={d}
              disabled={closed}
              onClick={() => open(d)}
              className={`flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl bg-paper px-4 py-2.5 text-left ring-1 [touch-action:manipulation] active:scale-[0.99] disabled:opacity-50 ${d === today ? "ring-2 ring-brand" : "ring-line"}`}
            >
              <span className="min-w-0">
                <span className="block font-semibold first-letter:uppercase">{dayLabel(d, today)}</span>
                <span className="block text-sm text-muted">{closed ? "Cerrado" : detail}</span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block font-semibold tabular-nums">{closed ? "–" : money(venue, income)}</span>
                <span className="block text-xs text-muted">{closed ? "" : "ingresos"}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

// ---------- The beauty center: one card per appointment ----------

function ServicesDay({ venue, shown, fresh, setStatus }: { venue: Venue; shown: Booking[]; fresh?: string; setStatus: (id: string, s: Status) => void }) {
  const ordered = [...shown.filter((b) => b.ref === fresh), ...shown.filter((b) => b.ref !== fresh)];
  return (
    <>
      {ordered.length === 0 ? <p className="mt-4 rounded-2xl bg-paper px-4 py-8 text-center text-muted ring-1 ring-line lg:mt-0">No hay {venue.words.appts} con este filtro.</p> : null}
      <ul aria-label="Citas" className="mt-4 grid gap-3 lg:mt-0 lg:grid-cols-2 lg:items-start">
        {ordered.map((b) => {
          const offer = offerOf(venue, b.offer);
          const chip = statusChip[b.status];
          return (
            <li key={b.id} data-booking={b.ref} className={`rounded-2xl bg-paper p-4 ring-1 ${b.ref === fresh ? "ring-2 ring-brand" : "ring-line"} ${b.status === "cancelada" ? "opacity-60" : ""}`}>
              <div className="flex items-center justify-between gap-2">
                <p className="inline-flex items-center gap-1.5 font-semibold tabular-nums">
                  <ClockIcon className="size-4 text-brand" /> {formatTime(b.start)}–{formatTime(b.start + b.minutes * MINUTE)}
                </p>
                <span className="flex items-center gap-1.5">
                  {b.ref === fresh ? <NewTag /> : null}
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${chip.className}`}>{chip.label}</span>
                </span>
              </div>
              <p className="mt-2 font-display text-xl leading-tight font-semibold">{offer?.name}</p>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-sm text-muted">
                <span className="inline-flex items-center gap-1">
                  <UserIcon className="size-4" /> {b.name}
                </span>
                {venue.solo ? null : <span>con {staffOf(venue, b.staff)?.name}</span>}
                {b.modality ? <span className="rounded-full bg-cream px-2 py-0.5 text-xs font-semibold ring-1 ring-line">{b.modality === "online" ? "Online" : "Presencial"}</span> : null}
              </p>
              <p className="mt-2 text-sm">
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-medium text-emerald-800">{venue.deposit ? "Seña" : "Pagada"} {money(venue, b.paid)}</span>
                {b.price > b.paid ? <span className="ml-2 text-muted">Resta {money(venue, b.price - b.paid)} en el {venue.words.place}</span> : null}
              </p>
              {b.notes ? <p className="mt-2 rounded-xl bg-cream px-3 py-2 text-sm">“{b.notes}”</p> : null}
              <div className="mt-3 flex gap-2">
                {b.status === "confirmada" ? (
                  <>
                    <button type="button" onClick={() => setStatus(b.id, "asistio")} className={`${small} bg-brand text-white`}>
                      Llegó
                    </button>
                    <button type="button" onClick={() => setStatus(b.id, "noshow")} className={`${small} bg-paper ring-1 ring-line`}>
                      No vino
                    </button>
                    <button type="button" onClick={() => setStatus(b.id, "cancelada")} className={`${small} bg-paper ring-1 ring-line`}>
                      Cancelar
                    </button>
                  </>
                ) : (
                  <button type="button" onClick={() => setStatus(b.id, "confirmada")} className={`${small} bg-paper ring-1 ring-line`}>
                    Deshacer
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}

// ---------- The studio: one card per class, with who is coming ----------

function ClassesDay({ venue, day, bookings, shown, fresh, setStatus, filtered }: { venue: Venue; day: number; bookings: Booking[]; shown: Booking[]; fresh?: string; setStatus: (id: string, s: Status) => void; filtered: boolean }) {
  const sessions = classesOn(venue, day, bookings);
  const hasFresh = (s: (typeof sessions)[number]) => shown.some((b) => b.ref === fresh && b.offer === s.offer.id && b.start === s.start);
  const ordered = [...sessions.filter(hasFresh), ...sessions.filter((s) => !hasFresh(s))];
  const visible = filtered ? ordered.filter((s) => shown.some((b) => b.offer === s.offer.id && b.start === s.start)) : ordered;

  return (
    <>
      {visible.length === 0 ? <p className="mt-4 rounded-2xl bg-paper px-4 py-8 text-center text-muted ring-1 ring-line lg:mt-0">No hay clases ni reservas con este filtro.</p> : null}
      <ul aria-label="Clases" className="mt-4 grid gap-3 lg:mt-0 lg:grid-cols-2 lg:items-start">
        {visible.map((s) => (
          <SessionCard key={s.key} venue={venue} session={s} attendees={shown.filter((b) => b.offer === s.offer.id && b.start === s.start && (filtered || isActive(b)))} fresh={fresh} setStatus={setStatus} />
        ))}
      </ul>
    </>
  );
}

function SessionCard({ venue, session, attendees, fresh, setStatus }: { venue: Venue; session: ReturnType<typeof classesOn>[number]; attendees: Booking[]; fresh?: string; setStatus: (id: string, s: Status) => void }) {
  const [all, setAll] = useState(false);
  const sorted = [...attendees].sort((a, b) => Number(b.ref === fresh) - Number(a.ref === fresh) || a.name.localeCompare(b.name, "es"));
  const shown = all ? sorted : sorted.slice(0, 4);
  const left = session.capacity - session.taken;
  const pct = Math.min(100, Math.round((session.taken / session.capacity) * 100));
  return (
    <li data-session={session.offer.id} className="rounded-2xl bg-paper p-4 ring-1 ring-line">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-xl leading-tight font-semibold">{session.offer.name}</p>
          <p className="mt-0.5 text-sm text-muted">
            {session.offer.minutes} min · con {staffOf(venue, session.staff)?.name}
          </p>
        </div>
        <p className="shrink-0 rounded-xl bg-blush px-2.5 py-1 text-lg font-semibold text-brand-ink tabular-nums">{formatTime(session.start)}</p>
      </div>
      <div className="mt-3" role="img" aria-label={`${session.taken} de ${session.capacity} plazas`}>
        <div className="h-2 overflow-hidden rounded-full bg-cream ring-1 ring-line">
          <div className={`h-full rounded-full ${left <= 0 ? "bg-brand-ink" : "bg-brand"}`} style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-1 text-sm tabular-nums">
          <b>
            {session.taken}/{session.capacity}
          </b>{" "}
          <span className="text-muted">{left <= 0 ? "· completa" : left === 1 ? "· queda 1 plaza" : `· quedan ${left} plazas`}</span>
        </p>
      </div>
      {attendees.length > 0 ? (
        <ul aria-label={`Reservas de ${session.offer.name}`} className="mt-3 divide-y divide-line border-t border-line">
          {shown.map((b) => {
            const chip = statusChip[b.status];
            return (
              <li key={b.id} data-booking={b.ref} className={`py-2.5 ${b.ref === fresh ? "-mx-2 rounded-xl bg-blush px-2" : ""}`}>
                <div className="flex items-center justify-between gap-2">
                  <p className="min-w-0 truncate font-medium">{b.name}</p>
                  <span className="flex shrink-0 items-center gap-1.5">
                    {b.ref === fresh ? <NewTag /> : null}
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${chip.className}`}>{chip.label}</span>
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between gap-2 text-sm text-muted">
                  <span>
                    {b.phone} · pagada {money(venue, b.paid)}
                  </span>
                  {b.status === "confirmada" ? (
                    <span className="flex gap-1">
                      <button type="button" aria-label={`${b.name} vino`} onClick={() => setStatus(b.id, "asistio")} className="grid size-11 place-items-center rounded-full text-emerald-700 [touch-action:manipulation] active:bg-emerald-100">
                        ✓
                      </button>
                      <button type="button" aria-label={`${b.name} no vino`} onClick={() => setStatus(b.id, "noshow")} className="grid size-11 place-items-center rounded-full text-warn-ink [touch-action:manipulation] active:bg-warn-bg">
                        ✕
                      </button>
                    </span>
                  ) : (
                    <button type="button" onClick={() => setStatus(b.id, "confirmada")} className="min-h-11 px-2 text-sm font-semibold text-brand-ink [touch-action:manipulation]">
                      Deshacer
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
      {sorted.length > 4 ? (
        <button type="button" onClick={() => setAll((v) => !v)} className="mt-1 min-h-11 w-full rounded-full text-sm font-semibold text-brand-ink [touch-action:manipulation]">
          {all ? "Ver menos" : `Ver las ${sorted.length} reservas`}
        </button>
      ) : null}
    </li>
  );
}
