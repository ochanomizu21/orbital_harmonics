# Orbital Harmonics — Implementation Plan

> **Status:** Greenfield — no source code exists. Only `specs/`, `docs/`, and `PROMPT_*.md` are present.
> **Convention:** `src/lib/` is the project's standard library for shared utilities and components. Prefer consolidated, idiomatic implementations there over ad-hoc copies.

---

## Implementation Priority (Sorted by Dependency Chain)

Each section depends on the ones above it. Items within a section can be done in parallel.

---

### 1. Project Scaffolding & Configuration
- [ ] `package.json` — deps: `tone` (v14+), `vite`, `typescript`, `vitest`
- [ ] `tsconfig.json` — strict mode, ES2020 target, module resolution for Vite
- [ ] `vite.config.ts` — plain TS plugin (no React), dev server config
- [ ] `.gitignore` — `node_modules/`, `dist/`, `.DS_Store`
- [ ] `index.html` — entry point with `<canvas>`, UI container divs, `<script>` referencing `src/main.ts`
- [ ] `public/favicon.svg` — simple orbital/sun icon
- [ ] `src/style.css` — global dark theme (`#0a0a14` bg), panel layouts, CSS variables per spec §05.10
- [ ] `src/main.ts` — bootstrap stub (import style, grab canvas, init app)
- [ ] `AGENTS.md` — brief project notes (how to run dev server, test, build)

### 2. Shared Library (`src/lib/`)
Consolidated, reusable utilities — the project's standard library.

- [ ] `src/lib/math.ts` — `Vector2` operations (add, sub, scale, magnitude, normalize, dot, distance), `lerp`, `clamp`, `mapRange`
- [ ] `src/lib/colors.ts` — HSL utilities, planet color palette (`['#4fc3f7', '#81c784', ...]` per §04.6.3), `rgba()` helpers, palette cycling index
- [ ] `src/lib/id.ts` — unique ID generator for bodies (simple counter or `crypto.randomUUID`)

### 3. State Management (`src/state/`)
- [ ] `src/state/types.ts` — `AppState`, `PlanetState`, `SettingsState`, `TriggerLineState` interfaces
- [ ] `src/state/store.ts` — Central reactive state store with subscribe/notify pattern (custom lightweight observable, no framework)

### 4. Simulation / Physics Engine (`src/simulation/`)
- [ ] `src/simulation/types.ts` — `Vector2` (or re-export from `src/lib/math.ts`), `Body`, `SimulationState` interfaces per §02.2
- [ ] `src/simulation/constants.ts` — defaults: `G=1.0`, `SOFTENING=5.0`, `DT=1/60`, `SUN_MASS=10000`, `VELOCITY_MULTIPLIER=0.05`, `MIN_MASS=1`, `MAX_MASS=50`, `MIN_RADIUS=4`, `MAX_RADIUS=20`, escape distance (2× canvas diagonal), escape grace period (5s)
- [ ] `src/simulation/forces.ts` — gravitational force computation (`F = G*m1*m2 / (r² + ε²)`), Newton's 3rd law optimization (compute pair once), N-body toggle (sun-only vs. all-pairs)
- [ ] `src/simulation/integrator.ts` — Velocity Verlet step: position update → recompute forces → velocity update
- [ ] `src/simulation/simulation.ts` — Main `Simulation` class: `step(dt)`, body management (add/remove), escaped planet detection with grace period, anchor (sun) management, `prevPosition` tracking per body

### 5. Canvas Renderer (`src/renderer/`)
- [ ] `src/renderer/types.ts` — `RenderConfig`, `TrailPoint`, `VisualEvent`, `Particle` interfaces
- [ ] `src/renderer/background.ts` — Starfield (~200 random points, 0.5–2px, varying brightness) + nebula overlay (2-3 radial gradients, 5–10% opacity), both pre-rendered to offscreen canvases, regenerated on resize
- [ ] `src/renderer/trails.ts` — Fading trail overlay (`rgba(0,0,0, alpha)` fill each frame), configurable fade rate (default 0.03, range 0.01–0.1), trail dots drawn with `'lighter'` composite at 60% opacity
- [ ] `src/renderer/bodies.ts` — Sun rendering (radial gradient white→yellow→orange→transparent, 25px radius, ±2px pulsing at ~4s period, additive glow) + planet rendering (mass→radius via `mass^(1/3)*2`, clamped 4–20px, radial gradient with additive glow)
- [ ] `src/renderer/triggers-vis.ts` — Trigger line rendering (1px thin lines through sun, `rgba(100,150,255,0.15)` idle, `0.4` active/rotating), rotation handles (circles at canvas edge intersection), selection glow
- [ ] `src/renderer/particles.ts` — Particle system with object pooling (~200 pre-allocated), burst of 8–12 particles on trigger events, velocity damping (0.95/frame), fade over 300–500ms, degrade: reduce at 20ms, skip at 30ms frame time
- [ ] `src/renderer/effects.ts` — Trigger ripple (expanding circle, planet radius→40px, 400ms, planet color fading), sun flash (opacity pulse, 200ms), selection ring (pulsing white ring, 1s loop, opacity 100%→30%→100%)
- [ ] `src/renderer/renderer.ts` — Main `Renderer` class: canvas setup (full viewport, high-DPI via `devicePixelRatio`), render loop, rendering order per §04.10: (1) background, (2) trail fade overlay, (3) trigger lines, (4) trail dots, (5) ripples/particles, (6) sun, (7) planets, (8) spawn gesture, (9) selection ring. Performance guards at 20ms/30ms/40ms thresholds.

