/**
 * Audio effects chain: Reverb → Delay → Limiter → Master Gain.
 * Uses Tone.js nodes for all processing.
 */

import * as Tone from 'tone';

export class EffectsChain {
  reverb: Tone.Reverb;
  delay: Tone.FeedbackDelay;
  limiter: Tone.Limiter;
  masterGain: Tone.Gain;

  constructor() {
    this.reverb = new Tone.Reverb({ decay: 2.5, wet: 0.3, preDelay: 0.01 });
    this.delay = new Tone.FeedbackDelay({ delayTime: 0.375, feedback: 0.3, wet: 0.2 });
    this.limiter = new Tone.Limiter(-1);
    this.masterGain = new Tone.Gain(0.75);

    // Chain: reverb → delay → limiter → master → destination
    this.reverb.connect(this.delay);
    this.delay.connect(this.limiter);
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
    this.limiter.dispose();
    this.masterGain.dispose();
  }
}
