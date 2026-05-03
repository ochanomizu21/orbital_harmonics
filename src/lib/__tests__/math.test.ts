/**
 * Tests for Vector2 operations and math utilities.
 * These are foundational — every other module depends on these being correct.
 */

import { describe, it, expect } from 'vitest';
import {
  vec2, add, sub, scale, magnitude, magnitudeSq,
  normalize, dot, distance, lerp, clamp, mapRange,
} from '../math.js';

describe('vec2', () => {
  it('creates a vector with x and y', () => {
    const v = vec2(3, 4);
    expect(v.x).toBe(3);
    expect(v.y).toBe(4);
  });
});

describe('add', () => {
  it('adds two vectors', () => {
    const result = add(vec2(1, 2), vec2(3, 4));
    expect(result).toEqual({ x: 4, y: 6 });
  });

  it('returns a new vector (no mutation)', () => {
    const a = vec2(1, 2);
    const b = vec2(3, 4);
    add(a, b);
    expect(a).toEqual({ x: 1, y: 2 });
    expect(b).toEqual({ x: 3, y: 4 });
  });
});

describe('sub', () => {
  it('subtracts two vectors', () => {
    const result = sub(vec2(5, 7), vec2(2, 3));
    expect(result).toEqual({ x: 3, y: 4 });
  });
});

describe('scale', () => {
  it('scales a vector by a scalar', () => {
    const result = scale(vec2(2, 3), 5);
    expect(result).toEqual({ x: 10, y: 15 });
  });

  it('handles zero scaling', () => {
    const result = scale(vec2(5, 10), 0);
    expect(result).toEqual({ x: 0, y: 0 });
  });

  it('handles negative scaling', () => {
    const result = scale(vec2(1, 2), -3);
    expect(result).toEqual({ x: -3, y: -6 });
  });
});

describe('magnitude', () => {
  it('computes magnitude of a 3-4-5 triangle', () => {
    expect(magnitude(vec2(3, 4))).toBe(5);
  });

  it('returns 0 for zero vector', () => {
    expect(magnitude(vec2(0, 0))).toBe(0);
  });

  it('handles negative components', () => {
    expect(magnitude(vec2(-3, -4))).toBe(5);
  });
});

describe('magnitudeSq', () => {
  it('computes squared magnitude', () => {
    expect(magnitudeSq(vec2(3, 4))).toBe(25);
  });
});

describe('normalize', () => {
  it('normalizes a vector to unit length', () => {
    const result = normalize(vec2(3, 4));
    expect(result.x).toBeCloseTo(0.6);
    expect(result.y).toBeCloseTo(0.8);
  });

  it('returns zero for zero vector', () => {
    const result = normalize(vec2(0, 0));
    expect(result).toEqual({ x: 0, y: 0 });
  });
});

describe('dot', () => {
  it('computes dot product of perpendicular vectors as 0', () => {
    expect(dot(vec2(1, 0), vec2(0, 1))).toBe(0);
  });

  it('computes dot product of parallel vectors', () => {
    expect(dot(vec2(2, 3), vec2(4, 6))).toBe(26);
  });
});

describe('distance', () => {
  it('computes distance between two points', () => {
    expect(distance(vec2(0, 0), vec2(3, 4))).toBe(5);
  });

  it('returns 0 for same point', () => {
    expect(distance(vec2(5, 5), vec2(5, 5))).toBe(0);
  });
});

describe('lerp', () => {
  it('interpolates at t=0 (returns a)', () => {
    expect(lerp(10, 20, 0)).toBe(10);
  });

  it('interpolates at t=1 (returns b)', () => {
    expect(lerp(10, 20, 1)).toBe(20);
  });

  it('interpolates at t=0.5 (midpoint)', () => {
    expect(lerp(10, 20, 0.5)).toBe(15);
  });
});

describe('clamp', () => {
  it('clamps value within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('clamps value below minimum', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it('clamps value above maximum', () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });
});

describe('mapRange', () => {
  it('maps a value from one range to another', () => {
    expect(mapRange(5, 0, 10, 0, 100)).toBe(50);
  });

  it('maps minimum value', () => {
    expect(mapRange(0, 0, 10, 0, 100)).toBe(0);
  });

  it('maps maximum value', () => {
    expect(mapRange(10, 0, 10, 0, 100)).toBe(100);
  });

  it('clamps out-of-range values', () => {
    expect(mapRange(-5, 0, 10, 0, 100)).toBe(0);
    expect(mapRange(15, 0, 10, 0, 100)).toBe(100);
  });
});
