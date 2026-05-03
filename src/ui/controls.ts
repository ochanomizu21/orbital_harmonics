/**
 * Control panel — global settings for simulation, music, synth, effects, and trigger lines.
 */

import type { SynthType, ScaleMode } from '../audio/types.js';
import { SYNTH_LABELS } from '../audio/types.js';

export interface ControlsCallbacks {
  onGravityChange: (value: number) => void;
  onNBodyToggle: (enabled: boolean) => void;
  onTrailFadeChange: (value: number) => void;
  onSimSpeedChange: (value: number) => void;
  onRootChange: (root: string) => void;
  onModeChange: (mode: ScaleMode) => void;
  onOctaveMinChange: (oct: number) => void;
  onOctaveMaxChange: (oct: number) => void;
  onDefaultSynthChange: (synth: SynthType) => void;
  onReverbMixChange: (value: number) => void;
  onDelayMixChange: (value: number) => void;
  onMasterVolumeChange: (value: number) => void;
  onAddTriggerLine: () => void;
  onResetTriggerLines: () => void;
}

const ROOTS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const MODES: { value: ScaleMode; label: string }[] = [
  { value: 'ionian', label: 'Ionian (Major)' },
  { value: 'dorian', label: 'Dorian' },
  { value: 'phrygian', label: 'Phrygian' },
  { value: 'lydian', label: 'Lydian' },
  { value: 'mixolydian', label: 'Mixolydian' },
  { value: 'aeolian', label: 'Aeolian (Minor)' },
  { value: 'locrian', label: 'Locrian' },
];
const SYNTHS: SynthType[] = ['sine', 'triangle', 'sawtooth', 'square', 'fm', 'marimba', 'bell', 'pluck'];

export class Controls {
  private container: HTMLElement;
  private callbacks: ControlsCallbacks;
  private gravityValue!: HTMLElement;
  private nBodyToggle!: HTMLElement;
  private trailValue!: HTMLElement;
  private speedValue!: HTMLElement;
  private reverbValue!: HTMLElement;
  private delayValue!: HTMLElement;
  private masterValue!: HTMLElement;

  constructor(container: HTMLElement, callbacks: ControlsCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.build();
  }

