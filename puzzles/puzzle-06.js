import * as THREE from 'three';
import { createMaterials } from '../lib/materials.js';
import { createStraightRod, createRing, createBall } from '../lib/components.js';
import { CordPath } from '../lib/cord.js';
import { enableShadowsOnGroup } from '../lib/scene.js';
import { StepArrowManager } from '../lib/arrow-helpers.js';
import { resolveStep, applyStepTransforms, HighlightCache } from '../lib/puzzle-helpers.js';
import * as svg from '../lib/svg.js';

export const metadata = {
  id: 7,
  name: "Devil's Pitchfork",
  difficulty: 'Intermediate-Advanced',
  principle: 'Fundamental group of configuration space',
  type: 'Transfer',
  description: 'A ring is on the left prong of a three-pronged fork. The center prong is subtly shorter — and this is the key to moving the ring to the right prong.',
  cameraPosition: [0, 80, 200],
};

const PRONG_SPACING = 40;
const LEFT_H = 100;
const CENTER_H = 80;
const RIGHT_H = 100;
const ROD_R = 2;
const BALL_R = 4;

function createPitchfork(mats) {
  const group = new THREE.Group();

  // Base U-shape
  const basePoints = [
    [-PRONG_SPACING, 0, 0],
    [-PRONG_SPACING, -10, 0],
    [0, -15, 0],
    [PRONG_SPACING, -10, 0],
    [PRONG_SPACING, 0, 0],
  ];
  const baseVecs = basePoints.map(p => new THREE.Vector3(...p));
  const baseCurve = new THREE.CatmullRomCurve3(baseVecs);
  const baseGeo = new THREE.TubeGeometry(baseCurve, 32, ROD_R, 8, false);
  group.add(new THREE.Mesh(baseGeo, mats.steel));

  // Prongs
  group.add(createStraightRod([-PRONG_SPACING, 0, 0], [-PRONG_SPACING, LEFT_H, 0], ROD_R, mats.steel));
  group.add(createStraightRod([0, 0, 0], [0, CENTER_H, 0], ROD_R, mats.steel));
  group.add(createStraightRod([PRONG_SPACING, 0, 0], [PRONG_SPACING, RIGHT_H, 0], ROD_R, mats.steel));

  // Ball stops
  const leftBall = createBall(BALL_R * 2, mats.steel);
  leftBall.position.set(-PRONG_SPACING, LEFT_H, 0);
  group.add(leftBall);

  const centerBall = createBall(BALL_R * 2, mats.steel);
  centerBall.position.set(0, CENTER_H, 0);
  group.add(centerBall);

  const rightBall = createBall(BALL_R * 2, mats.steel);
  rightBall.position.set(PRONG_SPACING, RIGHT_H, 0);
  group.add(rightBall);

  return group;
}

// Every cord keyframe must have exactly 5 control points — CordPath
// .interpolatePoints silently truncates to the shorter array. All keyframes
// end at the anchor hole at the center prong's base, [0, 5, 5].

// Step 0: ring at rest on the left prong, cord straight down to the anchor.
function initialCordPath() {
  return [
    [-PRONG_SPACING, 70, 5],   // from ring on left prong
    [-PRONG_SPACING + 5, 50, 8],
    [-10, 20, 10],
    [0, 8, 8],                 // near center prong base
    [0, 5, 5],                 // attached to center prong base
  ];
}

// Step 1: ring slid down to the left-prong base — slack droops in the
// left channel (md Phase 1, move 1).
function ringAtBaseCordPath() {
  return [
    [-PRONG_SPACING, 15, 5],   // ring at the base of the left prong
    [-28, 22, 10],             // slack bellying out in the left channel
    [-14, 26, 12],
    [-4, 14, 8],
    [0, 5, 5],
  ];
}

// Step 2: the slack is gathered into a bight and pulled up toward the
// center prong tip — not over the ball-stop yet (md Phase 1, moves 2-3).
function slackRaisedCordPath() {
  return [
    [-PRONG_SPACING, 15, 5],
    [-26, 42, 10],
    [-8, CENTER_H - 8, 12],    // bight hovering just below the ball-stop
    [-2, 45, 8],
    [0, 5, 5],
  ];
}

