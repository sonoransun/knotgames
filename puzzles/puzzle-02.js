import * as THREE from 'three';
import { createMaterials } from '../lib/materials.js';
import { createRing, createBall } from '../lib/components.js';
import { CordPath } from '../lib/cord.js';
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

  return { group, objects: { cord } };
}

export const animationSteps = [
  {
    label: 'Initial state: cord loop threaded through the paddle hole',
    duration: 2.0,
    cord: initialCordPath(),
  },
  {
    label: 'Push a bight of cord back through the hole',
    duration: 2.5,
    cord: midCordPath1(),
  },
  {
    label: 'Stretch the bight over the short edge of the paddle',
    duration: 2.5,
    cord: midCordPath2(),
  },
  {
    label: 'Pull through — the loop is free! The paddle went through the loop.',
    duration: 2.5,
    cord: solvedCordPath(),
  },
];

export function updateAnimation(objects, state) {
  const { stepIndex, stepProgress } = state;
  const step = animationSteps[stepIndex];
  const prevStep = stepIndex > 0 ? animationSteps[stepIndex - 1] : animationSteps[0];

  if (step.cord && prevStep.cord) {
    const interpolated = CordPath.interpolatePoints(prevStep.cord, step.cord, stepProgress);
    objects.cord.update(interpolated);
  }
}

export function createSVGDiagram(container) {
  const s = svg.createSVG(container, 500, 380);

  svg.text(s, 250, 25, "Shepherd's Yoke — Initial State", {
    fontSize: 14, anchor: 'middle', fontWeight: 'bold',
  });

  // Paddle (front view)
  const px = 170;
  const py = 100;
  const pw = 160;
  const ph = 90;

  svg.rect(s, px, py, pw, ph, {
    fill: '#deb887',
    stroke: '#8b6914',
    strokeWidth: 2,
    rx: 5,
  });

  // Hole
  const holeX = px + pw / 2;
  const holeY = py + ph / 2;
  svg.circle(s, holeX, holeY, 12, {
    fill: '#fafafa',
    stroke: '#8b6914',
    strokeWidth: 1.5,
  });

  // Cord loop (front side) — animated cord threading
  svg.animatedPath(s, `M ${holeX - 8} ${holeY + 5} Q ${holeX - 50} ${holeY + 60} ${holeX} ${holeY + 75} Q ${holeX + 50} ${holeY + 60} ${holeX + 8} ${holeY + 5}`, {
    stroke: '#2255aa',
    strokeWidth: 3,
    fill: 'none',
    animDelay: 0,
    animDuration: 0.8,
  });

  // Cord through hole indicators
  svg.circle(s, holeX - 5, holeY + 2, 3, { fill: '#2255aa', stroke: 'none' });
  svg.circle(s, holeX + 5, holeY + 2, 3, { fill: '#2255aa', stroke: 'none' });

  // Cord (back side, dashed) — animated cord threading
  svg.animatedPath(s, `M ${holeX - 8} ${holeY - 5} Q ${holeX - 40} ${holeY + 50} ${holeX} ${holeY + 65} Q ${holeX + 40} ${holeY + 50} ${holeX + 8} ${holeY - 5}`, {
    stroke: '#2255aa',
    strokeWidth: 2,
    fill: 'none',
    dashArray: '6,4',
    animDelay: 0.8,
    animDuration: 0.8,
  });

  // Labels
  svg.label(s, 100, 90, px, py + 10, 'Wooden paddle');
  svg.label(s, holeX, py - 12, holeX, holeY - 12, '20mm hole');
  svg.label(s, 400, 200, holeX + 45, holeY + 50, 'Cord loop');

  // Dimensions
  svg.dimensionArrow(s, px, py + ph + 25, px + pw, py + ph + 25, '150mm');
  svg.dimensionArrow(s, px - 25, py, px - 25, py + ph, '80mm');

  // Side view inset
  svg.rect(s, 20, 245, 150, 110, {
    fill: '#f5f5f5',
    stroke: '#ccc',
    strokeWidth: 1,
    rx: 4,
  });
  svg.text(s, 95, 262, 'Side view', { fontSize: 10, anchor: 'middle', fill: '#999' });

  // Paddle side view (thin rectangle)
  svg.rect(s, 60, 285, 70, 10, { fill: '#deb887', stroke: '#8b6914', strokeWidth: 1.5 });

  // Cord going through
  svg.line(s, 95, 280, 95, 285, { stroke: '#2255aa', strokeWidth: 2 });
  svg.path(s, 'M 85 280 Q 95 270 105 280', { stroke: '#2255aa', strokeWidth: 2, fill: 'none' });
  svg.line(s, 95, 295, 95, 300, { stroke: '#2255aa', strokeWidth: 2 });
  svg.path(s, 'M 85 300 Q 95 310 105 300', { stroke: '#2255aa', strokeWidth: 2, fill: 'none' });

  // Key insight
  const calloutRect = svg.rect(s, 20, 340, 460, 30, { fill: '#e8f0fe', stroke: '#4a90d9', strokeWidth: 1, rx: 4 });
  calloutRect.classList.add('callout-box');
  svg.text(s, 250, 360, 'Key: The paddle (80mm edge) fits through the loop (100mm half-circumference)', {
    fontSize: 10, anchor: 'middle', fill: '#2a5a8a',
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
}

export function dispose() {}
