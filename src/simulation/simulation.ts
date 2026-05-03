/**
 * Main Simulation class.
 * Manages bodies, runs the Velocity Verlet integration step, and detects escaped planets.
 */

import type { Body, SimulationState } from './types.js';
import type { Vector2 } from '../lib/math.js';
import { vec2, distance } from '../lib/math.js';
import { generateId } from '../lib/id.js';
import { resetIdCounter } from '../lib/id.js';
import { nextPaletteColor } from '../lib/colors.js';
import { resetPaletteIndex } from '../lib/colors.js';
import { computeForces } from './forces.js';
import { positionUpdate, velocityUpdate, saveAccelerations } from './integrator.js';
import {
  G as DEFAULT_G,
  SOFTENING,
  DT,
  SUN_MASS,
  ESCAPE_DISTANCE_FACTOR,
  ESCAPE_GRACE_PERIOD,
  massToRadius,
} from './constants.js';

let planetCounter = 0;

export class Simulation {
  bodies: Body[] = [];
  sun: Body;
  running = true;
  G = DEFAULT_G;
  softening = SOFTENING;
  nBodyEnabled = true;
  simSpeed = 1.0;
  dt = DT;

  /** Callbacks */
  onBodyRemoved?: (id: string) => void;
  onBodyAdded?: (body: Body) => void;

  private canvasDiagonal = 2000; // updated on resize

  constructor(canvasWidth: number, canvasHeight: number) {
    this.canvasDiagonal = Math.sqrt(canvasWidth * canvasWidth + canvasHeight * canvasHeight);
    this.sun = this.createSun(canvasWidth / 2, canvasHeight / 2);
    this.bodies.push(this.sun);
  }

  /** Update canvas dimensions (call on resize) */
  updateCanvasSize(width: number, height: number): void {
    this.canvasDiagonal = Math.sqrt(width * width + height * height);
    this.sun.position.x = width / 2;
    this.sun.position.y = height / 2;
  }

  private createSun(x: number, y: number): Body {
    return {
      id: 'sun',
      mass: SUN_MASS,
      position: vec2(x, y),
      velocity: vec2(0, 0),
      acceleration: vec2(0, 0),
      prevPosition: vec2(x, y),
      radius: 25,
      isAnchor: true,
      color: '#ffd54f',
      escapedAt: 0,
      name: 'Sun',
      muted: false,
      soloed: false,
    };
  }

  /** Add a new planet with the given position and initial velocity */
  addPlanet(
    position: Vector2,
    velocity: Vector2,
    mass: number,
  ): Body {
    planetCounter++;
    const body: Body = {
      id: generateId(),
      mass,
      position: { ...position },
      velocity: { ...velocity },
      acceleration: vec2(0, 0),
      prevPosition: { ...position },
      radius: massToRadius(mass),
      isAnchor: false,
      color: nextPaletteColor(),
      escapedAt: 0,
      name: `Planet ${planetCounter}`,
      muted: false,
      soloed: false,
    };
    this.bodies.push(body);
    this.onBodyAdded?.(body);
    return body;
  }

  /** Remove a body by ID */
  removeBody(id: string): void {
    const idx = this.bodies.findIndex((b) => b.id === id);
    if (idx !== -1 && !this.bodies[idx].isAnchor) {
      this.bodies.splice(idx, 1);
      this.onBodyRemoved?.(id);
    }
  }

  /** Remove all planets (keep the sun) */
  reset(): void {
    const removed = this.bodies.filter((b) => !b.isAnchor);
    this.bodies = [this.sun];
    for (const b of removed) {
      this.onBodyRemoved?.(b.id);
    }
    planetCounter = 0;
    resetIdCounter();
    resetPaletteIndex();
  }

  /** Execute one simulation step using Velocity Verlet */
  step(): void {
    if (!this.running) return;

    const dt = this.dt * this.simSpeed;

    // 1. Save old accelerations
    const oldAcc = saveAccelerations(this.bodies);

    // 2. Position update (step 1 of Velocity Verlet)
    positionUpdate(this.bodies, dt);

    // 3. Recompute forces at new positions
    computeForces(this.bodies, this.sun, this.G, this.softening, this.nBodyEnabled);

    // 4. Velocity update (step 3 of Velocity Verlet)
    velocityUpdate(this.bodies, oldAcc, dt);

    // 5. Detect escaped planets
    this.detectEscaped();
  }

  private detectEscaped(): void {
    const escapeDist = ESCAPE_DISTANCE_FACTOR * this.canvasDiagonal / 2;
    const now = performance.now();

    for (const body of this.bodies) {
      if (body.isAnchor) continue;

      const dist = distance(body.position, this.sun.position);
      if (dist > escapeDist) {
        if (body.escapedAt === 0) {
          body.escapedAt = now;
        } else if (now - body.escapedAt > ESCAPE_GRACE_PERIOD) {
          this.removeBody(body.id);
        }
      } else {
        body.escapedAt = 0;
      }
    }
  }

  /** Get all planet bodies (excluding the sun) */
  get planets(): Body[] {
    return this.bodies.filter((b) => !b.isAnchor);
  }

  /** Get a snapshot of the simulation state */
  get state(): SimulationState {
    return {
      bodies: [...this.bodies],
      sun: this.sun,
      running: this.running,
      G: this.G,
      softening: this.softening,
      nBodyEnabled: this.nBodyEnabled,
      simSpeed: this.simSpeed,
    };
  }
}
