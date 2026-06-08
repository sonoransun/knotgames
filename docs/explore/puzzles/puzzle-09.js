import * as THREE from 'three';
import { createMaterials, createHighlightMaterial, applyHighlight, removeHighlight } from '../lib/materials.js';
import { createRing, createBall } from '../lib/components.js';
import { CordPath } from '../lib/cord.js';
import { enableShadowsOnGroup } from '../lib/scene.js';
import { StepArrowManager } from '../lib/arrow-helpers.js';
import * as svg from '../lib/svg.js';

export const metadata = {
  id: 11,
  name: 'Genus Trap',
  difficulty: 'Expert',
  principle: 'Genus-2 surface fundamental group',
  type: 'Disentanglement',
  description: 'A clear acrylic block with two non-intersecting tunnels. The cord path encodes the word aba\u207B\u00B9 in the fundamental group. Only algebraic cancellation frees the rings.',
  cameraPosition: [80, 60, 200],
};

const BLOCK_W = 120;
const BLOCK_H = 60;
const BLOCK_D = 80;
const TUNNEL_R = 7.5;

function createAcrylicBlock(mats) {
  const group = new THREE.Group();

  // Transparent block
  const blockGeo = new THREE.BoxGeometry(BLOCK_W, BLOCK_H, BLOCK_D);
  const block = new THREE.Mesh(blockGeo, mats.acrylic);
  block.position.y = BLOCK_H / 2;
  group.add(block);

  // Tunnel A (left-right, lower) - shown as dark cylinder
  const tunnelAGeo = new THREE.CylinderGeometry(TUNNEL_R, TUNNEL_R, BLOCK_W + 2, 16);
  const tunnelMat = new THREE.MeshStandardMaterial({
    color: 0x334455,
    transparent: true,
    opacity: 0.3,
  });
  const tunnelA = new THREE.Mesh(tunnelAGeo, tunnelMat);
  tunnelA.rotation.z = Math.PI / 2;
  tunnelA.position.set(0, 25, 0); // at height 25mm
  group.add(tunnelA);

  // Tunnel B (front-back, higher)
  const tunnelBGeo = new THREE.CylinderGeometry(TUNNEL_R, TUNNEL_R, BLOCK_D + 2, 16);
  const tunnelB = new THREE.Mesh(tunnelBGeo, tunnelMat.clone());
  tunnelB.material.color.set(0x553344);
  tunnelB.rotation.x = Math.PI / 2;
  tunnelB.position.set(0, 35, 0); // at height 35mm
  group.add(tunnelB);

  return group;
}

// Cord path: enter A left → exit A right → around → enter B front → exit B back → around → enter A right → exit A left
function initialCordPath() {
  const hw = BLOCK_W / 2;
  const hd = BLOCK_D / 2;
  return [
    [-hw - 30, 25, 0],          // ball stop (left)
    [-hw - 5, 25, 0],           // entering tunnel A
    [0, 25, 0],                 // through tunnel A
    [hw + 5, 25, 0],            // exiting tunnel A right
    [hw + 15, 30, -10],         // looping around outside
    [hw + 10, 35, -hd + 10],   // approaching front face
    [30, 35, -hd - 5],         // ring 1 here
    [0, 35, -hd - 5],          // entering tunnel B from front
    [0, 35, 0],                // through tunnel B
    [0, 35, hd + 5],           // exiting tunnel B back
    [-20, 32, hd + 15],        // looping around outside
    [-hw - 10, 30, hd - 10],   // ring 2 here
    [-hw - 15, 28, 5],         // approaching left face
    [-hw - 5, 25, 0],          // re-entering tunnel A from...
    [0, 25, 0],                // wait - actually enters from right
  ];
}

// Simplified initial path
function cordPathInitial() {
  const hw = BLOCK_W / 2 + 5;
  const hd = BLOCK_D / 2 + 5;
  return [
    [-hw - 25, 25, 0],        // left ball
    [-hw, 25, 0],              // tunnel A entrance (left)
    [hw, 25, 0],               // tunnel A exit (right)
    [hw + 15, 30, -15],        // outside loop
    [20, 35, -hd],             // toward front
    [0, 35, -hd],              // tunnel B entrance (front)
    [0, 35, hd],               // tunnel B exit (back)
    [-30, 32, hd + 10],        // outside loop
    [-hw - 10, 28, 10],        // toward left
    [-hw, 25, 0],              // tunnel A entrance (from right... re-enter)
    [hw, 25, 0],               // through A again
    [hw + 25, 25, 0],          // right ball
  ];
}

