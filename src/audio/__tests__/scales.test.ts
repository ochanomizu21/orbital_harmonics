/**
 * Tests for musical scale definitions and note array generation.
 * These ensure correct scale intervals, root transposition, and octave stacking.
 */

import { describe, it, expect } from 'vitest';
import { SCALES, noteToMidi, generateNoteArray, midiToFrequency } from '../scales.js';

describe('SCALES', () => {
  it('has 7 modes defined', () => {
    expect(Object.keys(SCALES).length).toBe(7);
  });

  it('each mode has 7 intervals starting at 0', () => {
    for (const [mode, intervals] of Object.entries(SCALES)) {
      expect(intervals.length, `Mode ${mode} should have 7 intervals`).toBe(7);
      expect(intervals[0], `${mode} should start at 0`).toBe(0);
    }
  });

  it('Lydian mode has the sharp 4th (interval 6)', () => {
    expect(SCALES.lydian).toEqual([0, 2, 4, 6, 7, 9, 11]);
  });

  it('Ionian (major) has standard intervals', () => {
    expect(SCALES.ionian).toEqual([0, 2, 4, 5, 7, 9, 11]);
  });
});

describe('noteToMidi', () => {
  it('maps C to 0', () => {
    expect(noteToMidi('C')).toBe(0);
  });

  it('maps A to 9', () => {
    expect(noteToMidi('A')).toBe(9);
  });

  it('maps C# to 1', () => {
    expect(noteToMidi('C#')).toBe(1);
  });

  it('maps Db to 1 (enharmonic equivalent)', () => {
    expect(noteToMidi('Db')).toBe(1);
  });

  it('maps B to 11', () => {
    expect(noteToMidi('B')).toBe(11);
  });
});

describe('generateNoteArray', () => {
  it('generates notes for C Lydian octave 4 only', () => {
    const notes = generateNoteArray('C', 'lydian', 4, 4);
    // C Lydian: C D E F# G A B = 0 2 4 6 7 9 11 + octave*12
    // Octave 4: (4+1)*12+interval = 60,62,64,66,67,69,71
    expect(notes).toEqual([60, 62, 64, 66, 67, 69, 71]);
  });

  it('generates notes across multiple octaves', () => {
    const notes = generateNoteArray('C', 'lydian', 2, 3);
    expect(notes.length).toBe(14); // 7 notes × 2 octaves
    expect(notes[0]).toBe(36); // C2 = (2+1)*12+0 = 36
    expect(notes[notes.length - 1]).toBe(59); // B3 = (3+1)*12+11 = 59
  });

  it('notes are sorted ascending', () => {
    const notes = generateNoteArray('F#', 'phrygian', 2, 5);
    for (let i = 1; i < notes.length; i++) {
      expect(notes[i]).toBeGreaterThan(notes[i - 1]);
    }
  });

  it('generates correct C Lydian from octave 3 to 5', () => {
    const notes = generateNoteArray('C', 'lydian', 3, 5);
    // 7 notes × 3 octaves = 21 notes
    expect(notes.length).toBe(21);
    // First note: C3 = (3+1)*12+0 = 48
    expect(notes[0]).toBe(48);
    // Last note: B5 = (5+1)*12+11 = 83
    expect(notes[notes.length - 1]).toBe(83);
  });
});

describe('midiToFrequency', () => {
  it('A4 (MIDI 69) = 440 Hz', () => {
    expect(midiToFrequency(69)).toBeCloseTo(440);
  });

  it('C4 (MIDI 60) ≈ 261.63 Hz', () => {
    expect(midiToFrequency(60)).toBeCloseTo(261.63, 1);
  });

  it('each octave doubles frequency', () => {
    const f1 = midiToFrequency(60); // C4
    const f2 = midiToFrequency(72); // C5
    expect(f2 / f1).toBeCloseTo(2);
  });
});
