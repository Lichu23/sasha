"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CheckIcon, CloseIcon, MinusIcon, PlusIcon } from "@/components/icons";
import { BottomSheet, Drawer } from "@/components/ui/drawer";
import { formatPrice, posMenu, type Product } from "@/lib/menu";
import { KIND_LABEL, salesActions, type Sale, type SaleKind, type SaleLine } from "@/lib/sales";
import { management } from "@/lib/shop";

// The Caja: where the staff load what the customer asks for. They tap products to add them, the total adds itself,
// and "Cobrar" records the sale (lib/sales.ts). Built for a phone or a tablet at the counter: big targets, one hand.

const METHODS = management?.paymentMethods ?? ["Efectivo"];
const KINDS = Object.keys(KIND_LABEL) as SaleKind[];

const press =
  "[touch-action:manipulation] transition-[transform,background-color,color] duration-100 active:scale-[0.97] motion-reduce:active:scale-100";
const chip = `${press} min-h-11 rounded-full px-4 text-sm font-semibold ring-1 ring-line aria-pressed:bg-ink aria-pressed:text-cream aria-pressed:ring-ink`;

const lineOf = (p: Product): SaleLine => ({ productId: p.id, sizeId: p.sizes[0].id, label: p.name, quantity: 1, unitPrice: p.sizes[0].price });

