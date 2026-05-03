/**
 * Renderer type definitions.
 */

export interface RenderConfig {
  trailFadeRate: number;
  showTrails: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  radius: number;
  color: string;
  active: boolean;
}

export interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  life: number;
  maxLife: number;
  color: string;
  lineWidth: number;
  active: boolean;
}

export interface VisualEvent {
  type: 'trigger';
  x: number;
  y: number;
  planetColor: string;
  planetRadius: number;
}
