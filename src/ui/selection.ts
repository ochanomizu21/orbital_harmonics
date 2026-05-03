/**
 * Planet selection state management.
 */

import type { Body } from '../simulation/types.js';

let selectedPlanetId: string | null = null;

export function getSelectedPlanetId(): string | null {
  return selectedPlanetId;
}

export function setSelectedPlanetId(id: string | null): void {
  selectedPlanetId = id;
}

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
