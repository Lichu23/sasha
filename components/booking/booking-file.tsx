"use client";

import { useState } from "react";
import Image from "next/image";
import { CloseIcon } from "@/components/icons";
import { BottomSheet, Drawer } from "@/components/ui/drawer";
import { Segmented } from "@/components/ui/segmented";
import { dayLabel, formatTime } from "@/lib/admin-dates";
import type { Booking } from "@/lib/booking/availability";
import { MAIL_IMAGES, MAIL_TEMPLATES } from "@/lib/booking/emails";
import { bookingActions } from "@/lib/booking/store";
import { money, offerOf, payLabel, type PayMethod, type Venue } from "@/lib/booking/venues";
import { VisitEmail } from "./email-preview";
import { CheckIcon, control, primaryButton } from "./ui";

// The file of one turno in the panel: the patient's data, the payment confirmed by hand, a private note and the email sent
// after the consultation (a template plus pictures). Everything is saved on the booking itself; no email really leaves.

const section = "border-t border-line pt-5";
const heading = "text-sm font-semibold tracking-wide text-brand-ink uppercase";

export function BookingFile({ venue, booking, now, onClose }: { venue: Venue; booking: Booking | null; now: number; onClose: () => void }) {
  return (
    <Drawer.Root open={Boolean(booking)} onOpenChange={(open) => !open && onClose()} swipeDirection="down">
      <BottomSheet>{booking ? <FileBody key={booking.id} venue={venue} booking={booking} now={now} /> : null}</BottomSheet>
    </Drawer.Root>
  );
}

function FileBody({ venue, booking, now }: { venue: Venue; booking: Booking; now: number }) {
  const actions = bookingActions(venue);
  const offer = offerOf(venue, booking.offer);
  const [method, setMethod] = useState<PayMethod>(venue.payments[0]);
  const [note, setNote] = useState(booking.visit?.note ?? "");
  const [template, setTemplate] = useState(booking.visit?.mail?.template ?? MAIL_TEMPLATES[0].id);
  const [images, setImages] = useState<string[]>(booking.visit?.mail?.images ?? []);
  const collected = booking.paid > 0;
  const sent = booking.visit?.mail;
  const noteSaved = (booking.visit?.note ?? "") === note.trim() && note.trim() !== "";

  const toggle = (id: string) => setImages((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]));
  const visit = (patch: NonNullable<Booking["visit"]>) => actions.update(booking.id, { visit: { ...booking.visit, ...patch } });

  return (
    <div>
      <div className="flex items-start justify-between gap-3 px-5 pt-7 pb-1">
        <div className="min-w-0">
          <Drawer.Title className="font-display text-2xl leading-tight font-semibold">{booking.name}</Drawer.Title>
          <Drawer.Description className="mt-0.5 text-sm text-muted first-letter:uppercase">
            {offer?.name} · {dayLabel(booking.start, now)}, {formatTime(booking.start)} h{booking.modality ? ` · ${booking.modality === "online" ? "Online" : "Presencial"}` : ""}
          </Drawer.Description>
        </div>
        <Drawer.Close className="grid size-10 shrink-0 place-items-center rounded-full hover:bg-blush" aria-label="Cerrar">
          <CloseIcon />
        </Drawer.Close>
      </div>

      <div className="space-y-5 px-5 pt-3 pb-6">
        <dl className="divide-y divide-line rounded-2xl bg-paper px-4 ring-1 ring-line">
          {[
            ["Teléfono", booking.phone],
            ["Email", booking.email ?? "–"],
            ["Motivo", booking.notes || "–"],
          ].map(([label, value]) => (
            <div key={label} className="flex items-baseline justify-between gap-4 py-2.5">
              <dt className="text-sm text-muted">{label}</dt>
              <dd className="min-w-0 text-right text-sm font-medium break-words">{value}</dd>
            </div>
          ))}
        </dl>

        <div className={section}>
          <h3 className={heading}>Cobro</h3>
          {collected ? (
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-semibold text-emerald-800">
                <CheckIcon className="size-4" /> Cobrado {money(venue, booking.paid)} · {payLabel[booking.method]}
              </p>
              <button type="button" onClick={() => actions.update(booking.id, { paid: 0 })} className="min-h-11 px-2 text-sm font-semibold text-brand-ink [touch-action:manipulation]">
                Deshacer
              </button>
            </div>
          ) : (
            <>
              <p className="mt-2 text-sm text-muted">Pendiente: {money(venue, booking.price)}. Confirmalo cuando el paciente pague, antes o después de la consulta.</p>
              <Segmented label="Forma de cobro" value={method} onChange={setMethod} options={venue.payments.map((value) => ({ value, label: payLabel[value] }))} className="mt-3" />
              <button type="button" data-cta="cobrar" onClick={() => actions.update(booking.id, { paid: booking.price, method })} className={`${primaryButton} mt-3`}>
                Confirmar cobro · {money(venue, booking.price)}
              </button>
            </>
          )}
        </div>

        <div className={section}>
          <h3 className={heading}>Notas de la consulta</h3>
          <label className="mt-3 block text-sm font-medium">
            <span className="sr-only">Nota privada</span>
            <textarea name="visitNote" rows={3} value={note} onChange={(e) => setNote(e.target.value)} maxLength={400} placeholder="Peso, medidas, indicaciones… (solo la ves vos)" className={`${control} font-normal`} />
          </label>
          <button type="button" data-cta="guardar-nota" disabled={!note.trim() || noteSaved} onClick={() => visit({ note: note.trim() })} className={`${primaryButton} mt-2`}>
            {noteSaved ? "Nota guardada" : "Guardar nota"}
          </button>
        </div>

        <div className={section}>
          <h3 className={heading}>Email para el paciente</h3>
          <Segmented label="Plantilla" value={template} onChange={setTemplate} options={MAIL_TEMPLATES.map((t) => ({ value: t.id, label: t.name }))} className="mt-3" />
          <p className="mt-4 text-sm font-medium">Adjuntar imágenes</p>
          <ul aria-label="Imágenes para adjuntar" className="mt-2 grid grid-cols-3 gap-2">
            {MAIL_IMAGES.map((image) => (
              <li key={image.id}>
                <button
                  type="button"
                  data-image={image.id}
                  aria-pressed={images.includes(image.id)}
                  onClick={() => toggle(image.id)}
                  className="relative block w-full overflow-hidden rounded-xl bg-paper text-left ring-1 ring-line [touch-action:manipulation] transition-[box-shadow,transform] active:scale-[0.97] aria-pressed:ring-2 aria-pressed:ring-brand"
                >
                  <Image src={image.src} alt="" width={320} height={220} unoptimized className="h-auto w-full" />
                  <span className="block px-2 py-1.5 text-xs font-medium">{image.label}</span>
                  {images.includes(image.id) ? (
                    <span aria-hidden className="absolute top-1.5 right-1.5 grid size-5 place-items-center rounded-full bg-brand text-white">
                      <CheckIcon className="size-3" />
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm font-medium">Así le llega</p>
          <div className="mt-2">
            <VisitEmail venue={venue} booking={booking} templateId={template} images={images} />
          </div>
          <button type="button" data-cta="enviar-email" disabled={Boolean(sent)} onClick={() => visit({ mail: { template, images, sentAt: now } })} className={`${primaryButton} mt-3`}>
            {sent ? `Enviado a ${booking.email}` : "Enviar email"}
          </button>
        </div>
      </div>
    </div>
  );
}
