/**
 * Core types for the physics simulation engine.
 * Re-exports Vector2 from lib/math for convenience.
 */

import type { Vector2 } from '../lib/math.js';

export type { Vector2 };

export interface Body {
  id: string;
  mass: number;
  position: Vector2;
  velocity: Vector2;
  acceleration: Vector2;
  prevPosition: Vector2;
  radius: number;
  isAnchor: boolean;
  color: string;
  /** Timestamp when planet was flagged as escaped (0 = not escaped) */
  escapedAt: number;
  /** User-assigned name */
  name: string;
  /** Mute state (visual dimming) */
  muted: boolean;
  /** Solo state */
  soloed: boolean;
}

export interface SimulationState {
  bodies: Body[];
  sun: Body;
  running: boolean;
  G: number;
  softening: number;
  nBodyEnabled: boolean;
  simSpeed: number;
}
