// The virtual clock shared by the demo recorders (record-demo.mjs, record-whatsapp-demo.mjs).
// Runs inside the page (page.evaluateOnNewDocument), so it must not reference anything outside itself.

export function installClock() {
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
