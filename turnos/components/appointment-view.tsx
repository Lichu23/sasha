"use client";

import Link from "next/link";
import { canCancel, setStatus, useAppointment } from "@/lib/appointments";
import { clinic, professionalById, serviceById } from "@/lib/clinic";
import { formatLongDay, formatPrice, toCalendarStamp, toTime, toMinutes } from "@/lib/dates";
import { useHydrated } from "@/lib/use-hydrated";

export function AppointmentView({ id }: { id: string }) {
  const hydrated = useHydrated();
  const appointment = useAppointment(id);

  if (!hydrated) return <div className="h-64 animate-pulse rounded-2xl bg-line/50" aria-hidden />;

  const service = appointment && serviceById(appointment.serviceId);
  const pro = appointment && professionalById(appointment.professionalId);
  if (!appointment || !service || !pro) {
    return (
      <div className="rounded-2xl border border-line bg-paper p-6 text-center">
        <h1 className="text-xl font-semibold">No encontramos este turno</h1>
        <p className="mt-2 text-sm text-muted">En la demo los turnos se guardan solo en el navegador donde se reservaron.</p>
        <Link href="/reservar" className="mt-5 inline-block rounded-full bg-brand px-5 py-3 font-medium text-white">
          Reservar un turno
        </Link>
      </div>
    );
  }

  const cancelled = appointment.status === "cancelado";
  const end = toTime(toMinutes(appointment.time) + appointment.minutes);
  const calendar = new URLSearchParams({
    action: "TEMPLATE",
    text: `${service.name} · ${clinic.name}`,
    dates: `${toCalendarStamp(appointment.date, appointment.time)}/${toCalendarStamp(appointment.date, end)}`,
    details: `Turno con ${pro.name}`,
    location: `${clinic.address}, ${clinic.city}`,
  });

  return (
    <div className="rounded-2xl border border-line bg-paper p-6 shadow-sm">
      <p className={`mb-1 text-sm font-medium ${cancelled ? "text-red-700" : "text-brand-ink"}`}>
        {cancelled ? "Turno cancelado" : "¡Turno confirmado!"}
      </p>
      <h1 className="text-2xl font-semibold tracking-tight">{formatLongDay(appointment.date)}</h1>
      <p className="text-3xl font-semibold tabular-nums">{appointment.time} hs</p>

      <dl className="mt-5 grid gap-2 text-sm">
        <Row label="Servicio" value={`${service.name} (${service.minutes} min)`} />
        <Row label="Profesional" value={pro.name} />
        <Row label="Lugar" value={`${clinic.address}, ${clinic.city}`} />
        <Row label="A nombre de" value={appointment.patient.name} />
        <Row label="Precio desde" value={formatPrice(service.priceFrom)} />
        <Row label="Código" value={appointment.id} />
      </dl>

      {cancelled ? null : (
        <div className="mt-6 grid gap-2">
          <a
            href={`https://calendar.google.com/calendar/render?${calendar}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-brand px-5 py-3 text-center font-medium text-white hover:bg-brand-ink"
          >
            Agregar al calendario
          </a>
          {canCancel(appointment, new Date()) ? (
            <button
              type="button"
              onClick={() => setStatus(appointment.id, "cancelado")}
              className="rounded-full border border-line px-5 py-3 font-medium text-muted hover:text-ink"
            >
              Cancelar turno
            </button>
          ) : (
            <p className="text-center text-xs text-muted">
              Para cancelar con menos de {clinic.cancelUntilHours} h de anticipación, escribinos por WhatsApp.
            </p>
          )}
        </div>
      )}
      <p className="mt-5 text-center text-xs text-muted">
        En la versión real, esta página llega por mail con un link seguro y un recordatorio 24 h antes.
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
