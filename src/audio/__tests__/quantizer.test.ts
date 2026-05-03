/**
 * Tests for the distance → pitch quantizer.
 * Validates mapping, reversal (close=high), and edge cases.
 */

import { describe, it, expect } from 'vitest';
import { distanceToNote } from '../quantizer.js';

const C_LYDIAN_OCT3_5 = [
  48, 50, 52, 54, 55, 57, 59,  // octave 3
  60, 62, 64, 66, 67, 69, 71,  // octave 4
  72, 74, 76, 78, 79, 81, 83,  // octave 5
];

describe('distanceToNote', () => {
  it('maps close distances to high notes', () => {
    const note = distanceToNote(50, C_LYDIAN_OCT3_5); // minDistance
    // Normalized = 0, reversed = 1 → highest index → 83 (B5)
    expect(note).toBe(83);
  });

  it('maps far distances to low notes', () => {
    const note = distanceToNote(400, C_LYDIAN_OCT3_5); // maxDistance
    // Normalized = 1, reversed = 0 → lowest index → 48 (C3)
    expect(note).toBe(48);
  });

  it('maps mid-range to middle notes', () => {
    const note = distanceToNote(225, C_LYDIAN_OCT3_5); // midpoint
    // Normalized ≈ 0.5, reversed ≈ 0.5 → middle of array
    expect(note).toBeGreaterThan(48);
    expect(note).toBeLessThan(83);
  });

  it('clamps distances below minimum', () => {
    const note = distanceToNote(10, C_LYDIAN_OCT3_5);
    expect(note).toBe(83); // same as minDistance
  });

  it('clamps distances above maximum', () => {
    const note = distanceToNote(500, C_LYDIAN_OCT3_5);
    expect(note).toBe(48); // same as maxDistance
  });

  it('always returns a note from the scale', () => {
    for (let d = 40; d <= 420; d += 10) {
      const note = distanceToNote(d, C_LYDIAN_OCT3_5);
      expect(C_LYDIAN_OCT3_5).toContain(note);
    }
  });

  it('returns middle C fallback for empty scale', () => {
    const note = distanceToNote(200, []);
    expect(note).toBe(60);
  });

  it('uses custom min/max distance', () => {
    const notes = [60, 64, 67, 72];
    const note = distanceToNote(100, notes, 100, 200);
    // At min distance → highest note
    expect(note).toBe(72);
  });
});
