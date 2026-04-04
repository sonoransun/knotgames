import * as THREE from 'three';
import { createMaterials } from '../lib/materials.js';
import { createRing } from '../lib/components.js';
import { CordPath } from '../lib/cord.js';
import * as svg from '../lib/svg.js';

export const metadata = {
  id: 4,
  name: 'Mobius Snare',
  difficulty: 'Intermediate',
  principle: 'Non-orientability (Mobius boundary)',
  type: 'Disentanglement',
  description: 'A cord loop is threaded around a Mobius band. On an ordinary band, the cord would be trapped between two edges. But a Mobius band has only one edge — the twist enables escape.',
  cameraPosition: [0, 40, 200],
};

const BAND_R = 50;
const BAND_W = 12;

function createMobiusBand(material) {
  const R = BAND_R;
  const w = BAND_W;

  const geometry = new THREE.ParametricBufferGeometry
    ? new THREE.BufferGeometry()
    : new THREE.BufferGeometry();

  const uSteps = 120;
  const vSteps = 10;
  const vertices = [];
  const normals = [];
  const uvs = [];
  const indices = [];

  for (let i = 0; i <= uSteps; i++) {
    const u = (i / uSteps) * Math.PI * 2;
    for (let j = 0; j <= vSteps; j++) {
      const v = (j / vSteps - 0.5) * w;
      const x = (R + v * Math.cos(u / 2)) * Math.cos(u);
      const y = v * Math.sin(u / 2);
      const z = (R + v * Math.cos(u / 2)) * Math.sin(u);

      vertices.push(x, y, z);

      // Approximate normal
      const du = 0.01;
      const dv = 0.01;
      const x1 = (R + v * Math.cos((u + du) / 2)) * Math.cos(u + du);
      const y1 = v * Math.sin((u + du) / 2);
      const z1 = (R + v * Math.cos((u + du) / 2)) * Math.sin(u + du);
      const x2 = (R + (v + dv) * Math.cos(u / 2)) * Math.cos(u);
      const y2 = (v + dv) * Math.sin(u / 2);
      const z2 = (R + (v + dv) * Math.cos(u / 2)) * Math.sin(u);

      const tu = [x1 - x, y1 - y, z1 - z];
      const tv = [x2 - x, y2 - y, z2 - z];
      const nx = tu[1] * tv[2] - tu[2] * tv[1];
      const ny = tu[2] * tv[0] - tu[0] * tv[2];
      const nz = tu[0] * tv[1] - tu[1] * tv[0];
      const nl = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
      normals.push(nx / nl, ny / nl, nz / nl);

      uvs.push(i / uSteps, j / vSteps);
    }
  }

  for (let i = 0; i < uSteps; i++) {
    for (let j = 0; j < vSteps; j++) {
      const a = i * (vSteps + 1) + j;
      const b = a + 1;
      const c = (i + 1) * (vSteps + 1) + j;
      const d = c + 1;
      indices.push(a, b, c);
      indices.push(b, d, c);
    }
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);

  const mesh = new THREE.Mesh(geometry, material);
  return mesh;
}

// Cord wraps around the band
function initialCordPath() {
  const R = BAND_R;
  const pts = [];
  // Cord goes around the band at a position slightly offset from center
  const cordOffset = 3;
  for (let i = 0; i <= 24; i++) {
    const u = (i / 24) * Math.PI * 2;
    const v = cordOffset * Math.cos(u / 2);
    const x = (R + v * Math.cos(u / 2) + 2) * Math.cos(u);
    const y = v * Math.sin(u / 2) - 25;
    const z = (R + v * Math.cos(u / 2) + 2) * Math.sin(u);
    pts.push([x, y, z]);
  }
  return pts;
}

function solvedCordPath() {
  // Cord is free, hanging below as a simple loop
  const pts = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    const angle = t * Math.PI * 2;
    pts.push([
      Math.cos(angle) * 25,
      -80 - Math.sin(angle) * 15,
      Math.sin(angle) * 25,
    ]);
  }
  return pts;
}

function midCordPath1() {
  const R = BAND_R;
  const pts = [];
  for (let i = 0; i <= 24; i++) {
    const u = (i / 24) * Math.PI * 2;
    const progress = i / 24;
    const lift = progress > 0.4 && progress < 0.7 ? 15 : 0;
    const v = 3 * Math.cos(u / 2);
    const x = (R + v * Math.cos(u / 2) + 3 + lift * 0.3) * Math.cos(u);
    const y = v * Math.sin(u / 2) - 25 - lift;
    const z = (R + v * Math.cos(u / 2) + 3 + lift * 0.3) * Math.sin(u);
    pts.push([x, y, z]);
  }
  return pts;
}

