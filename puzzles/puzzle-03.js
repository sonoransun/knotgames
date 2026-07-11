import * as THREE from 'three';
import { createMaterials } from '../lib/materials.js';
import { createFrame, createRing } from '../lib/components.js';
import { CordPath } from '../lib/cord.js';
import { enableShadowsOnGroup } from '../lib/scene.js';
import { StepArrowManager } from '../lib/arrow-helpers.js';
import { resolveStep, applyStepTransforms, HighlightCache } from '../lib/puzzle-helpers.js';
import * as svg from '../lib/svg.js';

export const metadata = {
  id: 3,
  name: "The Prisoner's Ring",
  difficulty: 'Beginner-Intermediate',
  principle: 'Linking number cancellation',
  type: 'Disentanglement',
  description: 'A cord loop wraps over a crossbar in a frame, apparently trapping a ring. But the +1 and -1 crossings cancel — linking number is zero.',
  cameraPosition: [0, 60, 220],
};

const FRAME_W = 100;
const FRAME_H = 150;
const ROD_R = 2;

// Cord/ring keyframes are authored in frame-local coordinates (crossbar at
// y = 0, top rail at y = +75) and lifted into group space once, at
// definition time, so updateAnimation can hand them straight to the helpers.
const FH = FRAME_H / 2;
const lift = pts => pts.map(([x, y, z]) => [x, y + FH, z]);
const liftPos = ([x, y, z]) => [x, y + FH, z];

// Cord keyframes. Every builder returns the SAME 13-point closed layout so
// CordPath.interpolatePoints can morph between adjacent steps:
//   0-1   front-left strand (in front of the crossbar)
//   2-4   bottom drape through the lower window — the ring hangs here
//   5-6   front-right strand back up
//   7-8   right crossing into the top window (front -> back): the +1
//   9     back flap running behind the frame
//   10-11 left crossing (back -> front): the −1 — becomes the moving bight
//   12    closing point (== point 0)

// Step 0 (rest): the wrap that *looks* like it traps the ring.
function initialCordPath() {
  const hw = FRAME_W / 2;
  return [
    [-hw + 5, 40, 8],      // front-left of lower window
    [-hw + 5, 20, 10],     // going down
    [-10, -10, 12],        // bottom of drape
    [0, -30, 15],          // ring hangs here
    [10, -10, 12],
    [hw - 5, 20, 10],      // right side going up
    [hw - 5, 40, 8],       // entering upper area
    [hw - 10, 55, 5],      // going to back through top window
    [hw - 15, 70, -5],     // crossing to back (+1)
    [0, 75, -8],           // back flap, above crossbar
    [-hw + 15, 70, -5],    // crossing back to front (−1)
    [-hw + 10, 55, 5],
    [-hw + 5, 40, 8],      // returning to front
  ];
}

// Step 1: the ring is slid aside (to the right) — the drape's low point
// shifts with it; the cord is otherwise untouched.
function ringAsidePath() {
  const hw = FRAME_W / 2;
  return [
    [-hw + 5, 40, 8],
    [-hw + 5, 20, 10],
    [-14, -8, 12],
    [4, -24, 13],
    [16, -16, 13],         // ring now rests here
    [hw - 5, 20, 10],
    [hw - 5, 40, 8],
    [hw - 10, 55, 5],
    [hw - 15, 70, -5],
    [0, 75, -8],
    [-hw + 15, 70, -5],
    [-hw + 10, 55, 5],
    [-hw + 5, 40, 8],
  ];
}

// Step 2: bottom drape bunched up toward the frame; the freed slack
// migrates into the back flap, sagging toward the left crossing.
function bunchedSlackPath() {
  const hw = FRAME_W / 2;
  return [
    [-hw + 5, 40, 8],
    [-hw + 5, 22, 10],
    [-16, 2, 11],          // drape gathered toward the crossbar
    [0, -10, 12],
    [18, -6, 12],          // ring rides up with the cord
    [hw - 5, 24, 10],
    [hw - 5, 40, 8],
    [hw - 10, 55, 5],
    [hw - 16, 69, -5],
    [-5, 72, -9],          // slack shifting to the left of the flap
    [-42, 62, -6],
    [-45, 46, 4],
    [-hw + 5, 40, 8],
  ];
}

