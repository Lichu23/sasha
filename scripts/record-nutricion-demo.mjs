import { BASE, createPhoneDemo } from "./lib/phone-demo.mjs";

// Records the demo video of the nutrition practice template (/nutricion), in ONE video with two separate parts:
// the patient's workflow (the page, the booking, the deposit, the confirmation), then the nutritionist's panel (agenda,
// attendance, week, patients, sales). A title card for every step. ALWAYS frame by frame at 30 fps on the virtual clock
// (scripts/lib/phone-demo.mjs).
//
// Usage: npm run dev -- -p 3100
//        MSYS_NO_PATHCONV=1 npm run record-nutricion-demo -- demo/nutricion/nutricion-demo.mp4
// Writes <out>.mp4 and <out>-email.mp4 (same frames, smaller).
// Env:   TEST=1  only the patient part, no titles (a quick check)    FPS=30 is the rule
const OUT = process.argv[2] ?? "demo/nutricion/nutricion-demo.mp4";
const TEST = Boolean(process.env.TEST);
const LONG = true;
const DAY_MS = 24 * 60 * 60 * 1000;
/** A pause: the first number for the 30 s ad, the second for the 60 s one. */
const h = (short, long) => (LONG ? long : short);

const CATALOG = [
  { key: "web", label: "Tu web", title: "Tu consultorio, abierto las 24 h", text: "Consultas, precios y cómo trabajás, siempre a mano." },
  { key: "confianza", long: true, label: "Confianza", title: "Opiniones, recetas y respuestas", text: "Tus pacientes llegan convencidos y con las dudas resueltas." },
  { key: "turno", label: "Turnos online", title: "Turnos online: presencial o videollamada", text: "Solo ven los horarios libres de tu agenda." },
  { key: "sena", label: "Seña", title: "Cobrá la seña con Mercado Pago", text: "Menos ausencias: el turno queda firme al reservar." },
  { key: "confirmacion", label: "Confirmación", title: "Confirmación y recordatorio", text: "Por WhatsApp, con el link si la consulta es online." },
  { key: "agenda", label: "Agenda", title: "El turno cae solo en tu agenda", text: "Con la seña cobrada y lo que dejó escrito el paciente." },
  { key: "asistencia", label: "Asistencia", title: "Marcá quién vino con un toque", text: "Y filtrá por estado." },
  { key: "semana", long: true, label: "Día y semana", title: "Tu semana de un vistazo", text: "Turnos e ingresos de cada día." },
  { key: "pacientes", label: "Pacientes", title: "La ficha de cada paciente", text: "Consultas, pagos y próximo turno. Buscalo por nombre." },
  { key: "ventas", label: "Ventas", title: "Tus ventas, claras", text: "Ingresos por día, consultas que más venden y cómo te pagan." },
];
const steps = CATALOG.filter((s) => LONG || !s.long);

const outro = {
  title: "Menos mensajes, más consultas",
  items: [
    ["Turnos 24 h", "Tus pacientes reservan solos, a cualquier hora"],
    ["Presencial u online", "Cada consulta con su modalidad"],
    ["Seña con Mercado Pago", "Menos ausencias sin aviso"],
    ["Recordatorio por WhatsApp", "Con el link si es videollamada"],
    ["Ficha de pacientes", "Consultas, pagos y próximo turno"],
    ["Ventas y cobros", "Ingresos, asistencia y cómo te pagan"],
  ],
};

