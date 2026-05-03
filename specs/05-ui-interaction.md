# Spec: UI & Interaction Design

## 1. Overview

The UI is minimal, dark, and non-intrusive. The simulation canvas occupies the full viewport. UI elements are overlaid as semi-transparent panels that don't obstruct the simulation. All controls use native DOM elements styled with CSS — no canvas-based UI widgets.

## 2. Layout

```
┌─────────────────────────────────────────────────────────────┐
│ ┌──────────┐                                  ┌───────────┐ │
│ │          │                                  │           │ │
│ │ Sidebar  │                                  │  Control  │ │
│ │ (Planets)│        SIMULATION CANVAS          │  Panel    │ │
│ │          │                                  │           │ │
│ │          │              ☀                   │           │ │
│ │          │                                  │           │ │
│ │          │                                  │           │ │
│ └──────────┘                                  └───────────┘ │
│                                                             │
│                    [ Status Bar / Tooltips ]                │
└─────────────────────────────────────────────────────────────┘
```

- **Sidebar** (left, 240px wide): Planet list with mute/solo/delete per planet.
- **Control Panel** (right, 260px wide): Global settings, scale, synth, effects.
- **Canvas**: Fills remaining space. Panels overlay the canvas with semi-transparency.
- **Status Bar** (bottom): Shows planet count, FPS, current scale/root, trigger count.
- Panels can be collapsed/hidden via toggle buttons.

## 3. Startup Overlay

### 3.1 "Click to Begin" Screen
- Full-screen overlay with the app title "Orbital Harmonics" and a single instruction: "Click anywhere to begin."
- Dark background with subtle animated starfield (same as canvas background).
- **Purpose:** Required by Web Audio API — audio context can only be created after a user gesture.
- On click: `Tone.start()`, overlay fades out over 500ms, simulation begins.

## 4. Sidebar — Planet List

### 4.1 Location & Style
- Left side of the viewport, 240px wide.
- Semi-transparent dark background: `rgba(10, 10, 20, 0.85)` with backdrop blur.
- Rounded right edge.
- Collapsible via a small tab/arrow on the right edge.

### 4.2 Planet List Items
Each spawned planet appears as a row:
```
┌────────────────────────────────────────┐
│ ● Planet 3  │  FM  │  🔇  │  🎯  │  ✕  │
└────────────────────────────────────────┘
```
- **Color dot** (`●`): Planet's color. Click to select the planet on canvas.
- **Name**: Auto-generated ("Planet 1", "Planet 2", ...). Click to select.
- **Synth label**: Current synth type abbreviation (FM, SIN, SAW, etc.).
- **Mute button** (`🔇`): Toggles mute. Muted planets are dimmed in the list and on canvas.
- **Solo button** (`🎯`): Toggles solo. Only one solo active at a time.
- **Delete button** (`✕`): Removes the planet from simulation and audio.

### 4.3 Selected Planet
- The selected planet's row is highlighted (left border accent in the planet's color).
- Clicking a row selects the planet; clicking the canvas background deselects.

### 4.4 Empty State
When no planets exist, the sidebar shows:
```
Click and drag on the canvas
to spawn a planet.
```

## 5. Planet Editor (Expanded Sidebar)

### 5.1 Trigger
When a planet is selected, the sidebar expands to show per-planet settings below the planet list.

### 5.2 Per-Planet Controls

| Control | Type | Default | Range |
|---|---|---|---|
| Synth Engine | Dropdown | FM | sine, triangle, sawtooth, square, fm, marimba, bell, pluck |
| Volume | Slider | 75% | 0% – 100% |
| Pan | Slider | Center | Left – Right |
| Mass | Slider | Current value | 1 – 50 |
| Color | Color picker | Auto-assigned | HSL wheel |

Changes are applied immediately (no "apply" button).

## 6. Control Panel — Global Settings

### 6.1 Location & Style
- Right side of the viewport, 260px wide.
- Same visual style as sidebar (semi-transparent, backdrop blur, rounded left edge).
- Collapsible via tab/arrow on the left edge.

### 6.2 Sections

#### Simulation
| Control | Type | Default |
|---|---|---|
| Gravity Strength | Slider (0.1–5.0) | 1.0 |
| N-Body Toggle | Toggle switch | On |
| Trail Length | Slider (short–long) | Medium |
| Speed (Sim Speed) | Slider (0.25×–2×) | 1.0× |

#### Music
| Control | Type | Default |
|---|---|---|
| Root Note | Dropdown | C |
| Scale / Mode | Dropdown | Lydian |
| Octave Range | Dual slider | 2–6 |

#### Synth Default
| Control | Type | Default |
|---|---|---|
| Default Synth | Dropdown | FM |
| (Applied to newly spawned planets only) | | |

