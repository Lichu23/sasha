"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { CalendarIcon, ClockIcon, WhatsappIcon } from "@/components/icons";
import { Calendar } from "@/components/ui/calendar";
import { formatTime, startOfArDay } from "@/lib/admin-dates";
import { formatPickup } from "@/lib/pickup";
import { maxPartySize, reservationActions, reservationDays, seatsLeft, useReservations } from "@/lib/reservations";
import { greeting, shop, simulatedWhatsapp, whatsappLink } from "@/lib/shop";
import { useNow } from "@/lib/use-now";

// A table reservation asked for online: day, time (only the ones with room), party size, name and phone. It is saved
// for the shop (/admin/reservas) and WhatsApp opens with the request ready, like a consulta. Demo: see lib/reservations.ts.

const PHONE = /^\+?[\d\s()-]{8,20}$/;
const control = "w-full rounded-xl bg-paper px-3.5 py-2.5 text-base ring-1 ring-line outline-none focus:ring-2 focus:ring-brand aria-invalid:ring-brand-ink";
const chip =
  "cursor-pointer rounded-xl bg-paper py-2.5 text-center text-sm font-medium tabular-nums ring-1 ring-line transition-colors outline-none hover:ring-brand/50 focus-visible:ring-2 focus-visible:ring-brand data-checked:bg-brand data-checked:text-white data-checked:ring-brand data-disabled:cursor-not-allowed data-disabled:opacity-40 data-disabled:line-through data-disabled:hover:ring-line";

type Errors = Partial<Record<"slot" | "name" | "phone", string>>;

