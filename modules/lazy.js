/* ============================================================================
   lazy.js — "run this when the element is nearly on screen"

   Shared by the Google Map and the Instagram grid. Both embed heavy
   third-party iframes at the very bottom of a very long document, and neither
   should cost anything until the visitor is actually heading for them.

   No GSAP dependency on purpose: both callers run from main.js, so they work
   on the reduced-motion path where the whole motion layer is never loaded.
   ========================================================================= */

/* Roughly one viewport of lead time, so the embed has finished loading by the
   time it is actually looked at. */
const DEFAULT_ROOT_MARGIN = '600px';

export function whenNear(element, callback, rootMargin = DEFAULT_ROOT_MARGIN) {
  if (!element || typeof callback !== 'function') return;

  /* No IntersectionObserver: load immediately rather than never. */
  if (!('IntersectionObserver' in window)) {
    callback();
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        io.disconnect();
        callback();
      }
    },
    { rootMargin }
  );

  io.observe(element);
}
