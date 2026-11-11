"use client";

import Link from "next/link";
import { m } from "motion/react";
import { ShopBrand } from "@/components/shop-logo";
import { management, reservations, shop } from "@/lib/shop";
import { useTappedNav } from "@/lib/use-tapped-nav";

const tabs = management
  ? [
      { href: "/admin/caja", label: "Caja" },
      { href: "/admin/dia", label: "Ventas" },
      { href: "/admin/ventas", label: "Resumen" },
    ]
  : [
      { href: "/admin", label: "Pedidos" },
      ...(reservations ? [{ href: "/admin/reservas", label: "Reservas" }] : []),
      { href: "/admin/ventas", label: "Ventas" },
    ];

export function AdminHeader() {
  const { pathname, tappedHref, onTap } = useTappedNav();
  // The tapped tab is current at once; the route takes over when the page has changed.
  const activeIndex = tabs.findIndex((t) => t.href === (tappedHref ?? pathname));

  return (
    // Named so it stays fixed while page content slides (see globals.css).
    <header style={{ viewTransitionName: "admin-header" }} className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-1.5 px-3 sm:gap-3 sm:px-6">
        <Link href={management ? "/admin/caja" : "/admin"} className="flex items-center gap-2" aria-label={`Panel de ${shop.shortName}`}>
          <ShopBrand size={30} name={null} />
          <span className="hidden font-display font-semibold sm:inline">Panel</span>
        </Link>

        <nav aria-label="Panel" className="flex items-center gap-1 rounded-full bg-cream p-1 ring-1 ring-line">
          {tabs.map((tab, i) => {
            const active = i === activeIndex;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                onClick={() => onTap(tab.href)}
                // Tabs to the right slide in from the right, and vice versa.
                transitionTypes={[i > activeIndex ? "nav-forward" : "nav-back"]}
                className={`relative flex min-h-11 items-center rounded-full px-2 text-sm font-medium transition-[color,transform] duration-150 [touch-action:manipulation] active:scale-95 motion-reduce:active:scale-100 sm:px-3.5 ${
                  active ? "text-cream" : "text-muted [@media(hover:hover)]:hover:text-ink"
                }`}
              >
                {active ? <m.span layoutId="admin-tab" className="absolute inset-0 rounded-full bg-ink" /> : null}
                <span className="relative">{tab.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* A management shop has no public store to go back to. */}
        {management ? null : (
          <Link href="/" className="ml-auto flex min-h-11 shrink-0 items-center whitespace-nowrap px-1 text-sm font-semibold text-brand-ink [touch-action:manipulation] active:opacity-70 [@media(hover:hover)]:hover:underline">
            <span className="sm:hidden">Tienda</span>
            <span className="hidden sm:inline">Ver tienda</span>
          </Link>
        )}
      </div>
    </header>
  );
}
