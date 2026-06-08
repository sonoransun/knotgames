import * as THREE from 'three';
import { createMaterials, createHighlightMaterial, applyHighlight, removeHighlight } from '../lib/materials.js';
import { createRing, createBall } from '../lib/components.js';
import { CordPath } from '../lib/cord.js';
import { enableShadowsOnGroup } from '../lib/scene.js';
import { StepArrowManager } from '../lib/arrow-helpers.js';
import * as svg from '../lib/svg.js';

export const metadata = {
  id: 2,
  name: "Shepherd's Yoke",
  difficulty: 'Beginner',
  principle: 'Buttonhole homotopy',
  type: 'Disentanglement',
  description: 'A closed cord loop is threaded through a hole in a wooden paddle. The loop is too short to slip over the edges — but the paddle can pass through the loop.',
  cameraPosition: [0, 60, 200],
};

// Dimensions
const PADDLE_W = 150;
const PADDLE_H = 80;
const PADDLE_D = 10;
const HOLE_R = 10;

function createPaddle(material) {
  const shape = new THREE.Shape();
  const hw = PADDLE_W / 2;
  const hh = PADDLE_H / 2;
  const r = 5; // corner radius

  shape.moveTo(-hw + r, -hh);
  shape.lineTo(hw - r, -hh);
  shape.quadraticCurveTo(hw, -hh, hw, -hh + r);
  shape.lineTo(hw, hh - r);
  shape.quadraticCurveTo(hw, hh, hw - r, hh);
  shape.lineTo(-hw + r, hh);
  shape.quadraticCurveTo(-hw, hh, -hw, hh - r);
  shape.lineTo(-hw, -hh + r);
  shape.quadraticCurveTo(-hw, -hh, -hw + r, -hh);

  // Center hole
  const hole = new THREE.Path();
  const holePts = 32;
  for (let i = 0; i <= holePts; i++) {
    const angle = (2 * Math.PI * i) / holePts;
    const x = Math.cos(angle) * HOLE_R;
    const y = Math.sin(angle) * HOLE_R;
    if (i === 0) hole.moveTo(x, y);
    else hole.lineTo(x, y);
  }
  shape.holes.push(hole);

  const extrudeSettings = { depth: PADDLE_D, bevelEnabled: false };
  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = Math.PI / 2;
  mesh.position.y = 0;
  mesh.position.z = -PADDLE_D / 2;
  return mesh;
}

// Cord loop: passes through the hole, hangs on both sides
function initialCordPath() {
  // Loop goes through hole: front side arc → through hole → back side arc → through hole
  return [
    [-30, -15, PADDLE_D / 2 + 3],   // front-left
    [0, -30, PADDLE_D / 2 + 3],     // front-bottom
    [30, -15, PADDLE_D / 2 + 3],    // front-right
    [15, 5, PADDLE_D / 2 + 1],      // approaching hole
    [5, 2, 0],                       // entering hole
    [5, 2, -PADDLE_D / 2 - 1],      // exiting hole back
    [30, -15, -PADDLE_D / 2 - 3],   // back-right
    [0, -30, -PADDLE_D / 2 - 3],    // back-bottom
    [-30, -15, -PADDLE_D / 2 - 3],  // back-left
    [-15, 5, -PADDLE_D / 2 - 1],    // approaching hole
    [-5, 2, 0],                      // entering hole
    [-5, 2, PADDLE_D / 2 + 1],      // exiting hole front
  ];
}

// Cord freed: hanging as simple loop below paddle
function solvedCordPath() {
  return [
    [-30, -50, 5],
    [0, -60, 8],
    [30, -50, 5],
    [30, -45, 0],
    [25, -42, -5],
    [10, -40, -8],
    [-10, -40, -8],
    [-25, -42, -5],
    [-30, -45, 0],
    [-30, -48, 3],
    [-30, -50, 5],
    [-30, -50, 5],
  ];
}

