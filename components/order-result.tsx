"use client";

import Link from "next/link";
import { useEffect } from "react";
import { m } from "motion/react";
import { useCart } from "@/components/cart/cart-provider";
import { AlertIcon, CheckIcon, ClockIcon, PinIcon, WhatsappIcon } from "@/components/icons";
import { ShopBrand } from "@/components/shop-logo";
import { greeting, locationLabel, locations, noun, shop, whatsappLink } from "@/lib/shop";
import { useLastOrder } from "@/lib/last-order";
import { orderActions, useOrders, type Order } from "@/lib/orders";
import { formatPrice } from "@/lib/menu";
import { formatPickup } from "@/lib/pickup";

export type OrderStatus = "approved" | "demo" | "pending" | "rejected" | "whatsapp" | "sent";

const scheduled = `Recibimos tu pago. Ya estamos agendando tu ${noun.one}.`;

const COPY = {
  approved: { title: "¡Pedido confirmado!", text: scheduled },
  demo: { title: "¡Pedido confirmado!", text: scheduled },
  whatsapp: {
    title: "¡Ya casi está!",
    text: `Enviá el pedido por WhatsApp para que ${shop.shortName} lo confirme. Pagás al retirar.`,
  },
  pending: {
    title: "Pago en proceso",
    text: "Te avisamos por mail apenas se acredite. Guardamos tu horario de retiro.",
  },
  rejected: {
    title: "El pago no se completó",
    text: "No se realizó ningún cobro. Tu pedido sigue guardado para que lo intentes de nuevo.",
  },
} as const;

/**
 * Shops that confirm orders (needsApproval): what the customer reads about an order they sent. It follows the
 * shop's answer in /admin (demo: same browser, this page updates when the shop answers).
 */
function sentCopy(live?: Order) {
  switch (live?.status) {
    case "confirmado":
    case "completado":
      return { kind: "ok", title: "¡Pedido confirmado!", text: `${shop.shortName} confirmó tu pedido. Pagás al retirar.` } as const;
    case "rechazado":
      return { kind: "warn", title: "No pudimos tomar tu pedido", text: `${live.reason ? `${live.reason}. ` : ""}Perdón por las molestias.` } as const;
    case "reprogramado":
      return {
        kind: "warn",
        title: "Te proponemos otro horario",
        text: `${shop.shortName} puede tenerlo listo ${live.proposedPickup ? formatPickup(live.proposedPickup) : "en otro horario"}. ¿Te sirve?`,
      } as const;
    default:
      return { kind: "wait", title: "¡Pedido enviado!", text: `${shop.shortName} lo revisa y te confirma por WhatsApp. No se cobra nada ahora.` } as const;
  }
}

const MAX_LISTED_ITEMS = 2;

const rise = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
};