export function ReservationForm() {
  const router = useRouter();
  const now = useNow();
  const list = useReservations();
  const days = useMemo(() => (now ? reservationDays(now) : []), [now]);
  const [dayKey, setDayKey] = useState<string | null>(null);
  const [slot, setSlot] = useState<number | null>(null);
  const [people, setPeople] = useState(2);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);

  const day = days.find((d) => d.key === dayKey) ?? days[0];
  const room = (at: number) => seatsLeft(at, list ?? []) >= people;
  // A time stops being valid when the party grows past what is left.
  const selected = day && slot !== null && day.slots.includes(slot) && room(slot) ? slot : null;
  const full = day ? day.slots.filter((t) => !room(t)).length : 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: Errors = {};
    if (selected === null) next.slot = "Elegí un horario con lugar.";
    if (name.trim().length < 2) next.name = "Contanos a nombre de quién es la reserva.";
    if (!PHONE.test(phone.trim())) next.phone = "Ingresá un teléfono válido, por ejemplo 11 2345-6789.";
    setErrors(next);
    if (Object.keys(next).length || selected === null) return;

    setSending(true);
    const createdAt = Date.now();
    const ref = `${shop.orders.referencePrefix}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const message = [
      `${greeting} Quiero reservar una mesa (${ref}):`,
      `• ${formatPickup(selected).replace(/^./, (c) => c.toUpperCase())}`,
      `• ${people} ${people === 1 ? "persona" : "personas"}`,
      `A nombre de: ${name.trim()} (${phone.trim()})`,
      notes.trim() ? `Comentarios: ${notes.trim()}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    reservationActions.add({
      ref,
      createdAt,
      at: selected,
      people,
      name: name.trim(),
      phone: phone.trim(),
      notes: notes.trim(),
      status: "consulta",
      messages: [{ from: "cliente", text: message, at: createdAt }],
      sample: false,
    });
    // The demo's chat is part of the site; a live shop opens the real WhatsApp.
    if (simulatedWhatsapp) router.push(`/whatsapp?ref=${ref}&vista=cliente`);
    else window.location.assign(whatsappLink(message));
  }

  return (
    <form onSubmit={submit} noValidate className="mx-auto w-full max-w-xl px-4 pb-10 sm:px-6">
      <fieldset className="min-w-0">
        <legend className="mb-3 flex items-center gap-2 font-semibold">
          <CalendarIcon /> ¿Qué día?
        </legend>
        {day && now !== null ? (
          <>
            <Calendar
              today={startOfArDay(now)}
              value={day.dayStart}
              onChange={(d) => {
                setDayKey(String(d));
                setSlot(null);
              }}
              minDay={startOfArDay(now)}
              maxDay={days.at(-1)?.dayStart}
              isDisabled={(d) => !days.some((x) => x.dayStart === d)}
              className="rounded-2xl bg-paper p-3 ring-1 ring-line"
            />
            <p className="mt-2 text-sm text-muted first-letter:uppercase">{day.label}</p>
          </>
        ) : (
          <p className="text-sm text-muted">Calculando días disponibles…</p>
        )}
      </fieldset>

      <fieldset className="mt-7 min-w-0">
        <legend className="mb-3 font-semibold">¿Cuántos son?</legend>
        <div className="flex items-center gap-3" role="group" aria-label="Cantidad de personas">
          <button
            type="button"
            aria-label="Una persona menos"
            disabled={people <= 1}
            onClick={() => setPeople((n) => Math.max(1, n - 1))}
            className="grid size-12 place-items-center rounded-full bg-paper text-2xl leading-none ring-1 ring-line [touch-action:manipulation] transition-transform active:scale-95 disabled:opacity-40 motion-reduce:active:scale-100"
          >
            −
          </button>
          <p className="min-w-28 text-center text-lg font-semibold tabular-nums" aria-live="polite">
            {people} {people === 1 ? "persona" : "personas"}
          </p>
          <button
            type="button"
            aria-label="Una persona más"
            disabled={people >= maxPartySize}
            onClick={() => setPeople((n) => Math.min(maxPartySize, n + 1))}
            className="grid size-12 place-items-center rounded-full bg-paper text-2xl leading-none ring-1 ring-line [touch-action:manipulation] transition-transform active:scale-95 disabled:opacity-40 motion-reduce:active:scale-100"
          >
            +
          </button>
        </div>
        <p className="mt-2 text-sm text-muted">Para más de {maxPartySize} personas, escribinos por WhatsApp.</p>
      </fieldset>

      <fieldset className="mt-7 min-w-0">
        <legend className="mb-3 flex items-center gap-2 font-semibold">
          <ClockIcon /> ¿A qué hora?
        </legend>
        {day ? (
          <>
            <RadioGroup
              aria-label="Horario de la reserva"
              value={selected === null ? "" : String(selected)}
              onValueChange={(value: string) => setSlot(Number(value))}
              className="grid grid-cols-4 gap-2"
            >
              {day.slots.map((t) => (
                <Radio.Root key={t} value={String(t)} disabled={!room(t)} aria-label={`${formatTime(t)}${room(t) ? "" : `, sin lugar para ${people} personas`}`} className={chip}>
                  {formatTime(t)}
                </Radio.Root>
              ))}
            </RadioGroup>
            {full > 0 ? <p className="mt-2 text-sm text-muted">Los horarios tachados no tienen lugar para {people} {people === 1 ? "persona" : "personas"}.</p> : null}
          </>
        ) : null}
        {errors.slot ? <p className="mt-2 text-sm text-brand-ink">{errors.slot}</p> : null}
      </fieldset>

      <fieldset className="mt-7 min-w-0 space-y-4">
        <legend className="mb-3 font-semibold">¿A nombre de quién?</legend>
        <label className="block text-sm font-medium">
          Nombre y apellido
          <input
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            maxLength={80}
            placeholder="Ej: Lucía Fernández…"
            aria-invalid={Boolean(errors.name)}
            className={`${control} mt-1 font-normal`}
          />
          {errors.name ? <span className="mt-1 block text-brand-ink">{errors.name}</span> : null}
        </label>
        <label className="block text-sm font-medium">
          Teléfono / WhatsApp
          <input
            name="phone"
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            maxLength={20}
            placeholder="Ej: 11 2345-6789…"
            aria-invalid={Boolean(errors.phone)}
            className={`${control} mt-1 font-normal`}
          />
          {errors.phone ? <span className="mt-1 block text-brand-ink">{errors.phone}</span> : null}
        </label>
        <label className="block text-sm font-medium">
          Comentarios (opcional)
          <textarea
            name="notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={300}
            placeholder="Ej: cumpleaños, un cochecito, una persona celíaca…"
            className={`${control} mt-1 font-normal`}
          />
        </label>
      </fieldset>

      <button
        type="submit"
        disabled={sending}
        className="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-[#1a7f4b] px-5 py-3.5 font-semibold text-white transition-[background-color,transform] hover:bg-[#156b3f] active:scale-[0.98] disabled:opacity-70"
      >
        <WhatsappIcon /> {sending ? "Preparando tu reserva…" : "Reservar"}
      </button>
      <p className="mt-2 text-center text-xs text-muted">
        Te abrimos WhatsApp con tu pedido de mesa para que {shop.shortName} lo confirme con vos. No hace falta pagar nada.
      </p>
    </form>
  );
}