// Step 3 (key move): a bight of the slack lifts toward the LEFT end of the
// crossbar — the left crossing slides down the frame side and hooks the tip.
function bightAtEndPath() {
  const hw = FRAME_W / 2;
  return [
    [-hw + 5, 40, 8],
    [-hw + 5, 22, 10],
    [-16, 2, 11],
    [0, -10, 12],
    [18, -6, 12],
    [hw - 5, 24, 10],
    [hw - 5, 40, 8],
    [hw - 10, 55, 5],
    [hw - 17, 68, -6],
    [-18, 65, -9],
    [-53, 40, -6],         // bight strand out past the frame side
    [-58, 20, 0],          // tip rounding the crossbar's left end
    [-hw + 5, 40, 8],
  ];
}

// Step 4: the bight has cleared the end — its tip is now on the FRONT side,
// so the −1 crossing is undone and the +1 begins to relax.
function bightClearedPath() {
  const hw = FRAME_W / 2;
  return [
    [-hw + 5, 40, 8],
    [-hw + 5, 22, 10],
    [-16, 2, 11],
    [0, -10, 12],
    [18, -6, 12],
    [hw - 5, 24, 10],
    [hw - 5, 40, 8],
    [hw - 11, 55, 5],
    [hw - 21, 66, -5],
    [-26, 60, -6],
    [-57, 26, 6],          // strand now in front of the frame plane
    [-49, 34, 9],
    [-hw + 5, 40, 8],
  ];
}

// Step 5: with the crossings cancelled the flap swings forward — the cord
// hangs as a simple loop entirely in front of the frame.
function simpleLoopPath() {
  const hw = FRAME_W / 2;
  return [
    [-hw + 5, 40, 8],
    [-hw + 5, 22, 10],
    [-16, 2, 11],
    [0, -10, 12],
    [18, -6, 12],
    [hw - 5, 24, 10],
    [hw - 5, 40, 8],
    [hw - 5, 52, 8],
    [22, 58, 8],
    [0, 60, 8],
    [-24, 56, 8],
    [-hw + 5, 48, 8],
    [-hw + 5, 40, 8],
  ];
}

// Step 6 (solved): the drape relaxes back down while the ring slides off.
function freedCordPath() {
  const hw = FRAME_W / 2;
  return [
    [-hw + 5, 40, 8],
    [-hw + 5, 20, 10],
    [-10, -10, 12],
    [0, -30, 15],
    [10, -10, 12],
    [hw - 5, 20, 10],
    [hw - 5, 40, 8],
    [hw - 5, 52, 8],
    [22, 58, 8],
    [0, 60, 8],
    [-24, 56, 8],
    [-hw + 5, 48, 8],
    [-hw + 5, 40, 8],
  ];
}

function buildAssembly() {
  const mats = createMaterials();
  const group = new THREE.Group();

  const frame = createFrame(FRAME_W, FRAME_H, ROD_R, mats.steel, 0);
  frame.position.y = FRAME_H / 2;
  group.add(frame);

  const ring = createRing(50, 4, mats.brass);
  ring.position.set(...liftPos([0, -30, 15]));
  ring.rotation.x = Math.PI / 2;
  group.add(ring);

  const cord = new CordPath(lift(initialCordPath()), {
    radius: 2.5,
    material: mats.cord,
    closed: true,
  });
  cord.addTo(group);

  enableShadowsOnGroup(group);
  return { group, ring, cord };
}

export function create3DScene() {
  return buildAssembly().group;
}

export function createAnimScene() {
  const { group, ring, cord } = buildAssembly();
  const arrowManager = new StepArrowManager(group);
  return { group, objects: { ring, cord, arrowManager } };
}

