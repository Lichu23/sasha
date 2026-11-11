import { BASE, createPhoneDemo } from "./lib/phone-demo.mjs";

// Records the demo video of a shop whose orders are WhatsApp consultas (orders.payment: "whatsapp", with
// orders.simulatedWhatsapp and admin: true): the customer adds a product to the cart, opens it, completes it and
// taps "Consultar" (a simulated WhatsApp opens with the order), the order shows up in the panel, the shop adjusts it
// with the customer in the chat, modifies and confirms it, and sends the confirmation with the order's last state.
// A title for every step. ALWAYS frame by frame at 30 fps (scripts/lib/phone-demo.mjs).
//
// Usage: SHOP=bonne-francie npm run dev -- -p 3100
//        npm run record-consulta-demo -- demo/bonne-francie-consulta.mp4
// Writes <out>.mp4 and <out>-email.mp4 (same frames, smaller).
// Env:   NOTES="..."  the customer's comment    TEST=1  only the customer part, no titles (a quick check)    FPS=30 is the rule
const OUT = process.argv[2] ?? "demo/consulta.mp4";
const TEST = Boolean(process.env.TEST);

const STEPS = [
  { label: "Elige un producto", title: "Elige un producto y la cantidad", text: "Desde el menú take away: queda guardado en el carrito." },
  { label: "Carrito y «Consultar»", title: "Abre el carrito y toca «Consultar»", text: "Lo completa y se abre WhatsApp con el pedido ya escrito." },
  { label: "El pedido en el panel", title: "El pedido aparece en el panel", text: "Arriba de todo, como «Consulta», con el detalle del cliente." },
  { label: "Lo ajustan por WhatsApp", title: "Lo ajustan por WhatsApp con el cliente", text: "Hablan como siempre, desde el chat del pedido." },
  { label: "Modifican y confirman", title: "Modifican el pedido y lo confirman", text: "Cantidades, horario de retiro y una nota. Después, confirmar." },
  { label: "El último estado", title: "El mensaje de confirmación", text: "Un botón arma el mensaje con el pedido como quedó." },
  { label: "Se lo envían al cliente", title: "Lo envían al cliente", text: "Un toque en enviar, y el cliente lo tiene." },
];
const INCLUDED = [
  ["Botón «Consultar»", "Guarda el pedido y abre WhatsApp con el mensaje"],
  ["Chat con el cliente", "Se ajusta el pedido hablando, como siempre"],
  ["Modificar el pedido", "Cantidades, horario de retiro y una nota"],
  ["Confirmar con un toque", "Y el mensaje sale con el pedido como quedó"],
  ["Pedidos claros en el celular", "Cada pedido en una tarjeta, fácil de leer"],
  ["Ventas de lo confirmado", "El panel cuenta solo los pedidos aceptados"],
];
const bag = (size, color) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8h14l-1 12H6L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>`;

const demo = await createPhoneDemo({ out: OUT, steps: STEPS });
const { page, hold, until, find, tap, point, type, load, glide, caption } = demo;
const glideSnapped = (to, ms) => glide(to, ms, true);

// ---------- Part 1: the customer, from the take-away menu to the simulated WhatsApp ----------
await load(BASE);
await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
await load(`${BASE}/take-away`);
const colors = await page.evaluate(() => {
  const s = getComputedStyle(document.documentElement);
  return Object.fromEntries(["brand", "brand-ink", "blush", "cream", "ink", "muted", "line"].map((k) => [k, s.getPropertyValue(`--${k}`).trim()]));
});
const shopName = await page.evaluate(() => document.title.split("·")[0].trim());

demo.startPart("cliente");
await hold(demo.introMs); // the intro card covers this

// 1. The menu: the notice (if any), scroll to the middle of a category, a product, its amount, into the cart
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

// 2. The cart: open it, complete it, "Consultar"
caption(2);
await tap("header button[aria-label^='Ver pedido']"); await hold(1500);
await find("[role=dialog] [aria-label='Calendario'] button:not(:disabled)"); await hold(1500); // the day, in the calendar
await tap((await page.$$("[role=dialog] [aria-label='Calendario'] button:not(:disabled)"))[1]); await hold(900);
const slots = await page.$$("[role=dialog] [aria-label='Horario de retiro'] [role=radio]");
const labels = await Promise.all(slots.map((s) => s.evaluate((e) => e.textContent.trim())));
await tap(slots[labels.indexOf("17:00") >= 0 ? labels.indexOf("17:00") : Math.floor(slots.length / 2)], true); await hold(700);
await tap("input[name=name]", true); await type("Lucía Fernández"); await hold(300);
await tap("input[name=phone]", true); await type("341 555-1234"); await hold(500);
await tap("textarea[name=notes]", true); await type(process.env.NOTES || "Sin semillas, por favor 🥐", 45); await hold(900);
await point("[role=dialog] button[type=submit]"); await hold(900);
await tap("[role=dialog] button[type=submit]", true);
await until(() => location.pathname === "/pedido");
await hold(800); // "¡Consulta guardada!", and WhatsApp opens by itself
await until(() => location.pathname === "/whatsapp");
await find("[role=log] span", "Quiero consultar"); await hold(1500);
await find("[role=log] span", "Recibimos tu consulta"); await hold(3200); // the order as the customer's message, and the shop's answer

const orderUrl = page.url();
const ref = new URL(orderUrl).searchParams.get("ref");
await demo.endPart();

if (TEST) {
  await demo.quickClip();
  process.exit(0);
}

// ---------- Part 2: the shop: the panel, the chat, the edit, the confirmation ----------
await load(`${BASE}/admin?nuevo=${ref}`);
await hold(500);
demo.startPart("local");

// 3. The order in the panel
caption(3);
await hold(4200);

// 4. The chat with the customer, to adjust the order
caption(4);
await tap(await find("a", "Abrir chat con"));
await until(() => location.pathname === "/whatsapp");
await hold(2200);
await tap("textarea[name=message]", true); await hold(300);
await type("Hola Lucía! ¿Te dejamos 1 caja de chocolate y retiro a las 18? 🙂", 50); await hold(500);
await tap("button[aria-label='Enviar']");
await find("[role=log] span", "me parece perfecto"); await hold(2400);
await tap("button[aria-label='Volver']");
await until(() => location.pathname === "/admin");
await hold(600);

// 5. Modify the order and confirm it
caption(5);
await tap(await find("button", "Modificar")); await hold(1800);
await find("button[aria-label='Restar uno']");
await tap((await page.$$("button[aria-label='Restar uno']")).at(-1)); await hold(1000); // one box less of the last product
await tap("button[data-field=pickup]"); await hold(3000); // the calendar and the times open over the page
{
  const free = await page.$$("[role=dialog] button[data-slot]:not(:disabled)");
  const taken = await page.$$eval("[role=dialog] button[data-slot]:not(:disabled)", (els) => els.findIndex((e) => e.getAttribute("aria-pressed") === "true"));
  await tap(free[Math.min(taken + 1, free.length - 1)]); await hold(1600); // an hour later
}
await tap(await find("[role=dialog] button", "Usar este horario")); await hold(1500);
await tap("input[name=note]", true); await type("Sin semillas, como pediste", 45); await hold(800);
await tap(await find("button", "Guardar cambios")); await hold(2800); // "Modificado", and what she asked for
await tap(await find("button", "Confirmar")); await hold(2200);

// 6. The confirmation button: the chat opens with the message for the order's last state
caption(6);
await tap(await find("a", "por WhatsApp"));
await until(() => location.pathname === "/whatsapp");
await find("textarea[name=message]");
await hold(3600);

// 7. Send it to the customer
caption(7);
await tap("button[aria-label='Enviar']");
await find("[role=log] span", "Nos vemos"); await hold(3200);
await hold(demo.outroMs); // the closing card covers this
await demo.endPart();

await demo.finish({
  colors,
  logoSvg: bag,
  intro: { title: shopName, subtitle: "Pedidos que se confirman por WhatsApp", note: "Demostración: el cliente no paga online" },
  outro: { title: "Cada pedido, bajo tu control", subtitle: `${shopName} · consultas por WhatsApp`, items: INCLUDED, footer: "Demostración con datos de ejemplo: no se cobra ni se envía nada." },
});
