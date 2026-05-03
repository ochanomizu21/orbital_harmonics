/**
 * Background renderer — starfield and nebula.
 * Both pre-rendered to offscreen canvases for performance.
 */

export class Background {
  private starCanvas: OffscreenCanvas | HTMLCanvasElement;
  private nebulaCanvas: OffscreenCanvas | HTMLCanvasElement;
  private starCtx: CanvasRenderingContext2D;
  private nebulaCtx: CanvasRenderingContext2D;
  private width = 0;
  private height = 0;

  constructor() {
    // Use OffscreenCanvas where available, fallback to regular canvas
    this.starCanvas = typeof OffscreenCanvas !== 'undefined'
      ? new OffscreenCanvas(1, 1)
      : document.createElement('canvas');
    this.nebulaCanvas = typeof OffscreenCanvas !== 'undefined'
      ? new OffscreenCanvas(1, 1)
      : document.createElement('canvas');

    const starCtx = this.starCanvas.getContext('2d')!;
    const nebulaCtx = this.nebulaCanvas.getContext('2d')!;
    if (!starCtx || !nebulaCtx) throw new Error('Could not create background contexts');
    this.starCtx = starCtx as CanvasRenderingContext2D;
    this.nebulaCtx = nebulaCtx as CanvasRenderingContext2D;
  }

  /** Regenerate backgrounds for new canvas dimensions */
  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;

    this.starCanvas.width = width;
    this.starCanvas.height = height;
    this.nebulaCanvas.width = width;
    this.nebulaCanvas.height = height;

    this.drawStarfield();
    this.drawNebula();
  }

  private drawStarfield(): void {
    const ctx = this.starCtx;
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(0, 0, this.width, this.height);

    for (let i = 0; i < 200; i++) {
      const x = Math.random() * this.width;
      const y = Math.random() * this.height;
      const radius = 0.5 + Math.random() * 1.5;
      const brightness = 0.3 + Math.random() * 0.7;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
      ctx.fill();
    }
  }

  private drawNebula(): void {
    const ctx = this.nebulaCtx;
    ctx.clearRect(0, 0, this.width, this.height);

    // 2-3 radial gradient blobs at random positions
    const blobs = [
      { x: this.width * 0.3, y: this.height * 0.4, r: Math.max(this.width, this.height) * 0.4, color: [20, 30, 80] },
      { x: this.width * 0.7, y: this.height * 0.6, r: Math.max(this.width, this.height) * 0.35, color: [60, 20, 60] },
      { x: this.width * 0.5, y: this.height * 0.3, r: Math.max(this.width, this.height) * 0.3, color: [10, 40, 50] },
    ];

    for (const blob of blobs) {
      const grad = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, blob.r);
      grad.addColorStop(0, `rgba(${blob.color[0]}, ${blob.color[1]}, ${blob.color[2]}, 0.1)`);
      grad.addColorStop(1, `rgba(${blob.color[0]}, ${blob.color[1]}, ${blob.color[2]}, 0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.width, this.height);
    }
  }

  /** Draw the composited background to the main canvas */
  draw(ctx: CanvasRenderingContext2D): void {
    if (this.width === 0) return;
    ctx.drawImage(this.starCanvas as HTMLCanvasElement, 0, 0);
    ctx.drawImage(this.nebulaCanvas as HTMLCanvasElement, 0, 0);
  }
}
