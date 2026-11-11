"use client";

import { useState } from "react";
import { Segmented } from "@/components/ui/segmented";
import { clinic, dentists, TODAY, longDay, statusLabel, weekStats, type Appointment, type DentistId, type Status } from "@/lib/clinica";
import { allAppointments, useDemoState } from "@/lib/clinica-store";
import { AgendaCalendar } from "./agenda-calendar";
import { ChevronIcon, ToothIcon } from "./icons";

// The clinic's side: the agenda that the WhatsApp assistant fills in on its own. The clinic's own turnos are made up
// (lib/clinica.ts); what the demo patient books in the chat comes from lib/clinica-store.ts.

const statusStyle: Record<Status, string> = {
  done: "bg-[#eceff3] text-[#4b5563]",
  confirmed: "bg-[#e1f5e9] text-[#14683a]",
  reminded: "bg-warn-bg text-warn-ink",
  scheduled: "bg-blush text-brand-ink",
};

const filters: readonly { value: "all" | DentistId; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "romero", label: dentists.romero.short },
  { value: "gomez", label: dentists.gomez.short },
];

export function Agenda() {
  const [day, setDay] = useState<number>(TODAY);
  const [who, setWho] = useState<"all" | DentistId>("all");
  const [open, setOpen] = useState<string | null>(null);
  const [attended, setAttended] = useState<ReadonlySet<string>>(new Set());
  const [answered, setAnswered] = useState(false);

  const state = useDemoState();
  const everyone = allAppointments(state);
  const list = everyone.filter((a) => a.date === day && (who === "all" || a.dentist === who));
  const inbox = state.handoff ? [{ id: "i1", patient: state.handoff, text: "Pidió hablar con recepción", ago: "hace 2 min" }] : [];

  return (
    <div className="flex min-h-dvh flex-col bg-cream">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-line bg-paper/95 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 backdrop-blur">
        <span aria-hidden className="grid size-10 place-items-center rounded-xl bg-brand text-white">
          <ToothIcon width={24} height={24} />
        </span>
        <div className="leading-tight">
          <p className="text-lg font-semibold">{clinic.name}</p>
          <p className="text-sm text-muted">Panel de la clínica</p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pt-4 pb-[max(2.5rem,env(safe-area-inset-bottom))]">
        <section aria-labelledby="agenda-title">
          <h1 id="agenda-title" className="text-2xl font-semibold tracking-tight">
            Agenda
          </h1>

          <div className="mt-3">
            <AgendaCalendar
              appointments={everyone}
              selected={day}
              onSelect={(d) => {
                setDay(d);
                setOpen(null);
              }}
            />
          </div>

          <Segmented label="Profesional" value={who} onChange={setWho} options={filters} className="mt-3 max-w-full overflow-x-auto" />

          <h2 id="day-title" className="mt-5 scroll-mt-20 text-sm font-medium text-muted">
            {longDay(day)} · {list.length} turnos
          </h2>
          <ul className="mt-2 grid gap-2">
            {list.map((a) => (
              <AppointmentRow
                key={a.id}
                a={a}
                open={open === a.id}
                done={attended.has(a.id)}
                onToggle={() => setOpen(open === a.id ? null : a.id)}
                onAttended={() => setAttended((prev) => new Set(prev).add(a.id))}
              />
            ))}
          </ul>
          {list.length === 0 ? <p className="mt-2 rounded-2xl bg-paper p-4 text-sm text-muted ring-1 ring-line">No hay turnos para este profesional.</p> : null}
        </section>

        {inbox.length > 0 ? (
        <section aria-labelledby="inbox-title" className="mt-8">
          <h2 id="inbox-title" className="text-lg font-semibold">
            Para atender
          </h2>
          <ul className="mt-2 grid gap-2">
            {inbox.map((chat) => (
              <li key={chat.id} className="flex items-center gap-3 rounded-2xl bg-paper p-3.5 ring-1 ring-line">
                <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-[#25d366]/15 font-semibold text-[#14683a]">
                  {chat.patient[0]}
                </span>
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="block font-semibold">{chat.patient}</span>
                  <span className="block text-sm text-muted">
                    {chat.text} · {chat.ago}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setAnswered(true)}
                  disabled={answered}
                  className="h-10 shrink-0 rounded-full bg-brand px-4 text-sm font-semibold text-white [touch-action:manipulation] transition-colors active:bg-brand-ink disabled:bg-[#eceff3] disabled:text-[#4b5563]"
                >
                  {answered ? "Respondido" : "Responder"}
                </button>
              </li>
            ))}
          </ul>
        </section>
        ) : null}

        <section aria-labelledby="week-title" className="mt-8">
          <h2 id="week-title" className="text-lg font-semibold">
            Resumen de la semana
          </h2>
          <dl className="mt-2 grid grid-cols-3 gap-2">
            <Stat label="Turnos" value={String(weekStats.appointments)} />
            <Stat label="Confirmaron" value={`${weekStats.confirmedRate}%`} />
            <Stat label="Fuera de horario" value={String(weekStats.afterHours)} />
          </dl>

          <div className="mt-3 rounded-2xl bg-paper p-4 ring-1 ring-line">
            <h3 className="text-sm font-semibold">Tratamientos más pedidos</h3>
            <ul className="mt-3 grid gap-3">
              {weekStats.topServices.map((s) => (
                <li key={s.label}>
                  <div className="flex justify-between text-sm">
                    <span>{s.label}</span>
                    <span className="font-semibold">{s.count}</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-blush">
                    <div className="h-2 rounded-full bg-brand" style={{ width: `${(s.count / weekStats.topServices[0].count) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-3 text-center text-xs text-muted">Datos de ejemplo.</p>
        </section>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-paper p-3 ring-1 ring-line">
      <dt className="text-xs leading-tight text-muted">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold tracking-tight">{value}</dd>
    </div>
  );
}

function AppointmentRow({ a, open, done, onToggle, onAttended }: { a: Appointment; open: boolean; done: boolean; onToggle: () => void; onAttended: () => void }) {
  const status: Status = done ? "done" : a.status;
  const panel = `details-${a.id}`;
  return (
    <li className={`rounded-2xl bg-paper ring-1 transition-shadow ${a.fresh ? "ring-2 ring-brand" : "ring-line"}`}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panel}
        onClick={onToggle}
        className="flex w-full items-start gap-3 rounded-2xl p-3.5 text-left [touch-action:manipulation] active:bg-blush/50"
      >
        <span className="w-12 shrink-0 pt-0.5 text-base font-semibold tabular-nums">{a.time}</span>
        <span className="min-w-0 flex-1 leading-snug">
          <span className="block truncate font-semibold">{a.patient}</span>
          <span className="block text-sm text-muted">
            {a.service} · {dentists[a.dentist].short}
          </span>
          <span className="mt-1.5 flex flex-wrap gap-1.5">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyle[status]}`}>{statusLabel[status]}</span>
            {a.fresh ? <span className="rounded-full bg-brand px-2.5 py-0.5 text-xs font-medium text-white">{a.fresh}</span> : null}
          </span>
        </span>
        <ChevronIcon aria-hidden className={`mt-1 shrink-0 text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div id={panel} className="border-t border-line px-3.5 pt-3 pb-3.5">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="text-muted">Teléfono</dt>
            <dd className="text-right font-medium">{a.phone}</dd>
            <dt className="text-muted">Cobertura</dt>
            <dd className="text-right font-medium">{a.coverage}</dd>
            <dt className="text-muted">Profesional</dt>
            <dd className="text-right font-medium">{dentists[a.dentist].name}</dd>
          </dl>
          <button
            type="button"
            onClick={onAttended}
            disabled={done || a.status === "done"}
            className="mt-3 h-11 w-full rounded-full bg-brand text-sm font-semibold text-white [touch-action:manipulation] transition-[background-color,transform] active:scale-[0.98] active:bg-brand-ink motion-reduce:active:scale-100 disabled:bg-[#eceff3] disabled:text-[#4b5563]"
          >
            {done || a.status === "done" ? "Atendido" : "Marcar atendido"}
          </button>
        </div>
      ) : null}
    </li>
  );
}
