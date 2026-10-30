"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { useCart } from "@/components/cart/cart-provider";
import { BottomSheet, Drawer } from "@/components/ui/drawer";
import { ProductModel } from "@/components/takeaway/model-viewer";
import { QuantityField } from "@/components/ui/quantity-field";
import { BagIcon, CheckIcon, CloseIcon, PlusIcon } from "@/components/icons";
import { flyToCart } from "@/lib/fly-to-cart";
import { formatPrice, type Product } from "@/lib/menu";
import { modelFor, sizeCm } from "@/lib/models3d";
import { clearArReturn, peekArReturn, saveArReturn, type ArReturn } from "@/lib/ar-return";
import { noun, shop, shortName } from "@/lib/shop";

const sizeNotes = shop.orders.sizeNotes ?? {};
const one = noun.g("una", "uno");

type Section = { slug: string; name: string; products: Product[] };

/** The order catalog: one grid, or a titled grid per category when there are several. */
export function CakeCatalog({ sections }: { sections: Section[] }) {
  const titled = sections.length > 1;
  // `detail` outlives `open` so the drawer keeps its content during the exit animation.
  const [detail, setDetail] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);
  const [added, setAdded] = useState<string | null>(null);
  // Where to put the sheet back after the AR camera closes (see lib/ar-return.ts).
  const [resume, setResume] = useState<ArReturn | null>(null);
  const arActive = useRef(false);
  const onArActive = useCallback((active: boolean) => {
    arActive.current = active;
  }, []);
  const addedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const { actions, meta } = useCart();

  const productCount = sections.length;
  useEffect(() => {
    // Coming back from AR: reopen the same product, size and quantity at the same scroll position.
    const restore = () => {
      const saved = peekArReturn();
      if (!saved || document.visibilityState !== "visible") return;
      clearArReturn();
      const cake = sections.flatMap((s) => s.products).find((p) => p.id === saved.productId);
      if (!cake) return;
      setResume(saved);
      setDetail(cake);
      setOpen(true);
      requestAnimationFrame(() => window.scrollTo(0, saved.scrollY));
    };
    restore();
    document.addEventListener("visibilitychange", restore);
    return () => document.removeEventListener("visibilitychange", restore);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productCount]);

  const select = (cake: Product) => {
    setResume(null);
    setDetail(cake);
    setOpen(true);
  };

  // The card's + skips the detail: the most popular size (the largest), one unit.
  // The photo flies to the cart first, so the badge counts it as it lands.
  const quickAdd = async (cake: Product, photo: Element | null | undefined) => {
    await flyToCart(photo);
    actions.add(cake.id, cake.sizes.at(-1)!.id, 1);
    confirmAdded(cake.name);
  };

  const confirmAdded = (name: string) => {
    setAdded(name);
    clearTimeout(addedTimer.current);
    addedTimer.current = setTimeout(() => setAdded(null), 2500);
  };

  return (
    <>
      {sections.map((section, sectionIndex) => (
        <section
          key={section.slug}
          id={titled ? section.slug : undefined}
          aria-labelledby={titled ? `${section.slug}-title` : undefined}
          className={titled ? "pt-10" : undefined}
        >
          {titled ? (
            <h2 id={`${section.slug}-title`} className="mb-5 font-display text-2xl font-semibold sm:text-3xl">
              {section.name}
            </h2>
          ) : null}
          <ul className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-3 xl:grid-cols-4">
            {section.products.map((cake, i) => (
              <m.li
                key={cake.id}
                className="[overflow-anchor:none]"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "0px 0px -8% 0px" }}
                transition={{
                  type: "spring",
                  duration: 0.6,
                  bounce: 0,
                  delay: (i % 4) * 0.05,
                }}
              >
                {/* Two sibling buttons, as buttons can't nest: the card opens the detail, the + adds right away. */}
                <div className="group relative">
                  <button type="button" onClick={() => select(cake)} className="block w-full text-left">
                    <div data-fly-photo className="relative aspect-square overflow-hidden rounded-3xl bg-blush">
                      {cake.image ? (
                        <Image
                          src={cake.image}
                          alt={cake.name}
                          fill
                          sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, 50vw"
                          // The first row is on screen right away: don't wait for the lazy-load check.
                          loading={sectionIndex === 0 && i < 4 ? "eager" : "lazy"}
                          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                        />
                      ) : null}
                    </div>
                    <h3 className="mt-3 font-semibold text-balance">{shortName(cake.name)}</h3>
                    <p className="text-sm text-muted tabular-nums">
                      {cake.sizes.length > 1 ? "Desde " : ""}
                      {formatPrice(cake.price)}
                    </p>
                  </button>
                  <div className="pointer-events-none absolute inset-x-0 top-0 aspect-square">
                    <button
                      type="button"
                      onClick={(e) => quickAdd(cake, e.currentTarget.closest("li")?.querySelector("[data-fly-photo]"))}
                      aria-label={`Agregar ${cake.name} al pedido`}
                      className="pointer-events-auto absolute right-3 bottom-3 grid size-10 place-items-center rounded-full bg-paper/95 text-ink shadow-md transition-[transform,background-color,color] hover:scale-110 hover:bg-brand hover:text-white active:scale-95"
                    >
                      <PlusIcon />
                    </button>
                  </div>
                </div>
              </m.li>
            ))}
          </ul>
        </section>
      ))}

      <Drawer.Root
        open={open}
        // Taps inside the AR camera count as "outside" presses; only the AR back, cross and confirm may end it.
        onOpenChange={(next) => {
          if (!next && arActive.current) return;
          setOpen(next);
        }}
      >
        <BottomSheet>
          {detail ? (
            <CakeDetail
              key={`${detail.id}-${resume ? "back" : ""}`}
              cake={detail}
              resume={resume}
              onArActive={onArActive}
              onAdd={(sizeId, quantity) => {
                actions.add(detail.id, sizeId, quantity);
                setOpen(false);
                confirmAdded(detail.name);
              }}
            />
          ) : null}
        </BottomSheet>
      </Drawer.Root>

      <AnimatePresence>
        {meta.count > 0 ? (
          <m.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 mx-auto max-w-md"
          >
            <button
              type="button"
              onClick={actions.open}
              className="flex w-full items-center justify-between gap-3 rounded-full bg-ink py-2 pr-2 pl-5 text-cream shadow-2xl shadow-ink/30"
            >
              <span className="flex min-w-0 items-center gap-2 text-sm" aria-live="polite">
                <AnimatePresence mode="popLayout" initial={false}>
                  <m.span
                    key={added ?? "cart"}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="flex min-w-0 items-center gap-2"
                  >
                    {added ? (
                      <CheckIcon width={18} height={18} className="shrink-0 text-emerald-400" />
                    ) : (
                      <BagIcon width={18} height={18} />
                    )}
                    {/* Phones only have room for the essentials: "¡Agregada!" or "2 tortas". */}
                    <span className="truncate sm:hidden">
                      {added ? `¡${noun.g("Agregada", "Agregado")}!` : noun.count(meta.count)}
                    </span>
                    <span className="hidden truncate sm:inline">
                      {added ? `${added} ${noun.g("agregada", "agregado")}` : `${noun.count(meta.count)} en tu pedido`}
                    </span>
                  </m.span>
                </AnimatePresence>
              </span>
              <span className="shrink-0 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white tabular-nums">
                Ver pedido · {formatPrice(meta.total)}
              </span>
            </button>
          </m.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

function CakeDetail({
  cake,
  resume,
  onArActive,
  onAdd,
}: {
  cake: Product;
  resume: ArReturn | null;
  onArActive: (active: boolean) => void;
  onAdd: (sizeId: string, quantity: number) => void;
}) {
  // Default to the most popular size (the largest) so one tap is enough.
  const [sizeId, setSizeId] = useState(resume?.sizeId ?? cake.sizes.at(-1)!.id);
  const [quantity, setQuantity] = useState(resume?.quantity ?? 1);
  const [inAr, setInAr] = useState(false);
  const model = modelFor(cake.id);
  // While the AR camera is open, keep the choice on disk so it survives a page reload.
  useEffect(() => {
    if (inAr) saveArReturn({ productId: cake.id, sizeId, quantity, scrollY: window.scrollY });
  }, [inAr, cake.id, sizeId, quantity]);
  const onArChange = useCallback((active: boolean) => {
    setInAr(active);
    onArActive(active);
    if (!active) clearArReturn();
  }, [onArActive]);
  const size = cake.sizes.find((s) => s.id === sizeId)!;

  return (
    <>
      <div className="relative h-48 shrink-0 bg-blush sm:h-56">
        {cake.image ? <Image src={cake.image} alt={cake.name} fill sizes="448px" className="object-cover" /> : null}
        {model ? (
          <ProductModel
            src={model.src}
            name={cake.name}
            scale={(sizeCm(size.label) ?? model.widthCm) / model.widthCm}
            sizes={cake.sizes}
            sizeId={sizeId}
            onSizeChange={setSizeId}
            onArChange={onArChange}
          />
        ) : null}
        <Drawer.Close
          className="absolute top-3 right-3 grid size-10 place-items-center rounded-full bg-paper/95 shadow"
          aria-label="Cerrar"
        >
          <CloseIcon />
        </Drawer.Close>
      </div>
      <Drawer.Content className="px-5 pt-4 pb-5">
        <Drawer.Title className="font-display text-2xl leading-tight font-semibold">{cake.name}</Drawer.Title>
        {cake.description ? (
          <Drawer.Description className="mt-1 text-sm text-muted text-pretty">{cake.description}</Drawer.Description>
        ) : null}

        {cake.sizes.length > 1 ? (
          <div className="mt-4">
            <p id="size-legend" className="mb-2 text-sm font-semibold">
              {shop.orders.sizeLegend ?? "Tamaño"}
            </p>
            <RadioGroup
              aria-labelledby="size-legend"
              value={sizeId}
              onValueChange={(value: string) => setSizeId(value)}
              className="grid gap-2"
            >
              {cake.sizes.map((s) => (
                <Radio.Root
                  key={s.id}
                  value={s.id}
                  className="flex cursor-pointer items-center justify-between rounded-2xl bg-paper px-4 py-2.5 ring-1 ring-line transition-colors outline-none hover:ring-ink/30 focus-visible:ring-2 focus-visible:ring-brand data-checked:bg-blush data-checked:ring-brand"
                >
                  <span>
                    <span className="font-semibold">{s.label}</span>
                    {sizeNotes[s.id] ? <span className="ml-2 text-sm text-muted">{sizeNotes[s.id]}</span> : null}
                  </span>
                  <span className="font-semibold tabular-nums">{formatPrice(s.price)}</span>
                </Radio.Root>
              ))}
            </RadioGroup>
          </div>
        ) : null}

        <div className="mt-4 flex items-center justify-between gap-3">
          <QuantityField
            value={quantity}
            onChange={setQuantity}
            label="Cantidad"
            decrementLabel={`Restar ${one}`}
            incrementLabel={`Sumar ${one}`}
          />
          <p className="text-right">
            <span className="block text-xs text-muted">Total</span>
            <span className="font-display text-2xl font-semibold tabular-nums">{formatPrice(size.price * quantity)}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => onAdd(sizeId, quantity)}
          className="mt-4 w-full rounded-full bg-brand px-5 py-3.5 font-semibold text-white transition-[background-color,transform] hover:bg-brand-ink active:scale-[0.98]"
        >
          Agregar
        </button>
      </Drawer.Content>
    </>
  );
}
