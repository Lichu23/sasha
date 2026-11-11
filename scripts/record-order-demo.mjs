import { BASE, createPhoneDemo } from "./lib/phone-demo.mjs";

// Records the demo video of a shop whose take-away orders are paid online (orders.payment: "mercadopago", with
// admin: true): the customer picks products, completes the order, pays with the (simulated) Mercado Pago and gets
// the confirmation; then the shop's panel shows the same order, the shop marks it delivered and looks at the sales.
// A title for every step. ALWAYS frame by frame at 30 fps (scripts/lib/phone-demo.mjs).
//
// Usage: SHOP=santa-marta npm run dev -- -p 3100
//        npm run record-order-demo -- demo/santa-marta-pedidos.mp4
// Writes <out>.mp4 and <out>-email.mp4 (same frames, smaller).
// Env:   NOTES="..."  the customer's comment (make it match what gets ordered)
//        TEST=1  only the customer part, no titles (a quick check)    FPS=30 is the rule
const OUT = process.argv[2] ?? "demo/pedidos.mp4";
const TEST = Boolean(process.env.TEST);

const STEPS = [
  { label: "Elige sus productos", title: "Elige sus productos", text: "Desde el menú take away, con foto y precio: se suman al carrito." },
  { label: "Arma el pedido", title: "Arma el pedido", text: "Elige el día y el horario de retiro y deja sus datos." },
  { label: "Paga con Mercado Pago", title: "Paga con Mercado Pago", text: "Online y antes de retirar. En esta demo el pago es simulado." },
  { label: "Pedido confirmado", title: "El pedido queda confirmado", text: "El cliente ve su número de pedido y cuándo retirarlo." },
  { label: "El pedido en el panel", title: "El pedido aparece en el panel", text: "Arriba de todo, como nuevo, con el detalle del cliente." },
  { label: "Lo marcan entregado", title: "Lo marcan como entregado", text: "Cuando el cliente retira, un toque y queda registrado." },
  { label: "Las ventas", title: "Las ventas, a la vista", text: "Ventas por día, lo más pedido y los días fuertes de la semana." },
];
const INCLUDED = [
  ["Carta online", "El menú con fotos y precios, siempre al día"],
  ["Pedidos para llevar", "El cliente elige, arma el pedido y retira"],
  ["Pago con Mercado Pago", "Se cobra online, antes de que retiren"],
  ["Retiro con horario", "Día y hora a elegir, con aviso de anticipación"],
  ["Panel de pedidos", "Cada pedido en una tarjeta, fácil de leer"],
  ["Ventas y resumen", "Por día, lo más pedido y los días fuertes"],
];
const bag = (size, color) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8h14l-1 12H6L5 8Z"/><path d="M9 8V7a3 3 0 0 1 6 0v1"/></svg>`;

const demo = await createPhoneDemo({ out: OUT, steps: STEPS });
const { page, hold, until, find, tap, type, load, glide, offsetOf, caption } = demo;
const glideSnapped = (to, ms) => glide(to, ms, true);

// ---------- Part 1: the customer, from the take-away menu to the confirmation ----------
await load(BASE);
await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
await load(`${BASE}/take-away`);
const colors = await page.evaluate(() => {
  const s = getComputedStyle(document.documentElement);
  return Object.fromEntries(["brand", "brand-ink", "blush", "cream", "ink", "muted", "line"].map((k) => [k, s.getPropertyValue(`--${k}`).trim()]));
});
const shopName = await page.evaluate(() => document.title.split("·").pop().trim()); // "Pedidos para llevar · <shop>"

demo.startPart("cliente");
await hold(demo.introMs); // the intro card covers this

// 1. The menu: the notice (if any), scroll to the middle of a category, two products into the cart
caption(1);
const notice = await find("[role=dialog] button", "Entendido", 5000).catch(() => null);
if (notice) { await hold(1800); await tap(notice); await hold(900); } else await hold(900);

const target = await page.evaluate(() => {
  const next = document.querySelectorAll("main section[id]")[1];
  const r = next.getBoundingClientRect();
  return r.top + scrollY + r.height / 2 - innerHeight / 2;
});
await glideSnapped(target * 0.45, 2000); await hold(600);
await glideSnapped(target, 2400); await hold(900);

