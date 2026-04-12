// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { validatePuzzleModule } from '../lib/validate.js';

const puzzleFiles = [
  { id: 1,  path: '../puzzles/puzzle-01.js' },
  { id: 2,  path: '../puzzles/puzzle-02.js' },
  { id: 3,  path: '../puzzles/puzzle-03.js' },
  { id: 4,  path: '../puzzles/puzzle-04.js' },
  { id: 5,  path: '../puzzles/puzzle-05.js' },
  { id: 6,  path: '../puzzles/puzzle-06.js' },
  { id: 7,  path: '../puzzles/puzzle-07.js' },
  { id: 8,  path: '../puzzles/puzzle-08.js' },
  { id: 9,  path: '../puzzles/puzzle-09.js' },
  { id: 10, path: '../puzzles/puzzle-10.js' },
  { id: 11, path: '../puzzles/puzzle-11.js' },
  { id: 12, path: '../puzzles/puzzle-12.js' },
  { id: 13, path: '../puzzles/puzzle-13.js' },
  { id: 14, path: '../puzzles/puzzle-14.js' },
  { id: 15, path: '../puzzles/puzzle-15.js' },
  { id: 16, path: '../puzzles/puzzle-16.js' },
  { id: 17, path: '../puzzles/puzzle-17.js' },
];

describe('puzzle module structure', () => {
  for (const { id, path } of puzzleFiles) {
    describe(`puzzle-${String(id).padStart(2, '0')}`, () => {
      let mod;

      it('imports successfully', async () => {
        mod = await import(path);
        expect(mod).toBeDefined();
      });

      it('passes structure validation', async () => {
        if (!mod) mod = await import(path);
        const errors = validatePuzzleModule(mod, id);
        expect(errors).toEqual([]);
      });

      it('has metadata with correct id', async () => {
        if (!mod) mod = await import(path);
        expect(mod.metadata.id).toBe(id);
      });

      it('has a non-empty name', async () => {
        if (!mod) mod = await import(path);
        expect(typeof mod.metadata.name).toBe('string');
        expect(mod.metadata.name.length).toBeGreaterThan(0);
      });

      it('has animationSteps with labels', async () => {
        if (!mod) mod = await import(path);
        expect(Array.isArray(mod.animationSteps)).toBe(true);
        expect(mod.animationSteps.length).toBeGreaterThan(0);
        for (const step of mod.animationSteps) {
          expect(typeof step.label).toBe('string');
        }
      });

      it('has cameraPosition as [x, y, z] if defined', async () => {
        if (!mod) mod = await import(path);
        if (mod.metadata.cameraPosition !== undefined) {
          expect(Array.isArray(mod.metadata.cameraPosition)).toBe(true);
          expect(mod.metadata.cameraPosition).toHaveLength(3);
          mod.metadata.cameraPosition.forEach(v => {
            expect(typeof v).toBe('number');
          });
        }
      });
    });
  }
});
