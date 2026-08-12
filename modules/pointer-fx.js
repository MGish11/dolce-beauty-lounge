/* ============================================================================
   pointer-fx.js — service-card tilt and the magnetic CTA

   Both are pointer-only. On touch there is no hover state to express, and
   binding them would only cost battery.
   ========================================================================= */

import gsap from 'gsap';
import { EASE, hasFinePointer } from './env.js';

const TILT_MAX = 6;    // degrees, per spec
const MAGNET_MAX = 6;  // px, per spec

/* --------------------------------------------------------------------------
   Card tilt
   quickTo keeps one tween per property alive instead of allocating a new one
   on every pointermove — the difference is visible under a fast cursor.
   -------------------------------------------------------------------------- */
export function initTilt() {
  if (!hasFinePointer()) return;

  document.querySelectorAll('[data-tilt]').forEach((card) => {
    const rx = gsap.quickTo(card, 'rotationX', { duration: 0.7, ease: EASE });
    const ry = gsap.quickTo(card, 'rotationY', { duration: 0.7, ease: EASE });

    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;   // -0.5 … 0.5
      const py = (e.clientY - r.top) / r.height - 0.5;
      ry(px * TILT_MAX * 2);   // ±6°
      rx(-py * TILT_MAX * 2);
    });

    card.addEventListener('pointerleave', () => { rx(0); ry(0); });
  });
}

/* --------------------------------------------------------------------------
   Magnetic button
   Tracks the pointer across the whole window so the pull begins before the
   cursor arrives, then eases back the moment it leaves the reach radius.
   -------------------------------------------------------------------------- */
export function initMagnetic() {
  if (!hasFinePointer()) return;

  const buttons = document.querySelectorAll('[data-magnetic]');
  if (!buttons.length) return;

  buttons.forEach((btn) => {
    const xTo = gsap.quickTo(btn, 'x', { duration: 0.7, ease: EASE });
    const yTo = gsap.quickTo(btn, 'y', { duration: 0.7, ease: EASE });
    const REACH = 130;

    window.addEventListener('pointermove', (e) => {
      const r = btn.getBoundingClientRect();
      /* Skip entirely when the button is nowhere near the viewport. */
      if (r.bottom < -REACH || r.top > window.innerHeight + REACH) return;

      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      const reach = Math.max(r.width, r.height) / 2 + REACH;

      if (dist > reach) { xTo(0); yTo(0); return; }

      /* Direction unit vector scaled by proximity, capped at MAGNET_MAX. */
      const k = 1 - dist / reach;
      const n = dist || 1;
      xTo((dx / n) * MAGNET_MAX * k);
      yTo((dy / n) * MAGNET_MAX * k);
    }, { passive: true });
  });
}
