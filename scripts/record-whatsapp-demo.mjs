import puppeteer from "puppeteer-core";
import ffmpegPath from "ffmpeg-static";
import { mkdirSync, rmSync } from "node:fs";
import { execFileSync, spawn } from "node:child_process";
import { once } from "node:events";
import { join } from "node:path";
import { installClock } from "./lib/virtual-clock.mjs";

// Records the clinic demo video: the WhatsApp booking assistant (/clinica), then the clinic's agenda
// (/clinica/agenda), with a title for every step. ALWAYS frame by frame at 30 fps, on the same virtual
// clock as record-demo.mjs (see README, "Demo videos").
//
// One phone on a 1920x1080 frame. The current step's title sits to the left of the phone and the list of
// steps to the right; an intro card opens the video and a card with everything included closes it.
//
// Usage: npm run dev -- -p 3100      (any shop: /clinica doesn't depend on it)
//        npm run record-whatsapp-demo -- demo/clinica-whatsapp.mp4
// Writes <out>.mp4 and <out>-email.mp4 (same frames, smaller).
// Env:   TEST=1  only the chat up to the reminder, no titles (a quick check)    FPS=30 is the rule
//        DPR=1.25    BASE=http://localhost:3100    CHROME=<path to chrome.exe>
const OUT = process.argv[2] ?? "demo/clinica-whatsapp.mp4";
const TEST = Boolean(process.env.TEST);
const DPR = Number(process.env.DPR || 1.25);
const FPS = Number(process.env.FPS || 30);
const STEP = 1000 / FPS;
const BASE = process.env.BASE || "http://localhost:3100";
const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const WORK = OUT.replace(/\.mp4$/, ".work");
rmSync(WORK, { recursive: true, force: true }); mkdirSync(WORK, { recursive: true });
const started = Date.now();

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
const INTRO_MS = 3200;
const OUTRO_MS = 5000;

// A visible touch marker (runs on the virtual clock), and the Next.js dev badge hidden so it never shows.
const marker = () => {
  const hide = () => { const s = document.createElement("style"); s.textContent = "nextjs-portal{display:none!important}"; document.documentElement.append(s); };
  document.documentElement ? hide() : document.addEventListener("DOMContentLoaded", hide);
  window.__tap = (x, y) => {
    const dot = document.createElement("div");
    Object.assign(dot.style, {
      position: "fixed", left: `${x - 22}px`, top: `${y - 22}px`, width: "44px", height: "44px",
      borderRadius: "50%", background: "rgba(11,61,107,.22)", border: "2px solid #0b3d6b",
      zIndex: 2147483647, pointerEvents: "none", transform: "scale(.6)", opacity: "1",
      transition: "transform .45s ease-out, opacity .45s ease-out",
    });
    document.body.appendChild(dot);
    requestAnimationFrame(() => { dot.style.transform = "scale(1.4)"; dot.style.opacity = "0"; });
    setTimeout(() => dot.remove(), 600);
  };
};

// ---------- Frame pump ----------
const browser = await puppeteer.launch({
  executablePath: CHROME, headless: true, defaultViewport: null,
  args: [`--force-device-scale-factor=${DPR}`, "--window-size=390,844", "--disable-renderer-backgrounding", "--disable-background-timer-throttling"],
});
const page = (await browser.pages())[0] ?? (await browser.newPage());
await page.setUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148");
const cdp = await page.createCDPSession();
await cdp.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: DPR, mobile: true });
await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
await page.evaluateOnNewDocument(installClock);
await page.evaluateOnNewDocument(marker);

