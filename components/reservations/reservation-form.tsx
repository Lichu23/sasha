"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { CalendarIcon, CheckIcon, ClockIcon, WhatsappIcon } from "@/components/icons";
import { Calendar } from "@/components/ui/calendar";
import { capitalize, dayLabel, formatTime, startOfArDay } from "@/lib/admin-dates";
import { formatPickup, fromAr, toAr } from "@/lib/pickup";
import { maxPartySize, reservationActions, reservationDays, seatsLeft, useReservations } from "@/lib/reservations";
import { confirmsByEmail, greeting, shop, simulatedWhatsapp, whatsappLink } from "@/lib/shop";
import { useNow } from "@/lib/use-now";

// A table reservation asked for online: day, time (only the ones with room), party size, name and phone. It is saved
// for the shop (/admin/reservas) and WhatsApp opens with the request ready, like a consulta. Demo: see lib/reservations.ts.

const PHONE = /^\+?[\d\s()-]{8,20}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const HOUR_MS = 60 * 60 * 1000;
const control = "w-full rounded-xl bg-paper px-3.5 py-2.5 text-base ring-1 ring-line outline-none focus:ring-2 focus:ring-brand aria-invalid:ring-brand-ink";
const chip =
  "cursor-pointer rounded-xl bg-paper py-2.5 text-center text-sm font-medium tabular-nums ring-1 ring-line transition-colors outline-none hover:ring-brand/50 focus-visible:ring-2 focus-visible:ring-brand data-checked:bg-brand data-checked:text-white data-checked:ring-brand data-disabled:cursor-not-allowed data-disabled:opacity-40 data-disabled:line-through data-disabled:hover:ring-line";