// 3D direction arrows per step (group-space coordinates, y already lifted).
const arrowConfigs = {
  1: { arrows: [{ from: [0, 45, 16], to: [20, 60, 14], opts: { color: 0x44cc44 } }] },
  2: { arrows: [{ from: [0, 48, 14], to: [0, 68, 12], opts: { color: 0x44cc44 } }] },
  3: { arrows: [{ from: [-40, 137, -6], to: [-56, 96, -2], opts: { color: 0x44cc44 } }] },
  4: { arrows: [{ from: [-58, 95, -2], to: [-48, 110, 9], opts: { color: 0x44cc44 } }] },
  5: { arrows: [{ from: [-40, 122, 4], to: [0, 135, 8], opts: { color: 0x44cc44 } }] },
  6: { arrows: [{ from: [20, 60, 13], to: [45, 30, 30], opts: { color: 0x44cc44 } }] },
};
const highlights = new HighlightCache();

export const animationSteps = [
  {
    label: 'Look: count the signed crossings over the crossbar — a −1 and a +1',
    duration: 2.6,
    cord: lift(initialCordPath()),
    ring: liftPos([0, -30, 15]),
  },
  {
    label: 'Slide the ring aside, out of the working area',
    duration: 1.8,
    easing: 'easeInOut',
    cord: lift(ringAsidePath()),
    ring: liftPos([16, -16, 13]),
  },
  {
    label: 'Bunch the cord slack toward the frame',
    duration: 1.8,
    easing: 'easeInOut',
    cord: lift(bunchedSlackPath()),
    ring: liftPos([18, -6, 12]),
  },
  {
    label: 'Lift a bight of the slack up and over the LEFT end of the crossbar',
    duration: 2.4,
    easing: 'easeInOut',
    cord: lift(bightAtEndPath()),
    ring: liftPos([18, -6, 12]),
  },
  {
    label: 'The bight clears the end — one crossing is undone',
    duration: 2.0,
    easing: 'easeOut',
    cord: lift(bightClearedPath()),
    ring: liftPos([18, -6, 12]),
  },
  {
    label: 'The cord hangs as a simple loop — the −1 and +1 have cancelled',
    duration: 2.0,
    easing: 'easeInOut',
    cord: lift(simpleLoopPath()),
    ring: liftPos([18, -6, 12]),
  },
  {
    label: 'Slide the ring off the freed cord',
    duration: 2.6,
    easing: 'easeOut',
    cord: lift(freedCordPath()),
    ring: liftPos([45, -45, 30]),
  },
];

export function updateAnimation(objects, state) {
  const { step, prevStep, t, stepIndex } = resolveStep(animationSteps, state, {
    arrowManager: objects.arrowManager,
    arrowConfigs,
  });

  // The ring glows while it is the thing being moved (slide aside, slide
  // off); the cord glows while the bight is worked over the crossbar end.
  highlights.set(objects.ring, stepIndex === 1 || stepIndex === 6, 0xffcc44, 0.3);
  highlights.set(objects.cord.mesh, stepIndex >= 2 && stepIndex <= 5, 0x4488ff, 0.25);

  applyStepTransforms(objects, prevStep, step, t, {
    cord: { target: 'cord', kind: 'cordPoints' },
    ring: { target: 'ring', kind: 'position' },
  });
}

