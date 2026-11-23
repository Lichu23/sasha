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
    ...(venue.patients ? [{ href: `${base}/pacientes`, label: "Pacientes" }] : []),
    { href: `${base}/ventas`, label: "Ventas" },
  ];
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur">
      {/* From lg up the brand, the two tabs and "Ver web" share one row (lg:contents lifts them out of the mobile row). */}
      <div className="mx-auto w-full max-w-md px-4 pt-2 pb-2 lg:flex lg:max-w-6xl lg:items-center lg:gap-6 lg:px-8 lg:py-2">
        <div className="flex items-center justify-between gap-2 lg:contents">
          <Link href={base} className="flex min-w-0 items-center gap-2 lg:order-1 lg:flex-1" aria-label={`Panel de ${venue.name}`}>
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-ink text-cream">
              <VenueMark venue={venue} size={22} />
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block truncate font-display text-lg font-semibold">{venue.name}</span>
              <span className="block text-xs font-medium text-muted">Panel del {venue.words.place}</span>
            </span>
          </Link>
          <Link href={`/${venue.slug}`} className="inline-flex min-h-11 shrink-0 items-center px-1 text-sm font-semibold text-brand-ink [touch-action:manipulation] active:opacity-70 lg:order-3 lg:flex-1 lg:justify-end">
            Ver web
          </Link>
        </div>
        <nav aria-label="Panel" className={`mt-1 grid gap-1 rounded-full bg-cream p-1 ring-1 ring-line lg:order-2 lg:mt-0 lg:flex-none ${tabs.length === 3 ? "grid-cols-3 lg:w-[30rem]" : "grid-cols-2 lg:w-80"}`}>
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
