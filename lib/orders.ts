"use client";

import { useSyncExternalStore } from "react";
import { takeawayMenu } from "@/lib/menu";
import { fromAr, pickupHours, toAr } from "@/lib/pickup";
import { hasBranches, isConsulta, lineLabel, locations, shop } from "@/lib/shop";
import { slug } from "@/shops/current";

export type OrderItem = { productId: number; sizeId: string; label: string; quantity: number; unitPrice: number };

/** One message of a consulta's WhatsApp chat (the demo's simulated chat). */
export type ChatMessage = { from: "cliente" | "local"; text: string; at: number };

export type Order = {
  ref: string;
  createdAt: number;
  pickup: number;
  name: string;
  phone: string;
  notes: string;
  /** Branch name, for shops with several pickup points. */
  location?: string;
  items: OrderItem[];
  total: number;
  /** "pendiente": still to be paid (online or at pickup). */
  payment: "pagado" | "pendiente";
  /**
   * Consultas (isConsulta, payment "whatsapp"): consulta → confirmado → completado, or cancelado. The shop agrees the
   * details with the customer on WhatsApp, edits the order here and confirms it. Mercado Pago shops: pendiente → completado.
   */
  status: "pendiente" | "completado" | "consulta" | "confirmado" | "cancelado";
  /** The shop changed what the customer asked for (items, pickup time). */
  modified?: boolean;
  /** What the customer asked for, kept the first time the shop edits the order. */
  requested?: { items: OrderItem[]; total: number; pickup: number };
  /** A note from the shop for the customer. */
  shopNote?: string;
  /** The simulated WhatsApp chat about this consulta: first the customer's message with the order. */
  messages?: ChatMessage[];
  /** A message the shop's chat opens with, written for the moment (e.g. the confirmation), until it is sent. */
  draft?: string;
  /** Sample data generated for the demo, as opposed to an order placed in the store. */
  sample: boolean;
};

// Demo only: orders live in this browser's localStorage. A real deployment would
// keep them in a database behind an authenticated admin.
const KEY = `${slug}-orders:v4`;
const DAY_MS = 24 * 60 * 60 * 1000;

let cached: Order[] | null = null;
const listeners = new Set<() => void>();

function read(): Order[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as Order[];
    }
  } catch {}
  const seeded = sampleOrders(Date.now());
  write(seeded);
  return seeded;
}

function write(orders: Order[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(orders));
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
  update(updater: (orders: Order[]) => Order[]) {
    cached = updater(store.getSnapshot());
    write(cached);
    listeners.forEach((l) => l());
  },
};

/** All orders, or null while rendering on the server (localStorage is client-only). */
export function useOrders(): Order[] | null {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, () => null);
}

export const orderActions = {
  /** Records an order placed in the store. Safe to call twice with the same ref. */
  add(order: Order) {
    store.update((orders) => (orders.some((o) => o.ref === order.ref) ? orders : [order, ...orders]));
  },
  setStatus(ref: string, status: Order["status"]) {
    store.update((orders) => orders.map((o) => (o.ref === ref ? { ...o, status } : o)));
  },
  addMessage(ref: string, message: ChatMessage) {
    store.update((orders) => orders.map((o) => (o.ref === ref ? { ...o, messages: [...(o.messages ?? []), message] } : o)));
  },
  setDraft(ref: string, draft?: string) {
    store.update((orders) => orders.map((o) => (o.ref === ref ? { ...o, draft } : o)));
  },
  /** The shop confirms a consulta, as it is (or as edited). */
  confirm(ref: string) {
    store.update((orders) => orders.map((o) => (o.ref === ref ? { ...o, status: "confirmado" } : o)));
  },
  cancel(ref: string) {
    store.update((orders) => orders.map((o) => (o.ref === ref ? { ...o, status: "cancelado" } : o)));
  },
  /**
   * The shop edits a consulta after talking to the customer: items (a quantity of 0 removes the line), pickup
   * time and a note. The total follows, and what the customer asked for is kept the first time.
   */
  edit(ref: string, patch: { items: OrderItem[]; pickup: number; shopNote: string }) {
    store.update((orders) =>
      orders.map((o) => {
        if (o.ref !== ref) return o;
        const items = patch.items.filter((i) => i.quantity > 0);
        const total = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
        const changed = total !== o.total || patch.pickup !== o.pickup || JSON.stringify(items) !== JSON.stringify(o.items);
        return {
          ...o,
          items,
          total,
          pickup: patch.pickup,
          shopNote: patch.shopNote.trim() || undefined,
          modified: o.modified || changed,
          requested: o.requested ?? (changed ? { items: o.items, total: o.total, pickup: o.pickup } : undefined),
        };
      }),
    );
  },
};

