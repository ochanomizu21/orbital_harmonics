/**
 * Orbital Harmonics — Main entry point.
 * Wires simulation, renderer, audio, and UI together.
 * Single RAF loop: simulation step → trigger detection → audio scheduling → render.
 */

import './style.css';

import { Simulation } from './simulation/simulation.js';
import { Renderer } from './renderer/renderer.js';
import { AudioEngine } from './audio/engine.js';
import { TriggerDetector } from './audio/triggers.js';
import { findPlanetAt } from './ui/selection.js';
import { Sidebar } from './ui/sidebar.js';
import { Controls } from './ui/controls.js';
import { SpawnHandler } from './ui/spawn.js';
import { TriggerLineInteraction } from './ui/trigger-lines.js';
import { KeyboardHandler } from './ui/keyboard.js';
import { StatusBar } from './ui/status-bar.js';
import { ShortcutsOverlay } from './ui/shortcuts-overlay.js';
import type { VisualEvent } from './renderer/types.js';
import type { SynthType } from './audio/types.js';
import {
  getState,
  addPlanet as addPlanetState, removePlanet as removePlanetState,
  updatePlanet, selectPlanet, selectTriggerLine,
  updateSettings, addTriggerLine, updateTriggerLine, resetTriggerLines, resetAll,
} from './state/store.js';
import { massToRadius } from './simulation/constants.js';

// === DOM Elements ===
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const overlay = document.getElementById('overlay') as HTMLElement;
const sidebarEl = document.getElementById('sidebar') as HTMLElement;
const controlsEl = document.getElementById('controls') as HTMLElement;
const statusBarEl = document.getElementById('status-bar') as HTMLElement;

// === Core Systems ===
const sim = new Simulation(window.innerWidth, window.innerHeight);
const renderer = new Renderer(canvas);
const audio = new AudioEngine();
const triggerDetector = new TriggerDetector(getState().triggerLines);
const shortcutsOverlay = new ShortcutsOverlay();

// === FPS tracking ===
let frameCount = 0;
let fpsTime = performance.now();
let currentFps = 60;

// === UI Setup ===
const sidebar = new Sidebar(sidebarEl, {
  onSelectPlanet: (id) => {
    selectPlanet(id);
    refreshSidebar();
  },
  onMutePlanet: (id) => {
    toggleMute(id);
  },
  onSoloPlanet: (id) => {
    toggleSolo(id);
  },
  onDeletePlanet: (id) => {
    deletePlanet(id);
  },
});

const controls = new Controls(controlsEl, {
  onGravityChange: (v) => { sim.G = v; updateSettings({ gravity: v }); },
  onNBodyToggle: (enabled) => { sim.nBodyEnabled = enabled; updateSettings({ nBodyEnabled: enabled }); },
  onTrailFadeChange: (v) => { renderer.setTrailFadeRate(v); updateSettings({ trailFadeRate: v }); },
  onSimSpeedChange: (v) => { sim.simSpeed = v; updateSettings({ simSpeed: v }); },
  onRootChange: (root) => {
    updateSettings({ root });
    const s = getState().settings;
    audio.updateScale(s.root, s.mode, s.octaveMin, s.octaveMax);
  },
  onModeChange: (mode) => {
    updateSettings({ mode });
    const s = getState().settings;
    audio.updateScale(s.root, s.mode, s.octaveMin, s.octaveMax);
  },
  onOctaveMinChange: (oct) => {
    updateSettings({ octaveMin: oct });
    const s = getState().settings;
    audio.updateScale(s.root, s.mode, s.octaveMin, s.octaveMax);
  },
  onOctaveMaxChange: (oct) => {
    updateSettings({ octaveMax: oct });
    const s = getState().settings;
    audio.updateScale(s.root, s.mode, s.octaveMin, s.octaveMax);
  },
  onDefaultSynthChange: (synth) => updateSettings({ defaultSynth: synth }),
  onReverbMixChange: (v) => { audio.setReverbMix(v); updateSettings({ reverbMix: v }); },
  onDelayMixChange: (v) => { audio.setDelayMix(v); updateSettings({ delayMix: v }); },
  onMasterVolumeChange: (v) => { audio.setMasterVolume(v); updateSettings({ masterVolume: v }); },
  onAddTriggerLine: () => {
    addTriggerLine();
    triggerDetector.setLines(getState().triggerLines);
  },
  onResetTriggerLines: () => {
    resetTriggerLines();
    triggerDetector.setLines(getState().triggerLines);
  },
});

