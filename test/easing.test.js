import { describe, it, expect } from 'vitest';
import { linear, easeInOut, easeOut, easeIn } from '../lib/easing.js';

const fns = { linear, easeInOut, easeOut, easeIn };

describe('easing functions', () => {
  describe('boundary values', () => {
    for (const [name, fn] of Object.entries(fns)) {
      it(`${name}(0) === 0`, () => {
        expect(fn(0)).toBe(0);
      });

      it(`${name}(1) === 1`, () => {
        expect(fn(1)).toBe(1);
      });
    }
  });

  describe('linear', () => {
    it('is the identity function', () => {
      for (const t of [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1]) {
        expect(linear(t)).toBe(t);
      }
    });
  });

  describe('easeInOut', () => {
    it('has midpoint symmetry: easeInOut(0.5) === 0.5', () => {
      expect(easeInOut(0.5)).toBe(0.5);
    });

    it('is below linear in first half, above in second half', () => {
      expect(easeInOut(0.25)).toBeLessThan(0.25);
      expect(easeInOut(0.75)).toBeGreaterThan(0.75);
    });
  });

  describe('ordering at t=0.25', () => {
    it('easeIn < linear < easeOut', () => {
      const t = 0.25;
      expect(easeIn(t)).toBeLessThan(linear(t));
      expect(linear(t)).toBeLessThan(easeOut(t));
    });
  });

  describe('monotonicity', () => {
    for (const [name, fn] of Object.entries(fns)) {
      it(`${name} is monotonically non-decreasing`, () => {
        const N = 100;
        let prev = fn(0);
        for (let i = 1; i <= N; i++) {
          const t = i / N;
          const val = fn(t);
          expect(val).toBeGreaterThanOrEqual(prev);
          prev = val;
        }
      });
    }
  });

  describe('range [0, 1]', () => {
    for (const [name, fn] of Object.entries(fns)) {
      it(`${name} output stays in [0, 1]`, () => {
        for (let i = 0; i <= 100; i++) {
          const val = fn(i / 100);
          expect(val).toBeGreaterThanOrEqual(0);
          expect(val).toBeLessThanOrEqual(1);
        }
      });
    }
  });
});
