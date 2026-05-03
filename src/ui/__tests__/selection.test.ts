/**
 * Tests for planet selection helpers.
 * Validates findPlanetAt for click-to-select interaction.
 */

import { describe, it, expect } from 'vitest';
import { findPlanetAt } from '../selection.js';
import type { Body } from '../../simulation/types.js';
import { vec2 } from '../../lib/math.js';

function makeBody(id: string, x: number, y: number, radius: number = 10): Body {
  return {
    id,
    mass: 10,
    position: vec2(x, y),
    velocity: vec2(0, 0),
    acceleration: vec2(0, 0),
    prevPosition: vec2(x, y),
    radius,
    isAnchor: false,
    color: '#fff',
    escapedAt: 0,
    name: id,
    muted: false,
    soloed: false,
  };
}

const sun: Body = {
  id: 'sun',
  mass: 10000,
  position: vec2(500, 500),
  velocity: vec2(0, 0),
  acceleration: vec2(0, 0),
  prevPosition: vec2(500, 500),
  radius: 25,
  isAnchor: true,
  color: '#ffd54f',
  escapedAt: 0,
  name: 'Sun',
  muted: false,
  soloed: false,
};

describe('findPlanetAt', () => {
  it('returns null when no planet is at the coordinates', () => {
    const bodies = [sun, makeBody('p1', 100, 100)];
    expect(findPlanetAt(bodies, 200, 200)).toBeNull();
  });

  it('returns the planet at the given coordinates', () => {
    const p1 = makeBody('p1', 100, 100);
    const bodies = [sun, p1];
    expect(findPlanetAt(bodies, 100, 100)).toBe(p1);
  });

  it('finds planet within radius tolerance (5px)', () => {
    const p1 = makeBody('p1', 100, 100, 10);
    const bodies = [sun, p1];
    // 13px away from center, radius=10+5=15 tolerance → should find
    expect(findPlanetAt(bodies, 113, 100)).toBe(p1);
    // 16px away → should not find
    expect(findPlanetAt(bodies, 116, 100)).toBeNull();
  });

  it('skips the sun (isAnchor)', () => {
    const bodies = [sun];
    expect(findPlanetAt(bodies, 500, 500)).toBeNull();
  });

  it('returns the last (topmost) planet when multiple overlap', () => {
    const p1 = makeBody('p1', 100, 100);
    const p2 = makeBody('p2', 100, 100);
    const bodies = [sun, p1, p2];
    // Both at same position; should return p2 (last in array)
    expect(findPlanetAt(bodies, 100, 100)).toBe(p2);
  });

  it('returns null for empty body list', () => {
    expect(findPlanetAt([], 100, 100)).toBeNull();
  });
});
