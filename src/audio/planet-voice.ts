/**
 * Per-planet synth voice management.
 * Creates, updates, and disposes synth voices with the correct signal chain:
 *   Synth → [Filter] → Gain → Pan → Effects Bus
 *
 * Saw/square synths run through a low-pass Filter for velocity-modulated cutoff.
 * The PlanetVoice stores both the synth (for triggering) and optional filter,
 * avoiding the prior bug where the Filter node was returned as the "synth" and
 * notes could not be triggered.
 */

import * as Tone from 'tone';
import type { SynthType } from './types.js';
import type { EffectsChain } from './effects.js';

export interface PlanetVoice {
  planetId: string;
  /** The actual triggerable synth — always the Tone.Synth/FMSynth/PluckSynth */
  synth: Tone.Synth | Tone.FMSynth | Tone.PluckSynth;
  /** Optional low-pass filter for saw/square types (null for others) */
  filter: Tone.Filter | null;
  gainNode: Tone.Gain;
  panNode: Tone.Panner;
  synthType: SynthType;
  /** User-set volume (0–1), tracked separately so mute/unmute can restore it */
  userVolume: number;
  /** Whether this voice is muted — when true, triggerNote is a no-op */
  muted: boolean;
}

/**
 * Create a synth instance based on the given type.
 * Returns the triggerable synth node and optional filter.
 */
function createSynth(type: SynthType): {
  synth: Tone.Synth | Tone.FMSynth | Tone.PluckSynth;
  filter: Tone.Filter | null;
} {
  switch (type) {
    case 'sine':
      return {
        synth: new Tone.Synth({
          oscillator: { type: 'sine' },
          envelope: { attack: 0.01, decay: 0.3, sustain: 0.2, release: 0.5 },
        }),
        filter: null,
      };
    case 'triangle':
      return {
        synth: new Tone.Synth({
          oscillator: { type: 'triangle' },
          envelope: { attack: 0.01, decay: 0.3, sustain: 0.2, release: 0.5 },
        }),
        filter: null,
      };
    case 'sawtooth': {
      const synth = new Tone.Synth({
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.005, decay: 0.2, sustain: 0.1, release: 0.3 },
      });
      const filter = new Tone.Filter(2000, 'lowpass');
      synth.connect(filter);
      return { synth, filter };
    }
    case 'square': {
      const synth = new Tone.Synth({
        oscillator: { type: 'square' },
        envelope: { attack: 0.005, decay: 0.2, sustain: 0.1, release: 0.3 },
      });
      const filter = new Tone.Filter(2000, 'lowpass');
      synth.connect(filter);
      return { synth, filter };
    }
    case 'fm':
      return {
        synth: new Tone.FMSynth({
          harmonicity: 1,
          modulationIndex: 10,
          envelope: { attack: 0.01, decay: 0.5, sustain: 0.3, release: 0.8 },
        }),
        filter: null,
      };
    case 'marimba':
      return {
        synth: new Tone.PluckSynth({
          attackNoise: 2,
          dampening: 4000,
          resonance: 0.9,
        }),
        filter: null,
      };
    case 'bell':
      return {
        synth: new Tone.FMSynth({
          harmonicity: 3.5,
          modulationIndex: 14,
          envelope: { attack: 0.01, decay: 1.0, sustain: 0.1, release: 1.5 },
        }),
        filter: null,
      };
    case 'pluck':
      return {
        synth: new Tone.PluckSynth({
          attackNoise: 1,
          dampening: 3000,
          resonance: 0.95,
        }),
        filter: null,
      };
  }
}

/**
 * Create a full voice chain for a planet: Synth → [Filter] → Gain → Pan → Effects.
 */
export function createVoice(
  planetId: string,
  synthType: SynthType,
  effects: EffectsChain,
): PlanetVoice {
  const { synth, filter } = createSynth(synthType);
  const gainNode = new Tone.Gain(0.5);
  const panNode = new Tone.Panner(0);

  // Connect: synth → [filter] → gain → pan → effects
  const outputNode = filter ?? synth;
  outputNode.connect(gainNode);
  gainNode.connect(panNode);
  panNode.connect(effects.input);

  return { planetId, synth, filter, gainNode, panNode, synthType, userVolume: 0.5, muted: false };
}

