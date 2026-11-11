"use client";

import { useEffect, useRef, useState } from "react";
import { dentistFor, dentists, FIRST_BOOKABLE, freeSlots, longDay, MONTH, weekday, weekdayIndex } from "@/lib/clinica";
import { takenSlots, useDemoState } from "@/lib/clinica-store";
import { CheckIcon } from "./icons";

// The calendar the assistant opens (like a WhatsApp Flow): only the days and times that are free in the
// clinic's agenda can be picked. It reads the agenda's turnos live, so a slot booked elsewhere disappears.

const HEADERS = ["L", "M", "M", "J", "V", "S", "D"];

export function DayPicker({ service, onClose, onConfirm }: { service?: string; onClose: () => void; onConfirm: (date: number, time: string) => void }) {
  const state = useDemoState();
  const taken = takenSlots(state);
  const dentist = dentistFor(service);
  const [date, setDate] = useState<number | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const sheet = useRef<HTMLDivElement>(null);

  // Focus moves into the sheet and comes back to the button that opened it.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    sheet.current?.focus();
    return () => opener?.focus?.();
  }, []);

  const free = date ? freeSlots(date, dentist, taken) : [];
  // The picked time disappears from the list if someone takes it meanwhile.
  const chosen = time && free.includes(time) ? time : null;
  const leading = (weekdayIndex(1) + 6) % 7; // the grid starts on Monday

  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-end bg-black/45" onKeyDown={(e) => e.key === "Escape" && onClose()}>
      <button type="button" aria-label="Cerrar" tabIndex={-1} onClick={onClose} className="min-h-0 flex-1 cursor-default" />
      <div
        ref={sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="picker-title"
        tabIndex={-1}
        className="sheet-in flex max-h-[92%] flex-col rounded-t-3xl bg-white text-[#111b21] outline-none"
      >
        <div className="flex items-start gap-3 px-5 pt-4 pb-2">
          <div className="min-w-0 flex-1">
            <h2 id="picker-title" className="text-lg font-semibold">
              Elegí día y horario
            </h2>
            <p className="text-sm text-[#667781]">
              {service ?? "Turno"} · con la {dentists[dentist].name}
            </p>
          </div>
          <button type="button" aria-label="Cerrar" onClick={onClose} className="grid size-10 shrink-0 place-items-center rounded-full text-2xl leading-none text-[#667781] [touch-action:manipulation] active:bg-black/5">
            ×
          </button>
        </div>

        <div className="overflow-y-auto overscroll-contain px-5 pb-3">
          <p className="mt-1 text-[15px] font-semibold capitalize">
            {MONTH.name} {MONTH.year}
          </p>
          <div role="group" aria-label={`Días de ${MONTH.name}`} className="mt-1 grid grid-cols-7 gap-y-1">
            {HEADERS.map((h, i) => (
              <span key={i} aria-hidden className="grid h-7 place-items-center text-xs font-medium text-[#667781]">
                {h}
              </span>
            ))}
            {Array.from({ length: leading }, (_, i) => (
              <span key={`b${i}`} />
            ))}
            {Array.from({ length: MONTH.days }, (_, i) => i + 1).map((d) => {
              const open = freeSlots(d, dentist, taken).length > 0;
              const selected = d === date;
              return (
                <button
                  key={d}
                  type="button"
                  data-date={d}
                  disabled={!open}
                  aria-pressed={selected}
                  aria-label={`${longDay(d)}${open ? "" : ", sin horarios disponibles"}`}
                  onClick={() => {
                    setDate(d);
                    setTime(null);
                  }}
                  className={`mx-auto grid size-10 place-items-center rounded-full text-[15px] [touch-action:manipulation] transition-[background-color,color,transform] duration-100 active:scale-95 motion-reduce:active:scale-100 ${
                    selected ? "bg-[#008069] font-semibold text-white" : open ? "bg-[#e7f6ee] font-medium text-[#0b5d4b]" : "text-[#b3bcc1]"
                  }`}
                >
                  {d}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-[#667781]">Los días y horarios libres salen de la agenda de la clínica.</p>

          <div className="mt-3 min-h-28">
            {date ? (
              <>
                <p className="text-[15px] font-semibold">
                  Horarios libres · {weekday(date)} {date}
                </p>
                {free.length > 0 ? (
                  <div role="group" aria-label="Horarios libres" className="mt-2 grid grid-cols-4 gap-2">
                    {free.map((t) => (
                      <button
                        key={t}
                        type="button"
                        aria-pressed={t === chosen}
                        onClick={() => setTime(t)}
                        className={`h-9 rounded-lg text-sm font-medium ring-1 [touch-action:manipulation] transition-[background-color,color,transform] duration-100 active:scale-95 motion-reduce:active:scale-100 ${
                          t === chosen ? "bg-[#008069] text-white ring-[#008069]" : "bg-white text-[#111b21] ring-[#d1d7db]"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-[#667781]">Ya no quedan horarios este día. Elegí otro.</p>
                )}
              </>
            ) : (
              <p className="mt-2 text-sm text-[#667781]">Tocá un día marcado en verde para ver sus horarios. Desde el {FIRST_BOOKABLE} hay turnos.</p>
            )}
          </div>
        </div>

        <div className="border-t border-[#e9edef] px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            disabled={!date || !chosen}
            onClick={() => date && chosen && onConfirm(date, chosen)}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#008069] text-base font-semibold text-white [touch-action:manipulation] transition-[background-color,transform,opacity] active:scale-[0.98] active:bg-[#006b58] motion-reduce:active:scale-100 disabled:bg-[#d1d7db] disabled:text-[#667781]"
          >
            <CheckIcon width={20} height={20} />
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
}
