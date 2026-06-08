import * as THREE from 'three';
import { createMaterials, createHighlightMaterial, applyHighlight, removeHighlight } from '../lib/materials.js';
import { createRing, createBall, createBlock } from '../lib/components.js';
import { CordPath, catenaryPoints } from '../lib/cord.js';
import { enableShadowsOnGroup } from '../lib/scene.js';
import { StepArrowManager } from '../lib/arrow-helpers.js';
import * as svg from '../lib/svg.js';

export const metadata = {
  id: 13,
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

// Ghost ring at target position — translucent outline showing where this
// ring needs to end up. Helps the solver see the goal during the braid.
function ghostRingOnPost(postX, ringY, sourceMaterial) {
  const ghostMat = sourceMaterial.clone();
  ghostMat.transparent = true;
  ghostMat.opacity = 0.22;
  ghostMat.depthWrite = false;
  const ring = createRing(RING_OD, 4, ghostMat);
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

  // Cords connecting adjacent pairs (in create3DScene)
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

  enableShadowsOnGroup(group);
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

  // Ghost rings at TARGET positions: Red·Blue·Yellow at P1·P2·P3
  // Stacked slightly higher than active rings so they're visible as targets.
  const ghostRed = ghostRingOnPost(-POST_SPACING, 50, mats.red);
  const ghostBlue = ghostRingOnPost(0, 50, mats.blue);
  const ghostYellow = ghostRingOnPost(POST_SPACING, 50, mats.yellow);
  group.add(ghostRed, ghostBlue, ghostYellow);

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

  enableShadowsOnGroup(group);
  const arrowManager = new StepArrowManager(group);

  return {
    group,
    objects: { ring1, ring2, ring3, cord1, cord2, arrowManager,
               ghosts: [ghostRed, ghostBlue, ghostYellow] },
  };
}

// Braid animation for the Blue·Yellow·Red → Red·Blue·Yellow cyclic permutation.
// Minimum braid word: sigma_2 * sigma_1 (two adjacent swaps).
// ring1 = Blue (starts P1), ring2 = Yellow (starts P2), ring3 = Red (starts P3).
const P1 = -POST_SPACING, P2 = 0, P3 = POST_SPACING;
const RY = 25;
const LIFT_Y = POST_HEIGHT + 20;

const arrowConfigs = {
  // Step 1: σ₂ — swap rings at posts 2 and 3 (Yellow ↔ Red)
  1: { arrows: [
    { from: [P2, LIFT_Y, 0], to: [P3, RY, 0], opts: { color: 0xddcc33 } },
    { from: [P3, LIFT_Y, 0], to: [P2, RY, 0], opts: { color: 0xdd3333 } },
  ]},
  // Step 2: rest state after σ₂ (label-only, no arrows)
  // Step 3: σ₁ — swap rings at posts 1 and 2 (Blue ↔ Red)
  3: { arrows: [
    { from: [P1, LIFT_Y, 0], to: [P2, RY, 0], opts: { color: 0x3333dd } },
    { from: [P2, LIFT_Y, 0], to: [P1, RY, 0], opts: { color: 0xdd3333 } },
  ]},
};
let highlightMat = null;

export const animationSteps = [
  {
    label: 'Initial: Blue · Yellow · Red. Target: Red · Blue · Yellow (cyclic shift).',
    duration: 2.5,
    ringPos: { ring1: [P1, RY, 0], ring2: [P2, RY, 0], ring3: [P3, RY, 0] },
  },
  {
    label: 'σ₂ — Swap rings at posts 2 and 3: lift Yellow over center finial, lift Red over right finial',
    duration: 3.0,
    easing: 'easeOut', // settle as the rings land back on their posts
    ringPos: { ring1: [P1, RY, 0], ring2: [P3, RY, 0], ring3: [P2, RY, 0] },
  },
  {
    label: 'After σ₂: Blue · Red · Yellow. Cords cross once — clean braid.',
    duration: 1.5,
    ringPos: { ring1: [P1, RY, 0], ring2: [P3, RY, 0], ring3: [P2, RY, 0] },
  },
  {
    label: 'σ₁ — Swap rings at posts 1 and 2: lift Blue over left finial, lift Red over center finial',
    duration: 3.0,
    easing: 'easeOut', // settle as the rings land back on their posts
    ringPos: { ring1: [P2, RY, 0], ring2: [P3, RY, 0], ring3: [P1, RY, 0] },
  },
  {
    label: 'Solved! Red · Blue · Yellow. Two swaps, cords clean — order σ₂·σ₁ (NOT σ₁·σ₂).',
    duration: 2.5,
    easing: 'easeOut', // gently arrive at the solved configuration
    ringPos: { ring1: [P2, RY, 0], ring2: [P3, RY, 0], ring3: [P1, RY, 0] },
  },
];

export function updateAnimation(objects, state) {
  const { stepIndex, stepProgress } = state;

  // Direction arrows
  if (objects.arrowManager) {
    objects.arrowManager.showForStep(stepIndex, arrowConfigs);
    objects.arrowManager.updateOpacity(stepProgress);
  }

  // Fade ghosts out as we approach the solved state. They're a target hint;
  // once the rings actually reach the target, the ghosts become noise.
  if (objects.ghosts) {
    const lastIndex = animationSteps.length - 1;
    const fadeAmount = stepIndex >= lastIndex ? stepProgress : 0;
    for (const g of objects.ghosts) {
      g.material.opacity = 0.22 * (1 - fadeAmount);
      g.visible = g.material.opacity > 0.01;
    }
  }

  // Highlight rings during the active swap steps (σ₂ at 1, σ₁ at 3)
  const isSwapStep = stepIndex === 1 || stepIndex === 3;
  if (isSwapStep) {
    if (!highlightMat) {
      highlightMat = createHighlightMaterial(objects.ring1.material, 0xffcc44, 0.3);
    }
    applyHighlight(objects.ring1, highlightMat);
    applyHighlight(objects.ring2, highlightMat);
    applyHighlight(objects.ring3, highlightMat);
  } else {
    removeHighlight(objects.ring1);
    removeHighlight(objects.ring2);
    removeHighlight(objects.ring3);
  }

  const step = animationSteps[stepIndex];
  const prevStep = stepIndex > 0 ? animationSteps[stepIndex - 1] : animationSteps[0];

  for (const name of ['ring1', 'ring2', 'ring3']) {
    const ring = objects[name];
    if (!ring) continue;
    const f = prevStep.ringPos[name];
    const t = step.ringPos[name];

    // Arc motion only on swap steps (when rings actually need to lift over finials)
    const arcY = isSwapStep && (f[0] !== t[0])
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

  const CORD = 'var(--dia-cord, #1f57c4)';
  const GOLD = 'var(--dia-gold, #c79a22)';
  const NEG = 'var(--dia-neg, #cf3a26)';
  const WOOD = 'var(--dia-wood, #b07d52)';
  const INK = 'var(--dia-ink, #24211a)';
  const INKSOFT = 'var(--dia-inksoft, #6a6151)';

  svg.text(s, 250, 25, 'The Braid Cage — Braid Group Relations', {
    fontSize: 14, anchor: 'middle', fontWeight: 'bold',
  });

  // Three posts
  const postX = [130, 250, 370];
  const postTop = 60;
  const postBot = 220;
  const ringY = postBot - 40;
  const colors = [CORD, GOLD, NEG];
  const labels = ['Blue', 'Yellow', 'Red'];

  for (let i = 0; i < 3; i++) {
    svg.line(s, postX[i], postTop, postX[i], postBot, { stroke: WOOD, strokeWidth: 6 });
    svg.circle(s, postX[i], postTop - 5, 7, { fill: WOOD, stroke: WOOD, strokeWidth: 1.5 });
  }

  // Base
  svg.rect(s, 95, postBot, 310, 15, { fill: WOOD, stroke: WOOD, strokeWidth: 1.5, rx: 3 });

  // Rings (drawn after posts so they sit on top) — captured for the updater.
  // Logical ring index k tracks WHICH colored ring (k=0 Blue, 1 Yellow, 2 Red);
  // its on-screen post slot changes during the braid.
  const rings = [];
  const ringLabels = [];
  for (let i = 0; i < 3; i++) {
    const ring = svg.ellipse(s, postX[i], ringY, 18, 12, {
      stroke: colors[i], strokeWidth: 3, fill: 'none',
    });
    ring.style.transition = 'cx .15s linear, cy .15s linear';
    rings.push(ring);
    const lbl = svg.text(s, postX[i], postBot - 18, labels[i], {
      fontSize: 10, anchor: 'middle', fill: colors[i], fontWeight: 'bold',
    });
    ringLabels.push(lbl);
  }

  // Braid diagram below
  svg.text(s, 250, 260, 'Braid Swap Rule:', {
    fontSize: 12, anchor: 'middle', fontWeight: 'bold', fill: INK,
  });

  svg.text(s, 250, 280, 'Swap posts 2-3 (σ₂), then posts 1-2 (σ₁) — order keeps cords clean', {
    fontSize: 11, anchor: 'middle', fill: INKSOFT,
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

  // Motion arrows showing swap directions (toggled per step by the updater).
  // arrowSig2: swap posts 2-3 (σ₂). arrowSig1: swap posts 1-2 (σ₁).
  const arrowSig2 = svg.motionArrow(s, postX[1], postBot - 60, postX[2], postBot - 60, { label: 'σ₂ swap 2-3', curvature: 0.4, color: NEG });
  const arrowSig1 = svg.motionArrow(s, postX[0], postBot - 70, postX[1], postBot - 70, { label: 'σ₁ swap 1-2', curvature: 0.4, color: CORD });

  // Hand icon near the rings
  svg.handIcon(s, postX[1] + 30, postBot - 45, { scale: 0.6, rotation: -15 });

  // Step badges (highlighted per phase by the updater)
  const badge1 = svg.stepBadge(s, 35, 270, 1, 3, { radius: 11 });
  svg.actionLabel(s, 95, 270, 'σ₂ swap posts 2-3');
  const badge2 = svg.stepBadge(s, 35, 295, 2, 3, { radius: 11 });
  svg.actionLabel(s, 90, 295, 'Check the braid');
  const badge3 = svg.stepBadge(s, 35, 320, 3, 3, { radius: 11 });
  svg.actionLabel(s, 95, 320, 'σ₁ swap posts 1-2');
  const badges = [badge1, badge2, badge3];

  // Key insight
  const calloutRect = svg.rect(s, 30, 370, 440, 25, { fill: 'var(--dia-wash, #ece3d0)', stroke: 'var(--dia-ring, #b97d12)', strokeWidth: 1, rx: 4 });
  calloutRect.classList.add('callout-box');
  svg.text(s, 250, 387, 'The order of swaps matters — only this sequence keeps the cords untangled!', {
    fontSize: 10, anchor: 'middle', fill: 'var(--dia-ring, #b97d12)',
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

  // ---- Timeline updater: sync the 2D rings + badges + arrows to the braid.
  // Each ring (Blue=0, Yellow=1, Red=2) follows post-slot keyframes mirroring
  // the 3D motion. Slots index into postX. Animation steps:
  //   0 initial: Blue·Yellow·Red  → slots [0,1,2]
  //   1 σ₂ swaps Yellow(slot1) ↔ Red(slot2)
  //   2 rest after σ₂            → slots [0,2,1]
  //   3 σ₁ swaps Blue(slot0) ↔ Red(now slot1)
  //   4 solved                   → slots [1,2,0]  (Red·Blue·Yellow on screen)
  const slotKeyframes = [
    [0, 1, 2], // step 0
    [0, 2, 1], // step 1 (σ₂)
    [0, 2, 1], // step 2 (rest)
    [1, 2, 0], // step 3 (σ₁)
    [1, 2, 0], // step 4 (solved)
  ];
  const liftY = ringY - 45; // arc apex while a ring is mid-swap

  return function update(state) {
    const last = slotKeyframes.length - 1;
    const i = Math.max(0, Math.min(state.stepIndex | 0, last));
    const p = Math.max(0, Math.min(state.stepProgress ?? 0, 1));
    const fromSlots = i === 0 ? slotKeyframes[0] : slotKeyframes[i - 1];
    const toSlots = slotKeyframes[i];

    for (let k = 0; k < 3; k++) {
      const fromX = postX[fromSlots[k]];
      const toX = postX[toSlots[k]];
      const cx = fromX + (toX - fromX) * p;
      // Arc up over the finial only while this ring is actually swapping.
      const moving = fromSlots[k] !== toSlots[k];
      const cy = moving ? ringY - (ringY - liftY) * Math.sin(p * Math.PI) : ringY;
      const ring = rings[k];
      if (ring) {
        ring.setAttribute('cx', cx);
        ring.setAttribute('cy', cy);
      }
      const lbl = ringLabels[k];
      if (lbl) lbl.setAttribute('x', cx);
    }

    // Badge phase: 0 = σ₂ (steps 0-1), 1 = check (step 2), 2 = σ₁ (steps 3-4)
    const phase = i <= 1 ? 0 : i === 2 ? 1 : 2;
    badges.forEach((b, idx) => svg.highlight(b, idx === phase, { dim: 0.3, color: CORD }));

    // Show only the arrow for the active swap.
    svg.highlight(arrowSig2, i === 1, { glow: false, dim: 0 });
    svg.highlight(arrowSig1, i === 3, { glow: false, dim: 0 });
  };
}

export function dispose() {}
