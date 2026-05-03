# AGENTS.md

## How to Run

- **Dev server:** `npm run dev` (Vite, port 3000)
- **Tests:** `npm test` (Vitest, single run) or `npm run test:watch`
- **Build:** `npm run build` (outputs to `dist/`)
- **Type check:** `npx tsc --noEmit`

## Architecture

- **No UI framework** — vanilla TypeScript + DOM
- **Canvas 2D** for rendering, **Tone.js** for audio
- **Single RAF loop** drives simulation + rendering
- State management via custom observable store (`src/state/store.ts`)
- Audio context requires user gesture (overlay on startup)

## Key Specs

| Spec | File |
|---|---|
| Architecture | `specs/01-architecture.md` |
| Physics | `specs/02-physics-engine.md` |
| Audio | `specs/03-audio-engine.md` |
| Rendering | `specs/04-rendering-visuals.md` |
| UI | `specs/05-ui-interaction.md` |
| Music | `specs/06-musical-system.md` |
