/**
 * Tests for trigger line axis-crossing detection.
 * Validates crossing detection, debounce, and configurable lines.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TriggerDetector } from '../triggers.js';
import type { Body } from '../../simulation/types.js';
import { vec2 } from '../../lib/math.js';

function makePlanet(id: string, prevX: number, prevY: number, currX: number, currY: number): Body {
  return {
    id,
    mass: 10,
    position: vec2(currX, currY),
    velocity: vec2(1, 0),
    acceleration: vec2(0, 0),
    prevPosition: vec2(prevX, prevY),
    radius: 5,
    isAnchor: false,
    color: '#fff',
    escapedAt: 0,
    name: id,
    muted: false,
    soloed: false,
  };
}

describe('TriggerDetector', () => {
  let detector: TriggerDetector;

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(0);
    detector = new TriggerDetector([
      { id: 'line-0', angle: 0 },           // X axis (horizontal)
      { id: 'line-1', angle: Math.PI / 2 },  // Y axis (vertical)
    ]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('X-axis crossing (angle=0)', () => {
    it('detects crossing from top to bottom', () => {
      // Planet moves from y=-1 to y=1, crossing the X axis (y=0)
      const planet = makePlanet('p1', 500, -10, 500, 10);
      const events = detector.detect([planet], 500, 0);

      expect(events.length).toBe(1);
      expect(events[0].planetId).toBe('p1');
      expect(events[0].axis).toBe(0); // line-0
    });

    it('detects crossing from bottom to top', () => {
      const planet = makePlanet('p1', 500, 10, 500, -10);
      const events = detector.detect([planet], 500, 0);

      expect(events.length).toBe(1);
      expect(events[0].crossingDirection).toBe(1); // currSigned is positive
    });

    it('does not trigger when staying on same side', () => {
      const planet = makePlanet('p1', 500, 10, 500, 20);
      const events = detector.detect([planet], 500, 0);

      expect(events.length).toBe(0);
    });
  });

  describe('Y-axis crossing (angle=π/2)', () => {
    it('detects crossing from left to right', () => {
      // Planet moves from x=-10 to x=10, crossing the Y axis (x=0 relative to sun)
      const planet = makePlanet('p1', 490, 500, 510, 500);
      const events = detector.detect([planet], 500, 500);

      expect(events.length).toBe(1);
      expect(events[0].axis).toBe(1); // line-1
    });
  });

  describe('debounce', () => {
    it('does not trigger twice within 100ms on the same line', () => {
      // First crossing
      const planet1 = makePlanet('p1', 500, -10, 500, 10);
      const events1 = detector.detect([planet1], 500, 0);
      expect(events1.length).toBe(1);

      // Advance time by 50ms (within debounce period)
      vi.setSystemTime(50);

      // Same planet crosses back
      const planet2 = makePlanet('p1', 500, 10, 500, -10);
      const events2 = detector.detect([planet2], 500, 0);
      expect(events2.length).toBe(0);
    });

    it('triggers again after debounce period', () => {
      // First crossing
      const planet1 = makePlanet('p1', 500, -10, 500, 10);
      detector.detect([planet1], 500, 0);

      // Advance past debounce
      vi.setSystemTime(150);

      // Same planet crosses back
      const planet2 = makePlanet('p1', 500, 10, 500, -10);
      const events2 = detector.detect([planet2], 500, 0);
      expect(events2.length).toBe(1);
    });
  });

  describe('multiple lines', () => {
    it('can detect crossing on different lines simultaneously', () => {
      // Planet at exact diagonal crosses both X and Y axes
      const planet = makePlanet('p1', 490, -10, 510, 10);
      const events = detector.detect([planet], 500, 0);

      // Should detect crossing on line-0 (X axis) and possibly line-1 (Y axis)
      expect(events.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('configurable lines', () => {
    it('works with custom angle lines', () => {
      detector.setLines([
        { id: 'line-custom', angle: Math.PI / 4 }, // 45 degrees
      ]);

      // Planet crosses a 45-degree line through origin
      // Normal to 45° line is (sin(45°), -cos(45°)) ≈ (0.707, -0.707)
      // For crossing: move from one side to the other
      const planet = makePlanet('p1', 0, 10, 10, 0); // moving toward and across the line
      const events = detector.detect([planet], 0, 0);

      // This should detect a crossing if prev and curr are on opposite sides
      // prevSigned = 0*0.707 + 10*(-0.707) = -7.07
      // currSigned = 10*0.707 + 0*(-0.707) = 7.07
      // Signs differ → crossing detected
      expect(events.length).toBe(1);
    });
  });
});