### 6. Audio Engine (`src/audio/`)
- [ ] `src/audio/types.ts` — `SynthType`, `ScaleMode`, `ScaleConfig`, `PlanetVoice`, `TriggerEvent` interfaces
- [ ] `src/audio/scales.ts` — All 7 mode interval definitions, `generateNoteArray(root, mode, octaveMin, octaveMax)`, `noteToMidi()` helper, root note mapping (C through B including sharps/flats)
- [ ] `src/audio/quantizer.ts` — Distance → pitch mapping: normalize distance to [0,1] within range (minDistance=50px, maxDistance=400px), reverse (close=high), map to scale index, return MIDI note → frequency. `distanceToNote()` per §06.3.5
- [ ] `src/audio/triggers.ts` — Axis-crossing detection (signed distance sign change per frame per trigger line), configurable trigger lines (default X+Y, up to 6), linear interpolation for crossing point, 100ms debounce per planet per line, emit `TriggerEvent`
- [ ] `src/audio/effects.ts` — Signal chain: `Tone.Reverb` (2.5s decay, 30% wet) → `Tone.FeedbackDelay` (0.3 feedback, 20% wet) → `Tone.Limiter` (-1dB) → `Tone.Gain` (master)
- [ ] `src/audio/planet-voice.ts` — Per-planet synth voice: 8 synth types (sine, triangle, saw, square, fm, marimba, bell, pluck), voice lifecycle (create/update/dispose with reconnect), velocity→timbre modulation per §03.7 table, mute (gain=0, keep synth), solo logic
- [ ] `src/audio/engine.ts` — `AudioEngine` class: `Tone.start()` management, voice map, master output, connect trigger events → voice scheduling, per-planet panning from angle (`pan = cos(angle)` → [-1,1]), velocity→volume (`lerp(0.2, 1.0, normalizedVelocity)`), graceful degradation (drop lowest-velocity triggers when CPU behind)

### 7. UI — DOM-Based Controls (`src/ui/`)
- [ ] `src/ui/selection.ts` — Planet selection state (click planet to select, click background to deselect), selected planet tracking, selected trigger line tracking
- [ ] `src/ui/sidebar.ts` — Planet list sidebar (240px, `rgba(10,10,20,0.85)` with backdrop blur, rounded right edge, collapsible via tab): per-planet row (color dot, name, synth label, mute, solo, delete), empty state message, selected planet highlight (left border accent)
- [ ] `src/ui/controls.ts` — Control panel (260px, right side, same visual style, collapsible): Simulation section (gravity 0.1–5.0, N-body toggle, trail length, sim speed 0.25×–2×), Music section (root dropdown, mode dropdown, octave range dual slider), Synth Default dropdown (applied to new planets), Effects section (reverb mix, delay mix, master volume), Trigger Lines section (add button, reset button, up to 6 total)
- [ ] `src/ui/planet-editor.ts` — Per-planet settings panel (expands below sidebar when planet selected): synth engine dropdown, volume slider (0–100%), pan slider (L–R), mass slider (1–50), color picker. Changes apply immediately.
- [ ] `src/ui/spawn.ts` — Click+drag spawn: ghost planet preview at click, velocity vector (rubber band with arrowhead, color white→green gradient by length), slingshot inversion (`(startPos - endPos) * velocityMultiplier`), creates body + spawns voice + adds to sidebar
- [ ] `src/ui/trigger-lines.ts` — Trigger line interaction: click within 10px to select, drag rotation handles to rotate line around sun, click away to deselect, add/reset buttons connected to state
- [ ] `src/ui/keyboard.ts` — Keyboard shortcuts: Space (pause/resume), Delete/Backspace (delete selected), M (mute/unmute), S (solo/unsolo), 1–8 (set synth), G (toggle N-body), R (reset all planets), H (hide/show panels), ? (show shortcuts overlay)

