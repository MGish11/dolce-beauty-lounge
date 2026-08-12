# Dolce Beauty Lounge

Marketing site for a luxury beauty and skincare studio in Virginia Beach, Virginia.

No build step. A single `index.html`, one stylesheet, and a folder of ES modules,
served from any static host. Deploy by uploading the directory.

---

## Before you launch — content checklist

Everything below is a placeholder. Each item is marked `TODO` in the source.

### Business details — `index.html`

Filled in from the studio's live site (dolcebeautylounge.com), its Square
booking page, and cross-checked against Fresha and Yelp listings.

- [x] **Street address** — 277 North Lynnhaven Road, Suite 103, Virginia Beach, VA 23452
- [x] **Phone** — (757) 773-9711
- [x] **Booking URL** — the studio's Square page (all three places)
- [x] **Google Maps link** — built from the real address
- [x] **Social profiles** — Instagram, Facebook, Yelp
- [x] **Production domain** — `dolcebeautylounge.com` confirmed as the live domain

Still open:

- [ ] ⚠ **Opening hours — sources disagree, confirm with the owner.**
      The site says Mon–Fri 10–7, Sat 10–5, Sun closed. The Square booking page
      says Wed 1–7, Thu 10–6, Fri 10–6, Sat 10–3, Sun/Mon/Tue closed. The site's
      version is what is published; Square may only be showing one
      practitioner's bookable slots. Mirror any change into
      `openingHoursSpecification` in the JSON-LD.
- [ ] **Second phone number** — 757-739-2570 appears in the old site's footer and
      in older Yelp/Fresha listings. Confirm whether it is still in service. Only
      757-773-9711 is published on the new site.
- [ ] **Email** — no public address exists anywhere. Add one, or leave it off.
- [ ] **Suite number** — every source says Suite 103 except Yelp, which says 106.
      Worth a glance at the door.
- [ ] **Geo coordinates** — the JSON-LD lat/long is approximate for N Lynnhaven Rd.
      Replace with the exact pin from Google Maps.
- [ ] **Instagram account** — `@dolcebeautylounge` (the studio account) is linked.
      The old site links `@dolcebrows`, the owner's personal/legacy account from
      before the rebrand. Confirm which they want.

> Items marked done appear in **two** places — the visible page and the JSON-LD —
> and both have been updated together. Keep them in sync; mismatched schema is
> worse than absent schema.

### ⚠ Services copy — currently fictional

**The six services on the page were invented before the real business details
were known, and most of them do not match what this studio actually offers.**