// Step: bight pushed through hole
function midCordPath1() {
  return [
    [-30, -15, PADDLE_D / 2 + 3],
    [0, -30, PADDLE_D / 2 + 3],
    [30, -15, PADDLE_D / 2 + 3],
    [20, 5, PADDLE_D / 2 + 1],
    [10, 10, 0],                     // bight going through hole
    [10, 15, -PADDLE_D / 2 - 5],    // bight emerging on back
    [20, -5, -PADDLE_D / 2 - 3],
    [0, -30, -PADDLE_D / 2 - 3],
    [-30, -15, -PADDLE_D / 2 - 3],
    [-15, 5, -PADDLE_D / 2 - 1],
    [-5, 2, 0],
    [-5, 2, PADDLE_D / 2 + 1],
  ];
}

// Step: bight stretches over short edge
function midCordPath2() {
  return [
    [-30, -15, PADDLE_D / 2 + 3],
    [0, -30, PADDLE_D / 2 + 3],
    [35, -20, PADDLE_D / 2 + 3],
    [45, 0, 0],                       // going over edge
    [40, 20, -PADDLE_D / 2 - 3],     // over the top edge
    [10, 15, -PADDLE_D / 2 - 5],
    [20, -5, -PADDLE_D / 2 - 3],
    [0, -30, -PADDLE_D / 2 - 3],
    [-30, -15, -PADDLE_D / 2 - 3],
    [-35, 0, -PADDLE_D / 2 - 1],
    [-35, 0, 0],
    [-35, 0, PADDLE_D / 2 + 1],
  ];
}

export function create3DScene() {
  const mats = createMaterials();
  const group = new THREE.Group();

  const paddle = createPaddle(mats.wood);
  group.add(paddle);

  const cord = new CordPath(initialCordPath(), {
    radius: 2.5,
    material: mats.cord,
    closed: true,
  });
  cord.addTo(group);

  enableShadowsOnGroup(group);
  return group;
}

export function createAnimScene() {
  const mats = createMaterials();
  const group = new THREE.Group();

  const paddle = createPaddle(mats.wood);
  group.add(paddle);

  const cord = new CordPath(initialCordPath(), {
    radius: 2.5,
    material: mats.cord,
    closed: true,
  });
  cord.addTo(group);

  enableShadowsOnGroup(group);
  const arrowManager = new StepArrowManager(group);

  return { group, objects: { cord, arrowManager } };
}

const arrowConfigs = {
  1: { arrows: [{ from: [5, 2, 0], to: [10, 15, -8], opts: { color: 0x44cc44 } }] },
  2: { arrows: [{ from: [10, 15, -8], to: [45, 0, 0], opts: { color: 0x44cc44 } }] },
  3: { arrows: [{ from: [45, 0, 0], to: [0, -60, 8], opts: { color: 0x44cc44 } }] },
};
let highlightMat = null;

