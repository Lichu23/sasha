"use client";

import { useState } from "react";
import { CloseIcon } from "@/components/icons";
import { BottomSheet, Drawer } from "@/components/ui/drawer";
import { Segmented } from "@/components/ui/segmented";
import { money, payLabel, say, type PayMethod, type Venue } from "@/lib/booking/venues";
import { control, LockIcon, primaryButton } from "./ui";

// The booking sheet: who it is for and a simulated payment (card or Bizum). Nothing is charged: the demo only shows
// the step a real business would have with its payment provider (Stripe, Redsys), paid to the business's own account.

export type Contact = { name: string; phone: string; notes: string; method: PayMethod };

const PHONE = /^\+?[\d\s()-]{9,20}$/;
type Errors = Partial<Record<"name" | "phone" | "card" | "expiry" | "cvc", string>>;

const digits = (s: string) => s.replace(/\D/g, "");
const formatCard = (s: string) => digits(s).slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
const formatExpiry = (s: string) => {
  const d = digits(s).slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

export function PaySheet({
  venue,
  open,
  onOpenChange,
  title,
  lines,
  amount,
  askNotes,
  notesLabel,
  onPaid,
}: {
  venue: Venue;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** What is being booked, one line each. */
  lines: string[];
  /** The full price, paid now. */
  amount: number;
  askNotes?: boolean;
  notesLabel?: string;
  onPaid: (contact: Contact) => void;
}) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} swipeDirection="down">
      <BottomSheet>
        {/* Mounted only while open: every booking starts from an empty form. */}
        <SheetBody venue={venue} title={title} lines={lines} amount={amount} askNotes={askNotes} notesLabel={notesLabel} onPaid={onPaid} />
      </BottomSheet>
    </Drawer.Root>
  );
}

