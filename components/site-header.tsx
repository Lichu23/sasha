"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, m } from "motion/react";
import { useCart } from "@/components/cart/cart-provider";
import { BagIcon } from "@/components/icons";
import { ShopBrand } from "@/components/shop-logo";
import { salonLabels, shop } from "@/lib/shop";

const links = [
  { href: "/", label: "Inicio" },
  ...(shop.salon ? [{ href: "/salon", label: salonLabels.nav }] : []),
  // Without a salon, the order catalog is the shop's only menu.
  { href: "/take-away", label: shop.salon ? "Take away" : "Menú" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { meta, actions } = useCart();

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-cream/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5 rounded-full pr-2" aria-label={`${shop.name}, inicio`}>
          <ShopBrand
            size={36}
            name={<span className="hidden font-display text-lg font-semibold tracking-tight sm:inline">{shop.name}</span>}
          />
        </Link>

        <nav aria-label="Principal" className="ml-auto">
          <ul className="flex items-center gap-1 rounded-full bg-paper/70 p-1 ring-1 ring-line">
            {links.map((link) => {
              const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
              // A wide wordmark needs the room on phones; tapping it already goes home.
              const hideOnPhones = link.href === "/" && shop.wordmark;
              return (
                <li key={link.href} className={hideOnPhones ? "hidden sm:block" : undefined}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={`relative block rounded-full px-2.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors sm:px-4 ${
                      active ? "text-cream" : "text-muted hover:text-ink"
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
          className="relative grid size-10 shrink-0 place-items-center rounded-full bg-paper ring-1 ring-line transition-colors hover:bg-blush"
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
