import * as THREE from 'three';
import { createMaterials } from '../lib/materials.js';
import { createRing, createBall } from '../lib/components.js';
import { CordPath } from '../lib/cord.js';
import * as svg from '../lib/svg.js';

export const metadata = {
  id: 13,
  name: 'The Torus Winder',
  difficulty: 'Advanced',
  principle: 'Torus knots — (p,q) winding numbers',
  type: 'Assembly',
  description: 'Wind a cord around a torus following guide notches to create a (2,3) torus knot — the simplest non-trivial torus knot. Only specific winding number pairs produce genuine knots that trap a sliding ring.',
  cameraPosition: [0, 60, 200],
};

const TORUS_MAJOR_R = 50;
const TORUS_MINOR_R = 15;
const CORD_RADIUS = 2.5;

// Generate (p,q) torus knot points on a torus surface
function torusKnotPoints(p, q, majorR, minorR, segments = 96) {
  const pts = [];
  for (let i = 0; i <= segments; i++) {
    const t = (2 * Math.PI * i) / segments;
    const phi = p * t; // angle around torus hole
    const theta = q * t; // angle around torus tube
    const r = majorR + (minorR + 3) * Math.cos(theta);
    pts.push([
      r * Math.cos(phi),
      (minorR + 3) * Math.sin(theta),
      r * Math.sin(phi),
    ]);
  }
  return pts;
}

// Simple unwound cord path (not knotted — just a loop on the torus surface)
function unwoundCordPath() {
  const pts = [];
  const segments = 96;
  for (let i = 0; i <= segments; i++) {
    const t = (2 * Math.PI * i) / segments;
    const r = TORUS_MAJOR_R + (TORUS_MINOR_R + 3);
    pts.push([r * Math.cos(t), 0, r * Math.sin(t)]);
  }
  return pts;
}

// Partially wound cord (1 loop through, 1 around)
function partialWindPath() {
  return torusKnotPoints(1, 2, TORUS_MAJOR_R, TORUS_MINOR_R);
}

// Full (2,3) torus knot winding
function fullWindPath() {
  return torusKnotPoints(2, 3, TORUS_MAJOR_R, TORUS_MINOR_R);
}

function createTorus(material) {
  const geometry = new THREE.TorusGeometry(TORUS_MAJOR_R, TORUS_MINOR_R, 32, 64);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = Math.PI / 2;
  return mesh;
}

// Guide notch markers on torus surface
function createGuideNotches(material) {
  const group = new THREE.Group();
  const notchGeo = new THREE.SphereGeometry(2, 8, 8);
  // Place 6 guide markers at key positions on the (2,3) path
  const pts = torusKnotPoints(2, 3, TORUS_MAJOR_R, TORUS_MINOR_R, 6);
  for (let i = 0; i < 6; i++) {
    const notch = new THREE.Mesh(notchGeo, material);
    notch.position.set(pts[i][0], pts[i][1], pts[i][2]);
    group.add(notch);
  }
  return group;
}

export function create3DScene() {
  const mats = createMaterials();
  const group = new THREE.Group();

  // Torus
  const torus = createTorus(mats.steel);
  group.add(torus);

  // Guide notches
  const notches = createGuideNotches(mats.yellow);
  group.add(notches);

  // (2,3) torus knot cord (completed state)
  const knotPts = fullWindPath();
  const cord = new CordPath(knotPts, {
    radius: CORD_RADIUS,
    material: mats.cord,
    closed: true,
  });
  cord.addTo(group);

  // Ball-stops at cord start/end
  const ball1 = createBall(10, mats.wood);
  ball1.position.set(knotPts[0][0], knotPts[0][1], knotPts[0][2]);
  group.add(ball1);

  // Trapped sliding ring
  const ring = createRing(25, 3, mats.brass);
  ring.position.set(TORUS_MAJOR_R + TORUS_MINOR_R + 5, 0, 0);
  group.add(ring);

  return group;
}

export function createAnimScene() {
  const mats = createMaterials();
  const group = new THREE.Group();

  const torus = createTorus(mats.steel);
  group.add(torus);

  const notches = createGuideNotches(mats.yellow);
  group.add(notches);

  // Start with unwound cord
  const cord = new CordPath(unwoundCordPath(), {
    radius: CORD_RADIUS,
    material: mats.cord,
    closed: true,
  });
  cord.addTo(group);

  // Ring starts free
  const ring = createRing(25, 3, mats.brass);
  ring.position.set(TORUS_MAJOR_R + TORUS_MINOR_R + 15, 0, 0);
  group.add(ring);

  return { group, objects: { cord, ring } };
}

