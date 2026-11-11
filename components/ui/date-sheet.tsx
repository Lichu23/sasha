"use client";

import { useState } from "react";
import { Calendar, type DayMark } from "@/components/ui/calendar";
import { BottomSheet, Drawer } from "@/components/ui/drawer";
import { CloseIcon } from "@/components/icons";
import { startOfArDay } from "@/lib/admin-dates";

// A sheet that rises from the bottom to pick a date (and, with `slotsFor`, a time of that day): the calendar is not
// drawn inside the card being edited, it opens over the page. Built on the same bottom sheet as the rest of the site.

export type TimeSlot = { at: number; label: string; hint?: string; disabled?: boolean };

export function DateTimeSheet({
  open,
  onOpenChange,
  title,
  today,
  value,
  onConfirm,
  onClear,
  clearLabel = "Ver todas las fechas",
  confirmLabel = "Aplicar",
  minDay,
  maxDay,
  isDayDisabled,
  marks,
  slotsFor,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Midnight (Argentina) of today. */
  today: number;
  /** A day (no `slotsFor`) or a moment (with it) to start from, or null. */
  value: number | null;
  /** The chosen day, or the chosen moment when `slotsFor` is given. */
  onConfirm: (value: number) => void;
  /** An extra way out for filters: show everything again. */
  onClear?: () => void;
  clearLabel?: string;
  confirmLabel?: string;
  minDay?: number;
  maxDay?: number;
  isDayDisabled?: (day: number) => boolean;
  marks?: (day: number) => DayMark | undefined;
  /** The times offered on a day. Without it, only the day is picked. */
  slotsFor?: (day: number) => TimeSlot[];
}) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} swipeDirection="down">
      <BottomSheet>
        {/* Mounted only while open, so it starts from `value` every time. */}
        <SheetBody
          title={title}
          today={today}
          value={value}
          onConfirm={(v) => {
            onConfirm(v);
            onOpenChange(false);
          }}
          onClear={
            onClear
              ? () => {
                  onClear();
                  onOpenChange(false);
                }
              : undefined
          }
          clearLabel={clearLabel}
          confirmLabel={confirmLabel}
          minDay={minDay}
          maxDay={maxDay}
          isDayDisabled={isDayDisabled}
          marks={marks}
          slotsFor={slotsFor}
        />
      </BottomSheet>
    </Drawer.Root>
  );
}

function SheetBody({
  title,
  today,
  value,
  onConfirm,
  onClear,
  clearLabel,
  confirmLabel,
  minDay,
  maxDay,
  isDayDisabled,
  marks,
  slotsFor,
}: {
  title: string;
  today: number;
  value: number | null;
  onConfirm: (value: number) => void;
  onClear?: () => void;
  clearLabel: string;
  confirmLabel: string;
  minDay?: number;
  maxDay?: number;
  isDayDisabled?: (day: number) => boolean;
  marks?: (day: number) => DayMark | undefined;
  slotsFor?: (day: number) => TimeSlot[];
}) {
  const [day, setDay] = useState<number | null>(value === null ? null : startOfArDay(value));
  const [slot, setSlot] = useState<number | null>(slotsFor ? value : null);
  const slots = day !== null && slotsFor ? slotsFor(day) : [];
  const chosen = slot !== null && slots.some((s) => s.at === slot && !s.disabled) ? slot : null;
  const ready = slotsFor ? chosen !== null : day !== null;

  return (
    <>
      <div className="flex items-center justify-between px-5 pt-7 pb-1">
        <Drawer.Title className="font-display text-2xl font-semibold">{title}</Drawer.Title>
        <Drawer.Close className="grid size-10 place-items-center rounded-full hover:bg-blush" aria-label="Cerrar">
          <CloseIcon />
        </Drawer.Close>
      </div>

      <div className="px-4 pb-2">
        <Calendar
          today={today}
          value={day}
          onChange={(d) => {
            setDay(d);
            setSlot(null);
          }}
          minDay={minDay}
          maxDay={maxDay}
          isDisabled={isDayDisabled}
          marks={marks}
        />

        {slotsFor ? (
          <div className="mt-3">
            <p className="text-sm font-semibold">{day === null ? "Elegí un día para ver los horarios" : "Horarios"}</p>
            {day !== null && slots.length === 0 ? <p className="mt-1 text-sm text-muted">No hay horarios este día.</p> : null}
            <div role="group" aria-label="Horarios" className="mt-2 grid grid-cols-4 gap-2">
              {slots.map((s) => (
                <button
                  key={s.at}
                  type="button"
                  data-slot={s.at}
                  disabled={s.disabled}
                  aria-pressed={s.at === chosen}
                  onClick={() => setSlot(s.at)}
                  className="flex min-h-12 flex-col items-center justify-center rounded-xl bg-paper px-1 py-1.5 text-sm font-medium tabular-nums ring-1 ring-line [touch-action:manipulation] transition-[background-color,color,transform] duration-100 active:scale-95 disabled:opacity-40 aria-pressed:bg-brand aria-pressed:text-white aria-pressed:ring-brand motion-reduce:active:scale-100"
                >
                  <span>{s.label}</span>
                  {s.hint ? <span className="text-[10px] leading-none opacity-75">{s.hint}</span> : null}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {/* Stays in view while the times scroll: the sheet's bottom edge runs 3rem past the screen (see ui/drawer.tsx). */}
      <div className="sticky bottom-[calc(3rem+env(safe-area-inset-bottom))] z-10 mt-2 flex flex-col gap-2 border-t border-line bg-cream px-5 pt-3 pb-3">
        <button
          type="button"
          disabled={!ready}
          onClick={() => ready && onConfirm(slotsFor ? (chosen as number) : (day as number))}
          className="min-h-12 w-full rounded-full bg-brand px-5 font-semibold text-white [touch-action:manipulation] transition-[background-color,transform] hover:bg-brand-ink active:scale-[0.98] disabled:opacity-50 motion-reduce:active:scale-100"
        >
          {confirmLabel}
        </button>
        {onClear ? (
          <button type="button" onClick={onClear} className="min-h-11 rounded-full px-4 text-sm font-semibold text-muted [touch-action:manipulation] hover:text-ink">
            {clearLabel}
          </button>
        ) : null}
      </div>
    </>
  );
}
