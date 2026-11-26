import { BASE, createPhoneDemo } from "./lib/phone-demo.mjs";

// Records the demo video of a restaurant whose table reservations are confirmed by email
// (shop.ts: reservations.confirmation "email", noTakeaway, matches, promos): Bodegón El Diez.
// ALWAYS frame by frame at 30 fps (scripts/lib/phone-demo.mjs).
//
// How much each view gets (the point of this video is to NOT show every view in full):
//   glimpse  a view is shown for a moment: one stop per section, title and info fully on screen, nothing tapped
//   preview  the options are tapped to show they exist (birthday, match), nothing is submitted
//   action   one flow is completed from start to end: the match reservation, its email, the panel
// Every stop on a section is checked: its title and its last piece of info must be fully inside the screen
// (the script warns when they are not). Tweak the pauses in HOLD and the order of STOPS below.
//
// Usage: SHOP=bodegon-el-diez npm run build   then   npx next start -p 3100   (the production build: no dev badge)
//        npm run record-bodegon-demo -- demo/bodegon-el-diez-app.mp4
// Writes <out>.mp4 and <out>-email.mp4 (same frames, smaller).
// Env:   TEST=1  only the home and the menu, no titles (a quick check)    FPS=30 is the rule
const OUT = process.argv[2] ?? "demo/bodegon-el-diez-app.mp4";
const TEST = Boolean(process.env.TEST);

// Pauses, in ms. A glimpse is short on purpose.
const HOLD = { glimpse: 1800, preview: 1200, result: 2600 };

// The home, one stop per section: [section id, what must be fully visible (first = title), pause].
const STOPS = [
  { name: "inicio", section: null, see: ["main h1", "main section dl"], ms: 2600 },
  { name: "favoritas", section: "favoritas", see: ["#favoritas", "section[aria-labelledby=favoritas] ul li:first-child p:last-child"], ms: HOLD.glimpse },
  { name: "promos", section: "promos", see: ["#promos", "section[aria-labelledby=promos] ul li:first-child p"], ms: HOLD.glimpse },
  { name: "partidos", section: "partidos", see: ["#partidos", "section[aria-labelledby=partidos] ul li:first-child a"], ms: HOLD.glimpse },
  { name: "visitanos", section: "visitanos", see: ["#visitanos", "section[aria-labelledby=visitanos] a[href*='wa.me']"], ms: HOLD.glimpse },
];

const STEPS = [
  { label: "La página de inicio", title: "La home muestra todo el bodegón", text: "Los platos de la casa, las promociones y los partidos, cada uno en su lugar." },
  { label: "El menú", title: "El menú, con fotos y precios", text: "Menú del día, platos de la casa, pastas y pizzas." },
  { label: "Tipos de reserva", title: "Elige el tipo de reserva", text: "Una mesa, un cumpleaños o un partido: cada uno con lo suyo." },
  { label: "Reserva del partido", title: "Reserva la mesa para el partido", text: "El día y la hora del partido ya vienen elegidos. Solo completa sus datos." },
  { label: "Mesa confirmada", title: "Queda confirmada al instante", text: "No espera una respuesta ni escribe por WhatsApp." },
  { label: "El email", title: "Le llega el email de la reserva", text: "Con los datos, el botón para cancelar y qué pasa con el dinero." },
  { label: "El panel del local", title: "El local la ve en su panel", text: "Y marca quién llegó, o la modifica o la cancela." },
];
const INCLUDED = [
  ["Menú con fotos y precios", "Menú del día, platos de la casa, pastas y pizzas"],
  ["Reservas de mesa", "Día, hora y personas, solo con lugar"],
  ["Cumpleaños y partidos", "Cada tipo de reserva, con su día y su hora"],
  ["Confirmación por email", "Al instante, con el botón para cancelar"],
  ["Panel del local", "Llegó, no vino, modificar o cancelar"],
  ["Sección de partidos", "Con reserva directa para cada partido"],
];
const table = (size, color) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10h16M6 10v9M18 10v9M3 6h18"/><path d="M8 6V4h8v2"/></svg>`;

const demo = await createPhoneDemo({ out: OUT, steps: STEPS, pace: 0.75 });
const { page, hold, until, find, tap, type, load, glide, offsetOf, caption } = demo;

/** One stop on a section of the home: the section's title at the top, and a check that what must be seen is on screen. */
async function stop({ name, section, see, ms }) {
  if (section === null) await glide(0, 900);
  else {
    const to = await page.evaluate((id) => document.querySelector(`section[aria-labelledby=${id}]`).getBoundingClientRect().top + scrollY - 72, section);
    await glide(to, 1100);
  }
  await hold(300); // the section's own entrance animation
  const hidden = await page.evaluate((sels) => sels.flatMap((s) => {
    const e = document.querySelector(s);
    if (!e) return [`${s} (missing)`];
    const r = e.getBoundingClientRect();
    return r.top >= 64 && r.bottom <= innerHeight - 4 ? [] : [`${s} (${Math.round(r.top)} to ${Math.round(r.bottom)} of ${innerHeight})`];
  }), see);
  if (hidden.length) console.warn(`  WARNING, "${name}" is cut: ${hidden.join("; ")}`);
  await hold(ms);
}

