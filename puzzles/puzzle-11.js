import * as THREE from 'three';
import { createMaterials } from '../lib/materials.js';
import { createRod, createBall, createBlock } from '../lib/components.js';
import { CordPath } from '../lib/cord.js';
import * as svg from '../lib/svg.js';

export const metadata = {
  id: 11,
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

  return { group, objects: { leftTrefoil, rightTrefoil } };
}

const WRONG = { left: [55, 40, 0], right: [-55, 40, 0] };
const LIFT = { left: [55, 80, 0], right: [-55, 80, 0] };
const CROSS = { left: [-55, 80, 0], right: [55, 80, 0] };
const CORRECT = { left: [-55, 40, 0], right: [55, 40, 0] };

export const animationSteps = [
  {
    label: 'Both trefoils appear identical — but they are mirror images',
    duration: 2.5,
    positions: WRONG,
  },
  {
    label: 'Lift trefoils to examine crossing handedness',
    duration: 2.0,
    positions: LIFT,
  },
  {
    label: 'Swap: left-handed trefoil goes to left recess, right to right',
    duration: 2.5,
    positions: CROSS,
  },
  {
    label: 'Seat each trefoil in its matching recess — chirality identified!',
    duration: 2.0,
    positions: CORRECT,
  },
];

export function updateAnimation(objects, state) {
  const { stepIndex, stepProgress } = state;
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

  svg.text(s, 250, 25, 'The Mirror Gate — Chirality', {
    fontSize: 14, anchor: 'middle', fontWeight: 'bold',
  });

  // Left-handed trefoil (red)
  const lx = 140, ly = 160;
  // Simplified trefoil diagram — three lobes with crossing indicators
  svg.path(s, `M ${lx} ${ly - 40} C ${lx - 60} ${ly - 50}, ${lx - 50} ${ly + 30}, ${lx} ${ly + 10} C ${lx + 50} ${ly - 10}, ${lx + 60} ${ly + 50}, ${lx} ${ly + 40} C ${lx - 50} ${ly + 50}, ${lx + 50} ${ly - 50}, ${lx} ${ly - 40}`, {
    stroke: '#dd3333', strokeWidth: 3, fill: 'none',
  });
  svg.text(s, lx, ly + 70, 'Left-handed', { fontSize: 11, anchor: 'middle', fill: '#dd3333', fontWeight: 'bold' });
  svg.text(s, lx, ly + 84, '(counterclockwise spiral)', { fontSize: 9, anchor: 'middle', fill: '#999' });

  // Right-handed trefoil (blue) — mirror image
  const rx = 360, ry = 160;
  svg.path(s, `M ${rx} ${ry - 40} C ${rx + 60} ${ry - 50}, ${rx + 50} ${ry + 30}, ${rx} ${ry + 10} C ${rx - 50} ${ry - 10}, ${rx - 60} ${ry + 50}, ${rx} ${ry + 40} C ${rx + 50} ${ry + 50}, ${rx - 50} ${ry - 50}, ${rx} ${ry - 40}`, {
    stroke: '#3333dd', strokeWidth: 3, fill: 'none',
  });
  svg.text(s, rx, ry + 70, 'Right-handed', { fontSize: 11, anchor: 'middle', fill: '#3333dd', fontWeight: 'bold' });
  svg.text(s, rx, ry + 84, '(clockwise spiral)', { fontSize: 9, anchor: 'middle', fill: '#999' });

  // Mirror line
  svg.line(s, 250, 80, 250, 260, { stroke: '#aaa', strokeWidth: 1, dashArray: '6,4' });
  svg.text(s, 250, 275, 'mirror', { fontSize: 10, anchor: 'middle', fill: '#aaa' });

  // Base with recesses
  svg.rect(s, 60, 310, 160, 30, { fill: '#ffdddd', stroke: '#dd3333', strokeWidth: 1.5, rx: 3 });
  svg.text(s, 140, 330, 'Left recess', { fontSize: 10, anchor: 'middle', fill: '#dd3333' });
  svg.rect(s, 280, 310, 160, 30, { fill: '#dddeff', stroke: '#3333dd', strokeWidth: 1.5, rx: 3 });
  svg.text(s, 360, 330, 'Right recess', { fontSize: 10, anchor: 'middle', fill: '#3333dd' });

  // Key insight
  const calloutRect = svg.rect(s, 30, 355, 440, 35, { fill: '#e8f0fe', stroke: '#4a90d9', strokeWidth: 1, rx: 4 });
  calloutRect.classList.add('callout-box');
  svg.text(s, 250, 377, 'Key: Mirror images can be topologically inequivalent — chirality is an invariant', {
    fontSize: 11, anchor: 'middle', fill: '#2a5a8a',
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
}

export function dispose() {}
