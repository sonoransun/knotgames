import * as THREE from 'three';
import { createMaterials } from '../lib/materials.js';
import { createPost, createRing, createBall } from '../lib/components.js';
import { CordPath } from '../lib/cord.js';
import * as svg from '../lib/svg.js';

export const metadata = {
  id: 7,
  name: "The Ferryman's Knot",
  difficulty: 'Advanced',
  principle: 'Open knot vs closed knot; Reidemeister moves',
  type: 'Disentanglement',
  description: 'A cord wraps around a post in a trefoil-like pattern. Knot theory says trefoils can\'t be unknotted — but this is an open arc on a fixed axis. The rules are completely different.',
  cameraPosition: [60, 120, 200],
};

const POST_H = 200;
const POST_R = 10;
const FINIAL_R = 15;
const RING_Y = 40;

// Three wraps around the post (trefoil-like)
function initialCordPath() {
  const pts = [];
  const R = POST_R + 8;
  // From hook at base
  pts.push([30, 0, 0]);    // hook position
  pts.push([25, 10, 5]);

  // Three helical wraps with crossings
  for (let wrap = 0; wrap < 3; wrap++) {
    const baseY = 30 + wrap * 50;
    const dir = wrap % 2 === 0 ? 1 : -1;
    pts.push([R * dir, baseY, R]);
    pts.push([-R * dir, baseY + 15, -R]);
    pts.push([R * dir, baseY + 30, R * 0.5]);
    pts.push([0, baseY + 40, -R * dir]);
  }

  // Up to ring
  pts.push([5, RING_Y + 140, 5]);
  pts.push([0, RING_Y + 150, 0]);

  return pts;
}

// Two wraps remaining
function midCordPath1() {
  const pts = [];
  const R = POST_R + 8;
  pts.push([30, 0, 0]);
  pts.push([25, 10, 5]);

  for (let wrap = 0; wrap < 2; wrap++) {
    const baseY = 30 + wrap * 50;
    const dir = wrap % 2 === 0 ? 1 : -1;
    pts.push([R * dir, baseY, R]);
    pts.push([-R * dir, baseY + 15, -R]);
    pts.push([R * dir, baseY + 30, R * 0.5]);
    pts.push([0, baseY + 40, -R * dir]);
  }

  // Straight up to ring (no third wrap)
  pts.push([5, 130, 5]);
  pts.push([3, 150, 3]);
  pts.push([0, 170, 0]);
  pts.push([0, 180, 0]);

  return pts;
}

// One wrap remaining
function midCordPath2() {
  const pts = [];
  const R = POST_R + 8;
  pts.push([30, 0, 0]);
  pts.push([25, 10, 5]);

  const baseY = 30;
  pts.push([R, baseY, R]);
  pts.push([-R, baseY + 15, -R]);
  pts.push([R, baseY + 30, R * 0.5]);
  pts.push([0, baseY + 40, -R]);

  pts.push([5, 80, 5]);
  pts.push([3, 110, 3]);
  pts.push([2, 140, 2]);
  pts.push([0, 170, 0]);
  pts.push([0, 180, 0]);
  pts.push([0, 180, 0]);

  return pts;
}

// Fully unwound
function solvedCordPath() {
  return [
    [30, 0, 0],
    [25, 10, 5],
    [20, 30, 8],
    [15, 60, 10],
    [12, 90, 8],
    [8, 120, 5],
    [5, 140, 3],
    [3, 155, 2],
    [2, 165, 1],
    [0, 175, 0],
    [0, 180, 0],
    [0, 180, 0],
  ];
}

