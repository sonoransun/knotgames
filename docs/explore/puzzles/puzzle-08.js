import * as THREE from 'three';
import { createMaterials, createHighlightMaterial, applyHighlight, removeHighlight } from '../lib/materials.js';
import { createStraightRod } from '../lib/components.js';
import { CordPath } from '../lib/cord.js';
import { enableShadowsOnGroup } from '../lib/scene.js';
import { StepArrowManager } from '../lib/arrow-helpers.js';
import * as svg from '../lib/svg.js';

export const metadata = {
  id: 10,
  name: 'Ouroboros Chain',
  difficulty: 'Advanced',
  principle: 'Gray code / binary recursion (Chinese Rings)',
  type: 'Sequential disentanglement',
  description: 'Six interlocked cord loops on a shuttle bar. Removal requires exactly 42 moves in a precise Gray code sequence. No shortcuts exist.',
  cameraPosition: [0, 100, 250],
};

const NUM_LOOPS = 6;
const POST_SPACING = 30;
const POST_HEIGHT = 80;
const POST_R = 5;
const BASE_W = 220;
const BASE_H = 20;
const BASE_D = 50;

function createBase(mats) {
  const group = new THREE.Group();

  // Wooden base
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(BASE_W, BASE_H, BASE_D),
    mats.wood
  );
  base.position.y = -BASE_H / 2;
  group.add(base);

  // Posts
  for (let i = 0; i < NUM_LOOPS; i++) {
    const x = (i - (NUM_LOOPS - 1) / 2) * POST_SPACING;
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(POST_R, POST_R, POST_HEIGHT, 12),
      mats.darkWood
    );
    post.position.set(x, POST_HEIGHT / 2, 0);
    group.add(post);
  }

  // Shuttle bar
  const barLen = BASE_W - 20;
  const bar = createStraightRod([-barLen / 2, 15, BASE_D / 2 - 5], [barLen / 2, 15, BASE_D / 2 - 5], 1.5, mats.steel);
  group.add(bar);

  return group;
}

// Create loop paths for each of the 6 loops (all ON shuttle bar)
function createLoopPaths(loopStates) {
  const paths = [];
  const barZ = BASE_D / 2 - 5;
  const barY = 15;

  for (let i = 0; i < NUM_LOOPS; i++) {
    const x = (i - (NUM_LOOPS - 1) / 2) * POST_SPACING;
    const onBar = loopStates ? loopStates[i] : true;

    if (onBar) {
      paths.push([
        [x, POST_HEIGHT * 0.7, 0],
        [x - 8, POST_HEIGHT * 0.4, barZ * 0.5],
        [x - 5, barY + 5, barZ - 3],
        [x, barY, barZ],               // on shuttle bar
        [x + 5, barY + 5, barZ - 3],
        [x + 8, POST_HEIGHT * 0.4, barZ * 0.5],
        [x, POST_HEIGHT * 0.7, 0],
      ]);
    } else {
      // Off bar: loop hangs from post, not touching bar
      paths.push([
        [x, POST_HEIGHT * 0.7, 0],
        [x - 10, POST_HEIGHT * 0.5, 8],
        [x - 8, POST_HEIGHT * 0.2, 15],
        [x, barY - 10, 18],
        [x + 8, POST_HEIGHT * 0.2, 15],
        [x + 10, POST_HEIGHT * 0.5, 8],
        [x, POST_HEIGHT * 0.7, 0],
      ]);
    }
  }
  return paths;
}

export function create3DScene() {
  const mats = createMaterials();
  const group = new THREE.Group();

  group.add(createBase(mats));

  // All loops ON
  const loopPaths = createLoopPaths(null);
  const cordColors = [mats.cord, mats.cordRed, mats.cord, mats.cordRed, mats.cord, mats.cordRed];

  for (let i = 0; i < NUM_LOOPS; i++) {
    const cord = new CordPath(loopPaths[i], {
      radius: 2,
      material: cordColors[i],
      closed: true,
    });
    cord.addTo(group);
  }

  enableShadowsOnGroup(group);
  return group;
}

