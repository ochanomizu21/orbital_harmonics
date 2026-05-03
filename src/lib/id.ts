/**
 * Unique ID generator for celestial bodies.
 * Simple counter-based IDs are sufficient — no need for UUIDs.
 */

let counter = 0;

/** Generate a unique body ID */
export function generateId(): string {
  return `body-${++counter}`;
}

/** Reset the counter (e.g., on full reset) */
export function resetIdCounter(): void {
  counter = 0;
}
