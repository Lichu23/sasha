"use client";

import { closedDates, longDay, MONTH, TODAY, weekdayIndex, type Appointment } from "@/lib/clinica";

// The agenda's month view: every day shows how many turnos it has, read from the same turnos as the chat's
// calendar (the clinic's own plus what was booked in the chat). Days with a new WhatsApp booking get a dot.

const HEADERS = ["L", "M", "M", "J", "V", "S", "D"];

export function AgendaCalendar({ appointments, selected, onSelect }: { appointments: readonly Appointment[]; selected: number; onSelect: (date: number) => void }) {
  const leading = (weekdayIndex(1) + 6) % 7; // the grid starts on Monday
  return (
    <div className="rounded-2xl bg-paper p-3 ring-1 ring-line">
      <p className="px-1 pb-1 text-base font-semibold capitalize">
        {MONTH.name} {MONTH.year}
      </p>
      <div role="group" aria-label={`Días de ${MONTH.name}`} className="grid grid-cols-7 gap-1">
        {HEADERS.map((h, i) => (
          <span key={i} aria-hidden className="grid h-6 place-items-center text-xs font-medium text-muted">
            {h}
          </span>
        ))}
        {Array.from({ length: leading }, (_, i) => (
          <span key={`b${i}`} />
        ))}
        {Array.from({ length: MONTH.days }, (_, i) => i + 1).map((d) => {
          const wd = weekdayIndex(d);
          const off = wd === 0 || wd === 6 || closedDates.includes(d) || d < TODAY; // weekends, closed days and days gone by
          const list = appointments.filter((a) => a.date === d);
          const fresh = list.some((a) => a.fresh);
          const on = d === selected;
          const label = off ? (closedDates.includes(d) ? "Cerrado" : "") : list.length > 0 ? `${list.length}` : "";
          return (
            <button
              key={d}
              type="button"
              data-day={d}
              disabled={off}
              aria-pressed={on}
              aria-label={`${longDay(d)}${off ? (d < TODAY ? ", ya pasó" : ", cerrado") : `, ${list.length} turnos${fresh ? ", con turnos nuevos por WhatsApp" : ""}`}`}
              onClick={() => onSelect(d)}
              className={`relative flex h-[52px] flex-col items-center justify-center rounded-xl text-sm [touch-action:manipulation] transition-[background-color,color,transform] duration-150 active:scale-95 motion-reduce:active:scale-100 ${
                on ? "bg-brand text-white" : off ? "text-[#b3bcc4]" : "bg-blush/60 text-ink"
              } ${d === TODAY && !on ? "ring-2 ring-brand" : ""}`}
            >
              <span className="font-semibold">{d}</span>
              <span className={`text-[11px] leading-none ${on ? "text-white/90" : "text-muted"}`}>{label}</span>
              {fresh ? <span aria-hidden className={`absolute top-1 right-1.5 size-2 rounded-full ${on ? "bg-white" : "bg-brand"}`} /> : null}
            </button>
          );
        })}
      </div>
      <p className="mt-2 px-1 text-xs text-muted">
        <span aria-hidden className="mr-1 inline-block size-2 rounded-full bg-brand align-middle" />
        Turno nuevo reservado por WhatsApp
      </p>
    </div>
  );
}