export function create3DScene() {
  const mats = createMaterials();
  const group = new THREE.Group();

  const band = createMobiusBand(mats.leather);
  group.add(band);

  const ring = createRing(40, 4, mats.brass);
  ring.position.set(0, -60, 0);
  ring.rotation.x = Math.PI / 2;
  group.add(ring);

  const cord = new CordPath(initialCordPath(), {
    radius: 1.5,
    material: mats.cord,
    closed: true,
  });
  cord.addTo(group);

  // Rivet indicators
  const rivetMat = mats.brass;
  const rivet1 = new THREE.Mesh(new THREE.SphereGeometry(1.5, 8, 8), rivetMat);
  rivet1.position.set(BAND_R + 3, 0, 0);
  group.add(rivet1);
  const rivet2 = new THREE.Mesh(new THREE.SphereGeometry(1.5, 8, 8), rivetMat);
  rivet2.position.set(BAND_R + 9, 0, 0);
  group.add(rivet2);

  return group;
}

export function createAnimScene() {
  const mats = createMaterials();
  const group = new THREE.Group();

  const band = createMobiusBand(mats.leather);
  group.add(band);

  const ring = createRing(40, 4, mats.brass);
  ring.position.set(0, -60, 0);
  ring.rotation.x = Math.PI / 2;
  group.add(ring);

  const cord = new CordPath(initialCordPath(), {
    radius: 1.5,
    material: mats.cord,
    closed: true,
  });
  cord.addTo(group);

  return { group, objects: { ring, cord } };
}

export const animationSteps = [
  {
    label: 'Initial: cord loop threaded around the Mobius band',
    duration: 2.0,
    cord: initialCordPath(),
    ring: { position: [0, -60, 0] },
  },
  {
    label: 'Slide cord along the surface, through the half-twist',
    duration: 3.0,
    cord: midCordPath1(),
    ring: { position: [0, -65, 0] },
  },
  {
    label: 'Cord reaches the single edge and slips free — the twist enabled escape!',
    duration: 2.5,
    cord: solvedCordPath(),
    ring: { position: [0, -80, 0] },
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
  const s = svg.createSVG(container, 500, 380);

  svg.text(s, 250, 25, 'Mobius Snare — Initial State', {
    fontSize: 14, anchor: 'middle', fontWeight: 'bold',
  });

  // Mobius band (3/4 view approximation using figure-8 shape)
  svg.path(s, 'M 150 160 C 150 100, 250 80, 250 140 C 250 180, 350 160, 350 120 C 350 80, 250 100, 250 140 C 250 200, 150 220, 150 160', {
    stroke: '#8b5a2b', strokeWidth: 14, fill: 'none', strokeLinecap: 'round',
  });

  // Inner edge (lighter, showing the twist)
  svg.path(s, 'M 155 160 C 155 108, 245 88, 248 138 C 250 170, 345 155, 345 122', {
    stroke: '#c4956a', strokeWidth: 3, fill: 'none',
  });

  // Rivet at join
  svg.circle(s, 150, 160, 4, { fill: '#ccaa44', stroke: '#aa8833', strokeWidth: 1 });

  // Cord around the band
  svg.path(s, 'M 200 175 C 180 180, 160 195, 200 210 C 230 220, 300 215, 300 195 C 300 180, 260 170, 230 175', {
    stroke: '#2255aa', strokeWidth: 2.5, fill: 'none',
  });

  // Cord down to ring
  svg.line(s, 240, 210, 250, 260, { stroke: '#2255aa', strokeWidth: 2.5 });
  svg.line(s, 260, 210, 250, 260, { stroke: '#2255aa', strokeWidth: 2.5 });

  // Ring
  svg.ellipse(s, 250, 275, 18, 14, { stroke: '#cc8800', strokeWidth: 3, fill: 'none' });

  // Labels
  svg.label(s, 400, 120, 350, 130, 'Half-twist');
  svg.label(s, 90, 165, 150, 160, 'Rivet join');
  svg.label(s, 370, 275, 268, 275, 'Ring');
  svg.label(s, 380, 200, 300, 195, 'Cord loop');

  // Key insight
  const calloutRect = svg.rect(s, 20, 330, 460, 40, { fill: '#e8f0fe', stroke: '#4a90d9', strokeWidth: 1, rx: 4 });
  calloutRect.classList.add('callout-box');
  svg.text(s, 250, 348, 'Key: Mobius band has ONE edge (not two).', {
    fontSize: 11, anchor: 'middle', fill: '#2a5a8a', fontWeight: 'bold',
  });
  svg.text(s, 250, 362, 'The twist enables escape — cord follows the single edge and slips off.', {
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