const statusBar = new StatusBar(statusBarEl);

const spawnHandler = new SpawnHandler(canvas, {
  onSpawn: (position, velocity, mass) => {
    const body = sim.addPlanet(position, velocity, mass);
    const state = getState();
    addPlanetState({
      id: body.id,
      name: body.name,
      color: body.color,
      muted: false,
      soloed: false,
      synthType: state.settings.defaultSynth,
      volume: 0.75,
      pan: 0,
    });
    audio.addVoice(body.id, state.settings.defaultSynth);
    refreshSidebar();
  },
  getDefaultMass: () => 10,
});

const triggerLineInteraction = new TriggerLineInteraction(canvas, {
  onSelectLine: (id) => selectTriggerLine(id),
  onRotateLine: (id, angle) => {
    updateTriggerLine(id, angle);
    triggerDetector.setLines(getState().triggerLines);
  },
});

new KeyboardHandler({
  onTogglePause: () => { sim.running = !sim.running; },
  onDeleteSelected: () => {
    const id = getState().selectedPlanetId;
    if (id) deletePlanet(id);
  },
  onMuteSelected: () => {
    const id = getState().selectedPlanetId;
    if (id) toggleMute(id);
  },
  onSoloSelected: () => {
    const id = getState().selectedPlanetId;
    if (id) toggleSolo(id);
  },
  onSetSynth: (index) => {
    const id = getState().selectedPlanetId;
    if (!id) return;
    const types: SynthType[] = ['sine', 'triangle', 'sawtooth', 'square', 'fm', 'marimba', 'bell', 'pluck'];
    const type = types[index];
    if (!type) return;
    audio.updateSynthType(id, type);
    updatePlanet(id, { synthType: type });
    refreshSidebar();
  },
  onToggleNBody: () => {
    sim.nBodyEnabled = !sim.nBodyEnabled;
    updateSettings({ nBodyEnabled: sim.nBodyEnabled });
    controls.setNBodyEnabled(sim.nBodyEnabled);
  },
  onResetAll: () => {
    sim.reset();
    // Remove all audio voices
    for (const [id] of getState().planets) {
      audio.removeVoice(id);
    }
    resetAll();
    refreshSidebar();
  },
  onTogglePanels: () => {
    sidebarEl.classList.toggle('collapsed');
    controlsEl.classList.toggle('collapsed');
  },
  onShowShortcuts: () => shortcutsOverlay.show(),
});

// === Helpers ===

function deletePlanet(id: string): void {
  sim.removeBody(id);
  audio.removeVoice(id);
  removePlanetState(id);
  if (getState().selectedPlanetId === id) selectPlanet(null);
  refreshSidebar();
}

/** Toggle solo on a planet with proper mute logic for all other planets */
function toggleSolo(targetId: string): void {
  const body = sim.bodies.find((b) => b.id === targetId);
  if (!body) return;

  const wasSoloed = body.soloed;
  // Clear all solo states and restore individual mute states
  for (const b of sim.planets) {
    b.soloed = false;
    audio.mutePlanet(b.id, b.muted); // restore to individual mute state
    const s = getState().planets.get(b.id);
    if (s) updatePlanet(b.id, { soloed: false });
  }
  if (!wasSoloed) {
    body.soloed = true;
    // Mute all non-soloed planets
    for (const b of sim.planets) {
      if (!b.soloed) {
        audio.mutePlanet(b.id, true);
      }
    }
    const s = getState().planets.get(targetId);
    if (s) updatePlanet(targetId, { soloed: true });
  }
  refreshSidebar();
}

/** Toggle mute on a planet */
function toggleMute(targetId: string): void {
  const body = sim.bodies.find((b) => b.id === targetId);
  if (!body) return;
  body.muted = !body.muted;
  audio.mutePlanet(targetId, body.muted);
  const state = getState().planets.get(targetId);
  if (state) updatePlanet(targetId, { muted: body.muted });
  refreshSidebar();
}

