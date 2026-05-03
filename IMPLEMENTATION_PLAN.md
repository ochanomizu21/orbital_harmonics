# Orbital Harmonics — Implementation Plan

> **Status:** Core implementation complete. All 9 test suites (117 tests) passing. TypeScript compiles cleanly. Build succeeds.
> **Convention:** `src/lib/` is the project's standard library for shared utilities and components. Prefer consolidated, idiomatic implementations there over ad-hoc copies.

---

## Implementation Priority (Sorted by Dependency Chain)

Each section depends on the ones above it. Items within a section can be done in parallel.

---

### 1. Project Scaffolding & Configuration ✅
- [x] `package.json` — deps: `tone` (v14+), `vite`, `typescript`, `vitest`
- [x] `tsconfig.json` — strict mode, ES2020 target, module resolution for Vite
- [x] `vite.config.ts` — plain TS plugin (no React), dev server config
- [x] `.gitignore` — `node_modules/`, `dist/`, `.DS_Store`
- [x] `index.html` — entry point with `<canvas>`, UI container divs, `<script>` referencing `src/main.ts`
- [x] `public/favicon.svg` — simple orbital/sun icon
- [x] `src/style.css` — global dark theme (`#0a0a14` bg), panel layouts, CSS variables per spec §05.10
- [x] `src/main.ts` — bootstrap wiring simulation, renderer, audio, and UI
- [x] `AGENTS.md` — brief project notes (how to run dev server, test, build)

### 2. Shared Library (`src/lib/`) ✅
- [x] `src/lib/math.ts` — `Vector2` operations (add, sub, scale, magnitude, normalize, dot, distance), `lerp`, `clamp`, `mapRange`
- [x] `src/lib/colors.ts` — HSL utilities, planet color palette, `rgba()` helpers, palette cycling index
- [x] `src/lib/id.ts` — unique ID generator for bodies (counter-based)

### 3. State Management (`src/state/`) ✅
- [x] `src/state/types.ts` — `AppState`, `PlanetState`, `SettingsState`, `TriggerLineState` interfaces
- [x] `src/state/store.ts` — Central reactive state store with subscribe/notify pattern

### 4. Simulation / Physics Engine (`src/simulation/`) ✅
- [x] `src/simulation/types.ts` — `Vector2`, `Body`, `SimulationState` interfaces per §02.2
- [x] `src/simulation/constants.ts` — defaults: `G=1.0`, `SOFTENING=5.0`, `DT=1/60`, `SUN_MASS=10000`, `VELOCITY_MULTIPLIER=0.05`, `MIN_MASS=1`, `MAX_MASS=50`, `MIN_RADIUS=4`, `MAX_RADIUS=20`, escape distance, escape grace period, `massToRadius()`
- [x] `src/simulation/forces.ts` — gravitational force computation (`F = G*m1*m2 / (r² + ε²)`), Newton's 3rd law optimization, N-body toggle
- [x] `src/simulation/integrator.ts` — Velocity Verlet step: position update → recompute forces → velocity update
- [x] `src/simulation/simulation.ts` — Main `Simulation` class: `step(dt)`, body management, escaped planet detection with grace period, sun management, `prevPosition` tracking

### 5. Canvas Renderer (`src/renderer/`) ✅
- [x] `src/renderer/types.ts` — `RenderConfig`, `Particle`, `Ripple`, `VisualEvent` interfaces
- [x] `src/renderer/background.ts` — Starfield (~200 random points) + nebula overlay, pre-rendered to offscreen canvases
- [x] `src/renderer/trails.ts` — Fading trail overlay, configurable fade rate, trail dots with additive blending
- [x] `src/renderer/bodies.ts` — Sun rendering (radial gradient, pulsing, additive glow) + planet rendering (mass→radius, glow)
- [x] `src/renderer/triggers-vis.ts` — Trigger line rendering (1px, configurable alpha), rotation handles
- [x] `src/renderer/particles.ts` — Particle system with object pooling (~200), burst on trigger events, velocity damping, performance-aware degradation
- [x] `src/renderer/effects.ts` — Trigger ripple, sun flash, selection ring
- [x] `src/renderer/renderer.ts` — Main `Renderer` class: high-DPI canvas, render loop with correct drawing order per §04.10

