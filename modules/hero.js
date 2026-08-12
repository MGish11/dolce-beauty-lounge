/* ============================================================================
   hero.js — the scroll-scrubbed video

   Three responsibilities, in order:
     1. make sure the right derivative is loaded
     2. hold the page behind a gate until the video can actually be scrubbed
     3. drive currentTime from scroll, smoothly

   If any of that looks unsafe on this device, hand off to the still-image
   crossfade rather than shipping a stuttering scrubber.
   ========================================================================= */

import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { canScrubVideo, isSmallViewport } from './env.js';

/* Lerp factor. 0.12 is the difference between film and a slideshow: low
   enough to smooth the scroll's own stepping, high enough that the image
   never feels detached from the wheel. */
const LERP = 0.12;

/* Source is 24fps, so a frame is 1/24s. Seeking for anything finer than half
   a frame just thrashes the decoder for a picture that cannot change. */
const MIN_DELTA = 1 / 48;

/* If the video has not become scrubbable by now, something is wrong with the
   network or the codec — stop waiting and show the stills instead of holding
   the visitor behind a gate indefinitely. */
const GATE_TIMEOUT_MS = 12000;

export function initHero() {
  const hero = document.querySelector('[data-hero]');
  const video = document.querySelector('[data-hero-video]');
  const stills = document.querySelector('[data-hero-stills]');
  const gate = document.querySelector('[data-gate]');
  if (!hero || !video) return;

  if (!canScrubVideo()) {
    /* Decided before a single video byte is requested — the markup ships
       preload="none" precisely so this path can bail for free. */
    useStills(hero, video, stills, gate);
    return;
  }

  /* Committed to scrubbing: now it is worth buffering the whole file.
     currentSrc is empty until load() resolves a <source>, so the safety-net
     check has to wait for metadata. {once} stops it looping if it re-loads. */
  video.preload = 'auto';
  video.addEventListener('loadedmetadata', () => correctSource(video), { once: true });
  video.load();

  runGate(video, gate)
    .then(() => {
      initScrub(hero, video);
      initOverlay(hero);
      ScrollTrigger.refresh();
    })
    .catch(() => useStills(hero, video, stills, gate));
}

/* --------------------------------------------------------------------------
   1. Source correction
   The <source media> attribute already keeps small viewports off the 1440p
   file. This only catches a browser that ignored it.
   -------------------------------------------------------------------------- */
function correctSource(video) {
  const wantsSmall = isSmallViewport();
  const src = video.currentSrc || '';
  if (!src) return;
  const has720 = src.includes('hero-720');
  if (wantsSmall === has720) return;

  const next = wantsSmall ? 'assets/video/hero-720.mp4' : 'assets/video/hero-1440.mp4';
  const source = video.querySelector('source[type="video/mp4"]:not([media])');
  if (source) source.src = next;
  video.load();
}

/* --------------------------------------------------------------------------
   2. The gate
   readyState >= 3 (HAVE_FUTURE_DATA) is the real signal. The buffered bar is
   only a visual — it is deliberately not what dismisses the gate.
   -------------------------------------------------------------------------- */
function runGate(video, gate) {
  return new Promise((resolve, reject) => {
    if (video.readyState >= 3) return resolve();
    if (!gate) return reject(new Error('no gate element'));

    const fill = gate.querySelector('[data-gate-fill]');
    const bar = gate.querySelector('.gate__rule');
    gate.hidden = false;
    document.documentElement.classList.add('is-gated');

    let settled = false;

    /* Deliberately setInterval, not requestAnimationFrame. Browsers throttle
       rAF to a stop in a background tab, so an rAF-driven gate would never
       notice the video was ready, hit the timeout below, and demote a fully
       capable browser to the stills fallback purely for having been opened in
       a background tab. A timer keeps running. */
    const poll = setInterval(tick, 120);

    const timeout = setTimeout(() => {
      /* Even here, believe readyState over the clock. */
      if (video.readyState >= 3) finish(resolve);
      else finish(reject, new Error('gate timeout'));
    }, GATE_TIMEOUT_MS);

    function tick() {
      if (settled) return;
      let p = 0;
      if (video.buffered.length && video.duration) {
        p = video.buffered.end(video.buffered.length - 1) / video.duration;
      }
      const pct = Math.round(Math.min(p, 1) * 100);
      if (fill) fill.style.width = Math.max(pct, 2) + '%';
      if (bar) bar.setAttribute('aria-valuenow', String(pct));

      if (video.readyState >= 3) finish(resolve);
    }

    function finish(settle, arg) {
      if (settled) return;
      settled = true;
      clearInterval(poll);
      clearTimeout(timeout);
      video.removeEventListener('error', onError);
      video.removeEventListener('canplay', tick);

      if (settle === reject) {
        dismiss(true);
        return settle(arg);
      }

      if (fill) fill.style.width = '100%';
      dismiss(false);
      settle();
    }

    /* The fade-out is a CSS class, not a GSAP tween, for the same reason the
       poll is a timer: it must not depend on the animation clock running. */
    function dismiss(immediate) {
      if (immediate) {
        gate.hidden = true;
        document.documentElement.classList.remove('is-gated');
        return;
      }
      gate.classList.add('gate--out');
      const done = () => {
        gate.hidden = true;
        gate.classList.remove('gate--out');
        document.documentElement.classList.remove('is-gated');
      };
      gate.addEventListener('transitionend', done, { once: true });
      /* Fallback if transitionend never arrives (throttled tab, reduced
         motion collapsing the duration to ~0). */
      setTimeout(done, 1200);
    }

    function onError() { finish(reject, new Error('video error')); }
    video.addEventListener('error', onError);
    video.addEventListener('canplay', tick);

    tick();
  });
}