// Steps 3-4: the bight is looped over the center ball-stop — one strand
// rises on the left, crosses the tip, and descends to the anchor
// (md Phase 1, moves 4-5; formerly midCordPath1).
function midCordPath1() {
  return [
    [-PRONG_SPACING, 15, 5],   // ring still at the left-prong base
    [-20, 45, 10],             // cord going up toward center prong tip
    [0, CENTER_H + 6, 8],      // cord looped over center ball-stop
    [4, 40, 5],                // coming back down the right side
    [0, 5, 5],
  ];
}

// Step 4 checkpoint: the loop settles snug against the ball-stop — same
// topology as midCordPath1, subtly tightened.
function settledLoopCordPath() {
  return [
    [-PRONG_SPACING, 15, 5],
    [-18, 48, 8],
    [0, CENTER_H + 5, 6],
    [3, 38, 4],
    [0, 5, 5],
  ];
}

// Step 5: the ring slides under the cord into the right channel; both cord
// runs now live on the right side of the center prong (md Phase 2, move 7).
function rightChannelCordPath() {
  return [
    [PRONG_SPACING, 15, 5],    // ring at the base of the right prong
    [22, 48, 10],              // strand rising to the re-anchored tip
    [0, CENTER_H + 5, 8],      // loop still over the ball-stop
    [3, 38, 4],
    [0, 5, 5],
  ];
}

// Step 6: the ring is worked partway up the right prong — the tip loop acts
// as a pulley, so the reach is a short diagonal (md "Why the loop creates reach").
function ringRisingCordPath() {
  return [
    [PRONG_SPACING, 55, 5],
    [24, 70, 8],
    [0, CENTER_H + 5, 6],
    [3, 38, 4],
    [0, 5, 5],
  ];
}

// Step 7: solved. The cord STAYS looped over the center prong (per the md's
// solved diagram) — only the ring's position changes in this final beat.
function solvedCordPath() {
  return [
    [PRONG_SPACING, 70, 5],    // ring resting at the right ball-stop
    [22, 80, 8],
    [0, CENTER_H + 5, 6],
    [3, 38, 4],
    [0, 5, 5],
  ];
}

