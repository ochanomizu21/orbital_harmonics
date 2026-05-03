/**
 * Keyboard shortcuts handler.
 * Per spec §05.8.
 */

export interface KeyboardCallbacks {
  onTogglePause: () => void;
  onDeleteSelected: () => void;
  onMuteSelected: () => void;
  onSoloSelected: () => void;
  onSetSynth: (index: number) => void;
  onToggleNBody: () => void;
  onResetAll: () => void;
  onTogglePanels: () => void;
  onShowShortcuts: () => void;
}

const SYNTH_MAP: Record<string, number> = {
  '1': 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5, '7': 6, '8': 7,
};

export class KeyboardHandler {
  private callbacks: KeyboardCallbacks;

  constructor(callbacks: KeyboardCallbacks) {
    this.callbacks = callbacks;
    this.attach();
  }

  private attach(): void {
    document.addEventListener('keydown', (e) => {
      // Don't capture when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          this.callbacks.onTogglePause();
          break;
        case 'Delete':
        case 'Backspace':
          e.preventDefault();
          this.callbacks.onDeleteSelected();
          break;
        case 'm':
        case 'M':
          this.callbacks.onMuteSelected();
          break;
        case 's':
        case 'S':
          if (!e.ctrlKey && !e.metaKey) {
            this.callbacks.onSoloSelected();
          }
          break;
        case 'g':
        case 'G':
          this.callbacks.onToggleNBody();
          break;
        case 'r':
        case 'R':
          if (!e.ctrlKey && !e.metaKey) {
            this.callbacks.onResetAll();
          }
          break;
        case 'h':
        case 'H':
          this.callbacks.onTogglePanels();
          break;
        case '?':
          this.callbacks.onShowShortcuts();
          break;
        default:
          if (SYNTH_MAP[e.key] !== undefined) {
            this.callbacks.onSetSynth(SYNTH_MAP[e.key]);
          }
      }
    });
  }
}
