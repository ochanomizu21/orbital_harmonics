/**
 * Sidebar — planet list with mute/solo/delete controls.
 * DOM-based UI built with vanilla TypeScript.
 */

import type { Body } from '../simulation/types.js';
import type { SynthType } from '../audio/types.js';
import { SYNTH_LABELS } from '../audio/types.js';

export interface SidebarCallbacks {
  onSelectPlanet: (id: string | null) => void;
  onMutePlanet: (id: string) => void;
  onSoloPlanet: (id: string) => void;
  onDeletePlanet: (id: string) => void;
}

export class Sidebar {
  private container: HTMLElement;
  private listEl: HTMLElement;
  private emptyEl: HTMLElement;
  private callbacks: SidebarCallbacks;

  constructor(container: HTMLElement, callbacks: SidebarCallbacks) {
    this.container = container;
    this.callbacks = callbacks;

    this.container.innerHTML = '';

    // Title
    const title = document.createElement('div');
    title.className = 'panel-section-title';
    title.textContent = 'PLANETS';
    this.container.appendChild(title);

    // Planet list
    this.listEl = document.createElement('ul');
    this.listEl.className = 'planet-list';
    this.container.appendChild(this.listEl);

    // Empty state
    this.emptyEl = document.createElement('div');
    this.emptyEl.className = 'empty-state';
    this.emptyEl.textContent = 'Click and drag on the canvas to spawn a planet.';
    this.container.appendChild(this.emptyEl);

    // Editor container (populated when planet selected)
    this.editorEl = document.createElement('div');
    this.editorEl.className = 'planet-editor';
    this.editorEl.style.display = 'none';
    this.container.appendChild(this.editorEl);
  }

  private editorEl: HTMLElement;

  /** Update the sidebar to reflect current bodies and selection */
  update(bodies: Body[], selectedId: string | null, planetStates?: Map<string, { synthType: SynthType }>): void {
    const planets = bodies.filter((b) => !b.isAnchor);

    // Toggle empty state
    this.emptyEl.style.display = planets.length === 0 ? 'block' : 'none';

    // Rebuild list
    this.listEl.innerHTML = '';

    for (const planet of planets) {
      const row = document.createElement('li');
      row.className = 'planet-row' +
        (planet.id === selectedId ? ' selected' : '') +
        (planet.muted ? ' muted' : '');
      row.style.borderLeftColor = planet.id === selectedId ? planet.color : 'transparent';

      // Color dot
      const dot = document.createElement('span');
      dot.className = 'planet-color-dot';
      dot.style.background = planet.color;
      row.appendChild(dot);

      // Name
      const name = document.createElement('span');
      name.className = 'planet-name';
      name.textContent = planet.name;
      row.appendChild(name);

      // Synth label — read from planet state
      const synthLabel = document.createElement('span');
      synthLabel.className = 'planet-synth-label';
      const pState = planetStates?.get(planet.id);
      synthLabel.textContent = pState ? SYNTH_LABELS[pState.synthType] : 'FM';
      row.appendChild(synthLabel);

      // Mute button
      const muteBtn = document.createElement('button');
      muteBtn.className = 'planet-btn' + (planet.muted ? ' active' : '');
      muteBtn.textContent = planet.muted ? '🔇' : '🔈';
      muteBtn.title = 'Mute';
      muteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.callbacks.onMutePlanet(planet.id);
      });
      row.appendChild(muteBtn);

      // Solo button
      const soloBtn = document.createElement('button');
      soloBtn.className = 'planet-btn' + (planet.soloed ? ' active' : '');
      soloBtn.textContent = planet.soloed ? '🎯' : '◎';
      soloBtn.title = 'Solo';
      soloBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.callbacks.onSoloPlanet(planet.id);
      });
      row.appendChild(soloBtn);

      // Delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'planet-btn delete';
      deleteBtn.textContent = '✕';
      deleteBtn.title = 'Delete';
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.callbacks.onDeletePlanet(planet.id);
      });
      row.appendChild(deleteBtn);

      // Click row to select
      row.addEventListener('click', () => {
        this.callbacks.onSelectPlanet(planet.id);
      });

      this.listEl.appendChild(row);
    }
  }

  /** Update the planet editor panel for the selected planet */
  updateEditor(
    planet: Body | null,
    synthType: SynthType,
    volume: number,
    pan: number,
    onChangeSynth: (type: SynthType) => void,
    onChangeVolume: (vol: number) => void,
    onChangePan: (pan: number) => void,
    onChangeMass: (mass: number) => void,
    onChangeColor: (color: string) => void,
  ): void {
    if (!planet) {
      this.editorEl.style.display = 'none';
      return;
    }

    this.editorEl.style.display = 'block';
    this.editorEl.innerHTML = '';

    const title = document.createElement('div');
    title.className = 'panel-section-title';
    title.textContent = 'PLANET SETTINGS';
    this.editorEl.appendChild(title);

    // Synth dropdown
    const synthRow = this.createControlRow('Synth Engine');
    const synthSelect = document.createElement('select');
    for (const type of ['sine', 'triangle', 'sawtooth', 'square', 'fm', 'marimba', 'bell', 'pluck'] as SynthType[]) {
      const opt = document.createElement('option');
      opt.value = type;
      opt.textContent = SYNTH_LABELS[type];
      if (type === synthType) opt.selected = true;
      synthSelect.appendChild(opt);
    }
    synthSelect.addEventListener('change', () => onChangeSynth(synthSelect.value as SynthType));
    synthRow.appendChild(synthSelect);
    this.editorEl.appendChild(synthRow);

    // Volume slider
    this.editorEl.appendChild(
      this.createSlider('Volume', volume * 100, 0, 100, (val) => onChangeVolume(val / 100)),
    );

    // Pan slider
    this.editorEl.appendChild(
      this.createSlider('Pan', (pan + 1) * 50, 0, 100, (val) => onChangePan(val / 50 - 1), 'L', 'R'),
    );

    // Mass slider
    this.editorEl.appendChild(
      this.createSlider('Mass', planet.mass, 1, 50, onChangeMass),
    );

    // Color picker
    const colorRow = this.createControlRow('Color');
    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.value = planet.color;
    colorInput.style.width = '40px';
    colorInput.style.height = '24px';
    colorInput.style.border = 'none';
    colorInput.style.background = 'none';
    colorInput.style.cursor = 'pointer';
    colorInput.addEventListener('input', () => onChangeColor(colorInput.value));
    colorRow.appendChild(colorInput);
    this.editorEl.appendChild(colorRow);
  }

  private createControlRow(label: string): HTMLElement {
    const row = document.createElement('div');
    row.className = 'control-row';
    const lbl = document.createElement('span');
    lbl.className = 'control-label';
    lbl.textContent = label;
    row.appendChild(lbl);
    return row;
  }

  private createSlider(
    label: string,
    value: number,
    min: number,
    max: number,
    onChange: (value: number) => void,
    leftLabel?: string,
    rightLabel?: string,
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
    val.textContent = leftLabel ? (value < 50 ? leftLabel : value > 50 ? rightLabel || '' : 'C') : String(Math.round(value));
    row.appendChild(val);

    container.appendChild(row);

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = String(min);
    slider.max = String(max);
    slider.value = String(value);
    slider.addEventListener('input', () => {
      const v = parseFloat(slider.value);
      val.textContent = leftLabel ? (v < 50 ? leftLabel : v > 50 ? rightLabel || '' : 'C') : String(Math.round(v));
      onChange(v);
    });
    container.appendChild(slider);

    return container;
  }
}
