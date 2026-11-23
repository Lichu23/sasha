import { BASE, createPhoneDemo } from "./lib/phone-demo.mjs";

// Records the demo video of the nutrition practice template (/nutricion) as ONE typical day, in two separate parts:
//   1. the patient: opens the page, books a consultation (free, no payment), gets the confirmation email with her data and the
//      link to cancel;
//   2. the nutritionist's day at the practice: the agenda, the patient arrives (attendance), the payment confirmed by hand, a note,
//      the email after the visit (template + pictures) and the sales it all adds up to.
// A title card for every step. ALWAYS frame by frame at 30 fps on the virtual clock (scripts/lib/phone-demo.mjs).
//
// Usage: npm run dev -- -p 3100
//        MSYS_NO_PATHCONV=1 npm run record-nutricion-demo -- demo/nutricion/nutricion-demo.mp4
// Writes <out>.mp4 and <out>-email.mp4 (same frames, smaller).
// Env:   TEST=1  only the patient part, no titles (a quick check)    FPS=30 is the rule
const OUT = process.argv[2] ?? "demo/nutricion/nutricion-demo.mp4";
const TEST = Boolean(process.env.TEST);
const DAY_MS = 24 * 60 * 60 * 1000;

const steps = [
  { key: "web", label: "Tu web", title: "Tu consultorio, abierto las 24 h", text: "Tus pacientes ven las consultas y los precios cuando quieran." },
  { key: "turno", label: "Reserva", title: "Eligen consulta, día y hora", text: "Solo ven los horarios libres de tu agenda." },
  { key: "datos", label: "Sin pago", title: "Reservan sin pagar", text: "Dejan sus datos y el turno queda reservado." },
  { key: "email", label: "Email", title: "Reciben un email con todo", text: "Los datos del turno y un link para cancelarlo." },
  { key: "agenda", label: "Agenda", title: "Tu agenda del día", text: "Cada turno con el paciente y lo que escribió." },
  { key: "llega", label: "Llega", title: "El paciente llega", text: "Confirmás que vino y abrís su ficha con todos los datos." },
  { key: "cobro", label: "Cobro", title: "Confirmás el cobro", text: "En efectivo o por transferencia, antes o después de la consulta." },
  { key: "notas", label: "Notas", title: "Anotás la consulta", text: "Peso, medidas e indicaciones, solo para vos." },
  { key: "mail", label: "Email", title: "Le enviás su plan por email", text: "Elegís una plantilla y adjuntás el plan, la lista de compras y recetas." },
  { key: "ventas", label: "Ventas", title: "Todo queda registrado", text: "Tus cobros y tus consultas del período, claros." },
];

const outro = {
  title: "Un día de consultorio, sin mensajes sueltos",
  items: [
    ["Turnos 24 h", "Tus pacientes reservan solos, sin pagar"],
    ["Email automático", "Con los datos y el link para cancelar"],
    ["Ficha del paciente", "Datos, notas y consultas en un lugar"],
    ["Cobro a mano", "Efectivo o transferencia, cuando se paga"],
    ["Emails con tu plan", "Plantillas e imágenes después de la consulta"],
    ["Ventas claras", "Tus cobros del día y del período"],
  ],
};