/* --------------------------------------------------------------------------
   3. The scrub
   Scroll writes a target. A lerp inside the shared ticker walks toward it.
   currentTime is only ever assigned from the lerped value, never from the
   scroll event directly — that indirection is the whole trick.
   -------------------------------------------------------------------------- */
function initScrub(hero, video) {
  /* Seeking to exactly duration lands past the last frame in some builds and
     shows black, so stop one frame short. */
  const end = Math.max(0, (video.duration || 10) - 1 / 24);
  let target = 0;
  let current = 0;

  ScrollTrigger.create({
    trigger: hero,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => { target = self.progress * end; },
  });

  gsap.ticker.add(() => {
    current += (target - current) * LERP;
    if (Math.abs(current - video.currentTime) > MIN_DELTA) {
      video.currentTime = current;
    }
  });
}

/* --------------------------------------------------------------------------
   Overlay type — parallax against the video
   The type layer runs on its own rate: the wordmark has fully left by ~65% of
   the push while the video is still resolving, and the second line arrives
   only as the desk comes into view.
   -------------------------------------------------------------------------- */
function initOverlay(hero) {
  const wordmark = hero.querySelector('.hero__wordmark');
  const place = hero.querySelector('.hero__place');
  const sub = hero.querySelector('[data-hero-sub]');
  const indicator = hero.querySelector('[data-hero-indicator]');

  const tl = gsap.timeline({
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom bottom', scrub: true },
  });

  tl.to([wordmark, place], {
    y: () => -window.innerHeight * 0.22,
    filter: 'blur(14px)',
    opacity: 0,
    ease: 'none',
    duration: 0.65,
  }, 0);

  if (indicator) {
    tl.to(indicator, { scaleY: 0.15, opacity: 0, ease: 'none', duration: 0.15 }, 0);
  }

  if (sub) {
    tl.fromTo(sub,
      { opacity: 0, y: 26 },
      { opacity: 1, y: 0, ease: 'none', duration: 0.25 },
      0.6);
  }

  /* Pad the timeline out to a full 1.0 so the positions above read as literal
     percentages of hero progress rather than fractions of 0.85. */
  tl.to({}, { duration: 0.15 }, 0.85);
}

/* --------------------------------------------------------------------------
   Fallback — parallax on the first frame, crossfading to the last
   Used on iOS and anywhere requestVideoFrameCallback is missing. Step 6
   hardens this further; it is wired now so the path is never broken.
   -------------------------------------------------------------------------- */
function useStills(hero, video, stills, gate) {
  if (gate) {
    gate.hidden = true;
    document.documentElement.classList.remove('is-gated');
  }
  /* Remove the element rather than just hiding it: a detached <video> cannot
     later decide to fetch anything. */
  if (video) video.remove();
  if (!stills) return;

  /* .is-stills collapses the hero from 400vh to 220vh. Four viewports of
     scroll is the right length for ten seconds of footage and far too long
     for a single crossfade — without this the fallback feels broken rather
     than different. Set before measuring so ScrollTrigger sees the new height. */
  document.documentElement.classList.add('is-stills');
  stills.hidden = false;

  const [first, last] = stills.querySelectorAll('img');
  /* They were lazy while hidden; they are the hero now. */
  [first, last].forEach((img) => { if (img) img.loading = 'eager'; });

  gsap.timeline({
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom bottom', scrub: true },
  })
    .fromTo(first, { scale: 1.04 }, { scale: 1.16, ease: 'none', duration: 1 }, 0)
    .fromTo(last, { opacity: 0, scale: 1.16 }, { opacity: 1, ease: 'none', duration: 0.45 }, 0.4);

  initOverlay(hero);
  ScrollTrigger.refresh();
}