/**
 * Trigger a note on a voice.
 * Applies velocity → timbre modulation per spec §06.7.
 * No-op if the voice is muted.
 */
export function triggerNote(
  voice: PlanetVoice,
  frequency: number,
  duration: string,
  velocity: number,
  normalizedVelocity: number,
): void {
  // Skip entirely if muted — avoids overriding gain set by mutePlanet
  if (voice.muted) return;

  const synth = voice.synth;

  // Apply velocity → timbre modulation based on synth type
  applyVelocityTimbre(voice, normalizedVelocity);

  // Set volume: user volume × velocity dynamics
  voice.gainNode.gain.value = voice.userVolume * velocity;

  // Trigger the note
  if (synth instanceof Tone.PluckSynth) {
    synth.triggerAttack(frequency);
  } else if (synth instanceof Tone.FMSynth) {
    synth.triggerAttackRelease(frequency, duration);
  } else if (synth instanceof Tone.Synth) {
    synth.triggerAttackRelease(frequency, duration);
  }
}

/**
 * Apply velocity → timbre modulation per spec §06.7:
 * - Sine/Triangle: velocity → envelope attack (faster = shorter, more percussive)
 * - Saw/Square: velocity → low-pass filter cutoff (faster = brighter)
 * - FM/Bell: velocity → modulation index (faster = more metallic harmonics)
 * - Pluck/Marimba: velocity → decay/resonance (faster = longer sustain)
 */
function applyVelocityTimbre(voice: PlanetVoice, normalizedVelocity: number): void {
  const synth = voice.synth;

  switch (voice.synthType) {
    case 'sine':
    case 'triangle': {
      // Velocity → envelope attack: faster (high velocity) = shorter attack (more percussive)
      // Range: 0.001s (fast/velocity=1) to 0.05s (slow/velocity=0)
      if (synth instanceof Tone.Synth) {
        synth.envelope.attack = 0.05 - normalizedVelocity * 0.049;
      }
      break;
    }
    case 'sawtooth':
    case 'square': {
      // Velocity → low-pass filter cutoff: faster = brighter
      // Range: 200Hz (slow) to 8000Hz (fast) per spec §06.7
      if (voice.filter) {
        voice.filter.frequency.value = 200 + normalizedVelocity * 7800;
      }
      break;
    }
    case 'fm':
    case 'bell': {
      // Velocity → modulation index: faster = more metallic harmonics
      // Range: 1 (slow) to 20 (fast) per spec §06.7
      if (synth instanceof Tone.FMSynth) {
        synth.modulationIndex.value = 1 + normalizedVelocity * 19;
      }
      break;
    }
    case 'marimba':
    case 'pluck': {
      // Velocity → decay length: faster = longer sustain
      // PluckSynth uses resonance and dampening to control decay
      if (synth instanceof Tone.PluckSynth) {
        // Higher velocity → higher dampening (longer sustain)
        // Range: 1000 (short/damped) to 6000 (long/ringing)
        synth.dampening = 1000 + normalizedVelocity * 5000;
      }
      break;
    }
  }
}

/**
 * Dispose a voice and all its audio nodes.
 */
export function disposeVoice(voice: PlanetVoice): void {
  try {
    voice.synth.dispose();
  } catch {
    // Best effort disposal
  }
  if (voice.filter) {
    try {
      voice.filter.dispose();
    } catch {
      // Best effort
    }
  }
  voice.gainNode.dispose();
  voice.panNode.dispose();
}

/**
 * Update a voice's synth type by disposing the old synth and creating a new one.
 * Reconnects to the existing gain/pan chain.
 */
export function updateVoiceSynth(
  voice: PlanetVoice,
  newType: SynthType,
): PlanetVoice {
  // Disconnect and dispose old synth and filter
  try {
    voice.synth.disconnect();
    voice.synth.dispose();
  } catch {
    // Best effort
  }
  if (voice.filter) {
    try {
      voice.filter.disconnect();
      voice.filter.dispose();
    } catch {
      // Best effort
    }
  }

  // Create new synth + optional filter
  const { synth, filter } = createSynth(newType);

  // Connect output to existing gain node
  const outputNode = filter ?? synth;
  outputNode.connect(voice.gainNode);

  return { ...voice, synth, filter, synthType: newType };
}
