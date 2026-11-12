"use client";

import { useMemo, useState } from "react";
import { createAppointment, useAppointments } from "@/lib/appointments";
import { clinic } from "@/lib/clinic";
import { dayNumber, formatLongDay, formatPrice, formatWeekday, toDateKey } from "@/lib/dates";
import { bookableDays, getSlots, type Slot } from "@/lib/slots";
import type { Appointment, DateKey, Service } from "@/lib/types";
import { useHydrated } from "@/lib/use-hydrated";

type Props = {
  /** "web": the patient books with notice and email. "manual": the clinic enters a phone or WhatsApp booking. */
  source: "web" | "manual";
  onBooked: (appointment: Appointment) => void;
};

const STEPS = ["Servicio", "Profesional", "Día y hora", "Tus datos"] as const;

export function BookingFlow(props: Props) {
  // Dates come from the clock and appointments from storage, so render only after hydration.
  const hydrated = useHydrated();
  if (!hydrated) return <div className="h-96 animate-pulse rounded-2xl bg-line/50" aria-hidden />;
  return <BookingSteps {...props} />;
}

function BookingSteps({ source, onBooked }: Props) {
  const appointments = useAppointments();
  const [step, setStep] = useState(0);
  const [service, setService] = useState<Service | null>(null);
  const [professionalId, setProfessionalId] = useState("any");
  const [date, setDate] = useState<DateKey | null>(null);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [error, setError] = useState("");

  const leadMinutes = source === "manual" ? 0 : clinic.leadMinutes;

  // Which days still have free times for the chosen service and professional.
  const days = useMemo(() => {
    if (!service) return [];
    const today = toDateKey(new Date());
    return bookableDays(clinic, today).map((d) => ({
      date: d,
      free: getSlots({ clinic, service, professionalId, date: d, appointments, now: new Date(), leadMinutes }).length,
    }));
  }, [service, professionalId, appointments, leadMinutes]);

  const slots = useMemo(
    () =>
      service && date
        ? getSlots({ clinic, service, professionalId, date, appointments, now: new Date(), leadMinutes })
        : [],
    [service, professionalId, date, appointments, leadMinutes],
  );

  const offeredBy = service ? clinic.professionals.filter((p) => p.serviceIds.includes(service.id)) : [];

  function back() {
    setError("");
    setStep((s) => Math.max(0, s - 1));
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!service || !date || !slot) return;
    const form = new FormData(e.currentTarget);
    const text = (key: string) => String(form.get(key) ?? "");
    const result = createAppointment({
      serviceId: service.id,
      professionalId: slot.professionalId,
      date,
      time: slot.time,
      source,
      patient: { name: text("name"), phone: text("phone"), email: text("email"), coverage: text("coverage") },
      notes: text("notes"),
    });
    if (!result.ok) {
      setError(result.error);
      // The chosen time may have been taken: send them back to pick another.
      if (result.error.startsWith("Ese horario")) {
        setSlot(null);
        setStep(2);
      }
      return;
    }
    onBooked(result.appointment);
  }

  return (
    <div className="rounded-2xl border border-line bg-paper p-4 shadow-sm sm:p-6">
      <ol className="mb-5 flex gap-1.5" aria-label="Pasos">
        {STEPS.map((label, i) => (
          <li
            key={label}
            aria-current={i === step ? "step" : undefined}
            className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-brand" : "bg-line"}`}
            title={label}
          />
        ))}
      </ol>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">
          {step + 1}. {STEPS[step]}
        </h2>
        {step > 0 ? (
          <button type="button" onClick={back} className="rounded-full px-3 py-2 text-sm text-muted hover:text-ink">
            ← Volver
          </button>
        ) : null}
      </div>

      {step === 0 ? (
        <ul className="grid gap-2">
          {clinic.services.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => {
                  setService(s);
                  setProfessionalId("any");
                  setDate(null);
                  setSlot(null);
                  setStep(1);
                }}
                className="hover-line flex w-full items-center justify-between gap-3 rounded-xl border border-line px-4 py-3 text-left"
              >
                <span>
                  <span className="block font-medium">{s.name}</span>
                  <span className="block text-sm text-muted">{s.minutes} min · {s.description}</span>
                </span>
                <span className="shrink-0 text-sm font-medium text-brand-ink">desde {formatPrice(s.priceFrom)}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {step === 1 && service ? (
        <ul className="grid gap-2">
          {[{ id: "any", name: "Cualquiera disponible", role: "El primero que tenga lugar" }, ...offeredBy].map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => {
                  setProfessionalId(p.id);
                  setDate(null);
                  setSlot(null);
                  setStep(2);
                }}
                className="hover-line w-full rounded-xl border border-line px-4 py-3 text-left"
              >
                <span className="block font-medium">{p.name}</span>
                <span className="block text-sm text-muted">{p.role}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {step === 2 && service ? (
        <div>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2" role="group" aria-label="Día">
            {days.map(({ date: d, free }) => (
              <button
                key={d}
                type="button"
                disabled={free === 0}
                aria-pressed={date === d}
                onClick={() => {
                  setDate(d);
                  setSlot(null);
                }}
                className={`flex w-16 shrink-0 flex-col items-center rounded-xl border px-2 py-2 text-sm disabled:opacity-40 ${
                  date === d ? "border-brand bg-brand text-white" : "border-line"
                }`}
              >
                <span>{formatWeekday(d)}</span>
                <span className="text-lg font-semibold">{dayNumber(d)}</span>
              </button>
            ))}
          </div>
          {date ? (
            <div className="mt-4">
              <p className="mb-2 text-sm text-muted">{formatLongDay(date)}</p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {slots.map((s) => (
                  <button
                    key={s.time}
                    type="button"
                    aria-pressed={slot?.time === s.time}
                    onClick={() => setSlot(s)}
                    className={`rounded-xl border px-2 py-2.5 text-sm font-medium tabular-nums ${
                      slot?.time === s.time ? "border-brand bg-brand text-white" : "border-line hover-line"
                    }`}
                  >
                    {s.time}
                  </button>
                ))}
              </div>
              <button
                type="button"
                disabled={!slot}
                onClick={() => setStep(3)}
                className="mt-5 w-full rounded-full bg-brand px-5 py-3 font-medium text-white hover:bg-brand-ink disabled:opacity-40"
              >
                Continuar
              </button>
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted">Elegí un día para ver los horarios libres.</p>
          )}
        </div>
      ) : null}

      {step === 3 && service && date && slot ? (
        <form onSubmit={submit} className="grid gap-4">
          <p className="rounded-xl bg-soft px-4 py-3 text-sm">
            <strong>{service.name}</strong> con{" "}
            {clinic.professionals.find((p) => p.id === slot.professionalId)?.name} ·{" "}
            {formatLongDay(date)} a las {slot.time}
          </p>
          <Field label={`Nombre y apellido`} name="name" autoComplete="name" required maxLength={80} />
          <Field label="Teléfono" name="phone" type="tel" inputMode="tel" autoComplete="tel" required maxLength={20} placeholder="11 2345-6789" />
          <Field
            label={source === "web" ? "Email (te mandamos la confirmación)" : "Email (opcional)"}
            name="email"
            type="email"
            autoComplete="email"
            required={source === "web"}
            maxLength={120}
          />
          {clinic.coverages.length > 0 ? (
            <label className="grid gap-1 text-sm font-medium">
              Obra social / prepaga
              <select name="coverage" defaultValue="" className="rounded-xl border border-line bg-paper px-3 py-3 font-normal">
                <option value="">Prefiero no indicarlo</option>
                {clinic.coverages.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="grid gap-1 text-sm font-medium">
            Comentarios (opcional)
            <textarea name="notes" rows={2} maxLength={300} className="rounded-xl border border-line px-3 py-3 font-normal" />
          </label>
          <p role="alert" aria-live="polite" className="min-h-5 text-sm text-red-700">{error}</p>
          <button type="submit" className="rounded-full bg-brand px-5 py-3 font-medium text-white hover:bg-brand-ink">
            Confirmar turno
          </button>
          <p className="text-center text-xs text-muted">
            Cancelás gratis hasta {clinic.cancelUntilHours} h antes. Demo: no se guarda ningún dato real.
          </p>
        </form>
      ) : null}
    </div>
  );
}

function Field({ label, ...input }: { label: string } & React.ComponentProps<"input">) {
  return (
    <label className="grid gap-1 text-sm font-medium">
      {label}
      <input {...input} className="rounded-xl border border-line px-3 py-3 font-normal" />
    </label>
  );
}
