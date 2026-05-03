/**
 * Gravitational force computation.
 * Implements F = G*m1*m2 / (r² + ε²) with Newton's 3rd law optimization.
 */


import type { Body } from './types.js';
/**
 * Compute the gravitational force vector from body `a` toward body `b`.
 * Returns the force magnitude times the direction unit vector from a→b.
 */
export function gravitationalForce(
  a: Body,
  b: Body,
  G: number,
  softening: number,
): { fx: number; fy: number } {
  const dx = b.position.x - a.position.x;
  const dy = b.position.y - a.position.y;
  const distSq = dx * dx + dy * dy + softening * softening;
  const dist = Math.sqrt(distSq);
  const forceMag = (G * a.mass * b.mass) / distSq;
  return {
    fx: forceMag * (dx / dist),
    fy: forceMag * (dy / dist),
  };
}

/**
 * Compute all pairwise gravitational forces and update accelerations.
 * Uses Newton's 3rd law: compute each pair once, apply equal-and-opposite.
 * When nBodyEnabled is false, only computes forces between each planet and the sun.
 */
export function computeForces(
  bodies: Body[],
  sun: Body,
  G: number,
  softening: number,
  nBodyEnabled: boolean,
): void {
  // Reset accelerations
  for (const body of bodies) {
    body.acceleration.x = 0;
    body.acceleration.y = 0;
  }

  // All planets are attracted to the sun (sun is immovable, so skip applying force to sun)
  for (const body of bodies) {
    if (body.isAnchor) continue;
    const { fx, fy } = gravitationalForce(body, sun, G, softening);
    body.acceleration.x += fx / body.mass;
    body.acceleration.y += fy / body.mass;
  }

  // N-body: pairwise planet interactions
  if (nBodyEnabled) {
    const planets = bodies.filter((b) => !b.isAnchor);
    for (let i = 0; i < planets.length; i++) {
      for (let j = i + 1; j < planets.length; j++) {
        const { fx, fy } = gravitationalForce(planets[i], planets[j], G, softening);
        planets[i].acceleration.x += fx / planets[i].mass;
        planets[i].acceleration.y += fy / planets[i].mass;
        planets[j].acceleration.x -= fx / planets[j].mass;
        planets[j].acceleration.y -= fy / planets[j].mass;
      }
    }
  }
}
