/**
 * Distance → pitch quantizer.
 * Maps a planet's radial distance from the sun to a quantized MIDI note.
 * Close = high pitch, far = low pitch (per spec §06.3).
 */

import { clamp } from '../lib/math.js';

const MIN_DISTANCE = 50;
const MAX_DISTANCE = 400;

/**
 * Map a radial distance to a MIDI note number from the given scale notes.
 * Close to sun = high pitch, far from sun = low pitch.
 */
export function distanceToNote(
  distance: number,
  scaleNotes: number[],
  minDistance: number = MIN_DISTANCE,
  maxDistance: number = MAX_DISTANCE,
): number {
  if (scaleNotes.length === 0) return 60; // middle C fallback

  // Normalize to [0, 1]
  const normalized = clamp(
    (distance - minDistance) / (maxDistance - minDistance),
    0,
    1,
  );

  // Reverse: close = high pitch (high index), far = low pitch (low index)
  const index = Math.floor((1 - normalized) * (scaleNotes.length - 1));
  return scaleNotes[clamp(index, 0, scaleNotes.length - 1)];
}