const mark = (size, color) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="${color}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 19c0-7.2 4.4-12.6 14-14 .4 8.6-4.2 14-11.4 14.2"/><path d="M5 19c2.2-4.4 5.2-7.6 9-9.6"/></svg>`;

const demo = await createPhoneDemo({ out: OUT, steps });
const { page, hold, until, find, tap, type, load, glide, offsetOf, caption } = demo;
const cap = (key) => caption(steps.findIndex((s) => s.key === key) + 1);
const URL = `${BASE}/nutricion`;

/** The second enabled day in the calendar (a few days out, so it has free times). */
async function pickDay() {
  const today = await page.$eval("[aria-label='Calendario'] [data-today]", (el) => Number(el.dataset.day));
  const days = await page.$$eval("[aria-label='Calendario'] button[data-day]:not(:disabled)", (els) => els.map((e) => Number(e.dataset.day)));
  return days.find((d) => d >= today + 2 * DAY_MS) ?? days.at(-1);
}

/** Moves the open sheet (it scrolls by itself, not the page) so the element sits in view, eased, one frame at a time. */
async function reveal(handle, ms = 650) {
  const plan = await handle.evaluate((e) => {
    const sheet = e.closest("[role=dialog]");
    if (!sheet) return null;
    const r = e.getBoundingClientRect();
    if (r.top > 90 && r.bottom < innerHeight - 130) return null; // already in view, clear of the footer
    return { from: sheet.scrollTop, to: Math.max(0, sheet.scrollTop + r.top - innerHeight * 0.4) };
  });
  if (!plan) return;
  const n = Math.max(1, Math.round(ms / (1000 / 30)));
  for (let i = 1; i <= n; i++) {
    const t = i / n, e = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
    await page.evaluate((v) => { document.querySelector("[role=dialog]").scrollTop = v; }, plan.from + (plan.to - plan.from) * e);
    await hold(1000 / 30);
  }
  await hold(200);
}
/** Brings an element of the open sheet into view and taps it (inside the sheets a script click is the reliable one). */
async function tapIn(selector, text) {
  const el = await find(selector, text);
  await reveal(el);
  await tap(el, true);
}

// ---------- Part 1: the patient ----------
await load(URL);
await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
await load(URL);
const colors = await page.evaluate(() => {
  const s = getComputedStyle(document.documentElement);
  return Object.fromEntries(["brand", "brand-ink", "blush", "cream", "ink", "muted", "line"].map((k) => [k, s.getPropertyValue(`--${k}`).trim()]));
});

demo.startPart("paciente");
await hold(demo.introMs); // the intro card covers this

// The home: the consultations with their prices
cap("web");
await hold(1200);
await glide(await offsetOf("#servicios", 70), 1500); await hold(2200);
await glide(await offsetOf("#pasos-titulo", 80), 1400); await hold(1800);

// The booking: consultation, online, day, time
cap("turno");
await glide(0, 800);
await tap(await find("header a", "Reservar turno"));
await until(() => location.pathname.endsWith("/reservar"));
await hold(1000);
await tap(await find("[role=radio]", "Primera consulta")); await hold(1400);
await tapIn("[role=dialog] [role=radio]", "Online"); await hold(1100);
await tap(`[aria-label='Calendario'] button[data-day='${await pickDay()}']`); await hold(1200);
const free = await page.$$("[aria-label^='Hora del'] [role=radio]:not([data-disabled]):not([aria-disabled='true'])");
const chip = free[Math.min(3, free.length - 1)];
await reveal(chip); await tap(chip, true); await hold(1300);

// Her data: no payment, just a name, a phone and an email
cap("datos");
await tap(await find("button", "Reservar turno"), true); await hold(1100);
await tapIn("[role=dialog] input[name=name]"); await type("Lucía Fernández", 50); await hold(300);
await tapIn("[role=dialog] input[name=phone]"); await type("11 2345-6789", 50); await hold(300);
await tapIn("[role=dialog] input[name=email]"); await type("lucia.fernandez@gmail.com", 40); await hold(300);
await tapIn("[role=dialog] textarea[name=notes]"); await type("Quiero bajar de peso", 45); await hold(900);
await tap("[role=dialog] [data-cta=pagar]", true); await hold(300);

// Confirmed, and the email she gets
await until(() => Boolean(document.querySelector("#confirmada")), [], 20000);
await hold(2000);
await glide(260, 1000); await hold(1800);
const ref = await page.$eval("#confirmada + p b", (el) => el.textContent.trim());
cap("email");
await tap(await find("a", "Abrir el email"), true);
await until(() => location.pathname.endsWith("/email"));
await hold(2200);
await glide(await offsetOf("[data-cta=cancelar-turno]", 420), 1500); await hold(3000);
await demo.endPart();

if (TEST) {
  await demo.quickClip();
  process.exit(0);
}

// ---------- Part 2: a day at the practice ----------
await load(`${URL}/admin?turno=${ref}`);
await hold(300);
demo.startPart("consultorio");

cap("agenda");
await hold(2400);
await glide(await offsetOf("ul[aria-label='Citas'] li:nth-child(2)", 120), 1300); await hold(1800);
await glide(0, 1000); await hold(500);

// The patient arrives: attendance, then her file
cap("llega");
await tap(await find("ul[aria-label='Citas'] li:first-child button", "Llegó")); await hold(1600);
await tap(await find("ul[aria-label='Citas'] li:first-child button", "Abrir ficha"), true); await hold(2600);

// The payment, confirmed by hand
cap("cobro");
await tapIn("[role=dialog] [role=radio]", "Transferencia"); await hold(900);
await tapIn("[role=dialog] [data-cta=cobrar]"); await hold(2000);

// A note about the consultation
cap("notas");
await tapIn("[role=dialog] textarea[name=visitNote]"); await type("Peso 68 kg. Objetivo: bajar 4 kg en 2 meses.", 40); await hold(700);
await tapIn("[role=dialog] [data-cta=guardar-nota]"); await hold(1800);

// The email after the visit: template, pictures, send
cap("mail");
await tapIn("[role=dialog] [role=radio]", "Plan alimentario"); await hold(900);
await tapIn("[role=dialog] [data-image=plan]"); await hold(800);
await tapIn("[role=dialog] [data-image=compras]"); await hold(800);
await tapIn("[role=dialog] [data-image=recetas]"); await hold(1000);
await reveal(await find("[role=dialog] article"), 1200); await hold(2200);
await tapIn("[role=dialog] [data-cta=enviar-email]"); await hold(2600);
await tap(await find("[role=dialog] button[aria-label=Cerrar]"), true); await hold(1800); // back to the agenda: the card now says it all

// The sales
cap("ventas");
await tap(await find("nav[aria-label='Panel'] a", "Ventas"));
await until(() => location.pathname.endsWith("/ventas"));
await hold(2600);
await tap(await find("[aria-label='Período'] [role=radio]", "7 días")); await glide(0, 1200); await hold(2200);
await glide(await offsetOf("#by-day", 150), 1400); await hold(2800);
await glide(await offsetOf("#methods", 150), 1400); await hold(2400);
await hold(demo.outroMs); // the closing card covers this
await demo.endPart();

await demo.finish({
  colors,
  logoSvg: mark,
  intro: { title: "Raíz Nutrición", subtitle: "Un día de consultorio con turnos online", note: "De la reserva del paciente a la consulta" },
  outro: { title: outro.title, subtitle: "Raíz Nutrición", items: outro.items, footer: "Turnos, cobros y emails de tu consultorio, en un solo lugar." },
});
