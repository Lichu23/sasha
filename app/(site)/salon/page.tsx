import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CategoryNav } from "@/components/category-nav";
import { MenuItem } from "@/components/menu-item";
import { Reveal } from "@/components/reveal";
import { ArrowIcon, ClockIcon } from "@/components/icons";
import { leadTimeLabel, noun, reservations, salonLabels, shop, takesOrders } from "@/lib/shop";
import { ScheduleLines } from "@/components/schedule-lines";
import { categorySlug, salonMenu } from "@/lib/menu";

export const metadata: Metadata = {
  title: salonLabels.title,
  description: `${shop.salon?.summary ?? "Nuestro menú"} para disfrutar en ${shop.name}.`,
};

const categories = salonMenu.map((c) => ({ ...c, slug: categorySlug(c.name) }));
const navItems = categories.map(({ slug, name }) => ({ slug, name }));

export default function SalonPage() {
  if (!shop.salon) notFound();

  return (
    <>
      <header className="mx-auto max-w-6xl px-4 pt-10 pb-6 sm:px-6">
        <p className="text-sm font-semibold tracking-wide text-brand uppercase">{salonLabels.eyebrow}</p>
        <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight sm:text-5xl">{salonLabels.title}</h1>
        <div className="mt-3 flex items-start gap-2 text-muted">
          <ClockIcon className="mt-0.5 shrink-0 text-brand" />
          <div>
            <ScheduleLines />
            {shop.salon.stayLimit ? <p>Permanencia en el salón: {shop.salon.stayLimit}</p> : null}
          </div>
        </div>
      </header>

      <CategoryNav categories={navItems} />

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {categories.map((category) => (
          <section key={category.slug} id={category.slug} aria-labelledby={`${category.slug}-title`} className="pt-10">
            <Reveal>
              <h2 id={`${category.slug}-title`} className="font-display text-2xl font-semibold sm:text-3xl">
                {category.name}
              </h2>
            </Reveal>
            <ul className="mt-5 grid gap-4 md:grid-cols-2">
              {category.products.map((product) => (
                <li key={product.id}>
                  <MenuItem product={product} />
                </li>
              ))}
            </ul>
          </section>
        ))}

        {takesOrders ? (
          <Reveal className="mt-16 flex flex-col items-start gap-4 rounded-[2rem] bg-ink p-8 text-cream sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-display text-2xl font-semibold">{shop.orders.salonUpsell ?? `¿Querés encargar ${noun.other}?`}</p>
              <p className="mt-1 text-cream/75">
                {noun.g("Encargala", "Encargalo")} online{leadTimeLabel ? ` con ${leadTimeLabel} de anticipación` : ""}.
              </p>
            </div>
            <Link
              href="/take-away"
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-ink"
            >
              Ir a take away <ArrowIcon />
            </Link>
          </Reveal>
        ) : reservations ? (
          <Reveal className="mt-16 flex flex-col items-start gap-4 rounded-[2rem] bg-ink p-8 text-cream sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-display text-2xl font-semibold">¿Te guardamos una mesa?</p>
              <p className="mt-1 text-cream/75">Reservá el día, el horario y cuántos son. Cumpleaños y partidos también.</p>
            </div>
            <Link
              href="/reservas"
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-ink"
            >
              Reservar mesa <ArrowIcon />
            </Link>
          </Reveal>
        ) : null}
      </div>
    </>
  );
}