#### Effects
| Control | Type | Default |
|---|---|---|
| Reverb Mix | Slider | 30% |
| Delay Mix | Slider | 20% |
| Master Volume | Slider | 75% |

#### Trigger Lines
| Control | Type | Default |
|---|---|---|
| Add Trigger Line | Button | — |
| Reset Lines | Button | X + Y only |
| (Up to 6 lines total) | | |

### 6.3 Presets (Future)
A "Presets" dropdown could load pre-configured global settings. Not in MVP scope.

## 7. Canvas Interactions

### 7.1 Spawn Planet (Click + Drag)
1. **mousedown** on empty canvas area:
   - Record start position.
   - Show ghost planet at click position.
2. **mousemove** (while held):
   - Draw rubber-band velocity vector from ghost planet to current mouse position.
   - Vector length and color indicate speed.
3. **mouseup** (release):
   - Calculate initial velocity: `(startPos - endPos) * velocityMultiplier`.
   - Create planet body with current mass setting and the computed velocity.
   - Spawn synth voice.
   - Add to sidebar list.
   - Remove ghost planet and velocity vector.

### 7.2 Select Planet (Click)
- **click** on an existing planet body:
  - Select it (highlight ring, expand planet editor in sidebar).
- **click** on empty space:
  - Deselect current planet, collapse planet editor.

### 7.3 Delete Planet
- Select planet → press `Delete` or `Backspace`.
- Or click `✕` in sidebar list.
- Planet is removed from simulation, audio voice is disposed, sidebar entry is removed.

### 7.4 Pan Canvas (Right-Click Drag)
- **No pan in MVP.** The viewport is fixed, centered on the sun.

### 7.5 Trigger Line Interaction
- **Click near a trigger line** (within 10px): Select the line. Show rotation handles.
- **Drag rotation handle**: Rotate the line around the sun.
- **Click away**: Deselect the line.

## 8. Keyboard Shortcuts

| Key | Action |
|---|---|
| `Space` | Pause / Resume simulation |
| `Delete` / `Backspace` | Delete selected planet |
| `M` | Mute / Unmute selected planet |
| `S` | Solo / Unsolo selected planet |
| `1`–`8` | Set selected planet's synth to: 1=sine, 2=triangle, 3=saw, 4=square, 5=fm, 6=marimba, 7=bell, 8=pluck |
| `G` | Toggle N-body on/off |
| `R` | Reset: remove all planets |
| `H` | Hide/show all UI panels |
| `?` | Show keyboard shortcuts overlay |

## 9. Status Bar

A thin bar at the bottom of the viewport (24px tall, semi-transparent):
- Left: `Planets: 7` | `FPS: 60`
- Center: `C Lydian` (current root + mode)
- Right: `Triggers: 23/min` (running average of triggers per minute)

Auto-hides after 5 seconds of no mouse movement. Reappears on mouse move.

## 10. Visual Design System

### 10.1 Colors
- Background: `#0a0a14` (near-black with slight blue)
- Panel background: `rgba(10, 10, 30, 0.85)`
- Panel border: `rgba(100, 150, 255, 0.1)`
- Text primary: `rgba(255, 255, 255, 0.9)`
- Text secondary: `rgba(255, 255, 255, 0.5)`
- Accent: `#4fc3f7` (light blue)
- Danger (delete): `#ef5350`

### 10.2 Typography
- Font: System font stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`)
- Monospace for values: `'SF Mono', 'Fira Code', monospace`
- Sizes: Labels 11px, Values 13px, Section headers 14px bold.

### 10.3 Spacing & Sizing
- Panel padding: 12px
- Control spacing: 8px between rows
- Slider height: 20px (thumb 14px)
- Planet list row height: 32px

### 10.4 Animations
- Panel collapse/expand: 200ms ease-out.
- Planet selection ring: 1s pulse loop (opacity 100% → 30% → 100%).
- Ripple effects: 400ms ease-out.
- All CSS transitions use `will-change: transform, opacity` for GPU compositing.

## 11. Responsive Behavior

- **Desktop only** (as per scope). No mobile/touch support in MVP.
- Minimum supported resolution: 1280×720.
- On smaller windows, control panel auto-collapses. Sidebar remains.
- At < 1024px width, both panels auto-collapse, accessible via floating toggle buttons.

## 12. Cursor

| Context | Cursor |
|---|---|
| Default (empty canvas) | Crosshair `+` |
| Over a planet | Pointer (indicates clickability) |
| Dragging to spawn | None (custom velocity vector replaces cursor) |
| Over a trigger line | Grab |
| Dragging trigger line | Grabbing |
| Over UI panels | Default arrow |
