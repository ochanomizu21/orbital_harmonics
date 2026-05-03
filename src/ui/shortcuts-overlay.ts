/**
 * Shortcuts overlay — shows keyboard shortcuts reference.
 */

export class ShortcutsOverlay {
  private overlay: HTMLElement | null = null;

  show(): void {
    if (this.overlay) return;

    this.overlay = document.createElement('div');
    this.overlay.className = 'shortcuts-overlay';

    const content = document.createElement('div');
    content.className = 'shortcuts-content';

    const title = document.createElement('h2');
    title.textContent = 'Keyboard Shortcuts';
    content.appendChild(title);

    const shortcuts = [
      ['Space', 'Pause / Resume'],
      ['Del / ⌫', 'Delete selected planet'],
      ['M', 'Mute / Unmute selected'],
      ['S', 'Solo / Unsolo selected'],
      ['1–8', 'Set synth (sine→pluck)'],
      ['G', 'Toggle N-body gravity'],
      ['R', 'Reset all planets'],
      ['H', 'Hide / Show panels'],
      ['?', 'Show this help'],
    ];

    for (const [key, desc] of shortcuts) {
      const row = document.createElement('div');
      row.className = 'shortcut-row';
      const keyEl = document.createElement('span');
      keyEl.className = 'shortcut-key';
      keyEl.textContent = key;
      const descEl = document.createElement('span');
      descEl.className = 'shortcut-desc';
      descEl.textContent = desc;
      row.appendChild(keyEl);
      row.appendChild(descEl);
      content.appendChild(row);
    }

    this.overlay.appendChild(content);

    // Dismiss on any key or click
    const dismiss = () => this.hide();
    this.overlay.addEventListener('click', dismiss);
    const keyHandler = () => {
      document.removeEventListener('keydown', keyHandler);
      dismiss();
    };
    setTimeout(() => document.addEventListener('keydown', keyHandler), 100);

    document.body.appendChild(this.overlay);
  }

  hide(): void {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
  }
}
