# Cosmic Odyssey

A cinematic, scroll-driven space exploration experience built with React, TypeScript, Three.js, GSAP ScrollTrigger, and Lenis.

## Run

```sh
npm install
npm run dev
```

## Production

```sh
npm run build
npm run preview
```

## Experience

- Rotating Earth with independent clouds and atmospheric shaders.
- Scroll-linked planetary approach, layered Whirlpool Galaxy, and parallax star field.
- Interactive Earth, Mars, Jupiter, and Saturn with real planetary facts.
- NASA astronaut sequence and cinematic final chapter.
- Optional synthesized ambient sound. Press `M` to toggle.
- Guided journey autoplay, chapter navigation, and mobile menu.
- Responsive layouts, reduced-motion support, keyboard-accessible dialogs, and WebGL fallback.
- Local image assets; only Google Fonts requires an external connection.

## Verify

```sh
npm run build
npx playwright test
```

The Playwright configuration uses the installed Google Chrome executable. Change `executablePath` in `playwright.config.ts` for another platform.

## Structure

- `src/App.tsx`: chapters, navigation, dialogs, and GSAP/Lenis choreography.
- `src/components/SpaceCanvas.tsx`: Three.js renderer, scene transitions, and planet interaction.
- `src/scene/`: procedural primitives and GLSL shaders.
- `src/data/planets.ts`: destination content and NASA planetary facts.
- `src/hooks/useAmbientSound.ts`: opt-in Web Audio soundscape.
- `src/styles.css`: responsive visual system and cinematic effects.

## Image credits

Planet and ring textures are from [Solar System Scope](https://www.solarsystemscope.com/textures/), CC BY 4.0. Colors and rendering are adapted for this experience.

Astronaut: NASA photograph S84-27562, Bruce McCandless II's first untethered spacewalk, 7 February 1984.

Whirlpool Galaxy: NASA/ESA Hubble, HEIC0506A. Andromeda: NASA/ESA Hubble, HEIC1502A. Additional astronomical imagery: NASA/ESA Hubble.

The solar-system scene is illustrative and not to scale. Planetary temperatures are mean values; Earth is a global average.

## Performance

Textures and geometry are local and reused. Star fields use a single buffer geometry. Pixel ratio is capped at 1.75. Animation stops while the tab is hidden. Three.js resources are disposed on unmount. Reduced-motion mode disables scripted motion and long scroll choreography.
