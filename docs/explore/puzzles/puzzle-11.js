import * as THREE from 'three';
import { createMaterials, createHighlightMaterial, applyHighlight, removeHighlight } from '../lib/materials.js';
import { createRod, createBall, createBlock } from '../lib/components.js';
import { CordPath } from '../lib/cord.js';
import { enableShadowsOnGroup } from '../lib/scene.js';
import { StepArrowManager } from '../lib/arrow-helpers.js';
import * as svg from '../lib/svg.js';

export const metadata = {
  id: 5,
  name: 'The Mirror Gate',
  difficulty: 'Intermediate',
  principle: 'Chirality (handedness)',
  type: 'Identification',
  description: 'Two trefoil-shaped wire frames look identical but are mirror images — one left-handed, one right-handed. Each must be matched to its recess. No rotation in 3D can turn one into the other.',
  cameraPosition: [0, 80, 220],
};

const ROD_R = 2;
const TREFOIL_SCALE = 35;

// Parametric trefoil knot: (x,y,z) as a function of t in [0, 2pi]
function trefoilPoint(t, scale, handedness = 1) {
  const x = Math.sin(t) + 2 * Math.sin(2 * t);
  const y = Math.cos(t) - 2 * Math.cos(2 * t);
  const z = handedness * (-Math.sin(3 * t));
  return [x * scale, y * scale, z * scale * 0.5];
}

function trefoilPoints(scale, handedness = 1, segments = 64) {
  const pts = [];
  for (let i = 0; i <= segments; i++) {
    const t = (2 * Math.PI * i) / segments;
    pts.push(trefoilPoint(t, scale, handedness));
  }
  return pts;
}

function createTrefoilFrame(material, scale, handedness) {
  const pts = trefoilPoints(scale, handedness);
  return createRod(pts, ROD_R, material, true);
}

// Base with two recesses (visual indication only in 3D — shown as colored platforms)
function createBase(mats) {
  const group = new THREE.Group();
  const base = createBlock(200, 10, 80, mats.wood);
  base.position.y = -5;
  group.add(base);

  // Left recess marker
  const leftMarker = createBlock(60, 2, 60, mats.red);
  leftMarker.position.set(-55, 1, 0);
  group.add(leftMarker);

  // Right recess marker
  const rightMarker = createBlock(60, 2, 60, mats.blue);
  rightMarker.position.set(55, 1, 0);
  group.add(rightMarker);

  return group;
}

export function create3DScene() {
  const mats = createMaterials();
  const group = new THREE.Group();

  // Base
  const base = createBase(mats);
  group.add(base);

  // Left-handed trefoil (red) — seated in left recess
  const leftTrefoil = createTrefoilFrame(mats.red, TREFOIL_SCALE, -1);
  leftTrefoil.position.set(-55, 40, 0);
  group.add(leftTrefoil);

  // Right-handed trefoil (blue) — seated in right recess
  const rightTrefoil = createTrefoilFrame(mats.blue, TREFOIL_SCALE, 1);
  rightTrefoil.position.set(55, 40, 0);
  group.add(rightTrefoil);

  // Center post with cord
  const post = new THREE.Mesh(
    new THREE.CylinderGeometry(3, 3, 30, 12),
    mats.steel
  );
  post.position.set(0, 15, 0);
  group.add(post);

  enableShadowsOnGroup(group);
  return group;
}

export function createAnimScene() {
  const mats = createMaterials();
  const group = new THREE.Group();

  const base = createBase(mats);
  group.add(base);

  // Both trefoils start in wrong positions (swapped)
  const leftTrefoil = createTrefoilFrame(mats.red, TREFOIL_SCALE, -1);
  leftTrefoil.position.set(55, 40, 0); // starts on wrong side
  group.add(leftTrefoil);

  const rightTrefoil = createTrefoilFrame(mats.blue, TREFOIL_SCALE, 1);
  rightTrefoil.position.set(-55, 40, 0); // starts on wrong side
  group.add(rightTrefoil);

  const post = new THREE.Mesh(
    new THREE.CylinderGeometry(3, 3, 30, 12),
    mats.steel
  );
  post.position.set(0, 15, 0);
  group.add(post);

  enableShadowsOnGroup(group);
  const arrowManager = new StepArrowManager(group);

  return { group, objects: { leftTrefoil, rightTrefoil, arrowManager } };
}

