# Cosmic Odyssey

React + TypeScript + Vite cinematic website. Keep changes minimal and preserve the scroll-driven scene choreography.

## Commands

- `npm run dev`: development server.
- `npm run build`: strict TypeScript and production build.
- `npx playwright test`: browser tests using installed Chrome.

## Architecture

- `src/App.tsx`: chapter UI, dialogs, GSAP ScrollTrigger and Lenis.
- `src/components/SpaceCanvas.tsx`: imperative Three.js renderer. Do not add React state updates to its animation loop.
- `src/scene/`: shaders and procedural scene helpers.
- `src/data/planets.ts`: destination content and visual positions.
- `src/styles.css`: all layout and design tokens.

## Requirements

- Keep 3D illustrative views labeled as not to scale.
- Use local assets. Preserve NASA/ESA and Solar System Scope credits.
- Support mobile, keyboard navigation, reduced motion, and sound-off by default.
- Test desktop and mobile after visual changes. No git mutations without explicit permission.
- `.venv` is only for local image preparation; website runtime has no Python dependency.