function cordPathSolved() {
  const hw = BLOCK_W / 2 + 5;
  return [
    [-hw - 25, 25, 0],
    [-hw, 25, 0],
    [0, 25, 0],
    [hw, 25, 0],
    [hw + 10, 25, 0],
    [hw + 15, 25, 0],
    [hw + 15, 25, 0],
    [hw + 10, 25, 0],
    [hw, 25, 0],
    [0, 25, 0],
    [-hw, 25, 0],
    [-hw - 25, 25, 0],
  ];
}

function cordPathMid() {
  const hw = BLOCK_W / 2 + 5;
  const hd = BLOCK_D / 2 + 5;
  return [
    [-hw - 25, 25, 0],
    [-hw, 25, 0],
    [hw, 25, 0],
    [hw + 15, 28, -10],
    [15, 32, -hd + 5],
    [0, 30, -hd + 10],
    [0, 28, hd - 15],
    [-25, 27, hd - 5],
    [-hw - 8, 26, 5],
    [-hw, 25, 0],
    [0, 25, 0],
    [-hw - 25, 25, 0],
  ];
}

// Stage 1: rings slid toward Tunnel A to free up slack
function cordPathSlackBuild() {
  const hw = BLOCK_W / 2 + 5;
  const hd = BLOCK_D / 2 + 5;
  return [
    [-hw - 25, 25, 0],
    [-hw, 25, 0],
    [hw, 25, 0],
    [hw + 12, 28, -8],         // slacker external curve
    [10, 33, -hd + 2],
    [0, 35, -hd],              // tunnel B entrance
    [0, 35, hd],               // tunnel B exit
    [-25, 33, hd + 2],
    [-hw - 8, 30, 4],          // less slack on this side
    [-hw, 25, 0],
    [hw, 25, 0],
    [hw + 25, 25, 0],
  ];
}

// Stage 2: bight pulled outward from front face of Tunnel B (before clearing)
function cordPathBightForming() {
  const hw = BLOCK_W / 2 + 5;
  const hd = BLOCK_D / 2 + 5;
  return [
    [-hw - 25, 25, 0],
    [-hw, 25, 0],
    [hw, 25, 0],
    [hw + 12, 28, -8],
    [10, 33, -hd - 5],         // pulled outward in front
    [0, 35, -hd - 15],         // bight extends in front
    [0, 35, hd],               // back end still in tunnel
    [-25, 33, hd + 2],
    [-hw - 8, 30, 4],
    [-hw, 25, 0],
    [hw, 25, 0],
    [hw + 25, 25, 0],
  ];
}

// Stage 3: bight has cleared the front of Tunnel B entirely
function cordPathBightCleared() {
  const hw = BLOCK_W / 2 + 5;
  const hd = BLOCK_D / 2 + 5;
  return [
    [-hw - 25, 25, 0],
    [-hw, 25, 0],
    [hw, 25, 0],
    [hw + 12, 28, -8],
    [10, 30, -hd - 12],
    [-15, 30, -hd - 18],       // bight floating in front of block
    [-30, 30, -hd - 5],
    [-hw - 12, 28, hd - 5],    // routing toward back
    [-hw - 8, 26, 5],
    [-hw, 25, 0],
    [hw, 25, 0],
    [hw + 25, 25, 0],
  ];
}

// Stage 4: bight routed around left side, ready to enter Tunnel A from left
function cordPathBightToTunnelA() {
  const hw = BLOCK_W / 2 + 5;
  return [
    [-hw - 25, 25, 0],
    [-hw, 25, 0],
    [hw, 25, 0],
    [hw + 12, 28, -8],
    [-30, 28, -20],
    [-hw - 18, 26, -5],        // wrapping around left
    [-hw - 18, 26, 5],
    [-hw - 12, 26, 0],
    [-hw, 25, 0],              // entering Tunnel A from left (cancellation move)
    [-hw, 25, 0],
    [hw, 25, 0],
    [hw + 25, 25, 0],
  ];
}