let rec = null;
let part = "part1";
const marks = []; // { part, t, step }: when each step's title appears, in seconds into its part
function startRecorder(name) {
  part = name;
  const file = join(WORK, `${name}.mp4`);
  const ff = spawn(ffmpegPath, ["-y", "-v", "error", "-f", "image2pipe", "-c:v", "mjpeg", "-framerate", String(FPS), "-i", "-",
    "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2", "-c:v", "libx264", "-preset", "veryfast", "-crf", "10", "-pix_fmt", "yuv420p", file],
  { stdio: ["pipe", "inherit", "inherit"] });
  rec = { ff, file, frames: 0 };
}
async function stopRecorder() {
  const { ff, file, frames } = rec; rec = null;
  ff.stdin.end(); await once(ff, "close");
  console.log(`  ${file.split(/[\\/]/).pop()}: ${frames} frames (${(frames / FPS).toFixed(1)} s)`);
  return file;
}
const caption = (step) => { marks.push({ part, t: rec.frames / FPS, step }); console.log(`  step ${step}: ${STEPS[step - 1].title}`); };
async function tick(scrollTop) {
  try { await page.evaluate((ms, y) => window.__vt?.advance(ms, y ?? undefined), STEP, scrollTop ?? null); }
  catch { await new Promise((r) => setTimeout(r, 30)); } // mid-navigation: the new document gets its own clock
  if (!rec) return;
  const { data } = await cdp.send("Page.captureScreenshot", { format: "jpeg", quality: 90, optimizeForSpeed: true });
  const buf = Buffer.from(data, "base64");
  if (!rec.ff.stdin.write(buf)) await once(rec.ff.stdin, "drain");
  rec.frames++;
}
const hold = async (ms) => { for (let i = Math.round(ms / STEP); i > 0; i--) await tick(); };
/** Advance frame by frame until `pred` (in the page) is true. */
async function until(pred, args = [], maxMs = 20000) {
  for (let i = 0; i < maxMs / STEP; i++) {
    try { const ok = await page.evaluate(pred, ...args); if (ok) return ok; } catch {}
    await tick();
  }
  throw new Error(`timed out waiting at ${page.url()}: ${pred}`);
}
// An enabled, visible element matching the selector (and text, if given).
async function find(selector, text, maxMs = 20000) {
  const visible = (s, t) => [...document.querySelectorAll(s)].find((e) => e.offsetParent !== null && (!t || e.textContent.trim().includes(t)));
  await until((s, t) => [...document.querySelectorAll(s)].some((e) => e.offsetParent !== null && (!t || e.textContent.trim().includes(t))), [selector, text], maxMs);
  return page.evaluateHandle(visible, selector, text);
}
async function tap(target, js = false) {
  const el = typeof target === "string" ? await find(target) : target;
  if (!el?.asElement?.()) throw new Error(`tap target missing at ${page.url()}`);
  await el.evaluate((e) => e.scrollIntoView({ block: "nearest", behavior: "smooth" }));
  await hold(450);
  const box = await el.boundingBox();
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  await page.evaluate((x, y) => window.__tap(x, y), x, y);
  await hold(250);
  if (js) await el.evaluate((e) => { e.focus?.(); e.click(); }); else await page.mouse.click(x, y);
}
async function type(text, perChar = 55) {
  for (const ch of text) { await page.keyboard.type(ch); await hold(perChar); }
}
/** Types a message in the composer and taps the send button. */
async function say(text) {
  await tap("input[name=message]", true); await hold(300);
  await type(text); await hold(400);
  await tap("form button[type=submit]");
}
async function load(url) {
  await page.goto(url, { waitUntil: "load" });
  await until(() => document.readyState === "complete" && document.fonts.status === "loaded");
  await hold(300);
}
/** Eased page scroll, one position per frame. */
async function glide(to, ms = 1600) {
  const max = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  to = Math.max(0, Math.min(max, to));
  const from = await page.evaluate(() => scrollY);
  const n = Math.max(1, Math.round(ms / STEP));
  for (let i = 1; i <= n; i++) {
    const t = i / n, e = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
    await tick(from + (to - from) * e);
  }
}
const offsetOf = (sel, gap = 90) => page.evaluate((s, g) => document.querySelector(s).getBoundingClientRect().top + scrollY - g, sel, gap);
const btn = (text) => find("button:not(:disabled)", text);

