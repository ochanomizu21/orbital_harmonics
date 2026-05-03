/**
 * Body rendering — sun and planets with glow effects.
 */

import type { Body } from '../simulation/types.js';
import { hexToRgba } from '../lib/colors.js';

/** Render the sun with radial gradient glow and pulsing animation */
export function drawSun(ctx: CanvasRenderingContext2D, sun: Body, time: number): void {
  const pulseOffset = Math.sin(time * 0.001 * Math.PI * 2 / 4) * 2; // ~4s period
  const radius = sun.radius + pulseOffset;

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  // Outer glow
  const glowGrad = ctx.createRadialGradient(
    sun.position.x, sun.position.y, 0,
    sun.position.x, sun.position.y, radius * 3,
  );
  glowGrad.addColorStop(0, 'rgba(255, 213, 79, 0.3)');
  glowGrad.addColorStop(1, 'rgba(255, 143, 0, 0)');
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(sun.position.x, sun.position.y, radius * 3, 0, Math.PI * 2);
  ctx.fill();

  // Core
  const coreGrad = ctx.createRadialGradient(
    sun.position.x, sun.position.y, 0,
    sun.position.x, sun.position.y, radius,
  );
  coreGrad.addColorStop(0, '#ffffff');
  coreGrad.addColorStop(0.3, '#ffd54f');
  coreGrad.addColorStop(0.7, '#ff8f00');
  coreGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(sun.position.x, sun.position.y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/** Render a planet with glow */
export function drawPlanet(ctx: CanvasRenderingContext2D, body: Body): void {
  const { position, radius, color } = body;

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  // Outer glow (2× radius)
  const glowGrad = ctx.createRadialGradient(
    position.x, position.y, 0,
    position.x, position.y, radius * 2,
  );
  glowGrad.addColorStop(0, hexToRgba(color, 0.4));
  glowGrad.addColorStop(1, hexToRgba(color, 0));
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(position.x, position.y, radius * 2, 0, Math.PI * 2);
  ctx.fill();

  // Core with white center
  const coreGrad = ctx.createRadialGradient(
    position.x, position.y, 0,
    position.x, position.y, radius,
  );
  coreGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
  coreGrad.addColorStop(0.4, hexToRgba(color, 0.8));
  coreGrad.addColorStop(1, hexToRgba(color, 0.3));
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(position.x, position.y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // Dimming indicator for escaped planets
  if (body.escapedAt > 0) {
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#0a0a14';
    ctx.beginPath();
    ctx.arc(position.x, position.y, radius + 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
