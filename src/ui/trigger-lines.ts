/**
 * Trigger line interaction — click/touch to select, drag handles to rotate.
 * Supports both mouse and touch events for mobile.
 */

import type { TriggerLineState } from '../state/types.js';

export interface TriggerLineCallbacks {
  onSelectLine: (id: string | null) => void;
  onRotateLine: (id: string, angle: number) => void;
}

export class TriggerLineInteraction {
  private canvas: HTMLCanvasElement;
  private callbacks: TriggerLineCallbacks;
  private lines: TriggerLineState[] = [];
  private sunX = 0;
  private sunY = 0;
  /** Whether a trigger line handle is currently being dragged */
  isDragging = false;
  private draggingId: string | null = null;

  constructor(canvas: HTMLCanvasElement, callbacks: TriggerLineCallbacks) {
    this.canvas = canvas;
    this.callbacks = callbacks;
    this.attach();
  }

  /** Update trigger lines and sun position */
  update(lines: TriggerLineState[], sunX: number, sunY: number): void {
    this.lines = lines;
    this.sunX = sunX;
    this.sunY = sunY;
  }

  private attach(): void {
    // Mouse events
    this.canvas.addEventListener('mousedown', (e) => {
      this.handleStart(e.clientX, e.clientY);
    });

    this.canvas.addEventListener('mousemove', (e) => {
      this.handleMove(e.clientX, e.clientY);
    });

    this.canvas.addEventListener('mouseup', () => {
      this.handleEnd();
    });

    // Touch events for mobile
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.handleStart(touch.clientX, touch.clientY);
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.handleMove(touch.clientX, touch.clientY);
    }, { passive: false });

    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.handleEnd();
    }, { passive: false });
  }

  private handleStart(x: number, y: number): void {
    // Check if near a trigger line
    const result = this.findNearLine(x, y);
    if (result) {
      this.draggingId = result.lineId;
      this.isDragging = true;
      this.callbacks.onSelectLine(result.lineId);
    }
  }

  private handleMove(x: number, y: number): void {
    if (!this.draggingId) return;
    // Compute angle from sun to mouse
    const dx = x - this.sunX;
    const dy = y - this.sunY;
    const angle = Math.atan2(dy, dx);
    this.callbacks.onRotateLine(this.draggingId, angle);
  }

  private handleEnd(): void {
    this.draggingId = null;
    this.isDragging = false;
  }

  private findNearLine(x: number, y: number): { lineId: string } | null {
    const threshold = 10;

    for (const line of this.lines) {
      // Signed distance from point to line through sun at given angle
      const nx = Math.sin(line.angle);
      const ny = -Math.cos(line.angle);
      const dx = x - this.sunX;
      const dy = y - this.sunY;
      const dist = Math.abs(dx * nx + dy * ny);

      if (dist < threshold) {
        return { lineId: line.id };
      }
    }

    return null;
  }
}
