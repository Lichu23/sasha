import { BASE, createPhoneDemo } from "./lib/phone-demo.mjs";

// Records the demo video of a booking demo: `estudio` (Brisa Studio: pilates / yoga / training classes) or `belleza`
// (Lumi Nails & Beauty: nails and beauty treatments). The customer books and pays a simulated deposit, then a slide to
// the business's panel shows the booking and the day. A title for every step. ALWAYS frame by frame at 30 fps
// (scripts/lib/phone-demo.mjs).
//
// Usage: npm run dev -- -p 3100      (any SHOP: /estudio and /belleza don't depend on it)
//        MSYS_NO_PATHCONV=1 npm run record-booking-demo -- estudio demo/estudio-pilates-yoga/estudio-pilates-yoga.mp4
//        MSYS_NO_PATHCONV=1 npm run record-booking-demo -- belleza demo/estetica-unas/estetica-unas.mp4
// Writes <out>.mp4 and <out>-email.mp4 (same frames, smaller).
// Env:   NOTES="..."  the customer's comment (beauty)    TEST=1  only the customer part, no titles (a quick check)    FPS=30 is the rule
const SLUG = process.argv[2];
const OUT = process.argv[3] ?? `demo/${SLUG}.mp4`;
const TEST = Boolean(process.env.TEST);
const DAY_MS = 24 * 60 * 60 * 1000;

const VENUES = {
  estudio: {
    intro: { subtitle: "Reserva de clases con pago online", note: "Demostración: el pago está simulado" },
    steps: [
      { label: "Elige el día", title: "Elige el día en el calendario", text: "Solo se ven los días con clases." },
      { label: "Elige tu clase", title: "Mira las clases y las plazas libres", text: "Cada clase dice cuántas plazas quedan." },
      { label: "Paga y reserva", title: "Paga con tarjeta o Bizum", text: "Un minuto, sin llamar ni escribir." },
      { label: "Plaza reservada", title: "Plaza reservada al instante", text: "Con su referencia y el recordatorio del día antes." },
      { label: "La reserva en el panel", title: "La reserva aparece en el panel", text: "En la clase, con las plazas que quedan y el pago hecho." },
      { label: "Control de asistencia", title: "Controla quién viene", text: "Un toque para vino o no vino, y el calendario con el movimiento de cada día." },
    ],
    outro: {
      title: "El estudio, con las clases llenas",
      items: [
        ["Reservas 24 h", "Los alumnos eligen clase y plaza solos"],
        ["Pago al reservar", "Tarjeta o Bizum: menos plantones"],
        ["Plazas a la vista", "Cada clase muestra cuántas quedan"],
        ["Panel del estudio", "Quién viene a cada clase, de un vistazo"],
        ["Asistencia", "Vino o no vino, con un toque"],
        ["Recordatorios", "Por WhatsApp el día antes (opcional)"],
      ],
    },
  },
  belleza: {
    intro: { subtitle: "Reserva de citas con señal online", note: "Demostración: el pago está simulado" },
    steps: [
      { label: "Elige el tratamiento", title: "Elige el tratamiento", text: "Con su precio y su duración, sin preguntar por mensaje." },
      { label: "Profesional, día y hora", title: "Elige profesional, día y hora", text: "Solo ve los huecos libres de la agenda." },
      { label: "Paga la señal", title: "Paga una pequeña señal", text: "Con tarjeta o Bizum. Asegura el hueco y evita plantones." },
      { label: "Cita confirmada", title: "Cita confirmada al instante", text: "Con su referencia y el recordatorio del día antes." },
      { label: "La cita en la agenda", title: "La cita cae sola en la agenda", text: "Con la señal cobrada y lo que resta por pagar." },
      { label: "Control del día", title: "Controla el día", text: "Llegó o no vino con un toque, y el calendario con las citas de cada día." },
    ],
    outro: {
      title: "La agenda llena, sin llamadas",
      items: [
        ["Reservas 24 h", "Tus clientas reservan solas, a cualquier hora"],
        ["Señal online", "Tarjeta o Bizum: menos plantones"],
        ["Agenda por profesional", "Nunca dos citas a la misma hora"],
        ["Duración de cada servicio", "Los huecos se calculan solos"],
        ["Control del día", "Señales cobradas y ocupación"],
        ["Recordatorios", "Por WhatsApp el día antes (opcional)"],
      ],
    },
  },
};
const venue = VENUES[SLUG];
if (!venue) throw new Error("Usage: record-booking-demo.mjs <estudio|belleza> [out.mp4]");

