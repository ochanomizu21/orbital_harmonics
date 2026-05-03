/**
 * Audio engine type definitions.
 */

export type SynthType = 'sine' | 'triangle' | 'sawtooth' | 'square' | 'fm' | 'marimba' | 'bell' | 'pluck';

export type ScaleMode =
  | 'ionian' | 'dorian' | 'phrygian' | 'lydian'
  | 'mixolydian' | 'aeolian' | 'locrian';

export interface ScaleConfig {
  root: string;
  mode: ScaleMode;
  octaveRange: [number, number];
}

export interface TriggerEvent {
  planetId: string;
  axis: number;           // trigger line index
  crossingDirection: 1 | -1;
  distance: number;
  velocity: number;
  angle: number;
}

export const SYNTH_LABELS: Record<SynthType, string> = {
  sine: 'SIN',
  triangle: 'TRI',
  sawtooth: 'SAW',
  square: 'SQR',
  fm: 'FM',
  marimba: 'MAR',
  bell: 'BEL',
  pluck: 'PLK',
};