function SheetBody({
  venue,
  title,
  lines,
  amount,
  askNotes,
  notesLabel,
  onPaid,
}: {
  venue: Venue;
  title: string;
  lines: string[];
  amount: number;
  askNotes?: boolean;
  notesLabel?: string;
  onPaid: (contact: Contact) => void;
}) {
  const [method, setMethod] = useState<PayMethod>(venue.payments[0]);
  const ar = venue.locale === "es-AR";
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [card, setCard] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [paying, setPaying] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: Errors = {};
    if (name.trim().length < 2) next.name = say(venue, "Escribe tu nombre y apellido.", "Escribí tu nombre y apellido.");
    if (!PHONE.test(phone.trim())) next.phone = say(venue, "Escribe un teléfono válido, por ejemplo 612 345 678.", "Escribí un teléfono válido, por ejemplo 11 2345-6789.");
    if (method === "tarjeta") {
      if (digits(card).length < 15) next.card = say(venue, "Revisa el número de la tarjeta.", "Revisá el número de la tarjeta.");
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) next.expiry = "Usa el formato MM/AA.";
      if (digits(cvc).length < 3) next.cvc = "3 dígitos.";
    }
    setErrors(next);
    if (Object.keys(next).length) return;
    setPaying(true);
    // The demo's "bank": a moment of processing, then it is paid.
    setTimeout(() => onPaid({ name: name.trim(), phone: phone.trim(), notes: notes.trim(), method }), 1400);
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className="flex items-center justify-between px-5 pt-7 pb-1">
        <Drawer.Title className="font-display text-2xl font-semibold">{title}</Drawer.Title>
        <Drawer.Close className="grid size-10 place-items-center rounded-full hover:bg-blush" aria-label="Cerrar">
          <CloseIcon />
        </Drawer.Close>
      </div>

      <div className="space-y-5 px-5 pb-4">
        <div className="rounded-2xl bg-blush px-4 py-3">
          {lines.map((line, i) => (
            <p key={line} className={i === 0 ? "font-semibold" : "text-sm text-muted first-letter:uppercase"}>
              {line}
            </p>
          ))}
        </div>

        <fieldset className="min-w-0 space-y-3">
          <legend className="mb-2 font-semibold">¿A nombre de quién?</legend>
          <label className="block text-sm font-medium">
            Nombre y apellido
            <input name="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={80} placeholder={ar ? "Ej: Lucía Fernández…" : "Ej: Lucía Fernández…"} aria-invalid={Boolean(errors.name)} className={`${control} mt-1 font-normal`} />
            {errors.name ? <span className="mt-1 block text-brand-ink">{errors.name}</span> : null}
          </label>
          <label className="block text-sm font-medium">
            Teléfono / WhatsApp
            <input name="phone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" maxLength={20} placeholder={ar ? "Ej: 11 2345-6789…" : "Ej: 612 345 678…"} aria-invalid={Boolean(errors.phone)} className={`${control} mt-1 font-normal`} />
            {errors.phone ? <span className="mt-1 block text-brand-ink">{errors.phone}</span> : null}
          </label>
          {askNotes ? (
            <label className="block text-sm font-medium">
              {notesLabel ?? "Comentarios (opcional)"}
              <textarea name="notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={200} className={`${control} mt-1 font-normal`} />
            </label>
          ) : null}
        </fieldset>

        <fieldset className="min-w-0">
          <legend className="mb-2 flex w-full items-center justify-between font-semibold">
            <span>Pago</span>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-muted">
              <LockIcon className="size-3.5" /> Pago de prueba
            </span>
          </legend>
          <Segmented
            label="Forma de pago"
            value={method}
            onChange={(v) => {
              setMethod(v);
              setErrors({});
            }}
            options={venue.payments.map((value) => ({ value, label: payLabel[value] }))}
          />
          {method === "tarjeta" ? (
            <div className="mt-3 space-y-3">
              <label className="block text-sm font-medium">
                Número de tarjeta
                <input name="card" inputMode="numeric" autoComplete="cc-number" value={card} onChange={(e) => setCard(formatCard(e.target.value))} placeholder="4242 4242 4242 4242" aria-invalid={Boolean(errors.card)} className={`${control} mt-1 font-normal tabular-nums`} />
                {errors.card ? <span className="mt-1 block text-brand-ink">{errors.card}</span> : null}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm font-medium">
                  Caducidad
                  <input name="expiry" inputMode="numeric" autoComplete="cc-exp" value={expiry} onChange={(e) => setExpiry(formatExpiry(e.target.value))} placeholder="MM/AA" aria-invalid={Boolean(errors.expiry)} className={`${control} mt-1 font-normal tabular-nums`} />
                  {errors.expiry ? <span className="mt-1 block text-brand-ink">{errors.expiry}</span> : null}
                </label>
                <label className="block text-sm font-medium">
                  CVC
                  <input name="cvc" inputMode="numeric" autoComplete="cc-csc" value={cvc} onChange={(e) => setCvc(digits(e.target.value).slice(0, 4))} placeholder="123" aria-invalid={Boolean(errors.cvc)} className={`${control} mt-1 font-normal tabular-nums`} />
                  {errors.cvc ? <span className="mt-1 block text-brand-ink">{errors.cvc}</span> : null}
                </label>
              </div>
            </div>
          ) : (
            <p className="mt-3 rounded-xl bg-paper px-3.5 py-3 text-sm ring-1 ring-line">
              {method === "mercadopago"
                ? "Al continuar te llevamos a Mercado Pago para que apruebes el pago con tu cuenta, tu tarjeta guardada o el dinero disponible."
                : `Al continuar recibirás una notificación en la app de tu banco para aprobar el pago con Bizum al ${phone.trim() || "teléfono que has indicado"}.`}
            </p>
          )}
        </fieldset>

        <div className="flex items-baseline justify-between border-t border-line pt-3">
          <span className="text-sm text-muted">{venue.deposit ? "Seña a pagar ahora" : "Total"}</span>
          <span className="font-display text-2xl font-semibold tabular-nums">{money(venue, amount)}</span>
        </div>
      </div>

      <div className="sticky bottom-[calc(-1*env(safe-area-inset-bottom))] z-10 border-t border-line bg-cream px-5 pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
        <button type="submit" data-cta="pagar" disabled={paying} className={primaryButton}>
          {paying ? "Procesando el pago…" : `Pagar ${money(venue, amount)} y reservar`}
        </button>
      </div>
    </form>
  );
}
