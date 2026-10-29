"use client";

import { useEffect, useState } from "react";
import { SlidingPill, useSlidingPill } from "@/components/ui/sliding-pill";

/** Distance from the viewport top, just below the header and the chip bar. */
const ACTIVE_LINE = 150;

/** Sticky category chips that follow the section currently in view. */
export function CategoryNav({
  categories,
  className = "",
}: {
  categories: { slug: string; name: string }[];
  className?: string;
}) {
  const [active, setActive] = useState(categories[0]?.slug);

  const { listRef, box } = useSlidingPill<HTMLUListElement>(active);

  // The section being read is the last one whose top has passed the sticky bars.
  // Checked once per frame while scrolling.
  useEffect(() => {
    const sections = categories
      .map((c) => document.getElementById(c.slug))
      .filter((el): el is HTMLElement => el !== null);
    let frame = 0;

    const update = () => {
      let current = sections[0]?.id;
      for (const el of sections) {
        if (el.getBoundingClientRect().top <= ACTIVE_LINE) current = el.id;
      }
      if (current) setActive(current);
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, [categories]);

  // Keep the active chip centred in the horizontal chip list. This scrolls only the
  // list: scrollIntoView would also move the page and fight Next's scroll-to-top.
  useEffect(() => {
    const list = listRef.current;
    const chip = list?.querySelector<HTMLElement>(`[data-slug="${active}"]`);
    if (!list || !chip) return;
    list.scrollTo({
      left: chip.offsetLeft - (list.clientWidth - chip.offsetWidth) / 2,
      behavior: "smooth",
    });
  }, [active, listRef]);

  return (
    <nav
      aria-label="Categorías"
      className={`sticky top-16 z-30 border-b border-line/70 bg-cream/90 backdrop-blur-md ${className}`}
    >
      <ul ref={listRef} className="no-scrollbar relative mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-2.5 sm:px-6">
        <SlidingPill box={box} className="rounded-full bg-brand" />
        {categories.map((c) => {
          const isActive = c.slug === active;
          return (
            <li key={c.slug} data-slug={c.slug} data-pill-active={isActive ? "" : undefined} className="shrink-0">
              <a
                href={`#${c.slug}`}
                aria-current={isActive ? "true" : undefined}
                className={`relative block rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive ? "text-white" : "text-muted hover:text-ink"
                } ${isActive && !box ? "bg-brand" : ""}`}
              >
                <span className="relative">{c.name}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
