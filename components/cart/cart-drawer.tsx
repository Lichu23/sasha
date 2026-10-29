"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { Field } from "@base-ui/react/field";
import { Fieldset } from "@base-ui/react/fieldset";
import { Input } from "@base-ui/react/input";
import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { useCart, type ResolvedLine } from "@/components/cart/cart-provider";
import { BottomSheet, Drawer, SidePanel } from "@/components/ui/drawer";
import { QuantityField } from "@/components/ui/quantity-field";
import { Calendar } from "@/components/ui/calendar";
import { BagIcon, CalendarIcon, ChevronIcon, CloseIcon, PinIcon, WhatsappIcon } from "@/components/icons";
import { startCheckout } from "@/lib/checkout-actions";
import { saveLastOrder } from "@/lib/last-order";
import { formatPrice } from "@/lib/menu";
import { pickupDays } from "@/lib/pickup";
import { useNow } from "@/lib/use-now";
import { closedLabel, hasBranches, leadTimeLabel, lineLabel, locations, noun, paysOnline, shop } from "@/lib/shop";

const one = noun.g("una", "uno");

export function CartDrawer() {
  const { state, actions, meta } = useCart();

  return (
    <Drawer.Root
      open={state.isOpen}
      onOpenChange={(open) => (open ? actions.open() : actions.close())}
      swipeDirection="right"
    >
      <SidePanel>
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <Drawer.Title className="font-display text-2xl font-semibold">Tu pedido</Drawer.Title>
          <Drawer.Close className="grid size-10 place-items-center rounded-full hover:bg-blush" aria-label="Cerrar pedido">
            <CloseIcon />
          </Drawer.Close>
        </div>

        {meta.count === 0 ? <EmptyCart onBrowse={actions.close} /> : <CartContents />}
      </SidePanel>
    </Drawer.Root>
  );
}

function EmptyCart({ onBrowse }: { onBrowse: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
      <span className="grid size-16 place-items-center rounded-full bg-blush text-brand">
        <BagIcon width={28} height={28} />
      </span>
      <p className="font-display text-xl font-semibold">
        Todavía no elegiste {noun.g("ninguna", "ningún")} {noun.one}
      </p>
      <p className="text-sm text-muted">
        Encargá tu {noun.one} {noun.g("favorita", "favorito")} y {noun.g("retirala", "retiralo")} en el local.
      </p>
      <Link
        href="/take-away"
        onClick={onBrowse}
        className="mt-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-cream hover:bg-brand-ink"
      >
        Ver {noun.other} por encargo
      </Link>
    </div>
  );
}

function CartContents() {
  const { state, meta } = useCart();
  const [formState, formAction, pending] = useActionState(startCheckout, null);
  const items = JSON.stringify(
    state.lines.map(({ productId, sizeId, quantity }) => ({ productId, sizeId, quantity })),
  );
  const errors = formState?.fieldErrors ?? {};

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        const form = new FormData(e.currentTarget);
        const field = (key: string) => {
          const value = form.get(key);
          return typeof value === "string" ? value.trim() : "";
        };
        saveLastOrder({
          name: field("name"),
          phone: field("phone"),
          notes: field("notes"),
          location: field("location"),
          total: meta.total,
          items: state.lines.map((l) => ({
            productId: l.productId,
            sizeId: l.sizeId,
            label: lineLabel(l.product.name, l.size),
            quantity: l.quantity,
            unitPrice: l.size.price,
          })),
        });
      }}
      className="flex min-h-0 flex-1 flex-col"
    >
      <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">
        <ul className="divide-y divide-line">
          <AnimatePresence initial={false}>
            {state.lines.map((line) => (
              <CartRow key={line.key} line={line} />
            ))}
          </AnimatePresence>
        </ul>

        {hasBranches ? <LocationPicker error={errors.location} /> : null}
        <PickupPicker error={errors.pickup} />

        <Fieldset.Root className="mt-6 min-w-0 space-y-3">
          <Fieldset.Legend className="mb-2 font-semibold">¿Quién retira?</Fieldset.Legend>
          <TextField label="Nombre y apellido" error={errors.name}>
            <Input
              name="name"
              autoComplete="name"
              required
              maxLength={80}
              defaultValue={formState?.values?.name}
              placeholder="Ej: Lucía Fernández…"
              className={control}
            />
          </TextField>
          <TextField label="Teléfono / WhatsApp" error={errors.phone}>
            <Input
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              maxLength={20}
              defaultValue={formState?.values?.phone}
              placeholder="Ej: 11 2345-6789…"
              className={control}
            />
          </TextField>
          <TextField label="Comentarios (opcional)">
            <Field.Control
              render={<textarea rows={2} />}
              name="notes"
              maxLength={300}
              defaultValue={formState?.values?.notes}
              placeholder={shop.orders.notesPlaceholder ?? "Ej: retira mi hermana…"}
              className={control}
            />
          </TextField>
        </Fieldset.Root>
      </div>

      <div className="border-t border-line bg-paper px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <input type="hidden" name="items" value={items} />
        <div aria-live="polite">
          {formState?.error || errors.items ? (
            <p className="mb-3 rounded-xl bg-blush px-3 py-2 text-sm text-brand-ink">{formState?.error ?? errors.items}</p>
          ) : null}
        </div>
        <div className="mb-3 flex items-baseline justify-between">
          <span className="text-muted">Total</span>
          <span className="font-display text-2xl font-semibold tabular-nums">{formatPrice(meta.total)}</span>
        </div>
        {paysOnline ? (
          <>
            <button
              type="submit"
              disabled={pending}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#009ee3] px-5 py-3.5 font-semibold text-white transition-[background-color,transform] hover:bg-[#0089c7] active:scale-[0.98] disabled:opacity-70"
            >
              {pending ? "Conectando con Mercado Pago…" : "Pagar con Mercado Pago"}
            </button>
            <p className="mt-2 text-center text-xs text-muted">
              Pago seguro en Mercado Pago. Tu pedido se confirma al acreditarse el pago.
            </p>
          </>
        ) : (
          <>
            <button
              type="submit"
              disabled={pending}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#1a7f4b] px-5 py-3.5 font-semibold text-white transition-[background-color,transform] hover:bg-[#156b3f] active:scale-[0.98] disabled:opacity-70"
            >
              <WhatsappIcon /> {pending ? "Preparando tu pedido…" : "Pedir por WhatsApp"}
            </button>
            <p className="mt-2 text-center text-xs text-muted">
              Te armamos el mensaje con todo el pedido. Pagás al retirar.
            </p>
          </>
        )}
      </div>
    </form>
  );
}