export function Pos() {
  const [lines, setLines] = useState<SaleLine[]>([]);
  const [category, setCategory] = useState<string>("todo");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<SaleKind>("mostrador");
  const [note, setNote] = useState("");
  const [method, setMethod] = useState(METHODS[0]);
  const [saved, setSaved] = useState<Sale | null>(null);

  const total = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  const units = lines.reduce((sum, l) => sum + l.quantity, 0);
  const quantityOf = (id: number) => lines.find((l) => l.productId === id)?.quantity ?? 0;

  // What is on screen: a category, or everything that matches the search.
  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posMenu
      .filter((c) => category === "todo" || q || c.id === category)
      .map((c) => ({ ...c, products: c.products.filter((p) => !q || p.name.toLowerCase().includes(q)) }))
      .filter((c) => c.products.length > 0);
  }, [category, query]);

  const add = (p: Product) => {
    setSaved(null);
    setLines((prev) => (prev.some((l) => l.productId === p.id) ? prev.map((l) => (l.productId === p.id ? { ...l, quantity: l.quantity + 1 } : l)) : [...prev, lineOf(p)]));
  };
  const setQuantity = (id: number, quantity: number) =>
    setLines((prev) => (quantity <= 0 ? prev.filter((l) => l.productId !== id) : prev.map((l) => (l.productId === id ? { ...l, quantity: Math.min(99, quantity) } : l))));

  function charge() {
    if (lines.length === 0) return;
    const sale = salesActions.add({ at: Date.now(), lines, method, kind, note: note.trim() });
    setSaved(sale);
    setLines([]);
    setNote("");
    setOpen(false);
  }

  return (
    <>
      <h1 className="sr-only">Caja</h1>

      {saved ? (
        <div role="status" className="mb-3 flex items-center gap-3 rounded-2xl bg-emerald-100 px-4 py-3 text-emerald-800">
          <CheckIcon className="shrink-0" />
          <p className="min-w-0 flex-1 text-sm">
            <strong className="font-semibold">Venta #{saved.n} guardada</strong> · {formatPrice(saved.total)} · {saved.method}
          </p>
          <Link href="/admin/dia" className="shrink-0 text-sm font-semibold underline">
            Ver ventas
          </Link>
        </div>
      ) : null}

      {/* Search and categories stay in view under the header while the products scroll. */}
      <div className="sticky top-14 z-20 -mx-4 bg-cream/95 px-4 pt-1 pb-2 backdrop-blur sm:-mx-6 sm:px-6">
        <label className="block">
          <span className="sr-only">Buscar un producto</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar un producto…"
            className="min-h-11 w-full rounded-full bg-paper px-4 text-base ring-1 ring-line outline-none focus:ring-2 focus:ring-brand"
          />
        </label>
        <div role="group" aria-label="Categorías" className="no-scrollbar -mx-4 mt-2 flex gap-2 overflow-x-auto px-4 sm:-mx-6 sm:px-6">
          {[{ id: "todo", name: "Todo" }, ...posMenu].map((c) => (
            <button key={c.id} type="button" data-category={c.id} aria-pressed={category === c.id && !query} onClick={() => { setCategory(c.id); setQuery(""); }} className={`${chip} shrink-0 whitespace-nowrap`}>
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {groups.length === 0 ? <p className="mt-10 text-center text-muted">No hay productos con ese nombre.</p> : null}
      <div className="mt-3 space-y-6 pb-28">
        {groups.map((c) => (
          <section key={c.id} aria-labelledby={`cat-${c.id}`}>
            {category === "todo" && !query ? (
              <h2 id={`cat-${c.id}`} className="mb-2 text-sm font-semibold text-muted">
                {c.name}
              </h2>
            ) : null}
            <ul className="grid grid-cols-2 gap-2 lg:grid-cols-3">
              {c.products.map((p) => (
                <li key={p.id}>
                  <ProductTile product={p} quantity={quantityOf(p.id)} onAdd={() => add(p)} onRemove={() => setQuantity(p.id, quantityOf(p.id) - 1)} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {/* The order so far: its total is always in view. */}
      {lines.length > 0 ? (
        <div className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-30 mx-auto max-w-lg">
          <button
            type="button"
            data-order-bar
            onClick={() => setOpen(true)}
            className={`${press} flex w-full items-center justify-between gap-3 rounded-full bg-ink py-2 pr-2 pl-5 text-cream shadow-2xl shadow-ink/30`}
          >
            <span className="text-sm">
              {units} {units === 1 ? "producto" : "productos"}
            </span>
            <span className="rounded-full bg-brand px-4 py-2.5 text-base font-semibold text-white tabular-nums">Ver pedido · {formatPrice(total)}</span>
          </button>
        </div>
      ) : null}

      <Drawer.Root open={open} onOpenChange={setOpen} swipeDirection="down">
        <BottomSheet>
          <div className="flex items-center justify-between px-5 pt-7 pb-2">
            <Drawer.Title className="font-display text-2xl font-semibold">Pedido actual</Drawer.Title>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => { setLines([]); setOpen(false); }} className="min-h-11 rounded-full px-3 text-sm font-semibold text-muted [touch-action:manipulation] hover:text-ink">
                Vaciar
              </button>
              <Drawer.Close className="grid size-10 place-items-center rounded-full hover:bg-blush" aria-label="Cerrar">
                <CloseIcon />
              </Drawer.Close>
            </div>
          </div>

          <ul className="max-h-[16dvh] divide-y divide-line overflow-y-auto overscroll-contain px-5">
            {lines.map((l) => (
              <li key={l.productId} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="leading-snug font-semibold">{l.label}</p>
                  <p className="text-sm text-muted tabular-nums">{formatPrice(l.unitPrice)} c/u</p>
                </div>
                <div className="flex shrink-0 items-center gap-1" role="group" aria-label={`Cantidad de ${l.label}`}>
                  <button type="button" aria-label="Restar uno" onClick={() => setQuantity(l.productId, l.quantity - 1)} className={`${press} grid size-11 place-items-center rounded-full bg-paper ring-1 ring-line`}>
                    <MinusIcon width={18} height={18} />
                  </button>
                  <span className="w-7 text-center text-lg font-semibold tabular-nums">{l.quantity}</span>
                  <button type="button" aria-label="Sumar uno" onClick={() => setQuantity(l.productId, l.quantity + 1)} className={`${press} grid size-11 place-items-center rounded-full bg-paper ring-1 ring-line`}>
                    <PlusIcon width={18} height={18} />
                  </button>
                </div>
                <p className="w-20 shrink-0 text-right font-semibold tabular-nums">{formatPrice(l.unitPrice * l.quantity)}</p>
              </li>
            ))}
          </ul>

          <div className="border-t border-line px-5 pt-3">
            <div role="group" aria-label="Tipo de venta" className="flex gap-2">
              {KINDS.map((k) => (
                <button key={k} type="button" aria-pressed={kind === k} onClick={() => setKind(k)} className={`${chip} flex-1`}>
                  {KIND_LABEL[k]}
                </button>
              ))}
            </div>
            <label className="mt-3 block text-sm font-semibold">
              {kind === "mesa" ? "Mesa" : "Nombre"} (opcional)
              <input
                name="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={40}
                autoComplete="off"
                placeholder={kind === "mesa" ? "Ej: Mesa 4" : "Ej: Lucía"}
                className="mt-1 block min-h-11 w-full rounded-xl bg-paper px-3 py-2.5 text-base font-normal ring-1 ring-line outline-none focus:ring-2 focus:ring-brand"
              />
            </label>

            <p className="mt-3 text-sm font-semibold">Cómo paga</p>
            <div role="group" aria-label="Medio de pago" className="mt-1 grid grid-cols-2 gap-2">
              {METHODS.map((m) => (
                <button key={m} type="button" aria-pressed={method === m} onClick={() => setMethod(m)} className={chip}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Stays in view while the order scrolls. */}
          <div className="sticky bottom-0 z-10 mt-3 border-t border-line bg-cream px-5 pt-3 pb-3">
            <div className="mb-2 flex items-baseline justify-between">
              <span className="text-muted">Total</span>
              <span className="font-display text-3xl font-semibold tabular-nums">{formatPrice(total)}</span>
            </div>
            <button type="button" data-charge onClick={charge} disabled={lines.length === 0} className={`${press} min-h-12 w-full rounded-full bg-emerald-600 px-5 text-lg font-semibold text-white hover:bg-emerald-700 disabled:opacity-50`}>
              Cobrar {formatPrice(total)}
            </button>
          </div>
        </BottomSheet>
      </Drawer.Root>
    </>
  );
}

/** A product: its photo, name and price, and below them the amount: "Agregar" until there is one, then − quantity +. */
function ProductTile({ product, quantity, onAdd, onRemove }: { product: Product; quantity: number; onAdd: () => void; onRemove: () => void }) {
  return (
    <div className={`flex flex-col gap-2 rounded-2xl bg-paper p-2 ring-1 ring-line ${quantity ? "ring-2 ring-brand" : ""}`}>
      <div className="flex items-center gap-2.5">
        <span className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-blush">
          {product.image ? <Image src={product.image} alt="" fill sizes="56px" className="object-cover" /> : null}
        </span>
        <span className="min-w-0">
          <span className="line-clamp-2 text-[14px] leading-tight font-semibold">{product.name}</span>
          <span className="mt-0.5 block text-sm text-muted tabular-nums">{formatPrice(product.price)}</span>
        </span>
      </div>

      {quantity === 0 ? (
        <button
          type="button"
          data-add={product.id}
          onClick={onAdd}
          aria-label={`Agregar ${product.name}, ${formatPrice(product.price)}`}
          className={`${press} flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full bg-blush text-sm font-semibold text-brand-ink active:bg-brand active:text-white`}
        >
          <PlusIcon width={16} height={16} /> Agregar
        </button>
      ) : (
        <div role="group" aria-label={`Cantidad de ${product.name}`} className="flex min-h-11 items-center justify-between rounded-full bg-blush">
          <button type="button" data-minus={product.id} onClick={onRemove} aria-label={`Restar uno de ${product.name}`} className={`${press} grid size-11 place-items-center rounded-full bg-paper ring-1 ring-line`}>
            <MinusIcon width={18} height={18} />
          </button>
          <span data-quantity={product.id} className="min-w-8 text-center text-lg font-semibold tabular-nums" aria-live="polite">
            {quantity}
          </span>
          <button type="button" data-plus={product.id} onClick={onAdd} aria-label={`Sumar uno de ${product.name}`} className={`${press} grid size-11 place-items-center rounded-full bg-brand text-white`}>
            <PlusIcon width={18} height={18} />
          </button>
        </div>
      )}
    </div>
  );
}