export function create3DScene() {
  const mats = createMaterials();
  const group = new THREE.Group();

  group.add(createPitchfork(mats));

  const ring = createRing(50, 4, mats.brass);
  ring.position.set(-PRONG_SPACING, 70, 0);
  ring.rotation.x = Math.PI / 2;
  group.add(ring);

  const cord = new CordPath(initialCordPath(), {
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

  group.add(createPitchfork(mats));

  const ring = createRing(50, 4, mats.brass);
  ring.position.set(-PRONG_SPACING, 70, 0);
  ring.rotation.x = Math.PI / 2;
  group.add(ring);

  const cord = new CordPath(initialCordPath(), {
    radius: 2.5,
    material: mats.cord,
  });
  cord.addTo(group);

  enableShadowsOnGroup(group);
  const arrowManager = new StepArrowManager(group);

  return { group, objects: { ring, cord, arrowManager } };
}

// Yellow = move the ring; blue = work the cord; green = the key loop-over.
const arrowConfigs = {
  1: { arrows: [
    { from: [-PRONG_SPACING, 65, 0], to: [-PRONG_SPACING, 20, 0], opts: { color: 0xffcc44 } },
  ] },
  2: { arrows: [
    { from: [-18, 28, 10], to: [-6, CENTER_H - 10, 11], opts: { color: 0x4488ff } },
  ] },
  3: { arrows: [
    { type: 'curved', points: [[-10, CENTER_H - 2, 10], [0, CENTER_H + 16, 8], [10, CENTER_H - 4, 5]], opts: { color: 0x44cc44 } },
  ] },
  5: { arrows: [
    { from: [-30, 12, 8], to: [30, 12, 8], opts: { color: 0xffcc44 } },
  ] },
  6: { arrows: [
    { from: [PRONG_SPACING, 22, 0], to: [PRONG_SPACING, 60, 0], opts: { color: 0xffcc44 } },
  ] },
};

// Eight beats following the md's two phases. Phase 1 (reconfigure the cord):
// steps 1-3, with step 4 the checkpoint where the configuration space has
// changed topology. Phase 2 (transfer the ring): steps 5-7.
export const animationSteps = [
  {
    label: 'Look: the ring sits on the left prong — the cord is too short to reach across',
    duration: 2.5,
    cord: initialCordPath(),
    ring: { position: [-PRONG_SPACING, 70, 0] },
  },
  {
    label: 'Slide the ring down to the base of the left prong',
    duration: 2.0,
    easing: 'easeInOut',
    cord: ringAtBaseCordPath(),
    ring: { position: [-PRONG_SPACING, 15, 0] },
  },
  {
    label: 'Pull the cord slack up toward the center prong tip',
    duration: 2.0,
    easing: 'easeInOut',
    cord: slackRaisedCordPath(),
    ring: { position: [-PRONG_SPACING, 15, 0] },
  },
  {
    label: 'Loop a bight of cord over the center ball-stop — it just barely reaches',
    duration: 2.5,
    easing: 'easeOut',
    cord: midCordPath1(),
    ring: { position: [-PRONG_SPACING, 15, 0] },
  },
  {
    label: 'Checkpoint: the cord is looped over the short prong — the geometry has changed',
    duration: 1.5,
    easing: 'easeInOut',
    cord: settledLoopCordPath(),
    ring: { position: [-PRONG_SPACING, 15, 0] },
  },
  {
    label: 'Slide the ring under the cord into the right channel',
    duration: 2.5,
    easing: 'easeInOut',
    cord: rightChannelCordPath(),
    ring: { position: [PRONG_SPACING, 15, 0] },
  },
  {
    label: 'Work the ring up the right prong — the tip loop pays out just enough cord',
    duration: 2.0,
    easing: 'easeInOut',
    cord: ringRisingCordPath(),
    ring: { position: [PRONG_SPACING, 55, 0] },
  },
  {
    label: 'The ring rests at the right ball-stop — solved!',
    duration: 2.5,
    easing: 'easeOut',
    cord: solvedCordPath(),
    ring: { position: [PRONG_SPACING, 70, 0] },
  },
];

const highlights = new HighlightCache();

export function updateAnimation(objects, state) {
  const { step, prevStep, t, stepIndex } = resolveStep(animationSteps, state, {
    arrowManager: objects.arrowManager,
    arrowConfigs,
  });

  // Highlight the ring while it is being worked (every step after the look)
  highlights.set(objects.ring, stepIndex >= 1, 0xffcc44, 0.3);

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

  svg.text(s, 250, 25, "Devil's Pitchfork — Initial State", {
    fontSize: 14, anchor: 'middle', fontWeight: 'bold',
  });

  const baseY = 320;
  const lx = 150, cx = 250, rx = 350;
  const lTop = baseY - 200;
  const cTop = baseY - 160; // shorter!
  const rTop = baseY - 200;

  // Prongs
  svg.line(s, lx, baseY, lx, lTop, { stroke: RIGID, strokeWidth: 5 });
  svg.line(s, cx, baseY, cx, cTop, { stroke: RIGID, strokeWidth: 5 });
  svg.line(s, rx, baseY, rx, rTop, { stroke: RIGID, strokeWidth: 5 });

  // Base curve
  svg.path(s, `M ${lx} ${baseY} Q ${lx} ${baseY + 20} ${cx} ${baseY + 25} Q ${rx} ${baseY + 20} ${rx} ${baseY}`, {
    stroke: RIGID, strokeWidth: 5, fill: 'none',
  });

  // Ball stops
  svg.circle(s, lx, lTop, 6, { fill: 'var(--dia-rigid, #8a8275)', stroke: 'var(--dia-rigid, #8a8275)', strokeWidth: 1 });
  svg.circle(s, cx, cTop, 6, { fill: 'var(--dia-rigid, #8a8275)', stroke: 'var(--dia-rigid, #8a8275)', strokeWidth: 1 });
  svg.circle(s, rx, rTop, 6, { fill: 'var(--dia-rigid, #8a8275)', stroke: 'var(--dia-rigid, #8a8275)', strokeWidth: 1 });

  // Cord from ring to center prong base
  svg.path(s, `M ${lx} ${lTop + 50} Q ${(lx + cx) / 2} ${baseY - 40} ${cx} ${baseY}`, {
    stroke: CORD, strokeWidth: 2.5, fill: 'none',
  });

  // Ring on left prong — animatable
  const ring = svg.ellipse(s, lx, lTop + 40, 18, 14, { stroke: RING, strokeWidth: 3, fill: 'none' });
  ring.style.transition = 'cx .12s linear, cy .12s linear';

  // Height annotations
  svg.dimensionArrow(s, lx - 30, baseY, lx - 30, lTop, '100mm');
  svg.dimensionArrow(s, cx + 20, baseY, cx + 20, cTop, '80mm');

  // Highlight the height difference
  svg.line(s, cx - 15, cTop, cx + 15, cTop, { stroke: NEG, strokeWidth: 1, dashArray: '3,2' });
  svg.line(s, cx - 15, lTop, cx + 15, lTop, { stroke: NEG, strokeWidth: 1, dashArray: '3,2' });
  svg.text(s, cx + 35, (cTop + lTop) / 2 + 4, '20mm', { fontSize: 10, fill: NEG, fontWeight: 'bold' });

  // Labels
  svg.label(s, 90, lTop + 40, lx - 18, lTop + 40, 'Ring');
  svg.label(s, 420, baseY, cx + 30, baseY, 'Cord to base');

  // Motion arrows showing key movements (toggled per step by the updater)
  const arrowDown = svg.motionArrow(s, lx, lTop + 55, lx, baseY - 30, { label: 'Slide ring down', curvature: 0.2 });
  const arrowLoop = svg.motionArrow(s, lx + 20, baseY - 40, cx, cTop - 10, { label: 'Loop cord over', curvature: 0.4 });
  const arrowTransfer = svg.motionArrow(s, lx + 30, baseY - 20, rx - 30, lTop + 55, { label: 'Transfer ring', curvature: 0.3 });

  // Hand icon near the ring
  svg.handIcon(s, lx + 30, lTop + 30, { scale: 0.6, rotation: -15 });

  // Phase badges (highlighted per phase by the updater)
  const badge1 = svg.stepBadge(s, lx - 55, lTop + 80, 1, 3);
  svg.actionLabel(s, lx - 55, lTop + 93, 'Slide ring down');
  const badge2 = svg.stepBadge(s, cx, cTop - 25, 2, 3);
  svg.actionLabel(s, cx, cTop - 12, 'Loop over center');
  const badge3 = svg.stepBadge(s, rx + 30, lTop + 80, 3, 3);
  svg.actionLabel(s, rx + 30, lTop + 93, 'Move ring right');
  const badges = [badge1, badge2, badge3];

  // Key insight
  svg.calloutBox(s, 20, 360, 460, 30,
    'Key: The short center prong lets you loop the cord over it to gain slack');

  // ---- Timeline updater: sync the 2D ring + badges + arrows to the solution.
  // One [cx, cy] target per animation step (END-of-step pose; frame 0 doubles
  // as the rest pose). The ring parks at the left-prong base through the cord
  // work of steps 2-4, crosses to the right channel in step 5, then climbs
  // the right prong (steps 6-7) — mirrors the 3D ring keyframes.
  const endPos = [
    [lx, lTop + 40],   // 0: look — ring at rest on the left prong
    [lx, baseY - 35],  // 1: slide ring down to the left-prong base
    [lx, baseY - 35],  // 2: pull slack toward the center tip (ring parked)
    [lx, baseY - 35],  // 3: loop the bight over the ball-stop (ring parked)
    [lx, baseY - 35],  // 4: checkpoint — geometry changed (ring parked)
    [rx, baseY - 35],  // 5: slide ring under the cord into the right channel
    [rx, rTop + 90],   // 6: work the ring up the right prong
    [rx, rTop + 40],   // 7: rest at the right ball-stop — solved
  ];
  const LAST_STEP = endPos.length - 1;
  return function update(state) {
    if (!state) return;
    const i = Math.max(0, Math.min(state.stepIndex ?? 0, LAST_STEP));
    const p = Math.max(0, Math.min(state.stepProgress ?? 0, 1));
    const [ringX, ringY] = svg.lerpFrames(endPos, i, p);
    ring.setAttribute('cx', ringX);
    ring.setAttribute('cy', ringY);
    // Phase badges: 0 = slide ring down (step 1), 1 = loop over center
    // (steps 2-4), 2 = move ring right (steps 5-7); none during the look.
    const phase = i >= 5 ? 2 : i >= 2 ? 1 : i >= 1 ? 0 : -1;
    badges.forEach((b, k) => svg.highlight(b, k === phase, { dim: 0.3, color: CORD }));
    // Show only the arrows relevant to the current step.
    svg.highlight(arrowDown, i === 1, { glow: false, dim: 0 });
    svg.highlight(arrowLoop, i === 2 || i === 3, { glow: false, dim: 0 });
    svg.highlight(arrowTransfer, i === 5 || i === 6, { glow: false, dim: 0 });
  };
}

export function dispose() {
  highlights.dispose();
}
