import * as THREE from 'three';
import { createMaterials } from '../lib/materials.js';
import * as svg from '../lib/svg.js';

export const metadata = {
  id: 5,
  name: 'Trinity Lock',
  difficulty: 'Intermediate',
  principle: 'Borromean rings (no pairwise linking)',
  type: 'Assembly',
  description: 'Three ovals must be interlocked so all three hold together, yet no two are linked. Remove any one and the other two fall apart. Assembly requires simultaneous three-body weaving.',
  cameraPosition: [60, 80, 180],
};

const OVAL_LONG = 40;
const OVAL_SHORT = 20;
const ROD_R = 2;

function createOval(material) {
  const pts = [];
  const segments = 48;
  for (let i = 0; i <= segments; i++) {
    const angle = (2 * Math.PI * i) / segments;
    pts.push(new THREE.Vector3(
      Math.cos(angle) * OVAL_LONG,
      Math.sin(angle) * OVAL_SHORT,
      0
    ));
  }
  const curve = new THREE.CatmullRomCurve3(pts, true);
  const geometry = new THREE.TubeGeometry(curve, 64, ROD_R, 12, true);
  return new THREE.Mesh(geometry, material);
}

// Borromean configuration offsets
function borromeanPositions() {
  // Three ovals in orthogonal planes with over/under weaving
  return {
    red: { rotation: [0, 0, 0], position: [0, 0, 0] },           // XY plane
    blue: { rotation: [Math.PI / 2, 0, Math.PI / 2], position: [0, 0, 0] },   // XZ plane
    yellow: { rotation: [Math.PI / 2, Math.PI / 2, 0], position: [0, 0, 0] }, // YZ plane
  };
}

function createBorromeanGroup(mats, separated = false) {
  const group = new THREE.Group();

  const redOval = createOval(mats.red);
  const blueOval = createOval(mats.blue);
  const yellowOval = createOval(mats.yellow);

  if (separated) {
    // Separated positions (for animation start)
    redOval.position.set(-80, 0, 0);
    blueOval.position.set(80, 0, 0);
    blueOval.rotation.set(Math.PI / 2, 0, Math.PI / 2);
    yellowOval.position.set(0, 80, 0);
    yellowOval.rotation.set(Math.PI / 2, Math.PI / 2, 0);
  } else {
    // Borromean configuration
    const pos = borromeanPositions();
    redOval.rotation.set(...pos.red.rotation);
    redOval.position.set(...pos.red.position);
    blueOval.rotation.set(...pos.blue.rotation);
    blueOval.position.set(...pos.blue.position);
    yellowOval.rotation.set(...pos.yellow.rotation);
    yellowOval.position.set(...pos.yellow.position);
  }

  group.add(redOval);
  group.add(blueOval);
  group.add(yellowOval);

  return { group, ovals: { red: redOval, blue: blueOval, yellow: yellowOval } };
}

export function create3DScene() {
  const mats = createMaterials();
  const { group } = createBorromeanGroup(mats, false);
  return group;
}

export function createAnimScene() {
  const mats = createMaterials();
  const { group, ovals } = createBorromeanGroup(mats, true);
  return { group, objects: ovals };
}

const SEP = { red: [-80, 0, 0], blue: [80, 0, 0], yellow: [0, 80, 0] };
const MID = { red: [-30, 0, 0], blue: [30, 0, 0], yellow: [0, 30, 0] };
const LOCK = { red: [0, 0, 0], blue: [0, 0, 0], yellow: [0, 0, 0] };

const SEP_R = {
  red: [0, 0, 0],
  blue: [Math.PI / 2, 0, Math.PI / 2],
  yellow: [Math.PI / 2, Math.PI / 2, 0],
};

