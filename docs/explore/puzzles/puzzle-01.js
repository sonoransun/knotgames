import * as THREE from 'three';
import { createMaterials, createHighlightMaterial, applyHighlight, removeHighlight } from '../lib/materials.js';
import { createUBar, createRing } from '../lib/components.js';
import { CordPath, catenaryPoints } from '../lib/cord.js';
import { CordPath as CordPathClass } from '../lib/cord.js';
import { enableShadowsOnGroup } from '../lib/scene.js';
import { StepArrowManager } from '../lib/arrow-helpers.js';
import * as svg from '../lib/svg.js';

export const metadata = {
  id: 1,
  name: 'The Gatekeeper',
  difficulty: 'Beginner',
  principle: 'Unknot recognition',
  type: 'Disentanglement',
  description: 'A ring appears trapped on a cord that wraps around a U-shaped bar. The visual complexity of the wrap suggests the ring is locked — but the cord never forms a closed loop. It is topologically the unknot.',
  cameraPosition: [0, 80, 220],
};

// Dimensions (in mm, used as scene units)
const BAR_WIDTH = 60;
const BAR_HEIGHT = 120;
const BEND_RADIUS = 20;
const ROD_RADIUS = 2;
const RING_OD = 50;
const RING_WIRE = 4;
const CORD_RADIUS = 2.5;

// Key positions
const LEFT_TIP = [-BAR_WIDTH / 2, BAR_HEIGHT, 0];
const RIGHT_TIP = [BAR_WIDTH / 2, BAR_HEIGHT, 0];
const RING_REST_Y = 55; // Where ring hangs in initial state

// Cord path for initial (locked) state
// Path: left tip → down to ring → through ring → wrap around U-bar curve → back through ring → up to right tip
function initialCordPath() {
  return [
    LEFT_TIP,
    [-30, 100, 0],
    [-28, 75, 3],         // approach ring from left-front
    [-15, RING_REST_Y, 5],  // through ring going right
    [-5, 40, 3],           // down toward curve
    [-15, 15, 0],          // start wrapping around curve
    [0, 8, 8],             // front of curve wrap
    [15, 15, 0],           // past curve, going up
    [5, 40, -3],           // up from curve
    [15, RING_REST_Y, -5], // back through ring from behind
    [28, 75, -3],
    [30, 100, 0],
    RIGHT_TIP,
  ];
}

// Cord path for solved state (ring freed, cord hangs simply)
function solvedCordPath() {
  return [
    LEFT_TIP,
    [-30, 100, 0],
    [-28, 70, 0],
    [-20, 45, 0],
    [-10, 25, 0],
    [0, 15, 0],
    [10, 25, 0],
    [20, 45, 0],
    [28, 70, 0],
    [30, 100, 0],
    [30, 100, 0],
    [30, 100, 0],
    RIGHT_TIP,
  ];
}

// Intermediate cord paths for animation
function midCordPath1() {
  // Ring sliding down, cord slack adjusting
  return [
    LEFT_TIP,
    [-30, 100, 0],
    [-28, 75, 2],
    [-15, 45, 4],         // ring lower
    [-5, 30, 3],
    [-15, 15, 0],
    [0, 8, 6],
    [15, 15, 0],
    [5, 30, -3],
    [15, 45, -4],
    [28, 75, -2],
    [30, 100, 0],
    RIGHT_TIP,
  ];
}

function midCordPath2() {
  // Ring sliding past the drape, cord unwinding
  return [
    LEFT_TIP,
    [-30, 100, 0],
    [-25, 70, 1],
    [-15, 35, 2],
    [-5, 20, 1],
    [-10, 12, 0],
    [0, 10, 3],
    [10, 12, 0],
    [15, 25, -1],
    [20, 45, 0],
    [28, 70, 0],
    [30, 100, 0],
    RIGHT_TIP,
  ];
}

