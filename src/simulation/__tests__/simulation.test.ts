/**
 * Tests for the main Simulation class.
 * Validates body management, escape detection, and sun immobility.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Simulation } from '../simulation.js';
import { vec2 } from '../../lib/math.js';
import { resetPaletteIndex, PLANET_PALETTE } from '../../lib/colors.js';

describe('Simulation', () => {
  let sim: Simulation;

  beforeEach(() => {
    resetPaletteIndex();
    sim = new Simulation(1000, 800);
  });

  describe('initialization', () => {
    it('has a sun at canvas center', () => {
      expect(sim.sun.position.x).toBe(500);
      expect(sim.sun.position.y).toBe(400);
      expect(sim.sun.isAnchor).toBe(true);
    });

    it('starts with running = true', () => {
      expect(sim.running).toBe(true);
    });

    it('has default G = 1.0', () => {
      expect(sim.G).toBe(1.0);
    });
  });

  describe('addPlanet', () => {
    it('adds a planet to the bodies list', () => {
      const planet = sim.addPlanet(vec2(600, 400), vec2(0, 3), 10);
      expect(sim.planets.length).toBe(1);
      expect(sim.planets[0].id).toBe(planet.id);
    });

    it('calls onBodyAdded callback', () => {
      let addedId: string | null = null;
      sim.onBodyAdded = (body) => { addedId = body.id; };

      const planet = sim.addPlanet(vec2(600, 400), vec2(0, 3), 10);
      expect(addedId).toBe(planet.id);
    });

    it('derives radius from mass', () => {
      const planet = sim.addPlanet(vec2(600, 400), vec2(0, 3), 27);
      // radius = clamp(27^(1/3) * 2, 4, 20) = clamp(6, 4, 20) = 6
      expect(planet.radius).toBeCloseTo(Math.pow(27, 1 / 3) * 2);
    });

    it('clamps radius to minimum 4px', () => {
      const planet = sim.addPlanet(vec2(600, 400), vec2(0, 3), 0.5);
      expect(planet.radius).toBe(4);
    });

    it('clamps radius to maximum 20px', () => {
      const planet = sim.addPlanet(vec2(600, 400), vec2(0, 3), 5000);
      expect(planet.radius).toBe(20);
    });

    it('assigns a unique ID', () => {
      const p1 = sim.addPlanet(vec2(600, 400), vec2(0, 3), 10);
      const p2 = sim.addPlanet(vec2(400, 400), vec2(0, -3), 10);
      expect(p1.id).not.toBe(p2.id);
    });

    it('assigns a non-anchor planet', () => {
      const planet = sim.addPlanet(vec2(600, 400), vec2(0, 3), 10);
      expect(planet.isAnchor).toBe(false);
    });
  });

  describe('removeBody', () => {
    it('removes a planet by ID', () => {
      const planet = sim.addPlanet(vec2(600, 400), vec2(0, 3), 10);
      sim.removeBody(planet.id);
      expect(sim.planets.length).toBe(0);
    });

    it('calls onBodyRemoved callback', () => {
      let removedId: string | null = null;
      sim.onBodyRemoved = (id) => { removedId = id; };

      const planet = sim.addPlanet(vec2(600, 400), vec2(0, 3), 10);
      sim.removeBody(planet.id);
      expect(removedId).toBe(planet.id);
    });

    it('cannot remove the sun', () => {
      sim.removeBody('sun');
      expect(sim.bodies).toContain(sim.sun);
    });
  });

  describe('reset', () => {
    it('removes all planets but keeps the sun', () => {
      sim.addPlanet(vec2(600, 400), vec2(0, 3), 10);
      sim.addPlanet(vec2(400, 400), vec2(0, -3), 10);
      sim.reset();
      expect(sim.planets.length).toBe(0);
      expect(sim.bodies).toContain(sim.sun);
    });

    it('calls onBodyRemoved for each planet', () => {
      const removed: string[] = [];
      sim.onBodyRemoved = (id) => removed.push(id);

      const p1 = sim.addPlanet(vec2(600, 400), vec2(0, 3), 10);
      const p2 = sim.addPlanet(vec2(400, 400), vec2(0, -3), 10);
      sim.reset();
      expect(removed).toContain(p1.id);
      expect(removed).toContain(p2.id);
    });

    it('resets planet counter so new planets start from Planet 1', () => {
      sim.addPlanet(vec2(600, 400), vec2(0, 3), 10);
      sim.addPlanet(vec2(400, 400), vec2(0, -3), 10);
      sim.reset();
      const newPlanet = sim.addPlanet(vec2(600, 400), vec2(0, 3), 10);
      expect(newPlanet.name).toBe('Planet 1');
    });

    it('resets palette index so new planets get first palette color', () => {
      sim.addPlanet(vec2(600, 400), vec2(0, 3), 10);
      sim.addPlanet(vec2(600, 400), vec2(0, 3), 10);
      sim.reset();
      const p2 = sim.addPlanet(vec2(600, 400), vec2(0, 3), 10);
      expect(p2.color).toBe(PLANET_PALETTE[0]); // first palette color
    });
  });

  describe('step', () => {
    it('does not step when paused', () => {
      const planet = sim.addPlanet(vec2(600, 400), vec2(0, 3), 10);
      const initialPos = { ...planet.position };
      sim.running = false;
      sim.step();
      expect(planet.position.x).toBe(initialPos.x);
      expect(planet.position.y).toBe(initialPos.y);
    });

    it('updates positions when running', () => {
      const planet = sim.addPlanet(vec2(600, 400), vec2(0, 3), 10);
      const initialPos = { ...planet.position };
      sim.step();
      // Position should have changed (at least velocity contribution)
      expect(planet.position.y).not.toBe(initialPos.y);
    });

    it('sun stays immovable after steps', () => {
      sim.addPlanet(vec2(600, 400), vec2(0, 3), 10);
      const sunPos = { ...sim.sun.position };
      sim.step();
      expect(sim.sun.position.x).toBe(sunPos.x);
      expect(sim.sun.position.y).toBe(sunPos.y);
    });
  });

  describe('escape detection', () => {
    it('flags planets beyond 2× canvas diagonal', () => {
      const planet = sim.addPlanet(vec2(10000, 10000), vec2(0, 0), 10);
      sim.step();
      expect(planet.escapedAt).toBeGreaterThan(0);
    });
  });

  describe('updateCanvasSize', () => {
    it('moves sun to new center', () => {
      sim.updateCanvasSize(1200, 600);
      expect(sim.sun.position.x).toBe(600);
      expect(sim.sun.position.y).toBe(300);
    });
  });
});
