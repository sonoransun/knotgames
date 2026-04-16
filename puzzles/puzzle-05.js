import * as THREE from 'three';
import { createMaterials, createHighlightMaterial, applyHighlight, removeHighlight } from '../lib/materials.js';
import { enableShadowsOnGroup } from '../lib/scene.js';
import { StepArrowManager } from '../lib/arrow-helpers.js';
import * as svg from '../lib/svg.js';

export const metadata = {
  id: 6,
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
  enableShadowsOnGroup(group);
  return group;
}

export function createAnimScene() {
  const mats = createMaterials();
  const { group, ovals } = createBorromeanGroup(mats, true);
  enableShadowsOnGroup(group);
  const arrowManager = new StepArrowManager(group);
  return { group, objects: { ...ovals, arrowManager } };
}

const SEP = { red: [-80, 0, 0], blue: [80, 0, 0], yellow: [0, 80, 0] };
const MID = { red: [-30, 0, 0], blue: [30, 0, 0], yellow: [0, 30, 0] };
const LOCK = { red: [0, 0, 0], blue: [0, 0, 0], yellow: [0, 0, 0] };

const SEP_R = {
  red: [0, 0, 0],
  blue: [Math.PI / 2, 0, Math.PI / 2],
  yellow: [Math.PI / 2, Math.PI / 2, 0],
};

const arrowConfigs = {
  1: { arrows: [
    { from: [-80, 0, 0], to: [-30, 0, 0], opts: { color: 0xdd3333 } },
    { from: [80, 0, 0], to: [30, 0, 0], opts: { color: 0x3333dd } },
    { from: [0, 80, 0], to: [0, 30, 0], opts: { color: 0xddcc33 } },
  ] },
  2: { arrows: [
    { from: [-30, 0, 0], to: [0, 0, 0], opts: { color: 0xdd3333 } },
    { from: [30, 0, 0], to: [0, 0, 0], opts: { color: 0x3333dd } },
    { from: [0, 30, 0], to: [0, 0, 0], opts: { color: 0xddcc33 } },
  ] },
};
let highlightMat = null;

export const animationSteps = [
  {
    label: 'Start: hold three separate ovals — no two are linked together',
    duration: 2.0,
    positions: SEP,
    rotations: SEP_R,
  },
  {
    label: 'Slide the ovals closer, overlapping but not yet interlocked',
    duration: 2.5,
    positions: MID,
    rotations: SEP_R,
  },
  {
    label: 'Weave all three ovals together at the same time',
    duration: 3.0,
    positions: LOCK,
    rotations: SEP_R,
  },
  {
    label: 'Hold and check: remove any one oval and the others fall apart',
    duration: 2.5,
    positions: LOCK,
    rotations: SEP_R,
  },
];

export function updateAnimation(objects, state) {
  const { stepIndex, stepProgress } = state;

  // Direction arrows
  if (objects.arrowManager) {
    objects.arrowManager.showForStep(stepIndex, arrowConfigs);
    objects.arrowManager.updateOpacity(stepProgress);
  }

  // Highlight active ovals during weaving
  if (stepIndex >= 2) {
    for (const name of ['red', 'blue', 'yellow']) {
      const oval = objects[name];
      if (!oval) continue;
      if (!highlightMat) {
        highlightMat = createHighlightMaterial(oval.material, 0xaaccff, 0.3);
      }
      applyHighlight(oval, highlightMat);
    }
  } else {
    for (const name of ['red', 'blue', 'yellow']) {
      const oval = objects[name];
      if (oval) removeHighlight(oval);
    }
  }

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
  svg.text(s, cx - 18, cy - 15, 'Red over Blue', { fontSize: 7, fill: '#dd3333' });
  svg.text(s, cx + 2, cy + 20, 'Blue over Yellow', { fontSize: 7, fill: '#3333dd' });
  svg.text(s, cx - 45, cy + 20, 'Yellow over Red', { fontSize: 7, fill: '#ccaa00' });

  // Labels
  for (let i = 0; i < 3; i++) {
    const lx = positions[i][0] + (positions[i][0] > cx ? 50 : -50);
    const ly = positions[i][1] + (positions[i][1] < cy ? -30 : 30);
    svg.text(s, lx, ly, names[i], {
      fontSize: 11, fill: colors[i], anchor: 'middle', fontWeight: 'bold',
    });
  }

  // Motion arrows showing assembly direction
  svg.motionArrow(s, positions[0][0] - 30, positions[0][1], positions[0][0], positions[0][1], { label: 'Red', curvature: 0.3 });
  svg.motionArrow(s, positions[1][0], positions[1][1] + 30, positions[1][0], positions[1][1], { label: 'Blue', curvature: 0.3 });
  svg.motionArrow(s, positions[2][0] + 30, positions[2][1], positions[2][0], positions[2][1], { label: 'Yellow', curvature: 0.3 });

  // Hand icon near center
  svg.handIcon(s, cx + 50, cy - 10, { scale: 0.6, rotation: 0 });

  // Step badges
  svg.stepBadge(s, cx - 80, cy - 60, 1, 3);
  svg.actionLabel(s, cx - 80, cy - 47, 'Lay ovals flat');
  svg.stepBadge(s, cx + 60, cy - 60, 2, 3);
  svg.actionLabel(s, cx + 60, cy - 47, 'Overlap loosely');
  svg.stepBadge(s, cx, cy + 65, 3, 3);
  svg.actionLabel(s, cx, cy + 78, 'Weave all three');

  // Properties box
  const calloutRect = svg.rect(s, 30, 290, 440, 75, { fill: '#fff3e0', stroke: '#e67e22', strokeWidth: 1, rx: 4 });
  calloutRect.classList.add('callout-box');
  svg.text(s, 250, 310, 'How it works:', {
    fontSize: 12, anchor: 'middle', fontWeight: 'bold', fill: '#bf5f00',
  });
  svg.text(s, 250, 328, 'No two ovals are linked on their own — pull any pair apart easily', {
    fontSize: 10, anchor: 'middle', fill: '#bf5f00',
  });
  svg.text(s, 250, 344, 'But all three woven together lock tight — each one traps the other two', {
    fontSize: 10, anchor: 'middle', fill: '#bf5f00',
  });
  svg.text(s, 250, 358, 'Remove any one oval and the remaining two fall apart immediately', {
    fontSize: 10, anchor: 'middle', fill: '#bf5f00',
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
