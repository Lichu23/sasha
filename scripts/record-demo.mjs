import puppeteer from "puppeteer-core";
import ffmpegPath from "ffmpeg-static";
import { mkdirSync, rmSync } from "node:fs";
import { execFileSync, spawn } from "node:child_process";
import { once } from "node:events";
import { join } from "node:path";

// Records a shop's demo video: ALWAYS frame by frame at 30 fps (see README, "Demo videos").
// Everything happens on one phone in a frame (shop colors): the customer's order, then a slide to the
// shop's panel showing the same order.
//
// The page runs on a virtual clock: timers, requestAnimationFrame, Date, performance.now, CSS/WAAPI
// animations and smooth scrolls only move when we advance it, one frame at a time, and every frame is a
// screenshot. Every frame of the output is distinct, no matter how slow or busy the machine is. (A live
// screencast only reaches 16-22 real fps; don't use one.)
//
// Usage: SHOP=<slug> npm run dev -- -p 3100      (in another terminal, with `node scripts/select-shop.mjs` done)
//        npm run record-demo -- demo/<slug>-app.mp4 [branch label]
// Writes <out>.mp4 and <out>-email.mp4 (same frames, smaller).
// Env:   NOTES="..."  order comment (make it match what gets ordered)    TEST=1  only the home scroll + the take-away notice
//        DPR=1.25     capture scale (the phone screen is 444x960 in the final frame)
//        FPS=30       30 is the rule; only raise it on explicit request
//        BASE=http://localhost:3100    CHROME=<path to chrome.exe>
const OUT = process.argv[2];
const BRANCH = process.argv[3];
const TEST = Boolean(process.env.TEST);
const DPR = Number(process.env.DPR || 1.25);
const FPS = Number(process.env.FPS || 30);
const STEP = 1000 / FPS;
const BASE = process.env.BASE || "http://localhost:3100";
const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const WORK = OUT.replace(/\.mp4$/, ".work");
rmSync(WORK, { recursive: true, force: true }); mkdirSync(WORK, { recursive: true });
const started = Date.now();

