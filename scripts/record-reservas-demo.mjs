import { BASE, createPhoneDemo } from "./lib/phone-demo.mjs";

// Records the demo video of the table reservations (shop.ts `reservations`, with orders.simulatedWhatsapp and
// admin: true): the customer picks a day, how many people and a time with room, and taps "Reservar" (a simulated
// WhatsApp opens with the request), the reservation shows up in the panel with the seats left, the shop adjusts it
// with the customer in the chat, modifies and confirms it, and sends the confirmation with its last state. A title
// for every step. ALWAYS frame by frame at 30 fps (scripts/lib/phone-demo.mjs).
//
// Usage: SHOP=bonne-francie npm run dev -- -p 3100
//        npm run record-reservas-demo -- demo/bonne-francie-reservas.mp4
// Writes <out>.mp4 and <out>-email.mp4 (same frames, smaller).
// Env:   NOTES="..."  the customer's comment    TEST=1  only the customer part, no titles (a quick check)    FPS=30 is the rule
const OUT = process.argv[2] ?? "demo/reservas.mp4";
const DAY_MS = 24 * 60 * 60 * 1000;
const TEST = Boolean(process.env.TEST);

const STEPS = [
  { label: "Elige día, personas y hora", title: "Elige el día, cuántos son y la hora", text: "Solo ve los horarios con lugar para su grupo." },
  { label: "Toca «Reservar»", title: "Completa y toca «Reservar»", text: "Se abre WhatsApp con el pedido de mesa ya escrito." },
  { label: "La reserva en el panel", title: "La reserva aparece en el panel", text: "Con los lugares que quedan ese día." },
  { label: "La ajustan por WhatsApp", title: "La ajustan por WhatsApp con el cliente", text: "Hablan como siempre, desde el chat de la reserva." },
  { label: "Modifican y confirman", title: "Modifican la reserva y la confirman", text: "Horario, personas y una nota. Después, confirmar." },
  { label: "El último estado", title: "El mensaje de confirmación", text: "Un botón arma el mensaje con la reserva como quedó." },
  { label: "Se lo envían al cliente", title: "Lo envían al cliente", text: "Un toque en enviar, y el cliente lo tiene." },
];
const INCLUDED = [
  ["Reservas desde la web", "Día, horario y personas, solo con lugar"],
  ["Chat con el cliente", "Se ajusta la reserva hablando, como siempre"],
  ["Modificar y confirmar", "Horario, personas y una nota, con un toque"],
  ["Lugares a la vista", "El panel muestra cuántos quedan en cada horario"],
  ["Control del día", "Llegó o no vino, para llevar el salón"],
  ["Mensaje de confirmación", "Escrito para el cliente, con la reserva como quedó"],
];
const table = (size, color) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10h16M6 10v9M18 10v9M3 6h18"/><path d="M8 6V4h8v2"/></svg>`;

const demo = await createPhoneDemo({ out: OUT, steps: STEPS });
const { page, hold, until, find, tap, point, type, load, glide, offsetOf, caption } = demo;

// ---------- Part 1: the customer, from the reservations page to the simulated WhatsApp ----------
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

// 1. The reservations page: the day (tomorrow's lunch is full), how many people, a time with room
caption(1);
await hold(1000);
await tap("header nav a[href='/reservas']");
await until(() => location.pathname === "/reservas");
await hold(1500);
await find("[aria-label='Calendario'] [data-today]"); await hold(1500);
const today = await page.$eval("[aria-label='Calendario'] [data-today]", (el) => Number(el.dataset.day));
await tap(`[aria-label='Calendario'] button[data-day='${today + DAY_MS}']`); await hold(900); // mañana, in the calendar
for (let i = 0; i < 2; i++) { await tap("button[aria-label='Una persona más']"); await hold(500); } // 4 people
await glide(await offsetOf("[aria-label='Horario de la reserva']", 140), 1400); await hold(2400); // the struck-through times have no room
await tap(await find("[aria-label='Horario de la reserva'] [role=radio]", "11:00"), true); await hold(900);

