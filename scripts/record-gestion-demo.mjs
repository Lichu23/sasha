import { BASE, createPhoneDemo } from "./lib/phone-demo.mjs";

// Records the demo video of a shop in management mode (shop.ts `management`, with admin: true): the staff's Caja
// (tap what the customer asks for, the total adds itself, charge), the day's sales with a calendar and the cash
// closing, and the summary. A title for every step. ALWAYS frame by frame at 30 fps (scripts/lib/phone-demo.mjs).
//
// Usage: SHOP=magnolia npm run dev -- -p 3100
//        npm run record-gestion-demo -- demo/magnolia-gestion.mp4
// Writes <out>.mp4 and <out>-email.mp4 (same frames, smaller).
// Env:   TEST=1  only the Caja, no titles (a quick check)    FPS=30 is the rule
const OUT = process.argv[2] ?? "demo/gestion.mp4";
const TEST = Boolean(process.env.TEST);
const DAY_MS = 24 * 60 * 60 * 1000;

const STEPS = [
  { label: "La caja con el menú", title: "La caja, con todo el menú", text: "Por categoría o buscando, con foto y precio." },
  { label: "Suman lo que pide", title: "Suman lo que pide el cliente", text: "Con + y − ajustan la cantidad de cada producto." },
  { label: "El total se suma solo", title: "El total se suma solo", text: "Ajustan cantidades y anotan la mesa." },
  { label: "Eligen cómo paga", title: "Eligen cómo paga y cobran", text: "Efectivo, tarjeta, Mercado Pago o transferencia." },
  { label: "Las ventas del día", title: "Las ventas del día", text: "Lo vendido, cómo se pagó y cada venta, en un calendario." },
  { label: "Cierre de caja", title: "Cierre de caja", text: "Cuánto efectivo debería haber, y si sobra o falta." },
  { label: "El resumen", title: "El resumen", text: "Ventas por día, lo más vendido y las horas pico." },
];
const INCLUDED = [
  ["Caja rápida", "Tocan lo que pide el cliente y el total se suma solo"],
  ["Medios de pago", "Efectivo, tarjeta, Mercado Pago y transferencia"],
  ["Ventas del día", "Con calendario para ver cualquier otro día"],
  ["Cierre de caja", "Cuánto efectivo debería haber, y si sobra o falta"],
  ["Anular una venta", "Si hubo un error, queda registrado"],
  ["Resumen", "Ventas por día, lo más vendido y las horas pico"],
];
const cup = (size, color) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9Z"/><path d="M17 11h1.5a2.5 2.5 0 0 1 0 5H17"/><path d="M8 3v3M12 3v3"/></svg>`;

const demo = await createPhoneDemo({ out: OUT, steps: STEPS });
const { page, hold, until, find, tap, type, load, glide, offsetOf, caption } = demo;
// A product's tile: "Agregar" once, then the amount is set with + and −. The order bar floats over the bottom of the
// screen, so a tile is brought to the middle before it is tapped.
async function press(selector) {
  await page.$eval(selector, (el) => el.scrollIntoView({ block: "center", behavior: "smooth" }));
  await hold(650);
  await tap(selector);
}
const add = (id) => `button[data-add='${id}']`;
const plus = (id) => `button[data-plus='${id}']`;
const minus = (id) => `button[data-minus='${id}']`;

// ---------- The staff: the Caja ----------
await load(BASE);
await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
await load(BASE); // the shop's address opens the Caja
await until(() => location.pathname === "/admin/caja");
const colors = await page.evaluate(() => {
  const s = getComputedStyle(document.documentElement);
  return Object.fromEntries(["brand", "brand-ink", "blush", "cream", "ink", "muted", "line"].map((k) => [k, s.getPropertyValue(`--${k}`).trim()]));
});
const shopName = await page.evaluate(() => document.title.split("·")[0].trim().replace(/^Caja$/, "") || "Magnolia");

demo.startPart("caja");
await hold(demo.introMs); // the intro card covers this

