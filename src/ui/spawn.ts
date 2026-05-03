/**
 * Click+drag spawn interaction handler.
 * Creates a ghost planet preview, velocity vector (rubber band), and spawns on release.
 */

import type { Vector2 } from '../lib/math.js';
import { vec2, sub, scale } from '../lib/math.js';
import { VELOCITY_MULTIPLIER } from '../simulation/constants.js';

export interface SpawnState {
  active: boolean;
  x: number;
  y: number;
  endX: number;
  endY: number;
}

export interface SpawnCallbacks {
  onSpawn: (position: Vector2, velocity: Vector2, mass: number) => void;
  getDefaultMass: () => number;
}

export class SpawnHandler {
  private canvas: HTMLCanvasElement;
  private callbacks: SpawnCallbacks;
  state: SpawnState = { active: false, x: 0, y: 0, endX: 0, endY: 0 };

  constructor(canvas: HTMLCanvasElement, callbacks: SpawnCallbacks) {
    this.canvas = canvas;
    this.callbacks = callbacks;
    this.attach();
  }

  private attach(): void {
    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return; // left click only
      // Only spawn if not clicking on a planet or UI element
      this.state = {
        active: true,
        x: e.clientX,
        y: e.clientY,
        endX: e.clientX,
        endY: e.clientY,
      };
    });

    this.canvas.addEventListener('mousemove', (e) => {
      if (!this.state.active) return;
      this.state.endX = e.clientX;
      this.state.endY = e.clientY;
    });

    this.canvas.addEventListener('mouseup', (e) => {
      if (!this.state.active) return;
      if (e.button !== 0) return;

      this.state.active = false;

      const dx = this.state.x - this.state.endX;
      const dy = this.state.y - this.state.endY;
      const length = Math.sqrt(dx * dx + dy * dy);

      // Only spawn if there's a meaningful drag
      if (length > 5) {
        const position = vec2(this.state.x, this.state.y);
        // Slingshot: inverted drag direction, scaled by velocity multiplier
        const velocity = scale(sub(
          vec2(this.state.x, this.state.y),
          vec2(this.state.endX, this.state.endY),
        ), VELOCITY_MULTIPLIER);
        const mass = this.callbacks.getDefaultMass();

        this.callbacks.onSpawn(position, velocity, mass);
      }
    });
  }

  /** Cancel any active spawn gesture */
  cancel(): void {
    this.state.active = false;
  }
}
