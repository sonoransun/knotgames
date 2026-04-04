import { describe, it, expect } from 'vitest';
import { CordPath, catenaryPoints } from '../lib/cord.js';

describe('CordPath.interpolatePoints', () => {
  const from = [[0, 0, 0], [10, 10, 10], [20, 20, 20]];
  const to = [[10, 0, 0], [20, 10, 10], [30, 20, 20]];

  it('returns from points at t=0', () => {
    const result = CordPath.interpolatePoints(from, to, 0);
    expect(result).toEqual(from);
  });

  it('returns to points at t=1', () => {
    const result = CordPath.interpolatePoints(from, to, 1);
    expect(result).toEqual(to);
  });

  it('returns midpoints at t=0.5', () => {
    const result = CordPath.interpolatePoints(from, to, 0.5);
    expect(result[0]).toEqual([5, 0, 0]);
    expect(result[1]).toEqual([15, 10, 10]);
    expect(result[2]).toEqual([25, 20, 20]);
  });

  it('handles unequal length arrays (uses shorter)', () => {
    const short = [[0, 0, 0]];
    const long = [[10, 10, 10], [20, 20, 20]];
    const result = CordPath.interpolatePoints(short, long, 0.5);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual([5, 5, 5]);
  });
});

describe('catenaryPoints', () => {
  const from = [0, 10, 0];
  const to = [100, 10, 0];

  it('returns numPoints + 1 points', () => {
    const pts = catenaryPoints(from, to, 20, 12);
    expect(pts).toHaveLength(13);
  });

  it('first point matches from', () => {
    const pts = catenaryPoints(from, to, 20, 10);
    expect(pts[0]).toEqual(from);
  });

  it('last point matches to', () => {
    const pts = catenaryPoints(from, to, 20, 10);
    expect(pts[pts.length - 1]).toEqual(to);
  });

  it('middle points sag below the line when sag > 0', () => {
    const pts = catenaryPoints(from, to, 20, 10);
    const midIdx = 5;
    const linearY = from[1] + (to[1] - from[1]) * (midIdx / 10);
    expect(pts[midIdx][1]).toBeLessThan(linearY);
  });

  it('points lie on straight line when sag = 0', () => {
    const pts = catenaryPoints(from, to, 0, 10);
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      expect(pts[i][0]).toBeCloseTo(from[0] + (to[0] - from[0]) * t);
      expect(pts[i][1]).toBeCloseTo(from[1] + (to[1] - from[1]) * t);
      expect(pts[i][2]).toBeCloseTo(from[2] + (to[2] - from[2]) * t);
    }
  });

  it('x interpolates linearly regardless of sag', () => {
    const pts = catenaryPoints(from, to, 30, 10);
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      expect(pts[i][0]).toBeCloseTo(from[0] + (to[0] - from[0]) * t);
    }
  });
});