export const animationSteps = [
  {
    label: 'Three separate ovals — no two can be pairwise linked',
    duration: 2.0,
    positions: SEP,
    rotations: SEP_R,
  },
  {
    label: 'Bring ovals together, crossing but not linking',
    duration: 2.5,
    positions: MID,
    rotations: SEP_R,
  },
  {
    label: 'Thread all three simultaneously into Borromean configuration',
    duration: 3.0,
    positions: LOCK,
    rotations: SEP_R,
  },
  {
    label: 'Locked! Remove any one oval and the other two fall apart.',
    duration: 2.5,
    positions: LOCK,
    rotations: SEP_R,
  },
];

export function updateAnimation(objects, state) {
  const { stepIndex, stepProgress } = state;
  const step = animationSteps[stepIndex];
  const prevStep = stepIndex > 0 ? animationSteps[stepIndex - 1] : animationSteps[0];

  for (const name of ['red', 'blue', 'yellow']) {
    const oval = objects[name];
    if (!oval) continue;

    const fp = prevStep.positions[name];
    const tp = step.positions[name];
    oval.position.set(
      fp[0] + (tp[0] - fp[0]) * stepProgress,
      fp[1] + (tp[1] - fp[1]) * stepProgress,
      fp[2] + (tp[2] - fp[2]) * stepProgress,
    );
  }
}

export function createSVGDiagram(container) {
  const s = svg.createSVG(container, 500, 380);

  svg.text(s, 250, 25, 'Trinity Lock — Borromean Configuration', {
    fontSize: 14, anchor: 'middle', fontWeight: 'bold',
  });

  // Classic Borromean rings diagram (triangular arrangement)
  const cx = 250;
  const cy = 180;
  const R = 55;
  const r = 35;

  // Compute three ring centers
  const positions = [
    [cx, cy - R * 0.7],                          // top
    [cx - R * 0.8, cy + R * 0.5],                // bottom-left
    [cx + R * 0.8, cy + R * 0.5],                // bottom-right
  ];
  const colors = ['#dd3333', '#3333dd', '#ddcc33'];
  const names = ['Red (A)', 'Blue (B)', 'Yellow (C)'];

  // Draw rings with over/under crossings
  // First pass: draw all rings
  for (let i = 0; i < 3; i++) {
    svg.ellipse(s, positions[i][0], positions[i][1], r, r * 0.65, {
      stroke: colors[i],
      strokeWidth: 4,
      fill: 'none',
      transform: `rotate(${i * 120 + 30}, ${positions[i][0]}, ${positions[i][1]})`,
    });
  }

  // Over-under indicators (arrows showing the weaving pattern)
  svg.text(s, cx - 15, cy - 15, 'A over B', { fontSize: 8, fill: '#dd3333' });
  svg.text(s, cx + 5, cy + 20, 'B over C', { fontSize: 8, fill: '#3333dd' });
  svg.text(s, cx - 35, cy + 20, 'C over A', { fontSize: 8, fill: '#ccaa00' });

  // Labels
  for (let i = 0; i < 3; i++) {
    const lx = positions[i][0] + (positions[i][0] > cx ? 50 : -50);
    const ly = positions[i][1] + (positions[i][1] < cy ? -30 : 30);
    svg.text(s, lx, ly, names[i], {
      fontSize: 11, fill: colors[i], anchor: 'middle', fontWeight: 'bold',
    });
  }

  // Properties box
  const calloutRect = svg.rect(s, 30, 290, 440, 75, { fill: '#f5f5f5', stroke: '#ddd', strokeWidth: 1, rx: 4 });
  calloutRect.classList.add('callout-box');
  svg.text(s, 250, 310, 'Borromean Properties:', {
    fontSize: 12, anchor: 'middle', fontWeight: 'bold', fill: '#333',
  });
  svg.text(s, 250, 328, 'No two rings are pairwise linked (linking number = 0 for each pair)', {
    fontSize: 10, anchor: 'middle', fill: '#666',
  });
  svg.text(s, 250, 344, 'All three together are mutually linked (Milnor invariant non-zero)', {
    fontSize: 10, anchor: 'middle', fill: '#666',
  });
  svg.text(s, 250, 358, 'Remove any one ring and the other two separate immediately', {
    fontSize: 10, anchor: 'middle', fill: '#666',
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
