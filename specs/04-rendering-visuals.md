# Spec: Rendering & Visuals

## 1. Overview

The renderer draws the simulation state to an HTML5 Canvas 2D context at 60fps. The visual design follows a **deep space aesthetic** with glowing bodies, fading orbital trails, particle effects on trigger events, and a subtle nebula background. The UI chrome is minimal and dark.

## 2. Canvas Setup

### 2.1 Full-Viewport Canvas
- A single `<canvas>` element fills the entire browser viewport (`width: 100vw, height: 100vh`).
- Canvas dimensions are synced to `window.innerWidth` and `window.innerHeight` on resize.
- CSS: `display: block; margin: 0; padding: 0; overflow: hidden; background: #000;`

### 2.2 Coordinate System
- Origin: Center of canvas (sun position).
- The simulation and renderer share the same pixel-coordinate space — no transformation layer needed.

### 2.3 High-DPI Support
- Canvas backing store is scaled by `window.devicePixelRatio`.
- All drawing operations account for this scale factor.
- Ensures crisp rendering on Retina/high-DPI displays.

## 3. Background

### 3.1 Static Starfield
- A pre-rendered starfield of ~200 random points (varying size: 0.5–2px, varying brightness) drawn once to an offscreen canvas.
- Blitted to the main canvas each frame as the base layer.
- Regenerated on canvas resize.

### 3.2 Nebula Overlay
- Subtle, large radial gradients in deep blues, purples, and teals positioned at 2-3 random locations.
- Very low opacity (5–10%) to provide depth without distraction.
- Pre-rendered to a separate offscreen canvas; drawn once on resize.

### 3.3 Performance
- Both starfield and nebula are static backgrounds. They are composited from offscreen canvases each frame (single `drawImage` call each), avoiding per-frame recalculation.

## 4. Trigger Lines

### 4.1 Rendering
- Each trigger line is drawn as a thin line (1px) extending across the full canvas through the sun.
- Color: Subtle glow, e.g., `rgba(100, 150, 255, 0.15)` — barely visible when idle.
- Active (default X/Y) lines are slightly brighter than user-added lines.

### 4.2 Rotation Handles
- When a trigger line is selected (click near it), rotation handle circles appear at the line's intersection with the canvas edge.
- User drags these handles to rotate the line around the sun.
- Lines being actively rotated glow brighter: `rgba(100, 150, 255, 0.4)`.

## 5. The Sun (Anchor)

### 5.1 Visual Design
- Large radial gradient: bright white center → warm yellow → orange → transparent.
- Radius: 25px (fixed, not mass-dependent).
- Gentle pulsing animation: radius oscillates ±2px on a slow sine wave (period ~4s).
- Glow effect: drawn with `globalCompositeOperation: 'lighter'` for additive blending.

### 5.2 Rendering
```
ctx.globalCompositeOperation = 'lighter';
drawRadialGradient(sun.x, sun.y, 25, ['#fff', '#ffd54f', '#ff8f00', 'transparent']);
ctx.globalCompositeOperation = 'source-over';
```

## 6. Planets

### 6.1 Visual Design
- Each planet is a radial gradient circle with additive glow.
- Radius derived from mass: `radius = clamp(mass^(1/3) * 2, 4, 20)`.
- Color: assigned from a curated palette on spawn (see §6.3).

### 6.2 Glow Rendering
- Outer glow: Draw a larger radial gradient (2× radius) with the planet's color at very low opacity, using `globalCompositeOperation: 'lighter'`.
- Core: Bright white center fading to the planet's color.

### 6.3 Planet Color Palette
A curated set of distinguishable, vibrant colors:
```
['#4fc3f7', '#81c784', '#fff176', '#ff8a65', '#ce93d8', 
 '#f06292', '#4dd0e1', '#aed581', '#ffb74d', '#ba68c8']
```
- Colors cycle through the palette as planets are spawned.
- The user can change a planet's color in the planet editor.

### 6.4 Selected State
- When a planet is selected (clicked), a white ring (2px) pulses around it.
- The ring animates (expanding and fading) to clearly indicate selection.

## 7. Orbital Trails

