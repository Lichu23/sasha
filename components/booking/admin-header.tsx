"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Venue } from "@/lib/booking/venues";
import { VenueMark } from "./ui";

// The panel's header, separate from the customer's page: who is logged in, the two views (Reservas, Ventas) and a way
// to see the public site. A real panel sits behind a login; the demo's is just another address.

export function AdminHeader({ venue }: { venue: Venue }) {
  const pathname = usePathname();
  const base = `/${venue.slug}/admin`;
  const tabs = [
    { href: base, label: venue.mode === "classes" ? "Reservas" : "Agenda" },
    { href: `${base}/ventas`, label: "Ventas" },
  ];
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur">
      <div className="mx-auto w-full max-w-md px-4 pt-2 pb-2">
        <div className="flex items-center justify-between gap-2">
          <Link href={base} className="flex min-w-0 items-center gap-2" aria-label={`Panel de ${venue.name}`}>
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-ink text-cream">
              <VenueMark venue={venue} size={22} />
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block truncate font-display text-lg font-semibold">{venue.name}</span>
              <span className="block text-xs font-medium text-muted">Panel del {venue.mode === "classes" ? "estudio" : "centro"}</span>
            </span>
          </Link>
          <Link href={`/${venue.slug}`} className="inline-flex min-h-11 shrink-0 items-center px-1 text-sm font-semibold text-brand-ink [touch-action:manipulation] active:opacity-70">
            Ver web
          </Link>
        </div>
        <nav aria-label="Panel" className="mt-1 grid grid-cols-2 gap-1 rounded-full bg-cream p-1 ring-1 ring-line">
          {tabs.map((tab) => {
            const active = tab.href === base ? pathname === base : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-11 items-center justify-center rounded-full text-sm font-semibold [touch-action:manipulation] transition-[background-color,color,transform] active:scale-95 motion-reduce:active:scale-100 ${active ? "bg-ink text-cream" : "text-muted"}`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