// ---------- Part 1: the patient's chat ----------
await load(`${BASE}/clinica`);
const colors = await page.evaluate(() => {
  const s = getComputedStyle(document.querySelector("[data-clinica]"));
  return Object.fromEntries(["brand", "brand-ink", "blush", "cream", "ink", "muted", "line"].map((k) => [k, s.getPropertyValue(`--${k}`).trim()]));
});
const clinicName = await page.evaluate(() => document.querySelector("header p")?.textContent?.trim() || "Clínica");

startRecorder("part1");
await hold(INTRO_MS); // the intro card covers this

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
  const file = await stopRecorder();
  await browser.close();
  execFileSync(ffmpegPath, ["-y", "-v", "error", "-i", file, "-vf", "scale=444:960:flags=lanczos", "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart", OUT]);
  rmSync(WORK, { recursive: true, force: true });
  console.log(`test clip saved ${OUT} in ${((Date.now() - started) / 1000).toFixed(0)} s`);
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
const part1Raw = await stopRecorder();

// ---------- Part 2: the clinic's agenda, on the same phone ----------
await load(`${BASE}/clinica/agenda`);
await hold(300);
startRecorder("part2");
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
await hold(OUTRO_MS); // the closing card covers this
const part2Raw = await stopRecorder();
await browser.close();

// ---------- Assemble: one phone, the chat then a slide to the agenda, with titles ----------
const duration = (file) => {
  let text = "";
  try { execFileSync(ffmpegPath, ["-i", file], { stdio: ["ignore", "pipe", "pipe"] }); } catch (e) { text = String(e.stderr); }
  const [, hh, mm, ss] = text.match(/Duration: (\d+):(\d+):([\d.]+)/);
  return Number(hh) * 3600 + Number(mm) * 60 + Number(ss);
};
const SCREEN = { x: 738, y: 60, w: 444, h: 960, r: 48 };
const FADE = 0.6;
const dur1 = duration(part1Raw);
const offset = dur1 - FADE;
const total = dur1 + duration(part2Raw) - FADE;

const FONT = `font-family:system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif`;
const tooth = (size, color) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7.5 3.5c-2.2 0-3.5 1.7-3.5 4 0 2 .8 3.3 1.3 5.2.5 2 .7 7.8 2.4 7.8 1.4 0 1.3-4.6 2.3-5.6.5-.5 1.1-.5 1.6 0 1 1 .9 5.6 2.3 5.6 1.7 0 1.9-5.8 2.4-7.8.5-1.9 1.3-3.2 1.3-5.2 0-2.3-1.3-4-3.5-4-1.7 0-2.3.9-4 .9s-2.3-.9-4-.9Z"/></svg>`;
const page0 = (css, body, bg = "transparent") => `<!doctype html><html><head><meta charset="utf-8"><style>
html,body{margin:0;width:1920px;height:1080px;overflow:hidden;background:${bg};color:${colors.ink};${FONT}}
${css}</style></head><body>${body}</body></html>`;
const backdrop = `radial-gradient(1200px 760px at 50% 45%,${colors.blush} 0%,${colors.cream} 58%,color-mix(in oklab,${colors.cream},${colors.ink} 7%) 100%)`;

const art = page0(`.phone{position:absolute;left:${SCREEN.x - 16}px;top:${SCREEN.y - 16}px;width:${SCREEN.w + 32}px;height:${SCREEN.h + 32}px;border-radius:${SCREEN.r + 16}px;background:${colors.ink};box-shadow:0 40px 90px color-mix(in srgb,${colors.ink} 30%,transparent)}`, `<div class="phone"></div>`, backdrop);
const mask = page0(`.hole{position:absolute;left:${SCREEN.x}px;top:${SCREEN.y}px;width:${SCREEN.w}px;height:${SCREEN.h}px;border-radius:${SCREEN.r}px;background:#000}`, `<div class="hole"></div>`, "#fff");