export const animationSteps = [
  {
    label: 'Unwound cord lies flat on the torus — ring slides freely',
    duration: 2.0,
    cord: unwoundCordPath(),
    ringPos: [TORUS_MAJOR_R + TORUS_MINOR_R + 15, 0, 0],
  },
  {
    label: 'Begin winding: 1 loop through hole, 2 around tube (not yet a knot)',
    duration: 3.0,
    cord: partialWindPath(),
    ringPos: [TORUS_MAJOR_R + TORUS_MINOR_R + 10, 0, 0],
  },
  {
    label: 'Complete (2,3) winding: 2 through hole, 3 around tube — a trefoil!',
    duration: 3.0,
    cord: fullWindPath(),
    ringPos: [TORUS_MAJOR_R + TORUS_MINOR_R + 5, 0, 0],
  },
  {
    label: 'Ring is trapped! The (2,3) torus knot is genuinely knotted.',
    duration: 2.5,
    cord: fullWindPath(),
    ringPos: [TORUS_MAJOR_R + TORUS_MINOR_R + 5, 0, 0],
  },
];

export function updateAnimation(objects, state) {
  const { stepIndex, stepProgress } = state;
  const step = animationSteps[stepIndex];
  const prevStep = stepIndex > 0 ? animationSteps[stepIndex - 1] : animationSteps[0];

  // Interpolate cord
  if (step.cord && prevStep.cord) {
    const interpolated = CordPath.interpolatePoints(prevStep.cord, step.cord, stepProgress);
    objects.cord.update(interpolated);
  }

  // Interpolate ring position
  const f = prevStep.ringPos;
  const t = step.ringPos;
  objects.ring.position.set(
    f[0] + (t[0] - f[0]) * stepProgress,
    f[1] + (t[1] - f[1]) * stepProgress,
    f[2] + (t[2] - f[2]) * stepProgress,
  );
}

export function createSVGDiagram(container) {
  const s = svg.createSVG(container, 500, 400);

  svg.text(s, 250, 25, 'The Torus Winder — (2,3) Torus Knot', {
    fontSize: 14, anchor: 'middle', fontWeight: 'bold',
  });

  // Torus cross-section view
  const cx = 250, cy = 170;
  // Outer ring of torus (top view)
  svg.ellipse(s, cx, cy, 100, 60, { stroke: '#888', strokeWidth: 2, fill: 'none' });
  svg.ellipse(s, cx, cy, 50, 30, { stroke: '#888', strokeWidth: 1, fill: '#fafafa', dashArray: '4,3' });

  // (2,3) trefoil knot drawn on the torus
  // Simplified: three lobes that wind around the torus
  svg.path(s, `M ${cx + 90} ${cy} C ${cx + 100} ${cy - 50}, ${cx + 40} ${cy - 70}, ${cx} ${cy - 55} C ${cx - 40} ${cy - 40}, ${cx - 100} ${cy - 30}, ${cx - 90} ${cy} C ${cx - 100} ${cy + 30}, ${cx - 40} ${cy + 70}, ${cx} ${cy + 55} C ${cx + 40} ${cy + 40}, ${cx + 100} ${cy + 50}, ${cx + 90} ${cy}`, {
    stroke: '#2255aa', strokeWidth: 3, fill: 'none',
  });

  // Guide notch markers
  const notchPositions = [
    [cx + 90, cy], [cx - 45, cy - 50], [cx - 45, cy + 50],
    [cx + 45, cy - 45], [cx + 45, cy + 45], [cx - 90, cy],
  ];
  for (const [nx, ny] of notchPositions) {
    svg.circle(s, nx, ny, 4, { fill: '#ddcc33', stroke: '#aa9900', strokeWidth: 1 });
  }

  // Winding number labels
  svg.text(s, cx, cy + 90, 'p = 2 (through hole)', { fontSize: 11, anchor: 'middle', fill: '#555' });
  svg.text(s, cx, cy + 105, 'q = 3 (around tube)', { fontSize: 11, anchor: 'middle', fill: '#555' });
  svg.text(s, cx, cy + 120, 'gcd(2,3) = 1 \u2192 genuine knot (trefoil)', { fontSize: 11, anchor: 'middle', fill: '#2255aa', fontWeight: 'bold' });

  // Comparison table
  svg.rect(s, 50, 305, 400, 55, { fill: '#f5f5f5', stroke: '#ddd', strokeWidth: 1, rx: 4 });
  svg.text(s, 250, 320, 'Winding pairs and their knot types:', { fontSize: 10, anchor: 'middle', fontWeight: 'bold', fill: '#333' });
  svg.text(s, 250, 335, '(1,q) = unknot    (2,2) = link    (2,3) = trefoil    (2,5) = Solomon\'s seal', {
    fontSize: 9, anchor: 'middle', fill: '#666',
  });
  svg.text(s, 250, 350, 'Rule: (p,q) with gcd(p,q)=1 and p,q \u2265 2 produces a genuine knot', {
    fontSize: 9, anchor: 'middle', fill: '#666',
  });

  // Key insight
  const calloutRect = svg.rect(s, 30, 370, 440, 25, { fill: '#e8f0fe', stroke: '#4a90d9', strokeWidth: 1, rx: 4 });
  calloutRect.classList.add('callout-box');
  svg.text(s, 250, 387, 'Key: The winding numbers determine whether the cord is knotted — numbers matter', {
    fontSize: 10, anchor: 'middle', fill: '#2a5a8a',
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
