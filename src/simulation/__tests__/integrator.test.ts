/**
 * Tests for Velocity Verlet integration.
 * Validates energy conservation and correct position/velocity updates.
 */

import { describe, it, expect } from 'vitest';
import { positionUpdate, velocityUpdate, saveAccelerations } from '../integrator.js';
import type { Body } from '../types.js';
import { vec2 } from '../../lib/math.js';

function makePlanet(x: number, y: number, vx: number, vy: number, mass: number): Body {
  return {
    id: 'test',
    mass,
    position: vec2(x, y),
    velocity: vec2(vx, vy),
    acceleration: vec2(0, 0),
    prevPosition: vec2(x, y),
    radius: 5,
    isAnchor: false,
    color: '#fff',
    escapedAt: 0,
    name: 'Test',
    muted: false,
    soloed: false,
  };
}

describe('positionUpdate', () => {
  it('updates position using current velocity and acceleration', () => {
    const body = makePlanet(0, 0, 10, 0, 1);
    body.acceleration = vec2(5, 0);

    positionUpdate([body], 1);

    // x = 0 + 10*1 + 0.5*5*1² = 12.5
    expect(body.position.x).toBeCloseTo(12.5);
    expect(body.position.y).toBeCloseTo(0);
  });

  it('stores prevPosition before update', () => {
    const body = makePlanet(5, 10, 0, 0, 1);
    positionUpdate([body], 1);

    expect(body.prevPosition.x).toBe(5);
    expect(body.prevPosition.y).toBe(10);
  });

  it('does not move anchor bodies', () => {
    const sun: Body = {
      id: 'sun', mass: 10000,
      position: vec2(500, 500),
      velocity: vec2(0, 0),
      acceleration: vec2(10, 10),
      prevPosition: vec2(500, 500),
      radius: 25, isAnchor: true, color: '#ffd54f',
      escapedAt: 0, name: 'Sun', muted: false, soloed: false,
    };

    positionUpdate([sun], 1);

    expect(sun.position.x).toBe(500);
    expect(sun.position.y).toBe(500);
  });
});

describe('velocityUpdate', () => {
  it('updates velocity using average of old and new acceleration', () => {
    const body = makePlanet(0, 0, 0, 0, 1);
    const oldAcc = [{ x: 2, y: 0 }];
    body.acceleration = vec2(4, 0);

    velocityUpdate([body], oldAcc, 1);

    // v = 0 + 0.5 * (2 + 4) * 1 = 3
    expect(body.velocity.x).toBeCloseTo(3);
    expect(body.velocity.y).toBeCloseTo(0);
  });
});

describe('saveAccelerations', () => {
  it('saves current accelerations', () => {
    const body = makePlanet(0, 0, 0, 0, 1);
    body.acceleration = vec2(5, 10);

    const saved = saveAccelerations([body]);

    expect(saved[0]).toEqual({ x: 5, y: 10 });
  });
});

describe('Velocity Verlet integration (full step)', () => {
  it('conserves energy in a circular orbit (approximately)', () => {
    // Set up a circular orbit around the origin
    // For a circular orbit: v = sqrt(GM/r), with G=1, M=10000, r=200
    // v = sqrt(10000/200) = sqrt(50) ≈ 7.07
    const r = 200;
    const v = Math.sqrt(10000 / r);

    const body = makePlanet(r, 0, 0, v, 1);

    // Initial energy
    const initialKE = 0.5 * body.mass * (body.velocity.x ** 2 + body.velocity.y ** 2);
    const initialPE = -10000 * body.mass / r;
    const initialE = initialKE + initialPE;

    // Simulate for 100 steps
    const dt = 1 / 60;
    const sun: Body = {
      id: 'sun', mass: 10000, position: vec2(0, 0),
      velocity: vec2(0, 0), acceleration: vec2(0, 0),
      prevPosition: vec2(0, 0), radius: 25,
      isAnchor: true, color: '#ffd54f', escapedAt: 0,
      name: 'Sun', muted: false, soloed: false,
    };

    for (let step = 0; step < 100; step++) {
      // Compute forces
      const dx = sun.position.x - body.position.x;
      const dy = sun.position.y - body.position.y;
      const distSq = dx * dx + dy * dy + 25; // softening
      const dist = Math.sqrt(distSq);
      const forceMag = (1 * body.mass * sun.mass) / distSq;
      body.acceleration.x = forceMag * (dx / dist) / body.mass;
      body.acceleration.y = forceMag * (dy / dist) / body.mass;

      // Save old acceleration
      const oldAcc = saveAccelerations([body]);

      // Position update
      positionUpdate([body], dt);

      // Recompute forces at new position
      const dx2 = sun.position.x - body.position.x;
      const dy2 = sun.position.y - body.position.y;
      const distSq2 = dx2 * dx2 + dy2 * dy2 + 25;
      const dist2 = Math.sqrt(distSq2);
      const forceMag2 = (1 * body.mass * sun.mass) / distSq2;
      body.acceleration.x = forceMag2 * (dx2 / dist2) / body.mass;
      body.acceleration.y = forceMag2 * (dy2 / dist2) / body.mass;

      // Velocity update
      velocityUpdate([body], oldAcc, dt);
    }

    // Check energy conservation (should be within 5% due to softening and finite dt)
    const finalKE = 0.5 * body.mass * (body.velocity.x ** 2 + body.velocity.y ** 2);
    const finalDist = Math.sqrt(
      (body.position.x - sun.position.x) ** 2 +
      (body.position.y - sun.position.y) ** 2,
    );
    const finalPE = -10000 * body.mass / finalDist;
    const finalE = finalKE + finalPE;

    // Energy should be approximately conserved (within 10% for this simplified test)
    expect(Math.abs((finalE - initialE) / initialE)).toBeLessThan(0.1);
  });
});