// The title beside the phone (left) and the list of steps (right).
const stepCard = (n) => {
  const s = STEPS[n - 1];
  const rows = STEPS.map((x, i) => `<li class="${i + 1 === n ? "on" : ""}"><b>${i + 1}</b>${x.label}</li>`).join("");
  return page0(`
.left{position:absolute;left:96px;top:0;width:580px;height:1080px;display:flex;flex-direction:column;justify-content:center}
.num{width:92px;height:92px;border-radius:50%;background:${colors.brand};color:#fff;font-size:48px;font-weight:700;display:grid;place-items:center;margin-bottom:34px}
h1{margin:0;font-size:64px;line-height:1.08;font-weight:700;letter-spacing:-.02em;text-wrap:balance}
p{margin:22px 0 0;font-size:31px;line-height:1.35;color:${colors.muted};text-wrap:pretty}
ul{list-style:none;margin:0;padding:0;position:absolute;left:1244px;top:50%;transform:translateY(-50%);width:580px;display:grid;gap:12px}
li{display:flex;align-items:center;gap:18px;padding:14px 22px;border-radius:22px;font-size:28px;font-weight:600;color:${colors.muted};background:rgba(255,255,255,.45)}
li b{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;font-size:22px;background:${colors.blush};color:${colors["brand-ink"]}}
li.on{background:${colors.brand};color:#fff;box-shadow:0 14px 34px color-mix(in srgb,${colors.brand} 35%,transparent)}
li.on b{background:#fff;color:${colors.brand}}`,
  `<div class="left"><div class="num">${n}</div><h1>${s.title}</h1><p>${s.text}</p></div><ul>${rows}</ul>`);
};

const introCard = page0(`
.c{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
.logo{width:168px;height:168px;border-radius:44px;background:${colors.brand};display:grid;place-items:center;box-shadow:0 30px 70px color-mix(in srgb,${colors.brand} 35%,transparent)}
h1{margin:48px 0 0;font-size:104px;font-weight:700;letter-spacing:-.025em}
h2{margin:18px 0 0;font-size:56px;font-weight:600;color:${colors["brand-ink"]}}
p{margin:44px 0 0;font-size:30px;color:${colors.muted}}`,
`<div class="c"><div class="logo">${tooth(96, "#fff")}</div><h1>${clinicName}</h1><h2>Asistente de turnos por WhatsApp</h2><p>Demostración para clínicas dentales</p></div>`, backdrop);

const outroCard = page0(`
.c{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
h1{margin:0;font-size:78px;font-weight:700;letter-spacing:-.02em}
h2{margin:14px 0 0;font-size:36px;font-weight:500;color:${colors.muted}}
.g{display:grid;grid-template-columns:repeat(3,520px);gap:26px;margin-top:62px}
.t{background:#fff;border-radius:30px;padding:34px 36px;box-shadow:0 10px 30px rgba(18,36,58,.08);border:2px solid ${colors.line}}
.t i{display:grid;place-items:center;width:58px;height:58px;border-radius:18px;background:${colors.blush};margin-bottom:20px}
.t b{display:block;font-size:34px;line-height:1.15}
.t span{display:block;margin-top:10px;font-size:25px;line-height:1.35;color:${colors.muted}}
small{margin-top:46px;font-size:26px;color:${colors.muted}}`,
`<div class="c"><h1>Todo en un solo lugar</h1><h2>${clinicName} · WhatsApp + agenda</h2><div class="g">${
  INCLUDED.map(([t, d]) => `<div class="t"><i>${tooth(32, colors.brand)}</i><b>${t}</b><span>${d}</span></div>`).join("")
}</div><small>Demostración con datos de ejemplo: los turnos son simulados.</small></div>`, backdrop);

