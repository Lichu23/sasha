"use client";

import Link from "next/link";
import { SlidingPill, useSlidingPill } from "@/components/ui/sliding-pill";

export type PillTab = {
  href: string;
  label: string;
  /** Extra classes for the item, e.g. to hide it on phones. */
  className?: string;
  /** View transition types for navigating to this tab (see globals.css). */
  transitionTypes?: string[];
};

/** Link tabs in a pill with a sliding highlight. `activeHref` marks the current page. */
export function PillTabs({ label, tabs, activeHref }: { label: string; tabs: readonly PillTab[]; activeHref: string | undefined }) {
  const { listRef, box } = useSlidingPill<HTMLUListElement>(activeHref);
  return (
    <nav aria-label={label}>
      <ul ref={listRef} className="relative flex items-center gap-1 rounded-full bg-paper/70 p-1 ring-1 ring-line">
        <SlidingPill box={box} className="rounded-full bg-ink" />
        {tabs.map((tab) => {
          const active = tab.href === activeHref;
          return (
            <li key={tab.href} data-pill-active={active ? "" : undefined} className={tab.className}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                transitionTypes={tab.transitionTypes}
                className={`relative block rounded-full px-2.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors sm:px-4 ${
                  active ? "text-cream" : "text-muted hover:text-ink"
                } ${active && !box ? "bg-ink" : ""}`}
              >
                <span className="relative">{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
