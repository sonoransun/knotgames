import * as THREE from 'three';
import { createMaterials } from '../lib/materials.js';
import { createStraightRod } from '../lib/components.js';
import { CordPath } from '../lib/cord.js';
import { enableShadowsOnGroup } from '../lib/scene.js';
import { StepArrowManager } from '../lib/arrow-helpers.js';
import { resolveStep, HighlightCache } from '../lib/puzzle-helpers.js';
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

// ---------------------------------------------------------------------------
// The complete 42-move Gray-code (Baguenaudier) state sequence.
//
// Loop numbering matches the md and the 3D layout: loop 1 is the leftmost
// (anchor) post, loop 6 the rightmost; array index i holds loop i+1.
// The legal moves (md, "The Topology"):
//   Rule 1 — loop 6 (the end loop) may always slide on/off the bar.
//   Rule 2 — loop k may slide on/off only when loop k+1 is ON the bar and
//            every loop right of k+1 is OFF (i.e. k+1 is the rightmost ON
//            loop).
// Reading the on/off pattern as a Gray-code word (loop 1 = most significant
// bit) and converting Gray -> binary ranks every state 0..63. Each legal move
// changes the rank by exactly ±1; all-off ranks 0 and all-on ranks
// (2^7 - 2) / 3 = 42. Walking the rank down one legal move at a time is
// therefore the unique minimal solution: 42 moves, 43 states, no teleports.
// (The md's illustrative tables start with "remove loop 6", but that move
// violates the md's own Rule 2 at its next step; the legal minimal sequence
// starts with loop 5 — the well-known even-ring-count opening.)

function grayRank(state) {
  let bit = 0;
  let rank = 0;
  for (const on of state) {
    bit ^= on ? 1 : 0; // Gray -> binary: b_i = g_1 xor ... xor g_i
    rank = rank * 2 + bit;
  }
  return rank;
}

function legalToggles(state) {
  const moves = [state.length - 1];  // Rule 1: the end loop, always
  const j = state.lastIndexOf(true); // rightmost ON loop
  if (j >= 1) moves.push(j - 1);     // Rule 2: its immediate left neighbor
  return moves;
}

export function generateGrayStates(n = NUM_LOOPS) {
  let cur = new Array(n).fill(true);
  const sequence = [cur];
  while (grayRank(cur) > 0) {
    const want = grayRank(cur) - 1;
    const next = legalToggles(cur)
      .map((k) => {
        const s = cur.slice();
        s[k] = !s[k];
        return s;
      })
      .find((s) => grayRank(s) === want);
    if (!next) throw new Error('Baguenaudier walk stuck — no legal descending move');
    sequence.push(next);
    cur = next;
  }
  return sequence;
}

const states = generateGrayStates();
const MOVES = states.length - 1; // 42

// moves[i] is the one-loop diff going INTO states[i]: which loop toggled and
// whether it slid off the bar. moves[0] is null (the intro step).
const moves = states.map((state, i) => {
  if (i === 0) return null;
  const loop = state.findIndex((on, k) => on !== states[i - 1][k]);
  return { loop, off: !state[loop] };
});

// Pedagogical waypoints, derived (not hardcoded) from the sequence.
const firstReplace = moves.findIndex((m) => m && !m.off);
const anchorOff = moves.findIndex((m) => m && m.loop === 0 && m.off);

export const animationSteps = states.map((state, i) => {
  if (i === 0) {
    return {
      label: 'Look: six loops sit on the shuttle bar, each linked to its neighbor',
      duration: 2.0,
      loopStates: state,
    };
  }
  const move = moves[i];
  let label = `Move ${i}: slide loop #${move.loop + 1} ${move.off ? 'off the bar' : 'back onto the bar'}`;
  if (i === firstReplace) label += ' — you must go backward!';
  else if (i === anchorOff) label += ` — the anchor is free, yet ${MOVES - i} moves remain`;
  else if (i === MOVES) label += ' — every loop is off. Bar is free!';
  return {
    label,
    // Mid-sequence moves are brisk; the final slide gets room to land.
    duration: i === MOVES ? 3.0 : 0.9,
    // Sliding a loop off/onto the bar settles into place — ease out the motion.
    easing: 'easeOut',
    loopStates: state,
    move,
  };
});

// Post x positions for arrow targets (loop index 0..5)
const _postX = (i) => (i - (NUM_LOOPS - 1) / 2) * POST_SPACING;

