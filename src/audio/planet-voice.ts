/**
 * Per-planet synth voice management.
 * Creates, updates, and disposes synth voices with the correct signal chain:
 *   Synth → Gain → Pan → Effects Bus
 */

import * as Tone from 'tone';
import type { SynthType } from './types.js';
import type { EffectsChain } from './effects.js';

export interface PlanetVoice {
  planetId: string;
  synth: Tone.ToneAudioNode;
  gainNode: Tone.Gain;
  panNode: Tone.Panner;
  synthType: SynthType;
}

/**
 * Create a synth instance based on the given type.
 * Returns a ToneAudioNode that can be triggered with triggerAttackRelease.
 */
function createSynth(type: SynthType): Tone.ToneAudioNode {
  switch (type) {
    case 'sine':
      return new Tone.Synth({
        oscillator: { type: 'sine' },
        envelope: { attack: 0.01, decay: 0.3, sustain: 0.2, release: 0.5 },
      });
    case 'triangle':
      return new Tone.Synth({
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.01, decay: 0.3, sustain: 0.2, release: 0.5 },
      });
    case 'sawtooth': {
      const synth = new Tone.Synth({
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.005, decay: 0.2, sustain: 0.1, release: 0.3 },
      });
      const filter = new Tone.Filter(2000, 'lowpass');
      synth.connect(filter);
      return filter;
    }
    case 'square': {
      const synth = new Tone.Synth({
        oscillator: { type: 'square' },
        envelope: { attack: 0.005, decay: 0.2, sustain: 0.1, release: 0.3 },
      });
      const filter = new Tone.Filter(2000, 'lowpass');
      synth.connect(filter);
      return filter;
    }
    case 'fm':
      return new Tone.FMSynth({
        harmonicity: 1,
        modulationIndex: 10,
        envelope: { attack: 0.01, decay: 0.5, sustain: 0.3, release: 0.8 },
      });
    case 'marimba':
      return new Tone.PluckSynth({
        attackNoise: 2,
        dampening: 4000,
        resonance: 0.9,
      });
    case 'bell':
      return new Tone.FMSynth({
        harmonicity: 3.5,
        modulationIndex: 14,
        envelope: { attack: 0.01, decay: 1.0, sustain: 0.1, release: 1.5 },
      });
    case 'pluck':
      return new Tone.PluckSynth({
        attackNoise: 1,
        dampening: 3000,
        resonance: 0.95,
      });
  }
}

/**
 * Create a full voice chain for a planet: Synth → Gain → Pan → Effects.
 */
export function createVoice(
  planetId: string,
  synthType: SynthType,
  effects: EffectsChain,
): PlanetVoice {
  const synth = createSynth(synthType);
  const gainNode = new Tone.Gain(0.75);
  const panNode = new Tone.Panner(0);

  synth.connect(gainNode);
  gainNode.connect(panNode);
  panNode.connect(effects.input);

  return { planetId, synth, gainNode, panNode, synthType };
}

/**
 * Trigger a note on a voice.
 */
export function triggerNote(
  voice: PlanetVoice,
  frequency: number,
  duration: string,
  velocity: number,
  normalizedVelocity: number,
): void {
  const synth = voice.synth;

  // Apply velocity-to-timbre modulation based on synth type
  if (synth instanceof Tone.FMSynth) {
    // FM: velocity → modulation index (faster = more metallic)
    const modIndex = 1 + normalizedVelocity * 19; // range 1-20
    synth.modulationIndex.value = modIndex;
  }

  // For filtered synths (saw/square), modulate filter
  if (voice.synthType === 'sawtooth' || voice.synthType === 'square') {
    // The synth node is actually a Filter in this case
    const filter = synth as unknown as { frequency: { value: number } };
    if (filter.frequency) {
      const cutoff = 200 + normalizedVelocity * 7800; // 200-8000Hz
      filter.frequency.value = cutoff;
    }
  }

  // Set volume based on velocity
  voice.gainNode.gain.value = velocity;

  // Trigger the note
  if (synth instanceof Tone.PluckSynth) {
    synth.triggerAttack(frequency);
  } else if (synth instanceof Tone.FMSynth) {
    synth.triggerAttackRelease(frequency, duration);
  } else if (synth instanceof Tone.Synth) {
    synth.triggerAttackRelease(frequency, duration);
  } else {
    // Filter node for saw/square — try to trigger
    try {
      (synth as Tone.Synth).triggerAttackRelease?.(frequency, duration);
    } catch {
      // Ignore if not triggerable
    }
  }
}

/**
 * Dispose a voice and all its audio nodes.
 */
export function disposeVoice(voice: PlanetVoice): void {
  try {
    if (voice.synth instanceof Tone.PluckSynth) {
      voice.synth.dispose();
    } else if (voice.synth instanceof Tone.FMSynth) {
      voice.synth.dispose();
    } else if (voice.synth instanceof Tone.Synth) {
      voice.synth.dispose();
    } else if (voice.synth instanceof Tone.Filter) {
      voice.synth.dispose();
    }
  } catch {
    // Best effort disposal
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
  // Disconnect and dispose old synth
  try {
    voice.synth.disconnect();
    if (voice.synth instanceof Tone.Synth) voice.synth.dispose();
    else if (voice.synth instanceof Tone.FMSynth) voice.synth.dispose();
    else if (voice.synth instanceof Tone.PluckSynth) voice.synth.dispose();
    else if (voice.synth instanceof Tone.Filter) voice.synth.dispose();
  } catch {
    // Best effort
  }

  // Create new synth
  const synth = createSynth(newType);
  synth.connect(voice.gainNode);

  return { ...voice, synth, synthType: newType };
}