const fb = await puppeteer.launch({ executablePath: CHROME, headless: true });
const fp = await fb.newPage(); await fp.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
const render = async (html, name, transparent) => { await fp.setContent(html); const path = join(WORK, `${name}.png`); await fp.screenshot({ path, omitBackground: transparent }); return path; };
const artPng = await render(art, "frame-art", false);
const maskPng = await render(mask, "frame-mask", false);
const introPng = await render(introCard, "intro", false);
const outroPng = await render(outroCard, "outro", false);
const stepPngs = [];
for (let n = 1; n <= STEPS.length; n++) stepPngs.push(await render(stepCard(n), `step-${n}`, true));
await fb.close();

// When each title is on screen: from its mark to the next one's (they cross-fade), the last until the closing card.
const at = (m) => (m.part === "part1" ? m.t : offset + m.t);
const outroStart = total - OUTRO_MS / 1000;
const overlays = [{ png: introPng, start: 0, end: INTRO_MS / 1000 + 0.4, fi: 0, fo: 0.4 }];
marks.forEach((m, i) => {
  const start = Math.max(at(m), INTRO_MS / 1000 - 0.1);
  const next = marks[i + 1];
  const end = next ? at(next) + 0.3 : outroStart + 0.3;
  overlays.push({ png: stepPngs[m.step - 1], start, end, fi: 0.3, fo: 0.3 });
});
overlays.push({ png: outroPng, start: outroStart, end: total, fi: 0.5, fo: 0 });

const screen = (i) => `[${i}:v]setpts=PTS-STARTPTS,scale=${SCREEN.w}:${SCREEN.h}:flags=lanczos,setsar=1,fps=${FPS},settb=AVTB[s${i}]`;
const inputs = ["-i", part1Raw, "-i", part2Raw,
  "-loop", "1", "-framerate", String(FPS), "-i", artPng, "-loop", "1", "-framerate", String(FPS), "-i", maskPng];
for (const o of overlays) inputs.push("-loop", "1", "-framerate", String(FPS), "-t", (o.end - o.start).toFixed(3), "-i", o.png);
const graph = [
  screen(0), screen(1),
  `[s0][s1]xfade=transition=slideleft:duration=${FADE}:offset=${offset.toFixed(3)}[ph]`,
  `[2:v]format=rgba[art]`, `[3:v]format=gray[m]`, `[art][m]alphamerge[frame]`,
  `[2:v][ph]overlay=${SCREEN.x}:${SCREEN.y}:shortest=1[base]`,
  `[base][frame]overlay=0:0:shortest=1[v0]`,
];
overlays.forEach((o, k) => {
  const len = o.end - o.start;
  const fades = [o.fi ? `fade=t=in:st=0:d=${o.fi}:alpha=1` : "", o.fo ? `fade=t=out:st=${(len - o.fo).toFixed(3)}:d=${o.fo}:alpha=1` : ""].filter(Boolean).join(",");
  graph.push(`[${4 + k}:v]format=rgba${fades ? `,${fades}` : ""},setpts=PTS-STARTPTS+${o.start.toFixed(3)}/TB[o${k}]`);
  graph.push(`[v${k}][o${k}]overlay=0:0:eof_action=pass${k === overlays.length - 1 ? ",format=yuv420p" : ""}[v${k + 1}]`);
});
execFileSync(ffmpegPath, ["-y", "-v", "error", ...inputs, "-filter_complex", graph.join(";"),
  "-map", `[v${overlays.length}]`, "-r", String(FPS), "-t", total.toFixed(3), "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-maxrate", "12M", "-bufsize", "24M",
  "-g", String(FPS * 2), "-movflags", "+faststart", OUT]);

// Email/WhatsApp copy: the same frames, smaller (higher CRF).
execFileSync(ffmpegPath, ["-y", "-v", "error", "-i", OUT, "-c:v", "libx264", "-preset", "medium", "-crf", "28", "-movflags", "+faststart",
  OUT.replace(/\.mp4$/, "-email.mp4")]);
rmSync(WORK, { recursive: true, force: true });
console.log(`${total.toFixed(1)} s, agenda from ${offset.toFixed(2)} s; saved ${OUT} in ${((Date.now() - started) / 1000).toFixed(0)} s`);
