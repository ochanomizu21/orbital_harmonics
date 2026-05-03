/**
 * Trigger line crossing detection.
 * Detects when a planet crosses a trigger line using signed distance sign change.
 * Includes debounce per planet per line.
 */

import type { Body } from '../simulation/types.js';
import type { TriggerEvent } from './types.js';
import type { TriggerLineState } from '../state/types.js';

const DEBOUNCE_MS = 100;

export class TriggerDetector {
  private lastTriggerTime = new Map<string, number>();
  private triggerLines: TriggerLineState[] = [];

  constructor(lines: TriggerLineState[]) {
    this.triggerLines = lines;
  }

  /** Update trigger lines (call when state changes) */
  setLines(lines: TriggerLineState[]): void {
    this.triggerLines = lines;
  }

  /**
   * Check all planets against all trigger lines for crossings.
   * Returns an array of TriggerEvents for any detected crossings.
   */
  detect(planets: Body[], sunX: number, sunY: number): TriggerEvent[] {
    const events: TriggerEvent[] = [];
    const now = Date.now();

    for (const planet of planets) {
      if (planet.isAnchor) continue;

      for (let li = 0; li < this.triggerLines.length; li++) {
        const line = this.triggerLines[li];
        const angle = line.angle;

        // Signed distance from line: positive on one side, negative on the other
        // Line goes through sun at (sunX, sunY) at the given angle
        // Normal to the line is (sin(angle), -cos(angle))
        const nx = Math.sin(angle);
        const ny = -Math.cos(angle);

        const prevDx = planet.prevPosition.x - sunX;
        const prevDy = planet.prevPosition.y - sunY;
        const currDx = planet.position.x - sunX;
        const currDy = planet.position.y - sunY;

        const prevSigned = prevDx * nx + prevDy * ny;
        const currSigned = currDx * nx + currDy * ny;

        // Crossing detected if signs differ (with epsilon tolerance for floating point noise)
        if (prevSigned * currSigned < -1e-10) {
          // Debounce check
          const debounceKey = `${planet.id}:${line.id}`;
          const lastTime = this.lastTriggerTime.get(debounceKey);
          if (lastTime !== undefined && now - lastTime < DEBOUNCE_MS) continue;

          this.lastTriggerTime.set(debounceKey, now);

          // Interpolate crossing position
          const t = Math.abs(prevSigned) / (Math.abs(prevSigned) + Math.abs(currSigned));
          const crossX = prevDx + t * (currDx - prevDx);
          const crossY = prevDy + t * (currDy - prevDy);

          const dist = Math.sqrt(crossX * crossX + crossY * crossY);
          const vel = Math.sqrt(
            planet.velocity.x * planet.velocity.x +
            planet.velocity.y * planet.velocity.y,
          );
          const angle2 = Math.atan2(crossY, crossX);
          const direction = currSigned > 0 ? 1 : -1;

          events.push({
            planetId: planet.id,
            axis: li,
            crossingDirection: direction as 1 | -1,
            distance: dist,
            velocity: vel,
            angle: angle2,
          });
        }
      }
    }

    return events;
  }
}
