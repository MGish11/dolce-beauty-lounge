/* ============================================================================
   atmosphere.js — the WebGL layer

   Suspended dust, and nothing else. The refractive glass shard that used to
   live in the Services section was replaced by a photographic plant rendered
   in the DOM (see .plant in styles.css and initPlant in sections.js), which
   also retired the transmission material, the environment map and both point
   lights along with it.

   The whole layer refuses to start under prefers-reduced-motion or on a
   machine reporting four cores or fewer. There is no degraded WebGL mode —
   it either runs properly or it does not exist.
   ========================================================================= */

import * as THREE from 'three';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { prefersReducedMotion, isLowPower } from './env.js';

const PARTICLE_COUNT = 800;

const AMBER = new THREE.Color('#C9A227');
const BONE = new THREE.Color('#E3DAD1');

export function initAtmosphere() {
  if (prefersReducedMotion() || isLowPower()) return null;

  const canvas = document.createElement('canvas');
  canvas.className = 'fx-canvas';
  canvas.setAttribute('aria-hidden', 'true');

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
  } catch (e) {
    return null;   // no WebGL — the page is complete without it
  }

  document.body.appendChild(canvas);

  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 5;

  const dust = buildDust();
  scene.add(dust.points);

  /* ------------------------------------------------------------------
     Scroll bindings
     ------------------------------------------------------------------ */
  const state = { dust: 0.25 };
  const hero = document.querySelector('[data-hero]');
  const statement = document.querySelector('.statement');

  if (hero) {
    /* Peaks through the corridor push, eases back as the desk resolves. */
    gsap.timeline({
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom bottom', scrub: true },
    })
      .to(state, { dust: 1, duration: 0.55, ease: 'none' }, 0)
      .to(state, { dust: 0.6, duration: 0.45, ease: 'none' }, 0.55);
  }

  if (statement) {
    /* Falls off after the hero rather than cutting. Lands on exactly 0, not a
       token 0.05 — anything above the idle threshold below would keep the
       whole scene rendering for the entire rest of the document to show dust
       nobody can see. */
    gsap.to(state, {
      dust: 0,
      ease: 'none',
      scrollTrigger: { trigger: statement, start: 'top center', end: 'bottom top', scrub: true },
    });
  }

  /* ------------------------------------------------------------------
     Layout
     ------------------------------------------------------------------ */
  function layout() {
    /* Measure the canvas, not the window: innerWidth includes the classic
       scrollbar, so sizing the drawing buffer from it stretches the render
       by the scrollbar's width. */
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h, false);
    dust.material.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2);
  }
  layout();
  window.addEventListener('resize', layout);

  /* ------------------------------------------------------------------
     Render loop — shares GSAP's ticker so there is exactly one clock
     ------------------------------------------------------------------ */
  let onScreen = true;
  let visible = !document.hidden;

  /* Spec-literal: pause when the canvas goes fully offscreen. In practice a
     fixed full-viewport canvas never does, so the meaningful savings come
     from the tab-visibility check and the idle early-out below. */
  const io = new IntersectionObserver(
    ([entry]) => { onScreen = entry.isIntersecting; },
    { threshold: 0 }
  );
  io.observe(canvas);

  document.addEventListener('visibilitychange', () => { visible = !document.hidden; });

  const clock = new THREE.Clock();

  function render() {
    if (!onScreen || !visible) return;

    /* Nothing worth drawing once the dust has faded out. */
    if (state.dust < 0.02) {
      if (canvas.style.visibility !== 'hidden') canvas.style.visibility = 'hidden';
      return;
    }
    if (canvas.style.visibility === 'hidden') canvas.style.visibility = '';

    dust.material.uniforms.uTime.value = clock.getElapsedTime();
    dust.material.uniforms.uOpacity.value = state.dust;

    renderer.render(scene, camera);
  }

  gsap.ticker.add(render);

  return {
    destroy() {
      gsap.ticker.remove(render);
      io.disconnect();
      window.removeEventListener('resize', layout);
      dust.geometry.dispose();
      dust.material.dispose();
      renderer.dispose();
      canvas.remove();
    },
  };
}

/* ==========================================================================
   Dust
   Points with per-mote size and tint. The drift runs in the vertex shader:
   800 motes is small enough for the CPU, but keeping it on the GPU means the
   geometry is uploaded once and never touched again.
   ========================================================================== */
function buildDust() {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const sizes = new Float32Array(PARTICLE_COUNT);
  const phases = new Float32Array(PARTICLE_COUNT);

  const tint = new THREE.Color();

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 9;
    positions[i * 3 + 1] = 0;                          // driven by phase in the shader
    positions[i * 3 + 2] = (Math.random() - 0.5) * 3;

    tint.copy(AMBER).lerp(BONE, Math.random());
    colors[i * 3] = tint.r;
    colors[i * 3 + 1] = tint.g;
    colors[i * 3 + 2] = tint.b;

    sizes[i] = 1 + Math.random() * 2;                  // 1–3 CSS px
    phases[i] = Math.random();
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    },
    vertexShader: /* glsl */ `
      attribute vec3 aColor;
      attribute float aSize;
      attribute float aPhase;
      uniform float uTime;
      uniform float uPixelRatio;
      varying vec3 vColor;
      varying float vFade;

      void main() {
        vColor = aColor;

        /* Each mote rises on its own phase and wraps. Alpha falls to zero at
           both ends of the travel, so the wrap is never visible as a pop. */
        float t = fract(aPhase + uTime * 0.014);
        vFade = smoothstep(0.0, 0.16, t) * (1.0 - smoothstep(0.84, 1.0, t));

        vec3 p = position;
        p.y = mix(-2.6, 2.6, t);
        p.x += sin(uTime * 0.12 + aPhase * 6.2831) * 0.09;
        p.z += cos(uTime * 0.09 + aPhase * 6.2831) * 0.09;

        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = aSize * uPixelRatio;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uOpacity;
      varying vec3 vColor;
      varying float vFade;

      void main() {
        /* Soft round mote, not a square sprite. */
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d);
        gl_FragColor = vec4(vColor, a * vFade * uOpacity);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  return { points: new THREE.Points(geometry, material), geometry, material };
}