export function create3DScene() {
  const mats = createMaterials();
  const group = new THREE.Group();

  group.add(createAcrylicBlock(mats));

  // Rings
  const ring1 = createRing(40, 4, mats.brass);
  ring1.position.set(25, 35, -BLOCK_D / 2 - 8);
  ring1.rotation.y = Math.PI / 2;
  group.add(ring1);

  const ring2 = createRing(40, 4, mats.brass);
  ring2.position.set(-BLOCK_W / 2 - 12, 30, BLOCK_D / 2 + 5);
  group.add(ring2);

  // Ball stops
  const ball1 = createBall(15, mats.wood);
  ball1.position.set(-BLOCK_W / 2 - 30, 25, 0);
  group.add(ball1);

  const ball2 = createBall(15, mats.wood);
  ball2.position.set(BLOCK_W / 2 + 30, 25, 0);
  group.add(ball2);

  // Cord
  const cord = new CordPath(cordPathInitial(), {
    radius: 2.5,
    material: mats.cord,
  });
  cord.addTo(group);

  enableShadowsOnGroup(group);
  return group;
}

export function createAnimScene() {
  const mats = createMaterials();
  const group = new THREE.Group();

  group.add(createAcrylicBlock(mats));

  const ring1 = createRing(40, 4, mats.brass);
  ring1.position.set(25, 35, -BLOCK_D / 2 - 8);
  ring1.rotation.y = Math.PI / 2;
  group.add(ring1);

  const ring2 = createRing(40, 4, mats.brass);
  ring2.position.set(-BLOCK_W / 2 - 12, 30, BLOCK_D / 2 + 5);
  group.add(ring2);

  const ball1 = createBall(15, mats.wood);
  ball1.position.set(-BLOCK_W / 2 - 30, 25, 0);
  group.add(ball1);

  const ball2 = createBall(15, mats.wood);
  ball2.position.set(BLOCK_W / 2 + 30, 25, 0);
  group.add(ball2);

  const cord = new CordPath(cordPathInitial(), {
    radius: 2.5,
    material: mats.cord,
  });
  cord.addTo(group);

  enableShadowsOnGroup(group);
  const arrowManager = new StepArrowManager(group);

  return { group, objects: { ring1, ring2, cord, arrowManager } };
}

const arrowConfigs = {
  // Step 1: rings move toward Tunnel A to free up slack
  1: { arrows: [
    { from: [25, 35, -BLOCK_D / 2 - 8], to: [BLOCK_W / 2 + 10, 30, -8], opts: { color: 0xffcc44 } },
  ]},
  // Step 2: bight begins to emerge from front of Tunnel B
  2: { arrows: [
    { from: [0, 35, -BLOCK_D / 2], to: [0, 35, -BLOCK_D / 2 - 20], opts: { color: 0xff8844 } },
  ]},
  // Step 3: bight clears the tunnel entirely
  3: { arrows: [
    { from: [0, 35, -BLOCK_D / 2 - 15], to: [-30, 30, -BLOCK_D / 2 - 10], opts: { color: 0xff8844 } },
  ]},
  // Step 4: bight routes around left side
  4: { arrows: [
    { from: [-30, 28, -BLOCK_D / 2 - 5], to: [-BLOCK_W / 2 - 18, 26, 0], opts: { color: 0x44ccff } },
  ]},
  // Step 5: bight enters Tunnel A — algebraic cancellation
  5: { arrows: [
    { from: [-BLOCK_W / 2 - 15, 26, 0], to: [-BLOCK_W / 2, 25, 0], opts: { color: 0x44ff88 } },
  ]},
  // Step 6: rings slide off
  6: { arrows: [
    { from: [50, 10, -BLOCK_D / 2 - 8], to: [50, 10, -BLOCK_D / 2 - 30], opts: { color: 0x44ff88 } },
    { from: [-BLOCK_W / 2 - 12, 10, BLOCK_D / 2 + 5], to: [-BLOCK_W / 2 - 30, 10, BLOCK_D / 2 + 25], opts: { color: 0x44ff88 } },
  ]},
};

let highlightMat = null;