/** Full-screen order result shown after checkout; sized to fit a phone without scrolling. */
export function OrderResult({
  status,
  reference,
  pickup,
}: {
  status: OrderStatus;
  reference: string | null;
  pickup: number | null;
}) {
  const { actions } = useCart();
  const order = useLastOrder();
  const sent = status === "sent";
  const live = useOrders()?.find((o) => o.ref === reference);
  const answer = sent ? sentCopy(live) : null;
  const confirmed = status === "approved" || status === "demo";
  const viaWhatsapp = status === "whatsapp";
  const showSummary = status !== "rejected";
  const copy = answer ?? COPY[status as Exclude<OrderStatus, "sent">];
  const tone = answer ? answer.kind : confirmed || viaWhatsapp ? "ok" : "warn";
  // An accepted new time replaces the one in the URL.
  const shownPickup = live?.pickup ?? pickup;

  // The drawer may still be open after the in-app redirect; once paid, the cart has done its job.
  useEffect(() => {
    actions.close();
    // A WhatsApp order is complete too: everything the message needs was saved with the order.
    if (confirmed || viaWhatsapp || sent) actions.clear();
  }, [confirmed, viaWhatsapp, sent, actions]);

  // Hand the order to the shop's admin list (demo: same browser). add() ignores repeats.
  useEffect(() => {
    if (!showSummary || !order || !reference || !pickup) return;
    orderActions.add({
      ref: reference,
      createdAt: Date.now(),
      pickup,
      name: order.name,
      phone: order.phone ?? "",
      notes: order.notes ?? "",
      location: order.location || undefined,
      items: order.items,
      total: order.total,
      payment: confirmed ? "pagado" : "pendiente",
      status: sent ? "por-confirmar" : "pendiente",
      sample: false,
    });
  }, [showSummary, order, reference, pickup, confirmed, sent]);

  const items = order?.items ?? [];
  // The branch chosen in the cart; a single-place shop always has just the one.
  const place = locations.find((l) => l.name === order?.location) ?? locations[0];
  const extraItems = items.length - MAX_LISTED_ITEMS;
  // WhatsApp orders send the whole order; paid ones only a note with the receipt.
  const message = (
    viaWhatsapp
      ? [
          `${greeting} Quiero hacer este pedido${reference ? ` (${reference})` : ""}:`,
          ...items.map((i) => `• ${i.quantity} × ${i.label}: ${formatPrice(i.unitPrice * i.quantity)}`),
          order ? `Total: ${formatPrice(order.total)}` : "",
          pickup ? `Retiro: ${formatPickup(pickup)}` : "",
          place.name ? `Retiro en: ${locationLabel(place)}` : "",
          order?.name ? `A nombre de: ${order.name}${order.phone ? ` (${order.phone})` : ""}` : "",
          order?.notes ? `Comentarios: ${order.notes}` : "",
        ]
      : [
          `${greeting} Hice un pedido online${reference ? ` (${reference})` : ""}.`,
          ...items.map((i) => `• ${i.quantity} × ${i.label}`),
          pickup ? `Retiro: ${formatPickup(pickup)}` : "",
          place.name ? `Retiro en: ${locationLabel(place)}` : "",
          order?.name ? `Retira: ${order.name}` : "",
        ]
  )
    .filter(Boolean)
    .join("\n");

  return (
    <main className="flex min-h-dvh flex-col bg-cream px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      <Link href="/" className="mx-auto flex items-center gap-2" aria-label={`${shop.name}, inicio`}>
        <ShopBrand size={32} name={<span className="font-display font-semibold">{shop.name}</span>} />
      </Link>

      <m.section
        aria-labelledby="result-title"
        className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-6 text-center [@media(max-height:700px)]:py-3"
        initial="initial"
        animate="animate"
        transition={{ staggerChildren: 0.08, delayChildren: 0.1 }}
      >
        <m.span
          variants={{ initial: { scale: 0.4, opacity: 0 }, animate: { scale: 1, opacity: 1 } }}
          transition={{ type: "spring", duration: 0.6, bounce: 0.45 }}
          className={`mx-auto grid size-20 place-items-center rounded-full [@media(max-height:700px)]:size-16 ${
            tone === "ok" ? "bg-emerald-100 text-emerald-700" : tone === "wait" ? "bg-blush text-brand-ink" : "bg-warn-bg text-warn-ink"
          }`}
        >
          {tone === "ok" && !viaWhatsapp ? (
            <CheckIcon width={40} height={40} />
          ) : tone === "wait" ? (
            <ClockIcon width={36} height={36} />
          ) : viaWhatsapp ? (
            <WhatsappIcon width={36} height={36} />
          ) : (
            <AlertIcon width={36} height={36} />
          )}
        </m.span>

        <m.div variants={rise}>
          <h1 id="result-title" className="mt-5 font-display [@media(max-height:700px)]:mt-3 text-3xl font-semibold sm:text-4xl">
            {copy.title}
          </h1>
          <p className="mx-auto mt-2 max-w-xs text-muted text-pretty">{copy.text}</p>
        </m.div>

        {showSummary ? (
          <m.dl variants={rise} className="mt-6 space-y-2.5 rounded-3xl bg-paper p-5 text-left [@media(max-height:700px)]:mt-4 [@media(max-height:700px)]:p-4 text-sm ring-1 ring-line">
            {reference ? (
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Pedido</dt>
                <dd className="font-semibold tabular-nums">{reference}</dd>
              </div>
            ) : null}
            {items.length ? (
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Productos</dt>
                <dd className="min-w-0 text-right">
                  {items.slice(0, MAX_LISTED_ITEMS).map((item) => (
                    <span key={item.label} className="block truncate">
                      {item.quantity} × {item.label}
                    </span>
                  ))}
                  {extraItems > 0 ? <span className="block text-muted">y {extraItems} más</span> : null}
                </dd>
              </div>
            ) : null}
            {order ? (
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Total</dt>
                <dd className="font-semibold tabular-nums">{formatPrice(order.total)}</dd>
              </div>
            ) : null}
            <div className="flex items-start gap-2 border-t border-line pt-3">
              <dt className="sr-only">Retiro</dt>
              <ClockIcon width={18} height={18} className="mt-px shrink-0 text-brand" />
              <dd>
                {shownPickup ? (
                  <strong className="font-semibold">{formatPickup(shownPickup).replace(/^./, (c) => c.toUpperCase())}</strong>
                ) : (
                  "Horario a confirmar"
                )}
              </dd>
            </div>
            <div className="flex items-start gap-2">
              <dt className="sr-only">Lugar de retiro</dt>
              <PinIcon width={18} height={18} className="mt-px shrink-0 text-brand" />
              <dd>{place.name ? locationLabel(place) : shop.address}</dd>
            </div>
          </m.dl>
        ) : null}
      </m.section>

      <m.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", duration: 0.6, bounce: 0, delay: 0.35 }}
        className="mx-auto flex w-full max-w-md flex-col gap-2"
      >
        {sent ? (
          <>
            {live?.status === "reprogramado" && reference ? (
              <button
                type="button"
                onClick={() => orderActions.acceptProposal(reference)}
                className="rounded-full bg-brand px-5 py-3.5 font-semibold text-white hover:bg-brand-ink"
              >
                Aceptar el nuevo horario
              </button>
            ) : null}
            {live?.status === "rechazado" ? (
              <Link href="/take-away" className="rounded-full bg-brand px-5 py-3.5 text-center font-semibold text-white hover:bg-brand-ink">
                Hacer otro pedido
              </Link>
            ) : (
              <a
                href={whatsappLink(`${greeting} Te escribo por mi pedido${reference ? ` (${reference})` : ""}.`)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-5 py-3.5 font-semibold text-cream hover:bg-brand-ink"
              >
                <WhatsappIcon /> Escribirle al local
              </a>
            )}
          </>
        ) : viaWhatsapp ? (
          <a
            href={whatsappLink(message)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1a7f4b] px-5 py-3.5 font-semibold text-white hover:bg-[#156b3f]"
          >
            <WhatsappIcon /> Enviar pedido por WhatsApp
          </a>
        ) : confirmed ? (
          <a
            href={whatsappLink(message)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-5 py-3.5 font-semibold text-cream hover:bg-brand-ink"
          >
            <WhatsappIcon /> Enviar comprobante por WhatsApp
          </a>
        ) : (
          <button
            type="button"
            onClick={actions.open}
            className="rounded-full bg-brand px-5 py-3.5 font-semibold text-white hover:bg-brand-ink"
          >
            {status === "rejected" ? "Intentar de nuevo" : "Ver mi pedido"}
          </button>
        )}
        <Link href="/" className="rounded-full px-5 py-3 text-center font-semibold text-muted hover:text-ink">
          Volver al inicio
        </Link>
      </m.div>
    </main>
  );
}