function CartRow({ line }: { line: ResolvedLine }) {
  const { actions } = useCart();
  const sizeLabel = line.size.id === "unica" ? null : line.size.label;

  return (
    <m.li
      layout
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ type: "spring", duration: 0.35, bounce: 0 }}
      className="overflow-hidden"
    >
      <div className="flex gap-3 py-3">
        <div className="relative size-16 shrink-0 overflow-hidden rounded-2xl bg-blush">
          {line.product.image ? <Image src={line.product.image} alt="" fill sizes="64px" className="object-cover" /> : null}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{line.product.name}</p>
          {sizeLabel ? (
            <p className="text-sm text-muted">{shop.orders.sizePrefix ? `${shop.orders.sizePrefix} ${sizeLabel}` : sizeLabel}</p>
          ) : null}
          <div className="mt-2 flex items-center justify-between">
            {/* Going down to 0 removes the line. */}
            <QuantityField
              value={line.quantity}
              onChange={(quantity) => actions.setQuantity(line.key, quantity)}
              min={0}
              size="sm"
              label={`Cantidad de ${line.product.name}`}
              decrementLabel={line.quantity === 1 ? `Quitar ${line.product.name}` : `Restar ${one} ${line.product.name}`}
              incrementLabel={`Sumar ${one} ${line.product.name}`}
            />
            <span className="font-semibold tabular-nums">{formatPrice(line.subtotal)}</span>
          </div>
        </div>
      </div>
    </m.li>
  );
}

/** Branch choice, only for shops with more than one pickup point. */
function LocationPicker({ error }: { error?: string }) {
  return (
    <Fieldset.Root className="mt-6 min-w-0">
      <Fieldset.Legend className="mb-3 flex items-center gap-2 font-semibold">
        <PinIcon /> ¿Dónde lo retirás?
      </Fieldset.Legend>
      <RadioGroup name="location" defaultValue={locations[0].name} className="grid gap-2">
        {locations.map((location) => (
          <Radio.Root
            key={location.name}
            value={location.name}
            className="flex cursor-pointer items-center gap-3 rounded-2xl bg-paper px-4 py-2.5 text-left ring-1 ring-line transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand data-checked:bg-blush data-checked:ring-brand"
          >
            <span className="grid size-4 shrink-0 place-items-center rounded-full ring-1 ring-ink/40 in-data-checked:bg-brand in-data-checked:ring-brand">
              <Radio.Indicator className="size-1.5 rounded-full bg-white" />
            </span>
            <span>
              <span className="block font-semibold">{location.name}</span>
              <span className="block text-sm text-muted">{location.address}</span>
            </span>
          </Radio.Root>
        ))}
      </RadioGroup>
      {error ? <p className="mt-2 text-sm text-brand-ink">{error}</p> : null}
    </Fieldset.Root>
  );
}

