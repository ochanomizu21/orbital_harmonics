/**
 * Status bar — bottom bar showing planet count, FPS, current scale, and triggers/min.
 */

export class StatusBar {
  private container: HTMLElement;
  private leftEl: HTMLElement;
  private centerEl: HTMLElement;
  private rightEl: HTMLElement;
  private hideTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    container.innerHTML = '';

    this.leftEl = document.createElement('span');
    this.leftEl.className = 'status-left';
    this.centerEl = document.createElement('span');
    this.centerEl.className = 'status-center';
    this.rightEl = document.createElement('span');
    this.rightEl.className = 'status-right';

    container.appendChild(this.leftEl);
    container.appendChild(this.centerEl);
    container.appendChild(this.rightEl);

    // Auto-hide after 5s inactivity
    this.scheduleHide();

    document.addEventListener('mousemove', () => this.show());
  }

  update(planetCount: number, fps: number, root: string, mode: string, triggersPerMin: number): void {
    this.leftEl.textContent = `Planets: ${planetCount}  |  FPS: ${Math.round(fps)}`;
    this.centerEl.textContent = `${root} ${mode.charAt(0).toUpperCase() + mode.slice(1)}`;
    this.rightEl.textContent = `Triggers: ${Math.round(triggersPerMin)}/min`;
  }

  private show(): void {
    this.container.classList.remove('hidden');
    this.scheduleHide();
  }

  private scheduleHide(): void {
    if (this.hideTimer) clearTimeout(this.hideTimer);
    this.hideTimer = setTimeout(() => {
      this.container.classList.add('hidden');
    }, 5000);
  }
}
