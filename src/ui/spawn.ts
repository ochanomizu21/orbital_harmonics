/**
 * Click+drag spawn interaction handler.
 * Creates a ghost planet preview, velocity vector (rubber band), and spawns on release.
 * Supports both mouse and touch events for mobile.
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
    // Mouse events
    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return; // left click only
      this.startGesture(e.clientX, e.clientY);
    });

    this.canvas.addEventListener('mousemove', (e) => {
      if (!this.state.active) return;
      this.updateGesture(e.clientX, e.clientY);
    });

    this.canvas.addEventListener('mouseup', (e) => {
      if (!this.state.active) return;
      if (e.button !== 0) return;
      this.endGesture();
    });

    // Touch events for mobile
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.startGesture(touch.clientX, touch.clientY);
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (!this.state.active) return;
      const touch = e.touches[0];
      this.updateGesture(touch.clientX, touch.clientY);
    }, { passive: false });

    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      if (!this.state.active) return;
      this.endGesture();
    }, { passive: false });

    this.canvas.addEventListener('touchcancel', (e) => {
      e.preventDefault();
      this.cancel();
    }, { passive: false });
  }

  private startGesture(x: number, y: number): void {
    this.state = {
      active: true,
      x,
      y,
      endX: x,
      endY: y,
    };
  }

  private updateGesture(x: number, y: number): void {
    this.state.endX = x;
    this.state.endY = y;
  }

  private endGesture(): void {
    if (!this.state.active) return;
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
  }

  /** Cancel any active spawn gesture */
  cancel(): void {
    this.state.active = false;
  }
}