export function createAnimScene() {
  const mats = createMaterials();
  const group = new THREE.Group();

  group.add(createBase(mats));

  const loopPaths = createLoopPaths(null);
  const cordColors = [mats.cord, mats.cordRed, mats.cord, mats.cordRed, mats.cord, mats.cordRed];
  const cords = [];

  for (let i = 0; i < NUM_LOOPS; i++) {
    const cord = new CordPath(loopPaths[i], {
      radius: 2,
      material: cordColors[i],
      closed: true,
    });
    cord.addTo(group);
    cords.push(cord);
  }

  enableShadowsOnGroup(group);
  const arrowManager = new StepArrowManager(group);

  return { group, objects: { cords, arrowManager } };
}

// Generate first 8 moves of the Gray code sequence for animation
function generateFirstMoves() {
  // Simplified: show the pattern with the first few moves
  const states = [
    [true, true, true, true, true, true],     // initial
    [true, true, true, true, true, false],     // remove loop 6
    [true, true, true, true, false, false],    // remove loop 5
    [true, true, true, true, false, true],     // replace loop 6
    [true, true, true, false, false, true],    // remove loop 4
    [true, true, true, false, false, false],   // remove loop 6
    [true, true, false, false, false, false],  // remove loop 3
    [true, true, false, false, false, true],   // replace loop 6
    [false, false, false, false, false, false], // final: all off
  ];
  return states;
}

const states = generateFirstMoves();

// Post x positions for arrow targets (loop index 0..5)
const _postX = (i) => (i - (NUM_LOOPS - 1) / 2) * POST_SPACING;

const arrowConfigs = {
  1: { arrows: [
    { from: [_postX(5), 15, BASE_D / 2 - 5], to: [_postX(5), -10, 18], opts: { color: 0x44cc44 } },
  ]},
  2: { arrows: [
    { from: [_postX(4), 15, BASE_D / 2 - 5], to: [_postX(4), -10, 18], opts: { color: 0x44cc44 } },
  ]},
  3: { arrows: [
    { from: [_postX(5), -10, 18], to: [_postX(5), 15, BASE_D / 2 - 5], opts: { color: 0xcc4444 } },
  ]},
  4: { arrows: [
    { from: [_postX(3), 15, BASE_D / 2 - 5], to: [_postX(3), -10, 18], opts: { color: 0x44cc44 } },
  ]},
  5: { arrows: [
    { from: [_postX(5), 15, BASE_D / 2 - 5], to: [_postX(5), -10, 18], opts: { color: 0x44cc44 } },
  ]},
  6: { arrows: [
    { from: [_postX(2), 15, BASE_D / 2 - 5], to: [_postX(2), -10, 18], opts: { color: 0x44cc44 } },
  ]},
  7: { arrows: [
    { from: [_postX(5), -10, 18], to: [_postX(5), 15, BASE_D / 2 - 5], opts: { color: 0xcc4444 } },
  ]},
};

let highlightMat = null;

export const animationSteps = states.map((state, i) => {
  const labels = [
    'Look: six loops sit on the shuttle bar, each linked to its neighbor',
    'Slide the rightmost loop (#6) off the bar',
    'Slide loop #5 off the bar',
    'Put loop #6 back on the bar — you must go backward!',
    'Slide loop #4 off the bar',
    'Slide loop #6 off the bar again',
    'Slide loop #3 off the bar',
    'Put loop #6 back on — the pattern keeps repeating',
    'After 42 moves in this sequence, every loop is off. Bar is free!',
  ];
  // Sliding a loop off/onto the bar settles into place — ease out the motion.
  // The opening "Look" step and the final "all off" landing also settle.
  const easing = i === 0 ? undefined : 'easeOut';
  return {
    label: labels[i] || `State ${i}`,
    duration: i === 0 ? 2.0 : (i === states.length - 1 ? 3.0 : 1.8),
    easing,
    loopStates: state,
  };
});

// Map step index to which cord index is active
const _activeLoop = { 1: 5, 2: 4, 3: 5, 4: 3, 5: 5, 6: 2, 7: 5 };

