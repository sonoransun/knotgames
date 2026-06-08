import * as THREE from 'three';
import { createMaterials, createHighlightMaterial, applyHighlight, removeHighlight } from '../lib/materials.js';
import { createRing, createBall } from '../lib/components.js';
import { CordPath } from '../lib/cord.js';
import { enableShadowsOnGroup } from '../lib/scene.js';
import { StepArrowManager } from '../lib/arrow-helpers.js';
import { slerpEuler } from '../lib/animation.js';
import * as svg from '../lib/svg.js';

export const metadata = {
  id: 12,
  name: 'The Hopf Paradox',
  difficulty: 'Expert',
  principle: 'Hopf fibration / coupled rotation in S\u00B3',
  type: 'Extraction',
  description: 'A ring inside a wire cage must be extracted through a coupled corkscrew rotation at the pole junction — a motion that cannot be decomposed into sequential single-axis moves.',
  cameraPosition: [80, 60, 180],
};

const HOOP_R = 60;
const HOOP_ROD_R = 2;

function createCage(mats) {
  const group = new THREE.Group();
  const segments = 64;

  // Equatorial hoop (XZ plane)
  const eqPoints = [];
  for (let i = 0; i <= segments; i++) {
    const angle = (2 * Math.PI * i) / segments;
    eqPoints.push(new THREE.Vector3(
      Math.cos(angle) * HOOP_R,
      0,
      Math.sin(angle) * HOOP_R
    ));
  }
  const eqCurve = new THREE.CatmullRomCurve3(eqPoints, true);
  const eqGeo = new THREE.TubeGeometry(eqCurve, segments, HOOP_ROD_R, 8, true);
  group.add(new THREE.Mesh(eqGeo, mats.steel));

  // Polar hoop (XY plane)
  const polPoints = [];
  for (let i = 0; i <= segments; i++) {
    const angle = (2 * Math.PI * i) / segments;
    polPoints.push(new THREE.Vector3(
      Math.cos(angle) * HOOP_R,
      Math.sin(angle) * HOOP_R,
      0
    ));
  }
  const polCurve = new THREE.CatmullRomCurve3(polPoints, true);
  const polGeo = new THREE.TubeGeometry(polCurve, segments, HOOP_ROD_R, 8, true);
  group.add(new THREE.Mesh(polGeo, mats.steel));

  return group;
}

// Ring positions during animation
const RING_INIT = { pos: [HOOP_R * 0.7, 0, 0], rot: [Math.PI / 2, 0, 0] }; // on equatorial hoop
const RING_STEP1 = { pos: [HOOP_R * 0.5, HOOP_R * 0.2, 0], rot: [0, 0, 0] }; // lifted off equatorial
const RING_STEP2 = { pos: [HOOP_R * 0.1, HOOP_R * 0.8, 0], rot: [0.3, 0.5, 0.2] }; // near pole
const RING_STEP3 = { pos: [-HOOP_R * 0.3, HOOP_R * 0.5, HOOP_R * 0.4], rot: [0.8, 1.0, 0.5] }; // through pole
const RING_FINAL = { pos: [-HOOP_R * 0.5, HOOP_R * 0.3, HOOP_R * 0.8], rot: [1.2, 0.3, 0.8] }; // outside

// Cord from ring to handle
function cordPath(ringPos) {
  return [
    ringPos,
    [ringPos[0] + 10, ringPos[1] - 5, ringPos[2] + 10],
    [HOOP_R * 0.3, -HOOP_R * 0.5, HOOP_R * 0.5],
    [HOOP_R * 0.5, -HOOP_R * 0.8, HOOP_R * 0.3],
    [HOOP_R * 0.7, -HOOP_R * 0.9, 0],
    [HOOP_R * 0.8, -HOOP_R, -10],
    [HOOP_R, -HOOP_R - 20, 0],
  ];
}

