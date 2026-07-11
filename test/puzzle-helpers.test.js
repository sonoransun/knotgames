import { describe, it, expect, vi } from 'vitest';
import * as THREE from 'three';
import { resolveStep, applyStepTransforms, HighlightCache } from '../lib/puzzle-helpers.js';

const steps = [
  { label: 'rest', ring: { position: [0, 0, 0] } },
  { label: 'lift', ring: { position: [10, 20, 30] } },
  { label: 'done', ring: { position: [40, 20, 30] } },
];

describe('resolveStep', () => {
  it('resolves step 0 with prevStep === steps[0]', () => {
    const r = resolveStep(steps, { stepIndex: 0, stepProgress: 0.5 });
    expect(r.step).toBe(steps[0]);
    expect(r.prevStep).toBe(steps[0]);
    expect(r.t).toBe(0.5);
  });

  it('resolves later steps with the preceding step as prevStep', () => {
    const r = resolveStep(steps, { stepIndex: 2, stepProgress: 0.25 });
    expect(r.step).toBe(steps[2]);
    expect(r.prevStep).toBe(steps[1]);
    expect(r.stepIndex).toBe(2);
  });

  it('drives the arrow manager when provided', () => {
    const arrowManager = { showForStep: vi.fn(), updateOpacity: vi.fn() };
    const arrowConfigs = { 1: { arrows: [] } };
    resolveStep(steps, { stepIndex: 1, stepProgress: 0.4 }, { arrowManager, arrowConfigs });
    expect(arrowManager.showForStep).toHaveBeenCalledWith(1, arrowConfigs);
    expect(arrowManager.updateOpacity).toHaveBeenCalledWith(0.4);
  });

  it('tolerates a synthetic priming state with missing fields', () => {
    const r = resolveStep(steps, {});
    expect(r.step).toBe(steps[0]);
    expect(r.t).toBe(0);
  });
});

describe('applyStepTransforms', () => {
  it('interpolates position keyframes onto an Object3D', () => {
    const ring = new THREE.Object3D();
    applyStepTransforms({ ring }, steps[0], steps[1], 0.5, {
      ring: { target: 'ring', kind: 'position' },
    });
    expect(ring.position.x).toBeCloseTo(5);
    expect(ring.position.y).toBeCloseTo(10);
    expect(ring.position.z).toBeCloseTo(15);
  });

  it('accepts bare [x,y,z] arrays for position keyframes', () => {
    const ball = new THREE.Object3D();
    applyStepTransforms({ ball }, { ball: [0, 0, 0] }, { ball: [4, 8, 12] }, 0.25, {
      ball: { target: 'ball', kind: 'position' },
    });
    expect(ball.position.y).toBeCloseTo(2);
  });

  it('updates a cord through CordPath.interpolatePoints', () => {
    const cord = { update: vi.fn() };
    const from = { cord: [[0, 0, 0], [10, 0, 0]] };
    const to = { cord: [[0, 10, 0], [10, 10, 0]] };
    applyStepTransforms({ cord }, from, to, 0.5, {
      cord: { target: 'cord', kind: 'cordPoints' },
    });
    expect(cord.update).toHaveBeenCalledTimes(1);
    const pts = cord.update.mock.calls[0][0];
    expect(pts[0][1]).toBeCloseTo(5);
    expect(pts[1][1]).toBeCloseTo(5);
  });

  it('interpolates rotation via slerp for transform keyframes', () => {
    const obj = new THREE.Object3D();
    const from = { obj: { position: [0, 0, 0], rotation: [0, 0, 0] } };
    const to = { obj: { position: [2, 0, 0], rotation: [0, Math.PI / 2, 0] } };
    applyStepTransforms({ obj }, from, to, 1, {
      obj: { target: 'obj', kind: 'transform' },
    });
    expect(obj.position.x).toBeCloseTo(2);
    expect(obj.rotation.y).toBeCloseTo(Math.PI / 2);
  });

  it('skips fields missing from either step (partial keyframes)', () => {
    const ring = new THREE.Object3D();
    ring.position.set(7, 7, 7);
    applyStepTransforms({ ring }, { label: 'no keyframe' }, steps[1], 0.5, {
      ring: { target: 'ring', kind: 'position' },
    });
    expect(ring.position.x).toBe(7); // untouched
  });
});

describe('HighlightCache', () => {
  const makeMesh = () => new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0x808080 }),
  );

  it('lazily creates one highlight material per (mesh, color, intensity)', () => {
    const cache = new HighlightCache();
    const mesh = makeMesh();
    const a = cache.get(mesh, 0xffcc44, 0.3);
    const b = cache.get(mesh, 0xffcc44, 0.3);
    const c = cache.get(mesh, 0x44aaff, 0.3);
    expect(a).toBe(b);
    expect(c).not.toBe(a);
    expect(a.emissive.getHex()).toBe(0xffcc44);
    cache.dispose();
  });

  it('set() swaps the material on and restores it off', () => {
    const cache = new HighlightCache();
    const mesh = makeMesh();
    const original = mesh.material;
    cache.set(mesh, true, 0xffcc44);
    expect(mesh.material).not.toBe(original);
    expect(mesh.userData._originalMaterial).toBe(original);
    cache.set(mesh, false);
    expect(mesh.material).toBe(original);
    cache.dispose();
  });

  it('clones from the original material even when currently highlighted', () => {
    const cache = new HighlightCache();
    const mesh = makeMesh();
    const original = mesh.material;
    cache.set(mesh, true, 0xffcc44);
    const mat2 = cache.get(mesh, 0x44aaff, 0.5); // created while highlighted
    expect(mat2.color.getHex()).toBe(original.color.getHex());
    cache.dispose();
  });

  it('applyOnly() highlights exactly one mesh', () => {
    const cache = new HighlightCache();
    const meshes = [makeMesh(), makeMesh(), makeMesh()];
    const originals = meshes.map((m) => m.material);
    cache.applyOnly(meshes, 1, 0xffcc44);
    expect(meshes[0].material).toBe(originals[0]);
    expect(meshes[1].material).not.toBe(originals[1]);
    expect(meshes[2].material).toBe(originals[2]);
    cache.applyOnly(meshes, -1);
    expect(meshes[1].material).toBe(originals[1]);
    cache.dispose();
  });

  it('dispose() empties the cache', () => {
    const cache = new HighlightCache();
    const mesh = makeMesh();
    const a = cache.get(mesh);
    cache.dispose();
    expect(cache.get(mesh)).not.toBe(a); // re-created after dispose
    cache.dispose();
  });
});
