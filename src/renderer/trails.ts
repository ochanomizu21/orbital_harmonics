/**
 * Fading trail overlay renderer.
 * Uses an offscreen canvas to persist trails between frames.
 */

export class Trails {
  private fadeRate = 0.03;
  private trailCanvas: OffscreenCanvas | HTMLCanvasElement;
  private trailCtx: CanvasRenderingContext2D;
  private width = 0;
  private height = 0;
  private dpr = 1;

  constructor() {
    this.trailCanvas = typeof OffscreenCanvas !== 'undefined'
      ? new OffscreenCanvas(1, 1)
      : document.createElement('canvas');
    this.trailCtx = this.trailCanvas.getContext('2d') as CanvasRenderingContext2D;
  }

  /** Set the trail fade rate (0.01 = long, 0.1 = short) */
  setFadeRate(rate: number): void {
    this.fadeRate = rate;
  }

  /** Resize the trail canvas */
  resize(width: number, height: number, dpr: number): void {
    this.width = width;
    this.height = height;
    this.dpr = dpr;

    const backingWidth = width * dpr;
    const backingHeight = height * dpr;

    this.trailCanvas.width = backingWidth;
    this.trailCanvas.height = backingHeight;
    this.trailCtx.setTransform(1, 0, 0, 1, 0, 0);
    this.trailCtx.fillStyle = '#000';
    this.trailCtx.fillRect(0, 0, backingWidth, backingHeight);
  }

  /** Update and draw the trail system to main ctx */
  draw(
    ctx: CanvasRenderingContext2D,
    bodies: { position: { x: number; y: number }; color: string; isAnchor: boolean }[],
  ): void {
    if (this.width === 0) return;

    // Fade the trail canvas using backing store dimensions (dpr scaled)
    const backingWidth = this.width * this.dpr;
    const backingHeight = this.height * this.dpr;
    this.trailCtx.fillStyle = `rgba(0, 0, 0, ${this.fadeRate})`;
    this.trailCtx.fillRect(0, 0, backingWidth, backingHeight);

    // Draw new trail dots (coordinates are in logical pixels - need to scale by dpr)
    this.trailCtx.save();
    this.trailCtx.globalCompositeOperation = 'lighter';
    for (const body of bodies) {
      if (body.isAnchor) continue;
      const x = body.position.x * this.dpr;
      const y = body.position.y * this.dpr;
      this.trailCtx.beginPath();
      this.trailCtx.arc(x, y, 2 * this.dpr, 0, Math.PI * 2);
      this.trailCtx.fillStyle = body.color;
      this.trailCtx.globalAlpha = 0.6;
      this.trailCtx.fill();
    }
    this.trailCtx.restore();

    // Copy trail canvas to main canvas (scaled down from backing store)
    ctx.drawImage(
      this.trailCanvas as HTMLCanvasElement,
      0, 0, backingWidth, backingHeight,
      0, 0, this.width, this.height
    );
  }
}