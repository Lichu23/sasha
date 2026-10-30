"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PillTabs } from "@/components/ui/pill-tabs";
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
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4 sm:px-6">
        <Link href="/admin" className="flex items-center gap-2" aria-label={`Panel de ${shop.shortName}, pedidos`}>
          <ShopBrand size={30} name={null} />
          <span className="hidden font-display font-semibold sm:inline">Panel</span>
        </Link>

        <PillTabs
          label="Panel"
          activeHref={tabs[activeIndex]?.href}
          // Tabs to the right slide in from the right, and vice versa.
          tabs={tabs.map((t, i) => ({ ...t, transitionTypes: [i > activeIndex ? "nav-forward" : "nav-back"] }))}
        />

        <Link href="/" className="ml-auto text-sm font-semibold text-brand-ink hover:underline">
          Ver tienda
        </Link>
      </div>
    </header>
  );
}