export const animationSteps = [
  {
    label: 'Cord encodes the word a·b·a⁻¹ — both rings trapped',
    duration: 3.0,
    cord: cordPathInitial(),
    ring1: { position: [25, 35, -BLOCK_D / 2 - 8] },
    ring2: { position: [-BLOCK_W / 2 - 12, 30, BLOCK_D / 2 + 5] },
  },
  {
    label: 'Step 1 — Slide both rings toward Tunnel A to free slack from the external sections',
    duration: 2.5,
    cord: cordPathSlackBuild(),
    ring1: { position: [BLOCK_W / 2 + 10, 30, -8] },
    ring2: { position: [-BLOCK_W / 2 - 12, 30, BLOCK_D / 2 + 5] },
  },
  {
    label: 'Step 2 — Pull a bight (loop) of cord backward out of Tunnel B from the front face',
    duration: 2.5,
    easing: 'easeIn',
    cord: cordPathBightForming(),
    ring1: { position: [BLOCK_W / 2 + 10, 30, -8] },
    ring2: { position: [-BLOCK_W / 2 - 12, 30, BLOCK_D / 2 + 5] },
  },
  {
    label: 'Step 3 — The bight clears Tunnel B entirely; b is removed from the word',
    duration: 2.5,
    easing: 'easeOut',
    cord: cordPathBightCleared(),
    ring1: { position: [BLOCK_W / 2 + 10, 30, -8] },
    ring2: { position: [-BLOCK_W / 2 - 12, 30, BLOCK_D / 2 + 5] },
  },
  {
    label: 'Step 4 — Route the bight horizontally around the left side of the block',
    duration: 2.5,
    cord: cordPathBightToTunnelA(),
    ring1: { position: [BLOCK_W / 2 + 10, 30, -8] },
    ring2: { position: [-BLOCK_W / 2 - 12, 30, BLOCK_D / 2 + 5] },
  },
  {
    label: 'Step 5 — Feed the bight into Tunnel A from the left: word becomes a·(a·a⁻¹)·a⁻¹ → identity',
    duration: 2.5,
    cord: cordPathMid(),
    ring1: { position: [BLOCK_W / 2 + 10, 30, -8] },
    ring2: { position: [-BLOCK_W / 2 - 12, 30, BLOCK_D / 2 + 5] },
  },
  {
    label: 'Step 6 — Cord runs straight through Tunnel A only; rings slide off freely',
    duration: 3.0,
    easing: 'easeOut',
    cord: cordPathSolved(),
    ring1: { position: [50, 10, -BLOCK_D / 2 - 30] },
    ring2: { position: [-BLOCK_W / 2 - 30, 10, BLOCK_D / 2 + 25] },
  },
];

export function updateAnimation(objects, state) {
  const { stepIndex, stepProgress } = state;

  // Direction arrows
  if (objects.arrowManager) {
    objects.arrowManager.showForStep(stepIndex, arrowConfigs);
    objects.arrowManager.updateOpacity(stepProgress);
  }

  // Highlight active cord during rerouting
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

  for (const name of ['ring1', 'ring2']) {
    if (step[name] && prevStep[name]) {
      const f = prevStep[name].position;
      const t = step[name].position;
      objects[name].position.set(
        f[0] + (t[0] - f[0]) * stepProgress,
        f[1] + (t[1] - f[1]) * stepProgress,
        f[2] + (t[2] - f[2]) * stepProgress,
      );
    }
  }
}

