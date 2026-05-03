/**
 * Default constants for the simulation engine.
 * Values per spec §02.9 and §06.6.
 */

/** Gravitational constant (tunable as "Gravity Strength") */
export const G = 1.0;

/** Softening parameter to prevent singularities at near-zero distance */
export const SOFTENING = 5.0;

/** Fixed time step matching RAF frame rate */
export const DT = 1 / 60;

/** Default sun mass */
export const SUN_MASS = 10000;

/** Converts pixel-drag-distance into simulation velocity units */
export const VELOCITY_MULTIPLIER = 0.05;

/** Minimum planet mass */
export const MIN_MASS = 1;

/** Maximum planet mass */
export const MAX_MASS = 50;

/** Minimum visual radius in pixels */
export const MIN_RADIUS = 4;

/** Maximum visual radius in pixels */
export const MAX_RADIUS = 20;

/** Distance threshold multiplier for escape detection (× canvas diagonal) */
export const ESCAPE_DISTANCE_FACTOR = 2;

/** Grace period in ms before an escaped planet is removed */
export const ESCAPE_GRACE_PERIOD = 5000;

/** Compute visual radius from mass: mass^(1/3) * 2, clamped to [4, 20] */
export function massToRadius(mass: number): number {
  return Math.max(MIN_RADIUS, Math.min(MAX_RADIUS, Math.pow(mass, 1 / 3) * 2));
}
