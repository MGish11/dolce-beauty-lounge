/* ============================================================================
   gallery.js — The Space, pinned and translated sideways

   The base stylesheet leaves this as a native horizontal scroller, which is
   the correct no-JS and reduced-motion behaviour. Adding .has-pin to <html>
   converts it: the viewport stops scrolling on its own, ScrollTrigger pins it,
   and vertical scroll becomes horizontal translation of the track.
   ========================================================================= */

import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

export function initGallery() {
  const viewport = document.querySelector('.space__viewport');
  const track = document.querySelector('[data-gallery]');
  if (!viewport || !track) return;

  document.documentElement.classList.add('has-pin');

  /* Recomputed on every refresh rather than captured once — the images are
     lazy and sized in vh, so the real distance is not known at init and
     changes on resize. */
  const distance = () => Math.max(0, track.scrollWidth - viewport.clientWidth);

  gsap.to(track, {
    x: () => -distance(),
    ease: 'none',
    scrollTrigger: {
      trigger: viewport,
      start: 'center center',
      end: () => '+=' + distance(),
      pin: true,
      pinSpacing: true,
      anticipatePin: 1,
      scrub: 1,
      invalidateOnRefresh: true,

      /* This pin injects ~2700px of spacer into the document, which moves
         every section below it. Any ScrollTrigger created before this one but
         positioned after it would otherwise measure against a document that
         has no spacer yet, and land ~2700px too early — silently, and not
         fixable by a later refresh(). A higher refreshPriority forces this
         trigger to refresh first so the spacer exists before anything
         downstream measures itself. */
      refreshPriority: 1,
    },
  });

  /* Late-loading images change scrollWidth after the trigger was measured. */
  track.querySelectorAll('img').forEach((img) => {
    if (img.complete) return;
    img.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
  });
}
