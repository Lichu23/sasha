"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { m } from "motion/react";

type Box = { x: number; y: number; w: number; h: number };

/**
 * A highlight that slides between the items of a list. It is measured with offsetLeft/offsetTop
 * (relative to the list, so page scroll never matters) instead of a shared `layoutId`, which
 * mixes in the scroll position and makes the highlight jump after the page scrolls.
 * Mark the active item with `data-pill-active` and make the list `relative`.
 * `box` is null until measured: render the active item with its own background until then.
 */
export function useSlidingPill<T extends HTMLElement>(activeKey: string | undefined) {
  const listRef = useRef<T>(null);
  const [box, setBox] = useState<Box | null>(null);

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const measure = () => {
      const item = list.querySelector<HTMLElement>("[data-pill-active]");
      setBox(item ? { x: item.offsetLeft, y: item.offsetTop, w: item.offsetWidth, h: item.offsetHeight } : null);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => observer.disconnect();
  }, [activeKey]);

  return { listRef, box };
}

/** The sliding highlight itself. Put it first in the list so the items paint above it. */
export function SlidingPill({ box, className }: { box: Box | null; className: string }) {
  if (!box) return null;
  return (
    <li aria-hidden="true" role="presentation" className="pointer-events-none absolute top-0 left-0 list-none">
      <m.span
        className={`block ${className}`}
        initial={false}
        animate={{ x: box.x, y: box.y, width: box.w, height: box.h }}
        transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
      />
    </li>
  );
}
