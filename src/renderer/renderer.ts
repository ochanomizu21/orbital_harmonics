/**
 * Main Renderer class.
 * Manages the canvas, render loop, and drawing order per spec §04.10.
 */

import type { Body } from '../simulation/types.js';
import type { TriggerLineState } from '../state/types.js';
import type { VisualEvent } from './types.js';
import { Background } from './background.js';
import { Trails } from './trails.js';
import { drawSun, drawPlanet } from './bodies.js';
import { drawTriggerLines } from './triggers-vis.js';
import { ParticleSystem } from './particles.js';
import { Effects } from './effects.js';

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private background: Background;
  private trails: Trails;
  private particles: ParticleSystem;
  private effects: Effects;
  private width = 0;
  private height = 0;
  private dpr = 1;
  private lastFrameTime = 0;
  private frameTime = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d')!;
    if (!ctx) throw new Error('Could not get 2D context');
    this.ctx = ctx;
    this.background = new Background();
    this.trails = new Trails();
    this.particles = new ParticleSystem();
    this.effects = new Effects();
  }

  /** Set up canvas dimensions for the current window size */
  resize(): void {
    this.dpr = window.devicePixelRatio || 1;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.background.resize(this.width, this.height);
  }

  /** Set trail fade rate */
  setTrailFadeRate(rate: number): void {
    this.trails.setFadeRate(rate);
  }

  /**
   * Main render call — draws everything for one frame.
   * Rendering order per spec §04.10:
   * 1. Background (starfield + nebula)
   * 2. Trail fade overlay
   * 3. Trigger lines
   * 4. Trail dots
   * 5. Ripples/particles
   * 6. Sun
   * 7. Planets
   * 8. Spawn gesture
   * 9. Selection ring
   */
  render(
    bodies: Body[],
    triggerLines: TriggerLineState[],
    selectedPlanetId: string | null,
    selectedTriggerLineId: string | null,
    spawnGesture: { x: number; y: number; endX: number; endY: number; active: boolean } | null,
    visualEvents: VisualEvent[],
    dt: number,
  ): void {
    const now = performance.now();
    this.frameTime = now - this.lastFrameTime;
    this.lastFrameTime = now;
    this.lastFrameTime = now;

    // Update performance-sensitive systems
    this.particles.setPerformanceLevel(this.frameTime);
    this.effects.update(dt);
    this.particles.update(dt);

    // Process visual events
    for (const evt of visualEvents) {
      if (evt.type === 'trigger') {
        this.particles.burst(evt.x, evt.y, evt.planetColor);
        this.effects.addRipple(evt.x, evt.y, evt.planetRadius, evt.planetColor);
      }
    }

    const ctx = this.ctx;

    // 1. Background
    this.background.draw(ctx);

    // 2. Trail fade overlay
    this.trails.drawFadeOverlay(ctx, this.width, this.height);

    // 3. Trigger lines
    const sun = bodies.find((b) => b.isAnchor);
    if (sun) {
      drawTriggerLines(ctx, triggerLines, sun.position.x, sun.position.y, this.width, this.height, selectedTriggerLineId);
    }

    // 4. Trail dots (current positions)
    ctx.save();
    for (const body of bodies) {
      if (body.isAnchor) continue;
      this.trails.drawTrailDot(ctx, body.position.x, body.position.y, body.color);
    }
    ctx.restore();

    // 5. Ripples and particles
    if (sun) {
      this.effects.draw(ctx, sun.position.x, sun.position.y, sun.radius);
    }
    this.particles.draw(ctx);

    // 6. Sun
    if (sun) {
      drawSun(ctx, sun, now);
    }

    // 7. Planets
    for (const body of bodies) {
      if (body.isAnchor) continue;
      drawPlanet(ctx, body);
    }

    // 8. Spawn gesture
    if (spawnGesture?.active) {
      this.drawSpawnGesture(ctx, spawnGesture);
    }

    // 9. Selection ring
    if (selectedPlanetId) {
      const selected = bodies.find((b) => b.id === selectedPlanetId);
      if (selected) {
        this.effects.drawSelectionRing(ctx, selected.position.x, selected.position.y, selected.radius, now);
      }
    }
  }

  private drawSpawnGesture(
    ctx: CanvasRenderingContext2D,
    gesture: { x: number; y: number; endX: number; endY: number; active: boolean },
  ): void {
    // Ghost planet
    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = '#4fc3f7';
    ctx.beginPath();
    ctx.arc(gesture.x, gesture.y, 8, 0, Math.PI * 2);
    ctx.fill();

    // Velocity vector (rubber band)
    const dx = gesture.endX - gesture.x;
    const dy = gesture.endY - gesture.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    // Color gradient: white → green by length
    const greenness = Math.min(length / 200, 1);
    ctx.strokeStyle = `rgb(${Math.round(255 * (1 - greenness))}, 255, ${Math.round(255 * (1 - greenness))})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(gesture.x, gesture.y);
    ctx.lineTo(gesture.endX, gesture.endY);
    ctx.stroke();

    // Arrowhead
    if (length > 10) {
      const angle = Math.atan2(dy, dx);
      const arrowLen = 10;
      ctx.beginPath();
      ctx.moveTo(gesture.endX, gesture.endY);
      ctx.lineTo(
        gesture.endX - arrowLen * Math.cos(angle - 0.4),
        gesture.endY - arrowLen * Math.sin(angle - 0.4),
      );
      ctx.moveTo(gesture.endX, gesture.endY);
      ctx.lineTo(
        gesture.endX - arrowLen * Math.cos(angle + 0.4),
        gesture.endY - arrowLen * Math.sin(angle + 0.4),
      );
      ctx.stroke();
    }

    ctx.restore();
  }

  get lastFrameTimeMs(): number {
    return this.frameTime;
  }
}