const marks = {
  estudio: (size, color) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="${color}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4c2.6 2.4 3.6 5.2 3 8.4-.5 2.2-1.7 3.9-3 4.8-1.3-.9-2.5-2.6-3-4.8C8.4 9.2 9.4 6.4 12 4Z"/><path d="M4 10.5c3 .1 5.1 1.3 6.2 3.6M20 10.5c-3 .1-5.1 1.3-6.2 3.6M6.5 18.5c2.2 1 4.3 1.3 5.5 1.3s3.3-.3 5.5-1.3"/></svg>`,
  belleza: (size, color) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="${color}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5 13.8 9l5.7 1.8-5.7 1.8L12 18l-1.8-5.4L4.5 10.8 10.2 9z"/><path d="M18.5 3.5v3M17 5h3M5.5 16.5v3M4 18h3"/></svg>`,
};

const demo = await createPhoneDemo({ out: OUT, steps: venue.steps });
const { page, hold, until, find, tap, point, type, load, glide, offsetOf, caption } = demo;
const URL = `${BASE}/${SLUG}`;

/** The first enabled day after today in the calendar (tomorrow, or the next day with something to book). */
async function nextDay() {
  const today = await page.$eval("[aria-label='Calendario'] [data-today]", (el) => Number(el.dataset.day));
  const days = await page.$$eval("[aria-label='Calendario'] button[data-day]:not(:disabled)", (els) => els.map((e) => Number(e.dataset.day)));
  return days.find((d) => d >= today + DAY_MS) ?? days.at(-1);
}

/** Fills the booking sheet: name, phone, (a comment), Bizum for a moment, then the card, and pays. */
async function pay({ comment }) {
  await hold(1200);
  await tap("[role=dialog] input[name=name]", true); await type("Lucía Fernández"); await hold(300);
  await tap("[role=dialog] input[name=phone]", true); await type("612 345 678"); await hold(500);
  if (comment) { await tap("[role=dialog] textarea[name=notes]", true); await type(comment, 40); await hold(600); }
  await tap(await find("[role=dialog] [role=radio]", "Bizum")); await hold(1800); // the other way to pay
  await tap(await find("[role=dialog] [role=radio]", "Tarjeta")); await hold(700);
  await tap("[role=dialog] input[name=card]", true); await type("4242 4242 4242 4242", 40); await hold(300);
  await tap("[role=dialog] input[name=expiry]", true); await type("1228", 60); await hold(300);
  await tap("[role=dialog] input[name=cvc]", true); await type("123", 60); await hold(900);
  await tap(await find("[role=dialog] button[type=submit]", "Pagar")); await hold(600);
}

// ---------- Part 1: the customer ----------
await load(URL);
await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
await load(URL);
const colors = await page.evaluate(() => {
  const s = getComputedStyle(document.documentElement);
  return Object.fromEntries(["brand", "brand-ink", "blush", "cream", "ink", "muted", "line"].map((k) => [k, s.getPropertyValue(`--${k}`).trim()]));
});
const name = await page.evaluate(() => document.querySelector("header a span:last-child").textContent.trim());

demo.startPart("cliente");
await hold(demo.introMs); // the intro card covers this