// 2. Complete it and "Reservar"
caption(2);
await tap("input[name=name]", true); await type("Lucía Fernández"); await hold(300);
await tap("input[name=phone]", true); await type("341 555-1234"); await hold(500);
await tap("textarea[name=notes]", true); await type(process.env.NOTES || "Cumpleaños de mi mamá 🎂", 45); await hold(900);
await point("button[type=submit]"); await hold(900);
await tap("button[type=submit]");
await until(() => location.pathname === "/whatsapp");
await find("[role=log] span", "Quiero reservar"); await hold(1500);
await find("[role=log] span", "Recibimos tu reserva"); await hold(3200); // the request as the customer's message, and the shop's answer

const ref = new URL(page.url()).searchParams.get("ref");
await demo.endPart();

if (TEST) {
  await demo.quickClip();
  process.exit(0);
}

// ---------- Part 2: the shop: the panel, the chat, the edit, the confirmation ----------
await load(`${BASE}/admin/reservas?nuevo=${ref}`);
await hold(500);
demo.startPart("local");

// 3. The reservation in the panel, and the seats left on its day
caption(3);
await hold(2600);
await glide(await offsetOf("[aria-label='Día']", 90), 1200); await hold(500);
await tap("button[data-calendar]"); await hold(2800); // the calendar opens over the page, with a count per day
{
  const tomorrow = (await page.$eval("[role=dialog] [data-today]", (el) => Number(el.dataset.day))) + DAY_MS;
  await tap(`[role=dialog] button[data-day='${tomorrow}']`); await hold(1000);
}
await tap(await find("[role=dialog] button", "Ver este día")); await hold(3000); // tomorrow: how full the lunch is
await glide(0, 1200); await hold(600);

// 4. The chat with the customer, to adjust the reservation
caption(4);
await tap(await find("a", "Abrir chat con"));
await until(() => location.pathname === "/whatsapp");
await hold(2200);
await tap("textarea[name=message]", true); await hold(300);
await type("Hola Lucía! ¿Te sirve a las 11:30? Así te dejamos la mesa de la ventana 🙂", 50); await hold(500);
await tap("button[aria-label='Enviar']");
await find("[role=log] span", "me parece perfecto"); await hold(2400);
await tap("button[aria-label='Volver']");
await until(() => location.pathname === "/admin/reservas");
await hold(600);

// 5. Modify the reservation and confirm it
caption(5);
await tap(await find("button", "Modificar")); await hold(1800);
await tap("button[data-field=time]"); await hold(3000); // the calendar and the times open over the page, with the seats left
{
  const free = await page.$$("[role=dialog] button[data-slot]:not(:disabled)");
  const taken = await page.$$eval("[role=dialog] button[data-slot]:not(:disabled)", (els) => els.findIndex((e) => e.getAttribute("aria-pressed") === "true"));
  await tap(free[Math.min(taken + 1, free.length - 1)]); await hold(1600); // half an hour later
}
await tap(await find("[role=dialog] button", "Usar este horario")); await hold(1500);
await tap("input[name=note]", true); await type("Mesa de la ventana, como pediste", 45); await hold(800);
await tap(await find("button", "Guardar cambios")); await hold(2800); // "Modificada", and what she asked for
await tap(await find("button", "Confirmar")); await hold(2200);

// 6. The confirmation button: the chat opens with the message for the reservation's last state
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
  logoSvg: table,
  intro: { title: shopName, subtitle: "Reservas de mesa por WhatsApp", note: "Demostración: no se envía nada" },
  outro: { title: "El salón, bajo control", subtitle: `${shopName} · reservas de mesa`, items: INCLUDED, footer: "Demostración con datos de ejemplo: no se cobra ni se envía nada." },
});
