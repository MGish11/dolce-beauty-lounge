/* ============================================================================
   sections.js — statement stagger, ritual wipe + rail, masthead tone flip
   ========================================================================= */

import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { EASE } from './env.js';
import { splitWords } from './split-text.js';

/* --------------------------------------------------------------------------
   Statement — words rise into their mask on a stagger
   -------------------------------------------------------------------------- */
export function initStatement() {
  const line = document.querySelector('[data-split]');
  if (!line) return;

  const words = splitWords(line);
  if (!words.length) return;

  gsap.from(words, {
    yPercent: 115,
    duration: 1.1,
    ease: EASE,
    stagger: 0.03,
    scrollTrigger: { trigger: line, start: 'top 80%' },
  });
}

/* --------------------------------------------------------------------------
   Ritual — masked-line wipe per step, plus the progress rail
   -------------------------------------------------------------------------- */
export function initRitual() {
  const steps = gsap.utils.toArray('[data-step]');

  steps.forEach((step) => {
    const num = step.querySelector('.step__num');
    const masked = step.querySelectorAll('.step__name, .step__desc');

    /* Wrap each masked block's contents so the parent can clip while the
       child slides — the wipe is the child moving inside the parent. */
    const inners = [...masked].map((el) => {
      const inner = document.createElement('span');
      inner.style.display = 'block';
      while (el.firstChild) inner.appendChild(el.firstChild);
      el.appendChild(inner);
      return inner;
    });

    gsap.timeline({ scrollTrigger: { trigger: step, start: 'top 78%' } })
      .from(num, { opacity: 0, duration: 0.8, ease: EASE }, 0)
      .from(inners, { yPercent: 100, duration: 1.1, ease: EASE, stagger: 0.08 }, 0);
  });

  const fill = document.querySelector('[data-rail-fill]');
  const list = document.querySelector('.ritual__steps');
  if (fill && list) {
    gsap.fromTo(fill,
      { scaleY: 0 },
      {
        scaleY: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: list,
          start: 'top 65%',
          end: 'bottom 75%',
          scrub: true,
        },
      });
  }
}

/* --------------------------------------------------------------------------
   The plant — a slow turntable across the Services section

   Capped at ±20°. A photograph has no back, so rotating it through a real
   360° would flatten it to an invisible sliver at 90° and then show it
   mirrored; keeping well inside that range reads as the plant turning to
   face you and never breaks the illusion.
   -------------------------------------------------------------------------- */
const PLANT_MAX_TURN = 20;   // degrees either side of centre

export function initPlant() {
  const plant = document.querySelector('[data-plant]');
  const services = document.querySelector('.services');
  if (!plant || !services) return;

  gsap.fromTo(plant,
    { rotationY: -PLANT_MAX_TURN, y: 14 },
    {
      rotationY: PLANT_MAX_TURN,
      y: -14,
      ease: 'none',
      scrollTrigger: {
        trigger: services,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1,
      },
    });
}

/* --------------------------------------------------------------------------
   Masthead — invert its ink over light sections
   This replaces the provisional scrim from step 3: .masthead--inverted drops
   the scrim and switches to espresso ink, so the bar stays legible on bone
   without dirtying the top of those sections.
   -------------------------------------------------------------------------- */
export function initMasthead() {
  const masthead = document.querySelector('.masthead');
  if (!masthead) return;

  /* Measured against the masthead's own vertical centre, not the viewport
     top, so the flip happens exactly as the bar crosses the boundary. */
  const line = () => masthead.offsetHeight / 2;

  gsap.utils.toArray('.tone--light').forEach((section) => {
    ScrollTrigger.create({
      trigger: section,
      start: () => `top top+=${line()}`,
      end: () => `bottom top+=${line()}`,
      invalidateOnRefresh: true,
      onToggle: (self) =>
        masthead.classList.toggle('masthead--inverted', self.isActive),
    });
  });
}

/* --------------------------------------------------------------------------
   Small shared reveal for section intros
   -------------------------------------------------------------------------- */
export function initReveals() {
  const targets = gsap.utils.toArray(
    '.services__aside, .space__intro, .ritual__intro, .visit__intro, .visit__block, .map'
  );

  targets.forEach((el) => {
    gsap.from(el, {
      y: 28,
      opacity: 0,
      duration: 1.1,
      ease: EASE,
      scrollTrigger: { trigger: el, start: 'top 85%' },
    });
  });

  gsap.utils.toArray('.service').forEach((card) => {
    gsap.from(card, {
      y: 32,
      opacity: 0,
      duration: 1.1,
      ease: EASE,
      scrollTrigger: { trigger: card, start: 'top 88%' },
    });
  });
}
