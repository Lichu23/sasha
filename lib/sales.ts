"use client";

import { useSyncExternalStore } from "react";
import { startOfArDay } from "@/lib/admin-dates";
import { posMenu } from "@/lib/menu";
import { random } from "@/lib/orders";
import { fromAr, toAr } from "@/lib/pickup";
import { management, shiftsOn } from "@/lib/shop";
import { slug } from "@/shops/current";

// The sales of a shop in management mode: what the staff load on the Caja, the day's closings and the summary. Demo
// only: they live in this browser's localStorage. A real deployment needs a database behind a login, so every phone
// and tablet of the shop sees the same sales (see README, "Management mode").

export type SaleLine = { productId: number; sizeId: string; label: string; quantity: number; unitPrice: number };

export type SaleKind = "mostrador" | "mesa" | "llevar";
export const KIND_LABEL: Record<SaleKind, string> = { mostrador: "Mostrador", mesa: "Mesa", llevar: "Para llevar" };

export type Sale = {
  ref: string;
  /** Ticket number, counting up through the shop's life. */
  n: number;
  at: number;
  lines: SaleLine[];
  total: number;
  /** One of the shop's payment methods. */
  method: string;
  kind: SaleKind;
  /** The table or the customer's name. */
  note: string;
  /** Taken out of the day's totals (a mistake, a refund). */
  voided?: boolean;
  /** Sample data generated for the demo, as opposed to a sale loaded in the Caja. */
  sample: boolean;
};

/** A day's cash closing: what the drawer should hold against what was counted. */
export type Closure = { at: number; expectedCash: number; countedCash: number };

export type SalesState = { sales: Sale[]; closures: Record<string, Closure> };

export const CASH = management?.paymentMethods[0] ?? "Efectivo";

// ---------------------------------------------------------------------------
// The store (localStorage, read through useSyncExternalStore: null while rendering on the server).

const KEY = `${slug}-sales:v1`;
let cached: SalesState | null = null;
const listeners = new Set<() => void>();

function read(): SalesState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SalesState>;
      if (Array.isArray(parsed.sales)) return { sales: parsed.sales, closures: parsed.closures ?? {} };
    }
  } catch {}
  const seeded: SalesState = { sales: sampleSales(Date.now()), closures: {} };
  write(seeded);
  return seeded;
}

function write(state: SalesState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
}

const store = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    const onStorage = (e: StorageEvent) => {
      if (e.key !== KEY) return;
      cached = null;
      listener();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  },
  getSnapshot: () => (cached ??= read()),
  update(updater: (state: SalesState) => SalesState) {
    cached = updater(store.getSnapshot());
    write(cached);
    listeners.forEach((l) => l());
  },
};

export function useSales(): SalesState | null {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, () => null);
}

export const salesActions = {
  /** Records a sale. Returns it, with its ticket number. */
  add(input: Omit<Sale, "ref" | "n" | "total" | "sample">): Sale {
    const state = store.getSnapshot();
    const n = state.sales.reduce((max, s) => Math.max(max, s.n), 0) + 1;
    const sale: Sale = {
      ...input,
      n,
      ref: `${slug.toUpperCase().slice(0, 8)}-${n}`,
      total: input.lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0),
      sample: false,
    };
    store.update((s) => ({ ...s, sales: [sale, ...s.sales] }));
    return sale;
  },
  /** Takes a sale out of the totals (or puts it back). */
  setVoided(ref: string, voided: boolean) {
    store.update((s) => ({ ...s, sales: s.sales.map((x) => (x.ref === ref ? { ...x, voided } : x)) }));
  },
  closeDay(day: number, closure: Closure) {
    store.update((s) => ({ ...s, closures: { ...s.closures, [day]: closure } }));
  },
  reopenDay(day: number) {
    store.update((s) => ({ ...s, closures: Object.fromEntries(Object.entries(s.closures).filter(([key]) => key !== String(day))) }));
  },
};

// ---------------------------------------------------------------------------
// Totals

export const counted = (sales: readonly Sale[]) => sales.filter((s) => !s.voided);
export const sumOf = (sales: readonly Sale[]) => counted(sales).reduce((sum, s) => sum + s.total, 0);

export const salesOnDay = (sales: readonly Sale[], day: number) => sales.filter((s) => startOfArDay(s.at) === day);

