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

// Apply saved settings at startup
const savedSettings = getState().settings;
sim.G = savedSettings.gravity;
sim.simSpeed = savedSettings.simSpeed;
renderer.setTrailFadeRate(savedSettings.trailFadeRate);
audio.updateScale(savedSettings.root, savedSettings.mode, savedSettings.octaveMin, savedSettings.octaveMax);
if (savedSettings.reverbMix !== undefined) audio.setReverbMix(savedSettings.reverbMix);
if (savedSettings.delayMix !== undefined) audio.setDelayMix(savedSettings.delayMix);
if (savedSettings.masterVolume !== undefined) audio.setMasterVolume(savedSettings.masterVolume);

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
  onDefaultSynthChange: (synth) => {
    updateSettings({ defaultSynth: synth });
    // Update all existing planets to use the new default synth
    const planets = getState().planets;
    for (const [id] of planets) {
      audio.updateSynthType(id, synth);
      updatePlanet(id, { synthType: synth });
    }
    // Refresh sidebar to show updated synth labels
    refreshSidebar();
  },
  onReverbMixChange: (v) => { audio.setReverbMix(v); updateSettings({ reverbMix: v }); },
  onDelayMixChange: (v) => { audio.setDelayMix(v); updateSettings({ delayMix: v }); },
  onMasterVolumeChange: (v) => { audio.setMasterVolume(v); updateSettings({ masterVolume: v }); },
  // Audio tuning callbacks
  onVoiceGainChange: (v) => {
    audio.setVoiceGain(v);
    // Also update all planet volumes
    const planets = getState().planets;
    for (const [id] of planets) {
      audio.setPlanetVolume(id, v);
      updatePlanet(id, { volume: v });
    }
  },
  onLimiterDbChange: (v) => audio.setLimiterDb(v),
  onCompressorDbChange: (v) => audio.setCompressorDb(v),
  onCompressorRatioChange: (v) => audio.setCompressorRatio(v),
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

// Panel toggle buttons
const sidebarToggle = document.createElement('button');
sidebarToggle.className = 'panel-toggle sidebar-toggle';
sidebarToggle.textContent = '☰';
sidebarToggle.title = 'Toggle planets panel';
sidebarToggle.addEventListener('click', () => {
  const isCollapsed = sidebarEl.classList.toggle('collapsed');
  sidebarToggle.textContent = isCollapsed ? '☰' : '✕';
});
document.body.appendChild(sidebarToggle);

const controlsToggle = document.createElement('button');
controlsToggle.className = 'panel-toggle controls-toggle';
controlsToggle.textContent = '⚙';
controlsToggle.title = 'Toggle settings';
controlsToggle.addEventListener('click', () => {
  const isCollapsed = controlsEl.classList.toggle('collapsed');
  controlsToggle.textContent = isCollapsed ? '⚙' : '✕';
});
document.body.appendChild(controlsToggle);

const spawnHandler = new SpawnHandler(canvas, {
  onSpawn: (position, velocity, mass) => {
    const body = sim.addPlanet(position, velocity, mass);
    // Random synth type for new planet
    const synthTypes: SynthType[] = ['sine', 'triangle', 'sawtooth', 'square', 'fm', 'marimba', 'bell', 'pluck'];
    const randomSynth = synthTypes[Math.floor(Math.random() * synthTypes.length)];
    addPlanetState({
      id: body.id,
      name: body.name,
      color: body.color,
      muted: false,
      soloed: false,
      synthType: randomSynth,
      volume: 0.5,
      pan: 0,
    });
    audio.addVoice(body.id, randomSynth);
    refreshSidebar();
  },
  getDefaultMass: () => 1 + Math.floor(Math.random() * 50), // random between 1-50
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

// === Canvas cursor management per spec §05.12 ===
canvas.addEventListener('mousemove', (e) => {
  // Skip if UI is being interacted with
  if (spawnHandler.state.active) {
    canvas.style.cursor = 'none';
    return;
  }
  if (triggerLineInteraction.isDragging) {
    canvas.style.cursor = 'grabbing';
    return;
  }

  // Check if over a planet → pointer
  const planet = findPlanetAt(sim.bodies, e.clientX, e.clientY);
  if (planet) {
    canvas.style.cursor = 'pointer';
    return;
  }

  // Check if near a trigger line → grab
  const state = getState();
  const sunX = sim.sun.position.x;
  const sunY = sim.sun.position.y;
  for (const line of state.triggerLines) {
    const nx = Math.sin(line.angle);
    const ny = -Math.cos(line.angle);
    const dx = e.clientX - sunX;
    const dy = e.clientY - sunY;
    const dist = Math.abs(dx * nx + dy * ny);
    if (dist < 10) {
      canvas.style.cursor = 'grab';
      return;
    }
  }

  // Default → crosshair
  canvas.style.cursor = 'crosshair';
});

// === Canvas click for planet selection (mouse) ===
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

// === Canvas touch for planet selection ===
canvas.addEventListener('touchend', (e) => {
  e.preventDefault();
  // Only handle tap (not drag) - check if touch moved
  if (spawnHandler.state.active) return; // Let spawn handler deal with it
  const touch = e.changedTouches[0];
  const planet = findPlanetAt(sim.bodies, touch.clientX, touch.clientY);
  if (planet) {
    selectPlanet(planet.id);
  } else {
    selectPlanet(null);
    selectTriggerLine(null);
  }
  refreshSidebar();
}, { passive: false });

// === Resize handling ===
function handleResize(): void {
  renderer.resize();
  sim.updateCanvasSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', handleResize);
// Handle orientation change on mobile
window.addEventListener('orientationchange', () => {
  // Small delay to let the orientation settle
  setTimeout(handleResize, 100);
});
handleResize();

// === Mobile: initialize panels as collapsed ===
function initMobilePanels(): void {
  const isMobile = window.innerWidth <= 1023;
  if (isMobile) {
    sidebarEl.classList.add('collapsed');
    controlsEl.classList.add('collapsed');
  }
}
initMobilePanels();
// Re-check on resize
window.addEventListener('resize', () => {
  const isMobile = window.innerWidth <= 1023;
  if (isMobile) {
    sidebarEl.classList.add('collapsed');
    controlsEl.classList.add('collapsed');
  }
});

// === "Click to Begin" overlay ===
overlay.addEventListener('click', async () => {
  await audio.start();
  overlay.classList.add('hidden');
});

overlay.addEventListener('touchend', async (e) => {
  e.preventDefault();
  await audio.start();
  overlay.classList.add('hidden');
}, { passive: false });

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
