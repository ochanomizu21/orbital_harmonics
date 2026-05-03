/**
 * Tests for gravitational force computation.
 * Validates the core physics: force law, softening, Newton's 3rd law.
 */

import { describe, it, expect } from 'vitest';
import { gravitationalForce, computeForces } from '../forces.js';
import type { Body } from '../../simulation/types.js';
import { vec2 } from '../../lib/math.js';

function makeBody(id: string, x: number, y: number, mass: number): Body {
  return {
    id,
    mass,
    position: vec2(x, y),
    velocity: vec2(0, 0),
    acceleration: vec2(0, 0),
    prevPosition: vec2(x, y),
    radius: 5,
    isAnchor: false,
    color: '#fff',
    escapedAt: 0,
    name: id,
    muted: false,
    soloed: false,
  };
}

describe('gravitationalForce', () => {
  it('computes force between two bodies', () => {
    const a = makeBody('a', 0, 0, 100);
    const b = makeBody('b', 100, 0, 100);
    const { fx, fy } = gravitationalForce(a, b, 1.0, 5.0);

    // F = G * m1 * m2 / (r² + ε²) = 1 * 100 * 100 / (10000 + 25)
    const expectedMag = (1 * 100 * 100) / (10000 + 25);
    expect(fx).toBeCloseTo(expectedMag);
    expect(fy).toBeCloseTo(0);
  });

  it('applies softening to prevent singularities', () => {
    const a = makeBody('a', 0, 0, 100);
    const b = makeBody('b', 0.1, 0, 100);
    const { fx, fy } = gravitationalForce(a, b, 1.0, 5.0);

    // Without softening, r² = 0.01 → F would be huge
    // With ε=5: distSq = 0.01 + 25 = 25.01, dist = sqrt(25.01) ≈ 5.001
    // forceMag = G*m1*m2/distSq = 10000/25.01 ≈ 399.84
    // fx = forceMag * dx/dist = 399.84 * 0.1/5.001 ≈ 7.995
    const distSq = 0.01 + 25;
    const dist = Math.sqrt(distSq);
    const expectedMag = (10000) / distSq;
    const expectedFx = expectedMag * (0.1 / dist);
    expect(fx).toBeCloseTo(expectedFx);
    expect(Math.abs(fy)).toBeLessThan(0.001);
  });

  it('force is symmetrical (Newton\'s 3rd law)', () => {
    const a = makeBody('a', 0, 0, 100);
    const b = makeBody('b', 50, 50, 200);
    const fab = gravitationalForce(a, b, 1.0, 5.0);
    const fba = gravitationalForce(b, a, 1.0, 5.0);

    expect(fab.fx).toBeCloseTo(-fba.fx);
    expect(fab.fy).toBeCloseTo(-fba.fy);
  });
});

describe('computeForces', () => {
  it('resets accelerations before computing', () => {
    const sun: Body = {
      id: 'sun', mass: 10000, position: vec2(500, 500),
      velocity: vec2(0, 0), acceleration: vec2(99, 99),
      prevPosition: vec2(500, 500), radius: 25,
      isAnchor: true, color: '#ffd54f', escapedAt: 0,
      name: 'Sun', muted: false, soloed: false,
    };
    const planet = makeBody('p1', 600, 500, 10);
    planet.acceleration = vec2(99, 99);

    computeForces([sun, planet], sun, 1.0, 5.0, false);

    // Sun acceleration should be reset (sun is immovable)
    expect(sun.acceleration.x).toBe(0);
    expect(sun.acceleration.y).toBe(0);

    // Planet should have non-zero acceleration toward sun
    expect(planet.acceleration.x).toBeLessThan(0);
  });

  it('with N-body disabled, only computes sun-planet forces', () => {
    const sun: Body = {
      id: 'sun', mass: 10000, position: vec2(500, 500),
      velocity: vec2(0, 0), acceleration: vec2(0, 0),
      prevPosition: vec2(500, 500), radius: 25,
      isAnchor: true, color: '#ffd54f', escapedAt: 0,
      name: 'Sun', muted: false, soloed: false,
    };
    const p1 = makeBody('p1', 600, 500, 10);
    const p2 = makeBody('p2', 400, 500, 10);

    computeForces([sun, p1, p2], sun, 1.0, 5.0, false);

    // Each planet should be attracted toward sun
    expect(p1.acceleration.x).toBeLessThan(0); // sun is to the left
    expect(p2.acceleration.x).toBeGreaterThan(0); // sun is to the right
  });

  it('with N-body enabled, planets also interact with each other', () => {
    const sun: Body = {
      id: 'sun', mass: 10000, position: vec2(500, 500),
      velocity: vec2(0, 0), acceleration: vec2(0, 0),
      prevPosition: vec2(500, 500), radius: 25,
      isAnchor: true, color: '#ffd54f', escapedAt: 0,
      name: 'Sun', muted: false, soloed: false,
    };
    const p1 = makeBody('p1', 550, 500, 1000); // heavy planet
    const p2 = makeBody('p2', 560, 500, 1000); // close to p1

    // Without N-body
    computeForces([sun, p1, p2], sun, 1.0, 5.0, false);
    const acc1_noNBody = { x: p1.acceleration.x, y: p1.acceleration.y };

    // With N-body
    p1.acceleration = vec2(0, 0);
    p2.acceleration = vec2(0, 0);
    computeForces([sun, p1, p2], sun, 1.0, 5.0, true);

    // With N-body, p1 should have extra acceleration from p2
    // (p2 is to the right of p1, so p1 should be pulled more to the right)
    expect(p1.acceleration.x).toBeGreaterThan(acc1_noNBody.x);
  });
});
