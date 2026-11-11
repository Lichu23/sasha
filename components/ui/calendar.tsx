"use client";

import { useState } from "react";
import { fromAr, toAr } from "@/lib/pickup";

// The one calendar of the template: a month, Monday first, in Argentina time. Days are their midnight (a timestamp).
// It is used wherever a date is picked or filtered: the reservation form, the panel's reservations and orders, and the
// sheet (components/ui/date-sheet.tsx) that opens when the shop changes a time. What each day shows (a count, a dot)
// and which days can't be picked come from the caller.

export type DayMark = { label?: string; dot?: boolean };

const HEADERS = ["L", "M", "M", "J", "V", "S", "D"];
const monthFormat = new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric", timeZone: "UTC" });
// A day's midnight in Argentina is 03:00 UTC, so formatting it in UTC gives that same date.
const dayFormat = new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

const arrow = "grid size-11 place-items-center rounded-full text-xl leading-none [touch-action:manipulation] active:bg-blush disabled:opacity-30";

export function Calendar({
  today,
  value,
  onChange,
  minDay,
  maxDay,
  isDisabled,
  marks,
  className = "",
}: {
  /** Midnight (Argentina) of today. */
  today: number;
  /** The picked day, or null. The calendar opens on its month (or today's). */
  value: number | null;
  onChange: (day: number) => void;
  /** First and last day that can be picked (midnights). */
  minDay?: number;
  maxDay?: number;
  isDisabled?: (day: number) => boolean;
  marks?: (day: number) => DayMark | undefined;
  className?: string;
}) {
  const opening = toAr(value ?? today);
  const [view, setView] = useState({ year: opening.year, month: opening.month });

  const first = fromAr(view.year, view.month, 1, 0);
  const lead = (toAr(first).weekday + 6) % 7;
  const count = new Date(Date.UTC(view.year, view.month + 1, 0)).getUTCDate();
  const previousMonthEnd = fromAr(view.year, view.month, 0, 0);
  const nextMonthStart = fromAr(view.year, view.month + 1, 1, 0);
  const canGoBack = minDay === undefined || previousMonthEnd >= minDay;
  const canGoForward = maxDay === undefined || nextMonthStart <= maxDay;
  const go = (delta: number) => {
    const next = toAr(fromAr(view.year, view.month + delta, 1, 0));
    setView({ year: next.year, month: next.month });
  };
  const title = monthFormat.format(first);

  return (
    <div role="group" aria-label="Calendario" className={className}>
      <div className="flex items-center justify-between">
        <button type="button" aria-label="Mes anterior" disabled={!canGoBack} onClick={() => go(-1)} className={arrow}>
          ‹
        </button>
        <p className="text-base font-semibold first-letter:uppercase" aria-live="polite">
          {title}
        </p>
        <button type="button" aria-label="Mes siguiente" disabled={!canGoForward} onClick={() => go(1)} className={arrow}>
          ›
        </button>
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {HEADERS.map((h, i) => (
          <span key={i} aria-hidden className="grid h-7 place-items-center text-xs font-medium text-muted">
            {h}
          </span>
        ))}
        {Array.from({ length: lead }, (_, i) => (
          <span key={`blank-${i}`} />
        ))}
        {Array.from({ length: count }, (_, i) => i + 1).map((date) => {
          const day = fromAr(view.year, view.month, date, 0);
          const off = (minDay !== undefined && day < minDay) || (maxDay !== undefined && day > maxDay) || Boolean(isDisabled?.(day));
          const selected = value !== null && day === value;
          const mark = marks?.(day);
          return (
            <button
              key={date}
              type="button"
              data-day={day}
              data-today={day === today ? "" : undefined}
              disabled={off}
              aria-pressed={selected}
              aria-label={`${dayFormat.format(day)}${mark?.label ? `, ${mark.label}` : ""}${off ? ", no disponible" : ""}`}
              onClick={() => onChange(day)}
              className={`relative flex h-12 flex-col items-center justify-center rounded-xl text-[15px] leading-tight [touch-action:manipulation] transition-[background-color,color,transform] duration-100 active:scale-95 motion-reduce:active:scale-100 ${
                selected ? "bg-brand font-semibold text-white" : off ? "text-muted/40" : "bg-blush/60 font-medium text-ink"
              } ${day === today && !selected ? "ring-2 ring-brand" : ""}`}
            >
              <span>{date}</span>
              {mark?.label ? <span className={`text-[10px] leading-none ${selected ? "text-white/90" : "text-muted"}`}>{mark.label}</span> : null}
              {mark?.dot ? <span aria-hidden className={`absolute top-1 right-1.5 size-2 rounded-full ${selected ? "bg-white" : "bg-warn-ink"}`} /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