export function updateAnimation(objects, state) {
  const { stepIndex, stepProgress } = state;

  // Direction arrows
  if (objects.arrowManager) {
    objects.arrowManager.showForStep(stepIndex, arrowConfigs);
    objects.arrowManager.updateOpacity(stepProgress);
  }

  // Highlight the active loop cord
  const activeIdx = _activeLoop[stepIndex];
  if (activeIdx !== undefined && objects.cords[activeIdx]) {
    if (!highlightMat) {
      highlightMat = createHighlightMaterial(objects.cords[activeIdx].mesh.material, 0x4488ff, 0.3);
    }
    for (let i = 0; i < NUM_LOOPS; i++) {
      if (i === activeIdx) {
        applyHighlight(objects.cords[i].mesh, highlightMat);
      } else {
        removeHighlight(objects.cords[i].mesh);
      }
    }
  } else {
    for (let i = 0; i < NUM_LOOPS; i++) {
      removeHighlight(objects.cords[i].mesh);
    }
  }

  const step = animationSteps[stepIndex];
  const prevStep = stepIndex > 0 ? animationSteps[stepIndex - 1] : animationSteps[0];

  const fromPaths = createLoopPaths(prevStep.loopStates);
  const toPaths = createLoopPaths(step.loopStates);

  for (let i = 0; i < NUM_LOOPS; i++) {
    const interpolated = CordPath.interpolatePoints(fromPaths[i], toPaths[i], stepProgress);
    objects.cords[i].update(interpolated);
  }
}