if (SLUG === "estudio") {
  // 1. The day: scroll down to the calendar, pick the next day with classes
  caption(1);
  await hold(1800);
  await glide(await offsetOf("#reservar", 70), 1600); await hold(1500);
  await find("[aria-label='Calendario'] [data-today]"); await hold(1200);
  await tap(`[aria-label='Calendario'] button[data-day='${await nextDay()}']`); await hold(1300);

  // 2. Its classes, with the seats left; the reformer one has few
  caption(2);
  await glide(await offsetOf("ul[aria-label='Clases']", 110), 1500); await hold(2400);
  await glide(await offsetOf("ul[aria-label='Clases']", 110) + 250, 1000); await hold(1800);
  const reformer = await page.$("li[data-class=reformer] button");
  const target = reformer ?? (await page.$("ul[aria-label='Clases'] li button:not(:disabled)"));
  await tap(target); await hold(600);

  // 3. Pay
  caption(3);
  await pay({});
} else {
  // 1. The treatment, scrolling the list
  caption(1);
  await hold(1800);
  await glide(await offsetOf("#reservar", 70), 1600); await hold(1500);
  await glide(await offsetOf("#reservar", 70) + 420, 1500); await hold(1500);
  await tap(await find("[role=radio]", "Manicura semipermanente")); await hold(1300);

  // 2. Professional, day and a time
  caption(2);
  await glide(await offsetOf("[aria-label='Profesional']", 120), 1400); await hold(1500);
  await tap(await find("[aria-label='Profesional'] [role=radio]", "Carla")); await hold(1100);
  await find("[aria-label='Calendario'] [data-today]");
  await glide(await offsetOf("[aria-label='Calendario']", 150), 1300); await hold(900);
  await tap(`[aria-label='Calendario'] button[data-day='${await nextDay()}']`); await hold(1100);
  await glide(await offsetOf("[aria-label='Hora de la cita']", 170), 1300); await hold(2200); // the struck-through times are taken
  const free = await page.$$("[aria-label='Hora de la cita'] [role=radio]:not([data-disabled]):not([aria-disabled='true'])");
  await tap(free[Math.min(4, free.length - 1)]); await hold(1500);
  await point(await find("button", "Reservar · señal")); await hold(700);

  // 3. The deposit
  caption(3);
  await tap(await find("button", "Reservar · señal")); await hold(600);
  await pay({ comment: process.env.NOTES || "Tono nude, uñas cortas, por favor 💅" });
}

// 4. Confirmed
caption(4);
await until(() => Boolean(document.querySelector("#confirmada")), [], 20000);
await hold(2600);
await glide(300, 1000); await hold(2600);
const ref = await page.$eval("#confirmada + p b", (el) => el.textContent.trim());
await demo.endPart();

if (TEST) {
  await demo.quickClip();
  process.exit(0);
}

// ---------- Part 2: the business's panel ----------
await load(`${URL}/admin?nuevo=${ref}`);
await hold(500);
demo.startPart("panel");

// 5. The booking in the panel
caption(5);
await hold(2600);
await glide(await offsetOf(SLUG === "estudio" ? "ul[aria-label='Clases']" : "ul[aria-label='Citas']", 100), 1400); await hold(3200);

// 6. Attendance, and the calendar with each day's movement
caption(6);
if (SLUG === "estudio") await tap(await find("li[data-booking] button[aria-label$=' vino']")); else await tap(await find("button", "Llegó"));
await hold(2200);
await glide(0, 1200); await hold(500);
await tap("button[data-calendar]"); await hold(2800); // the calendar opens over the page, with a count per day
{
  const days = await page.$$eval("[role=dialog] button[data-day]:not(:disabled)", (els) => els.map((e) => Number(e.dataset.day)));
  const today = await page.$eval("[role=dialog] [data-today]", (el) => Number(el.dataset.day));
  await tap(`[role=dialog] button[data-day='${days.find((d) => d >= today && d !== today) ?? today}']`); await hold(1000);
}
await tap(await find("[role=dialog] button", "Ver este día")); await hold(3000);
await glide(await offsetOf(SLUG === "estudio" ? "ul[aria-label='Clases']" : "ul[aria-label='Citas']", 100), 1400); await hold(2400);
await hold(demo.outroMs); // the closing card covers this
await demo.endPart();

await demo.finish({
  colors,
  logoSvg: marks[SLUG],
  intro: { title: name, subtitle: venue.intro.subtitle, note: venue.intro.note },
  outro: { title: venue.outro.title, subtitle: name, items: venue.outro.items, footer: "Demostración con datos de ejemplo: no se cobra ni se envía nada." },
});