// ---------- The virtual clock, installed in every document before its own scripts ----------
function installClock() {
  if (window.__vt) return;
  const R = { raf: window.requestAnimationFrame.bind(window), setTimeout: window.setTimeout.bind(window), Date };
  const base = R.Date.now();
  let now = 0, seq = 1;
  const timers = new Map();
  const rafs = new Map();
  window.setTimeout = (fn, ms, ...args) => { const id = seq++; timers.set(id, { at: now + Math.max(0, Number(ms) || 0), fn, args }); return id; };
  window.setInterval = (fn, ms, ...args) => { const id = seq++; const every = Math.max(1, Number(ms) || 0); timers.set(id, { at: now + every, fn, args, every }); return id; };
  window.clearTimeout = window.clearInterval = (id) => { timers.delete(id); };
  window.requestAnimationFrame = (fn) => { const id = seq++; rafs.set(id, fn); return id; };
  window.cancelAnimationFrame = (id) => { rafs.delete(id); };
  performance.now = () => now;
  class VDate extends R.Date {
    constructor(...a) { if (a.length) super(...a); else super(base + now); }
    static now() { return base + now; }
  }
  window.Date = VDate;

  // Smooth scrolls become virtual-time tweens; CSS smooth scrolling is off (we drive every scroll).
  const css = () => { const s = document.createElement("style"); s.textContent = "html{scroll-behavior:auto!important}"; document.documentElement.append(s); };
  document.documentElement ? css() : document.addEventListener("DOMContentLoaded", css);
  const pos = (el) => (el === window ? [scrollX, scrollY] : [el.scrollLeft, el.scrollTop]);
  const raw = { winTo: window.scrollTo.bind(window), elTo: Element.prototype.scrollTo, into: Element.prototype.scrollIntoView };
  const jump = (el, l, t) => (el === window ? raw.winTo({ left: l, top: t, behavior: "instant" }) : raw.elTo.call(el, { left: l, top: t, behavior: "instant" }));
  const tween = (el, l, t, ms = 450) => {
    const [l0, t0] = pos(el), start = now;
    const step = () => {
      const k = Math.min(1, (now - start) / ms), e = 1 - (1 - k) ** 3;
      jump(el, l0 + (l - l0) * e, t0 + (t - t0) * e);
      if (k < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  };
  const target = (el, a, b, by) => {
    const o = typeof a === "object" && a !== null ? a : { left: a, top: b };
    const [l, t] = pos(el);
    return { smooth: o.behavior === "smooth", l: by ? l + (o.left ?? 0) : o.left ?? l, t: by ? t + (o.top ?? 0) : o.top ?? t };
  };
  const patch = (owner, name, el, by) => {
    const orig = owner[name];
    owner[name] = function (a, b) {
      const self = el ?? this, x = target(self, a, b, by);
      if (!x.smooth) return orig.call(this, a, b);
      tween(self, x.l, x.t);
    };
  };
  patch(window, "scrollTo", window, false); patch(window, "scroll", window, false); patch(window, "scrollBy", window, true);
  patch(Element.prototype, "scrollTo", null, false); patch(Element.prototype, "scroll", null, false); patch(Element.prototype, "scrollBy", null, true);
  Element.prototype.scrollIntoView = function (o) {
    if (!(o && typeof o === "object" && o.behavior === "smooth")) return raw.into.call(this, o);
    const boxes = [window];
    for (let e = this.parentElement; e; e = e.parentElement) if (e.scrollHeight > e.clientHeight || e.scrollWidth > e.clientWidth) boxes.push(e);
    const before = boxes.map(pos);
    raw.into.call(this, { ...o, behavior: "instant" });
    const after = boxes.map(pos);
    boxes.forEach((b, i) => { jump(b, ...before[i]); if (after[i][0] !== before[i][0] || after[i][1] !== before[i][1]) tween(b, ...after[i]); });
  };

  // CSS transitions/animations, view transitions and Motion's WAAPI animations: paused and seeked.
  // Each animation is held at playbackRate 0 and seeked to virtual time every frame. Near its
  // end (within 1 ms: float steps land on 449.9999 for a 450 ms animation, where Chrome already
  // drops it from getAnimations but, at rate 0, never finishes it) the rate goes back and it jumps
  // to the end, so it finishes normally and `finished` resolves: the app waits on that
  // (fly-to-cart, dialogs closing). Held animations are also tracked here, in case one drops out.
  const seen = new WeakMap();
  const held = new Set();
  const seek = () => {
    for (const a of new Set([...document.getAnimations(), ...held])) { // getAnimations also flushes pending style
      let st = seen.get(a);
      if (st === "done") { held.delete(a); continue; }
      if (st === undefined) {
        st = { s: now - (a.currentTime ?? 0), rate: a.playbackRate || 1 };
        seen.set(a, st); held.add(a);
        try { a.playbackRate = 0; } catch {}
      }
      if (a.playState === "idle") { seen.set(a, "done"); held.delete(a); continue; } // cancelled
      const t = now - st.s, end = a.effect?.getComputedTiming().endTime;
      try {
        if (Number.isFinite(end) && t >= end - 1) {
          a.playbackRate = st.rate; a.currentTime = end;
          if (a.playState === "paused") a.play();
          seen.set(a, "done"); held.delete(a);
        } else a.currentTime = t;
      } catch {}
    }
  };
  const settle = () => new Promise((done) => {
    // A real frame, then wait (real time, max 1.5 s) for images in view so nothing pops in blank.
    R.raf(() => {
      const t0 = R.Date.now();
      const check = () => {
        const pending = [...document.images].some((img) => {
          if (img.complete) return false;
          const r = img.getBoundingClientRect();
          return r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
        });
        pending && R.Date.now() - t0 < 1500 ? R.setTimeout(check, 30) : done();
      };
      check();
    });
  });
  window.__vt = {
    get now() { return now; },
    advance(ms, scrollTop) {
      const end = now + ms;
      for (;;) {
        let next = null;
        for (const e of timers) if (e[1].at <= end && (!next || e[1].at < next[1].at)) next = e;
        if (!next) break;
        const [id, t] = next;
        now = Math.max(now, t.at);
        if (t.every) t.at += t.every; else timers.delete(id);
        try { typeof t.fn === "function" ? t.fn(...t.args) : (0, eval)(t.fn); } catch (e) { console.error(e); }
      }
      now = end;
      if (scrollTop !== undefined) jump(window, scrollX, scrollTop);
      const due = [...rafs.values()]; rafs.clear();
      for (const fn of due) try { fn(now); } catch (e) { console.error(e); }
      seek();
      return settle();
    },
  };
}

// A visible touch marker in the shop's brand color (runs on the virtual clock).
const marker = () => {
  window.__tap = (x, y) => {
    const brand = getComputedStyle(document.documentElement).getPropertyValue("--brand").trim() || "#333";
    const dot = document.createElement("div");
    Object.assign(dot.style, {
      position: "fixed", left: `${x - 22}px`, top: `${y - 22}px`, width: "44px", height: "44px",
      borderRadius: "50%", background: `color-mix(in srgb, ${brand} 32%, transparent)`, border: `2px solid ${brand}`,
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
function startRecorder(name) {
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
async function until(pred, args = [], maxMs = 15000) {
  for (let i = 0; i < maxMs / STEP; i++) {
    try { const ok = await page.evaluate(pred, ...args); if (ok) return ok; } catch {}
    await tick();
  }
  throw new Error(`timed out waiting at ${page.url()}: ${pred}`);
}
async function untilNode(check, maxMs = 15000) {
  for (let i = 0; i < maxMs / STEP; i++) { if (check()) return; await tick(); }
  throw new Error(`timed out (node condition) at ${page.url()}`);
}
async function find(selector, text, maxMs = 15000) {
  await until((s, t) => [...document.querySelectorAll(s)].some((e) => e.offsetParent !== null && (!t || e.textContent.trim().includes(t))), [selector, text], maxMs);
  return page.evaluateHandle((s, t) => [...document.querySelectorAll(s)].find((e) => e.offsetParent !== null && (!t || e.textContent.trim().includes(t))), selector, text);
}

// Moves a scroll target so no heading (with its eyebrow line) or card ends up half under the
// sticky bars or half off the bottom edge. Layout positions, so reveal transforms don't skew it.
const snap = (to) => page.evaluate((to) => {
  const max = document.documentElement.scrollHeight - innerHeight;
  to = Math.max(0, Math.min(max, to));
  const stuck = (y) => Math.max(0, ...[...document.querySelectorAll("body *")].map((el) => {
    const cs = getComputedStyle(el);
    if (cs.position !== "sticky" && cs.position !== "fixed") return 0;
    if (el.closest("[role=dialog]") || el.offsetHeight === 0 || el.offsetHeight > 220) return 0;
    const r = el.getBoundingClientRect();
    const top = parseFloat(cs.top);
    if (Number.isNaN(top) || r.top > innerHeight / 2) return 0;
    if (cs.position === "fixed") return r.bottom;
    const saved = el.style.position; el.style.position = "static";
    const natural = el.getBoundingClientRect().top + scrollY - y;
    el.style.position = saved;
    return Math.max(natural, top) + r.height + 4;
  }));
  const pinned = (el) => { for (let e = el; e && e !== document.body; e = e.parentElement) { const p = getComputedStyle(e).position; if (p === "sticky" || p === "fixed") return true; } return false; };
  const blocks = [...document.querySelectorAll("main h1, main h2, main h3, main [role=heading], main article, main li, main section > div, main [class*=rounded]")]
    .filter((el) => el.offsetParent && !el.closest("[role=dialog]") && el.offsetHeight > 0 && el.offsetHeight < innerHeight * 0.8 && !pinned(el) &&
      (!/rounded/.test(el.className) || el.offsetWidth > innerWidth * 0.6));
  const docTop = (e) => { let y = 0; for (; e; e = e.offsetParent) y += e.offsetTop; return y; };
  for (let pass = 0; pass < 8; pass++) {
    const edge = stuck(to);
    let moved = false;
    for (const el of blocks) {
      const prev = el.previousElementSibling;
      const heading = /^H\d$/.test(el.tagName) || el.getAttribute("role") === "heading";
      const first = /^H\d$/.test(el.tagName) && prev && /^(P|SPAN)$/.test(prev.tagName) && prev.offsetHeight < 32 ? prev : el;
      const top = docTop(first) - to, bottom = docTop(el) + el.offsetHeight - to;
      if (top < edge && bottom > edge) {
        const up = edge + 12 - top, down = bottom - edge + 8;
        to += up <= down || heading ? -up : down; moved = true; break;
      }
      if (heading && top < innerHeight && bottom > innerHeight - 24) { to += bottom - innerHeight + 40; moved = true; break; }
    }
    to = Math.max(0, Math.min(max, to));
    if (!moved) break;
  }
  return to;
}, to);

/** Eased page scroll, one position per frame. */
async function glide(to, ms = 1600) {
  if (to > 0) to = await snap(to);
  const from = await page.evaluate(() => scrollY);
  const n = Math.max(1, Math.round(ms / STEP));
  for (let i = 1; i <= n; i++) {
    const t = i / n, e = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
    await tick(from + (to - from) * e);
  }
}
const offsetOf = (sel, gap = 80) => page.evaluate((s, g) => document.querySelector(s).getBoundingClientRect().top + scrollY - g, sel, gap);
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
async function load(url) {
  await page.goto(url, { waitUntil: "load" });
  await until(() => document.readyState === "complete" && document.fonts.status === "loaded");
  await hold(300);
}

// ---------- Part 1: the customer ----------
await load(BASE);
await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
await load(BASE);
const colors = await page.evaluate(() => {
  const s = getComputedStyle(document.documentElement);
  return Object.fromEntries(["brand", "blush", "cream", "ink"].map((k) => [k, s.getPropertyValue(`--${k}`).trim()]));
});

startRecorder("part1");
await hold(2600);

// 1. Home: hero, the two ways to enjoy the shop, favourites
if (await page.$("#como")) { await glide(await offsetOf("#como"), 1800); await hold(2000); }
await glide(await offsetOf("#favoritas"), 1600); await hold(900);
await page.evaluate(() => document.querySelector("#favoritas").closest("section").querySelector("ul").scrollBy({ left: 300, behavior: "smooth" }));
await hold(1500);
await glide(0, 1800); await hold(900);

if (!TEST) {
  // 2. The menu: just scroll through it
  if (await page.$("main a[href='/salon']")) {
    await tap("main a[href='/salon']");
    await until(() => location.pathname === "/salon"); await hold(1500);
    await glide(900, 2200); await hold(700);
    await glide(2100, 2600); await hold(900);
  }
}

// 3. Take away: the notice (if any), then scroll to the middle of the next category
await tap("header nav a[href='/take-away']");
await until(() => location.pathname === "/take-away");
const notice = await find("[role=dialog] button", "Entendido", 5000).catch(() => null);
if (notice) { await hold(3000); await tap(notice); await hold(1000); } else await hold(1200);

if (TEST) {
  const file = await stopRecorder();
  await browser.close();
  execFileSync(ffmpegPath, ["-y", "-v", "error", "-i", file, "-vf", "scale=444:960:flags=lanczos", "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart", OUT]);
  rmSync(WORK, { recursive: true, force: true });
  console.log(`test clip saved ${OUT} in ${((Date.now() - started) / 1000).toFixed(0)} s`);
  process.exit(0);
}

const target = await page.evaluate(() => {
  const next = document.querySelectorAll("main section[id]")[1];
  const r = next.getBoundingClientRect();
  return r.top + scrollY + r.height / 2 - innerHeight / 2;
});
await glide(target * 0.45, 2000); await hold(700);
await glide(target, 2400); await hold(1000);

// 4. Quick add with the card's +, then open another product and take two
const cards = await page.evaluateHandle(() => {
  const items = [...document.querySelectorAll("main section[id]")[1].querySelectorAll("li")].filter((li) => li.querySelector("button[aria-label^='Agregar']"));
  const mid = innerHeight / 2;
  return items.sort((x, y) => Math.abs(x.getBoundingClientRect().top + 100 - mid) - Math.abs(y.getBoundingClientRect().top + 100 - mid)).slice(0, 2);
});
const [first, second] = await Promise.all([0, 1].map(async (i) => (await cards.getProperty(String(i))).asElement()));
await tap(await first.$("button[aria-label^='Agregar']")); await hold(2200);
await tap(await second.$("button")); await hold(1500);
await tap("[role=dialog] button[aria-label^='Sumar']"); await hold(900);
{
  const add = await find("[role=dialog] button", "Agregar");
  const box = await add.boundingBox();
  await page.evaluate((x, y) => window.__tap(x, y), box.x + box.width / 2, box.y + box.height / 2 - 12);
  await hold(250);
  await add.evaluate((e) => e.click());
  await hold(1900);
}

// 5. Cart: branch, pickup slot and contact details
await tap(await find("main button", "Ver pedido")); await hold(1500);
if (BRANCH) { await tap(await find("[role=dialog] [role=radio]", BRANCH)); await hold(800); }
await find("[role=dialog] [aria-label='Día de retiro'] [role=radio]");
await tap((await page.$$("[role=dialog] [aria-label='Día de retiro'] [role=radio]"))[1], true); await hold(700);
const slots = await page.$$("[role=dialog] [aria-label='Horario de retiro'] [role=radio]");
const labels = await Promise.all(slots.map((s) => s.evaluate((e) => e.textContent.trim())));
await tap(slots[labels.indexOf("17:00") >= 0 ? labels.indexOf("17:00") : Math.floor(slots.length / 2)], true); await hold(700);
await tap("input[name=name]", true); await type("Lucía Fernández"); await hold(300);
await tap("input[name=phone]", true); await type("341 555-1234"); await hold(500);
await tap("textarea[name=notes]", true); await type(process.env.NOTES || "Feliz cumple, Martu 🎂", 45); await hold(700);

// 6. Mercado Pago checkout, paid with the saved Visa
let navigated = false;
const nav = page.waitForNavigation({ waitUntil: "load" }).then(() => { navigated = true; });
await tap("[role=dialog] button[type=submit]", true);
await untilNode(() => navigated); await nav;
await until(() => document.readyState === "complete");
await hold(1800);
await tap(await find("[role=radio]", "Visa terminada")); await hold(900);
await tap(await find("button", "Pagar"));
await until(() => location.pathname === "/pedido"); await hold(3600);

const part1Raw = await stopRecorder();
const ref = await page.evaluate(() => new URLSearchParams(location.search).get("ref"));

// ---------- Part 2: the shop's panel, on the same phone ----------
await load(`${BASE}/admin?nuevo=${ref}`);
await hold(500);
startRecorder("part2");
await hold(3400);
await tap(await find("#fresh-title ~ * label", "Marcar entregado")); await hold(1800);
await glide(700, 1800); await hold(1400);
await glide(0, 900); await hold(400);
await tap("header nav a[href='/admin/ventas']");
await until(() => location.pathname === "/admin/ventas"); await hold(2800);
await glide(await offsetOf("#by-day", 120), 1800); await hold(900);
const bars = await page.$$("section[aria-labelledby=by-day] ul button");
const values = await Promise.all(bars.map((b) => b.evaluate((e) => Number(e.getAttribute("aria-label").split(":").pop().replace(/\D/g, "")))));
const recent = values.slice(-6, -1);
await tap(bars[values.length - 6 + recent.indexOf(Math.max(...recent))]); await hold(2000);
await glide(await offsetOf("#top", 120), 1800); await hold(2000);
await glide(await offsetOf("#by-weekday", 120), 1800); await hold(2800);
const part2Raw = await stopRecorder();
await browser.close();

// ---------- Assemble: one phone video, customer then a slide to the panel, in the shop's frame ----------
const duration = (file) => {
  let text = "";
  try { execFileSync(ffmpegPath, ["-i", file], { stdio: ["ignore", "pipe", "pipe"] }); } catch (e) { text = String(e.stderr); }
  const [, hh, mm, ss] = text.match(/Duration: (\d+):(\d+):([\d.]+)/);
  return Number(hh) * 3600 + Number(mm) * 60 + Number(ss);
};
const SCREEN = { x: 738, y: 60, w: 444, h: 960, r: 48 };
const FADE = 0.6;
const offset = duration(part1Raw) - FADE;

const fb = await puppeteer.launch({ executablePath: CHROME, headless: true });
const art = `<!doctype html><html><head><style>
html,body{margin:0;width:1920px;height:1080px;overflow:hidden}
body{background:radial-gradient(1200px 760px at 50% 45%,${colors.blush} 0%,${colors.cream} 58%,color-mix(in oklab,${colors.cream},${colors.ink} 7%) 100%)}
.phone{position:absolute;left:${SCREEN.x - 16}px;top:${SCREEN.y - 16}px;width:${SCREEN.w + 32}px;height:${SCREEN.h + 32}px;border-radius:${SCREEN.r + 16}px;background:${colors.ink};box-shadow:0 40px 90px color-mix(in srgb,${colors.ink} 30%,transparent)}
</style></head><body><div class="phone"></div></body></html>`;
const mask = `<!doctype html><html><head><style>
html,body{margin:0;width:1920px;height:1080px;overflow:hidden;background:#fff}
.hole{position:absolute;left:${SCREEN.x}px;top:${SCREEN.y}px;width:${SCREEN.w}px;height:${SCREEN.h}px;border-radius:${SCREEN.r}px;background:#000}
</style></head><body><div class="hole"></div></body></html>`;
const fp = await fb.newPage(); await fp.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
await fp.setContent(art); await fp.screenshot({ path: join(WORK, "frame-art.png") });
await fp.setContent(mask); await fp.screenshot({ path: join(WORK, "frame-mask.png") });
await fb.close();

const screen = (i) => `[${i}:v]setpts=PTS-STARTPTS,scale=${SCREEN.w}:${SCREEN.h}:flags=lanczos,setsar=1,fps=${FPS},settb=AVTB[s${i}]`;
execFileSync(ffmpegPath, ["-y", "-v", "error", "-i", part1Raw, "-i", part2Raw,
  "-loop", "1", "-framerate", String(FPS), "-i", join(WORK, "frame-art.png"), "-loop", "1", "-framerate", String(FPS), "-i", join(WORK, "frame-mask.png"),
  "-filter_complex", [
    screen(0), screen(1),
    `[s0][s1]xfade=transition=slideleft:duration=${FADE}:offset=${offset.toFixed(3)}[ph]`,
    `[2:v]format=rgba[art]`, `[3:v]format=gray[m]`, `[art][m]alphamerge[frame]`,
    `[2:v][ph]overlay=${SCREEN.x}:${SCREEN.y}:shortest=1[base]`,
    `[base][frame]overlay=0:0:shortest=1,format=yuv420p[v]`,
  ].join(";"),
  "-map", "[v]", "-r", String(FPS), "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-maxrate", "12M", "-bufsize", "24M",
  "-g", String(FPS * 2), "-movflags", "+faststart", OUT]);

// Email/WhatsApp copy: the same frames, smaller (higher CRF).
execFileSync(ffmpegPath, ["-y", "-v", "error", "-i", OUT, "-c:v", "libx264", "-preset", "medium", "-crf", "28", "-movflags", "+faststart",
  OUT.replace(/\.mp4$/, "-email.mp4")]);
rmSync(WORK, { recursive: true, force: true });
console.log(`panel from ${offset.toFixed(2)} s; saved ${OUT} in ${((Date.now() - started) / 1000).toFixed(0)} s`);