export function createSVGDiagram(container) {
  const s = svg.createSVG(container, 500, 390);

  svg.text(s, 250, 25, 'Ouroboros Chain — Top View', {
    fontSize: 14, anchor: 'middle', fontWeight: 'bold',
  });

  const CORD = 'var(--dia-cord, #1f57c4)';
  const NEG = 'var(--dia-neg, #cf3a26)';

  // Base (top-down view)
  svg.rect(s, 70, 80, 360, 80, { fill: 'var(--dia-wood, #b07d52)', stroke: 'var(--dia-wood, #b07d52)', strokeWidth: 2, rx: 4 });

  // Posts (circles from top)
  const postY = 120;
  const postX = (i) => 110 + i * 56;
  for (let i = 0; i < 6; i++) {
    const x = postX(i);
    svg.circle(s, x, postY, 8, { fill: 'var(--dia-wood, #b07d52)', stroke: 'var(--dia-ink, #24211a)', strokeWidth: 1.5 });
    svg.text(s, x, postY + 3, String(i + 1), { fontSize: 9, anchor: 'middle', fill: 'var(--dia-surface, #fbf7ee)', fontWeight: 'bold' });
  }

  // Shuttle bar
  svg.line(s, 85, 145, 415, 145, { stroke: 'var(--dia-rigid, #8a8275)', strokeWidth: 3 });
  svg.text(s, 250, 142, 'shuttle bar', { fontSize: 9, anchor: 'middle', fill: 'var(--dia-inksoft, #6a6151)' });

  // Loops (arcs from post to bar) — captured so the updater can move them
  const loopColors = [CORD, NEG, CORD, NEG, CORD, NEG];
  const loops = [];
  for (let i = 0; i < 6; i++) {
    const x = postX(i);
    const loop = svg.path(s, `M ${x - 6} ${postY + 8} Q ${x - 15} ${postY + 25} ${x} ${postY + 30} Q ${x + 15} ${postY + 25} ${x + 6} ${postY + 8}`, {
      stroke: loopColors[i], strokeWidth: 2, fill: 'none',
    });
    loop.style.transition = 'transform .12s linear, opacity .2s ease';
    loops.push(loop);
  }

  // Chain dependency arrows
  svg.text(s, 250, 195, 'Each loop threads through its left neighbor:', {
    fontSize: 11, anchor: 'middle', fill: 'var(--dia-ink, #24211a)',
  });

  for (let i = 1; i < 6; i++) {
    const x1 = postX(i);
    const x0 = postX(i - 1);
    svg.path(s, `M ${x1} 210 L ${x0 + 10} 210`, {
      stroke: 'var(--dia-rigid, #8a8275)', strokeWidth: 1,
    });
    svg.text(s, (x0 + x1) / 2, 208, '\u2192', { fontSize: 14, anchor: 'middle', fill: 'var(--dia-rigid, #8a8275)' });
  }

  // State table
  svg.rect(s, 50, 235, 400, 90, { fill: 'var(--dia-wash, #ece3d0)', stroke: 'var(--dia-faint, #c9bda7)', strokeWidth: 1, rx: 4 });
  svg.text(s, 250, 255, 'Gray Code Sequence (first 4 of 42 moves):', {
    fontSize: 11, anchor: 'middle', fontWeight: 'bold',
  });

  const rows = [
    ['Start:', '1 1 1 1 1 1'],
    ['Move 1:', '1 1 1 1 1 0  (remove #6)'],
    ['Move 2:', '1 1 1 1 0 0  (remove #5)'],
    ['Move 3:', '1 1 1 1 0 1  (replace #6!)'],
  ];
  rows.forEach((row, i) => {
    svg.text(s, 120, 275 + i * 14, row[0], { fontSize: 9, fill: 'var(--dia-inksoft, #6a6151)' });
    svg.text(s, 180, 275 + i * 14, row[1], { fontSize: 9, fill: 'var(--dia-ink, #24211a)', fontFamily: 'monospace' });
  });

  // Motion arrows showing removal/replacement direction (toggled per step)
  const arrowRemove6 = svg.motionArrow(s, 390, 120, 390, 155, { label: 'Remove #6', curvature: 0.3 });
  const arrowRemove5 = svg.motionArrow(s, 334, 120, 334, 155, { label: 'Then #5', curvature: 0.3 });
  const arrowReplace6 = svg.motionArrow(s, 390, 155, 390, 120, { label: 'Replace #6', curvature: 0.3 });

  // Hand icon near rightmost loop
  svg.handIcon(s, 405, 110, { scale: 0.6, rotation: 0 });

  // Step badges (highlighted per phase by the updater)
  const badge1 = svg.stepBadge(s, 435, 85, 1, 3, { radius: 11 });
  svg.actionLabel(s, 455, 85, 'Remove #6');
  const badge2 = svg.stepBadge(s, 435, 108, 2, 3, { radius: 11 });
  svg.actionLabel(s, 455, 108, 'Remove #5');
  const badge3 = svg.stepBadge(s, 435, 131, 3, 3, { radius: 11 });
  svg.actionLabel(s, 455, 131, 'Replace #6!');
  const badges = [badge1, badge2, badge3];

  // Key insight
  const calloutRect = svg.rect(s, 50, 340, 400, 30, { fill: 'var(--dia-wash, #ece3d0)', stroke: 'var(--dia-ring, #b97d12)', strokeWidth: 1, rx: 4 });
  svg.text(s, 250, 360, 'You must remove and replace loops in a strict order — no shortcuts!', {
    fontSize: 10, anchor: 'middle', fill: 'var(--dia-ring, #b97d12)',
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

  // ---- Timeline updater: sync the 2D loops + badges + arrows to the Gray-code solution.
  // states[i] is the on/off pattern after step i (index 0 = all on). A loop that is
  // "off" is slid downward off the bar; "on" sits at rest. We mirror the 3D motion by
  // sliding the active loop's arc down (remove) or back up (replace).
  const OFF_DY = 22; // px the loop slides down when removed from the bar
  return function update(state) {
    const i = Math.max(0, Math.min(state.stepIndex | 0, states.length - 1));
    const p = state.stepProgress ?? 0;
    const prev = states[Math.max(0, i - 1)];
    const cur = states[i];

    // Move each loop between its previous and current off/on offset.
    for (let k = 0; k < loops.length && k < cur.length; k++) {
      if (!loops[k]) continue;
      const fromOff = prev[k] ? 0 : OFF_DY;
      const toOff = cur[k] ? 0 : OFF_DY;
      const dy = fromOff + (toOff - fromOff) * p;
      loops[k].setAttribute('transform', dy ? `translate(0 ${dy})` : '');
      // Fade a loop slightly once it is off the bar.
      loops[k].style.opacity = String(1 - 0.45 * (dy / OFF_DY));
    }

    // Highlight the badge for the current phase (steps 1-3 map to badges 1-3).
    const phase = i <= 1 ? 0 : i === 2 ? 1 : 2;
    badges.forEach((b, k) => svg.highlight(b, k === phase, { dim: 0.3, color: CORD }));

    // Show only the arrow relevant to the current step.
    // Step 1 removes #6, step 2 removes #5, step 3 replaces #6.
    svg.highlight(arrowRemove6, i === 1 || i === 5, { glow: false, dim: 0 });
    svg.highlight(arrowRemove5, i === 2, { glow: false, dim: 0 });
    svg.highlight(arrowReplace6, i === 3 || i === 7, { glow: false, dim: 0 });
  };
}

export function dispose() {}
