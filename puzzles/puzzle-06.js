import * as THREE from 'three';
import { createMaterials } from '../lib/materials.js';
import { createStraightRod, createRing, createBall } from '../lib/components.js';
import { CordPath } from '../lib/cord.js';
import * as svg from '../lib/svg.js';

export const metadata = {
  id: 6,
  name: "Devil's Pitchfork",
  difficulty: 'Intermediate-Advanced',
  principle: 'Fundamental group of configuration space',
  type: 'Transfer',
  description: 'A ring is on the left prong of a three-pronged fork. The center prong is subtly shorter — and this is the key to moving the ring to the right prong.',
  cameraPosition: [0, 80, 200],
};

const PRONG_SPACING = 40;
const LEFT_H = 100;
const CENTER_H = 80;
const RIGHT_H = 100;
const ROD_R = 2;
const BALL_R = 4;

function createPitchfork(mats) {
  const group = new THREE.Group();

  // Base U-shape
  const basePoints = [
    [-PRONG_SPACING, 0, 0],
    [-PRONG_SPACING, -10, 0],
    [0, -15, 0],
    [PRONG_SPACING, -10, 0],
    [PRONG_SPACING, 0, 0],
  ];
  const baseVecs = basePoints.map(p => new THREE.Vector3(...p));
  const baseCurve = new THREE.CatmullRomCurve3(baseVecs);
  const baseGeo = new THREE.TubeGeometry(baseCurve, 32, ROD_R, 8, false);
  group.add(new THREE.Mesh(baseGeo, mats.steel));

  // Prongs
  group.add(createStraightRod([-PRONG_SPACING, 0, 0], [-PRONG_SPACING, LEFT_H, 0], ROD_R, mats.steel));
  group.add(createStraightRod([0, 0, 0], [0, CENTER_H, 0], ROD_R, mats.steel));
  group.add(createStraightRod([PRONG_SPACING, 0, 0], [PRONG_SPACING, RIGHT_H, 0], ROD_R, mats.steel));

  // Ball stops
  const leftBall = createBall(BALL_R * 2, mats.steel);
  leftBall.position.set(-PRONG_SPACING, LEFT_H, 0);
  group.add(leftBall);

  const centerBall = createBall(BALL_R * 2, mats.steel);
  centerBall.position.set(0, CENTER_H, 0);
  group.add(centerBall);

  const rightBall = createBall(BALL_R * 2, mats.steel);
  rightBall.position.set(PRONG_SPACING, RIGHT_H, 0);
  group.add(rightBall);

  return group;
}

function initialCordPath() {
  return [
    [-PRONG_SPACING, 70, 5],   // from ring on left prong
    [-PRONG_SPACING + 5, 50, 8],
    [-10, 20, 10],
    [0, 8, 8],                 // near center prong base
    [0, 5, 5],                 // attached to center prong base
  ];
}

function midCordPath1() {
  return [
    [-PRONG_SPACING, 15, 5],   // ring slid down
    [-PRONG_SPACING + 10, 30, 10],
    [-5, 60, 12],              // cord going up toward center prong tip
    [0, CENTER_H + 5, 8],     // cord looping over center ball-stop
    [5, 60, 5],                // coming back down
  ];
}

function solvedCordPath() {
  return [
    [PRONG_SPACING, 70, 5],   // ring now on right prong
    [PRONG_SPACING - 5, 50, 8],
    [10, 20, 10],
    [0, 8, 8],
    [0, 5, 5],
  ];
}

export function create3DScene() {
  const mats = createMaterials();
  const group = new THREE.Group();

  group.add(createPitchfork(mats));

  const ring = createRing(50, 4, mats.brass);
  ring.position.set(-PRONG_SPACING, 70, 0);
  ring.rotation.x = Math.PI / 2;
  group.add(ring);

  const cord = new CordPath(initialCordPath(), {
    radius: 2.5,
    material: mats.cord,
  });
  cord.addTo(group);

  return group;
}

export function createAnimScene() {
  const mats = createMaterials();
  const group = new THREE.Group();

  group.add(createPitchfork(mats));

  const ring = createRing(50, 4, mats.brass);
  ring.position.set(-PRONG_SPACING, 70, 0);
  ring.rotation.x = Math.PI / 2;
  group.add(ring);

  const cord = new CordPath(initialCordPath(), {
    radius: 2.5,
    material: mats.cord,
  });
  cord.addTo(group);

  return { group, objects: { ring, cord } };
}

