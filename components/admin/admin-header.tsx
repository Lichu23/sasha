"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { m } from "motion/react";
import { ShopBrand } from "@/components/shop-logo";
import { shop } from "@/lib/shop";

const tabs = [
  { href: "/admin", label: "Pedidos" },
  { href: "/admin/ventas", label: "Ventas" },
] as const;

export function AdminHeader() {
  const pathname = usePathname();
  const activeIndex = tabs.findIndex((t) => t.href === pathname);

  return (
    // Named so it stays fixed while page content slides (see globals.css).
    <header style={{ viewTransitionName: "admin-header" }} className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-2 px-4 sm:gap-3 sm:px-6">
        <Link href="/admin" className="flex items-center gap-2" aria-label={`Panel de ${shop.shortName}, pedidos`}>
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
                // Tabs to the right slide in from the right, and vice versa.
                transitionTypes={[i > activeIndex ? "nav-forward" : "nav-back"]}
                className={`relative rounded-full px-2.5 py-1.5 sm:px-3.5 text-sm font-medium transition-colors ${
                  active ? "text-cream" : "text-muted hover:text-ink"
                }`}
              >
                {active ? <m.span layoutId="admin-tab" className="absolute inset-0 rounded-full bg-ink" /> : null}
                <span className="relative">{tab.label}</span>
              </Link>
            );
          })}
        </nav>

        <Link href="/" className="ml-auto shrink-0 whitespace-nowrap text-sm font-semibold text-brand-ink hover:underline">
          <span className="sm:hidden">Tienda</span>
          <span className="hidden sm:inline">Ver tienda</span>
        </Link>
      </div>
    </header>
  );
}
