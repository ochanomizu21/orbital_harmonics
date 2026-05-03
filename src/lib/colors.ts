/**
 * Color utilities and planet color palette.
 * Palette per spec §04.6.3 — vibrant, distinguishable colors that cycle as planets spawn.
 */

/** Curated planet palette from spec */
export const PLANET_PALETTE = [
  '#4fc3f7', '#81c784', '#fff176', '#ff8a65', '#ce93d8',
  '#f06292', '#4dd0e1', '#aed581', '#ffb74d', '#ba68c8',
] as const;

let paletteIndex = 0;

/** Get next color from the palette, cycling when exhausted */
export function nextPaletteColor(): string {
  const color = PLANET_PALETTE[paletteIndex % PLANET_PALETTE.length];
  paletteIndex++;
  return color;
}

/** Reset the palette index (e.g., on full reset) */
export function resetPaletteIndex(): void {
  paletteIndex = 0;
}

/** Parse a hex color to RGB components */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

/** Create an rgba() string from hex color and alpha */
export function hexToRgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}
