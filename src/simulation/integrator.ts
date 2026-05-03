/**
 * Velocity Verlet integration step.
 * Symplectic integrator that conserves energy over long simulations.
 *
 * Algorithm:
 *   1. x(t+dt) = x(t) + v(t)*dt + 0.5*a(t)*dt²
 *   2. Compute a(t+dt) from new positions
 *   3. v(t+dt) = v(t) + 0.5*(a(t) + a(t+dt))*dt
 */

import type { Body } from './types.js';

/**
 * Save current accelerations and update positions.
 * Step 1 of Velocity Verlet — must be followed by force recomputation and then velocityUpdate.
 */
export function positionUpdate(bodies: Body[], dt: number): void {
  for (const body of bodies) {
    if (body.isAnchor) continue; // sun is immovable
    // Save prev position for axis-crossing detection
    body.prevPosition.x = body.position.x;
    body.prevPosition.y = body.position.y;

    // Store current acceleration for velocity update step
    body.acceleration.x; // will be used after recomputation

    // Position update: x(t+dt) = x(t) + v(t)*dt + 0.5*a(t)*dt²
    body.position.x += body.velocity.x * dt + 0.5 * body.acceleration.x * dt * dt;
    body.position.y += body.velocity.y * dt + 0.5 * body.acceleration.y * dt * dt;
  }
}

/**
 * Update velocities after forces have been recomputed at new positions.
 * Step 3 of Velocity Verlet.
 * `oldAccelerations` holds the accelerations from before the position update.
 */
export function velocityUpdate(
  bodies: Body[],
  oldAccelerations: { x: number; y: number }[],
  dt: number,
): void {
  let i = 0;
  for (const body of bodies) {
    if (body.isAnchor) {
      i++;
      continue;
    }
    // v(t+dt) = v(t) + 0.5*(a_old(t) + a_new(t+dt)) * dt
    body.velocity.x += 0.5 * (oldAccelerations[i].x + body.acceleration.x) * dt;
    body.velocity.y += 0.5 * (oldAccelerations[i].y + body.acceleration.y) * dt;
    i++;
  }
}

/**
 * Save current accelerations for later use in velocity update.
 */
export function saveAccelerations(bodies: Body[]): { x: number; y: number }[] {
  return bodies.map((b) => ({ x: b.acceleration.x, y: b.acceleration.y }));
}
