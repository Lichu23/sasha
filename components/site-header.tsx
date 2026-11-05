"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, m } from "motion/react";
import { SlidingPill, useSlidingPill } from "@/components/ui/sliding-pill";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart/cart-provider";
import { BagIcon } from "@/components/icons";
import { ShopBrand } from "@/components/shop-logo";
import { CART_INCOMING, CART_LANDED } from "@/lib/fly-to-cart";
import { salonLabels, shop } from "@/lib/shop";

const links = [
  { href: "/", label: "Inicio" },
  ...(shop.salon ? [{ href: "/salon", label: salonLabels.nav }] : []),
  { href: "/take-away", label: shop.salon ? "Take away" : "Pedidos" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { meta, actions } = useCart();
  const activeHref = links.find((l) => (l.href === "/" ? pathname === "/" : pathname.startsWith(l.href)))?.href;
  const { listRef, box } = useSlidingPill<HTMLUListElement>(activeHref);

  // The bag has three states: idle, waiting while a product flies over, and received.
  const [bag, setBag] = useState<"idle" | "waiting" | "landed">("idle");
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const incoming = () => {
      clearTimeout(timer);
      setBag("waiting");
    };
    const landed = () => {
      setBag("landed");
      timer = setTimeout(() => setBag("idle"), 500);
    };
    window.addEventListener(CART_INCOMING, incoming);
    window.addEventListener(CART_LANDED, landed);
    return () => {
      clearTimeout(timer);
      window.removeEventListener(CART_INCOMING, incoming);
      window.removeEventListener(CART_LANDED, landed);
    };
  }, []);

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
          <ul ref={listRef} className="relative flex items-center gap-1 rounded-full bg-paper/70 p-1 ring-1 ring-line">
            <SlidingPill box={box} className="rounded-full bg-ink" />
            {links.map((link) => {
              const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
              // A wide wordmark needs the room on phones; tapping it already goes home.
              const hideOnPhones = link.href === "/" && shop.wordmark;
              return (
                <li key={link.href} data-pill-active={active ? "" : undefined} className={hideOnPhones ? "hidden sm:block" : undefined}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={`relative block rounded-full px-2.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors sm:px-4 ${
                      active ? "text-cream" : "text-muted hover:text-ink"
                    } ${active && !box ? "bg-ink" : ""}`}
                  >
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
          <m.span
            className="grid place-items-center"
            initial={false}
            animate={bag}
            variants={{
              idle: { scale: 1, y: 0, rotate: 0 },
              // Leans toward the product, like a bag held open.
              waiting: { scale: 1.18, y: -1, rotate: -8 },
              // Squashes as the product drops in, then settles.
              landed: {
                scale: [1.18, 0.82, 1.08, 1],
                y: [-1, 1, 0, 0],
                rotate: [-8, 0, 0, 0],
                transition: { duration: 0.4, ease: "easeOut" },
              },
            }}
            transition={{ type: "spring", duration: 0.35, bounce: 0.4 }}
          >
            <BagIcon />
          </m.span>
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
