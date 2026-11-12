"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DateTimeSheet } from "@/components/ui/date-sheet";
import { dayLabel, formatTime, startOfArDay, DAY_MS } from "@/lib/admin-dates";
import { classesOn, isActive, MINUTE, type Booking, type ClassSession, type Status } from "@/lib/booking/availability";
import { bookingActions, useBookings } from "@/lib/booking/store";
import { euros, offerOf, staffOf, type Venue } from "@/lib/booking/venues";
import { toAr } from "@/lib/pickup";
import { useNow } from "@/lib/use-now";
import { CalendarIcon, ChevronIcon, ClockIcon, UserIcon } from "./ui";

// The panel of a booking demo: one day at a time (arrows, or the calendar with how many bookings each day has), the
// day's figures and its bookings. A booking just made on the customer's page (?nuevo=REF) opens on its day, pinned on top.

const statusChip: Record<Status, { label: string; className: string }> = {
  confirmada: { label: "Confirmada", className: "bg-blush text-brand-ink" },
  asistio: { label: "Vino", className: "bg-emerald-100 text-emerald-800" },
  noshow: { label: "No vino", className: "bg-warn-bg text-warn-ink" },
  cancelada: { label: "Cancelada", className: "bg-paper text-muted line-through ring-1 ring-line" },
};

const small =
  "inline-flex min-h-11 flex-1 items-center justify-center rounded-full px-3 text-sm font-semibold [touch-action:manipulation] transition-[background-color,transform] active:scale-95 motion-reduce:active:scale-100";

export function AdminBoard({ venue }: { venue: Venue }) {
  const now = useNow();
  const bookings = useBookings(venue);
  const fresh = useSearchParams().get("nuevo");
  const [picked, setPicked] = useState<number | null>(null);
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
  const mine = bookings.filter((b) => startOfArDay(b.start) === day);
  const actions = bookingActions(venue);
  const closed = venue.mode === "services" && !venue.open[toAr(day).weekday];

  return (
    <main className="mx-auto w-full max-w-md px-4 pt-5 pb-12">
      <h1 className="font-display text-3xl font-semibold">{venue.mode === "classes" ? "Clases y reservas" : "Agenda"}</h1>

      <div role="group" aria-label="Día" className="mt-4 flex items-center gap-2">
        <button type="button" aria-label="Día anterior" onClick={() => setPicked(day - DAY_MS)} className="grid size-11 shrink-0 place-items-center rounded-full bg-paper ring-1 ring-line [touch-action:manipulation] active:scale-95">
          <ChevronIcon className="rotate-180" />
        </button>
        <button type="button" data-calendar onClick={() => setSheet(true)} className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-paper px-4 font-semibold ring-1 ring-line [touch-action:manipulation] active:scale-[0.98]">
          <CalendarIcon className="text-brand" />
          <span className="first-letter:uppercase">{dayLabel(day, now)}</span>
        </button>
        <button type="button" aria-label="Día siguiente" onClick={() => setPicked(day + DAY_MS)} className="grid size-11 shrink-0 place-items-center rounded-full bg-paper ring-1 ring-line [touch-action:manipulation] active:scale-95">
          <ChevronIcon />
        </button>
      </div>

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

      {closed ? (
        <p className="mt-6 rounded-2xl bg-paper px-4 py-8 text-center text-muted ring-1 ring-line">El centro está cerrado este día.</p>
      ) : venue.mode === "classes" ? (
        <ClassesDay venue={venue} day={day} bookings={bookings} mine={mine} fresh={freshBooking?.ref} now={now} setStatus={actions.setStatus} />
      ) : (
        <ServicesDay venue={venue} day={day} mine={mine} fresh={freshBooking?.ref} now={now} setStatus={actions.setStatus} />
      )}
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

// ---------- The beauty center: one card per appointment ----------

function ServicesDay({ venue, day, mine, fresh, now, setStatus }: { venue: Venue; day: number; mine: Booking[]; fresh?: string; now: number; setStatus: (id: string, s: Status) => void }) {
  const active = mine.filter(isActive);
  const open = venue.open[toAr(day).weekday];
  const capacity = open ? (open[1] - open[0]) * venue.staff.length : 0;
  const booked = active.reduce((sum, b) => sum + b.minutes, 0);
  const deposits = active.reduce((sum, b) => sum + b.paid, 0);
  const ordered = [...mine.filter((b) => b.ref === fresh), ...mine.filter((b) => b.ref !== fresh)];

  return (
    <>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <Stat label="Citas" value={String(active.length)} />
        <Stat label="Señales" value={euros(deposits)} hint="cobradas" />
        <Stat label="Ocupación" value={capacity ? `${Math.round((booked / capacity) * 100)} %` : "–"} />
      </div>

      {ordered.length === 0 ? <p className="mt-6 rounded-2xl bg-paper px-4 py-8 text-center text-muted ring-1 ring-line">No hay citas este día.</p> : null}
      <ul aria-label="Citas" className="mt-4 grid gap-3">
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
                <span>con {staffOf(venue, b.staff)?.name}</span>
              </p>
              <p className="mt-2 text-sm">
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-medium text-emerald-800">Señal {euros(b.paid)} pagada</span>
                <span className="ml-2 text-muted">Resta {euros(b.price - b.paid)} en el centro</span>
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
      <p className="mt-6 text-center text-xs text-muted">Hoy es {dayLabel(now, now).toLowerCase()}. Los datos son de ejemplo.</p>
    </>
  );
}

// ---------- The studio: one card per class, with who is coming ----------

function ClassesDay({ venue, day, bookings, mine, fresh, now, setStatus }: { venue: Venue; day: number; bookings: Booking[]; mine: Booking[]; fresh?: string; now: number; setStatus: (id: string, s: Status) => void }) {
  const sessions = classesOn(venue, day, bookings);
  const active = mine.filter(isActive);
  const free = sessions.reduce((sum, s) => sum + (s.capacity - s.taken), 0);
  const income = active.reduce((sum, b) => sum + b.paid, 0);
  const ordered = [...sessions.filter((s) => mine.some((b) => b.ref === fresh && b.offer === s.offer.id && b.start === s.start)), ...sessions.filter((s) => !mine.some((b) => b.ref === fresh && b.offer === s.offer.id && b.start === s.start))];

  return (
    <>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <Stat label="Reservas" value={String(active.length)} />
        <Stat label="Plazas libres" value={String(free)} />
        <Stat label="Cobrado" value={euros(income)} />
      </div>

      {sessions.length === 0 ? <p className="mt-6 rounded-2xl bg-paper px-4 py-8 text-center text-muted ring-1 ring-line">No hay clases este día.</p> : null}
      <ul aria-label="Clases" className="mt-4 grid gap-3">
        {ordered.map((s) => (
          <SessionCard key={s.key} venue={venue} session={s} attendees={mine.filter((b) => b.offer === s.offer.id && b.start === s.start && isActive(b))} fresh={fresh} setStatus={setStatus} />
        ))}
      </ul>
      <p className="mt-6 text-center text-xs text-muted">Hoy es {dayLabel(now, now).toLowerCase()}. Los datos son de ejemplo.</p>
    </>
  );
}

function SessionCard({ venue, session, attendees, fresh, setStatus }: { venue: Venue; session: ClassSession; attendees: Booking[]; fresh?: string; setStatus: (id: string, s: Status) => void }) {
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
                    {b.phone} · pagada {euros(b.paid)}
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
