/**
 * Main Audio Engine class.
 * Manages Tone.js startup, voice map, trigger event handling, and master output.
 */

import * as Tone from 'tone';
import type { TriggerEvent } from './types.js';
import { EffectsChain } from './effects.js';
import { createVoice, disposeVoice, updateVoiceSynth, triggerNote } from './planet-voice.js';
import { generateNoteArray, midiToFrequency } from './scales.js';
import { distanceToNote } from './quantizer.js';
import type { SynthType } from './types.js';
import { lerp } from '../lib/math.js';
import type { PlanetVoice } from './planet-voice.js';

export class AudioEngine {
  private effects: EffectsChain;
  private voices = new Map<string, PlanetVoice>();
  private scaleNotes: number[] = [];
  private started = false;
  private triggerCount = 0;
  private triggerCountStartTime = 0;

  constructor() {
    this.effects = new EffectsChain();
    this.triggerCountStartTime = performance.now();
    this.updateScale('C', 'lydian', 3, 5);
  }

  /** Initialize the audio context (must be called from a user gesture) */
  async start(): Promise<void> {
    if (this.started) return;
    await Tone.start();
    this.started = true;
  }

  /** Update the scale used for pitch quantization */
  updateScale(root: string, mode: string, octaveMin: number, octaveMax: number): void {
    this.scaleNotes = generateNoteArray(root, mode as never, octaveMin, octaveMax);
  }

  /** Create a new voice for a planet */
  addVoice(planetId: string, synthType: SynthType): void {
    if (this.voices.has(planetId)) return;
    const voice = createVoice(planetId, synthType, this.effects);
    this.voices.set(planetId, voice);
  }

  /** Remove a planet's voice */
  removeVoice(planetId: string): void {
    const voice = this.voices.get(planetId);
    if (voice) {
      disposeVoice(voice);
      this.voices.delete(planetId);
    }
  }

  /** Update a planet's synth type */
  updateSynthType(planetId: string, synthType: SynthType): void {
    const voice = this.voices.get(planetId);
    if (voice) {
      const updated = updateVoiceSynth(voice, synthType);
      this.voices.set(planetId, updated);
    }
  }

  /** Set per-planet volume (0-1) */
  setPlanetVolume(planetId: string, volume: number): void {
    const voice = this.voices.get(planetId);
    if (voice) {
      voice.gainNode.gain.value = volume;
    }
  }

  /** Set per-planet pan (-1 to 1) */
  setPlanetPan(planetId: string, pan: number): void {
    const voice = this.voices.get(planetId);
    if (voice) {
      voice.panNode.pan.value = pan;
    }
  }

  /** Mute a planet (gain=0, keep synth alive) */
  mutePlanet(planetId: string, muted: boolean): void {
    const voice = this.voices.get(planetId);
    if (voice) {
      voice.gainNode.gain.value = muted ? 0 : 0.75;
    }
  }

  /** Handle a trigger event — schedule a note */
  handleTrigger(event: TriggerEvent): void {
    if (!this.started) return;
    if (this.scaleNotes.length === 0) return;

    const voice = this.voices.get(event.planetId);
    if (!voice) return;

    // Distance → pitch
    const midiNote = distanceToNote(event.distance, this.scaleNotes);
    const frequency = midiToFrequency(midiNote);

    // Velocity → volume: lerp(0.2, 1.0, normalizedVelocity)
    const maxVel = 10; // typical max velocity in simulation units
    const normalizedVel = Math.min(event.velocity / maxVel, 1);
    const volume = lerp(0.2, 1.0, normalizedVel);

    // Angle → pan: cos(angle) maps to [-1, 1]
    const pan = Math.cos(event.angle);

    voice.panNode.pan.value = pan;

    // Trigger note
    triggerNote(voice, frequency, '8n', volume, normalizedVel);

    this.triggerCount++;
  }

  /** Update effects settings */
  setReverbMix(wet: number): void {
    this.effects.setReverbMix(wet);
  }

  setDelayMix(wet: number): void {
    this.effects.setDelayMix(wet);
  }

  setMasterVolume(volume: number): void {
    this.effects.setMasterVolume(volume);
  }

  /** Get triggers per minute (rolling average) */
  getTriggersPerMinute(): number {
    const elapsed = (performance.now() - this.triggerCountStartTime) / 60000;
    if (elapsed < 0.01) return 0;
    return this.triggerCount / elapsed;
  }

  /** Dispose all audio resources */
  dispose(): void {
    for (const voice of this.voices.values()) {
      disposeVoice(voice);
    }
    this.voices.clear();
    this.effects.dispose();
  }
}
