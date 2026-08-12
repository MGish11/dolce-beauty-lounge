/* ============================================================================
   Dolce Beauty Lounge — entry point

   This file deliberately imports almost nothing. ES module imports are
   hoisted and fetched whether or not the code that uses them ever runs, so a
   static `import gsap from 'gsap'` here would download the entire animation
   stack — GSAP, ScrollTrigger, Lenis and Three, ~789KB raw — for a
   reduced-motion visitor who will not run a single line of it.

   So the split is:
     main.js      → env only. Decides whether motion is wanted at all.
     motion.js    → GSAP + Lenis + the scroll work (~125KB).
     atmosphere.js → Three (~664KB), fetched only if WebGL will actually run.

   A reduced-motion visitor downloads none of it. A four-core phone downloads
   the scroll layer and skips Three entirely.
   ========================================================================= */

import { prefersReducedMotion, onReducedMotionChange, isLowPower } from './modules/env.js';
import { initMap } from './modules/map.js';

/* Not motion — just correct content. Always runs, which is why the map lives
   here rather than in motion.js: a reduced-motion visitor should still get a
   working map. It has no GSAP dependency for the same reason. */
function initAlways() {
  const year = document.querySelector('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());

  initMap();
}

initAlways();

if (!prefersReducedMotion()) {
  import('./modules/motion.js')
    .then((m) => m.initMotion({ wantsWebGL: !isLowPower() }))
    .catch(() => {
      /* CDN unreachable or a module failed to parse. The page is a complete
         static document without any of this, so there is nothing to repair —
         swallow it rather than throwing into the console. */
    });
}

/* If the OS setting is turned on mid-session, the honest response is a reload
   into the static path — unwinding live ScrollTriggers, pins and a
   half-scrubbed video in place cannot be done cleanly. */
onReducedMotionChange((e) => {
  if (e.matches) window.location.reload();
});
