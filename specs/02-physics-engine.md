# Spec: Physics Engine

## 1. Overview

A custom 2D N-body gravitational simulation using **Velocity Verlet integration**. The simulation runs at 60fps synchronized with the render loop. It provides position, velocity, and acceleration data for all bodies to the audio and renderer modules.

## 2. Core Types

```typescript
interface Vector2 {
  x: number;
  y: number;
}

interface Body {
  id: string;
  mass: number;
  position: Vector2;
  velocity: Vector2;
  acceleration: Vector2;
  prevPosition: Vector2;      // for axis-crossing detection
  radius: number;              // visual radius (derived from mass)
  isAnchor: boolean;           // true for the central sun
  color: string;               // HSL color string
}
```

## 3. Gravitational Force

### 3.1 Force Law
Standard Newtonian gravity with a softening parameter to prevent singularities:

```
F = G * m1 * m2 / (r² + ε²)
```

Where:
- `G` = gravitational constant (tunable by user as "Gravity Strength")
- `ε` = softening parameter (prevents infinite force at near-zero distance)
- `r` = Euclidean distance between two bodies

### 3.2 Softening
- Default `ε` = 5.0 (pixels). This prevents numerical explosion when two bodies nearly overlap.
- Softening is applied in force magnitude calculation only; visual positions are unsoftened.

### 3.3 N-Body Toggle
- **Enabled (default):** Every body exerts gravitational force on every other body (O(n²)).
- **Disabled:** Only the anchor (sun) exerts force on planets. Planets do not interact with each other. This produces perfectly repeating Keplerian orbits — useful for predictable rhythms.
- Toggled by the user via the control panel.

## 4. Integration Method

### 4.1 Velocity Verlet
The Velocity Verlet algorithm is symplectic (conserves energy over long simulations), providing stable orbits without energy drift:

```
1. x(t+dt) = x(t) + v(t)*dt + 0.5*a(t)*dt²
2. Compute a(t+dt) from new positions
3. v(t+dt) = v(t) + 0.5*(a(t) + a(t+dt))*dt
```

### 4.2 Time Step
- `dt` is fixed at `1/60` seconds (matched to RAF frame rate).
- The simulation runs one step per frame. If the frame takes too long, frames are dropped rather than simulating multiple steps (prevents physics explosion).

### 4.3 Sub-stepping (Optional Enhancement)
- If accuracy issues arise with fast-moving bodies, the engine can perform 2-4 sub-steps per frame with proportionally smaller `dt`.
- This is a future optimization, not required for MVP.

## 5. The Anchor (Sun)

### 5.1 Properties
- Position: Always at the center of the canvas `(canvasWidth/2, canvasHeight/2)`.
- Mass: Configurable, default = `10000`. Much larger than any planet mass.
- Immovable: The sun does not respond to gravitational forces from planets. Its position is fixed.
- Visual: Rendered as a large glowing circle.

### 5.2 Rationale
Fixing the sun prevents the center of mass from drifting when asymmetric planet configurations are created. This keeps the visual composition centered and simplifies axis-crossing detection.

## 6. Planets

### 6.1 Mass
- Configurable at spawn time (via drag length or a mass slider).
- Default mass range: `1.0` to `50.0`.
- Visual radius is proportional to `mass^(1/3)` (volume scaling), with a minimum of 4px and maximum of 20px.

### 6.2 Initial Velocity
- Set by the user's drag gesture at spawn time.
- The drag vector is inverted (slingshot: drag away from intended direction) and scaled by a configurable multiplier to convert pixel-drag-distance into simulation velocity units.
- Default velocity multiplier: `0.05` (tunable).

### 6.3 Collision Behavior
- **No physical collisions.** Planets pass through each other and through the sun.
- Rationale: Collisions would destroy planets, ending their audio contribution. The goal is continuous generative audio, so preservation of all orbits is essential.

### 6.4 Boundary Behavior
- Planets that drift far outside the canvas viewport (>2× canvas diagonal from center) are flagged as "escaped."
- Escaped planets are automatically removed (deleted) after a 5-second grace period.
- This prevents invisible planets from consuming CPU and producing inaudible audio.
- A visual indicator (dimming) warns the user before removal.

## 7. Simulation Loop

```
for each frame:
  1. Compute all pairwise gravitational forces
  2. Velocity Verlet position update
  3. Recompute forces at new positions
  4. Velocity Verlet velocity update
  5. Store prevPosition for each body
  6. Emit simulation state to renderer and audio modules
```

### 7.1 Force Computation (Optimized)
```
for i = 0 to N-1:
  for j = i+1 to N-1:
    F = computeForce(bodies[i], bodies[j])
    bodies[i].acceleration += F / bodies[i].mass
    bodies[j].acceleration -= F / bodies[j].mass
```
- Newton's third law optimization: compute each pair once, apply equal-and-opposite.
- When N-body is disabled, only compute forces between each planet and the sun (O(n)).

## 8. Coordinate System

- Origin: Center of canvas (sun position).
- X increases rightward, Y increases downward (canvas convention).
- All physics computations are in simulation space (pixels), not world units.
- The coordinate system is exposed to the audio trigger system for axis-crossing detection.

## 9. Tunable Parameters (User-Facing)

| Parameter | Default | Range | Audio Mapping |
|---|---|---|---|
| Gravity Strength (G) | 1.0 | 0.1 – 5.0 | Acts as global tempo |
| Sun Mass | 10000 | 1000 – 50000 | Affects orbital period range |
| N-Body Toggle | On | On/Off | Predictable vs. chaotic rhythms |
| Planet Mass | 10 | 1 – 50 | Affects perturbation of other orbits |
| Velocity Multiplier | 0.05 | 0.01 – 0.2 | Controls initial orbit size |

## 10. Data Flow

```
User Input (spawn gesture)
  → Create Body with position + initial velocity
  → Add to simulation.bodies[]
  
Each Frame:
  simulation.step(dt)
  → emit bodies[] state to:
    - Renderer (positions, velocities for visual rendering)
    - Audio Trigger System (prevPosition vs position for crossing detection)
```
