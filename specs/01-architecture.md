# Spec: Architecture & Technical Stack

## 1. Overview

Orbital Harmonics is a single-page interactive web application that maps a 2D N-body gravitational simulation to a generative polyrhythmic synthesizer. The app runs entirely client-side with no backend.

## 2. Technical Stack

### 2.1 Language
- **TypeScript (strict mode)** throughout the entire codebase.

### 2.2 Framework
- **Vanilla TypeScript with no UI framework** (no React/Vue/Svelte).
- Rationale: The UI is minimal (sidebar + control panel). The simulation canvas and audio engine dominate the render loop. A framework adds bundle size and abstraction overhead with no meaningful benefit for a canvas-heavy app. DOM elements for the UI are created directly or via a lightweight helper.
- UI sections (sidebar, control panel, modals) are plain HTML/CSS driven by a thin state layer.

### 2.3 Rendering
- **HTML5 Canvas 2D** for the simulation viewport.
- Rationale: 2D canvas is GPU-accelerated in all modern browsers, has minimal overhead, and easily handles dozens of orbiting bodies with glowing trails at 60fps. Avoids the overhead of a full WebGL scene graph (PixiJS/Three.js) while still being visually impressive with composite operations (`globalCompositeOperation: 'lighter'` for glow, gradient fills, etc.).
- A second offscreen canvas or `ImageData` buffer may be used for the fading trail effect to avoid re-drawing full history each frame.

### 2.4 Audio
- **Tone.js v14+** for all audio synthesis, scheduling, and effects.
- Built on the Web Audio API; provides scale quantization (`Tone.Scale`), synth nodes (`FMSynth`, `MetalSynth`, `PluckSynth`, etc.), and reliable transport scheduling.

### 2.5 Physics
- **Custom lightweight N-body simulation** using **Velocity Verlet integration**.
- Rationale: Velocity Verlet is symplectic (energy-conserving), simple to implement, and very fast for <50 bodies. No need for a full physics library like Matter.js which adds collision detection overhead we don't need.
- O(n²) pairwise force computation is acceptable up to ~50 bodies on any modern machine.

### 2.6 Build Tooling
- **Vite** with the `@vitejs/plugin-react` removed (no React). Plain TS plugin only.
- **npm** for package management.
- Dev server with HMR for fast iteration.
- Production build: tree-shaken, minified, single-page app.

## 3. Project Structure

```
orbital-harmonics/
├── index.html              # Entry point — canvas + UI containers
├── vite.config.ts
├── tsconfig.json
├── package.json
├── public/
│   └── favicon.svg
├── src/
│   ├── main.ts             # App bootstrap, wiring modules together
│   ├── style.css           # Global styles (dark theme, layout)
│   │
│   ├── simulation/         # Physics engine
│   │   ├── types.ts        # Body, Vector, SimulationState types
│   │   ├── integrator.ts   # Velocity Verlet step
│   │   ├── forces.ts       # Gravitational force computation
│   │   ├── simulation.ts   # Main simulation loop (update, step)
│   │   └── constants.ts    # G, SOFTENING, DT defaults
│   │
│   ├── audio/              # Audio engine (Tone.js)
│   │   ├── types.ts        # AudioConfig, SynthType, ScaleConfig types
│   │   ├── engine.ts       # AudioEngine class (master output, effects)
│   │   ├── planet-voice.ts # Per-planet synth voice management
│   │   ├── triggers.ts     # Axis-crossing detection & event emission
│   │   ├── quantizer.ts    # Distance → pitch quantization to scale
│   │   ├── scales.ts       # Scale definitions (modes, note arrays)
│   │   └── effects.ts      # Reverb + delay bus configuration
│   │
│   ├── renderer/           # Canvas rendering
│   │   ├── types.ts        # RenderConfig, TrailPoint, VisualEvent
│   │   ├── renderer.ts     # Main render loop, canvas management
│   │   ├── trails.ts       # Fading trail rendering
│   │   ├── bodies.ts       # Planet/sun drawing with glow
│   │   ├── triggers-vis.ts # Trigger line rendering + ripple effects
│   │   ├── particles.ts    # Particle system for axis-crossing events
│   │   └── background.ts   # Nebula/starfield background
│   │
│   ├── ui/                 # DOM-based UI
│   │   ├── sidebar.ts      # Planet list sidebar (mute/solo/delete)
│   │   ├── controls.ts     # Control panel (gravity, scale, synth, etc.)
│   │   ├── spawn.ts        # Click-drag spawn interaction handler
│   │   ├── selection.ts    # Planet selection state
│   │   └── planet-editor.ts # Per-planet synth/visual settings panel
│   │
│   ├── state/              # Application state
│   │   ├── store.ts        # Central reactive state store
│   │   └── types.ts        # AppState, PlanetState, SettingsState
│   │
│   └── utils/              # Shared utilities
│       ├── math.ts         # Vector math, lerp, clamp, etc.
│       └── colors.ts       # Color generation, HSL utilities
```

## 4. Performance Constraints

| Metric | Target |
|---|---|
| Frame rate | 60fps stable with ≤20 planets |
| Frame rate (degraded) | ≥30fps with 40+ planets |
| Audio latency | <20ms from trigger to sound (Web Audio default) |
| Physics step budget | ≤4ms per frame (leaving ~12ms for rendering) |
| Initial load time | <3s on broadband |
| Bundle size (gzipped) | <200KB |

### Performance Strategies
- **Physics:** Velocity Verlet with adaptive sub-stepping if frame budget allows.
- **Rendering:** Double-buffered canvas; trail fade via alpha-fill overlay (no history array redraw).
- **Audio:** Pre-allocated synth voices (no GC-triggering per-trigger creation).
- **Object pooling** for particles to avoid GC pressure.
- **`requestAnimationFrame`** drives both simulation and render loops in a single RAF callback.

## 5. Browser Support

| Browser | Version |
|---|---|
| Chrome | 90+ |
| Firefox | 90+ |
| Safari | 15+ |
| Edge | 90+ |

Requires: Web Audio API, Canvas 2D, `requestAnimationFrame`, ES2020+.

## 6. No Backend

The application is fully client-side. No API calls, no database, no authentication. Future expansion (multiplayer, cloud saves) would require adding a backend, but the initial architecture does not account for this (MVP scope).
