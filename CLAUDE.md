@AGENTS.md

# Project rules

## Demo videos: always frame by frame at 30 fps

Every shop demo video is recorded **frame by frame at 30 fps** with `scripts/record-demo.mjs`
(`npm run record-demo`). Never use a live screencast or screen recorder: it only reaches 16–22 real fps and
drops frames. The script puts the page on a virtual clock (timers, rAF, `Date`, CSS/WAAPI animations and
smooth scrolls advance only when it says so) and takes one screenshot per 1/30 s, so every frame of the
output is different no matter how slow the machine is.

- Default is `FPS=30`. Change it only when the user explicitly asks for another rate.
- Output: `demo/<slug>-app.mp4` plus `demo/<slug>-app-email.mp4` (same frames, smaller). One phone on
  1920x1080, in the shop's colors: the customer's order, then a slide to the admin panel.
- Check the result before sending it: 30 fps, no frozen stretches, no title or card cut at the end of a scroll.
- Steps and gotchas are in the README, section "Demo videos".