function refreshSidebar(): void {
  const state = getState();
  sidebar.update(sim.bodies, state.selectedPlanetId, state.planets);

  // Update editor
  const selectedId = state.selectedPlanetId;
  const body = selectedId ? sim.bodies.find((b) => b.id === selectedId) ?? null : null;
  const planetState = selectedId ? state.planets.get(selectedId) : null;
  sidebar.updateEditor(
    body,
    planetState?.synthType ?? 'fm',
    planetState?.volume ?? 0.75,
    planetState?.pan ?? 0,
    (type) => {
      if (!selectedId) return;
      audio.updateSynthType(selectedId, type);
      updatePlanet(selectedId, { synthType: type });
    },
    (vol) => {
      if (!selectedId) return;
      audio.setPlanetVolume(selectedId, vol);
      updatePlanet(selectedId, { volume: vol });
    },
    (pan) => {
      if (!selectedId) return;
      audio.setPlanetPan(selectedId, pan);
      updatePlanet(selectedId, { pan });
    },
    (mass) => {
      if (!selectedId) return;
      const body = sim.bodies.find((b) => b.id === selectedId);
      if (body) {
        body.mass = mass;
        body.radius = massToRadius(mass);
      }
    },
    (color) => {
      if (!selectedId) return;
      const body = sim.bodies.find((b) => b.id === selectedId);
      if (body) body.color = color;
      updatePlanet(selectedId, { color });
    },
  );
}

// === Canvas click for planet selection ===
canvas.addEventListener('click', (e) => {
  const planet = findPlanetAt(sim.bodies, e.clientX, e.clientY);
  if (planet) {
    selectPlanet(planet.id);
  } else {
    selectPlanet(null);
    selectTriggerLine(null);
  }
  refreshSidebar();
});

// === Resize handling ===
function handleResize(): void {
  renderer.resize();
  sim.updateCanvasSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', handleResize);
handleResize();

// === "Click to Begin" overlay ===
overlay.addEventListener('click', async () => {
  await audio.start();
  overlay.classList.add('hidden');
});

// === Simulation body removal callback ===
sim.onBodyRemoved = (id) => {
  audio.removeVoice(id);
  removePlanetState(id);
  if (getState().selectedPlanetId === id) selectPlanet(null);
  refreshSidebar();
};

// === Main Loop ===
function mainLoop(): void {
  requestAnimationFrame(mainLoop);

  // FPS tracking
  frameCount++;
  const now = performance.now();
  if (now - fpsTime >= 1000) {
    currentFps = frameCount / ((now - fpsTime) / 1000);
    frameCount = 0;
    fpsTime = now;
  }

  // 1. Simulation step
  sim.step();

  // 2. Trigger detection
  const state = getState();
  triggerDetector.setLines(state.triggerLines);
  triggerLineInteraction.update(state.triggerLines, sim.sun.position.x, sim.sun.position.y);

  const events = triggerDetector.detect(sim.planets, sim.sun.position.x, sim.sun.position.y);

  // 3. Audio scheduling
  const visualEvents: VisualEvent[] = [];
  for (const event of events) {
    audio.handleTrigger(event);

    // Create visual event for renderer
    const planet = sim.bodies.find((b) => b.id === event.planetId);
    if (planet) {
      // Compute crossing position
      const crossX = sim.sun.position.x + Math.cos(event.angle) * event.distance;
      const crossY = sim.sun.position.y + Math.sin(event.angle) * event.distance;
      visualEvents.push({
        type: 'trigger',
        x: crossX,
        y: crossY,
        planetColor: planet.color,
        planetRadius: planet.radius,
      });
    }
  }

  // 4. Render
  renderer.render(
    sim.bodies,
    state.triggerLines,
    state.selectedPlanetId,
    state.selectedTriggerLineId,
    spawnHandler.state,
    visualEvents,
    1 / 60,
  );

  // 5. Status bar update
  statusBar.update(
    sim.planets.length,
    currentFps,
    state.settings.root,
    state.settings.mode,
    audio.getTriggersPerMinute(),
  );
}

// Start the loop
requestAnimationFrame(mainLoop);