// Ring at the drape point — the critical moment when the ring meets
// the cord's lowest crossing of the U-bar. This is the "gate" the ring
// must pass over to escape.
function drapePointCordPath() {
  return [
    LEFT_TIP,
    [-30, 100, 0],
    [-28, 75, 2],
    [-15, 30, 4],
    [-5, 18, 3],         // cord cresting just above the curve
    [-12, 12, 1],
    [0, 8, 5],           // drape point — where ring will pass over
    [12, 12, 1],
    [5, 18, -3],
    [15, 30, -4],
    [28, 75, -2],
    [30, 100, 0],
    RIGHT_TIP,
  ];
}

export function create3DScene() {
  const mats = createMaterials();
  const group = new THREE.Group();

  // U-bar
  const uBar = createUBar(BAR_WIDTH, BAR_HEIGHT, BEND_RADIUS, ROD_RADIUS, mats.steel);
  group.add(uBar);

  // Ring - positioned at initial hanging point
  const ring = createRing(RING_OD, RING_WIRE, mats.brass);
  ring.position.set(0, RING_REST_Y, 0);
  ring.rotation.x = Math.PI / 2; // Orient ring to face forward
  group.add(ring);

  // Cord
  const cord = new CordPath(initialCordPath(), {
    radius: CORD_RADIUS,
    material: mats.cord,
  });
  cord.addTo(group);

  // Small balls at cord attachment points (stopper knots)
  const knot1 = new THREE.Mesh(
    new THREE.SphereGeometry(3.5, 12, 12),
    mats.cord
  );
  knot1.position.set(...LEFT_TIP);
  group.add(knot1);

  const knot2 = new THREE.Mesh(
    new THREE.SphereGeometry(3.5, 12, 12),
    mats.cord
  );
  knot2.position.set(...RIGHT_TIP);
  group.add(knot2);

  enableShadowsOnGroup(group);
  return group;
}

export function createAnimScene() {
  const mats = createMaterials();
  const group = new THREE.Group();

  // U-bar
  const uBar = createUBar(BAR_WIDTH, BAR_HEIGHT, BEND_RADIUS, ROD_RADIUS, mats.steel);
  group.add(uBar);

  // Ring
  const ring = createRing(RING_OD, RING_WIRE, mats.brass);
  ring.position.set(0, RING_REST_Y, 0);
  ring.rotation.x = Math.PI / 2;
  group.add(ring);

  // Cord
  const cord = new CordPath(initialCordPath(), {
    radius: CORD_RADIUS,
    material: mats.cord,
  });
  cord.addTo(group);

  // Stopper knots
  const knot1 = new THREE.Mesh(
    new THREE.SphereGeometry(3.5, 12, 12),
    mats.cord
  );
  knot1.position.set(...LEFT_TIP);
  group.add(knot1);

  const knot2 = new THREE.Mesh(
    new THREE.SphereGeometry(3.5, 12, 12),
    mats.cord
  );
  knot2.position.set(...RIGHT_TIP);
  group.add(knot2);

  enableShadowsOnGroup(group);
  const arrowManager = new StepArrowManager(group);

  return {
    group,
    objects: { ring, cord, arrowManager },
  };
}

const arrowConfigs = {
  1: { arrows: [
    { from: [0, 55, 5], to: [-20, 85, 3], opts: { color: 0x44cc44 } },
  ]},
  2: { arrows: [
    { from: [0, 45, 0], to: [-2, 25, 4], opts: { color: 0x44cc44 } },
  ]},
  3: { arrows: [
    // Highlight the drape point — the critical crossing the ring must pass over
    { from: [-2, 25, 4], to: [0, 12, 6], opts: { color: 0xffaa22 } },
  ]},
  4: { arrows: [
    { from: [-2, 12, 4], to: [50, 10, 30], opts: { color: 0x44cc44 } },
  ]},
};

let ringHighlightMat = null;

