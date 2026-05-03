/**
 * Fading trail overlay renderer.
 * Uses alpha-fill technique: O(1) per frame, no history arrays.
 */

export class Trails {
  private fadeRate = 0.03;

  /** Set the trail fade rate (0.01 = long, 0.1 = short) */
  setFadeRate(rate: number): void {
    this.fadeRate = rate;
  }

  /** Apply the fading overlay */
  drawFadeOverlay(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.fillStyle = `rgba(0, 0, 0, ${this.fadeRate})`;
    ctx.fillRect(0, 0, width, height);
  }

  /** Draw trail dots for a planet at its current position */
  drawTrailDot(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string,
    _radius: number = 2,
  ): void {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.6;
    ctx.fill();
    ctx.restore();
  }
}