The live site lists: threading (brows, upper/lower lip, chin, full face,
sideburns), eyebrow tinting, acne facials (Face Reality bi-weekly, "acne
bootcamp"), and black seed oil scalp treatments. It has **no** mention of hair
styling, hair colour, makeup artistry, bridal, lashes or waxing — four of the
six cards currently on the page.

Note the business rebranded from "Dolce Brows" to "Dolce Beauty Lounge", so the
service list may well have expanded beyond what the old site advertises. Get the
current list from the owner rather than copying the old site.

- [ ] Rewrite the six `.service` cards in the Services section.
- [ ] Mirror the same list into `hasOfferCatalog` in the JSON-LD.
- [ ] Re-check the Statement sentence and the Ritual steps, which are written
      around a broad full-service salon rather than a threading/skincare studio.

### Instagram — link only, by choice

The Instagram section is a **link out**, not an embedded feed. Post embeds were
built and then deliberately removed: no third-party script, no iframe, and no
Instagram cookie is set on this page. It is linked in two places — the section
before the footer, and the footer itself.

Note the two accounts: `@dolcebrows` is the active one (owner Samantha Cruz,
~2,640 followers) and is what the site links. `@dolcebeautylounge` exists but has
not posted since 2021; it is kept in the JSON-LD `sameAs` only.

If a live feed is ever wanted, be aware it cannot be done with a plain API call:
Instagram's Basic Display API was **deprecated by Meta in December 2024**, and
Graph API needs a Meta app plus a token refreshed every 60 days — which on a
static site with no backend would sit exposed in client-side JS. The realistic
options are a hosted widget (Behold, LightWidget, SnapWidget) that handles the
token refresh, or hand-picked per-post embeds via Instagram's keyless
`/embed/` endpoint.

### Photography — `assets/img/space-0*.jpg`

- [ ] Replace all six gallery images with real interior photography.

They are currently frames pulled from the hero footage purely to hold the layout.
Keep the aspect ratios — **4:5 portrait (1000×1250)** and **3:2 landscape
(1500×1000)** — or update the `width`/`height` attributes to match, or the
horizontal gallery will reflow.

- [ ] Replace `assets/img/og-image.jpg` (1200×630) with a real hero shot.
- [ ] `assets/img/services-plant.webp` (the turning plant in Services) is a stock
      render with its background keyed out. Swap for a real studio object if you
      have one. It **must have a genuine alpha channel** — it sits on the bone
      surface, so any leftover white or grey matte will show as a hard rectangle.
- [ ] Update the `alt` text on each image to describe the real photograph. The current
      text describes the placeholder frames and will be wrong once swapped.

### Optional

- [x] **Map** — a live Google Maps embed is connected, pointed at the real address.
      It uses the keyless embed endpoint, so **no Google Maps API key is needed**.
      `modules/map.js` injects the iframe only once the visitor is within ~600px
      of it, so the map's scripts, tiles and third-party cookies cost nothing on
      first load; a styled facade ships in the HTML and cross-fades out once
      Google has painted. There is a `<noscript>` copy for JS-disabled visitors.
      - Two things to be aware of: the embed sets **third-party Google cookies**
        when it loads, which matters if you ever need a cookie-consent banner —
        switching from "load on approach" to "load on click" is a one-line change
        in `map.js`. And the iframe carries only a **mild** CSS filter, not a full
        dark-mode invert, because inverting the tiles also inverts Google's logo
        and attribution, which their terms don't permit.
- [ ] Fonts are **Cormorant Garamond** (free stand-in for Canela / Freight Display)
      and **Inter**. If you license Canela, swap `--font-display` in `styles.css`
      and self-host it.

---

## Structure

```
index.html          all markup, meta, and JSON-LD
styles.css          design system + layout (15 sections, commented)
main.js             entry — decides whether motion runs at all
modules/
  env.js            capability detection; every motion decision starts here
  motion.js         the scroll layer (GSAP + Lenis orchestration)
  smooth-scroll.js  Lenis, wired to GSAP's ticker
  hero.js           the scroll-scrubbed video, its gate, and the fallback
  sections.js       statement stagger, ritual wipe, masthead tone flip
  split-text.js     word splitter (avoids the paid SplitText plugin)
  gallery.js        horizontal pinned gallery
  lazy.js           "run this when the element is nearly on screen"
  map.js            lazy Google Maps embed (no GSAP dependency)
  pointer-fx.js     card tilt + magnetic button
  atmosphere.js     the WebGL layer (Three.js) — suspended dust only
assets/
  source/hero.mp4   original 4K HEVC master — not deployed
  video/            all-intra web derivatives
  img/              poster, stills, gallery placeholders
```

### Dependencies

Loaded from `esm.sh` via an importmap in `index.html`. No package manager, no
bundler. Pin changes are one-line edits.

| Library | Version | Raw size |
|---|---|---|
| GSAP + ScrollTrigger | 3.12.5 | ~111 KB |
| Lenis | 1.1.20 | ~14 KB |
| Three.js | 0.169.0 | ~664 KB |

---

## How the hero works

`assets/video/hero-1440.mp4` is **all-intra** — every frame is a keyframe, so
every frame is a seek target. This is the entire reason scrubbing feels smooth,
and it is why the file is larger than a normal encode of the same footage.

Scroll never writes `currentTime` directly. It writes a *target*; a lerp inside
GSAP's ticker walks toward it, and only assigns when the delta exceeds half a
frame. That indirection is what makes it read as film rather than a slideshow.

### Re-encoding the hero

If you replace the footage, reproduce the derivatives with the settings in
`assets/source/README-transcode.txt`. Two non-obvious points:

- All-intra inflates size badly. The 1440p file needed **CRF 26** to fit a ~14 MB
  budget; CRF 20 produced 21.75 MB.
- VP9 inherits 10-bit from a 10-bit source, producing Profile 2, which most GPUs
  cannot hardware-decode — fatal for scrubbing. Force `-profile:v 0 -pix_fmt yuv420p`.

---

## Performance

Lighthouse 12.8.2, mobile, simulated throttling, against the built site:

| Metric | Value | Score |
|---|---|---|
| **Performance** | | **88** |
| First Contentful Paint | 1.3 s | 98 |
| Largest Contentful Paint | 2.0 s | 97 |
| Total Blocking Time | 110 ms | 97 |
| Cumulative Layout Shift | 0.001 | 100 |
| Speed Index | 36.8 s | 0 ⚠ |

**The Speed Index figure is invalid** — an artifact of the headless browser used
to run the audit, not the site. Proof: an identical run with reduced motion
forced (no video, no WebGL, no GSAP, 497 KB total, TBT 0 ms) still reported a
35.4 s Speed Index, which is impossible for a page like that. Inspecting the
filmstrip shows 7 of its 8 frames are byte-identical blanks — the headless
renderer never composited intermediate frames, so Lighthouse measured a blank
screen and scored the metric 0.

The 88 therefore *understates* real performance: it is the average of four
metrics scoring 97–100 and one broken one scoring 0. **Re-run on a machine with
a real display before treating any of this as final.**

### Deliberately not done

- **`modern-image-formats` (~300 ms)** — the gallery JPEGs are placeholders due to
  be replaced with real photography. Convert to WebP/AVIF at that point, not before.
- **`unminified-css` (~150 ms)** — `styles.css` is hand-written and heavily
  commented by design, and the project has no build step. Minify at deploy time
  if you want the 150 ms; do not commit a minified stylesheet.

### How the weight is kept down

The heavy libraries are **code-split behind capability checks**, because ES module
imports are fetched whether or not the importing code runs:

| Visitor | Downloads |
|---|---|
| Reduced motion | `env.js` only — no GSAP, no Lenis, no Three, **no video** |
| ≤ 4 CPU cores | scroll layer, but **no Three.js** (664 KB saved) |
| iOS / no `requestVideoFrameCallback` | scroll layer, **no video** — still-image crossfade instead |
| Desktop, full | everything; 1440p video |
| Mobile, full | everything; 720p video |

`preload` on the `<video>` is `"none"` in the markup and promoted to `"auto"` by
`hero.js` only once it commits to scrubbing. **Do not change it back to `"auto"`
in the HTML** — that made every reduced-motion and iOS visitor download ~13 MB
for a video that only ever shows its poster frame.

Only two font weights (300, 400) are requested because only two are used. Check
`styles.css` before adding one back.

---

## Accessibility

- Full `prefers-reduced-motion: reduce` path: no Lenis, no ScrollTrigger, no
  WebGL, no video. The hero collapses to one viewport and the gallery stays a
  native horizontal scroller. Every animated element renders at full opacity —
  nothing is stranded waiting for a tween.
- The hero video is `aria-hidden`; all hero copy exists as real text.
- The split statement keeps its original sentence as `aria-label`, with the
  generated word fragments hidden from the accessibility tree.
- Focus rings adapt per section tone (gold on espresso, cognac on bone).
- All 15 text/surface pairs pass WCAG AA; the tightest is 4.55:1.

### Testing the alternate paths

`prefers-reduced-motion` cannot be toggled from the page, so test it via
DevTools → Rendering → *Emulate CSS prefers-reduced-motion*. For the iOS
fallback, DevTools → Network conditions → set an iPhone user agent, or delete
`HTMLVideoElement.prototype.requestVideoFrameCallback` before `main.js` runs.

---

## Known gotchas

Three things that cost real debugging time and will silently break if reverted:

1. **`overflow-x: clip` on `<html>`, never `hidden`.** `hidden` makes the element a
   scroll container, which kills every `position: sticky` descendant. No error —
   `getComputedStyle` still reports `sticky`, elements just stop pinning.
2. **The gallery pin carries `refreshPriority: 1`.** It injects ~2700 px of spacer.
   Any ScrollTrigger created before it but positioned after it measures against a
   spacer-less document and lands ~2700 px early, and `ScrollTrigger.refresh()`
   does *not* fix it.
3. **The loading gate polls on `setInterval`, not `requestAnimationFrame`.** rAF is
   throttled to a standstill in background tabs, so an rAF-driven gate would miss
   the video becoming ready, hit its timeout, and demote a capable browser to the
   still-image fallback purely for having been opened in a background tab.