export function create3DScene() {
  const mats = createMaterials();
  const group = new THREE.Group();

  group.add(createCage(mats));

  // Ring inside cage
  const ring = createRing(55, 4, mats.brass);
  ring.position.set(...RING_INIT.pos);
  ring.rotation.set(...RING_INIT.rot);
  group.add(ring);

  // Cord
  const cord = new CordPath(cordPath(RING_INIT.pos), {
    radius: 2,
    material: mats.cord,
  });
  cord.addTo(group);

  // Ball constraint on cord
  const ball = createBall(12, mats.wood);
  ball.position.set(HOOP_R * 0.5, -HOOP_R * 0.8, HOOP_R * 0.3);
  group.add(ball);

  // Handle
  const handle = new THREE.Mesh(
    new THREE.BoxGeometry(30, 8, 8),
    mats.darkWood
  );
  handle.position.set(HOOP_R, -HOOP_R - 20, 0);
  group.add(handle);

  enableShadowsOnGroup(group);
  return group;
}

export function createAnimScene() {
  const mats = createMaterials();
  const group = new THREE.Group();

  group.add(createCage(mats));

  const ring = createRing(55, 4, mats.brass);
  ring.position.set(...RING_INIT.pos);
  ring.rotation.set(...RING_INIT.rot);
  group.add(ring);

  const cord = new CordPath(cordPath(RING_INIT.pos), {
    radius: 2,
    material: mats.cord,
  });
  cord.addTo(group);

  const ball = createBall(12, mats.wood);
  ball.position.set(HOOP_R * 0.5, -HOOP_R * 0.8, HOOP_R * 0.3);
  group.add(ball);

  const handle = new THREE.Mesh(
    new THREE.BoxGeometry(30, 8, 8),
    mats.darkWood
  );
  handle.position.set(HOOP_R, -HOOP_R - 20, 0);
  group.add(handle);

  enableShadowsOnGroup(group);
  const arrowManager = new StepArrowManager(group);

  return { group, objects: { ring, cord, arrowManager } };
}

const ringStates = [RING_INIT, RING_STEP1, RING_STEP2, RING_STEP3, RING_FINAL];

const arrowConfigs = {
  1: { arrows: [
    { from: RING_INIT.pos, to: RING_STEP1.pos, opts: { color: 0xffcc44 } },
  ]},
  2: { arrows: [
    { from: RING_STEP1.pos, to: RING_STEP2.pos, opts: { color: 0xffcc44 } },
  ]},
  3: { arrows: [
    { from: RING_STEP2.pos, to: RING_STEP3.pos, opts: { color: 0x44cc44 } },
  ]},
  4: { arrows: [
    { from: RING_STEP3.pos, to: RING_FINAL.pos, opts: { color: 0x44cc44 } },
  ]},
};

let highlightMat = null;

export const animationSteps = [
  {
    label: 'Look: the ring sits inside a cage made of two crossed hoops',
    duration: 2.0,
    ringState: RING_INIT,
  },
  {
    label: 'Rotate the ring to lift it off the horizontal hoop',
    duration: 2.5,
    ringState: RING_STEP1,
  },
  {
    label: 'Slide the ring upward toward the top where the hoops meet',
    duration: 2.5,
    ringState: RING_STEP2,
    easing: 'easeOut', // settles as it reaches the junction
  },
  {
    label: 'Corkscrew the ring through the junction — twist and push at once!',
    duration: 4.0,
    ringState: RING_STEP3,
    easing: 'easeInOut', // deliberate coupled move: ease in and out of the turn
  },
  {
    label: 'Pull the ring out through the gap — it is free!',
    duration: 2.5,
    ringState: RING_FINAL,
    easing: 'easeOut', // landing move — comes to rest outside the cage
  },
];

export function updateAnimation(objects, state) {
  const { stepIndex, stepProgress } = state;

  // Direction arrows
  if (objects.arrowManager) {
    objects.arrowManager.showForStep(stepIndex, arrowConfigs);
    objects.arrowManager.updateOpacity(stepProgress);
  }

  // Highlight ring during movement steps
  if (stepIndex >= 1) {
    if (!highlightMat) {
      highlightMat = createHighlightMaterial(objects.ring.material, 0xffcc44, 0.3);
    }
    applyHighlight(objects.ring, highlightMat);
  } else {
    removeHighlight(objects.ring);
  }

  const step = animationSteps[stepIndex];
  const prevStep = stepIndex > 0 ? animationSteps[stepIndex - 1] : animationSteps[0];

  const fromState = prevStep.ringState;
  const toState = step.ringState;

  // Interpolate position
  objects.ring.position.set(
    fromState.pos[0] + (toState.pos[0] - fromState.pos[0]) * stepProgress,
    fromState.pos[1] + (toState.pos[1] - fromState.pos[1]) * stepProgress,
    fromState.pos[2] + (toState.pos[2] - fromState.pos[2]) * stepProgress,
  );

  // Interpolate rotation via quaternion slerp (the coupled corkscrew at the
  // pole is a large multi-axis turn — lerping Euler angles would gimbal-flip)
  objects.ring.rotation.set(...slerpEuler(fromState.rot, toState.rot, stepProgress));

  // Update cord to follow ring
  const ringPos = [objects.ring.position.x, objects.ring.position.y, objects.ring.position.z];
  objects.cord.update(cordPath(ringPos));
}

