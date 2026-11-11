import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ShopBrand } from "@/components/shop-logo";
import { ArrowIcon } from "@/components/icons";
import { isConsulta, management, paysOnline, reservations, shop } from "@/lib/shop";

// The one link sent to a shop in a pitch: the video, the storefront and the panel together,
// instead of three separate links. Not linked from the site itself.

export const metadata: Metadata = {
  title: "Demo",
  description: management
    ? `Una demo de la herramienta de gestión para ${shop.name}: la caja, las ventas del día y el resumen, y un video de cómo funciona.`
    : `Una demo de página web para ${shop.name}: la tienda, el panel de pedidos y un video de cómo funciona.`,
};

const youtubeId = shop.demo?.youtubeId;

// A test order only makes sense with the panel to follow it: the order is saved there (payment is simulated or, for
// a consulta, nothing is sent: WhatsApp opens with the message but the visitor doesn't have to send it).
const guided = shop.admin;

// A shop in management mode has no store: the demo is the staff's tool.
const managementSteps = [
  { href: "/admin/caja", title: "Probar la caja", text: "Sumen lo que pide un cliente: el total se suma solo. Cobren y queda registrada la venta.", action: "Probar" },
  { href: "/admin/dia", title: "Ver las ventas del día", text: "Lo vendido, cómo se pagó, cada venta y el cierre de caja. Con calendario para ver otros días.", action: "Abrir" },
  { href: "/admin/ventas", title: "Ver el resumen", text: "Las ventas por día, lo más vendido y las horas con más movimiento.", action: "Abrir" },
];

const steps = management ? managementSteps : [
  {
    href: "/",
    title: "Probar la tienda",
    text: guided
      ? isConsulta
        ? "Hagan una consulta de prueba. Se abre WhatsApp con el mensaje: no hace falta enviarlo."
        : "Hagan un pedido de prueba, como si fueran un cliente."
      : "Recorran el menú como si fueran un cliente.",
    action: "Probar",
  },
  ...(reservations
    ? [
        {
          href: "/reservas",
          title: "Reservar una mesa",
          text: shop.admin
            ? "Hagan una reserva de prueba: se abre WhatsApp con el pedido de mesa, y ustedes la confirman en el panel."
            : "Elijan día, horario y cuántos son, como si fueran un cliente.",
          action: "Reservar",
        },
      ]
    : []),
  ...(shop.admin
    ? [
        {
          href: "/admin",
          title: isConsulta ? "Modificar y confirmar la consulta" : guided ? "Ver el pedido en el panel" : "Ver el panel",
          text: isConsulta
            ? "Ábranlo en el mismo celular o computadora: ahí aparece la consulta para modificarla y confirmarla."
            : guided
            ? "Ábranlo en el mismo celular o computadora: ahí aparecen su pedido y las ventas."
            : "Lo que ven ustedes: los pedidos por día y las ventas.",
          action: "Abrir",
        },
      ]
    : []),
];

const headline = management ? "Así podría ser la gestión de" : "Así podría ser la página de";

export default function DemoPage() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 pt-[max(2.5rem,env(safe-area-inset-top))] pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:px-6">
      <header className="flex flex-col items-center text-center">
        {/* A shop with a wordmark has its logo in the title instead of its name, so it isn't shown twice. */}
        {shop.wordmark ? null : (
          <div className="flex items-center gap-3 font-display text-2xl font-semibold">
            <ShopBrand size={56} name={<span>{shop.name}</span>} />
          </div>
        )}
        <h1
          aria-label={`${headline} ${shop.shortName}`}
          className={`${shop.wordmark ? "" : "mt-6 "}font-display text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl`}
        >
          {headline}{" "}
          {shop.wordmark ? (
            <Image
              src={shop.wordmark.src}
              alt=""
              width={shop.wordmark.width}
              height={shop.wordmark.height}
              preload
              // The logo reads as a word of the title: its height follows the text, centered on the line.
              style={{ height: "1.9em", width: "auto" }}
              className="inline-block -translate-y-[0.06em] align-middle"
            />
          ) : (
            shop.shortName
          )}
        </h1>
      </header>

      {youtubeId ? (
        <section aria-labelledby="video" className="mt-8">
          <h2 id="video" className="sr-only">
            Video de cómo funciona
          </h2>
          <div className="aspect-video overflow-hidden rounded-2xl bg-ink shadow-lg ring-1 ring-line">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(youtubeId)}?rel=0`}
              title={`Video: cómo funciona ${management ? "la gestión" : "la página"} de ${shop.shortName}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              loading="lazy"
              className="size-full"
            />
          </div>
        </section>
      ) : null}

      <section aria-labelledby="probar" className="mt-10">
        <h2 id="probar" className="text-center font-display text-2xl font-semibold tracking-tight">
          Pruébenla ustedes
        </h2>
        <p className="mt-1 text-center text-muted text-pretty">
          {management
            ? "Es una demo: pueden tocar todo. Los datos son de ejemplo."
            : paysOnline
              ? "Es una demo: pueden tocar todo, el pago está simulado y no se cobra nada."
              : "Es una demo: pueden tocar todo, y no se cobra nada."}
        </p>
        <ol className="mt-5 grid gap-3">
          {steps.map(({ href, title, text, action }, i) => (
            <li key={href}>
              <Link
                href={href}
                className="group flex items-center gap-4 rounded-2xl bg-paper p-4 ring-1 ring-line transition-[background-color,transform] [-webkit-tap-highlight-color:transparent] hover:bg-blush active:scale-[0.98] motion-reduce:active:scale-100"
              >
                <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-blush font-display text-lg font-semibold text-brand-ink">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{title}</span>
                  <span className="block text-sm text-muted">{text}</span>
                </span>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors group-hover:bg-brand-ink">
                  {action}
                  <ArrowIcon width={16} height={16} className="transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <p className="mt-auto pt-10 text-center text-sm text-muted">Demo hecha por Lisandro, desarrollador web.</p>
    </main>
  );
}
