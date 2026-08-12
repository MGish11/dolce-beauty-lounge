/* ============================================================================
   motion.js — the scroll layer

   Everything that needs GSAP or Lenis lives behind this module, so main.js can
   decide not to fetch any of it. Three is one level deeper still: it is only
   imported if the WebGL gates pass.
   ========================================================================= */

import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

import { initSmoothScroll } from './smooth-scroll.js';
import { initHero } from './hero.js';
import { initStatement, initRitual, initMasthead, initReveals, initPlant } from './sections.js';
import { initGallery } from './gallery.js';
import { initTilt, initMagnetic } from './pointer-fx.js';

gsap.registerPlugin(ScrollTrigger);

export function initMotion({ wantsWebGL = true } = {}) {
  initSmoothScroll();
  initHero();
  initMasthead();
  initStatement();
  initReveals();
  initPlant();
  initGallery();
  initRitual();
  initTilt();
  initMagnetic();

  /* Fonts land after first paint and change every measurement ScrollTrigger
     took. Without this the pin distances are wrong by a few hundred pixels. */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
  window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });

  /* 664KB of Three, fetched only once we know it will be used. Deferred to
     idle so it never competes with the hero video for bandwidth. */
  if (wantsWebGL) {
    const load = () =>
      import('./atmosphere.js')
        .then((m) => m.initAtmosphere())
        .catch(() => { /* atmosphere is optional by definition */ });

    if ('requestIdleCallback' in window) requestIdleCallback(load, { timeout: 3000 });
    else setTimeout(load, 1200);
  }
}
