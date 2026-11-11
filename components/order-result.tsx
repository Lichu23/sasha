"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { m } from "motion/react";
import { useCart } from "@/components/cart/cart-provider";
import { AlertIcon, CheckIcon, ClockIcon, PinIcon, WhatsappIcon } from "@/components/icons";
import { ShopBrand } from "@/components/shop-logo";
import { greeting, locationLabel, locations, noun, shop, simulatedWhatsapp, whatsappLink } from "@/lib/shop";
import { useLastOrder } from "@/lib/last-order";
import { orderActions, useOrders, type Order } from "@/lib/orders";
import { formatPrice } from "@/lib/menu";
import { formatPickup } from "@/lib/pickup";
import { slug } from "@/shops/current";

export type OrderStatus = "approved" | "demo" | "pending" | "rejected" | "whatsapp";

const scheduled = `Recibimos tu pago. Ya estamos agendando tu ${noun.one}.`;

const COPY = {
  approved: { title: "¡Pedido confirmado!", text: scheduled },
  demo: { title: "¡Pedido confirmado!", text: scheduled },
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
 * A WhatsApp consulta: what the customer reads. It follows the shop's answer in /admin (demo: same browser, so this
 * page updates when the shop confirms or cancels it there).
 */
function consultaCopy(live?: Order) {
  switch (live?.status) {
    case "confirmado":
    case "completado":
      return {
        kind: "ok",
        title: "¡Pedido confirmado!",
        text: `${shop.shortName} confirmó tu pedido${live.modified ? " con algunos cambios" : ""}. Pagás al retirar.`,
      } as const;
    case "cancelado":
      return { kind: "warn", title: "El pedido se canceló", text: "Si querés, hacé uno nuevo o escribile al local." } as const;
    default:
      return {
        kind: "whatsapp",
        title: "¡Consulta guardada!",
        text: `Te abrimos WhatsApp para que se la mandes a ${shop.shortName}: ahí la confirman con vos. Pagás al retirar.`,
      } as const;
  }
}