/** Scrolls to the first element of a tag whose text contains `text`, with `gap` px above it. */
const offsetOfText = (tag, text, gap = 90) =>
  page.evaluate((t, x, g) => {
    const el = [...document.querySelectorAll(t)].find((e) => e.textContent.trim().includes(x));
    return el.getBoundingClientRect().top + scrollY - g;
  }, tag, text, gap);

// ---------- Part 1: the customer ----------
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

// 1. GLIMPSE: the home, one stop per section, then back to the top
caption(1);
for (const s of STOPS) await stop(s);
// The last section is taller than the screen: after its title and buttons, a second stop shows the hours card.
await glide(await page.evaluate(() => document.querySelector("section[aria-labelledby=visitanos]").getBoundingClientRect().bottom + scrollY - innerHeight + 24), 1000); await hold(HOLD.glimpse);
await glide(0, 1800); await hold(600);

// 2. GLIMPSE: the menu, just the first two categories
caption(2);
await tap("header nav a[href='/salon']");
await until(() => location.pathname === "/salon"); await hold(900);
await glide(await offsetOf("#menu-del-dia", 160), 1000); await hold(HOLD.glimpse);
await glide(await offsetOfText("main h2", "Platos de la casa", 160), 1400); await hold(HOLD.glimpse);

if (TEST) {
  await demo.endPart();
  await demo.quickClip();
  process.exit(0);
}

// 3. PREVIEW: the kinds of reservation. Each is tapped to show it exists; nothing is submitted yet.
caption(3);
await tap("header nav a[href='/reservas']");
await until(() => location.pathname === "/reservas"); await hold(HOLD.preview);
const kind = (text) => find("[aria-label='Tipo de reserva'] [role=radio]", text);
await tap(await kind("Cumpleaños"), true); await hold(HOLD.preview + 400); // "anotamos que es un cumpleaños"
await tap(await kind("Partido"), true); await hold(500);

// 4. ACTION: the match reservation, from the list of matches to "Confirmar reserva"
caption(4);
await hold(HOLD.preview); // the list of matches
await tap(await find("[aria-label='Partido'] [role=radio]", "Talleres"), true); await hold(900);
await glide(await offsetOf("[aria-label='Calendario']", 100), 1200); await hold(1400); // its day, chosen
for (let i = 0; i < 2; i++) { await tap("button[aria-label='Una persona más']"); await hold(350); } // 4 people
await glide(await offsetOf("[aria-label='Horario de la reserva']", 150), 1200); await hold(1600); // its kick-off, chosen
await tap("input[name=name]", true); await type("Lucía Fernández", 45); await hold(200);
await tap("input[name=phone]", true); await type("341 555-1234", 45); await hold(200);
await tap("input[name=email]", true); await type("lucia@gmail.com", 45); await hold(200);
await tap("textarea[name=notes]", true); await type("Vamos a ver el partido con amigos ⚽", 40); await hold(600);
await tap("button[type=submit]");

// 5. The reservation is confirmed at once
caption(5);
await until(() => location.pathname === "/reservas/listo");
await hold(HOLD.result);
await tap("a[data-cta='abrir-mail']");

// 6. The email, in a phone mail app: the details, the money note and the cancel button (not tapped)
caption(6);
await until(() => location.pathname === "/correo");
await find("article[aria-label^='Email']"); await hold(HOLD.result);
await glide(await offsetOf("article dl", 70), 1200); await hold(HOLD.glimpse);
await glide(await offsetOfText("article p", "Cancelación y reintegro", 100), 1400); await hold(HOLD.result + 600);
await glide(await offsetOfText("article a", "Cancelar mi reserva", 380), 1000); await hold(HOLD.glimpse);
const ref = new URL(page.url()).searchParams.get("ref");
await demo.endPart();

// ---------- Part 2: the shop's panel ----------
await load(`${BASE}/admin/reservas?nuevo=${ref}`);
await hold(500);
demo.startPart("local");

// 7. The new reservation, pinned at the top, and one tap on "Llegó"
caption(7);
await hold(HOLD.result + 600);
await tap(await find("section[aria-labelledby=fresh-title] button", "Llegó")); await hold(HOLD.result + 800); // it stays on screen: "Asistió"
await hold(demo.outroMs); // the closing card covers this
await demo.endPart();

await demo.finish({
  colors,
  logoSvg: table,
  intro: { title: shopName, subtitle: "Reservas de mesa con confirmación por email", note: "Página web de prueba" },
  outro: { title: "El salón, siempre lleno", subtitle: `${shopName} · reservas de mesa`, items: INCLUDED, footer: "Página web de prueba, con datos de ejemplo." },
});
