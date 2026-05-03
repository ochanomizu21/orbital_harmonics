/**
 * Visual effects — trigger ripples, sun flash, selection ring.
 */

import type { Ripple } from './types.js';
import { hexToRgba } from '../lib/colors.js';

export class Effects {
  private ripples: Ripple[] = [];
  private sunFlashTime = 0;
  private sunFlashDuration = 200;

  /** Create a ripple at a trigger crossing point */
  addRipple(x: number, y: number, planetRadius: number, planetColor: string): void {
    this.ripples.push({
      x,
      y,
      radius: planetRadius,
      maxRadius: 40,
      life: 400,
      maxLife: 400,
      color: planetColor,
      lineWidth: 2,
      active: true,
    });
    this.sunFlashTime = this.sunFlashDuration;
  }

  /** Trigger sun flash */
  flashSun(): void {
    this.sunFlashTime = this.sunFlashDuration;
  }

  /** Update all active effects */
  update(dtMs: number): void {
    // Update ripples
    for (const r of this.ripples) {
      if (!r.active) continue;
      r.life -= dtMs;
      if (r.life <= 0) {
        r.active = false;
      }
    }

    // Sun flash decay
    if (this.sunFlashTime > 0) {
      this.sunFlashTime = Math.max(0, this.sunFlashTime - dtMs);
    }
  }

  /** Draw all effects */
  draw(ctx: CanvasRenderingContext2D, sunX: number, sunY: number, sunRadius: number): void {
    // Draw ripples
    for (const r of this.ripples) {
      if (!r.active) continue;
      const progress = 1 - r.life / r.maxLife;
      const currentRadius = progress * r.maxRadius;
      const alpha = (1 - progress) * 0.6;

      ctx.save();
      ctx.strokeStyle = hexToRgba(r.color, alpha);
      ctx.lineWidth = r.lineWidth;
      ctx.beginPath();
      ctx.arc(r.x, r.y, currentRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Clean up inactive ripples periodically
    this.ripples = this.ripples.filter((r) => r.active);

    // Sun flash
    if (this.sunFlashTime > 0) {
      const flashAlpha = (this.sunFlashTime / this.sunFlashDuration) * 0.2;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = `rgba(255, 255, 200, ${flashAlpha})`;
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunRadius * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  /** Draw selection ring around a planet */
  drawSelectionRing(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    time: number,
  ): void {
    // Pulsing ring: opacity oscillates 100% → 30% → 100% over 1s
    const pulse = 0.65 + 0.35 * Math.sin(time * 0.001 * Math.PI * 2);
    ctx.save();
    ctx.strokeStyle = `rgba(255, 255, 255, ${pulse})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, radius + 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}