// One direction arrow per move, generated from the same state diffs:
// green bar->free for a removal, red free->bar for a replacement.
const arrowConfigs = {};
moves.forEach((move, i) => {
  if (!move) return;
  const x = _postX(move.loop);
  const barPoint = [x, 15, BASE_D / 2 - 5];
  const freePoint = [x, -10, 18];
  arrowConfigs[i] = {
    arrows: [
      move.off
        ? { from: barPoint, to: freePoint, opts: { color: 0x44cc44 } }
        : { from: freePoint, to: barPoint, opts: { color: 0xcc4444 } },
    ],
  };
});

const highlights = new HighlightCache();

export function updateAnimation(objects, state) {
  const { step, prevStep, t } = resolveStep(animationSteps, state, {
    arrowManager: objects.arrowManager,
    arrowConfigs,
  });

  // Spotlight the one cord that moves this step (none during the intro).
  const activeIdx = step.move ? step.move.loop : -1;
  highlights.applyOnly(objects.cords.map((c) => c.mesh), activeIdx, 0x4488ff, 0.3);

  const fromPaths = createLoopPaths(prevStep.loopStates);
  const toPaths = createLoopPaths(step.loopStates);

  for (let i = 0; i < NUM_LOOPS; i++) {
    const interpolated = CordPath.interpolatePoints(fromPaths[i], toPaths[i], t);
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
  const POS = 'var(--dia-pos, #2f8f43)';
  const INK = 'var(--dia-ink, #24211a)';

  // Base (top-down view)
  svg.rect(s, 70, 80, 360, 80, { fill: 'var(--dia-wood, #b07d52)', stroke: 'var(--dia-wood, #b07d52)', strokeWidth: 2, rx: 4 });

  // Posts (circles from top)
  const postY = 120;
  const postX = (i) => 110 + i * 56;
  for (let i = 0; i < NUM_LOOPS; i++) {
    const x = postX(i);
    svg.circle(s, x, postY, 8, { fill: 'var(--dia-wood, #b07d52)', stroke: INK, strokeWidth: 1.5 });
    svg.text(s, x, postY + 3, String(i + 1), { fontSize: 9, anchor: 'middle', fill: 'var(--dia-surface, #fbf7ee)', fontWeight: 'bold' });
  }

  // Shuttle bar
  svg.line(s, 85, 145, 415, 145, { stroke: 'var(--dia-rigid, #8a8275)', strokeWidth: 3 });
  svg.text(s, 250, 142, 'shuttle bar', { fontSize: 9, anchor: 'middle', fill: 'var(--dia-inksoft, #6a6151)' });

  // Loops (arcs from post to bar) — captured so the updater can move them
  const loopColors = [CORD, NEG, CORD, NEG, CORD, NEG];
  const loops = [];
  for (let i = 0; i < NUM_LOOPS; i++) {
    const x = postX(i);
    const loop = svg.path(s, `M ${x - 6} ${postY + 8} Q ${x - 15} ${postY + 25} ${x} ${postY + 30} Q ${x + 15} ${postY + 25} ${x + 6} ${postY + 8}`, {
      stroke: loopColors[i], strokeWidth: 2, fill: 'none',
    });
    loop.style.transition = 'transform .12s linear, opacity .2s ease';
    loops.push(loop);
  }

  // Per-loop motion arrows, both directions, pre-built once; the updater
  // reveals only the arrow matching the current step's state diff (green
  // down = slide off, red up = back on — same semantics as the 3D arrows).
  const arrowsOff = [];
  const arrowsOn = [];
  for (let i = 0; i < NUM_LOOPS; i++) {
    const x = postX(i);
    const off = svg.motionArrow(s, x, 118, x, 158, { curvature: 0.3, color: POS });
    const on = svg.motionArrow(s, x, 158, x, 118, { curvature: 0.3, color: NEG });
    svg.highlight(off, false, { glow: false, dim: 0 });
    svg.highlight(on, false, { glow: false, dim: 0 });
    arrowsOff.push(off);
    arrowsOn.push(on);
  }

  // Chain dependency arrows
  svg.text(s, 250, 195, 'Each loop threads through its left neighbor:', {
    fontSize: 11, anchor: 'middle', fill: INK,
  });

  for (let i = 1; i < NUM_LOOPS; i++) {
    const x1 = postX(i);
    const x0 = postX(i - 1);
    svg.path(s, `M ${x1} 210 L ${x0 + 10} 210`, {
      stroke: 'var(--dia-rigid, #8a8275)', strokeWidth: 1,
    });
    svg.text(s, (x0 + x1) / 2, 208, '→', { fontSize: 14, anchor: 'middle', fill: 'var(--dia-rigid, #8a8275)' });
  }

  // Live Gray-code readout: move counter, action, binary state, progress bar.
  svg.rect(s, 50, 235, 400, 90, { fill: 'var(--dia-wash, #ece3d0)', stroke: 'var(--dia-faint, #c9bda7)', strokeWidth: 1, rx: 4 });
  svg.text(s, 250, 254, `Gray-code sequence — exactly one loop moves per step (${MOVES} moves):`, {
    fontSize: 11, anchor: 'middle', fontWeight: 'bold',
  });
  const actionText = svg.text(s, 250, 276, 'Start: all six loops on the shuttle bar', {
    fontSize: 11, anchor: 'middle', fill: INK,
  });
  svg.text(s, 172, 302, 'state:', { fontSize: 10, anchor: 'end', fill: 'var(--dia-inksoft, #6a6151)' });
  const digits = [];
  for (let i = 0; i < NUM_LOOPS; i++) {
    digits.push(svg.text(s, 190 + i * 24, 302, '1', {
      fontSize: 15, anchor: 'middle', fontWeight: 'bold',
      fontFamily: 'ui-monospace, SFMono-Regular, monospace', fill: INK,
    }));
  }
  svg.rect(s, 100, 310, 300, 6, { fill: 'var(--dia-faint, #c9bda7)', stroke: 'none', rx: 3 });
  const progressFill = svg.rect(s, 100, 310, 0.01, 6, { fill: CORD, stroke: 'none', rx: 3 });

  // Move-counter badge + hand icon near the working end
  const badge = svg.stepBadge(s, 435, 92, 0, MOVES, { radius: 12 });
  const badgeNum = badge.querySelector('text');
  svg.handIcon(s, 405, 110, { scale: 0.6, rotation: 0 });

  // Key insight
  svg.calloutBox(s, 50, 340, 400, 30, 'You must remove and replace loops in a strict order — no shortcuts!');

  // ---- Timeline updater: everything below derives from the same generated
  // states/moves arrays as the 3D animation, so the 2D stays in lockstep for
  // all 43 steps. A loop that is "off" slides down away from the bar.
  const OFF_DY = 22; // px the loop slides down when removed from the bar
  return function update(state) {
    const i = Math.max(0, Math.min(state.stepIndex | 0, states.length - 1));
    const p = Math.max(0, Math.min(state.stepProgress ?? 0, 1));
    const prev = states[Math.max(0, i - 1)];
    const cur = states[i];
    const move = moves[i]; // null on the intro step

    // Slide each loop between its previous and current on/off pose.
    for (let k = 0; k < loops.length; k++) {
      const fromOff = prev[k] ? 0 : OFF_DY;
      const toOff = cur[k] ? 0 : OFF_DY;
      const dy = fromOff + (toOff - fromOff) * p;
      loops[k].setAttribute('transform', dy ? `translate(0 ${dy})` : '');
      // Fade a loop slightly once it is off the bar.
      loops[k].style.opacity = String(1 - 0.45 * (dy / OFF_DY));
    }

    // Reveal only the moving loop's directional arrow.
    for (let k = 0; k < NUM_LOOPS; k++) {
      svg.highlight(arrowsOff[k], !!move && move.loop === k && move.off, { glow: false, dim: 0 });
      svg.highlight(arrowsOn[k], !!move && move.loop === k && !move.off, { glow: false, dim: 0 });
    }

    // Move counter, action line, binary state readout, progress bar.
    badgeNum.textContent = String(i);
    actionText.textContent = move
      ? `Move ${i} of ${MOVES}: slide loop #${move.loop + 1} ${move.off ? 'off the bar' : 'back onto the bar'}`
      : 'Start: all six loops on the shuttle bar';
    const shown = p < 0.5 ? prev : cur; // the flipped digit switches mid-slide
    for (let k = 0; k < NUM_LOOPS; k++) {
      digits[k].textContent = shown[k] ? '1' : '0';
      digits[k].setAttribute('fill', move && move.loop === k ? NEG : INK);
    }
    progressFill.setAttribute('width', String(Math.max(0.01, 300 * (i === 0 ? 0 : (i - 1 + p) / MOVES))));
  };
}

export function dispose() {
  highlights.dispose();
}
