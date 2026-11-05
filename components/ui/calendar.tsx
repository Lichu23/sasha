"use client";

import { useState } from "react";
import { ChevronIcon } from "@/components/icons";
import { dayKey } from "@/lib/pickup";

const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"]; // weeks start on Monday
const monthName = new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric", timeZone: "UTC" });
const dayName = new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

/** "2026-10-31" style parts of a day key. */
const parse = (key: string) => key.split("-").map(Number) as [number, number, number];

/**
 * A month calendar where only `available` days can be picked (closed days and days before the
 * lead time are shown dimmed). The month arrows stop at the first and last month with a pickable day.
 */
export function Calendar({
  available,
  value,
  onChange,
}: {
  available: readonly string[];
  value: string;
  onChange: (key: string) => void;
}) {
  const open = new Set(available);
  const first = parse(available[0] ?? value);
  const last = parse(available.at(-1) ?? value);
  const [vy, vm] = parse(value);
  const [view, setView] = useState({ year: vy, month: vm - 1 });

  const index = (y: number, m: number) => y * 12 + m;
  const canPrev = index(view.year, view.month) > index(first[0], first[1] - 1);
  const canNext = index(view.year, view.month) < index(last[0], last[1] - 1);
  const go = (delta: number) => {
    const t = index(view.year, view.month) + delta;
    setView({ year: Math.floor(t / 12), month: t % 12 });
  };

  const lead = (new Date(Date.UTC(view.year, view.month, 1)).getUTCDay() + 6) % 7;
  const count = new Date(Date.UTC(view.year, view.month + 1, 0)).getUTCDate();
  const cells = [...Array<null>(lead).fill(null), ...Array.from({ length: count }, (_, i) => i + 1)];

  const arrow = "grid size-9 place-items-center rounded-full outline-none transition-colors hover:bg-blush focus-visible:ring-2 focus-visible:ring-brand disabled:pointer-events-none disabled:opacity-30";

  return (
    <div className="rounded-2xl bg-paper p-3 ring-1 ring-line">
      <div className="mb-2 flex items-center justify-between">
        <button type="button" onClick={() => go(-1)} disabled={!canPrev} aria-label="Mes anterior" className={arrow}>
          <ChevronIcon className="rotate-90" />
        </button>
        <p aria-live="polite" className="font-semibold first-letter:uppercase">
          {monthName.format(Date.UTC(view.year, view.month, 1))}
        </p>
        <button type="button" onClick={() => go(1)} disabled={!canNext} aria-label="Mes siguiente" className={arrow}>
          <ChevronIcon className="-rotate-90" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center">
        {WEEKDAYS.map((d, i) => (
          <span key={i} aria-hidden="true" className="pb-1 text-xs font-medium text-muted">
            {d}
          </span>
        ))}
        {cells.map((date, i) => {
          if (date === null) return <span key={`blank-${i}`} />;
          const key = dayKey(view.year, view.month, date);
          const enabled = open.has(key);
          const selected = key === value;
          return (
            <button
              key={key}
              type="button"
              disabled={!enabled}
              aria-pressed={selected}
              aria-label={dayName.format(Date.UTC(view.year, view.month, date))}
              onClick={() => onChange(key)}
              className={`mx-auto grid size-10 place-items-center rounded-full text-sm tabular-nums outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand ${
                selected
                  ? "bg-ink font-semibold text-cream"
                  : enabled
                    ? "font-medium hover:bg-blush"
                    : "pointer-events-none text-muted/40"
              }`}
            >
              {date}
            </button>
          );
        })}
      </div>
    </div>
  );
}
