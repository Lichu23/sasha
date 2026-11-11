"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

/**
 * The navigation bars' tap feedback: the item just tapped is shown as current at once, instead of when the page it
 * leads to has loaded (which on a phone feels like the tap didn't register). It is only valid while the page is the one
 * the tap started from: when the route changes, the real one takes over.
 */
export function useTappedNav() {
  const pathname = usePathname();
  const [tapped, setTapped] = useState<{ href: string; from: string } | null>(null);
  return {
    pathname,
    tappedHref: tapped && tapped.from === pathname ? tapped.href : null,
    onTap: (href: string) => setTapped({ href, from: pathname }),
  };
}
