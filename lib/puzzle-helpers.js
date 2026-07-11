// Shared per-frame boilerplate for puzzle modules — the step-resolution
// preamble, keyframe application, and highlight caching that every
// updateAnimation() otherwise re-implements. Wraps the primitives in
// animation.js / cord.js / materials.js; adds no new concepts.
import { lerpPosition, slerpEuler } from './animation.js';
import { CordPath } from './cord.js';
import { createHighlightMaterial, applyHighlight, removeHighlight } from './materials.js';

// Per-frame preamble: swap step arrows and resolve the (prevStep, step) pair.
// t is state.stepProgress — already eased by AnimationController; do not
// re-apply easing downstream.
export function resolveStep(steps, state, { arrowManager, arrowConfigs } = {}) {
  const stepIndex = state.stepIndex ?? 0;
  const t = state.stepProgress ?? 0;
  if (arrowManager) {
    if (arrowConfigs) arrowManager.showForStep(stepIndex, arrowConfigs);
    arrowManager.updateOpacity(t);
  }
  const step = steps[stepIndex];
  const prevStep = stepIndex > 0 ? steps[stepIndex - 1] : steps[0];
  return { step, prevStep, t, stepIndex };
}

// Apply one step's keyframe fields to scene objects.
// spec maps a keyframe field name -> { target: <key in objects>, kind }:
//   cordPoints — field holds a control-point array (same length across all
//                steps!); target is a CordPath
//   position   — field holds [x,y,z] or { position: [x,y,z] }; target is an
//                Object3D
//   transform  — field holds { position?, rotation? } (rotation as Euler
//                [x,y,z], interpolated via slerpEuler)
// Fields absent from either step are skipped, so partial keyframes are fine.
export function applyStepTransforms(objects, prevStep, step, t, spec) {
  for (const [field, { target, kind }] of Object.entries(spec)) {
    const from = prevStep?.[field];
    const to = step?.[field];
    const obj = objects[target];
    if (from == null || to == null || obj == null) continue;
    if (kind === 'cordPoints') {
      obj.update(CordPath.interpolatePoints(from, to, t));
    } else if (kind === 'position') {
      const f = Array.isArray(from) ? from : from.position;
      const g = Array.isArray(to) ? to : to.position;
      if (f && g) obj.position.set(...lerpPosition(f, g, t));
    } else if (kind === 'transform') {
      if (from.position && to.position) {
        obj.position.set(...lerpPosition(from.position, to.position, t));
      }
      if (from.rotation && to.rotation) {
        const e = slerpEuler(from.rotation, to.rotation, t);
        obj.rotation.set(e[0], e[1], e[2]);
      }
    }
  }
}

// Lazy per-mesh highlight materials — replaces the module-level
// `let highlightMat = null` cache (which leaks across puzzle switches because
// ES module instances persist). Call dispose() from the module's dispose().
export class HighlightCache {
  constructor() {
    this._mats = new Map();
  }

  get(mesh, color = 0x44aaff, intensity = 0.3) {
    const key = `${mesh.uuid}|${color}|${intensity}`;
    let mat = this._mats.get(key);
    if (!mat) {
      const base = mesh.userData._originalMaterial || mesh.material;
      mat = createHighlightMaterial(base, color, intensity);
      this._mats.set(key, mat);
    }
    return mat;
  }

  // Highlight on/off in one call: set(mesh, stepIndex >= 1, 0xffcc44)
  set(mesh, on, color, intensity) {
    if (on) applyHighlight(mesh, this.get(mesh, color, intensity));
    else removeHighlight(mesh);
  }

  // Highlight meshes[activeIndex], un-highlight the rest (pass -1 for none).
  applyOnly(meshes, activeIndex, color, intensity) {
    meshes.forEach((m, i) => this.set(m, i === activeIndex, color, intensity));
  }

  dispose() {
    for (const mat of this._mats.values()) mat.dispose();
    this._mats.clear();
  }
}