const WRONG = { left: [55, 40, 0], right: [-55, 40, 0] };
const LIFT = { left: [55, 80, 0], right: [-55, 80, 0] };
const CROSS = { left: [-55, 80, 0], right: [55, 80, 0] };
const CORRECT = { left: [-55, 40, 0], right: [55, 40, 0] };

const arrowConfigs = {
  1: { arrows: [
    { from: [55, 40, 0], to: [55, 80, 0], opts: { color: 0xcc4444 } },
    { from: [-55, 40, 0], to: [-55, 80, 0], opts: { color: 0x4444cc } },
  ]},
  2: { arrows: [
    { from: [55, 80, 0], to: [-55, 80, 0], opts: { color: 0xcc4444 } },
    { from: [-55, 80, 0], to: [55, 80, 0], opts: { color: 0x4444cc } },
  ]},
  3: { arrows: [
    { from: [-55, 80, 0], to: [-55, 40, 0], opts: { color: 0xcc4444 } },
    { from: [55, 80, 0], to: [55, 40, 0], opts: { color: 0x4444cc } },
  ]},
};

let highlightMat = null;

export const animationSteps = [
  {
    label: 'Look: two shapes sit in the wrong recesses — they look the same',
    duration: 2.5,
    positions: WRONG,
  },
  {
    label: 'Lift both shapes up to compare their spiral directions',
    duration: 2.0,
    positions: LIFT,
    easing: 'easeOut',
  },
  {
    label: 'Swap them — the red one goes left, the blue one goes right',
    duration: 2.5,
    positions: CROSS,
  },
  {
    label: 'Set each shape into its matching recess — perfect fit!',
    duration: 2.0,
    positions: CORRECT,
    easing: 'easeOut',
  },
];

export function updateAnimation(objects, state) {
  const { stepIndex, stepProgress } = state;

  // Direction arrows
  if (objects.arrowManager) {
    objects.arrowManager.showForStep(stepIndex, arrowConfigs);
    objects.arrowManager.updateOpacity(stepProgress);
  }

  // Highlight trefoils during movement steps
  if (stepIndex >= 1) {
    if (!highlightMat) {
      highlightMat = createHighlightMaterial(objects.leftTrefoil.material, 0xffaa44, 0.3);
    }
    applyHighlight(objects.leftTrefoil, highlightMat);
    applyHighlight(objects.rightTrefoil, highlightMat);
  } else {
    removeHighlight(objects.leftTrefoil);
    removeHighlight(objects.rightTrefoil);
  }

  const step = animationSteps[stepIndex];
  const prevStep = stepIndex > 0 ? animationSteps[stepIndex - 1] : animationSteps[0];

  const fl = prevStep.positions.left;
  const tl = step.positions.left;
  objects.leftTrefoil.position.set(
    fl[0] + (tl[0] - fl[0]) * stepProgress,
    fl[1] + (tl[1] - fl[1]) * stepProgress,
    fl[2] + (tl[2] - fl[2]) * stepProgress,
  );

  const fr = prevStep.positions.right;
  const tr = step.positions.right;
  objects.rightTrefoil.position.set(
    fr[0] + (tr[0] - fr[0]) * stepProgress,
    fr[1] + (tr[1] - fr[1]) * stepProgress,
    fr[2] + (tr[2] - fr[2]) * stepProgress,
  );
}

