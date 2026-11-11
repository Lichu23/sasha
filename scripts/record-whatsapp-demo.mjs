import { BASE, createPhoneDemo } from "./lib/phone-demo.mjs";

// Records the clinic demo video: the WhatsApp booking assistant (/clinica), then the clinic's agenda
// (/clinica/agenda), with a title for every step. ALWAYS frame by frame at 30 fps (scripts/lib/phone-demo.mjs).
//
// Usage: npm run dev -- -p 3100      (any shop: /clinica doesn't depend on it)
//        npm run record-whatsapp-demo -- demo/clinica-whatsapp.mp4
// Writes <out>.mp4 and <out>-email.mp4 (same frames, smaller).
// Env:   TEST=1  only the chat up to the reminder, no titles (a quick check)    FPS=30 is the rule
const OUT = process.argv[2] ?? "demo/clinica-whatsapp.mp4";
const TEST = Boolean(process.env.TEST);

// The title of each step: shown beside the phone while it happens.
const STEPS = [
  { label: "Pedido por WhatsApp", title: "Pide el turno por WhatsApp", text: "El paciente escribe como siempre: sin apps y sin llamar." },
  { label: "Calendario y horario", title: "Elige día y hora en el calendario", text: "Solo muestra los horarios libres de la agenda de cada profesional." },
  { label: "Confirmación", title: "Confirma en segundos", text: "Pide los datos y la obra social, y deja el turno agendado." },
  { label: "Recordatorio", title: "Recordatorio automático", text: "Un día antes: confirma, reprograma o cancela con un toque." },
  { label: "Urgencias y recepción", title: "Urgencias y atención humana", text: "Detecta el dolor, reserva el primer lugar libre y pasa con recepción." },
  { label: "Panel de la clínica", title: "El panel de la clínica", text: "Todo cae solo en la agenda, con el estado de cada turno." },
];
const INCLUDED = [
  ["Turnos las 24 h", "Por WhatsApp, sin llamadas ni apps"],
  ["Recordatorios automáticos", "Confirman, reprograman o cancelan con un toque"],
  ["Urgencias y recepción", "Primer lugar libre y pase a una persona"],
  ["Agenda sincronizada", "El calendario del bot lee los horarios libres de la agenda"],
  ["Seña online (opcional)", "Cobro con Mercado Pago para reservar el turno"],
  ["Pacientes y avisos", "Historial, controles periódicos y reseñas"],
];
const tooth = (size, color) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7.5 3.5c-2.2 0-3.5 1.7-3.5 4 0 2 .8 3.3 1.3 5.2.5 2 .7 7.8 2.4 7.8 1.4 0 1.3-4.6 2.3-5.6.5-.5 1.1-.5 1.6 0 1 1 .9 5.6 2.3 5.6 1.7 0 1.9-5.8 2.4-7.8.5-1.9 1.3-3.2 1.3-5.2 0-2.3-1.3-4-3.5-4-1.7 0-2.3.9-4 .9s-2.3-.9-4-.9Z"/></svg>`;

const demo = await createPhoneDemo({ out: OUT, steps: STEPS });
const { page, hold, until, find, tap, type, load, glide, offsetOf, caption } = demo;
const btn = (text) => find("button:not(:disabled)", text);
/** Types a message in the composer and taps the send button. */
async function say(text) {
  await tap("input[name=message]", true); await hold(300);
  await type(text); await hold(400);
  await tap("form button[type=submit]");
}

// ---------- Part 1: the patient's chat ----------
await load(`${BASE}/clinica`);
const colors = await page.evaluate(() => {
  const s = getComputedStyle(document.querySelector("[data-clinica]"));
  return Object.fromEntries(["brand", "brand-ink", "blush", "cream", "ink", "muted", "line"].map((k) => [k, s.getPropertyValue(`--${k}`).trim()]));
});
const clinicName = await page.evaluate(() => document.querySelector("header p")?.textContent?.trim() || "Clínica");

demo.startPart("chat");
await hold(demo.introMs); // the intro card covers this

caption(1);
await say("Hola, quiero sacar un turno");
await btn("Limpieza dental");
await hold(900);

caption(2);
await tap(await btn("Limpieza dental"));
await btn("Elegir día y horario"); await hold(1800);
await tap(await btn("Elegir día y horario"));
await find("[role=dialog] button[data-date]"); await hold(2600); // the calendar: grey days have no free time
await tap("[role=dialog] button[data-date=\"19\"]"); await btn("11:30"); await hold(2200);
await tap(await btn("11:30")); await hold(900);
await tap(await btn("Continuar"));

await until(() => document.querySelector("input[name=message]")?.placeholder === "Nombre y apellido");
caption(3);
await hold(500);
await say("Lucía Fernández");
await tap(await btn("OSDE"));
await btn("Confirmar turno"); await hold(2600);
await tap(await btn("Confirmar turno")); await hold(5200);

await find("[role=log] p", "Miércoles 18 de noviembre", 30000);
caption(4);
await btn("Confirmo"); await hold(1500);
await tap(await btn("Confirmo")); await hold(500);

if (TEST) {
  await btn("Tengo una urgencia"); await hold(1500);
  await demo.endPart();
  await demo.quickClip();
  process.exit(0);
}

await btn("Tengo una urgencia"); await hold(1000);
caption(5);
await say("Me duele mucho una muela");
await btn("Sí, reservarlo"); await hold(2200);
await tap(await btn("Sí, reservarlo")); await hold(500);
await btn("Hablar con recepción"); await hold(2600);
await tap(await btn("Hablar con recepción"));
await find("[role=log] p", "se unió a la conversación"); await hold(3600);
await demo.endPart();

// ---------- Part 2: the clinic's agenda, on the same phone ----------
await load(`${BASE}/clinica/agenda`);
await hold(300);
demo.startPart("agenda");
caption(6);
await hold(3400); // the month: turnos per day, a dot on the ones booked from WhatsApp
await tap("button[data-day=\"19\"]"); await hold(1500);
await glide(await offsetOf("#day-title", 84), 1500); await hold(2800); // Lucía's turno, booked in the chat
await glide(0, 1200); await hold(300);
await tap("button[data-day=\"18\"]"); await hold(1000);
await glide(await offsetOf("#day-title", 84), 1500);
await tap(await find("button[aria-expanded]", "dolor de muela")); await hold(2600);
await glide(await offsetOf("#inbox-title"), 1500); await hold(900);
await tap(await btn("Responder")); await hold(1500);
await glide(await offsetOf("#week-title"), 1500); await hold(2600);
await glide(10000, 1800); await hold(1800);
await hold(demo.outroMs); // the closing card covers this
await demo.endPart();

await demo.finish({
  colors,
  logoSvg: tooth,
  intro: { title: clinicName, subtitle: "Asistente de turnos por WhatsApp", note: "Demostración para clínicas dentales" },
  outro: { title: "Todo en un solo lugar", subtitle: `${clinicName} · WhatsApp + agenda`, items: INCLUDED, footer: "Demostración con datos de ejemplo: los turnos son simulados." },
});