const pickupHint = [leadTimeLabel && `Mínimo ${leadTimeLabel} de anticipación`, closedLabel].filter(Boolean).join(" · ");

function PickupPicker({ error }: { error?: string }) {
  const now = useNow();
  const days = useMemo(() => (now ? pickupDays(now) : []), [now]);
  const [dayKey, setDayKey] = useState<string | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);

  // Default to the earliest available slot so the form is valid without changes.
  const day = days.find((d) => d.key === dayKey) ?? days[0];
  const selected = day?.slots.find((s) => s.value === slot) ?? day?.slots[0];

  return (
    <Fieldset.Root className="mt-6 min-w-0">
      <Fieldset.Legend className="mb-1 flex items-center gap-2 font-semibold">
        <CalendarIcon /> ¿Cuándo lo retirás?
      </Fieldset.Legend>
      {pickupHint ? <p className="mb-3 text-sm text-muted">{pickupHint}.</p> : null}

      {day ? (
        <>
          {/* The earliest day is already chosen: the form is valid untouched. Tapping the date opens
              a sheet with the calendar, for people who want another day; they confirm there. */}
          <button
            type="button"
            onClick={() => {
              setDraft(day.key);
              setCalendarOpen(true);
            }}
            aria-haspopup="dialog"
            className="flex w-full items-center justify-between gap-3 rounded-2xl bg-paper px-4 py-3 text-left ring-1 ring-line transition-colors outline-none hover:ring-ink/40 focus-visible:ring-2 focus-visible:ring-brand"
          >
            <span className="first-letter:uppercase">{day.label}</span>
            <ChevronIcon className="shrink-0 -rotate-90 text-muted" />
          </button>
          <Drawer.Root open={calendarOpen} onOpenChange={setCalendarOpen}>
            <BottomSheet>
              <div className="px-5 pt-8 pb-5">
                <div className="mb-3 flex items-center justify-between">
                  <Drawer.Title className="font-display text-2xl font-semibold">Elegí el día</Drawer.Title>
                  <Drawer.Close className="grid size-10 place-items-center rounded-full hover:bg-blush" aria-label="Cerrar">
                    <CloseIcon />
                  </Drawer.Close>
                </div>
                <Calendar available={days.map((d) => d.key)} value={draft ?? day.key} onChange={setDraft} />
                <button
                  type="button"
                  onClick={() => {
                    if (draft && draft !== day.key) {
                      setDayKey(draft);
                      setSlot(null);
                    }
                    setCalendarOpen(false);
                  }}
                  className="mt-4 w-full rounded-full bg-brand px-5 py-3.5 font-semibold text-white transition-[background-color,transform] hover:bg-brand-ink active:scale-[0.98]"
                >
                  Confirmar
                </button>
              </div>
            </BottomSheet>
          </Drawer.Root>
          {/* Submitted as "pickup" through the group's hidden input. */}
          <RadioGroup
            name="pickup"
            aria-label="Horario de retiro"
            value={selected?.value ?? ""}
            onValueChange={(value: string) => setSlot(value)}
            className="mt-3 grid grid-cols-4 gap-2"
          >
            {day.slots.map((s) => (
              <Radio.Root
                key={s.value}
                value={s.value}
                className="cursor-pointer rounded-xl bg-paper py-2 text-center text-sm font-medium tabular-nums ring-1 ring-line transition-colors outline-none hover:ring-brand/50 focus-visible:ring-2 focus-visible:ring-brand data-checked:bg-brand data-checked:text-white data-checked:ring-brand"
              >
                {s.label}
              </Radio.Root>
            ))}
          </RadioGroup>
        </>
      ) : (
        <p className="text-sm text-muted">Calculando horarios disponibles…</p>
      )}
      {error ? <p className="mt-2 text-sm text-brand-ink">{error}</p> : null}
    </Fieldset.Root>
  );
}

const control =
  "w-full rounded-xl bg-paper px-3.5 py-2.5 text-base ring-1 ring-line outline-none focus:ring-2 focus:ring-brand data-invalid:ring-brand-ink";

/** Label, control and server-side error, wired together by Base UI's Field. */
function TextField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <Field.Root invalid={Boolean(error)} className="block">
      <Field.Label className="mb-1 block text-sm font-medium">{label}</Field.Label>
      {children}
      {error ? (
        <Field.Error match className="mt-1 block text-sm text-brand-ink">
          {error}
        </Field.Error>
      ) : null}
    </Field.Root>
  );
}
