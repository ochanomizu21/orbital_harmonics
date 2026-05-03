/**
 * Central reactive state store with subscribe/notify pattern.
 * Lightweight custom observable — no framework dependency.
 */

import type { AppState, SettingsState, PlanetState } from './types.js';

type Listener = () => void;

const defaultSettings: SettingsState = {
  gravity: 3.0,
  nBodyEnabled: true,
  trailFadeRate: 0.03,
  simSpeed: 5.0,
  root: 'C',
  mode: 'lydian',
  octaveMin: 3,
  octaveMax: 5,
  defaultSynth: 'fm',
  reverbMix: 0.3,
  delayMix: 0.2,
  masterVolume: 0.75,
};

const state: AppState = {
  settings: { ...defaultSettings },
  planets: new Map(),
  triggerLines: [
    { id: 'line-0', angle: 0 },           // X axis
    { id: 'line-1', angle: Math.PI / 2 },  // Y axis
  ],
  selectedPlanetId: null,
  selectedTriggerLineId: null,
};

const listeners = new Set<Listener>();

/** Subscribe to state changes. Returns unsubscribe function. */
export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Notify all subscribers of a state change */
export function notify(): void {
  for (const listener of listeners) {
    listener();
  }
}

/** Get a read-only reference to the current state */
export function getState(): Readonly<AppState> {
  return state;
}

// === Settings mutations ===

export function updateSettings(patch: Partial<SettingsState>): void {
  Object.assign(state.settings, patch);
  notify();
}

// === Planet mutations ===

export function addPlanet(planet: PlanetState): void {
  state.planets.set(planet.id, planet);
  notify();
}

export function removePlanet(id: string): void {
  state.planets.delete(id);
  if (state.selectedPlanetId === id) {
    state.selectedPlanetId = null;
  }
  notify();
}

export function updatePlanet(id: string, patch: Partial<PlanetState>): void {
  const planet = state.planets.get(id);
  if (planet) {
    Object.assign(planet, patch);
    notify();
  }
}

// === Selection ===

export function selectPlanet(id: string | null): void {
  state.selectedPlanetId = id;
  notify();
}

export function selectTriggerLine(id: string | null): void {
  state.selectedTriggerLineId = id;
  notify();
}

// === Trigger lines ===

export function addTriggerLine(): string | null {
  if (state.triggerLines.length >= 6) return null;
  const id = `line-${state.triggerLines.length}`;
  // Add at a evenly spaced angle
  const angle = (state.triggerLines.length * Math.PI) / state.triggerLines.length;
  state.triggerLines.push({ id, angle });
  notify();
  return id;
}

export function updateTriggerLine(id: string, angle: number): void {
  const line = state.triggerLines.find((l) => l.id === id);
  if (line) {
    line.angle = angle;
    notify();
  }
}

export function resetTriggerLines(): void {
  state.triggerLines = [
    { id: 'line-0', angle: 0 },
    { id: 'line-1', angle: Math.PI / 2 },
  ];
  state.selectedTriggerLineId = null;
  notify();
}

export function resetAll(): void {
  state.planets.clear();
  state.selectedPlanetId = null;
  state.selectedTriggerLineId = null;
  state.settings = { ...defaultSettings };
  state.triggerLines = [
    { id: 'line-0', angle: 0 },
    { id: 'line-1', angle: Math.PI / 2 },
  ];
  notify();
}
