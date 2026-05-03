/**
 * Vector2 operations and math utilities for the simulation engine.
 * All operations return new objects — no mutation.
 */

export interface Vector2 {
  x: number;
  y: number;
}

export function vec2(x: number, y: number): Vector2 {
  return { x, y };
}

export function add(a: Vector2, b: Vector2): Vector2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function sub(a: Vector2, b: Vector2): Vector2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function scale(v: Vector2, s: number): Vector2 {
  return { x: v.x * s, y: v.y * s };
}

export function magnitude(v: Vector2): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

export function magnitudeSq(v: Vector2): number {
  return v.x * v.x + v.y * v.y;
}

export function normalize(v: Vector2): Vector2 {
  const mag = magnitude(v);
  if (mag === 0) return { x: 0, y: 0 };
  return { x: v.x / mag, y: v.y / mag };
}

export function dot(a: Vector2, b: Vector2): number {
  return a.x * b.x + a.y * b.y;
}

export function distance(a: Vector2, b: Vector2): number {
  return magnitude(sub(a, b));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number {
  const t = clamp((value - inMin) / (inMax - inMin), 0, 1);
  return outMin + t * (outMax - outMin);
}