type Errors = Partial<Record<"slot" | "name" | "phone" | "email", string>>;

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
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);

  // The kind of reservation (email mode): a table, a birthday, or a match. A match from the home page
  // (?partido=id) opens the form on "Partido" with its day and kick-off chosen already.
  const matchParam = useSearchParams().get("partido");
  const hasMatches = confirmsByEmail && Boolean(shop.matches?.length);
  const [kind, setKind] = useState<"mesa" | "cumple" | "partido">(hasMatches && shop.matches?.some((m) => m.id === matchParam) ? "partido" : "mesa");
  const [matchPick, setMatchPick] = useState<string | null>(matchParam);
  const birthday = kind === "cumple";

  // Each match with its kick-off and the day of the reservation form it belongs to (none when it can't be booked).
  const matchOptions = useMemo(() => {
    if (!now || !shop.matches) return [];
    const t = toAr(now);
    return shop.matches.flatMap((m) => {
      const at = fromAr(t.year, t.month, t.date + m.inDays, 0) + m.hour * HOUR_MS;
      const matchDay = days.find((d) => d.dayStart === startOfArDay(at));
      return matchDay?.slots.includes(at) ? [{ ...m, at, dayKey: matchDay.key }] : [];
    });
  }, [now, days]);
  const match = kind === "partido" ? (matchOptions.find((m) => m.id === matchPick) ?? matchOptions[0] ?? null) : null;

  const day = days.find((d) => d.key === (dayKey ?? match?.dayKey)) ?? days[0];
  const room = (at: number) => seatsLeft(at, list ?? []) >= people;
  const wanted = slot ?? (dayKey === null ? (match?.at ?? null) : null);
  // A time stops being valid when the party grows past what is left.
  const selected = day && wanted !== null && day.slots.includes(wanted) && room(wanted) ? wanted : null;
  const full = day ? day.slots.filter((t) => !room(t)).length : 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: Errors = {};
    if (selected === null) next.slot = "Elegí un horario con lugar.";
    if (name.trim().length < 2) next.name = "Contanos a nombre de quién es la reserva.";
    if (!PHONE.test(phone.trim())) next.phone = "Ingresá un teléfono válido, por ejemplo 341 234-5678.";
    if (confirmsByEmail && !EMAIL.test(email.trim())) next.email = "Ingresá un email válido, por ejemplo lucia@gmail.com.";
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

    const fullNotes = [match ? `Partido: ${match.home} vs ${match.away}` : "", birthday ? "Cumpleaños" : "", notes.trim()].filter(Boolean).join(" · ");
    reservationActions.add({
      ref,
      createdAt,
      at: selected,
      people,
      name: name.trim(),
      phone: phone.trim(),
      email: confirmsByEmail ? email.trim() : undefined,
      notes: confirmsByEmail ? fullNotes : notes.trim(),
      matchId: match?.id,
      // By email the reservation is confirmed at once; otherwise it waits for the shop on WhatsApp.
      status: confirmsByEmail ? "confirmada" : "consulta",
      messages: confirmsByEmail ? undefined : [{ from: "cliente", text: message, at: createdAt }],
      sample: false,
    });
    if (confirmsByEmail) {
      router.push(`/reservas/listo?ref=${ref}`);
      return;
    }
    // The demo's chat is part of the site; a live shop opens the real WhatsApp.
    if (simulatedWhatsapp) router.push(`/whatsapp?ref=${ref}&vista=cliente`);
    else window.location.assign(whatsappLink(message));
  }

  return (
    <form onSubmit={submit} noValidate className="mx-auto w-full max-w-xl px-4 pb-10 sm:px-6">
      {hasMatches ? (
        <fieldset className="mb-7 min-w-0">
          <legend className="mb-3 font-semibold">¿Qué tipo de reserva?</legend>
          <RadioGroup
            aria-label="Tipo de reserva"
            value={kind}
            onValueChange={(value: string) => {
              setKind(value as "mesa" | "cumple" | "partido");
              setDayKey(null);
              setSlot(null);
            }}
            className="grid grid-cols-3 gap-2"
          >
            {[
              ["mesa", "Una mesa"],
              ["cumple", "Cumpleaños"],
              ["partido", "Partido"],
            ].map(([value, label]) => (
              <Radio.Root key={value} value={value} className={`${chip} min-h-11 px-1`}>
                {label}
              </Radio.Root>
            ))}
          </RadioGroup>
          {kind === "partido" ? (
            <RadioGroup
              aria-label="Partido"
              value={match?.id ?? ""}
              onValueChange={(value: string) => {
                setMatchPick(value);
                setDayKey(null);
                setSlot(null);
              }}
              className="mt-3 grid gap-2"
            >
              {matchOptions.map((m) => (
                <Radio.Root key={m.id} value={m.id} className={`${chip} flex min-h-12 flex-col items-start px-4 text-left`}>
                  <span className="font-semibold">
                    {m.home} vs {m.away}
                  </span>
                  <span className="text-xs font-normal opacity-80">
                    {capitalize(dayLabel(m.at, now ?? m.at))} · {formatTime(m.at)} hs · {m.competition}
                  </span>
                </Radio.Root>
              ))}
            </RadioGroup>
          ) : null}
          {kind === "cumple" ? <p className="mt-2 text-sm text-muted">Anotamos que es un cumpleaños para recibirlos como corresponde. Contanos más en los comentarios.</p> : null}
        </fieldset>
      ) : null}
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
        <p className="mt-2 text-sm text-muted">
          Para más de {maxPartySize} personas, escribinos por{" "}
          <a href={whatsappLink(`${greeting} Quiero reservar una mesa para más de ${maxPartySize} personas.`)} target="_blank" rel="noreferrer" className="font-semibold text-brand-ink underline">
            WhatsApp
          </a>
          .
        </p>
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
          Teléfono
          <input
            name="phone"
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            maxLength={20}
            placeholder="Ej: 341 234-5678…"
            aria-invalid={Boolean(errors.phone)}
            className={`${control} mt-1 font-normal`}
          />
          {errors.phone ? <span className="mt-1 block text-brand-ink">{errors.phone}</span> : null}
        </label>
        {confirmsByEmail ? (
          <label className="block text-sm font-medium">
            Email
            <input
              name="email"
              type="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={120}
              placeholder="Ej: lucia@gmail.com…"
              aria-invalid={Boolean(errors.email)}
              className={`${control} mt-1 font-normal`}
            />
            {errors.email ? <span className="mt-1 block text-brand-ink">{errors.email}</span> : <span className="mt-1 block font-normal text-muted">Ahí te mandamos la confirmación.</span>}
          </label>
        ) : null}
        <label className="block text-sm font-medium">
          Comentarios (opcional)
          <textarea
            name="notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={300}
            placeholder={confirmsByEmail ? "Ej: una persona celíaca, un cochecito, mesa tranquila…" : "Ej: cumpleaños, un cochecito, una persona celíaca…"}
            className={`${control} mt-1 font-normal`}
          />
        </label>
      </fieldset>

      <button
        type="submit"
        disabled={sending}
        className={`mt-8 flex w-full items-center justify-center gap-2 rounded-full px-5 py-3.5 font-semibold text-white transition-[background-color,transform] active:scale-[0.98] disabled:opacity-70 ${
          confirmsByEmail ? "bg-brand hover:bg-brand-ink" : "bg-[#1a7f4b] hover:bg-[#156b3f]"
        }`}
      >
        {confirmsByEmail ? <CheckIcon /> : <WhatsappIcon />} {sending ? "Reservando…" : confirmsByEmail ? "Confirmar reserva" : "Reservar"}
      </button>
      <p className="mt-2 text-center text-xs text-muted">
        {confirmsByEmail
          ? "Tu mesa queda confirmada al instante y te mandamos un email con los datos y el botón para cancelar. No hace falta pagar nada."
          : `Te abrimos WhatsApp con tu pedido de mesa para que ${shop.shortName} lo confirme con vos. No hace falta pagar nada.`}
      </p>
    </form>
  );
}