export function createSVGDiagram(container) {
  const s = svg.createSVG(container, 500, 400);
  const SURFACE = 'var(--dia-surface, #fbf7ee)';
  const INK = 'var(--dia-ink, #24211a)';
  const INKSOFT = 'var(--dia-inksoft, #6a6151)';
  const RIGID = 'var(--dia-rigid, #8a8275)';
  const CORD = 'var(--dia-cord, #1f57c4)';
  const NEG = 'var(--dia-neg, #cf3a26)';
  const RING = 'var(--dia-ring, #b97d12)';
  const WOOD = 'var(--dia-wood, #b07d52)';
  const WASH = 'var(--dia-wash, #ece3d0)';

  svg.text(s, 250, 25, 'The Hopf Paradox — Cage Structure', {
    fontSize: 14, anchor: 'middle', fontWeight: 'bold',
  });

  const cx = 250, cy = 185, R = 90;

  // Equatorial hoop (horizontal ellipse)
  svg.ellipse(s, cx, cy, R, R * 0.35, {
    stroke: RIGID, strokeWidth: 4, fill: 'none',
  });

  // Polar hoop (vertical circle) — behind equatorial
  svg.ellipse(s, cx, cy, R * 0.35, R, {
    stroke: RIGID, strokeWidth: 4, fill: 'none', dashArray: '8,4',
  });

  // Polar hoop front portion (over equatorial)
  svg.path(s, `M ${cx} ${cy - R} A ${R * 0.35} ${R} 0 0 1 ${cx} ${cy + R}`, {
    stroke: RIGID, strokeWidth: 4, fill: 'none',
  });

  // Weld points (poles)
  svg.circle(s, cx, cy - R, 5, { fill: NEG, stroke: NEG, strokeWidth: 1 });
  svg.circle(s, cx, cy + R, 5, { fill: NEG, stroke: NEG, strokeWidth: 1 });

  // Ring inside cage — animatable (starts on the equatorial hoop, right side)
  const ring = svg.ellipse(s, cx + 30, cy, 22, 18, { stroke: RING, strokeWidth: 3, fill: 'none' });
  ring.style.transition = 'cx .12s linear, cy .12s linear';

  // Window labels
  svg.text(s, cx + R * 0.6, cy - R * 0.4, 'NE', { fontSize: 10, fill: RIGID, anchor: 'middle' });
  svg.text(s, cx - R * 0.6, cy - R * 0.4, 'NW', { fontSize: 10, fill: RIGID, anchor: 'middle' });
  svg.text(s, cx + R * 0.6, cy + R * 0.4, 'SE', { fontSize: 10, fill: RIGID, anchor: 'middle' });
  svg.text(s, cx - R * 0.6, cy + R * 0.4, 'SW', { fontSize: 10, fill: RIGID, anchor: 'middle' });

  // Labels
  svg.label(s, cx + R + 40, cy, cx + R, cy, 'Equatorial hoop');
  svg.label(s, cx + 40, cy - R - 15, cx, cy - R, 'North pole (weld)');
  svg.label(s, cx + 70, cy, cx + 52, cy, 'Ring (55mm)');

  // Cord to handle
  svg.path(s, `M ${cx + 42} ${cy + 10} Q ${cx + 50} ${cy + 40} ${cx + 60} ${cy + R + 30}`, {
    stroke: CORD, strokeWidth: 2, fill: 'none',
  });
  svg.circle(s, cx + 55, cy + 50, 6, { fill: WOOD, stroke: RING, strokeWidth: 1 });
  svg.rect(s, cx + 45, cy + R + 28, 30, 10, { fill: WOOD, stroke: RING, strokeWidth: 1 });
  svg.text(s, cx + 60, cy + R + 48, 'Handle', { fontSize: 9, fill: INKSOFT, anchor: 'middle' });

  // Motion arrows showing solution path (toggled per step by the updater)
  const arrow1 = svg.motionArrow(s, cx + 30, cy, cx + 10, cy - R + 20, { label: 'Slide ring up', curvature: 0.3 });
  const arrow2 = svg.motionArrow(s, cx + 5, cy - R + 15, cx - 30, cy - R * 0.3, { label: 'Twist through junction', curvature: 0.5 });

  // Hand icon near ring
  svg.handIcon(s, cx + 55, cy - 10, { scale: 0.6, rotation: -25 });

  // Step badges (highlighted per phase by the updater)
  const badge1 = svg.stepBadge(s, 30, 100, 1, 4, { radius: 11 });
  svg.actionLabel(s, 90, 100, 'Rotate ring off hoop');
  const badge2 = svg.stepBadge(s, 30, 128, 2, 4, { radius: 11 });
  svg.actionLabel(s, 90, 128, 'Slide ring to top');
  const badge3 = svg.stepBadge(s, 30, 156, 3, 4, { radius: 11 });
  svg.actionLabel(s, 115, 156, 'Corkscrew through junction');
  const badge4 = svg.stepBadge(s, 30, 184, 4, 4, { radius: 11 });
  svg.actionLabel(s, 90, 184, 'Pull ring free');
  const badges = [badge1, badge2, badge3, badge4];

  // Hopf move diagram
  const calloutRect = svg.rect(s, 30, 320, 440, 60, { fill: WASH, stroke: RING, strokeWidth: 1, rx: 4 });
  svg.text(s, 250, 338, 'The key move at the top junction:', {
    fontSize: 11, anchor: 'middle', fontWeight: 'bold', fill: RING,
  });
  svg.text(s, 250, 355, 'Twist the ring while pushing it forward — both motions at once!', {
    fontSize: 10, anchor: 'middle', fill: RING,
  });
  svg.text(s, 250, 370, 'You cannot do these motions one at a time — they must happen together.', {
    fontSize: 10, anchor: 'middle', fill: RING, fontStyle: 'italic',
  });

  // Inject pulse animation for the callout
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
  calloutRect.classList.add('callout-box');

  // ---- Timeline updater: sync the 2D ring + badges + arrows to the solution.
  // 2D keyframes mirror the 3D motion: from the equatorial hoop (right), lift,
  // slide up to the top junction, corkscrew through, then exit past the pole.
  const startPos = [cx + 30, cy];
  const endPos = [
    [cx + 30, cy],            // 0: rest, on the equatorial hoop
    [cx + 22, cy - R * 0.45], // 1: rotated/lifted off the hoop
    [cx + 4, cy - R * 0.85],  // 2: slid up to the top junction
    [cx - 22, cy - R * 0.55], // 3: corkscrewed through the junction
    [cx - 48, cy - R * 0.25], // 4: pulled free, outside the cage
  ];
  return function update(state) {
    if (!state) return;
    const last = endPos.length - 1;
    const i = Math.max(0, Math.min(state.stepIndex | 0, last));
    const p = Math.max(0, Math.min(state.stepProgress ?? 0, 1));
    const from = i === 0 ? startPos : endPos[i - 1];
    const to = endPos[i];
    if (ring) {
      ring.setAttribute('cx', from[0] + (to[0] - from[0]) * p);
      ring.setAttribute('cy', from[1] + (to[1] - from[1]) * p);
    }
    badges.forEach((b, k) => svg.highlight(b, k === i, { dim: 0.3, color: CORD }));
    // arrow1 covers the lift + slide-up phases; arrow2 the corkscrew + exit
    svg.highlight(arrow1, i === 1 || i === 2, { glow: false, dim: 0 });
    svg.highlight(arrow2, i === 3 || i === 4, { glow: false, dim: 0 });
  };
}

export function dispose() {}
