/**
 * Planet selection helpers.
 * Selection state lives in the central store (state/store.ts).
 * This module only provides the findPlanetAt helper.
 */

import type { Body } from '../simulation/types.js';

/** Find a planet body at the given canvas coordinates (within radius + 5px tolerance) */
export function findPlanetAt(bodies: Body[], x: number, y: number): Body | null {
  // Check in reverse order so topmost (latest) planet is selected first
  for (let i = bodies.length - 1; i >= 0; i--) {
    const body = bodies[i];
    if (body.isAnchor) continue;
    const dx = body.position.x - x;
    const dy = body.position.y - y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist <= body.radius + 5) {
      return body;
    }
  }
  return null;
}