export function createSVGDiagram(container) {
  const s = svg.createSVG(container, 500, 380);

  // Tokenized diagram colors
  const INK = 'var(--dia-ink, #24211a)';
  const INKSOFT = 'var(--dia-inksoft, #6a6151)';
  const RIGID = 'var(--dia-rigid, #8a8275)';
  const FAINT = 'var(--dia-faint, #c9bda7)';
  const CORD = 'var(--dia-cord, #1f57c4)';
  const RING = 'var(--dia-ring, #b97d12)';
  const WOOD = 'var(--dia-wood, #b07d52)';
  const WASH = 'var(--dia-wash, #ece3d0)';

  svg.text(s, 250, 25, 'Genus Trap — Cutaway View', {
    fontSize: 14, anchor: 'middle', fontWeight: 'bold',
  });

  // Block outline (3/4 view)
  const bx = 130, by = 60, bw = 240, bh = 140;
  svg.rect(s, bx, by, bw, bh, {
    fill: WASH,
    stroke: RIGID,
    strokeWidth: 2,
    rx: 3,
  });
  svg.text(s, bx + bw / 2, by + bh + 15, 'Clear acrylic block', {
    fontSize: 10, anchor: 'middle', fill: INKSOFT,
  });

  // Tunnel A (horizontal line, lower)
  const taY = by + bh * 0.55;
  svg.line(s, bx - 10, taY, bx + bw + 10, taY, {
    stroke: RIGID, strokeWidth: 8, opacity: '0.3',
  });
  svg.line(s, bx, taY, bx + bw, taY, { stroke: RIGID, strokeWidth: 1, dashArray: '4,3' });
  svg.text(s, bx + bw + 15, taY + 4, 'Tunnel A', { fontSize: 9, fill: INK });
  svg.text(s, bx + bw + 15, taY + 14, '(h=25mm)', { fontSize: 8, fill: RIGID });

  // Tunnel B (vertical line, higher - perpendicular, shown as circle in cutaway)
  const tbY = by + bh * 0.35;
  const tbX = bx + bw / 2;
  svg.circle(s, tbX, tbY, 10, { fill: WASH, stroke: INKSOFT, strokeWidth: 1 });
  svg.text(s, tbX + 18, tbY + 4, 'Tunnel B', { fontSize: 9, fill: INK });
  svg.text(s, tbX + 18, tbY + 14, '(h=35mm, perpendicular)', { fontSize: 8, fill: RIGID });

  // Cord path representation (animated segments)
  const cordA = svg.animatedPath(s, `M ${bx - 30} ${taY} L ${bx} ${taY}`, {
    stroke: CORD, strokeWidth: 2.5, fill: 'none',
    animDuration: 0.6, animDelay: 0,
  });
  svg.text(s, bx - 35, taY - 8, 'a', { fontSize: 14, fill: CORD, fontWeight: 'bold' });

  const cordToB = svg.animatedPath(s, `M ${bx + bw} ${taY} Q ${bx + bw + 25} ${taY - 20} ${tbX + 30} ${tbY}`, {
    stroke: CORD, strokeWidth: 2, fill: 'none', dashArray: '4,3',
    animDuration: 0.8, animDelay: 0.6,
  });

  // Through tunnel B
  const cordBhole = svg.circle(s, tbX, tbY, 4, { fill: CORD, stroke: 'none' });
  svg.text(s, tbX - 20, tbY - 15, 'b', { fontSize: 14, fill: CORD, fontWeight: 'bold' });

  const cordBack = svg.animatedPath(s, `M ${tbX - 30} ${tbY} Q ${bx - 20} ${tbY + 20} ${bx} ${taY}`, {
    stroke: CORD, strokeWidth: 2, fill: 'none', dashArray: '4,3',
    animDuration: 0.8, animDelay: 1.4,
  });

  svg.text(s, bx + bw + 30, taY - 8, 'a\u207B\u00B9', { fontSize: 14, fill: CORD, fontWeight: 'bold' });

  // Ball stops
  svg.circle(s, bx - 30, taY, 8, { fill: WOOD, stroke: INK, strokeWidth: 1 });
  svg.circle(s, bx + bw + 45, taY, 8, { fill: WOOD, stroke: INK, strokeWidth: 1 });

  // Rings (animatable \u2014 ring1 near Tunnel A exit, ring2 near the back loop)
  const ring1 = svg.ellipse(s, bx + bw + 15, taY - 25, 10, 8, { stroke: RING, strokeWidth: 2.5, fill: 'none' });
  const ring2 = svg.ellipse(s, bx - 15, tbY + 20, 10, 8, { stroke: RING, strokeWidth: 2.5, fill: 'none' });
  ring1.style.transition = 'cx .15s linear, cy .15s linear';
  ring2.style.transition = 'cx .15s linear, cy .15s linear';

  // Motion arrows showing solution (toggled per step by the updater)
  const arrowPull = svg.motionArrow(s, bx + bw + 10, taY, bx + bw - 20, tbY, { label: 'Pull cord loop back', curvature: 0.4 });
  const arrowSlide = svg.motionArrow(s, bx - 15, tbY + 28, bx - 30, tbY + 50, { label: 'Ring slides off', curvature: 0.3 });

  // Hand icon near tunnel entrance
  svg.handIcon(s, bx + bw + 25, taY - 15, { scale: 0.6, rotation: -30 });

  // Step badges (highlighted per phase by the updater)
  const badge1 = svg.stepBadge(s, 30, 250, 1, 2, { radius: 11 });
  svg.actionLabel(s, 90, 250, 'Pull cord back through tunnel');
  const badge2 = svg.stepBadge(s, 30, 280, 2, 2, { radius: 11 });
  svg.actionLabel(s, 90, 280, 'Slide both rings off');
  const badges = [badge1, badge2];

  // Word annotation
  svg.rect(s, 50, 250, 400, 50, { fill: WASH, stroke: FAINT, strokeWidth: 1, rx: 4 });
  svg.text(s, 250, 270, 'The cord goes through tunnel A, around to tunnel B, then back through A', {
    fontSize: 11, anchor: 'middle', fontWeight: 'bold', fill: INK,
  });
  svg.text(s, 250, 288, 'Pull a loop back through the front tunnel to straighten the path', {
    fontSize: 10, anchor: 'middle', fill: INKSOFT,
  });

  // Key insight
  const calloutRect = svg.rect(s, 50, 315, 400, 30, { fill: WASH, stroke: RING, strokeWidth: 1, rx: 4 });
  svg.text(s, 250, 335, 'Two crossing tunnels make the cord look trapped, but it can be rerouted!', {
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
  calloutRect.classList.add('callout-box');

  // ---- Timeline updater: sync the 2D rings + badges + arrows to the solution.
  // The 3D timeline has 7 entries (index 0..6): initial, Steps 1-5 (cord
  // rerouting / algebraic cancellation), then Step 6 (rings slide off).
  // 2D keyframes: one [cx, cy] per timeline index, per ring.
  const r1Home = [bx + bw + 15, taY - 25];
  const r2Home = [bx - 15, tbY + 20];
  // ring1 hugs the Tunnel A exit through the rerouting, then slides off right.
  const r1Slack = [bx + bw + 10, taY - 18];
  const ring1Frames = [
    r1Home,                       // 0 initial
    r1Slack,                      // 1 slide toward Tunnel A
    r1Slack,                      // 2 bight forming
    r1Slack,                      // 3 bight cleared
    r1Slack,                      // 4 routing around left
    r1Slack,                      // 5 cancellation
    [bx + bw + 55, taY - 6],      // 6 slides off to the right
  ];
  // ring2 holds at the back loop, then slides off down-left.
  const ring2Frames = [
    r2Home, r2Home, r2Home, r2Home, r2Home, r2Home,
    [bx - 42, tbY + 48],          // 6 slides off
  ];

  const lerp = (a, b, t) => a + (b - a) * t;
  const lastIdx = ring1Frames.length - 1;

  return function update(state) {
    if (!state) return;
    const i = Math.max(0, Math.min(state.stepIndex | 0, lastIdx));
    const p = Math.max(0, Math.min(state.stepProgress ?? 0, 1));
    const prev = i === 0 ? 0 : i - 1;

    // Move rings along their 2D keyframe tracks.
    const f1 = ring1Frames[prev];
    const t1 = ring1Frames[i];
    if (ring1) {
      ring1.setAttribute('cx', lerp(f1[0], t1[0], p));
      ring1.setAttribute('cy', lerp(f1[1], t1[1], p));
    }
    const f2 = ring2Frames[prev];
    const t2 = ring2Frames[i];
    if (ring2) {
      ring2.setAttribute('cx', lerp(f2[0], t2[0], p));
      ring2.setAttribute('cy', lerp(f2[1], t2[1], p));
    }

    // Phase: rerouting (Steps 1-5) → badge 1; ring removal (Step 6) → badge 2.
    const phase = i >= 6 ? 1 : 0;
    badges.forEach((b, k) => svg.highlight(b, k === phase, { dim: 0.3, color: CORD }));

    // Arrows: "pull cord loop back" during rerouting; "ring slides off" at the end.
    svg.highlight(arrowPull, i >= 1 && i <= 5, { glow: false, dim: 0 });
    svg.highlight(arrowSlide, i >= 6, { glow: false, dim: 0 });

    // Subtle emphasis on the b-segment cord while the loop is being pulled back.
    const reroute = i >= 1 && i <= 5;
    svg.highlight(cordToB, reroute, { dim: 0.45, color: CORD });
    svg.highlight(cordBack, reroute, { dim: 0.45, color: CORD });
    if (cordBhole) cordBhole.style.opacity = reroute ? '1' : '0.6';
    if (cordA) cordA.style.opacity = '1';
  };
}

export function dispose() {}