export function createSVGDiagram(container) {
  const s = svg.createSVG(container, 500, 400);
  const NEG = 'var(--dia-neg, #cf3a26)';
  const CORD = 'var(--dia-cord, #1f57c4)';
  const FAINT = 'var(--dia-faint, #c9bda7)';
  const RIGID = 'var(--dia-rigid, #8a8275)';
  const RING = 'var(--dia-ring, #b97d12)';

  svg.text(s, 250, 25, 'The Mirror Gate — Chirality', {
    fontSize: 14, anchor: 'middle', fontWeight: 'bold',
  });

  // Home positions (resting in the wrong recess) for both shapes
  const lx = 140, ly = 160;
  const rx = 360, ry = 160;

  // Left-handed trefoil (red) — wrapped in a group so the updater can translate it
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const leftGroup = document.createElementNS(SVG_NS, 'g');
  s.appendChild(leftGroup);
  // Simplified trefoil diagram — three lobes with crossing indicators
  svg.path(leftGroup, `M ${lx} ${ly - 40} C ${lx - 60} ${ly - 50}, ${lx - 50} ${ly + 30}, ${lx} ${ly + 10} C ${lx + 50} ${ly - 10}, ${lx + 60} ${ly + 50}, ${lx} ${ly + 40} C ${lx - 50} ${ly + 50}, ${lx + 50} ${ly - 50}, ${lx} ${ly - 40}`, {
    stroke: NEG, strokeWidth: 3, fill: 'none',
  });
  svg.text(s, lx, ly + 70, 'Left-handed', { fontSize: 11, anchor: 'middle', fill: NEG, fontWeight: 'bold' });
  svg.text(s, lx, ly + 84, '(counterclockwise spiral)', { fontSize: 9, anchor: 'middle', fill: RIGID });

  // Right-handed trefoil (blue) — mirror image
  const rightGroup = document.createElementNS(SVG_NS, 'g');
  s.appendChild(rightGroup);
  svg.path(rightGroup, `M ${rx} ${ry - 40} C ${rx + 60} ${ry - 50}, ${rx + 50} ${ry + 30}, ${rx} ${ry + 10} C ${rx - 50} ${ry - 10}, ${rx - 60} ${ry + 50}, ${rx} ${ry + 40} C ${rx + 50} ${ry + 50}, ${rx - 50} ${ry - 50}, ${rx} ${ry - 40}`, {
    stroke: CORD, strokeWidth: 3, fill: 'none',
  });
  svg.text(s, rx, ry + 70, 'Right-handed', { fontSize: 11, anchor: 'middle', fill: CORD, fontWeight: 'bold' });
  svg.text(s, rx, ry + 84, '(clockwise spiral)', { fontSize: 9, anchor: 'middle', fill: RIGID });

  leftGroup.style.transition = 'transform .15s ease';
  rightGroup.style.transition = 'transform .15s ease';

  // Mirror line
  svg.line(s, 250, 80, 250, 260, { stroke: FAINT, strokeWidth: 1, dashArray: '6,4' });
  svg.text(s, 250, 275, 'mirror', { fontSize: 10, anchor: 'middle', fill: FAINT });

  // Base with recesses
  svg.rect(s, 60, 310, 160, 30, { fill: 'var(--dia-wash, #ece3d0)', stroke: NEG, strokeWidth: 1.5, rx: 3 });
  svg.text(s, 140, 330, 'Left recess', { fontSize: 10, anchor: 'middle', fill: NEG });
  svg.rect(s, 280, 310, 160, 30, { fill: 'var(--dia-wash, #ece3d0)', stroke: CORD, strokeWidth: 1.5, rx: 3 });
  svg.text(s, 360, 330, 'Right recess', { fontSize: 10, anchor: 'middle', fill: CORD });

  // Motion arrows showing the swap (toggled per step by the updater)
  const arrowSwapRed = svg.motionArrow(s, lx, ly + 30, rx, ly + 30, { label: 'Swap sides', curvature: 0.3, color: NEG });
  const arrowSwapBlue = svg.motionArrow(s, rx, ly - 10, lx, ly - 10, { label: 'Swap sides', curvature: 0.3, color: CORD });

  // Hand icons near both trefoils
  svg.handIcon(s, lx + 40, ly - 20, { scale: 0.6, rotation: 15 });
  svg.handIcon(s, rx - 40, ly - 20, { scale: 0.6, rotation: -15 });

  // Step badges (highlighted per phase by the updater)
  const badge1 = svg.stepBadge(s, 30, 100, 1, 3, { radius: 11 });
  svg.actionLabel(s, 90, 100, 'Lift both shapes up');
  const badge2 = svg.stepBadge(s, 30, 128, 2, 3, { radius: 11 });
  svg.actionLabel(s, 115, 128, 'Check spiral direction');
  const badge3 = svg.stepBadge(s, 30, 156, 3, 3, { radius: 11 });
  svg.actionLabel(s, 120, 156, 'Swap and seat in recesses');
  const badges = [badge1, badge2, badge3];

  // Key insight
  const calloutRect = svg.rect(s, 30, 355, 440, 35, { fill: 'var(--dia-wash, #ece3d0)', stroke: RING, strokeWidth: 1, rx: 4 });
  calloutRect.classList.add('callout-box');
  svg.text(s, 250, 377, 'These shapes are mirror images — no rotation can turn one into the other!', {
    fontSize: 11, anchor: 'middle', fill: RING,
  });

  let styleEl = s.querySelector('style[data-anim]');
  if (!styleEl) {
    styleEl = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    styleEl.setAttribute('data-anim', '1');
    s.insertBefore(styleEl, s.firstChild);
  }
  styleEl.textContent += `
    @keyframes calloutPulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
    .callout-box { animation: calloutPulse 3s ease-in-out 2s 2; }
  `;

  // ---- Timeline updater: sync the 2D shapes + badges + arrows to the solution.
  // Per-step translation offset for each shape (relative to its home/wrong-recess
  // position), mirroring the 3D lift → cross → seat choreography. The red shape
  // starts on the right (lx side draws it left, but logically it is mis-seated);
  // we move both groups: lift up, cross over the mirror, then settle.
  // dx = swap distance between the two columns (rx - lx).
  const SWAP = rx - lx;
  const LIFT_Y = -42;
  // Keyframe offsets [dx, dy] per step index for the left(red) and right(blue) groups.
  const leftKeys = [
    [0, 0],          // 0: rest in wrong recess
    [0, LIFT_Y],     // 1: lift up
    [SWAP, LIFT_Y],  // 2: cross to the right column
    [SWAP, 0],       // 3: seat into correct recess
  ];
  const rightKeys = [
    [0, 0],
    [0, LIFT_Y],
    [-SWAP, LIFT_Y],
    [-SWAP, 0],
  ];
  const lerp = (a, b, p) => a + (b - a) * p;

  return function update(state) {
    if (!state) return;
    const last = leftKeys.length - 1;
    const i = Math.max(0, Math.min(state.stepIndex | 0, last));
    const p = Math.max(0, Math.min(state.stepProgress ?? 0, 1));
    const fromL = i === 0 ? leftKeys[0] : leftKeys[i - 1];
    const toL = leftKeys[i];
    const fromR = i === 0 ? rightKeys[0] : rightKeys[i - 1];
    const toR = rightKeys[i];

    if (leftGroup) {
      leftGroup.setAttribute('transform',
        `translate(${lerp(fromL[0], toL[0], p)}, ${lerp(fromL[1], toL[1], p)})`);
    }
    if (rightGroup) {
      rightGroup.setAttribute('transform',
        `translate(${lerp(fromR[0], toR[0], p)}, ${lerp(fromR[1], toR[1], p)})`);
    }

    // Step badges: phase 0 = lift, 1 = compare, 2 = swap+seat
    const phase = i <= 1 ? 0 : i === 2 ? 1 : 2;
    badges.forEach((b, k) => svg.highlight(b, k === phase, { dim: 0.3, color: CORD }));

    // Show the swap arrows only during the crossing step
    const swapping = i === 2;
    svg.highlight(arrowSwapRed, swapping, { glow: false, dim: 0 });
    svg.highlight(arrowSwapBlue, swapping, { glow: false, dim: 0 });
  };
}

export function dispose() {}
