/**
 * Particle system with object pooling (~200 pre-allocated).
 * Burst of 8-12 particles on trigger events.
 */

import type { Particle } from './types.js';

const POOL_SIZE = 200;
const PARTICLES_PER_BURST_MIN = 8;
const PARTICLES_PER_BURST_MAX = 12;

export class ParticleSystem {
  private pool: Particle[] = [];
  private performanceLevel: 'full' | 'reduced' | 'off' = 'full';

  constructor() {
    // Pre-allocate particle pool
    for (let i = 0; i < POOL_SIZE; i++) {
      this.pool.push({
        x: 0, y: 0,
        vx: 0, vy: 0,
        life: 0, maxLife: 0,
        radius: 0,
        color: '',
        active: false,
      });
    }
  }

  /** Set performance level based on frame time */
  setPerformanceLevel(frameTimeMs: number): void {
    if (frameTimeMs > 30) {
      this.performanceLevel = 'off';
    } else if (frameTimeMs > 20) {
      this.performanceLevel = 'reduced';
    } else {
      this.performanceLevel = 'full';
    }
  }

  /** Emit a burst of particles at the given position */
  burst(x: number, y: number, color: string, count?: number): void {
    if (this.performanceLevel === 'off') return;

    const n = count ??
      (this.performanceLevel === 'reduced'
        ? 4
        : PARTICLES_PER_BURST_MIN + Math.floor(Math.random() * (PARTICLES_PER_BURST_MAX - PARTICLES_PER_BURST_MIN + 1)));

    let spawned = 0;
    for (const particle of this.pool) {
      if (spawned >= n) break;
      if (particle.active) continue;

      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;
      const life = 300 + Math.random() * 200; // 300-500ms

      particle.x = x;
      particle.y = y;
      particle.vx = Math.cos(angle) * speed;
      particle.vy = Math.sin(angle) * speed;
      particle.life = life;
      particle.maxLife = life;
      particle.radius = 1 + Math.random() * 2;
      particle.color = color;
      particle.active = true;
      spawned++;
    }
  }

  /** Update all active particles */
  update(dt: number): void {
    for (const p of this.pool) {
      if (!p.active) continue;

      p.life -= dt * 1000;
      if (p.life <= 0) {
        p.active = false;
        continue;
      }

      // Velocity damping
      p.vx *= 0.95;
      p.vy *= 0.95;
      p.x += p.vx;
      p.y += p.vy;
    }
  }

  /** Draw all active particles */
  draw(ctx: CanvasRenderingContext2D): void {
    if (this.performanceLevel === 'off') return;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    for (const p of this.pool) {
      if (!p.active) continue;
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
