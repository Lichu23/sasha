import puppeteer from "puppeteer-core";
import ffmpegPath from "ffmpeg-static";
import { mkdirSync, rmSync } from "node:fs";
import { execFileSync, spawn } from "node:child_process";
import { once } from "node:events";
import { join } from "node:path";
import { installClock } from "./virtual-clock.mjs";

// What the phone demo recorders share (record-whatsapp-demo.mjs, record-approval-demo.mjs): ALWAYS frame by
// frame at 30 fps on the virtual clock (see README, "Demo videos"), one phone on a 1920x1080 frame, a title for
// every step beside the phone, an intro card and a closing card.
//
//   const demo = await createPhoneDemo({ out, steps });
//   demo.startPart("a"); ...actions, demo.caption(1)...; await demo.endPart();      // one phone video per part
//   await demo.finish({ colors, logoSvg, intro, outro });                           // parts slide into each other
//
// Env: FPS=30 (the rule), DPR=1.25, BASE=http://localhost:3100, CHROME=<path to chrome.exe>

const FPS = Number(process.env.FPS || 30);
const DPR = Number(process.env.DPR || 1.25);
const STEP = 1000 / FPS;
const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
export const BASE = process.env.BASE || "http://localhost:3100";

const SCREEN = { x: 738, y: 60, w: 444, h: 960, r: 48 };
const FADE = 0.6;

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

const duration = (file) => {
  let text = "";
  try { execFileSync(ffmpegPath, ["-i", file], { stdio: ["ignore", "pipe", "pipe"] }); } catch (e) { text = String(e.stderr); }
  const [, hh, mm, ss] = text.match(/Duration: (\d+):(\d+):([\d.]+)/);
  return Number(hh) * 3600 + Number(mm) * 60 + Number(ss);
};

