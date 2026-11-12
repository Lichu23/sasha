"use client";

import { useState } from "react";
import { BookingFlow } from "@/components/booking/booking-flow";
import { resetDemo, setStatus, useAppointments } from "@/lib/appointments";
import { clinic, professionalById, serviceById } from "@/lib/clinic";
import { addDays, formatLongDay, toDateKey, toMinutes } from "@/lib/dates";
import type { Appointment, AppointmentStatus, DateKey } from "@/lib/types";
import { useHydrated } from "@/lib/use-hydrated";

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  confirmado: "Confirmado",
  completado: "Completado",
  ausente: "No vino",
  cancelado: "Cancelado",
};

const STATUS_STYLE: Record<AppointmentStatus, string> = {
  confirmado: "bg-soft text-brand-ink",
  completado: "bg-green-100 text-green-800",
  ausente: "bg-amber-100 text-amber-800",
  cancelado: "bg-red-100 text-red-800",
};

export function AdminAgenda() {
  const hydrated = useHydrated();
  if (!hydrated) return <div className="h-96 animate-pulse rounded-2xl bg-line/50" aria-hidden />;
  return <Agenda />;
}

function Agenda() {
  const appointments = useAppointments();
  const [date, setDate] = useState<DateKey>(() => toDateKey(new Date()));
  const [proFilter, setProFilter] = useState("all");
  const [adding, setAdding] = useState(false);

  const today = toDateKey(new Date());
  const ofDay = appointments
    .filter((a) => a.date === date && (proFilter === "all" || a.professionalId === proFilter))
    .sort((a, b) => toMinutes(a.time) - toMinutes(b.time));

  const upcoming = appointments.filter((a) => a.date >= today && a.status === "confirmado").length;
  const todayCount = appointments.filter((a) => a.date === today && a.status !== "cancelado").length;
  const noShows = appointments.filter((a) => a.status === "ausente").length;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Agenda</h1>
          <p className="text-sm text-muted">Panel de {clinic.name}</p>
        </div>
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          className="rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-ink"
        >
          {adding ? "Cerrar" : "+ Turno manual"}
        </button>
      </div>

      <dl className="mb-6 grid grid-cols-3 gap-3">
        <Stat label="Hoy" value={todayCount} />
        <Stat label="Próximos" value={upcoming} />
        <Stat label="No vinieron" value={noShows} />
      </dl>

      {adding ? (
        <div className="mb-6">
          <p className="mb-3 text-sm text-muted">Para reservas que llegan por teléfono o WhatsApp.</p>
          <BookingFlow
            source="manual"
            onBooked={(a) => {
              setDate(a.date);
              setAdding(false);
            }}
          />
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button type="button" aria-label="Día anterior" onClick={() => setDate(addDays(date, -1))} className="rounded-full border border-line bg-paper px-3 py-2">
          ←
        </button>
        <input
          type="date"
          aria-label="Fecha"
          value={date}
          onChange={(e) => e.target.value && setDate(e.target.value)}
          className="rounded-full border border-line bg-paper px-3 py-2"
        />
        <button type="button" aria-label="Día siguiente" onClick={() => setDate(addDays(date, 1))} className="rounded-full border border-line bg-paper px-3 py-2">
          →
        </button>
        {date !== today ? (
          <button type="button" onClick={() => setDate(today)} className="rounded-full px-3 py-2 text-sm text-brand-ink">
            Hoy
          </button>
        ) : null}
        <select
          aria-label="Profesional"
          value={proFilter}
          onChange={(e) => setProFilter(e.target.value)}
          className="ml-auto rounded-full border border-line bg-paper px-3 py-2"
        >
          <option value="all">Todo el equipo</option>
          {clinic.professionals.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <h2 className="mb-3 text-lg font-semibold">{formatLongDay(date)}</h2>
      {ofDay.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line bg-paper p-8 text-center text-sm text-muted">
          No hay turnos para este día.
        </p>
      ) : (
        <ul className="grid gap-3">
          {ofDay.map((a) => (
            <AppointmentRow key={a.id} appointment={a} />
          ))}
        </ul>
      )}

      <button type="button" onClick={resetDemo} className="mt-10 text-xs text-muted underline">
        Restablecer datos de la demo
      </button>
    </div>
  );
}

function AppointmentRow({ appointment: a }: { appointment: Appointment }) {
  const service = serviceById(a.serviceId);
  const pro = professionalById(a.professionalId);
  const digits = a.patient.phone.replace(/\D/g, "");
  return (
    <li className="rounded-2xl border border-line bg-paper p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold tabular-nums">{a.time} hs</p>
          <p className="font-medium">{a.patient.name}</p>
          <p className="text-sm text-muted">
            {service?.name} · {pro?.name}
            {a.patient.coverage ? ` · ${a.patient.coverage}` : ""}
          </p>
          {a.notes ? <p className="mt-1 text-sm">“{a.notes}”</p> : null}
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLE[a.status]}`}>
          {STATUS_LABEL[a.status]}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-sm">
        {(["confirmado", "completado", "ausente", "cancelado"] as const)
          .filter((s) => s !== a.status)
          .map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(a.id, s)}
              className="rounded-full border border-line px-3 py-1.5 text-muted hover:text-ink"
            >
              {STATUS_LABEL[s]}
            </button>
          ))}
        <a href={`tel:${digits}`} className="rounded-full border border-line px-3 py-1.5 text-brand-ink">Llamar</a>
        <a
          href={`https://wa.me/54${digits}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-line px-3 py-1.5 text-brand-ink"
        >
          WhatsApp
        </a>
      </div>
    </li>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-line bg-paper p-4">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="text-2xl font-semibold">{value}</dd>
    </div>
  );
}