// ---------------------------------------------------------------------------
// Sample data: realistic orders built from the real take-away menu and prices.

export function random(seed: number) {
  // mulberry32: small, deterministic PRNG so the sample data is stable per day.
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const FIRST_NAMES = ["Lucía", "Martina", "Sofía", "Valentina", "Camila", "Julieta", "Paula", "Florencia", "Mateo", "Santiago", "Tomás", "Joaquín", "Facundo", "Nicolás", "Agustina", "Carolina", "Gonzalo", "Mariana"];
export const LAST_NAMES = ["González", "Rodríguez", "Fernández", "López", "Martínez", "Pérez", "Gómez", "Díaz", "Sánchez", "Romero", "Álvarez", "Torres", "Ruiz", "Benítez", "Acosta", "Medina"];
const NOTES = ["", "", "", "", "Escribir “Feliz cumple, Sofi”", "Con velitas, por favor", "Retira su hermano", "Sin frutos secos si se puede", "Escribir “Felicidades”"];

function sampleOrders(now: number): Order[] {
  const today = toAr(now);
  const rand = random(today.year * 10000 + today.month * 100 + today.date);
  const pick = <T,>(list: readonly T[]) => list[Math.floor(rand() * list.length)];

  const cakes = takeawayMenu.flatMap((c) => c.products);
  // The house favourites sell more often.
  const favourites = cakes.filter((c) => shop.home.featured?.includes(c.name));
  const popular = favourites.length ? favourites : cakes.slice(0, 6);
  const orders: Order[] = [];

  // Pickup days from 60 days ago (so 30-day comparisons have a full previous period) to 6 days ahead, open days only.
  for (let offset = -60; offset <= 6; offset++) {
    const dayStart = fromAr(today.year, today.month, today.date + offset, 0);
    const day = toAr(dayStart);
    const hours = pickupHours(day.weekday);
    if (!hours.length) continue;

    const weekend = day.weekday === 0 || day.weekday === 6;
    const future = offset > 0;
    // Fewer orders exist yet for days further ahead.
    // A gentle upward trend: the last 30 days sell a little more than the 30 before.
    const base = (weekend ? 4 : 2) + (offset > -30 ? 0.6 : 0);
    const count = Math.max(0, Math.round(base + rand() * 2 - (future ? offset * 0.5 : 0)));

    for (let i = 0; i < count; i++) {
      const hour = hours[Math.floor(rand() * hours.length)];
      const pickup = fromAr(day.year, day.month, day.date, hour);
      // Ordered 2 to 6 days before pickup, never in the future.
      const createdAt = Math.min(now - 60 * 60 * 1000, pickup - (2 + rand() * 4) * DAY_MS);

      const lines = 1 + (rand() < 0.2 ? 1 : 0);
      const items: OrderItem[] = [];
      for (let l = 0; l < lines; l++) {
        const cake = rand() < 0.6 ? pick(popular) : pick(cakes);
        const size = cake.sizes.length > 1 ? (rand() < 0.65 ? cake.sizes.at(-1)! : pick(cake.sizes)) : cake.sizes[0];
        if (items.some((it) => it.productId === cake.id && it.sizeId === size.id)) continue;
        items.push({
          productId: cake.id,
          sizeId: size.id,
          label: lineLabel(cake.name, size),
          quantity: rand() < 0.15 ? 2 : 1,
          unitPrice: size.price,
        });
      }

      const isPast = pickup < now;
      orders.push({
        ref: `${shop.orders.referencePrefix}-${Math.floor(rand() * 0xffffffff).toString(16).toUpperCase().padStart(8, "0")}`,
        createdAt,
        pickup,
        name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
        phone: `11 ${String(2000 + Math.floor(rand() * 7999))}-${String(1000 + Math.floor(rand() * 8999))}`,
        notes: pick(NOTES),
        location: hasBranches ? pick(locations).name : undefined,
        items,
        total: items.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0),
        // WhatsApp orders are paid on pickup, so only past ones count as paid.
        payment: shop.orders.payment === "whatsapp" ? (isPast ? "pagado" : "pendiente") : !isPast && rand() < 0.12 ? "pendiente" : "pagado",
        status: isPast ? "completado" : isConsulta ? (rand() < 0.3 ? "consulta" : "confirmado") : "pendiente",
        sample: true,
      });
    }
  }
  return orders.sort((a, b) => b.createdAt - a.createdAt);
}
