import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CakeCatalog } from "@/components/takeaway/cake-catalog";
import { CategoryNav } from "@/components/category-nav";
import { EarliestPickup, TakeawayNotice } from "@/components/takeaway/takeaway-notice";
import { CalendarIcon } from "@/components/icons";
import { categorySlug, takeawayMenu } from "@/lib/menu";
import { leadTimeLabel, pickupPlaces, shop, takesOrders } from "@/lib/shop";

export const metadata: Metadata = {
  title: shop.orders.title,
  description: `Encargá online${leadTimeLabel ? ` con ${leadTimeLabel} de anticipación` : ""} y retirá en ${pickupPlaces}.`,
};

// Several categories get headings and jump chips; a single one is just the grid.
const sections = takeawayMenu.map((c) => ({
  slug: categorySlug(c.name),
  name: c.name,
  products: c.products,
}));
const navItems = sections.length > 1 ? sections.map(({ slug, name }) => ({ slug, name })) : null;

export default function TakeawayPage() {
  // A restaurant that only takes reservations has no take-away.
  if (!takesOrders) notFound();

  return (
    <div className="pb-28">
      {leadTimeLabel ? <TakeawayNotice /> : null}

      {/* The notice already explains how ordering works; the header only keeps the key date. */}
      <header className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
        <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">{shop.orders.title}</h1>
        {leadTimeLabel ? (
          <p className="mt-3 flex items-start gap-2 text-muted">
            <CalendarIcon className="mt-0.5 shrink-0 text-brand" />
            <span>
              Retirás desde el{" "}
              <strong className="font-semibold text-ink">
                <EarliestPickup />
              </strong>
            </span>
          </p>
        ) : null}
      </header>

      {/* A direct child of the page, so it stays stuck under the header the whole way down. */}
      {navItems ? <CategoryNav categories={navItems} className="mt-8" /> : null}

      <div className={`mx-auto max-w-6xl px-4 sm:px-6 ${navItems ? "" : "mt-10"}`}>
        <CakeCatalog sections={sections} />
      </div>
    </div>
  );
}