/** Money per payment method, in the order the shop offers them (methods with no sales included). */
export function byMethod(sales: readonly Sale[]): { method: string; total: number; count: number }[] {
  const methods = management?.paymentMethods ?? [];
  const rows = methods.map((method) => ({ method, total: 0, count: 0 }));
  for (const s of counted(sales)) {
    let row = rows.find((r) => r.method === s.method);
    if (!row) rows.push((row = { method: s.method, total: 0, count: 0 }));
    row.total += s.total;
    row.count += 1;
  }
  return rows;
}

/** Products by units sold, most first. */
export function topProducts(sales: readonly Sale[], limit: number): { name: string; units: number }[] {
  const units = new Map<string, number>();
  for (const s of counted(sales)) for (const l of s.lines) units.set(l.label, (units.get(l.label) ?? 0) + l.quantity);
  return [...units.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, count]) => ({ name, units: count }));
}

// ---------------------------------------------------------------------------
// Sample data: a believable café's days, from the real menu and its prices, so the demo's screens are full.

// What sells: the café and breakfast products most, then the rest.
const WEIGHTS: Record<string, number> = { cafeteria: 6, desayunos: 4, dulces: 3, salados: 2, "bebidas-frias": 2, "sin-tacc": 1 };
const METHOD_WEIGHTS = [4, 3, 2, 1]; // efectivo, tarjeta, Mercado Pago, transferencia
const KINDS: SaleKind[] = ["mostrador", "mesa", "llevar"];
const NAMES = ["Mesa 1", "Mesa 2", "Mesa 3", "Mesa 4", "Mesa 5", "Mesa 6", "Mesa 7", "Mesa 8"];

function sampleSales(now: number): Sale[] {
  const today = toAr(now);
  const rand = random(today.year * 10000 + today.month * 100 + today.date + 11);
  const pick = <T,>(items: readonly T[], weights?: readonly number[]) => {
    if (!weights) return items[Math.floor(rand() * items.length)];
    let r = rand() * weights.reduce((a, b) => a + b, 0);
    for (let i = 0; i < items.length; i++) if ((r -= weights[i]) < 0) return items[i];
    return items[items.length - 1];
  };

  const products = posMenu.flatMap((c) => c.products.map((p) => ({ p, weight: WEIGHTS[c.id] ?? 0.4 })));
  const methods = management?.paymentMethods ?? ["Efectivo"];
  const sales: Sale[] = [];

  for (let offset = -59; offset <= 0; offset++) {
    const dayStart = fromAr(today.year, today.month, today.date + offset, 0);
    const shifts = shiftsOn(toAr(dayStart).weekday);
    if (!shifts.length) continue;
    const [opens, closes] = [shifts[0][0], shifts.at(-1)![1]];
    const weekend = [0, 6].includes(toAr(dayStart).weekday);
    // A gentle upward trend: the last 30 days sell a little more than the 30 before.
    const count = Math.round((weekend ? 62 : 44) * (offset > -30 ? 1.12 : 1) * (0.8 + rand() * 0.4));

    for (let i = 0; i < count; i++) {
      // The morning and the merienda are the busy hours.
      const peak = rand() < 0.65 ? (rand() < 0.5 ? 9.5 : 17) : 13;
      const hour = Math.min(closes - 0.25, Math.max(opens, peak + (rand() - 0.5) * 4));
      const at = dayStart + Math.round(hour * 4) * 15 * 60 * 1000;
      if (at > now) continue;

      const lines: SaleLine[] = [];
      for (let l = 0, n = 1 + Math.floor(rand() * 3.4); l < n; l++) {
        const { p } = pick(products, products.map((x) => x.weight));
        if (lines.some((x) => x.productId === p.id)) continue;
        const size = p.sizes[0];
        lines.push({ productId: p.id, sizeId: size.id, label: p.name, quantity: rand() < 0.22 ? 2 : 1, unitPrice: size.price });
      }
      const kind = pick(KINDS, [3, 4, 2]);
      sales.push({
        ref: "",
        n: 0,
        at,
        lines,
        total: lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0),
        method: pick(methods, METHOD_WEIGHTS.slice(0, methods.length)),
        kind,
        note: kind === "mesa" ? pick(NAMES) : "",
        sample: true,
      });
    }
  }

  // Ticket numbers follow the clock; the newest first, as the store keeps them.
  sales.sort((a, b) => a.at - b.at);
  sales.forEach((s, i) => {
    s.n = i + 1;
    s.ref = `${slug.toUpperCase().slice(0, 8)}-${i + 1}`;
  });
  return sales.reverse();
}
