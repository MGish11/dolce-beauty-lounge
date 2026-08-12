/* ============================================================================
   smooth-scroll.js — Lenis, wired to GSAP's ticker and ScrollTrigger
   ========================================================================= */

import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

export function initSmoothScroll() {
  const lenis = new Lenis({
    duration: 1.1,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),  // expo out
    smoothWheel: true,
    syncTouch: false,   // native momentum on touch reads better than a re-implementation
  });

  /* Lenis scrolls the window itself, so ScrollTrigger needs no scrollerProxy —
     it only needs telling when a scroll happened. Driving lenis.raf from
     GSAP's ticker keeps both on one clock; two rAF loops would beat against
     each other and show up as jitter in the hero scrub. lagSmoothing(0) stops
     GSAP from silently swallowing long frames, which would desync the scrub
     from the actual scroll position. */
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  /* Anchor links must go through Lenis or they fight it. */
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -96, duration: 1.2 });
    });
  });

  return lenis;
}