  private build(): void {
    this.container.innerHTML = '';

    // Simulation section
    this.container.appendChild(this.createSection('SIMULATION'));

    this.container.appendChild(this.makeSlider('Gravity', 0.1, 5.0, 1.0, 0.1, (v) => {
      this.gravityValue.textContent = v.toFixed(1);
      this.callbacks.onGravityChange(v);
    }, 'gravity'));

    // N-Body toggle
    const nbodyRow = document.createElement('div');
    nbodyRow.className = 'control-row';
    nbodyRow.innerHTML = '<span class="control-label">N-Body</span>';
    this.nBodyToggle = document.createElement('div');
    this.nBodyToggle.className = 'toggle-switch on';
    this.nBodyToggle.addEventListener('click', () => {
      const on = this.nBodyToggle.classList.toggle('on');
      this.callbacks.onNBodyToggle(on);
    });
    nbodyRow.appendChild(this.nBodyToggle);
    this.container.appendChild(nbodyRow);

    this.container.appendChild(this.makeSlider('Trail Length', 0.01, 0.1, 0.03, 0.005, (v) => {
      this.trailValue.textContent = v < 0.02 ? 'Long' : v > 0.06 ? 'Short' : 'Med';
      this.callbacks.onTrailFadeChange(v);
    }, 'trail'));

    this.container.appendChild(this.makeSlider('Sim Speed', 0.25, 2.0, 1.0, 0.25, (v) => {
      this.speedValue.textContent = v.toFixed(2) + '×';
      this.callbacks.onSimSpeedChange(v);
    }, 'speed'));

    // Music section
    this.container.appendChild(this.createSection('MUSIC'));

    const rootRow = document.createElement('div');
    rootRow.className = 'control-row';
    rootRow.innerHTML = '<span class="control-label">Root Note</span>';
    const rootSelect = document.createElement('select');
    for (const r of ROOTS) {
      const opt = document.createElement('option');
      opt.value = r;
      opt.textContent = r;
      if (r === 'C') opt.selected = true;
      rootSelect.appendChild(opt);
    }
    rootSelect.addEventListener('change', () => this.callbacks.onRootChange(rootSelect.value));
    rootRow.appendChild(rootSelect);
    this.container.appendChild(rootRow);

    const modeRow = document.createElement('div');
    modeRow.className = 'control-row';
    modeRow.innerHTML = '<span class="control-label">Scale Mode</span>';
    const modeSelect = document.createElement('select');
    for (const m of MODES) {
      const opt = document.createElement('option');
      opt.value = m.value;
      opt.textContent = m.label;
      if (m.value === 'lydian') opt.selected = true;
      modeSelect.appendChild(opt);
    }
    modeSelect.addEventListener('change', () => this.callbacks.onModeChange(modeSelect.value as ScaleMode));
    modeRow.appendChild(modeSelect);
    this.container.appendChild(modeRow);

    // Octave range (simplified as two sliders)
    this.container.appendChild(this.makeSlider('Octave Min', 1, 6, 3, 1, (v) => {
      this.callbacks.onOctaveMinChange(v);
    }));
    this.container.appendChild(this.makeSlider('Octave Max', 1, 7, 5, 1, (v) => {
      this.callbacks.onOctaveMaxChange(v);
    }));

    // Synth default
    this.container.appendChild(this.createSection('DEFAULT SYNTH'));
    const synthRow = document.createElement('div');
    synthRow.className = 'control-row';
    const synthSelect = document.createElement('select');
    for (const s of SYNTHS) {
      const opt = document.createElement('option');
      opt.value = s;
      opt.textContent = SYNTH_LABELS[s];
      if (s === 'fm') opt.selected = true;
      synthSelect.appendChild(opt);
    }
    synthSelect.addEventListener('change', () => this.callbacks.onDefaultSynthChange(synthSelect.value as SynthType));
    synthRow.appendChild(synthSelect);
    this.container.appendChild(synthRow);

    // Effects section
    this.container.appendChild(this.createSection('EFFECTS'));

    this.container.appendChild(this.makeSlider('Reverb', 0, 100, 30, 1, (v) => {
      this.reverbValue.textContent = v + '%';
      this.callbacks.onReverbMixChange(v / 100);
    }, 'reverb'));

    this.container.appendChild(this.makeSlider('Delay', 0, 100, 20, 1, (v) => {
      this.delayValue.textContent = v + '%';
      this.callbacks.onDelayMixChange(v / 100);
    }, 'delay'));

    this.container.appendChild(this.makeSlider('Master Vol', 0, 100, 75, 1, (v) => {
      this.masterValue.textContent = v + '%';
      this.callbacks.onMasterVolumeChange(v / 100);
    }, 'master'));

    // Trigger Lines section
    this.container.appendChild(this.createSection('TRIGGER LINES'));

    const btnRow = document.createElement('div');
    btnRow.className = 'btn-row';
    const addBtn = document.createElement('button');
    addBtn.className = 'btn';
    addBtn.textContent = 'Add Line';
    addBtn.addEventListener('click', () => this.callbacks.onAddTriggerLine());
    btnRow.appendChild(addBtn);

    const resetBtn = document.createElement('button');
    resetBtn.className = 'btn';
    resetBtn.textContent = 'Reset Lines';
    resetBtn.addEventListener('click', () => this.callbacks.onResetTriggerLines());
    btnRow.appendChild(resetBtn);
    this.container.appendChild(btnRow);
  }

  private createSection(title: string): HTMLElement {
    const el = document.createElement('div');
    el.className = 'panel-section-title';
    el.textContent = title;
    el.style.marginTop = '8px';
    return el;
  }

  private makeSlider(
    label: string,
    min: number,
    max: number,
    value: number,
    step: number,
    onChange: (v: number) => void,
    id?: string,
  ): HTMLElement {
    const container = document.createElement('div');

    const row = document.createElement('div');
    row.className = 'control-row';
    const lbl = document.createElement('span');
    lbl.className = 'control-label';
    lbl.textContent = label;
    row.appendChild(lbl);
    const val = document.createElement('span');
    val.className = 'control-value';
    val.textContent = String(Math.round(value));
    row.appendChild(val);
    container.appendChild(row);

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = String(min);
    slider.max = String(max);
    slider.value = String(value);
    slider.step = String(step);
    slider.addEventListener('input', () => {
      const v = parseFloat(slider.value);
      onChange(v);
    });
    container.appendChild(slider);

    // Store references for value display updates
    if (id === 'gravity') { this.gravityValue = val; }
    if (id === 'trail') { this.trailValue = val; }
    if (id === 'speed') { this.speedValue = val; }
    if (id === 'reverb') { this.reverbValue = val; }
    if (id === 'delay') { this.delayValue = val; }
    if (id === 'master') { this.masterValue = val; }

    return container;
  }

  /** Update the N-body toggle visual state */
  setNBodyEnabled(enabled: boolean): void {
    if (enabled) {
      this.nBodyToggle.classList.add('on');
    } else {
      this.nBodyToggle.classList.remove('on');
    }
  }
}