export function create3DScene() {
  const mats = createMaterials();
  const group = new THREE.Group();

  // Post
  const post = createPost(POST_R * 2, POST_H, mats.wood);
  group.add(post);

  // Ball finial
  const finial = createBall(FINIAL_R * 2, mats.wood);
  finial.position.set(0, POST_H, 0);
  group.add(finial);

  // Base
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(80, 15, 80),
    mats.darkWood
  );
  base.position.y = -7.5;
  group.add(base);

  // Ring around post
  const ring = createRing(50, 4, mats.brass);
  ring.position.set(0, RING_Y, 0);
  group.add(ring);

  // Hook in base
  const hook = new THREE.Mesh(
    new THREE.TorusGeometry(5, 1.5, 8, 16, Math.PI),
    mats.steel
  );
  hook.position.set(30, 2, 0);
  hook.rotation.x = Math.PI / 2;
  group.add(hook);

  // Cord
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

  const post = createPost(POST_R * 2, POST_H, mats.wood);
  group.add(post);

  const finial = createBall(FINIAL_R * 2, mats.wood);
  finial.position.set(0, POST_H, 0);
  group.add(finial);

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(80, 15, 80),
    mats.darkWood
  );
  base.position.y = -7.5;
  group.add(base);

  const ring = createRing(50, 4, mats.brass);
  ring.position.set(0, RING_Y, 0);
  group.add(ring);

  const hook = new THREE.Mesh(
    new THREE.TorusGeometry(5, 1.5, 8, 16, Math.PI),
    mats.steel
  );
  hook.position.set(30, 2, 0);
  hook.rotation.x = Math.PI / 2;
  group.add(hook);

  const cord = new CordPath(initialCordPath(), {
    radius: 2.5,
    material: mats.cord,
  });
  cord.addTo(group);

  return { group, objects: { ring, cord } };
}

export const animationSteps = [
  {
    label: 'Initial: cord wraps 3 times around post — looks like a trefoil',
    duration: 2.5,
    cord: initialCordPath(),
    ring: { position: [0, RING_Y, 0] },
  },
  {
    label: 'Slide ring down for slack. Lift outermost wrap over the ball finial',
    duration: 3.0,
    cord: midCordPath1(),
    ring: { position: [0, 20, 0] },
  },
  {
    label: 'Second wrap lifted over the finial — one wrap remaining',
    duration: 3.0,
    cord: midCordPath2(),
    ring: { position: [0, 15, 0] },
  },
  {
    label: 'Third wrap cleared — cord hangs free! It was an open arc, not a trefoil.',
    duration: 2.5,
    cord: solvedCordPath(),
    ring: { position: [0, RING_Y, 0] },
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

  svg.text(s, 250, 25, "The Ferryman's Knot — Initial State", {
    fontSize: 14, anchor: 'middle', fontWeight: 'bold',
  });

  // Post
  svg.rect(s, 240, 60, 20, 260, { fill: '#c4956a', stroke: '#8b6914', strokeWidth: 1.5 });

  // Finial
  svg.circle(s, 250, 55, 18, { fill: '#c4956a', stroke: '#8b6914', strokeWidth: 1.5 });

  // Base
  svg.rect(s, 200, 320, 100, 20, { fill: '#8b6914', stroke: '#6b4f12', strokeWidth: 1.5 });

  // Cord wraps (simplified front view — three X crossings)
  const wrapColors = ['#2255aa'];
  for (let i = 0; i < 3; i++) {
    const y = 120 + i * 60;
    // Front strand
    svg.line(s, 220, y, 280, y + 40, { stroke: '#2255aa', strokeWidth: 2.5 });
    // Back strand (with gap for crossing)
    svg.crossingGap(s, 250, y + 20, Math.PI / 4, 14);
    svg.line(s, 280, y, 220, y + 40, { stroke: '#2255aa', strokeWidth: 2.5 });
  }

  // Cord to hook
  svg.path(s, 'M 240 300 L 310 320', { stroke: '#2255aa', strokeWidth: 2.5 });

  // Hook
  svg.path(s, 'M 310 320 Q 320 310 310 300', { stroke: '#888', strokeWidth: 3, fill: 'none' });

  // Ring on post
  svg.ellipse(s, 250, 305, 22, 8, { stroke: '#cc8800', strokeWidth: 3, fill: 'none' });

  // Labels
  svg.label(s, 340, 55, 268, 55, 'Ball finial (30mm)');
  svg.label(s, 130, 170, 218, 170, '3 crossings');
  svg.label(s, 350, 305, 272, 305, 'Ring (trapped by finial)');
  svg.label(s, 360, 320, 320, 315, 'Hook in base');

  // Key insight
  svg.rect(s, 20, 355, 460, 35, { fill: '#fee8e8', stroke: '#d44', strokeWidth: 1, rx: 4 });
  svg.text(s, 250, 370, 'Seems impossible! But this is an OPEN ARC, not a closed trefoil.', {
    fontSize: 10, anchor: 'middle', fill: '#a33', fontWeight: 'bold',
  });
  svg.text(s, 250, 383, 'Each wrap can be lifted over the finial one at a time.', {
    fontSize: 10, anchor: 'middle', fill: '#a33',
  });
}

export function dispose() {}
