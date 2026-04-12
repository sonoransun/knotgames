import * as THREE from 'three';
import { createMaterials } from '../lib/materials.js';
import { createRing, createBall, createBlock } from '../lib/components.js';
import { CordPath, catenaryPoints } from '../lib/cord.js';
import * as svg from '../lib/svg.js';

export const metadata = {
  id: 12,
  name: 'The Braid Cage',
  difficulty: 'Intermediate-Advanced',
  principle: 'Braid groups (Yang-Baxter relation)',
  type: 'Transfer',
  description: 'Three colored rings sit on three posts, connected by cords. Rearrange them to target positions — but only specific braid-relation sequences keep the cords untangled.',
  cameraPosition: [0, 100, 200],
};

const POST_HEIGHT = 120;
const POST_RADIUS = 5;
const POST_SPACING = 50;
const BALL_SIZE = 14;
const RING_OD = 35;

function createPost(x, mats) {
  const group = new THREE.Group();
  const post = new THREE.Mesh(
    new THREE.CylinderGeometry(POST_RADIUS, POST_RADIUS, POST_HEIGHT, 16),
    mats.wood
  );
  post.position.set(x, POST_HEIGHT / 2, 0);
  group.add(post);

  const finial = createBall(BALL_SIZE, mats.wood);
  finial.position.set(x, POST_HEIGHT + BALL_SIZE / 2, 0);
  group.add(finial);

  return group;
}

function createBase(mats) {
  const base = createBlock(180, 15, 60, mats.darkWood);
  base.position.y = -7.5;
  return base;
}

function ringOnPost(postX, ringY, material) {
  const ring = createRing(RING_OD, 4, material);
  ring.position.set(postX, ringY, 0);
  ring.rotation.x = Math.PI / 2;
  return ring;
}

export function create3DScene() {
  const mats = createMaterials();
  const group = new THREE.Group();

  group.add(createBase(mats));

  // Three posts
  for (const x of [-POST_SPACING, 0, POST_SPACING]) {
    group.add(createPost(x, mats));
  }

  // Rings on posts (target configuration: red, blue, yellow left to right)
  const redRing = ringOnPost(-POST_SPACING, 25, mats.red);
  const blueRing = ringOnPost(0, 25, mats.blue);
  const yellowRing = ringOnPost(POST_SPACING, 25, mats.yellow);
  group.add(redRing, blueRing, yellowRing);

  // Cords connecting adjacent pairs
  const cord1 = new CordPath(
    catenaryPoints([-POST_SPACING, 5, 0], [0, 5, 0], 10),
    { radius: 2, material: mats.cord }
  );
  cord1.addTo(group);

  const cord2 = new CordPath(
    catenaryPoints([0, 5, 0], [POST_SPACING, 5, 0], 10),
    { radius: 2, material: mats.cord }
  );
  cord2.addTo(group);

  return group;
}

export function createAnimScene() {
  const mats = createMaterials();
  const group = new THREE.Group();

  group.add(createBase(mats));

  for (const x of [-POST_SPACING, 0, POST_SPACING]) {
    group.add(createPost(x, mats));
  }

  // Initial: rings in scrambled order (blue, yellow, red)
  const ring1 = ringOnPost(-POST_SPACING, 25, mats.blue);
  const ring2 = ringOnPost(0, 25, mats.yellow);
  const ring3 = ringOnPost(POST_SPACING, 25, mats.red);
  group.add(ring1, ring2, ring3);

  const cord1 = new CordPath(
    catenaryPoints([-POST_SPACING, 5, 0], [0, 5, 0], 10),
    { radius: 2, material: mats.cord }
  );
  cord1.addTo(group);

  const cord2 = new CordPath(
    catenaryPoints([0, 5, 0], [POST_SPACING, 5, 0], 10),
    { radius: 2, material: mats.cord }
  );
  cord2.addTo(group);

  return { group, objects: { ring1, ring2, ring3, cord1, cord2 } };
}

// Braid animation: sigma1 * sigma2 * sigma1 (Yang-Baxter)
// Positions: post centers at x = -50, 0, 50
const P1 = -POST_SPACING, P2 = 0, P3 = POST_SPACING;
const RY = 25;
const LIFT_Y = POST_HEIGHT + 20;

export const animationSteps = [
  {
    label: 'Initial: rings are scrambled (Blue, Yellow, Red)',
    duration: 2.0,
    ringPos: { ring1: [P1, RY, 0], ring2: [P2, RY, 0], ring3: [P3, RY, 0] },
  },
  {
    label: 'Step 1 (sigma_1): Swap posts 1-2 — lift Blue over Yellow',
    duration: 2.5,
    ringPos: { ring1: [P2, RY, 0], ring2: [P1, RY, 0], ring3: [P3, RY, 0] },
  },
  {
    label: 'Step 2 (sigma_2): Swap posts 2-3 — lift Blue over Red',
    duration: 2.5,
    ringPos: { ring1: [P3, RY, 0], ring2: [P1, RY, 0], ring3: [P2, RY, 0] },
  },
  {
    label: 'Step 3 (sigma_1): Swap posts 1-2 — lift Yellow over Red',
    duration: 2.5,
    ringPos: { ring1: [P3, RY, 0], ring2: [P2, RY, 0], ring3: [P1, RY, 0] },
  },
  {
    label: 'Solved! Red-Blue-Yellow. The Yang-Baxter braid relation keeps cords untangled.',
    duration: 2.0,
    ringPos: { ring1: [P3, RY, 0], ring2: [P2, RY, 0], ring3: [P1, RY, 0] },
  },
];

