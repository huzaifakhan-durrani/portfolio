# portfolio

Single-page portfolio for Huzaifa Khan — web design & software development.

No build step. Open `index.html`, or serve the folder:

```bash
python -m http.server 5891
```

## Stack

Vanilla HTML/CSS/JS. Three dependencies, all from cdnjs:

- **GSAP + ScrollTrigger** — scroll choreography, pinning, scrubbed timelines
- **Three.js** — the hero globe

Smooth scrolling is a small hand-rolled lerp loop rather than a library.

## Files

| | |
|---|---|
| `index.html` | markup + the `ink-edge` SVG filter |
| `styles.css` | all styling; chapter-scoped design tokens |
| `main.js` | every behaviour, in numbered sections |

## How it works

**Chapters.** The page never swaps a global theme. Each `.chapter` paints its own
background and redefines the design tokens (`--bg`, `--fg`, `--line`…) beneath it,
so `<body>` stays dark top to bottom. Sections inherit whichever chapter they sit in.

**Torn ink edge.** Chapters are bridged by a ragged boundary rather than a hard line.
A solid sheet grows upward (`scaleY` 0→1, bottom origin, scrubbed by scroll) inside
a clipped window, and the `#ink-edge` SVG filter chews its advancing top edge:
fractal noise → heavy displacement → blur → a **discrete alpha ramp** that snaps
everything fully on or off. That threshold is what produces a crisp blot with
detached islands instead of a soft gradient.

Structure matters here — the filter goes on the parent, the transform on the child.
A transform on an *ancestor* of a filtered element forces the filter to re-rasterise
in transformed space every frame and stalls compositing.

**Hero globe.** A Fibonacci sphere of ~115k points, masked against simplified
continent polygons rasterised to an offscreen canvas — no texture files. Drag to
spin it: horizontal drag feeds spin velocity so a flick coasts, vertical tilts and
holds, and on release it eases back to its idle drift. Framed by viewport height but
capped at 85% of width, so it never bursts out of a portrait screen.

**Method chapter.** A pinned section translating a horizontal rail of five panels,
with ghost numerals counter-parallaxing and a tracker filling in beneath. The pin
carries `refreshPriority` so it recalculates before anything measuring its height.

**Click ripples.** A fixed canvas behind the dark chapters. Clicking the backdrop
drops concentric rings on an ease-out curve. They fire on release and only when the
pointer moved under 6px, so dragging the globe doesn't leave a trail.

Other pieces: text scramble/decode, per-character blur-up reveals, a velocity-reactive
marquee, magnetic buttons, a drag carousel, arc text on an SVG path, and a mega-menu.

## Accessibility & performance

- `prefers-reduced-motion` disables the intro, the reveals, the ripples and the
  (expensive) SVG filter, and resolves everything to its final state
- Intro plays once per session; `?nointro=1` skips it
- Globe drops to ~46k points under 760px and uses `touch-action: pan-y` so it
  never traps page scrolling
- No horizontal overflow at 375px

## Content

The case studies, reviews and statistics are **placeholder copy** — replace them
with real work before publishing. They live in the data arrays at the top of
section 4 in `main.js`.
