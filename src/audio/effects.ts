/**
 * Audio effects chain: Reverb → Delay → Limiter → Master Gain.
 * Uses Tone.js nodes for all processing.
 * 
 * Gain staging (per voice → effects → limit → master):
 * - Each voice outputs at ~0.5 gain
 * - Reverb/delay add ~30% wet signal
 * - Limiter at -6dB provides headroom
 * - Master at 0.6 provides final headroom
 * Total max per voice: 0.5 × 0.6 = 0.3 (well below clip)
 * With 10+ voices simultaneously: combined up to ~1.0 (limited to -6dB)
 */

import * as Tone from 'tone';

export class EffectsChain {
  reverb: Tone.Reverb;
  delay: Tone.FeedbackDelay;
  compressor: Tone.Compressor;
  limiter: Tone.Limiter;
  masterGain: Tone.Gain;

  constructor() {
    this.reverb = new Tone.Reverb({ decay: 2.5, wet: 0.25, preDelay: 0.01 });
    this.delay = new Tone.FeedbackDelay({ delayTime: 0.375, feedback: 0.25, wet: 0.15 });
    // Compressor before limiter for smoother dynamics control
    this.compressor = new Tone.Compressor(-24, 4);
    // Limiter at -6dB (more headroom than -1dB)
    this.limiter = new Tone.Limiter(-6);
    // Master gain at 0.6 for final headroom
    this.masterGain = new Tone.Gain(0.6);

    // Chain: reverb → delay → compressor → limiter → master → destination
    this.reverb.connect(this.delay);
    this.delay.connect(this.compressor);
    this.compressor.connect(this.limiter);
    this.limiter.connect(this.masterGain);
    this.masterGain.toDestination();
  }

  /** Get the input node that voices should connect to */
  get input(): Tone.ToneAudioNode {
    return this.reverb;
  }

  setReverbMix(wet: number): void {
    this.reverb.wet.value = wet;
  }

  setDelayMix(wet: number): void {
    this.delay.wet.value = wet;
  }

  setMasterVolume(volume: number): void {
    this.masterGain.gain.value = volume;
  }

  dispose(): void {
    this.reverb.dispose();
    this.delay.dispose();
    this.compressor.dispose();
    this.limiter.dispose();
    this.masterGain.dispose();
  }
}
