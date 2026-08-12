/* ============================================================================
   env.js — capability detection
   Every decision about whether to run motion lives here, so the rest of the
   codebase never sniffs the environment inline.
   ========================================================================= */

/* The single easing curve. GSAP's expo.out is the runtime twin of the CSS
   cubic-bezier(0.16, 1, 0.3, 1) used throughout styles.css — same curve,
   two syntaxes. Scrubbed tweens use 'none'; nothing else deviates. */
export const EASE = 'expo.out';

const reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
const smallMQ = window.matchMedia('(max-width: 900px)');
const fineMQ = window.matchMedia('(pointer: fine)');

export const prefersReducedMotion = () => reduceMQ.matches;
export const isSmallViewport = () => smallMQ.matches;
export const hasFinePointer = () => fineMQ.matches;

/* Used by the WebGL layer in step 5. */
export const isLowPower = () => (navigator.hardwareConcurrency || 8) <= 4;

/* iOS reports itself in several ways, and iPadOS deliberately masquerades as
   desktop Safari — the maxTouchPoints test is what catches it. */
export const isIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

/* Frame-accurate scrubbing needs requestVideoFrameCallback, and iOS is
   treated as suspect regardless: it refuses to decode until a user gesture,
   throttles seeks, and will not reliably paint a paused <video>. Anything
   failing this gets the still-image crossfade instead of a broken scrubber. */
export const canScrubVideo = () =>
  'requestVideoFrameCallback' in HTMLVideoElement.prototype && !isIOS();

/* React to a live change of the OS motion setting without a reload. */
export const onReducedMotionChange = (fn) => {
  if (reduceMQ.addEventListener) reduceMQ.addEventListener('change', fn);
  else reduceMQ.addListener(fn);
};