export const animationSteps = [
  {
    label: 'Look: the cord loop threads through the paddle hole on both sides',
    duration: 2.0,
    cord: initialCordPath(),
  },
  {
    label: 'Push a loop of cord back through the hole from front to back',
    duration: 2.5,
    easing: 'easeOut',
    cord: midCordPath1(),
  },
  {
    label: 'Stretch that loop over the short edge of the paddle',
    duration: 2.5,
    easing: 'easeIn',
    cord: midCordPath2(),
  },
  {
    label: 'Pull the cord free — the paddle passed through the loop!',
    duration: 2.5,
    easing: 'easeOut',
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

  // Highlight active cord
  if (stepIndex >= 1) {
    if (!highlightMat) {
      highlightMat = createHighlightMaterial(objects.cord.mesh.material, 0x4488ff, 0.3);
    }
    applyHighlight(objects.cord.mesh, highlightMat);
  } else {
    removeHighlight(objects.cord.mesh);
  }

  const step = animationSteps[stepIndex];
  const prevStep = stepIndex > 0 ? animationSteps[stepIndex - 1] : animationSteps[0];

  if (step.cord && prevStep.cord) {
    const interpolated = CordPath.interpolatePoints(prevStep.cord, step.cord, stepProgress);
    objects.cord.update(interpolated);
  }
}

export function createSVGDiagram(container) {
  const s = svg.createSVG(container, 500, 380);

  const SURFACE = 'var(--dia-surface, #fbf7ee)';
  const CORD = 'var(--dia-cord, #1f57c4)';
  const WOOD = 'var(--dia-wood, #b07d52)';
  const FAINT = 'var(--dia-faint, #c9bda7)';
  const RIGID = 'var(--dia-rigid, #8a8275)';
  const WASH = 'var(--dia-wash, #ece3d0)';
  const RING = 'var(--dia-ring, #b97d12)';

  svg.text(s, 250, 25, "Shepherd's Yoke — Initial State", {
    fontSize: 14, anchor: 'middle', fontWeight: 'bold',
  });

  // Paddle (front view)
  const px = 170;
  const py = 100;
  const pw = 160;
  const ph = 90;

  svg.rect(s, px, py, pw, ph, {
    fill: WOOD,
    stroke: WOOD,
    strokeWidth: 2,
    rx: 5,
  });

  // Hole
  const holeX = px + pw / 2;
  const holeY = py + ph / 2;
  svg.circle(s, holeX, holeY, 12, {
    fill: SURFACE,
    stroke: WOOD,
    strokeWidth: 1.5,
  });

  // Cord loop (front side) — animated cord threading; this is the primary
  // moving element, captured for the timeline updater.
  const cordLoop = svg.animatedPath(s, `M ${holeX - 8} ${holeY + 5} Q ${holeX - 50} ${holeY + 60} ${holeX} ${holeY + 75} Q ${holeX + 50} ${holeY + 60} ${holeX + 8} ${holeY + 5}`, {
    stroke: CORD,
    strokeWidth: 3,
    fill: 'none',
    animDelay: 0,
    animDuration: 0.8,
  });

  // Cord through hole indicators
  svg.circle(s, holeX - 5, holeY + 2, 3, { fill: CORD, stroke: 'none' });
  svg.circle(s, holeX + 5, holeY + 2, 3, { fill: CORD, stroke: 'none' });

  // Cord (back side, dashed) — animated cord threading
  svg.animatedPath(s, `M ${holeX - 8} ${holeY - 5} Q ${holeX - 40} ${holeY + 50} ${holeX} ${holeY + 65} Q ${holeX + 40} ${holeY + 50} ${holeX + 8} ${holeY - 5}`, {
    stroke: CORD,
    strokeWidth: 2,
    fill: 'none',
    dashArray: '6,4',
    animDelay: 0.8,
    animDuration: 0.8,
  });

  // A small bead marking the bight that travels during the solution. It starts
  // near the hole and is moved along 2D keyframes by the updater.
  const bead = svg.ellipse(s, holeX, holeY + 40, 7, 7, { stroke: CORD, strokeWidth: 2.5, fill: 'none' });
  bead.style.transition = 'cx .12s linear, cy .12s linear';

  // Labels
  svg.label(s, 100, 90, px, py + 10, 'Wooden paddle');
  svg.label(s, holeX, py - 12, holeX, holeY - 12, '20mm hole');
  svg.label(s, 400, 200, holeX + 45, holeY + 50, 'Cord loop');

  // Dimensions
  svg.dimensionArrow(s, px, py + ph + 25, px + pw, py + ph + 25, '150mm');
  svg.dimensionArrow(s, px - 25, py, px - 25, py + ph, '80mm');

  // Side view inset
  svg.rect(s, 20, 245, 150, 110, {
    fill: WASH,
    stroke: FAINT,
    strokeWidth: 1,
    rx: 4,
  });
  svg.text(s, 95, 262, 'Side view', { fontSize: 10, anchor: 'middle', fill: RIGID });

  // Paddle side view (thin rectangle)
  svg.rect(s, 60, 285, 70, 10, { fill: WOOD, stroke: WOOD, strokeWidth: 1.5 });

  // Cord going through
  svg.line(s, 95, 280, 95, 285, { stroke: CORD, strokeWidth: 2 });
  svg.path(s, 'M 85 280 Q 95 270 105 280', { stroke: CORD, strokeWidth: 2, fill: 'none' });
  svg.line(s, 95, 295, 95, 300, { stroke: CORD, strokeWidth: 2 });
  svg.path(s, 'M 85 300 Q 95 310 105 300', { stroke: CORD, strokeWidth: 2, fill: 'none' });

  // Motion arrows showing key movements (toggled per step by the updater)
  const arrowPush = svg.motionArrow(s, holeX, holeY + 5, holeX, holeY - 20, { label: 'Push through', curvature: 0.3 });
  const arrowStretch = svg.motionArrow(s, holeX + 10, holeY - 20, px + pw + 10, holeY - 10, { label: 'Stretch over edge', curvature: 0.3 });
  const arrowFree = svg.motionArrow(s, px + pw + 10, holeY - 10, holeX, py + ph + 5, { label: 'Pull free', curvature: 0.3 });

  // Hand icon near manipulation point
  svg.handIcon(s, holeX + 35, holeY + 30, { scale: 0.6, rotation: -30 });

  // Step badges (highlighted per phase by the updater)
  const badge1 = svg.stepBadge(s, holeX - 40, holeY - 15, 1, 3);
  svg.actionLabel(s, holeX - 40, holeY - 2, 'Push loop through hole');
  const badge2 = svg.stepBadge(s, px + pw + 15, holeY - 30, 2, 3);
  svg.actionLabel(s, px + pw + 15, holeY - 17, 'Stretch over edge');
  const badge3 = svg.stepBadge(s, holeX, py + ph + 10, 3, 3);
  svg.actionLabel(s, holeX, py + ph + 23, 'Pull free');
  const badges = [badge1, badge2, badge3];

  // Key insight
  const calloutRect = svg.rect(s, 20, 340, 460, 30, { fill: WASH, stroke: RING, strokeWidth: 1, rx: 4 });
  calloutRect.classList.add('callout-box');
  svg.text(s, 250, 360, 'Key: The short edge of the paddle can fit through the cord loop', {
    fontSize: 10, anchor: 'middle', fill: RING,
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

  // ---- Timeline updater: sync the 2D bead + badges + arrows to the solution.
  // animationSteps: 0 look, 1 push loop through hole, 2 stretch over edge, 3 pull free.
  // Bead keyframes mirror the 3D bight: through the hole (up), out over the
  // right edge, then down to hang free below the paddle.
  const beadPos = [
    [holeX, holeY + 40],        // step 0: bight resting in the front loop
    [holeX, holeY - 22],        // step 1: pushed up through the hole
    [px + pw + 10, holeY - 8],  // step 2: stretched over the short (right) edge
    [holeX, py + ph + 8],       // step 3: pulled free, hanging below
  ];
  return function update(state) {
    const n = beadPos.length;
    const i = Math.max(0, Math.min(state.stepIndex | 0, n - 1));
    const p = Math.max(0, Math.min(state.stepProgress ?? 0, 1));
    const from = i === 0 ? beadPos[0] : beadPos[i - 1];
    const to = beadPos[i];
    if (bead) {
      bead.setAttribute('cx', from[0] + (to[0] - from[0]) * p);
      bead.setAttribute('cy', from[1] + (to[1] - from[1]) * p);
    }
    // Phase: step 0 -> no active badge yet, steps 1..3 -> badges 0..2.
    const phase = i - 1;
    badges.forEach((b, k) => svg.highlight(b, k === phase, { dim: 0.3, color: CORD }));
    svg.highlight(arrowPush, i === 1, { glow: false, dim: 0 });
    svg.highlight(arrowStretch, i === 2, { glow: false, dim: 0 });
    svg.highlight(arrowFree, i === 3, { glow: false, dim: 0 });
    // Subtle emphasis of the active cord loop during the manipulation steps.
    if (cordLoop) svg.highlight(cordLoop, i >= 1, { glow: false, dim: 0.85 });
  };
}

export function dispose() {}