export const animationSteps = [
  {
    label: 'Look: the ring seems trapped by the cord around the U-bar',
    duration: 2.0,
    ring: { position: [0, RING_REST_Y, 0] },
    cord: initialCordPath(),
  },
  {
    label: 'Push the cord aside to make slack below the ring',
    duration: 2.0,
    ring: { position: [0, 45, 0] },
    cord: midCordPath1(),
  },
  {
    label: 'Lower the ring toward the drape point — the cord crosses the U-bar here',
    duration: 2.0,
    ring: { position: [-2, 25, 4] },
    cord: drapePointCordPath(),
  },
  {
    label: 'Slip the ring over the drape point — it passes the cord\'s lowest crossing',
    duration: 2.0,
    ring: { position: [-2, 12, 4] },
    cord: midCordPath2(),
  },
  {
    label: 'Pull the ring free! The cord was just draped, never knotted',
    duration: 2.5,
    ring: { position: [50, 10, 30] },
    cord: solvedCordPath(),
  },
];

export function updateAnimation(objects, state) {
  const { stepIndex, stepProgress } = state;

  // Direction arrows
  if (objects.arrowManager) {
    objects.arrowManager.showForStep(stepIndex, arrowConfigs);
    objects.arrowManager.updateOpacity(stepProgress);
  }

  // Highlight active ring during movement steps
  if (stepIndex >= 1 && stepIndex <= 4) {
    if (!ringHighlightMat) {
      ringHighlightMat = createHighlightMaterial(objects.ring.material, 0xffcc44, 0.3);
    }
    applyHighlight(objects.ring, ringHighlightMat);
  } else {
    removeHighlight(objects.ring);
  }

  // Get current and previous step data
  const step = animationSteps[stepIndex];
  const prevStep = stepIndex > 0 ? animationSteps[stepIndex - 1] : animationSteps[0];

  // Interpolate ring position
  if (step.ring && prevStep.ring) {
    const from = prevStep.ring.position;
    const to = step.ring.position;
    objects.ring.position.set(
      from[0] + (to[0] - from[0]) * stepProgress,
      from[1] + (to[1] - from[1]) * stepProgress,
      from[2] + (to[2] - from[2]) * stepProgress,
    );
  }

  // Interpolate cord
  if (step.cord && prevStep.cord) {
    const interpolated = CordPathClass.interpolatePoints(prevStep.cord, step.cord, stepProgress);
    objects.cord.update(interpolated);
  }
}