### 8. Overlay & Status (`src/ui/`)
- [ ] `src/ui/overlay.ts` — "Click to Begin" start screen: full-screen overlay, app title, "Click anywhere to begin", calls `Tone.start()`, fades out over 500ms, simulation begins
- [ ] `src/ui/status-bar.ts` — Bottom bar (24px, semi-transparent): left (planet count, FPS), center (current root + mode e.g. "C Lydian"), right (triggers/min running average). Auto-hides after 5s inactivity, reappears on mouse move
- [ ] `src/ui/shortcuts-overlay.ts` — `?` key shows keyboard shortcuts reference overlay, dismiss on any key/click

### 9. Main Loop Integration (`src/main.ts`)
- [ ] Wire single RAF loop: simulation step → trigger detection → audio scheduling → render
- [ ] Window resize handling (canvas resize, background regeneration)
- [ ] Cursor management per §05.12: crosshair (default), pointer (over planet), none (spawning), grab/grabbing (trigger lines), default (over UI panels)
- [ ] Responsive: auto-collapse panels at <1024px width; control panel collapses first
- [ ] Panel collapse/expand animations (200ms ease-out)

### 10. Polish & Edge Cases
- [ ] Escaped planet dimming visual indicator before removal (5s grace period)
- [ ] Spawn gesture visualization (ghost planet, velocity vector with color gradient)
- [ ] Selection ring animation (pulsing white ring, 1s cycle)
- [ ] Audio graceful degradation (drop lowest-velocity triggers when CPU behind)
- [ ] High-DPI canvas rendering with `devicePixelRatio`

### 11. Tests
- [ ] `src/lib/__tests__/math.test.ts` — Vector2 ops, lerp, clamp, mapRange
- [ ] `src/simulation/__tests__/forces.test.ts` — gravitational force, softening, Newton's 3rd law
- [ ] `src/simulation/__tests__/integrator.test.ts` — Velocity Verlet step, energy conservation
- [ ] `src/simulation/__tests__/simulation.test.ts` — body add/remove, escape detection, sun immobility
- [ ] `src/audio/__tests__/scales.test.ts` — note array generation, all 7 modes, root transposition
- [ ] `src/audio/__tests__/quantizer.test.ts` — distance→pitch mapping, edge cases (min/max distance, reversal)
- [ ] `src/audio/__tests__/triggers.test.ts` — axis-crossing detection, debounce, configurable lines

---

## Spec Defaults Reference

| Setting | Default | Source |
|---|---|---|
| Gravity (G) | 1.0 | §02.9 |
| Softening (ε) | 5.0 | §02.3 |
| Sun Mass | 10000 | §02.5 |
| Velocity Multiplier | 0.05 | §02.6 |
| Planet Mass Range | 1–50 | §02.6 |
| Planet Radius Formula | `clamp(mass^(1/3) * 2, 4, 20)` | §04.6.1 |
| Trail Fade Rate | 0.03 (range 0.01–0.1) | §04.7 |
| Root / Mode | C Lydian | §06.6 |
| Octave Range | **3–5** | §06.6 |
| Default Synth | FM | §06.6 |
| Reverb Wet | 30% | §06.6 |
| Delay Wet | 20% | §06.6 |
| Min/Max Distance | 50px / 400px | §06.2 |
| Debounce | 100ms per planet per line | §03.5.3 |
| Max Trigger Lines | 6 | §03.5.2 |
| Background | `#0a0a14` | §05.10 |

## Design Decisions (from specs)
- **No UI framework** — vanilla TS with DOM helpers
- **No collision detection** — planets pass through each other
- **Sun is immovable** — fixed at canvas center
- **Velocity Verlet integration** — symplectic, energy-conserving
- **Trail fade via alpha overlay** — O(1) per frame, no history array
- **Object pooling for particles** — no GC pressure
- **Single RAF callback** — simulation + render in one loop
- **Tone.js v14+** for all audio synthesis
- **Default scale: C Lydian** — dreamy, avoids minor second clashing

## Key Specs Reference
| Spec | Topic |
|---|---|
| `01-architecture.md` | Tech stack, project structure, performance targets |
| `02-physics-engine.md` | N-body gravity, Velocity Verlet, body types, tunable params |
| `03-audio-engine.md` | Tone.js, synth engines, trigger system, voice lifecycle, effects chain |
| `04-rendering-visuals.md` | Canvas setup, background, trails, glow, particles, rendering order |
| `05-ui-interaction.md` | Layout, sidebar, controls, spawn gesture, keyboard shortcuts, visual design |
| `06-musical-system.md` | Scale quantization, pitch mapping, rhythm from orbits, dynamics, defaults |
