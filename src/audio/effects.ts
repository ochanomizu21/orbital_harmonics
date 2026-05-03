/**
 * Audio effects chain: Reverb → Delay → Compressor → Limiter → Master Gain.
 * Uses Tone.js nodes for all processing.
 *
 * Gain staging (per voice → effects → limit → master):
 * - Voice gain: configurable (default 0.5)
 * - Reverb/delay: add wet signal
 * - Compressor: configurable threshold/ratio
 * - Limiter: configurable threshold (default -6dB)
 * - Master: configurable (default 0.6)
 */

import * as Tone from 'tone';

// Audio tuning params - can be adjusted at runtime
export interface AudioTuning {
  voiceGain: number;      // per-voice gain (default 0.5)
  limiterDb: number;     // limiter threshold in dB (default -6)
  compressorDb: number; // compressor threshold in dB (default -24)
  compressorRatio: number; // compressor ratio (default 4)
  masterGain: number;  // master gain (default 0.6)
}

export const DEFAULT_AUDIO_TUNING: AudioTuning = {
  voiceGain: 0.25,
  limiterDb: -10,
  compressorDb: -21,
  compressorRatio: 8,
  masterGain: 0.6,
};

export class EffectsChain {
  reverb: Tone.Reverb;
  delay: Tone.FeedbackDelay;
  compressor: Tone.Compressor;
  limiter: Tone.Limiter;
  masterGain: Tone.Gain;

  constructor(tuning: AudioTuning = DEFAULT_AUDIO_TUNING) {
    this.reverb = new Tone.Reverb({ decay: 2.5, wet: 0.25, preDelay: 0.01 });
    this.delay = new Tone.FeedbackDelay({ delayTime: 0.375, feedback: 0.25, wet: 0.15 });
    // Compressor before limiter for smoother dynamics control
    this.compressor = new Tone.Compressor(tuning.compressorDb, tuning.compressorRatio);
    // Limiter at configurable threshold
    this.limiter = new Tone.Limiter(tuning.limiterDb);
    // Master gain configurable
    this.masterGain = new Tone.Gain(tuning.masterGain);

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

  /** Set limiter threshold in dB */
  setLimiterThreshold(db: number): void {
    this.limiter.threshold.value = db;
  }

  /** Set compressor threshold in dB */
  setCompressorThreshold(db: number): void {
    this.compressor.threshold.value = db;
  }

  /** Set compressor ratio */
  setCompressorRatio(ratio: number): void {
    this.compressor.ratio.value = ratio;
  }

  dispose(): void {
    this.reverb.dispose();
    this.delay.dispose();
    this.compressor.dispose();
    this.limiter.dispose();
    this.masterGain.dispose();
  }
}
