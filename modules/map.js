/* ============================================================================
   map.js — the Google Maps embed, loaded only when it is nearly on screen

   Deliberately has no GSAP or Lenis dependency, and is called from main.js
   rather than motion.js, so a reduced-motion visitor still gets a working map.

   The iframe is not in the markup. An embedded Google map pulls several
   hundred KB of script and tiles and sets third-party cookies, and this sits
   at the very bottom of a 13,000px document — paying for that on first load
   would undo the performance work for something most visitors scroll past.
   Instead the styled facade ships in the HTML and the real map replaces it
   once the visitor is within a screen or so of it.
   ========================================================================= */

import { whenNear } from './lazy.js';

export function initMap() {
  const map = document.querySelector('[data-map]');
  if (!map) return;

  const canvas = map.querySelector('.map__canvas');
  const src = map.dataset.mapSrc;
  if (!canvas || !src) return;

  whenNear(map, () => {
    const frame = document.createElement('iframe');
    frame.className = 'map__frame';
    frame.src = src;
    frame.title =
      'Google Map showing Dolce Beauty Lounge at 277 North Lynnhaven Road, Suite 103, Virginia Beach, Virginia';
    /* Eager, not lazy. Reaching this line already means the observer decided
       the map is wanted; loading="lazy" here would hand the same decision
       back to the browser and defer the fetch a second time. The lazy
       attribute belongs only on the <noscript> copy, which ships in the
       markup and does need deferring. */
    frame.loading = 'eager';
    frame.referrerPolicy = 'no-referrer-when-downgrade';
    frame.setAttribute('allowfullscreen', '');

    /* Only cross-fade once Google has actually painted, so the facade never
       blinks out to reveal an empty white box on a slow connection. */
    frame.addEventListener('load', () => map.classList.add('is-loaded'), { once: true });

    canvas.appendChild(frame);
  });
}