export function createSVGDiagram(container) {
  const s = svg.createSVG(container, 500, 400);
  const CORD = 'var(--dia-cord, #1f57c4)';
  const RIGID = 'var(--dia-rigid, #8a8275)';
  const RING = 'var(--dia-ring, #b97d12)';
  const NEG = 'var(--dia-neg, #cf3a26)';

  svg.text(s, 250, 25, "The Prisoner's Ring — Initial State", {
    fontSize: 14, anchor: 'middle', fontWeight: 'bold',
  });

  // Frame
  const fx = 175;
  const fy = 50;
  const fw = 150;
  const fh = 200;
  const crossY = fy + fh / 2;

  svg.rect(s, fx, fy, fw, fh, { stroke: RIGID, strokeWidth: 4, fill: 'none' });
  svg.line(s, fx, crossY, fx + fw, crossY, { stroke: RIGID, strokeWidth: 4 });

  // Cord: front side (through bottom window, up, through ring)
  svg.path(s, `M ${fx + 20} ${crossY - 20} L ${fx + 20} ${crossY + 30} Q 250 ${crossY + 80} ${fx + fw - 20} ${crossY + 30} L ${fx + fw - 20} ${crossY - 20}`, {
    stroke: CORD, strokeWidth: 2.5, fill: 'none',
  });

  // Cord: back side (through top window, dashed while behind) — the bight
  // that gets lifted over the LEFT end of the crossbar as the puzzle is
  // solved. Its shape is a fixed M-L-Q-L skeleton whose ten coordinates are
  // interpolated per step with lerpFrames.
  const backD = ([x1, y1, x2, y2, qx, qy, x3, y3, x4, y4]) =>
    `M ${x1} ${y1} L ${x2} ${y2} Q ${qx} ${qy} ${x3} ${y3} L ${x4} ${y4}`;
  const backRest = [fx + 20, crossY - 20, fx + 20, crossY - 40, 250, crossY - 60, fx + fw - 20, crossY - 40, fx + fw - 20, crossY - 20];
  const backSimpleLoop = [fx + 20, crossY - 20, fx + 20, crossY - 36, 250, crossY - 52, fx + fw - 20, crossY - 36, fx + fw - 20, crossY - 20];
  const backFrames = [
    backRest,                                                     // 0 look
    backRest,                                                     // 1 ring aside — cord unchanged
    [fx + 20, crossY - 20, fx + 12, crossY - 46, 226, crossY - 68, fx + fw - 24, crossY - 38, fx + fw - 20, crossY - 20], // 2 slack bunched left
    [fx + 20, crossY - 20, fx - 14, crossY - 26, fx - 30, crossY - 2, 244, crossY - 52, fx + fw - 20, crossY - 20],       // 3 bight past the left end
    [fx + 20, crossY - 20, fx + 16, crossY - 34, 250, crossY - 50, fx + fw - 16, crossY - 34, fx + fw - 20, crossY - 20], // 4 cleared — swinging to front
    backSimpleLoop,                                               // 5 simple loop
    backSimpleLoop,                                               // 6 ring slides off
  ];
  const cordBack = svg.path(s, backD(backRest), {
    stroke: CORD, strokeWidth: 2, fill: 'none', dashArray: '5,4',
  });

  // Ring (animatable — slides aside, then off)
  const ring = svg.ellipse(s, 250, crossY + 65, 20, 16, {
    stroke: RING, strokeWidth: 3, fill: 'none',
  });
  ring.style.transition = 'cx .12s linear, cy .12s linear';
  const ringFrames = [
    [250, crossY + 65],    // 0 hanging at the drape's low point
    [282, crossY + 51],    // 1 slid aside to the right
    [282, crossY + 51],    // 2-5 parked while the cord is worked
    [282, crossY + 51],
    [282, crossY + 51],
    [282, crossY + 51],
    [352, crossY + 100],   // 6 slid off, free
  ];

  // Crossing signs — what step 0 asks the solver to count
  const signLeft = svg.text(s, fx + 30, crossY - 24, '−1', {
    fontSize: 11, fill: NEG, fontWeight: 'bold', anchor: 'middle',
  });
  const signRight = svg.text(s, fx + fw - 30, crossY - 24, '+1', {
    fontSize: 11, fill: CORD, fontWeight: 'bold', anchor: 'middle',
  });

  // Labels
  svg.label(s, 100, 80, fx, fy + 30, 'Frame');
  svg.label(s, 400, crossY, fx + fw, crossY, 'Crossbar');
  svg.label(s, 370, crossY + 65, 270, crossY + 65, 'Ring');
  svg.text(s, 250, crossY + 95, 'The two crossings cancel each other — the cord is not truly trapped', {
    fontSize: 10, anchor: 'middle', fill: 'var(--dia-inksoft, #6a6151)', fontStyle: 'italic',
  });

  // Dimensions
  svg.dimensionArrow(s, fx, fy + fh + 20, fx + fw, fy + fh + 20, '100mm');
  svg.dimensionArrow(s, fx - 25, fy, fx - 25, fy + fh, '150mm');

  // Motion arrows showing key movements (toggled per step by the updater)
  const arrowAside = svg.motionArrow(s, 256, crossY + 60, 284, crossY + 50, { label: 'Slide aside', curvature: 0.3 });
  const arrowBunch = svg.motionArrow(s, 222, crossY + 72, 210, crossY + 38, { label: 'Bunch slack', curvature: 0.3 });
  const arrowLift = svg.motionArrow(s, fx + 16, crossY - 36, fx - 24, crossY - 2, { label: 'Over the end', curvature: 0.4 });
  const arrowSlide = svg.motionArrow(s, 300, crossY + 45, 348, crossY + 92, { label: 'Slide ring off', curvature: 0.3 });

  // Hand icon near the manipulation point — the LEFT end of the crossbar
  svg.handIcon(s, fx - 28, crossY + 16, { scale: 0.6, rotation: 25 });

  // Step badges (highlighted per phase by the updater)
  const badge1 = svg.stepBadge(s, 80, 210, 1, 3);
  svg.actionLabel(s, 80, 223, 'Bunch slack toward frame');
  const badge2 = svg.stepBadge(s, 85, 127, 2, 3);
  svg.actionLabel(s, 85, 140, 'Lift bight over left end');
  const badge3 = svg.stepBadge(s, 320, crossY + 90, 3, 3);
  svg.actionLabel(s, 320, crossY + 103, 'Slide ring off');
  const badges = [badge1, badge2, badge3];

  // Key insight
  svg.calloutBox(s, 30, 355, 440, 35,
    'Key: the −1 and +1 crossings cancel — lift a bight over the left end of the crossbar', {
      fontSize: 11,
    });

  // ---- Timeline updater: sync the 2D back-cord bight + ring + signs +
  // badges + arrows to the 7 animation steps: 0 count crossings, 1 ring
  // aside, 2 bunch slack, 3 bight to the left end, 4 bight clears (one
  // crossing undone), 5 simple loop, 6 ring off.
  return function update(state) {
    const i = Math.max(0, Math.min(state.stepIndex ?? 0, 6));
    const p = Math.max(0, Math.min(state.stepProgress ?? 0, 1));

    // Back cord morphs through the bight-over-the-end move; it is drawn
    // dashed while behind the frame and solid once it clears to the front
    // (midway through step 4).
    cordBack.setAttribute('d', backD(svg.lerpFrames(backFrames, i, p)));
    const inFront = i > 4 || (i === 4 && p >= 0.5);
    cordBack.setAttribute('stroke-dasharray', inFront ? 'none' : '5,4');

    // Ring slides aside (step 1) and off (step 6).
    const [rx, ry] = svg.lerpFrames(ringFrames, i, p);
    ring.setAttribute('cx', rx);
    ring.setAttribute('cy', ry);

    // Crossing signs glow while step 0 counts them.
    svg.highlight(signLeft, i === 0, { dim: 0.45, color: NEG });
    svg.highlight(signRight, i === 0, { dim: 0.45, color: CORD });

    // Checkpoint phase: ring-aside + bunch -> badge 1, the bight move
    // (lift, clear, settle) -> badge 2, slide-off -> badge 3.
    const phase = i < 1 ? -1 : i <= 2 ? 0 : i <= 5 ? 1 : 2;
    badges.forEach((b, k) => svg.highlight(b, k === phase, { dim: 0.3, color: CORD }));

    // Motion arrows follow the active manipulation.
    svg.highlight(arrowAside, i === 1, { glow: false, dim: 0 });
    svg.highlight(arrowBunch, i === 2, { glow: false, dim: 0 });
    svg.highlight(arrowLift, i === 3 || i === 4, { glow: false, dim: 0 });
    svg.highlight(arrowSlide, i === 6, { glow: false, dim: 0 });
  };
}

export function dispose() {
  highlights.dispose();
}
