import { BASE, createPhoneDemo } from "./lib/phone-demo.mjs";

// Records the demo video of a shop that confirms every order (orders.payment: "confirmacion"): the customer
// sends an order without paying, the shop confirms it in /admin (or proposes another time, or rejects it),
// and the customer sees the answer. A title for every step. ALWAYS frame by frame at 30 fps (scripts/lib/phone-demo.mjs).
//
// Usage: SHOP=bonne-francie npm run dev -- -p 3100     (the shop must use payment "confirmacion")
//        npm run record-approval-demo -- demo/bonne-francie-confirmacion.mp4
// Writes <out>.mp4 and <out>-email.mp4 (same frames, smaller).
// Env:   NOTES="..."  the order comment    TEST=1  only the customer part, no titles (a quick check)    FPS=30 is the rule
const OUT = process.argv[2] ?? "demo/confirmacion.mp4";
const TEST = Boolean(process.env.TEST);

const STEPS = [
  { label: "El cliente arma su pedido", title: "El cliente arma su pedido", text: "Elige lo que quiere del menú para llevar." },
  { label: "Lo envía sin pagar", title: "Elige el retiro y lo envía", text: "No se cobra nada online: el local lo revisa primero." },
  { label: "El local lo recibe", title: "El local recibe el pedido", text: "Le llega al panel como «Por confirmar», arriba de todo." },
  { label: "Confirma o rechaza", title: "Confirma, propone otro horario o rechaza", text: "El local decide antes de aceptar nada, y avisa por WhatsApp con un toque." },
  { label: "El cliente se entera", title: "El cliente ve la respuesta", text: "Su pedido pasa a «Confirmado» y paga al retirar." },
];
const INCLUDED = [
  ["Sin pago online", "El cliente envía el pedido y paga al retirar"],
  ["Pedidos por confirmar", "Llegan al panel, primero los que esperan respuesta"],
  ["Otro horario o rechazo", "Con el motivo, para que el cliente lo entienda"],
  ["Aviso por WhatsApp", "Mensaje listo para el cliente, en un toque"],
  ["Ventas de lo confirmado", "El panel cuenta solo los pedidos aceptados"],
  ["Todo desde el celular", "Para el mostrador y la cocina"],
];
const bag = (size, color) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8h14l-1 12H6L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>`;

const demo = await createPhoneDemo({ out: OUT, steps: STEPS });
const { page, hold, until, find, tap, point, type, load, glide, offsetOf, caption } = demo;
const glideSnapped = (to, ms) => glide(to, ms, true);

// ---------- Part 1: the customer sends an order, without paying ----------
await load(BASE);
await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
await load(BASE);
const colors = await page.evaluate(() => {
  const s = getComputedStyle(document.documentElement);
  return Object.fromEntries(["brand", "brand-ink", "blush", "cream", "ink", "muted", "line"].map((k) => [k, s.getPropertyValue(`--${k}`).trim()]));
});
const shopName = await page.evaluate(() => document.title.split("·")[0].trim());

demo.startPart("cliente");
await hold(demo.introMs); // the intro card covers this

caption(1);
await hold(1200);
if (await page.$("#como")) { await glideSnapped(await offsetOf("#como", 80), 1800); await hold(1500); }
await glideSnapped(await offsetOf("#favoritas", 80), 1600); await hold(900);
await page.evaluate(() => document.querySelector("#favoritas").closest("section").querySelector("ul").scrollBy({ left: 300, behavior: "smooth" }));
await hold(1500);
await glideSnapped(0, 1800); await hold(700);

// The take-away catalog: the notice (if any), then scroll to the middle of the next category
await tap("header nav a[href='/take-away']");
await until(() => location.pathname === "/take-away");
const notice = await find("[role=dialog] button", "Entendido", 5000).catch(() => null);
if (notice) { await hold(2500); await tap(notice); await hold(900); } else await hold(1200);

const target = await page.evaluate(() => {
  const next = document.querySelectorAll("main section[id]")[1];
  const r = next.getBoundingClientRect();
  return r.top + scrollY + r.height / 2 - innerHeight / 2;
});
await glideSnapped(target * 0.45, 2000); await hold(600);
await glideSnapped(target, 2400); await hold(900);

// Quick add with the card's +, then open another product and take two
const cards = await page.evaluateHandle(() => {
  const items = [...document.querySelectorAll("main section[id]")[1].querySelectorAll("li")].filter((li) => li.querySelector("button[aria-label^='Agregar']"));
  const mid = innerHeight / 2;
  return items.sort((x, y) => Math.abs(x.getBoundingClientRect().top + 100 - mid) - Math.abs(y.getBoundingClientRect().top + 100 - mid)).slice(0, 2);
});
const [first, second] = await Promise.all([0, 1].map(async (i) => (await cards.getProperty(String(i))).asElement()));
await tap(await first.$("button[aria-label^='Agregar']")); await hold(2000);
await tap(await second.$("button")); await hold(1400);
await tap("[role=dialog] button[aria-label^='Sumar']"); await hold(800);
{
  const add = await find("[role=dialog] button", "Agregar");
  const box = await add.boundingBox();
  await page.evaluate((x, y) => window.__tap(x, y), box.x + box.width / 2, box.y + box.height / 2 - 12);
  await hold(250);
  await add.evaluate((e) => e.click());
  await hold(1800);
}

// The cart: pickup day and time, contact details, and "Enviar pedido" (no payment)
caption(2);
await tap(await find("main button", "Ver pedido")); await hold(1500);
await find("[role=dialog] [aria-label='Día de retiro'] [role=radio]");
await tap((await page.$$("[role=dialog] [aria-label='Día de retiro'] [role=radio]"))[1], true); await hold(700);
const slots = await page.$$("[role=dialog] [aria-label='Horario de retiro'] [role=radio]");
const labels = await Promise.all(slots.map((s) => s.evaluate((e) => e.textContent.trim())));
await tap(slots[labels.indexOf("17:00") >= 0 ? labels.indexOf("17:00") : Math.floor(slots.length / 2)], true); await hold(700);
await tap("input[name=name]", true); await type("Lucía Fernández"); await hold(300);
await tap("input[name=phone]", true); await type("341 555-1234"); await hold(500);
await tap("textarea[name=notes]", true); await type(process.env.NOTES || "Sin semillas, por favor 🥐", 45); await hold(900);
await point("[role=dialog] button[type=submit]"); await hold(900); // "Enviar pedido": nothing to pay
await tap("[role=dialog] button[type=submit]", true);
await until(() => location.pathname === "/pedido");
await hold(4200); // "¡Pedido enviado!": waiting for the shop

const orderUrl = page.url();
const ref = new URL(orderUrl).searchParams.get("ref");
await demo.endPart();

if (TEST) {
  await demo.quickClip();
  process.exit(0);
}

// ---------- Part 2: the shop's panel: it arrives, and the shop decides ----------
await load(`${BASE}/admin?nuevo=${ref}`);
await hold(500);
demo.startPart("local");
caption(3);
await hold(3600);

caption(4);
await tap(await find("button", "Otro horario")); await hold(2400); // three other pickup times
await tap(await find("button", "Rechazar")); await hold(2200); // or reject, with a reason
await tap(await find("button", "Rechazar")); await hold(500);
await tap(await find("button", "Confirmar")); await hold(2400);
await point(await find("a", "por WhatsApp")); await hold(2600); // one tap and the message to the customer is ready
await demo.endPart();

// ---------- Part 3: the customer's order, now confirmed ----------
await load(orderUrl);
demo.startPart("respuesta");
caption(5);
await hold(4200);
await hold(demo.outroMs); // the closing card covers this
await demo.endPart();

await demo.finish({
  colors,
  logoSvg: bag,
  intro: { title: shopName, subtitle: "Pedidos que el local confirma", note: "Demostración: el cliente no paga online" },
  outro: { title: "Cada pedido, bajo tu control", subtitle: `${shopName} · confirmación de pedidos`, items: INCLUDED, footer: "Demostración con datos de ejemplo: no se cobra ni se envía nada." },
});