### 6. Audio Engine (`src/audio/`) ✅
- [x] `src/audio/types.ts` — `SynthType`, `ScaleMode`, `ScaleConfig`, `TriggerEvent`, `SYNTH_LABELS`
- [x] `src/audio/scales.ts` — All 7 mode interval definitions, `generateNoteArray()`, `noteToMidi()`, `midiToFrequency()`
- [x] `src/audio/quantizer.ts` — Distance → pitch mapping with reversal (close=high), edge case handling
- [x] `src/audio/triggers.ts` — Axis-crossing detection (signed distance sign change), configurable trigger lines, linear interpolation, 100ms debounce
- [x] `src/audio/effects.ts` — Signal chain: `Tone.Reverb` → `Tone.FeedbackDelay` → `Tone.Limiter` → `Tone.Gain`
- [x] `src/audio/planet-voice.ts` — Per-planet synth voice: 8 synth types, voice lifecycle (create/update/dispose), velocity→timbre modulation, mute/solo
- [x] `src/audio/engine.ts` — `AudioEngine` class: `Tone.start()` management, voice map, trigger event handling, per-planet panning, velocity→volume, triggers/min tracking

### 7. UI — DOM-Based Controls (`src/ui/`) ✅
- [x] `src/ui/selection.ts` — Planet selection state, find planet at coordinates
- [x] `src/ui/sidebar.ts` — Planet list sidebar (per-planet row with color dot, name, synth label, mute, solo, delete), planet editor panel
- [x] `src/ui/controls.ts` — Control panel with Simulation, Music, Synth Default, Effects, Trigger Lines sections
- [x] `src/ui/spawn.ts` — Click+drag spawn with ghost planet preview and velocity vector (slingshot)
- [x] `src/ui/trigger-lines.ts` — Trigger line selection and rotation handle dragging
- [x] `src/ui/keyboard.ts` — All keyboard shortcuts per §05.8

### 8. Overlay & Status (`src/ui/`) ✅
- [x] `src/ui/status-bar.ts` — Bottom bar with planet count, FPS, scale display, triggers/min, auto-hide
- [x] `src/ui/shortcuts-overlay.ts` — `?` key shows keyboard shortcuts reference

### 9. Main Loop Integration (`src/main.ts`) ✅
- [x] Single RAF loop: simulation step → trigger detection → audio scheduling → render
- [x] Window resize handling
- [x] "Click to Begin" overlay → `Tone.start()`
- [x] Panel collapse/expand (keyboard H)
- [x] Cursor management via CSS (crosshair default)
- [x] Responsive: auto-collapse panels at <1024px width

### 10. Polish & Edge Cases ✅
- [x] Escaped planet dimming visual indicator before removal
- [x] Spawn gesture visualization (ghost planet, velocity vector with color gradient)
- [x] Selection ring animation (pulsing white ring, 1s cycle)
- [x] Audio graceful degradation (drop particles at 20ms, skip at 30ms frame time)
- [x] High-DPI canvas rendering with `devicePixelRatio`