export const animationSteps = [
  {
    label: 'Initial: ring on left prong, cord too short for direct transfer',
    duration: 2.0,
    cord: initialCordPath(),
    ring: { position: [-PRONG_SPACING, 70, 0] },
  },
  {
    label: 'Slide ring to base. Loop cord over the shorter center prong!',
    duration: 3.0,
    cord: midCordPath1(),
    ring: { position: [-PRONG_SPACING, 15, 0] },
  },
  {
    label: 'New cord geometry allows ring to transfer to right prong',
    duration: 3.0,
    cord: solvedCordPath(),
    ring: { position: [PRONG_SPACING, 70, 0] },
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

  if (step.ring && prevStep.ring) {
    const f = prevStep.ring.position;
    const t = step.ring.position;
    objects.ring.position.set(
      f[0] + (t[0] - f[0]) * stepProgress,
      f[1] + (t[1] - f[1]) * stepProgress,
      f[2] + (t[2] - f[2]) * stepProgress,
    );
  }
}

export function createSVGDiagram(container) {
  const s = svg.createSVG(container, 500, 400);

  svg.text(s, 250, 25, "Devil's Pitchfork — Initial State", {
    fontSize: 14, anchor: 'middle', fontWeight: 'bold',
  });

  const baseY = 320;
  const lx = 150, cx = 250, rx = 350;
  const lTop = baseY - 200;
  const cTop = baseY - 160; // shorter!
  const rTop = baseY - 200;

  // Prongs
  svg.line(s, lx, baseY, lx, lTop, { stroke: '#888', strokeWidth: 5 });
  svg.line(s, cx, baseY, cx, cTop, { stroke: '#888', strokeWidth: 5 });
  svg.line(s, rx, baseY, rx, rTop, { stroke: '#888', strokeWidth: 5 });

  // Base curve
  svg.path(s, `M ${lx} ${baseY} Q ${lx} ${baseY + 20} ${cx} ${baseY + 25} Q ${rx} ${baseY + 20} ${rx} ${baseY}`, {
    stroke: '#888', strokeWidth: 5, fill: 'none',
  });

  // Ball stops
  svg.circle(s, lx, lTop, 6, { fill: '#999', stroke: '#777', strokeWidth: 1 });
  svg.circle(s, cx, cTop, 6, { fill: '#999', stroke: '#777', strokeWidth: 1 });
  svg.circle(s, rx, rTop, 6, { fill: '#999', stroke: '#777', strokeWidth: 1 });

  // Ring on left prong
  svg.ellipse(s, lx, lTop + 40, 18, 14, { stroke: '#cc8800', strokeWidth: 3, fill: 'none' });

  // Cord from ring to center prong base
  svg.path(s, `M ${lx} ${lTop + 50} Q ${(lx + cx) / 2} ${baseY - 40} ${cx} ${baseY}`, {
    stroke: '#2255aa', strokeWidth: 2.5, fill: 'none',
  });

  // Height annotations
  svg.dimensionArrow(s, lx - 30, baseY, lx - 30, lTop, '100mm');
  svg.dimensionArrow(s, cx + 20, baseY, cx + 20, cTop, '80mm');

  // Highlight the height difference
  svg.line(s, cx - 15, cTop, cx + 15, cTop, { stroke: '#d44', strokeWidth: 1, dashArray: '3,2' });
  svg.line(s, cx - 15, lTop, cx + 15, lTop, { stroke: '#d44', strokeWidth: 1, dashArray: '3,2' });
  svg.text(s, cx + 35, (cTop + lTop) / 2 + 4, '20mm', { fontSize: 10, fill: '#d44', fontWeight: 'bold' });

  // Labels
  svg.label(s, 90, lTop + 40, lx - 18, lTop + 40, 'Ring');
  svg.label(s, 420, baseY, cx + 30, baseY, 'Cord to base');

  // Key insight
  const calloutRect = svg.rect(s, 20, 360, 460, 30, { fill: '#e8f0fe', stroke: '#4a90d9', strokeWidth: 1, rx: 4 });
  svg.text(s, 250, 380, 'Key: Loop cord over the shorter center prong, then transfer ring to right', {
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
  calloutRect.classList.add('callout-box');
}

export function dispose() {}