// 1. The menu: by category
caption(1);
await hold(1500);
await tap("button[data-category='cafeteria']"); await hold(1500);

// 2. What the customer asks for: two café con leche, four medialunas (one too many), a tostado
caption(2);
await press(add(1105)); await hold(900);
await press(plus(1105)); await hold(1100); // the amount is on the product: 2
await tap("button[data-category='dulces']"); await hold(900);
await press(add(1302)); await hold(800);
for (let i = 0; i < 3; i++) { await press(plus(1302)); await hold(450); } // 4
await press(minus(1302)); await hold(1200); // one less: 3
await tap("button[data-category='desayunos']"); await hold(900);
await press(add(1010)); await hold(1200);

// 3. The order: the total adds itself; amounts, and the table
caption(3);
await tap("button[data-order-bar]"); await hold(2200);
{
  // The order has the same + and −: one more café con leche
  const more = await page.$$("[role=dialog] button[aria-label='Sumar uno']");
  const names = await page.$$eval("[role=dialog] ul > li", (items) => items.map((li) => li.textContent));
  await tap(more[names.findIndex((t) => t.includes("Café con leche"))]); await hold(1400);
}
await tap(await find("[role=dialog] button", "Mesa")); await hold(700);
await tap("[role=dialog] input[name=note]", true); await type("Mesa 4"); await hold(900);

// 4. How they pay, and charge
caption(4);
await tap(await find("[role=dialog] button", "Tarjeta")); await hold(1400);
await tap("button[data-charge]"); await hold(800);
await find("[role=status]", "Venta"); await hold(2600); // "Venta guardada"

if (TEST) {
  await demo.endPart();
  await demo.quickClip();
  process.exit(0);
}

// 5. The day's sales, and the calendar to see another day
caption(5);
await tap(await find("[role=status] a", "Ver ventas"));
await until(() => location.pathname === "/admin/dia");
await hold(3200); // today: the total, the new sale counted
await glide(await offsetOf("#tickets-title", 90), 1600); await hold(2600); // the sale just charged, first in the list
await glide(0, 1200); await hold(400);
await tap("button[data-calendar]"); await hold(2600); // the calendar, with what was sold each day
{
  const yesterday = (await page.$eval("[role=dialog] [data-today]", (el) => Number(el.dataset.day))) - DAY_MS;
  await tap(`[role=dialog] button[data-day='${yesterday}']`); await hold(900);
}
await tap(await find("[role=dialog] button", "Ver este día")); await hold(2800);
await tap("button[aria-label='Día siguiente']"); await hold(1600); // back to today

// 6. The cash closing: what the drawer should hold, what was counted
caption(6);
await glide(await offsetOf("#closing-title", 90), 1800); await hold(1000);
{
  const expected = await page.evaluate(() => {
    const text = document.querySelector("#closing-title")?.closest("section")?.querySelector(".tabular-nums")?.textContent ?? "0";
    return Number(text.replace(/\D/g, ""));
  });
  await tap("input[name=counted]", true); await type(String(Math.max(0, expected - 1500)), 80); await hold(1800); // 1.500 short
}
await tap("button[data-close-day]"); await hold(3000);

// 7. The summary
caption(7);
await glide(0, 800);
await tap("header nav a[href='/admin/ventas']");
await until(() => location.pathname === "/admin/ventas");
await hold(3200);
await glide(await offsetOf("#by-day", 100), 1800); await hold(2600);
await glide(await offsetOf("#top", 100), 1600); await hold(2400);
await glide(await offsetOf("#by-hour", 100), 1800); await hold(2600);
await hold(demo.outroMs); // the closing card covers this
await demo.endPart();

await demo.finish({
  colors,
  logoSvg: cup,
  intro: { title: shopName, subtitle: "Gestión de ventas para la cafetería", note: "Demostración con datos de ejemplo" },
  outro: { title: "La caja, bajo control", subtitle: `${shopName} · gestión de ventas`, items: INCLUDED, footer: "Demostración con datos de ejemplo: no se guarda nada fuera de este navegador." },
});
