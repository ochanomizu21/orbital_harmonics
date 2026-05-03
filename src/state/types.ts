/**
 * Application state type definitions.
 */

import type { ScaleMode, SynthType } from '../audio/types.js';

export interface PlanetState {
  id: string;
  name: string;
  color: string;
  muted: boolean;
  soloed: boolean;
  synthType: SynthType;
  volume: number;
  pan: number;
}

export interface TriggerLineState {
  angle: number; // radians
  id: string;
}

export interface SettingsState {
  gravity: number;
  nBodyEnabled: boolean;
  trailFadeRate: number;
  simSpeed: number;
  root: string;
  mode: ScaleMode;
  octaveMin: number;
  octaveMax: number;
  defaultSynth: SynthType;
  reverbMix: number;
  delayMix: number;
  masterVolume: number;
}

export interface AppState {
  settings: SettingsState;
  planets: Map<string, PlanetState>;
  triggerLines: TriggerLineState[];
  selectedPlanetId: string | null;
  selectedTriggerLineId: string | null;
}
