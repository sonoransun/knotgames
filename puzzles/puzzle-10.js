import * as THREE from 'three';
import { createMaterials, createHighlightMaterial, applyHighlight, removeHighlight } from '../lib/materials.js';
import { createRing, createBall } from '../lib/components.js';
import { CordPath } from '../lib/cord.js';
import { enableShadowsOnGroup } from '../lib/scene.js';
import { StepArrowManager } from '../lib/arrow-helpers.js';
import * as svg from '../lib/svg.js';

export const metadata = {
  id: 10,
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
  },
  {
    label: 'Corkscrew the ring through the junction — twist and push at once!',
    duration: 4.0,
    ringState: RING_STEP3,
  },
  {
    label: 'Pull the ring out through the gap — it is free!',
    duration: 2.5,
    ringState: RING_FINAL,
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

  // Interpolate rotation
  objects.ring.rotation.set(
    fromState.rot[0] + (toState.rot[0] - fromState.rot[0]) * stepProgress,
    fromState.rot[1] + (toState.rot[1] - fromState.rot[1]) * stepProgress,
    fromState.rot[2] + (toState.rot[2] - fromState.rot[2]) * stepProgress,
  );

  // Update cord to follow ring
  const ringPos = [objects.ring.position.x, objects.ring.position.y, objects.ring.position.z];
  objects.cord.update(cordPath(ringPos));
}

export function createSVGDiagram(container) {
  const s = svg.createSVG(container, 500, 400);

  svg.text(s, 250, 25, 'The Hopf Paradox — Cage Structure', {
    fontSize: 14, anchor: 'middle', fontWeight: 'bold',
  });

  const cx = 250, cy = 185, R = 90;

  // Equatorial hoop (horizontal ellipse)
  svg.ellipse(s, cx, cy, R, R * 0.35, {
    stroke: '#888', strokeWidth: 4, fill: 'none',
  });

  // Polar hoop (vertical circle) — behind equatorial
  svg.ellipse(s, cx, cy, R * 0.35, R, {
    stroke: '#888', strokeWidth: 4, fill: 'none', dashArray: '8,4',
  });

  // Polar hoop front portion (over equatorial)
  svg.path(s, `M ${cx} ${cy - R} A ${R * 0.35} ${R} 0 0 1 ${cx} ${cy + R}`, {
    stroke: '#888', strokeWidth: 4, fill: 'none',
  });

  // Weld points (poles)
  svg.circle(s, cx, cy - R, 5, { fill: '#cc4444', stroke: '#aa2222', strokeWidth: 1 });
  svg.circle(s, cx, cy + R, 5, { fill: '#cc4444', stroke: '#aa2222', strokeWidth: 1 });

  // Ring inside cage
  svg.ellipse(s, cx + 30, cy, 22, 18, { stroke: '#cc8800', strokeWidth: 3, fill: 'none' });

  // Window labels
  svg.text(s, cx + R * 0.6, cy - R * 0.4, 'NE', { fontSize: 10, fill: '#999', anchor: 'middle' });
  svg.text(s, cx - R * 0.6, cy - R * 0.4, 'NW', { fontSize: 10, fill: '#999', anchor: 'middle' });
  svg.text(s, cx + R * 0.6, cy + R * 0.4, 'SE', { fontSize: 10, fill: '#999', anchor: 'middle' });
  svg.text(s, cx - R * 0.6, cy + R * 0.4, 'SW', { fontSize: 10, fill: '#999', anchor: 'middle' });

  // Labels
  svg.label(s, cx + R + 40, cy, cx + R, cy, 'Equatorial hoop');
  svg.label(s, cx + 40, cy - R - 15, cx, cy - R, 'North pole (weld)');
  svg.label(s, cx + 70, cy, cx + 52, cy, 'Ring (55mm)');

  // Cord to handle
  svg.path(s, `M ${cx + 42} ${cy + 10} Q ${cx + 50} ${cy + 40} ${cx + 60} ${cy + R + 30}`, {
    stroke: '#2255aa', strokeWidth: 2, fill: 'none',
  });
  svg.circle(s, cx + 55, cy + 50, 6, { fill: '#c4956a', stroke: '#8b6914', strokeWidth: 1 });
  svg.rect(s, cx + 45, cy + R + 28, 30, 10, { fill: '#8b6914', stroke: '#6b4f12', strokeWidth: 1 });
  svg.text(s, cx + 60, cy + R + 48, 'Handle', { fontSize: 9, fill: '#666', anchor: 'middle' });

  // Motion arrows showing solution path
  svg.motionArrow(s, cx + 30, cy, cx + 10, cy - R + 20, { label: 'Slide ring up', curvature: 0.3 });
  svg.motionArrow(s, cx + 5, cy - R + 15, cx - 30, cy - R * 0.3, { label: 'Twist through junction', curvature: 0.5 });

  // Hand icon near ring
  svg.handIcon(s, cx + 55, cy - 10, { scale: 0.6, rotation: -25 });

  // Step badges
  svg.stepBadge(s, 30, 100, 1, 4, { radius: 11 });
  svg.actionLabel(s, 90, 100, 'Rotate ring off hoop');
  svg.stepBadge(s, 30, 128, 2, 4, { radius: 11 });
  svg.actionLabel(s, 90, 128, 'Slide ring to top');
  svg.stepBadge(s, 30, 156, 3, 4, { radius: 11 });
  svg.actionLabel(s, 115, 156, 'Corkscrew through junction');
  svg.stepBadge(s, 30, 184, 4, 4, { radius: 11 });
  svg.actionLabel(s, 90, 184, 'Pull ring free');

  // Hopf move diagram
  const calloutRect = svg.rect(s, 30, 320, 440, 60, { fill: '#fff3e0', stroke: '#e67e22', strokeWidth: 1, rx: 4 });
  svg.text(s, 250, 338, 'The key move at the top junction:', {
    fontSize: 11, anchor: 'middle', fontWeight: 'bold', fill: '#bf5f00',
  });
  svg.text(s, 250, 355, 'Twist the ring while pushing it forward — both motions at once!', {
    fontSize: 10, anchor: 'middle', fill: '#bf5f00',
  });
  svg.text(s, 250, 370, 'You cannot do these motions one at a time — they must happen together.', {
    fontSize: 10, anchor: 'middle', fill: '#bf5f00', fontStyle: 'italic',
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
}

export function dispose() {}