const mark = (size, color) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="${color}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 19c0-7.2 4.4-12.6 14-14 .4 8.6-4.2 14-11.4 14.2"/><path d="M5 19c2.2-4.4 5.2-7.6 9-9.6"/></svg>`;

const demo = await createPhoneDemo({ out: OUT, steps, });
const { page, hold, until, find, tap, type, load, glide, offsetOf, caption } = demo;
const cap = (key) => caption(steps.findIndex((s) => s.key === key) + 1);
const URL = `${BASE}/nutricion`;

/** The second enabled day in the calendar (a few days out, so it has free times). */
async function pickDay() {
  const today = await page.$eval("[aria-label='Calendario'] [data-today]", (el) => Number(el.dataset.day));
  const days = await page.$$eval("[aria-label='Calendario'] button[data-day]:not(:disabled)", (els) => els.map((e) => Number(e.dataset.day)));
  return days.find((d) => d >= today + 2 * DAY_MS) ?? days.at(-1);
}

/**
 * Brings something inside the open sheet into view, one frame at a time. The sheet scrolls by itself (not the page), and the
 * quick pace of the ad is too short for the smooth scroll a tap starts, so the sheet is moved here, eased, before the tap.
 */
async function reveal(handle, ms = 450) {
  const plan = await handle.evaluate((e) => {
    const sheet = e.closest("[role=dialog]");
    if (!sheet) return null;
    const r = e.getBoundingClientRect();
    if (r.top > 70 && r.bottom < innerHeight - 110) return null; // already in view, clear of the footer
    return { from: sheet.scrollTop, to: Math.max(0, sheet.scrollTop + r.top - innerHeight * 0.42) };
  });
  if (!plan) return;
  const n = Math.max(1, Math.round(ms / (1000 / 30)));
  for (let i = 1; i <= n; i++) {
    const t = i / n, e = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
    await page.evaluate((v) => { document.querySelector("[role=dialog]").scrollTop = v; }, plan.from + (plan.to - plan.from) * e);
    await hold(1000 / 30);
  }
  await hold(120);
}
/** Reveals the element (a selector, or text inside a selector) and taps it. */
async function tapIn(selector, text, js = false) {
  const el = await find(selector, text);
  await reveal(el);
  await tap(el, js);
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

// The home: consultations and how it works
cap("web");
await hold(h(300, 900));
await glide(await offsetOf("#servicios", 70), h(800, 1400)); await hold(h(900, 1800));
if (LONG) { await glide(await offsetOf("#pasos-titulo", 80), 1300); await hold(1500); }
if (LONG) {
  // Trust: reviews, recipes and the questions, one of them opened
  cap("confianza");
  await glide(await offsetOf("#opiniones-titulo", 80), 1300); await hold(1800);
  await glide(await offsetOf("#tips-titulo", 80), 1300); await hold(1800);
  await glide(await offsetOf("#faq-titulo", 80), 1300); await hold(700);
  await tap(await find("summary", "¿Cómo pago?")); await hold(2000);
}

// The booking: consultation, online, day, time
cap("turno");
await glide(0, h(450, 800));
await tap(await find("header a", "Reservar turno"));
await until(() => location.pathname.endsWith("/reservar"));
await hold(h(300, 900));
await tap(await find("[role=radio]", "Primera consulta")); await hold(h(400, 1100));
if (LONG) { await tapIn("[role=dialog] [role=radio]", "Online", true); await hold(900); await tapIn("[role=dialog] [role=radio]", "Presencial", true); await hold(900); }
await tapIn("[role=dialog] [role=radio]", "Online", true); await hold(h(300, 900));
await tap(`[aria-label='Calendario'] button[data-day='${await pickDay()}']`); await hold(h(300, 900));
const free = await page.$$("[aria-label^='Hora del'] [role=radio]:not([data-disabled]):not([aria-disabled='true'])");
const chip = free[Math.min(3, free.length - 1)];
await reveal(chip, h(350, 450)); await tap(chip, true); await hold(h(350, 1000));

// The deposit: Mercado Pago
cap("sena");
await tap(await find("button", "Reservar y señar"), true); await hold(h(350, 900));
await tapIn("[role=dialog] input[name=name]", undefined, true); await type("Lucía Fernández", h(18, 45)); await hold(h(100, 300));
await tapIn("[role=dialog] input[name=phone]", undefined, true); await type("11 2345-6789", h(18, 45)); await hold(h(100, 300));
await tapIn("[role=dialog] textarea[name=notes]", undefined, true); await type(h("Quiero bajar de peso", "Quiero bajar de peso y rendir mejor"), h(18, 40)); await hold(h(200, 700));
if (LONG) { await tapIn("[role=dialog] [role=radio]", "Tarjeta", true); await hold(900); await tapIn("[role=dialog] [role=radio]", "Mercado Pago", true); await hold(1300); }
else await hold(250);
await tap("[role=dialog] button[type=submit]", true); await hold(300);

// Confirmed
cap("confirmacion");
await until(() => Boolean(document.querySelector("#confirmada")), [], 20000);
await hold(h(800, 2200));
await glide(260, h(500, 1000)); await hold(h(700, 2000));
const ref = await page.$eval("#confirmada + p b", (el) => el.textContent.trim());
await demo.endPart();

if (TEST) {
  await demo.quickClip();
  process.exit(0);
}

// ---------- Part 2: the practice's panel ----------
await load(`${URL}/admin?nuevo=${ref}`);
await hold(300);
demo.startPart("panel");

cap("agenda");
await hold(h(600, 1800));
await glide(await offsetOf("ul[aria-label='Citas']", 170), h(600, 1300)); await hold(h(900, 2400));

cap("asistencia");
await tap(await find("button", "Llegó")); await hold(h(700, 1800));
if (LONG) {
  await glide(0, 900);
  await tap(await find("[aria-label='Estado'] [role=radio]", "Vinieron")); await hold(1800);
  await tap(await find("[aria-label='Estado'] [role=radio]", "Todas")); await hold(700);
}

if (LONG) {
  cap("semana");
  await tap("button[data-calendar]"); await hold(2400);
  const days = await page.$$eval("[role=dialog] button[data-day]:not(:disabled)", (els) => els.map((e) => Number(e.dataset.day)));
  const today = await page.$eval("[role=dialog] [data-today]", (el) => Number(el.dataset.day));
  await tap(`[role=dialog] button[data-day='${days.find((d) => d > today) ?? today}']`); await hold(800);
  await tap(await find("[role=dialog] button", "Ver este día")); await hold(1800);
  await tap(await find("[aria-label='Vista'] [role=radio]", "Semana")); await hold(3000);
}

cap("pacientes");
await tap(await find("nav[aria-label='Panel'] a", "Pacientes"));
await until(() => location.pathname.endsWith("/pacientes"));
await hold(h(600, 1800));
await tap("input[name=q]", true); await type("Lucía", h(35, 80)); await hold(h(1000, 2600));

cap("ventas");
await tap(await find("nav[aria-label='Panel'] a", "Ventas"));
await until(() => location.pathname.endsWith("/ventas"));
await hold(h(800, 2000));
await glide(await offsetOf("#by-day", 150), h(600, 1400)); await hold(h(700, 2000));
await glide(await offsetOf("#by-offer", 150), h(600, 1400)); await hold(h(600, 2000));
if (LONG) { await glide(await offsetOf("#methods", 150), 1400); await hold(2200); }
await hold(demo.outroMs); // the closing card covers this
await demo.endPart();

await demo.finish({
  colors,
  logoSvg: mark,
  intro: { title: "Raíz Nutrición", subtitle: "Turnos online con seña para nutricionistas", note: "Demostración: el pago está simulado" },
  outro: { title: outro.title, subtitle: "Raíz Nutrición", items: outro.items, footer: "Página web de prueba con datos de ejemplo: no se cobra ni se envía nada." },
});
