/**
 * Trigger line rendering — subtle glowing lines through the sun.
 */

import type { TriggerLineState } from '../state/types.js';

export function drawTriggerLines(
  ctx: CanvasRenderingContext2D,
  lines: TriggerLineState[],
  sunX: number,
  sunY: number,
  canvasWidth: number,
  canvasHeight: number,
  selectedLineId: string | null,
): void {
  const diag = Math.sqrt(canvasWidth * canvasWidth + canvasHeight * canvasHeight);

  for (const line of lines) {
    const isSelected = line.id === selectedLineId;
    const alpha = isSelected ? 0.4 : 0.15;

    ctx.save();
    ctx.strokeStyle = `rgba(100, 150, 255, ${alpha})`;
    ctx.lineWidth = 1;
    ctx.beginPath();

    // Line from sun extending in both directions at the given angle
    const dx = Math.cos(line.angle) * diag;
    const dy = Math.sin(line.angle) * diag;
    ctx.moveTo(sunX - dx, sunY - dy);
    ctx.lineTo(sunX + dx, sunY + dy);
    ctx.stroke();

    // Draw rotation handles if selected
    if (isSelected) {
      const handleDist = Math.min(canvasWidth, canvasHeight) / 2 - 20;
      const hx1 = sunX + Math.cos(line.angle) * handleDist;
      const hy1 = sunY + Math.sin(line.angle) * handleDist;
      const hx2 = sunX - Math.cos(line.angle) * handleDist;
      const hy2 = sunY - Math.sin(line.angle) * handleDist;

      ctx.fillStyle = 'rgba(100, 150, 255, 0.5)';
      ctx.beginPath();
      ctx.arc(hx1, hy1, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(hx2, hy2, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