export function createSVGDiagram(container) {
  const s = svg.createSVG(container, 500, 400);
  const CORD = 'var(--dia-cord, #1f57c4)';
  const RIGID = 'var(--dia-rigid, #8a8275)';
  const RING = 'var(--dia-ring, #b97d12)';

  // Title
  svg.text(s, 250, 25, 'The Gatekeeper', {
    fontSize: 14, anchor: 'middle', fontWeight: 'bold',
  });

  // U-bar (front view)
  const barLeft = 190;
  const barRight = 310;
  const barTop = 60;
  const barBottom = 300;
  const bendCenterY = 280;

  svg.line(s, barLeft, barTop, barLeft, bendCenterY, { stroke: RIGID, strokeWidth: 5 });
  svg.line(s, barRight, barTop, barRight, bendCenterY, { stroke: RIGID, strokeWidth: 5 });
  svg.path(s, `M ${barLeft} ${bendCenterY} Q ${barLeft} ${barBottom} 250 ${barBottom} Q ${barRight} ${barBottom} ${barRight} ${bendCenterY}`, {
    stroke: RIGID, strokeWidth: 5, fill: 'none',
  });

  // Stopper knots at tips
  svg.circle(s, barLeft, barTop, 5, { fill: CORD, stroke: CORD, strokeWidth: 1 });
  svg.circle(s, barRight, barTop, 5, { fill: CORD, stroke: CORD, strokeWidth: 1 });

  // Cord path (simplified 2D representation) — animated cord threading
  svg.animatedPath(s, `M ${barLeft} ${barTop} L ${barLeft + 5} 120 L 225 160`, {
    stroke: CORD, strokeWidth: 2.5, fill: 'none', strokeLinecap: 'round', animDelay: 0, animDuration: 0.8,
  });
  svg.animatedPath(s, `M 225 160 L 220 200 Q 210 260 230 280 Q 250 295 270 280 Q 290 260 280 200 L 275 160`, {
    stroke: CORD, strokeWidth: 2.5, fill: 'none', strokeLinecap: 'round', animDelay: 0.8, animDuration: 0.8,
  });
  svg.animatedPath(s, `M 275 160 L ${barRight - 5} 120 L ${barRight} ${barTop}`, {
    stroke: CORD, strokeWidth: 2.5, fill: 'none', strokeLinecap: 'round', animDelay: 1.6, animDuration: 0.8,
  });

  // Ring (centered on cord at hang point) — animatable
  const ring = svg.ellipse(s, 250, 160, 22, 18, { stroke: RING, strokeWidth: 3, fill: 'none' });
  ring.style.transition = 'cx .12s linear, cy .12s linear';

  // Labels
  svg.label(s, 150, 45, barLeft, barTop, 'Stopper knot');
  svg.label(s, 350, 45, barRight, barTop, 'Stopper knot');
  svg.label(s, 340, 160, 272, 160, 'Ring (50mm)');
  svg.label(s, 130, 280, barLeft, 280, 'U-bar');

  svg.dimensionArrow(s, barLeft, 340, barRight, 340, '60mm');
  svg.dimensionArrow(s, 170, barTop, 170, bendCenterY, '120mm');

  // Motion arrows (toggled per step by the updater)
  const arrow1 = svg.motionArrow(s, 240, 165, 220, 210, { label: 'Slide ring down', curvature: 0.4 });
  const arrow2 = svg.motionArrow(s, 215, 215, 165, 195, { label: 'Ring clears drape', curvature: 0.3 });

  svg.handIcon(s, 275, 148, { scale: 0.6, rotation: -20 });

  // Step badges (highlighted per phase by the updater)
  const badge1 = svg.stepBadge(s, 42, 170, 1, 3, { radius: 11 });
  svg.actionLabel(s, 100, 170, 'Push cord left');
  const badge2 = svg.stepBadge(s, 42, 205, 2, 3, { radius: 11 });
  svg.actionLabel(s, 110, 205, 'Slide ring down');
  const badge3 = svg.stepBadge(s, 42, 240, 3, 3, { radius: 11 });
  svg.actionLabel(s, 100, 240, 'Pull ring free');
  const badges = [badge1, badge2, badge3];

  // Key insight callout
  const calloutRect = svg.rect(s, 20, 355, 460, 35, {
    fill: 'var(--dia-wash, #ece3d0)', stroke: 'var(--dia-ring, #b97d12)', strokeWidth: 1, rx: 4,
  });
  calloutRect.classList.add('callout-box');
  svg.text(s, 250, 377, 'The cord is just draped over the bar — it never forms a closed loop!', {
    fontSize: 11, anchor: 'middle', fill: 'var(--dia-ring, #b97d12)',
  });

  let styleEl = s.querySelector('style[data-anim]');
  if (!styleEl) {
    styleEl = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    styleEl.setAttribute('data-anim', '1');
    s.insertBefore(styleEl, s.firstChild);
  }
  styleEl.textContent += `
    @keyframes calloutPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
    .callout-box { animation: calloutPulse 3s ease-in-out 2s 2; }
  `;

  // ---- Timeline updater: sync the 2D ring + badges + arrows to the solution
  const endPos = [[250, 160], [250, 148], [246, 205], [242, 238], [140, 150]];
  return function update(state) {
    const i = Math.max(0, Math.min(state.stepIndex, endPos.length - 1));
    const p = state.stepProgress ?? 0;
    const from = i === 0 ? [250, 160] : endPos[i - 1];
    const to = endPos[i];
    ring.setAttribute('cx', from[0] + (to[0] - from[0]) * p);
    ring.setAttribute('cy', from[1] + (to[1] - from[1]) * p);
    const phase = i <= 1 ? 0 : i <= 2 ? 1 : 2;
    badges.forEach((b, k) => svg.highlight(b, k === phase, { dim: 0.3, color: CORD }));
    svg.highlight(arrow1, i === 1 || i === 2, { glow: false, dim: 0 });
    svg.highlight(arrow2, i === 3 || i === 4, { glow: false, dim: 0 });
  };
}

export function dispose() {
  // Materials and geometries are disposed by the app's cleanup
}
