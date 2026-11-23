// Runs in the page, once per action of a take: one eased step of the booking sheet scrolling down to the times. The sheet scrolls by itself
// (not the page), and a take's clock only moves one frame at a time, so a smooth scroll is written as 16 actions on 16 frames.
(() => {
  const STEPS = 16;
  const sheet = document.querySelector('[role=dialog]');
  window.__scrollStep = (window.__scrollStep || 0) + 1;
  if (window.__scrollStep === 1) {
    const times = document.querySelector('[role=dialog] [aria-label^="Hora del"]');
    window.__scrollFrom = sheet.scrollTop;
    window.__scrollTo = sheet.scrollTop + times.getBoundingClientRect().top - 330;
  }
  const t = Math.min(1, window.__scrollStep / STEPS);
  const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  sheet.scrollTop = window.__scrollFrom + (window.__scrollTo - window.__scrollFrom) * e;
})();
