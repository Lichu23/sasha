"use client";

import Link from "next/link";
import { AnimatePresence, m } from "motion/react";
import { useCart } from "@/components/cart/cart-provider";
import { BagIcon } from "@/components/icons";
import { ShopBrand } from "@/components/shop-logo";
import { reservations, salonLabels, shop } from "@/lib/shop";
import { useTappedNav } from "@/lib/use-tapped-nav";

const links = [
  { href: "/", label: "Inicio" },
  ...(shop.salon ? [{ href: "/salon", label: salonLabels.nav }] : []),
  // Without a salon, the order catalog is the shop's only menu.
  { href: "/take-away", label: shop.salon ? "Take away" : "Menú" },
  ...(reservations ? [{ href: "/reservas", label: "Reservas" }] : []),
];

export function SiteHeader() {
  const { pathname, tappedHref, onTap } = useTappedNav();
  const { meta, actions } = useCart();

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-cream/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-3 sm:gap-3 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5 rounded-full pr-2" aria-label={`${shop.name}, inicio`}>
          <ShopBrand
            size={36}
            name={<span className="hidden font-display text-lg font-semibold tracking-tight sm:inline">{shop.name}</span>}
          />
        </Link>

        <nav aria-label="Principal" className="ml-auto">
          <ul className="flex items-center gap-1 rounded-full bg-paper/70 p-1 ring-1 ring-line">
            {links.map((link) => {
              // The tapped item is current at once; the route takes over when the page has changed.
              const active = tappedHref ? link.href === tappedHref : link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
              // A wide wordmark needs the room on phones; tapping it already goes home.
              const hideOnPhones = link.href === "/" && shop.wordmark;
              return (
                <li key={link.href} className={hideOnPhones ? "hidden sm:block" : undefined}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => onTap(link.href)}
                    // A 44px target, with press feedback on touch and hover only where there is a mouse.
                    className={`relative flex min-h-11 items-center rounded-full px-1.5 text-[13px] font-medium whitespace-nowrap transition-[color,transform] duration-150 [touch-action:manipulation] active:scale-95 motion-reduce:active:scale-100 sm:px-4 sm:text-sm ${
                      active ? "text-cream" : "text-muted [@media(hover:hover)]:hover:text-ink"
                    }`}
                  >
                    {active ? (
                      <m.span
                        layoutId="nav-pill"
                        className="absolute inset-0 -z-0 rounded-full bg-ink"
                        transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
                      />
                    ) : null}
                    <span className="relative">{link.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <button
          type="button"
          onClick={actions.open}
          // Where quick-added products fly to (lib/fly-to-cart.ts).
          data-cart-target
          className="relative grid size-11 shrink-0 place-items-center rounded-full bg-paper ring-1 ring-line transition-[background-color,transform] [touch-action:manipulation] active:scale-95 motion-reduce:active:scale-100 [@media(hover:hover)]:hover:bg-blush"
          aria-label={`Ver pedido (${meta.count} ${meta.count === 1 ? "producto" : "productos"})`}
        >
          <BagIcon />
          <AnimatePresence>
            {meta.count > 0 ? (
              <m.span
                key={meta.count}
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.4, opacity: 0 }}
                transition={{ type: "spring", duration: 0.35, bounce: 0.45 }}
                className="absolute -top-1 -right-1 grid min-w-5 place-items-center rounded-full bg-brand px-1 text-[11px] font-bold text-white tabular-nums"
              >
                {meta.count}
              </m.span>
            ) : null}
          </AnimatePresence>
        </button>
      </div>
    </header>
  );
}
