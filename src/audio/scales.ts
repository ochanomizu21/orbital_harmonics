/**
 * Musical scale definitions and note array generation.
 * All 7 standard modes per spec §06.3.3.
 */

import type { ScaleMode } from './types.js';

/** Semitone intervals from root for each mode */
export const SCALES: Record<ScaleMode, number[]> = {
  ionian:     [0, 2, 4, 5, 7, 9, 11],
  dorian:     [0, 2, 3, 5, 7, 9, 10],
  phrygian:   [0, 1, 3, 5, 7, 8, 10],
  lydian:     [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  aeolian:    [0, 2, 3, 5, 7, 8, 10],
  locrian:    [0, 1, 3, 5, 6, 8, 10],
};

/** Root note name → semitone offset from C */
const ROOT_SEMITONES: Record<string, number> = {
  'C': 0, 'C#': 1, 'Db': 1,
  'D': 2, 'D#': 3, 'Eb': 3,
  'E': 4,
  'F': 5, 'F#': 6, 'Gb': 6,
  'G': 7, 'G#': 8, 'Ab': 8,
  'A': 9, 'A#': 10, 'Bb': 10,
  'B': 11,
};

/** Convert a root note name to its semitone offset from C */
export function noteToMidi(root: string): number {
  return ROOT_SEMITONES[root] ?? 0;
}

/**
 * Generate the full array of MIDI note numbers for a given root, mode, and octave range.
 * Notes are sorted ascending.
 */
export function generateNoteArray(
  root: string,
  mode: ScaleMode,
  octaveMin: number,
  octaveMax: number,
): number[] {
  const rootMidi = noteToMidi(root);
  const intervals = SCALES[mode];
  const notes: number[] = [];

  for (let octave = octaveMin; octave <= octaveMax; octave++) {
    for (const interval of intervals) {
      notes.push(rootMidi + interval + (octave + 1) * 12);
    }
  }

  return notes.sort((a, b) => a - b);
}

/** MIDI note number → frequency in Hz (A4 = 440Hz) */
export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}