### 11. Tests ✅
- [x] `src/lib/__tests__/math.test.ts` — 27 tests: Vector2 ops, lerp, clamp, mapRange
- [x] `src/simulation/__tests__/forces.test.ts` — 6 tests: gravitational force, softening, Newton's 3rd law, N-body toggle
- [x] `src/simulation/__tests__/integrator.test.ts` — 6 tests: Velocity Verlet step, energy conservation
- [x] `src/simulation/__tests__/simulation.test.ts` — 20 tests: body add/remove, escape detection, sun immobility
- [x] `src/audio/__tests__/scales.test.ts` — 16 tests: note array generation, all 7 modes, root transposition, MIDI frequency
- [x] `src/audio/__tests__/quantizer.test.ts` — 8 tests: distance→pitch mapping, edge cases, reversal
- [x] `src/audio/__tests__/triggers.test.ts` — 8 tests: axis-crossing detection, debounce, configurable lines
- [x] `src/state/__tests__/store.test.ts` — 20 tests: state mutations, selection, planets, trigger lines, resetAll
- [x] `src/ui/__tests__/selection.test.ts` — 6 tests: findPlanetAt, tolerance, sun skipping, topmost planet

---

## Learnings & Notes

### MIDI Note Numbering
- Standard MIDI: `note = (octave + 1) * 12 + semitone`. C4 = 60, not `octave * 12`.
- The spec's example array for C Lydian octaves 2-6 uses this convention (C2 = 36, B6 = 95).

### Floating Point in Trigger Detection
- `Math.cos(Math.PI/2)` ≈ `6.12e-17`, not exactly 0. This causes false positives in crossing detection.
- Fix: use epsilon tolerance (`< -1e-10` instead of `< 0`) for the sign-change product check.

### Debounce Initialization
- Using `Map.get(key) ?? 0` causes the first trigger at time 0 to be debounced.
- Fix: check `Map.has(key)` or use `Map.get(key) !== undefined` before applying debounce.

### Vitest Fake Timers
- `vi.useFakeTimers()` mocks `Date.now()` but `performance.now()` behavior may vary.
- The trigger detector uses `Date.now()` for debounce, which works reliably with `vi.setSystemTime()`.

### Filter Nodes for Saw/Square Synths (FIXED)
- Saw/square synths now properly store both the Synth and Filter in `PlanetVoice`.
- `PlanetVoice.synth` is always the triggerable node (Synth/FMSynth/PluckSynth).
- `PlanetVoice.filter` is null for non-filtered types, `Tone.Filter` for saw/square.
- Signal chain: Synth → [Filter] → Gain → Pan → Effects.
- Disposal and voice updates properly handle both synth and filter nodes.

### Selection State Duplication Bug (FIXED)
- `selection.ts` had its own `selectedPlanetId` variable that was never updated.
- All keyboard shortcuts (Delete, Mute, Solo, SetSynth) read from this stale variable → they were all broken.
- Fix: removed the duplicate state from `selection.ts`. All reads now use `getState().selectedPlanetId` from the store.
- Why it matters: selection is the bridge between UI interaction and keyboard actions. Without it, Delete/Mute/Solo/Synth shortcuts were no-ops.

### Sidebar Synth Label Bug (FIXED)
- Sidebar always showed 'FM' regardless of actual synth type. The label was hardcoded.
- `sidebar.update()` now accepts an optional `planetStates` parameter to read the correct synth type.

### Velocity → Timbre Modulation (IMPLEMENTED per spec §06.7)
- Sine/Triangle: velocity modulates envelope attack (0.05s slow → 0.001s fast = more percussive)
- Saw/Square: velocity modulates low-pass filter cutoff (200Hz slow → 8000Hz fast = brighter)
- FM/Bell: velocity modulates modulation index (1 slow → 20 fast = more metallic harmonics)
- Pluck/Marimba: velocity modulates dampening (1000 slow → 6000 fast = longer sustain)

---

## Remaining Improvements (Future)

- [ ] Dual octave range slider (currently two separate sliders)
- [ ] Predicted orbit path visualization (stretch goal from spec)
- [ ] Audio CPU monitoring and graceful degradation (skip lowest-velocity triggers)
- [ ] Logarithmic distance mapping option
- [ ] Presets system for global settings
- [ ] Right-click drag to pan canvas (not in MVP)

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
| Octave Range | 3–5 | §06.6 |
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