### 7.1 Trail Mechanism
- **Fading overlay technique** (performant, no history array):
  - Each frame, draw a semi-transparent black rectangle over the entire canvas: `ctx.fillStyle = 'rgba(0, 0, 0, 0.03)'`.
  - This gradually fades old positions to black over ~2 seconds (60 frames × 0.03 alpha ≈ 83% fade after 2s).
  - New planet positions are drawn on top each frame.
- This creates smooth, naturally fading trails without storing or iterating trail history.

### 7.2 Trail Style
- Trail dots are drawn as small circles (2px radius) in the planet's color at reduced opacity (60%).
- `globalCompositeOperation: 'lighter'` for the trail dots gives them an additive glow that fades naturally.

### 7.3 Performance
- The fade overlay approach is O(1) per frame regardless of trail length — no history arrays to iterate.
- This is the key performance optimization that allows many planets with long trails on low-end hardware.

### 7.4 Trail Length Control
- Fade rate is exposed as a user control: `0.01` (very long trails) to `0.1` (short trails).
- Default: `0.03`.

## 8. Trigger Event Visuals

### 8.1 Ripple Effect
When a planet crosses a trigger line:
1. A **circular ripple** expands from the crossing point.
2. Ripple properties:
   - Start radius: planet's visual radius
   - End radius: 40px
   - Duration: 400ms
   - Color: planet's color, fading from 60% to 0% opacity
   - Line width: 2px
3. The ripple is drawn as a `stroke` arc that expands and fades.

### 8.2 Particle Burst
A small burst of **8–12 particles** at the crossing point:
- Particles fly outward from the crossing point at random angles.
- Each particle: 1–3px radius, planet's color, fades over 300–500ms.
- Particles slow down over their lifetime (velocity damping = 0.95 per frame).
- **Object pooling:** Pre-allocate a pool of ~200 particle objects. Reuse from pool, return to pool when expired. No allocation during runtime.

### 8.3 Sun Flash
- On any trigger event, the sun briefly brightens (opacity pulse from 100% → 120% via additive blend, fading back over 200ms).
- Subtle feedback that "something happened" even when the crossing is off-screen.

## 9. Spawn Gesture Visualization

### 9.1 Ghost Planet
- While the user holds the mouse down (before release), a translucent preview of the planet appears at the click position.
- Size reflects the currently selected mass (from the control panel or a modifier key).

### 9.2 Velocity Vector
- A line is drawn from the ghost planet to the current mouse position (the "rubber band").
- An arrowhead at the mouse end indicates direction.
- The line color transitions from white to green as it gets longer (indicating faster initial velocity).
- A faint predicted orbit path (simple Keplerian ellipse approximation) could be shown as a dotted line (stretch goal, not MVP).

## 10. Rendering Order (Per Frame)

```
1. Draw background (starfield + nebula from offscreen canvases)
2. Apply trail fade overlay (semi-transparent black fill)
3. Draw trigger lines (subtle glowing lines)
4. Draw orbital trail dots (from current planet positions, rendered onto the fading canvas)
5. Draw trigger event ripples and particles
6. Draw sun (with additive glow)
7. Draw planets (with additive glow)
8. Draw spawn gesture (ghost planet + velocity vector, if active)
9. Draw selection indicator (pulsing ring, if any planet selected)
```

**Note:** The trail fade overlay (step 2) and trail dots (step 4) are what create the persistent fading trail effect. The overlay progressively dims old content while new dots are drawn fresh each frame.

## 11. Performance Targets

| Scenario | Bodies | Target FPS | Notes |
|---|---|---|---|
| Light | ≤8 planets | 60fps | Effortless |
| Medium | 8–20 planets | 60fps | Should hold on any laptop |
| Heavy | 20–40 planets | ≥30fps | Fade-overlay keeps trails cheap |
| Stress | 40+ planets | Best effort | Visual quality degrades gracefully |

### Performance Guards
- If frame time exceeds 20ms, reduce particle count per trigger event.
- If frame time exceeds 30ms, skip particle rendering entirely, keep only ripples.
- If frame time exceeds 40ms, reduce trail fade resolution (larger alpha = shorter trails = less visual density).
