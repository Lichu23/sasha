import type { Metadata } from "next";
import Link from "next/link";
import { ShopBrand } from "@/components/shop-logo";
import { ArrowIcon, BagIcon, CalendarIcon } from "@/components/icons";
import { paysOnline, shop } from "@/lib/shop";

// The one link sent to a shop in a pitch: the video, the storefront and the panel together,
// instead of three separate links. Not linked from the site itself.

export const metadata: Metadata = {
  title: "Demo",
  description: `Una demo de página web para ${shop.name}: la tienda, el panel de pedidos y un video de cómo funciona.`,
};

const youtubeId = shop.demo?.youtubeId;

const links = [
  {
    href: "/",
    icon: BagIcon,
    title: "La tienda",
    text: "Lo que ven sus clientes: el menú, el carrito y el pedido.",
  },
  ...(shop.admin
    ? [
        {
          href: "/admin",
          icon: CalendarIcon,
          title: "El panel",
          text: "Lo que ven ustedes: los pedidos por día y las ventas.",
        },
      ]
    : []),
];

export default function DemoPage() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 pt-[max(2.5rem,env(safe-area-inset-top))] pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:px-6">
      <header className="flex flex-col items-center text-center">
        <div className="flex items-center gap-3 font-display text-2xl font-semibold">
          <ShopBrand size={56} name={<span>{shop.name}</span>} />
        </div>
        <h1 className="mt-6 font-display text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
          Así podría ser la página de {shop.shortName}
        </h1>
        <p className="mt-3 text-muted text-pretty">
          {paysOnline
            ? "Sus clientes encargan online y pagan con Mercado Pago"
            : "Sus clientes arman el pedido y les llega por WhatsApp"}
          {shop.admin ? ", y ustedes ven los pedidos y las ventas en un panel." : "."}
        </p>
      </header>

      {youtubeId ? (
        <section aria-labelledby="video" className="mt-8">
          <h2 id="video" className="sr-only">
            Video de cómo funciona
          </h2>
          <div className="aspect-video overflow-hidden rounded-2xl bg-ink shadow-lg ring-1 ring-line">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(youtubeId)}?rel=0`}
              title={`Video: cómo funciona la página de ${shop.shortName}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              loading="lazy"
              className="size-full"
            />
          </div>
        </section>
      ) : null}

      <nav aria-label="Probar la demo" className="mt-8">
        <ul className="grid gap-3">
          {links.map(({ href, icon: Icon, title, text }) => (
            <li key={href}>
              <Link
                href={href}
                className="group flex items-center gap-4 rounded-2xl bg-paper p-4 ring-1 ring-line transition-[background-color,transform] [-webkit-tap-highlight-color:transparent] hover:bg-blush active:scale-[0.98] motion-reduce:active:scale-100"
              >
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-brand text-white">
                  <Icon width={22} height={22} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{title}</span>
                  <span className="block text-sm text-muted">{text}</span>
                </span>
                <ArrowIcon className="shrink-0 text-brand-ink transition-transform group-hover:translate-x-0.5" />
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Only with simulated payment: a WhatsApp order would message the shop's real number. */}
      {paysOnline && shop.admin ? (
        <p className="mt-6 rounded-2xl bg-blush/60 p-4 text-sm text-pretty">
          Para verlo completo, hagan un pedido de prueba en la tienda y después abran el panel en el mismo celular o
          computadora: ahí aparece. El pago está simulado, así que no se cobra nada.
        </p>
      ) : null}

      <p className="mt-auto pt-10 text-center text-sm text-muted">Demo hecha por Lisandro, desarrollador web.</p>
    </main>
  );
}