const MAX_LISTED_ITEMS = 2;
// WhatsApp opens by itself a moment after the consulta is saved (the button is there if it doesn't).
const OPEN_WHATSAPP_AFTER_MS = simulatedWhatsapp ? 1600 : 2500;

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
  const router = useRouter();
  const order = useLastOrder();
  const live = useOrders()?.find((o) => o.ref === reference);
  const confirmed = status === "approved" || status === "demo";
  const viaWhatsapp = status === "whatsapp";
  const showSummary = status !== "rejected";
  const answer = viaWhatsapp ? consultaCopy(live) : null;
  const copy = answer ?? COPY[status as Exclude<OrderStatus, "whatsapp">];
  const tone = answer ? answer.kind : confirmed ? "ok" : "warn";
  // What the shop agreed (it may have edited the consulta) replaces what the customer first asked for.
  const shownPickup = live?.pickup ?? pickup;
  const items = live?.items ?? order?.items ?? [];
  const total = live?.total ?? order?.total;

  // The drawer may still be open after the in-app redirect; once paid, the cart has done its job.
  useEffect(() => {
    actions.close();
    // A WhatsApp consulta is complete too: everything the message needs was saved with the order.
    if (confirmed || viaWhatsapp) actions.clear();
  }, [confirmed, viaWhatsapp, actions]);

  // The branch chosen in the cart; a single-place shop always has just the one.
  const place = locations.find((l) => l.name === order?.location) ?? locations[0];
  const extraItems = items.length - MAX_LISTED_ITEMS;
  // A consulta sends the whole order, as asked (the shop may change it later); paid orders only a note with the receipt.
  const message = (
    viaWhatsapp
      ? [
          `${greeting} Quiero consultar este pedido${reference ? ` (${reference})` : ""}:`,
          ...(order?.items ?? []).map((i) => `• ${i.quantity} × ${i.label}: ${formatPrice(i.unitPrice * i.quantity)}`),
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
  const messageLink = whatsappLink(message);
  // The demo's chat is part of the site; a live shop opens the real WhatsApp.
  const chatHref = reference ? `/whatsapp?ref=${reference}&vista=cliente` : "/whatsapp";

  // Hand the order to the shop's admin list (demo: same browser). add() ignores repeats. A consulta starts its
  // WhatsApp chat with the message the customer sends.
  useEffect(() => {
    if (!showSummary || !order || !reference || !pickup) return;
    const now = Date.now();
    orderActions.add({
      ref: reference,
      createdAt: now,
      pickup,
      name: order.name,
      phone: order.phone ?? "",
      notes: order.notes ?? "",
      location: order.location || undefined,
      items: order.items,
      total: order.total,
      payment: confirmed ? "pagado" : "pendiente",
      status: viaWhatsapp ? "consulta" : "pendiente",
      messages: viaWhatsapp ? [{ from: "cliente", text: message, at: now }] : undefined,
      sample: false,
    });
  }, [showSummary, order, reference, pickup, confirmed, viaWhatsapp, message]);

  // Redirect to WhatsApp (or the demo's chat) with the consulta, once per order (coming back to this page doesn't send the customer away again).
  const waiting = viaWhatsapp && live?.status === "consulta" && Boolean(order);
  useEffect(() => {
    if (!waiting || !reference) return;
    const key = `${slug}-wa-opened:${reference}`;
    try {
      if (sessionStorage.getItem(key)) return;
    } catch {}
    const timer = setTimeout(() => {
      try {
        sessionStorage.setItem(key, "1");
      } catch {}
      if (simulatedWhatsapp) router.push(chatHref);
      else window.location.assign(messageLink);
    }, OPEN_WHATSAPP_AFTER_MS);
    return () => clearTimeout(timer);
  }, [waiting, reference, messageLink, chatHref, router]);

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
            tone === "ok" || tone === "whatsapp" ? "bg-emerald-100 text-emerald-700" : "bg-warn-bg text-warn-ink"
          }`}
        >
          {tone === "ok" ? (
            <CheckIcon width={40} height={40} />
          ) : tone === "whatsapp" ? (
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
            {total !== undefined ? (
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Total</dt>
                <dd className="font-semibold tabular-nums">{formatPrice(total)}</dd>
              </div>
            ) : null}
            {live?.modified || live?.shopNote ? (
              <div className="rounded-2xl bg-blush px-3 py-2 text-brand-ink">
                <dt className="sr-only">Cambios del local</dt>
                <dd>
                  {live.modified ? "El local ajustó tu pedido." : null}
                  {live.shopNote ? ` “${live.shopNote}”` : null}
                </dd>
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
        {viaWhatsapp && live?.status === "cancelado" ? (
          <Link href="/take-away" className="rounded-full bg-brand px-5 py-3.5 text-center font-semibold text-white hover:bg-brand-ink">
            Hacer otro pedido
          </Link>
        ) : viaWhatsapp && simulatedWhatsapp ? (
          <Link
            href={chatHref}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1a7f4b] px-5 py-3.5 font-semibold text-white hover:bg-[#156b3f]"
          >
            <WhatsappIcon /> {live?.status === "consulta" ? "Abrir WhatsApp con la consulta" : "Abrir el chat con el local"}
          </Link>
        ) : viaWhatsapp && (live?.status === "confirmado" || live?.status === "completado") ? (
          <a
            href={whatsappLink(`${greeting} Te escribo por mi pedido${reference ? ` (${reference})` : ""}.`)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-5 py-3.5 font-semibold text-cream hover:bg-brand-ink"
          >
            <WhatsappIcon /> Escribirle al local
          </a>
        ) : viaWhatsapp ? (
          <a
            href={messageLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1a7f4b] px-5 py-3.5 font-semibold text-white hover:bg-[#156b3f]"
          >
            <WhatsappIcon /> Abrir WhatsApp con la consulta
          </a>
        ) : confirmed ? (
          <a
            href={messageLink}
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