export function updateAnimation(objects, state) {
  const { stepIndex, stepProgress } = state;
  const step = animationSteps[stepIndex];
  const prevStep = stepIndex > 0 ? animationSteps[stepIndex - 1] : animationSteps[0];

  for (const name of ['ring1', 'ring2', 'ring3']) {
    const ring = objects[name];
    if (!ring) continue;
    const f = prevStep.ringPos[name];
    const t = step.ringPos[name];

    // Arc motion: lift up in first half, descend in second half
    const arcY = (stepIndex > 0 && stepIndex < animationSteps.length - 1)
      ? Math.sin(stepProgress * Math.PI) * 60
      : 0;

    ring.position.set(
      f[0] + (t[0] - f[0]) * stepProgress,
      f[1] + (t[1] - f[1]) * stepProgress + arcY,
      f[2] + (t[2] - f[2]) * stepProgress,
    );
  }
}

export function createSVGDiagram(container) {
  const s = svg.createSVG(container, 500, 400);

  svg.text(s, 250, 25, 'The Braid Cage — Braid Group Relations', {
    fontSize: 14, anchor: 'middle', fontWeight: 'bold',
  });

  // Three posts
  const postX = [130, 250, 370];
  const postTop = 60;
  const postBot = 220;
  const colors = ['#3333dd', '#ddcc33', '#dd3333'];
  const labels = ['Blue', 'Yellow', 'Red'];

  for (let i = 0; i < 3; i++) {
    svg.line(s, postX[i], postTop, postX[i], postBot, { stroke: '#8b6914', strokeWidth: 6 });
    svg.circle(s, postX[i], postTop - 5, 7, { fill: '#c4956a', stroke: '#8b6914', strokeWidth: 1.5 });

    // Rings
    svg.ellipse(s, postX[i], postBot - 40, 18, 12, {
      stroke: colors[i], strokeWidth: 3, fill: 'none',
    });
    svg.text(s, postX[i], postBot - 18, labels[i], {
      fontSize: 10, anchor: 'middle', fill: colors[i], fontWeight: 'bold',
    });
  }

  // Base
  svg.rect(s, 95, postBot, 310, 15, { fill: '#c4956a', stroke: '#8b6914', strokeWidth: 1.5, rx: 3 });

  // Braid diagram below
  svg.text(s, 250, 260, 'Yang-Baxter Relation:', {
    fontSize: 12, anchor: 'middle', fontWeight: 'bold', fill: '#333',
  });

  // sigma_1 sigma_2 sigma_1 = sigma_2 sigma_1 sigma_2
  svg.text(s, 250, 280, '\u03C3\u2081\u03C3\u2082\u03C3\u2081 = \u03C3\u2082\u03C3\u2081\u03C3\u2082', {
    fontSize: 14, anchor: 'middle', fill: '#555', fontFamily: 'serif',
  });

  // Visual braid strands
  const bx = [170, 250, 330];
  const by1 = 300, by2 = 330, by3 = 360;

  // Three strands, showing sigma1*sigma2*sigma1
  // Strand 1 (starts left): crosses right at level 1, stays at level 2, crosses right at level 3
  svg.path(s, `M ${bx[0]} ${by1} L ${bx[1]} ${by2} L ${bx[1]} ${by2} L ${bx[2]} ${by3}`, {
    stroke: colors[0], strokeWidth: 2.5, fill: 'none',
  });
  // Strand 2 (starts middle): crosses left at level 1, crosses right at level 2, stays at level 3
  svg.path(s, `M ${bx[1]} ${by1} L ${bx[0]} ${by2} L ${bx[1]} ${by2 + 5} L ${bx[1]} ${by3}`, {
    stroke: colors[1], strokeWidth: 2.5, fill: 'none',
  });
  // Strand 3 (starts right): stays at level 1, crosses left at level 2, crosses left at level 3
  svg.path(s, `M ${bx[2]} ${by1} L ${bx[2]} ${by2} L ${bx[1]} ${by2 + 5} L ${bx[0]} ${by3}`, {
    stroke: colors[2], strokeWidth: 2.5, fill: 'none',
  });

  // Key insight
  const calloutRect = svg.rect(s, 30, 370, 440, 25, { fill: '#e8f0fe', stroke: '#4a90d9', strokeWidth: 1, rx: 4 });
  calloutRect.classList.add('callout-box');
  svg.text(s, 250, 387, 'Key: The order of swaps matters — only braid-relation sequences keep cords untangled', {
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