// Two products from the middle of the screen: the first is opened, its amount adjusted and added from its sheet; the
// second with the card's + (in both, the photo flies to the cart)
const cards = await page.evaluateHandle(() => {
  const items = [...document.querySelectorAll("main section[id]")[1].querySelectorAll("li")].filter((li) => li.querySelector("button[aria-label^='Agregar']"));
  const mid = innerHeight / 2;
  return items.sort((x, y) => Math.abs(x.getBoundingClientRect().top + 100 - mid) - Math.abs(y.getBoundingClientRect().top + 100 - mid)).slice(0, 2);
});
const [first, second] = await Promise.all([0, 1].map(async (i) => (await cards.getProperty(String(i))).asElement()));
await tap(await first.$("button")); await hold(1400);
await tap("[role=dialog] button[aria-label^='Sumar']"); await hold(900);
{
  const add = await find("[role=dialog] button", "Agregar");
  const box = await add.boundingBox();
  await page.evaluate((x, y) => window.__tap(x, y), box.x + box.width / 2, box.y + box.height / 2 - 12);
  await hold(250);
  await add.evaluate((e) => e.click());
  await hold(2200); // the product's photo flies to the cart
}
await tap(await second.$("button[aria-label^='Agregar']")); await hold(2400); // the card's +: its photo flies to the cart

// 2. The order: open the cart, the pickup day and time, and the customer's details
caption(2);
await tap("header button[aria-label^='Ver pedido']"); await hold(1500);
await find("[role=dialog] [aria-label='Calendario'] button:not(:disabled)"); await hold(1500); // the day, in the calendar
await tap((await page.$$("[role=dialog] [aria-label='Calendario'] button:not(:disabled)"))[1]); await hold(900);
const slots = await page.$$("[role=dialog] [aria-label='Horario de retiro'] [role=radio]");
const labels = await Promise.all(slots.map((s) => s.evaluate((e) => e.textContent.trim())));
await tap(slots[labels.indexOf("17:00") >= 0 ? labels.indexOf("17:00") : Math.floor(slots.length / 2)], true); await hold(700);
await tap("input[name=name]", true); await type("Lucía Fernández"); await hold(300);
await tap("input[name=phone]", true); await type("341 555-1234"); await hold(500);
await tap("textarea[name=notes]", true); await type(process.env.NOTES || "Feliz cumple, Martu 🎂", 45); await hold(900);

// 3. Mercado Pago (simulated), paid with the saved Visa
caption(3);
await tap("[role=dialog] button[type=submit]", true);
await tap(await find("[role=radio]", "Visa terminada")); await hold(1500);
await tap(await find("button", "Pagar"));

// 4. The confirmation
await until(() => location.pathname === "/pedido");
caption(4);
await hold(4200);

const ref = await page.evaluate(() => new URLSearchParams(location.search).get("ref"));
await demo.endPart();

if (TEST) {
  await demo.quickClip();
  process.exit(0);
}

// ---------- Part 2: the shop's panel ----------
await load(`${BASE}/admin?nuevo=${ref}`);
await hold(500);
demo.startPart("local");

// 5. The order in the panel
caption(5);
await hold(4200);

// 6. Mark it delivered
caption(6);
await tap(await find("#fresh-title ~ * label", "Marcar entregado")); await hold(1800);
await glide(700, 1800); await hold(1400);
await glide(0, 900); await hold(400);

// 7. The sales
caption(7);
await tap("header nav a[href='/admin/ventas']");
await until(() => location.pathname === "/admin/ventas"); await hold(2800);
await glide(await offsetOf("#by-day", 120), 1800); await hold(900);
{
  const bars = await page.$$("section[aria-labelledby=by-day] ul button");
  const values = await Promise.all(bars.map((b) => b.evaluate((e) => Number(e.getAttribute("aria-label").split(":").pop().replace(/\D/g, "")))));
  const recent = values.slice(-6, -1);
  await tap(bars[values.length - 6 + recent.indexOf(Math.max(...recent))]); await hold(2000);
}
await glide(await offsetOf("#top", 120), 1800); await hold(2000);
await glide(await offsetOf("#by-weekday", 120), 1800); await hold(2800);
await hold(demo.outroMs); // the closing card covers this
await demo.endPart();

await demo.finish({
  colors,
  logoSvg: bag,
  intro: { title: shopName, subtitle: "Pedidos online para llevar", note: "Demostración: el pago está simulado" },
  outro: { title: "Tu local, con pedidos online", subtitle: `${shopName} · pedidos para llevar`, items: INCLUDED, footer: "Demostración con datos de ejemplo: no se cobra nada." },
});