export async function createPhoneDemo({ out, steps, introMs = 3200, outroMs = 5000 }) {
  const work = out.replace(/\.mp4$/, ".work");
  rmSync(work, { recursive: true, force: true }); mkdirSync(work, { recursive: true });
  const started = Date.now();

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
  // A WhatsApp consulta opens wa.me by itself: the recording never leaves for WhatsApp, that navigation is cancelled.
  await cdp.send("Fetch.enable", { patterns: [{ urlPattern: "*://wa.me/*" }, { urlPattern: "*://api.whatsapp.com/*" }, { urlPattern: "*://*.whatsapp.com/*" }] });
  cdp.on("Fetch.requestPaused", ({ requestId }) => { cdp.send("Fetch.failRequest", { requestId, errorReason: "Aborted" }).catch(() => {}); });

  let rec = null;
  const parts = []; // finished part files, in order
  const marks = []; // { part, t, step }: when each step's title appears, in seconds into its part

  function startPart(name) {
    const file = join(work, `part-${parts.length + 1}-${name}.mp4`);
    const ff = spawn(ffmpegPath, ["-y", "-v", "error", "-f", "image2pipe", "-c:v", "mjpeg", "-framerate", String(FPS), "-i", "-",
      "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2", "-c:v", "libx264", "-preset", "veryfast", "-crf", "10", "-pix_fmt", "yuv420p", file],
    { stdio: ["pipe", "inherit", "inherit"] });
    rec = { ff, file, frames: 0 };
  }
  async function endPart() {
    const { ff, file, frames } = rec; rec = null;
    ff.stdin.end(); await once(ff, "close");
    console.log(`  ${file.split(/[\\/]/).pop()}: ${frames} frames (${(frames / FPS).toFixed(1)} s)`);
    parts.push(file);
    return file;
  }
  const caption = (step) => { marks.push({ part: parts.length, t: rec.frames / FPS, step }); console.log(`  step ${step}: ${steps[step - 1].title}`); };

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
    // What the page looked like, to see why it never got there.
    const shot = join(work, "timeout.png");
    await page.screenshot({ path: shot }).catch(() => {});
    throw new Error(`timed out waiting at ${page.url()} (screenshot: ${shot}): ${pred}`);
  }
  /** A visible element matching the selector (and text, if given). */
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
  /** Shows the touch marker on something without pressing it (a link that would open another app). */
  async function point(target) {
    const el = typeof target === "string" ? await find(target) : target;
    await el.evaluate((e) => e.scrollIntoView({ block: "nearest", behavior: "smooth" }));
    await hold(450);
    const box = await el.boundingBox();
    await page.evaluate((x, y) => window.__tap(x, y), box.x + box.width / 2, box.y + box.height / 2);
    await hold(250);
  }
  async function type(text, perChar = 55) {
    for (const ch of text) { await page.keyboard.type(ch); await hold(perChar); }
  }
  async function load(url) {
    await page.goto(url, { waitUntil: "load" });
    await until(() => document.readyState === "complete" && document.fonts.status === "loaded");
    await hold(300);
  }
  // Moves a scroll target so no heading (with its eyebrow line) or card ends up half under the sticky bars or
  // half off the bottom edge. Layout positions, so reveal transforms don't skew it. For the shops' pages.
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

  /** Eased page scroll, one position per frame. `snapped`: end where no title or card is cut (the shops' pages). */
  async function glide(to, ms = 1600, snapped = false) {
    if (snapped && to > 0) to = await snap(to);
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

  /** A quick check: the last part alone, no titles. */
  async function quickClip() {
    const file = parts.at(-1);
    await browser.close();
    execFileSync(ffmpegPath, ["-y", "-v", "error", "-i", file, "-vf", "scale=444:960:flags=lanczos", "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart", out]);
    rmSync(work, { recursive: true, force: true });
    console.log(`test clip saved ${out} in ${((Date.now() - started) / 1000).toFixed(0)} s`);
  }

  /**
   * Parts slide into each other, with the intro card first, a title per step and the closing card last.
   *   colors: brand, brand-ink, blush, cream, ink, muted, line (CSS colors)
   *   logoSvg(size, color): the mark on the intro card and the closing tiles
   *   intro: { title, subtitle, note }    outro: { title, subtitle, items: [[title, text]], footer }
   */
  async function finish({ colors, logoSvg, intro, outro }) {
    await browser.close();

    // Where each part starts in the final video: a slide begins FADE seconds before the previous part ends.
    const lengths = parts.map(duration);
    const starts = [0];
    let total = lengths[0];
    for (let i = 1; i < parts.length; i++) { starts.push(total - FADE); total += lengths[i] - FADE; }

    const FONT = `font-family:system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif`;
    const doc = (css, body, bg = "transparent") => `<!doctype html><html><head><meta charset="utf-8"><style>
html,body{margin:0;width:1920px;height:1080px;overflow:hidden;background:${bg};color:${colors.ink};${FONT}}
${css}</style></head><body>${body}</body></html>`;
    const backdrop = `radial-gradient(1200px 760px at 50% 45%,${colors.blush} 0%,${colors.cream} 58%,color-mix(in oklab,${colors.cream},${colors.ink} 7%) 100%)`;

    const art = doc(`.phone{position:absolute;left:${SCREEN.x - 16}px;top:${SCREEN.y - 16}px;width:${SCREEN.w + 32}px;height:${SCREEN.h + 32}px;border-radius:${SCREEN.r + 16}px;background:${colors.ink};box-shadow:0 40px 90px color-mix(in srgb,${colors.ink} 30%,transparent)}`, `<div class="phone"></div>`, backdrop);
    const mask = doc(`.hole{position:absolute;left:${SCREEN.x}px;top:${SCREEN.y}px;width:${SCREEN.w}px;height:${SCREEN.h}px;border-radius:${SCREEN.r}px;background:#000}`, `<div class="hole"></div>`, "#fff");

    // The title beside the phone (left) and the list of steps (right).
    const stepCard = (n) => {
      const s = steps[n - 1];
      const rows = steps.map((x, i) => `<li class="${i + 1 === n ? "on" : ""}"><b>${i + 1}</b>${x.label}</li>`).join("");
      return doc(`
.left{position:absolute;left:96px;top:0;width:580px;height:1080px;display:flex;flex-direction:column;justify-content:center}
.num{width:92px;height:92px;border-radius:50%;background:${colors.brand};color:#fff;font-size:48px;font-weight:700;display:grid;place-items:center;margin-bottom:34px}
h1{margin:0;font-size:64px;line-height:1.08;font-weight:700;letter-spacing:-.02em;text-wrap:balance}
p{margin:22px 0 0;font-size:31px;line-height:1.35;color:${colors.muted};text-wrap:pretty}
ul{list-style:none;margin:0;padding:0;position:absolute;left:1244px;top:50%;transform:translateY(-50%);width:580px;display:grid;gap:12px}
li{display:flex;align-items:center;gap:18px;padding:14px 22px;border-radius:22px;font-size:28px;font-weight:600;color:${colors.muted};background:rgba(255,255,255,.45)}
li b{width:44px;height:44px;flex:none;border-radius:50%;display:grid;place-items:center;font-size:22px;background:${colors.blush};color:${colors["brand-ink"]}}
li.on{background:${colors.brand};color:#fff;box-shadow:0 14px 34px color-mix(in srgb,${colors.brand} 35%,transparent)}
li.on b{background:#fff;color:${colors.brand}}`,
      `<div class="left"><div class="num">${n}</div><h1>${s.title}</h1><p>${s.text}</p></div><ul>${rows}</ul>`);
    };

    const introCard = doc(`
.c{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
.logo{width:168px;height:168px;border-radius:44px;background:${colors.brand};display:grid;place-items:center;box-shadow:0 30px 70px color-mix(in srgb,${colors.brand} 35%,transparent)}
h1{margin:48px 0 0;font-size:104px;font-weight:700;letter-spacing:-.025em}
h2{margin:18px 0 0;font-size:56px;font-weight:600;color:${colors["brand-ink"]}}
p{margin:44px 0 0;font-size:30px;color:${colors.muted}}`,
    `<div class="c"><div class="logo">${logoSvg(96, "#fff")}</div><h1>${intro.title}</h1><h2>${intro.subtitle}</h2><p>${intro.note}</p></div>`, backdrop);

    const outroCard = doc(`
.c{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
h1{margin:0;font-size:78px;font-weight:700;letter-spacing:-.02em}
h2{margin:14px 0 0;font-size:36px;font-weight:500;color:${colors.muted}}
.g{display:grid;grid-template-columns:repeat(3,520px);gap:26px;margin-top:62px}
.t{background:#fff;border-radius:30px;padding:34px 36px;box-shadow:0 10px 30px rgba(18,36,58,.08);border:2px solid ${colors.line}}
.t i{display:grid;place-items:center;width:58px;height:58px;border-radius:18px;background:${colors.blush};margin-bottom:20px}
.t b{display:block;font-size:34px;line-height:1.15}
.t span{display:block;margin-top:10px;font-size:25px;line-height:1.35;color:${colors.muted}}
small{margin-top:46px;font-size:26px;color:${colors.muted}}`,
    `<div class="c"><h1>${outro.title}</h1><h2>${outro.subtitle}</h2><div class="g">${
      outro.items.map(([t, d]) => `<div class="t"><i>${logoSvg(32, colors.brand)}</i><b>${t}</b><span>${d}</span></div>`).join("")
    }</div><small>${outro.footer}</small></div>`, backdrop);

    const fb = await puppeteer.launch({ executablePath: CHROME, headless: true });
    const fp = await fb.newPage(); await fp.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
    const render = async (html, name, transparent) => { await fp.setContent(html); const path = join(work, `${name}.png`); await fp.screenshot({ path, omitBackground: transparent }); return path; };
    const artPng = await render(art, "frame-art", false);
    const maskPng = await render(mask, "frame-mask", false);
    const introPng = await render(introCard, "intro", false);
    const outroPng = await render(outroCard, "outro", false);
    const stepPngs = [];
    for (let n = 1; n <= steps.length; n++) stepPngs.push(await render(stepCard(n), `step-${n}`, true));
    await fb.close();

    // When each title is on screen: from its mark to the next one's (they cross-fade), the last until the closing card.
    const at = (m) => starts[m.part] + m.t;
    const outroStart = total - outroMs / 1000;
    const overlays = [{ png: introPng, start: 0, end: introMs / 1000 + 0.4, fi: 0, fo: 0.4 }];
    marks.forEach((m, i) => {
      const start = Math.max(at(m), introMs / 1000 - 0.1);
      const next = marks[i + 1];
      overlays.push({ png: stepPngs[m.step - 1], start, end: next ? at(next) + 0.3 : outroStart + 0.3, fi: 0.3, fo: 0.3 });
    });
    overlays.push({ png: outroPng, start: outroStart, end: total, fi: 0.5, fo: 0 });

    const n = parts.length;
    const screen = (i) => `[${i}:v]setpts=PTS-STARTPTS,scale=${SCREEN.w}:${SCREEN.h}:flags=lanczos,setsar=1,fps=${FPS},settb=AVTB[s${i}]`;
    const inputs = parts.flatMap((p) => ["-i", p]);
    inputs.push("-loop", "1", "-framerate", String(FPS), "-i", artPng, "-loop", "1", "-framerate", String(FPS), "-i", maskPng);
    for (const o of overlays) inputs.push("-loop", "1", "-framerate", String(FPS), "-t", (o.end - o.start).toFixed(3), "-i", o.png);

    const graph = parts.map((_, i) => screen(i));
    let phone = "s0";
    for (let i = 1; i < n; i++) {
      graph.push(`[${phone}][s${i}]xfade=transition=slideleft:duration=${FADE}:offset=${starts[i].toFixed(3)}[x${i}]`);
      phone = `x${i}`;
    }
    graph.push(
      `[${n}:v]format=rgba[art]`, `[${n + 1}:v]format=gray[m]`, `[art][m]alphamerge[frame]`,
      `[${n}:v][${phone}]overlay=${SCREEN.x}:${SCREEN.y}:shortest=1[base]`,
      `[base][frame]overlay=0:0:shortest=1[v0]`,
    );
    overlays.forEach((o, k) => {
      const len = o.end - o.start;
      const fades = [o.fi ? `fade=t=in:st=0:d=${o.fi}:alpha=1` : "", o.fo ? `fade=t=out:st=${(len - o.fo).toFixed(3)}:d=${o.fo}:alpha=1` : ""].filter(Boolean).join(",");
      graph.push(`[${n + 2 + k}:v]format=rgba${fades ? `,${fades}` : ""},setpts=PTS-STARTPTS+${o.start.toFixed(3)}/TB[o${k}]`);
      graph.push(`[v${k}][o${k}]overlay=0:0:eof_action=pass${k === overlays.length - 1 ? ",format=yuv420p" : ""}[v${k + 1}]`);
    });
    execFileSync(ffmpegPath, ["-y", "-v", "error", ...inputs, "-filter_complex", graph.join(";"),
      "-map", `[v${overlays.length}]`, "-r", String(FPS), "-t", total.toFixed(3), "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-maxrate", "12M", "-bufsize", "24M",
      "-g", String(FPS * 2), "-movflags", "+faststart", out]);

    // Email/WhatsApp copy: the same frames, smaller (higher CRF).
    execFileSync(ffmpegPath, ["-y", "-v", "error", "-i", out, "-c:v", "libx264", "-preset", "medium", "-crf", "28", "-movflags", "+faststart",
      out.replace(/\.mp4$/, "-email.mp4")]);
    rmSync(work, { recursive: true, force: true });
    console.log(`${total.toFixed(1)} s, parts start at ${starts.map((s) => s.toFixed(1)).join(", ")} s; saved ${out} in ${((Date.now() - started) / 1000).toFixed(0)} s`);
  }

  return { page, hold, until, find, tap, point, type, load, glide, offsetOf, startPart, endPart, caption, quickClip, finish, introMs, outroMs };
}
