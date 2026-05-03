/**
 * Tests for the central reactive state store.
 * Validates state mutations, selection management, planet state, and trigger lines.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getState,
  updateSettings,
  addPlanet,
  removePlanet,
  updatePlanet,
  selectPlanet,
  selectTriggerLine,
  addTriggerLine,
  updateTriggerLine,
  resetTriggerLines,
  resetAll,
} from '../store.js';
import type { PlanetState } from '../types.js';

describe('getState', () => {
  it('returns the initial state with default settings', () => {
    const state = getState();
    expect(state.settings.gravity).toBe(1.0);
    expect(state.settings.nBodyEnabled).toBe(true);
    expect(state.settings.root).toBe('C');
    expect(state.settings.mode).toBe('lydian');
    expect(state.settings.defaultSynth).toBe('fm');
  });

  it('initializes with X and Y trigger lines', () => {
    const state = getState();
    expect(state.triggerLines.length).toBe(2);
    expect(state.triggerLines[0].angle).toBe(0);
    expect(state.triggerLines[1].angle).toBeCloseTo(Math.PI / 2);
  });

  it('initializes with no selected planet', () => {
    expect(getState().selectedPlanetId).toBeNull();
  });

  it('initializes with no selected trigger line', () => {
    expect(getState().selectedTriggerLineId).toBeNull();
  });
});

describe('updateSettings', () => {
  beforeEach(() => {
    resetAll();
  });

  it('updates individual settings', () => {
    updateSettings({ gravity: 2.5 });
    expect(getState().settings.gravity).toBe(2.5);
    // Other settings unchanged
    expect(getState().settings.root).toBe('C');
  });

  it('updates multiple settings at once', () => {
    updateSettings({ gravity: 3.0, root: 'A', mode: 'dorian' });
    const s = getState().settings;
    expect(s.gravity).toBe(3.0);
    expect(s.root).toBe('A');
    expect(s.mode).toBe('dorian');
  });
});

describe('planet management', () => {
  beforeEach(() => {
    resetAll();
  });

  const makePlanet = (id: string): PlanetState => ({
    id,
    name: `Planet ${id}`,
    color: '#4fc3f7',
    muted: false,
    soloed: false,
    synthType: 'fm',
    volume: 0.75,
    pan: 0,
  });

  it('adds a planet to the state', () => {
    addPlanet(makePlanet('p1'));
    expect(getState().planets.has('p1')).toBe(true);
    expect(getState().planets.get('p1')?.name).toBe('Planet p1');
  });

  it('removes a planet from the state', () => {
    addPlanet(makePlanet('p1'));
    removePlanet('p1');
    expect(getState().planets.has('p1')).toBe(false);
  });

  it('deselects planet on removal if it was selected', () => {
    addPlanet(makePlanet('p1'));
    selectPlanet('p1');
    expect(getState().selectedPlanetId).toBe('p1');

    removePlanet('p1');
    expect(getState().selectedPlanetId).toBeNull();
  });

  it('does not change selection when removing a different planet', () => {
    addPlanet(makePlanet('p1'));
    addPlanet(makePlanet('p2'));
    selectPlanet('p1');

    removePlanet('p2');
    expect(getState().selectedPlanetId).toBe('p1');
  });

  it('updates planet properties', () => {
    addPlanet(makePlanet('p1'));
    updatePlanet('p1', { synthType: 'sine', muted: true });
    const p = getState().planets.get('p1');
    expect(p?.synthType).toBe('sine');
    expect(p?.muted).toBe(true);
    // Unchanged
    expect(p?.volume).toBe(0.75);
  });

  it('ignores update for non-existent planet', () => {
    updatePlanet('nonexistent', { muted: true });
    expect(getState().planets.has('nonexistent')).toBe(false);
  });
});

describe('selection', () => {
  beforeEach(() => {
    resetAll();
  });

  it('selects a planet', () => {
    addPlanet({ id: 'p1', name: 'P1', color: '#fff', muted: false, soloed: false, synthType: 'fm', volume: 0.75, pan: 0 });
    selectPlanet('p1');
    expect(getState().selectedPlanetId).toBe('p1');
  });

  it('deselects by passing null', () => {
    selectPlanet('p1');
    selectPlanet(null);
    expect(getState().selectedPlanetId).toBeNull();
  });

  it('selects a trigger line', () => {
    selectTriggerLine('line-0');
    expect(getState().selectedTriggerLineId).toBe('line-0');
  });

  it('deselects trigger line with null', () => {
    selectTriggerLine('line-0');
    selectTriggerLine(null);
    expect(getState().selectedTriggerLineId).toBeNull();
  });
});

describe('trigger lines', () => {
  beforeEach(() => {
    resetAll();
  });

  it('adds a trigger line up to 6 max', () => {
    expect(getState().triggerLines.length).toBe(2);
    addTriggerLine();
    expect(getState().triggerLines.length).toBe(3);
    addTriggerLine();
    expect(getState().triggerLines.length).toBe(4);
    addTriggerLine();
    expect(getState().triggerLines.length).toBe(5);
    addTriggerLine();
    expect(getState().triggerLines.length).toBe(6);
    // 7th should fail
    const result = addTriggerLine();
    expect(result).toBeNull();
    expect(getState().triggerLines.length).toBe(6);
  });

  it('updates trigger line angle', () => {
    updateTriggerLine('line-0', Math.PI / 4);
    expect(getState().triggerLines[0].angle).toBeCloseTo(Math.PI / 4);
  });

  it('resets trigger lines to X and Y', () => {
    addTriggerLine();
    addTriggerLine();
    expect(getState().triggerLines.length).toBe(4);

    resetTriggerLines();
    expect(getState().triggerLines.length).toBe(2);
    expect(getState().triggerLines[0].angle).toBe(0);
    expect(getState().triggerLines[1].angle).toBeCloseTo(Math.PI / 2);
    expect(getState().selectedTriggerLineId).toBeNull();
  });
});

describe('resetAll', () => {
  it('clears everything back to defaults', () => {
    addPlanet({ id: 'p1', name: 'P1', color: '#fff', muted: false, soloed: false, synthType: 'fm', volume: 0.75, pan: 0 });
    selectPlanet('p1');
    updateSettings({ gravity: 5.0 });
    addTriggerLine();
    selectTriggerLine('line-0');

    resetAll();

    expect(getState().planets.size).toBe(0);
    expect(getState().selectedPlanetId).toBeNull();
    expect(getState().selectedTriggerLineId).toBeNull();
    expect(getState().settings.gravity).toBe(1.0);
    expect(getState().triggerLines.length).toBe(2);
  });
});
