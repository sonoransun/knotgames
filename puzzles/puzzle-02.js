import * as THREE from 'three';
import { createMaterials } from '../lib/materials.js';
import { CordPath } from '../lib/cord.js';
import { enableShadowsOnGroup } from '../lib/scene.js';
import { StepArrowManager } from '../lib/arrow-helpers.js';
import { resolveStep, applyStepTransforms, HighlightCache } from '../lib/puzzle-helpers.js';
import * as svg from '../lib/svg.js';

export const metadata = {
  id: 2,
  name: "Shepherd's Yoke",
  difficulty: 'Beginner',
  principle: 'Buttonhole homotopy',
  type: 'Disentanglement',
  description: 'A closed cord loop is threaded through a hole in a wooden paddle. The loop is too short to slip over the edges — but the paddle can pass through the loop.',
  cameraPosition: [0, 60, 200],
};

// Dimensions
const PADDLE_W = 150;
const PADDLE_H = 80;
const PADDLE_D = 10;
const HOLE_R = 10;

function createPaddle(material) {
  const shape = new THREE.Shape();
  const hw = PADDLE_W / 2;
  const hh = PADDLE_H / 2;
  const r = 5; // corner radius

  shape.moveTo(-hw + r, -hh);
  shape.lineTo(hw - r, -hh);
  shape.quadraticCurveTo(hw, -hh, hw, -hh + r);
  shape.lineTo(hw, hh - r);
  shape.quadraticCurveTo(hw, hh, hw - r, hh);
  shape.lineTo(-hw + r, hh);
  shape.quadraticCurveTo(-hw, hh, -hw, hh - r);
  shape.lineTo(-hw, -hh + r);
  shape.quadraticCurveTo(-hw, -hh, -hw + r, -hh);

  // Center hole
  const hole = new THREE.Path();
  const holePts = 32;
  for (let i = 0; i <= holePts; i++) {
    const angle = (2 * Math.PI * i) / holePts;
    const x = Math.cos(angle) * HOLE_R;
    const y = Math.sin(angle) * HOLE_R;
    if (i === 0) hole.moveTo(x, y);
    else hole.lineTo(x, y);
  }
  shape.holes.push(hole);

  const extrudeSettings = { depth: PADDLE_D, bevelEnabled: false };
  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = Math.PI / 2;
  mesh.position.y = 0;
  mesh.position.z = -PADDLE_D / 2;
  return mesh;
}

// Cord keyframes. Every builder returns the SAME 12-point layout so
// CordPath.interpolatePoints can morph between any adjacent pair:
//   0-2   front hanging arc
//   3-5   right-hand hole passage: approach → in hole → back side
//         (this passage becomes the moving bight during the solution)
//   6-8   back hanging arc
//   9-11  left-hand hole passage: approach → in hole → front side

// Step 0 (rest): loop through the hole, one arc hanging on each side
function initialCordPath() {
  return [
    [-30, -15, PADDLE_D / 2 + 3],   // front-left
    [0, -30, PADDLE_D / 2 + 3],     // front-bottom
    [30, -15, PADDLE_D / 2 + 3],    // front-right
    [15, 5, PADDLE_D / 2 + 1],      // approaching hole
    [5, 2, 0],                       // entering hole
    [5, 2, -PADDLE_D / 2 - 1],      // exiting hole back
    [30, -15, -PADDLE_D / 2 - 3],   // back-right
    [0, -30, -PADDLE_D / 2 - 3],    // back-bottom
    [-30, -15, -PADDLE_D / 2 - 3],  // back-left
    [-15, 5, -PADDLE_D / 2 - 1],    // approaching hole
    [-5, 2, 0],                      // entering hole
    [-5, 2, PADDLE_D / 2 + 1],      // exiting hole front
  ];
}

// Step 1: all the slack gathered on the front — the front arc drops low and
// wide while the back arc pulls tight against the paddle around the hole
function gatherSlackPath() {
  return [
    [-38, -28, PADDLE_D / 2 + 4],
    [0, -46, PADDLE_D / 2 + 5],     // front arc hangs deep with the slack
    [38, -28, PADDLE_D / 2 + 4],
    [16, 0, PADDLE_D / 2 + 1],
    [5, 2, 0],
    [5, 2, -PADDLE_D / 2 - 1],
    [16, -10, -PADDLE_D / 2 - 2],   // back arc tightened toward the hole
    [0, -16, -PADDLE_D / 2 - 2],
    [-16, -10, -PADDLE_D / 2 - 2],
    [-12, 0, -PADDLE_D / 2 - 1],
    [-5, 2, 0],
    [-5, 2, PADDLE_D / 2 + 1],
  ];
}

// Step 2 (checkpoint-a): a bight of the front slack folded back into the
// hole, its tip just poking out on the back side
function bightThroughHolePath() {
  return [
    [-38, -28, PADDLE_D / 2 + 4],
    [0, -42, PADDLE_D / 2 + 4],
    [34, -24, PADDLE_D / 2 + 3],
    [15, 2, PADDLE_D / 2 + 1],
    [8, 6, 0],                       // fold entering the hole
    [9, 9, -PADDLE_D / 2 - 3],      // bight tip just emerged at the back
    [16, -10, -PADDLE_D / 2 - 2],
    [0, -16, -PADDLE_D / 2 - 2],
    [-16, -10, -PADDLE_D / 2 - 2],
    [-12, 0, -PADDLE_D / 2 - 1],
    [-5, 2, 0],
    [-5, 2, PADDLE_D / 2 + 1],
  ];
}

// Step 3: the bight fully emerged at the rear — a working loop of cord
// standing behind the paddle
function bightEmergedPath() {
  return [
    [-36, -24, PADDLE_D / 2 + 4],
    [0, -36, PADDLE_D / 2 + 4],
    [30, -20, PADDLE_D / 2 + 3],
    [16, 3, PADDLE_D / 2 + 1],
    [8, 7, 0],
    [12, 26, -PADDLE_D / 2 - 9],    // bight standing tall behind the paddle
    [18, -8, -PADDLE_D / 2 - 3],
    [0, -20, -PADDLE_D / 2 - 3],
    [-18, -12, -PADDLE_D / 2 - 3],
    [-13, 2, -PADDLE_D / 2 - 1],
    [-5, 2, 0],
    [-5, 2, PADDLE_D / 2 + 1],
  ];
}

// Step 4 (checkpoint-b): the bight stretched sideways, straddling the short
// (80mm) right edge of the paddle
function stretchOverEdgePath() {
  return [
    [-34, -20, PADDLE_D / 2 + 3],
    [0, -32, PADDLE_D / 2 + 3],
    [30, -20, PADDLE_D / 2 + 3],
    [15, 2, PADDLE_D / 2 + 1],
    [7, 5, 0],                       // strand still feeding through the hole
    [PADDLE_W / 2 + 5, 6, 0],       // bight tip straddling the 80mm edge
    [48, 2, -PADDLE_D / 2 - 3],     // strand running back from the edge
    [0, -26, -PADDLE_D / 2 - 3],
    [-28, -16, -PADDLE_D / 2 - 3],
    [-14, 4, -PADDLE_D / 2 - 1],
    [-5, 2, 0],
    [-5, 2, PADDLE_D / 2 + 1],
  ];
}

// Step 5 (checkpoint-c): the bight pulled back to the front — the hole is
// empty and the loop rings the paddle body (girth 2×(80+10)=180mm < 200mm)
function aroundBodyPath() {
  const x = 45;                      // band sits between the hole and the edge
  const front = PADDLE_D / 2 + 3;
  const back = -PADDLE_D / 2 - 3;
  const over = PADDLE_H / 2 + 5;    // clearing the long edges
  return [
    [x, 10, front],                  // down the front face…
    [x, -25, front],
    [x, -40, front - 1],
    [x, -over, 2],                   // …under the bottom edge…
    [x, -over, -2],
    [x, -38, back],                  // …up the back face…
    [x, -5, back],
    [x, 25, back],
    [x, 39, back + 1],
    [x, over, -2],                   // …over the top edge…
    [x, over, 2],
    [x, 32, front],                  // …closing on the front face
  ];
}

// Step 6 (solved): the band slid off past the short edge, hanging free
// below the right end of the paddle
function solvedCordPath() {
  return [
    [45, -50, 5],
    [75, -60, 8],
    [105, -50, 5],
    [105, -45, 0],
    [100, -42, -5],
    [85, -40, -8],
    [65, -40, -8],
    [50, -42, -5],
    [45, -45, 0],
    [45, -48, 3],
    [45, -50, 5],
    [45, -50, 5],
  ];
}

export function create3DScene() {
  const mats = createMaterials();
  const group = new THREE.Group();

  const paddle = createPaddle(mats.wood);
  group.add(paddle);

  const cord = new CordPath(initialCordPath(), {
    radius: 2.5,
    material: mats.cord,
    closed: true,
  });
  cord.addTo(group);

  enableShadowsOnGroup(group);
  return group;
}

export function createAnimScene() {
  const mats = createMaterials();
  const group = new THREE.Group();

  const paddle = createPaddle(mats.wood);
  group.add(paddle);

  const cord = new CordPath(initialCordPath(), {
    radius: 2.5,
    material: mats.cord,
    closed: true,
  });
  cord.addTo(group);

  enableShadowsOnGroup(group);
  const arrowManager = new StepArrowManager(group);

  return { group, objects: { cord, arrowManager } };
}

const arrowConfigs = {
  1: { arrows: [{ from: [0, -30, -8], to: [0, -46, 10], opts: { color: 0x44cc44 } }] },
  2: { arrows: [{ from: [0, -42, 9], to: [9, 9, -8], opts: { color: 0x44cc44 } }] },
  3: { arrows: [{ from: [9, 9, -8], to: [12, 26, -14], opts: { color: 0x44cc44 } }] },
  4: { arrows: [{ from: [12, 26, -14], to: [80, 6, 0], opts: { color: 0x44cc44 } }] },
  5: { arrows: [{ from: [80, 6, 0], to: [45, 10, 8], opts: { color: 0x44cc44 } }] },
  6: { arrows: [{ from: [45, 10, 8], to: [75, -60, 8], opts: { color: 0x44cc44 } }] },
};
const highlights = new HighlightCache();

export const animationSteps = [
  {
    label: 'Look: the cord loop threads through the paddle hole on both sides',
    duration: 2.2,
    cord: initialCordPath(),
  },
  {
    label: 'Gather all the cord slack on the front side of the paddle',
    duration: 1.8,
    easing: 'easeInOut',
    cord: gatherSlackPath(),
  },
  {
    label: 'Push a bight of the slack back through the hole, front to back',
    duration: 2.2,
    easing: 'easeOut',
    cord: bightThroughHolePath(),
  },
  {
    label: 'The bight emerges at the rear — a loop of cord behind the paddle',
    duration: 1.8,
    easing: 'easeOut',
    cord: bightEmergedPath(),
  },
  {
    label: 'Stretch the bight over the short (80mm) edge of the paddle',
    duration: 2.5,
    easing: 'easeInOut',
    cord: stretchOverEdgePath(),
  },
  {
    label: 'Pull the bight back to the front — the loop now rings the paddle body',
    duration: 2.2,
    easing: 'easeInOut',
    cord: aroundBodyPath(),
  },
  {
    label: 'Slide the loop off the edge — the cord is free!',
    duration: 2.6,
    easing: 'easeOut',
    cord: solvedCordPath(),
  },
];

export function updateAnimation(objects, state) {
  const { step, prevStep, t, stepIndex } = resolveStep(animationSteps, state, {
    arrowManager: objects.arrowManager,
    arrowConfigs,
  });

  // Highlight the cord while it is being worked (every step after the look)
  highlights.set(objects.cord.mesh, stepIndex >= 1, 0x4488ff, 0.3);

  applyStepTransforms(objects, prevStep, step, t, {
    cord: { target: 'cord', kind: 'cordPoints' },
  });
}

export function createSVGDiagram(container) {
  const s = svg.createSVG(container, 500, 380);

  const SURFACE = 'var(--dia-surface, #fbf7ee)';
  const CORD = 'var(--dia-cord, #1f57c4)';
  const WOOD = 'var(--dia-wood, #b07d52)';
  const FAINT = 'var(--dia-faint, #c9bda7)';
  const RIGID = 'var(--dia-rigid, #8a8275)';
  const WASH = 'var(--dia-wash, #ece3d0)';
  const RING = 'var(--dia-ring, #b97d12)';

  svg.text(s, 250, 25, "Shepherd's Yoke — Initial State", {
    fontSize: 14, anchor: 'middle', fontWeight: 'bold',
  });

  // Paddle (front view)
  const px = 170;
  const py = 100;
  const pw = 160;
  const ph = 90;

  svg.rect(s, px, py, pw, ph, {
    fill: WOOD,
    stroke: WOOD,
    strokeWidth: 2,
    rx: 5,
  });

  // Hole
  const holeX = px + pw / 2;
  const holeY = py + ph / 2;
  svg.circle(s, holeX, holeY, 12, {
    fill: SURFACE,
    stroke: WOOD,
    strokeWidth: 1.5,
  });

  // Cord loop (front side) — animated cord threading; this is the primary
  // moving element, captured for the timeline updater.
  const cordLoop = svg.animatedPath(s, `M ${holeX - 8} ${holeY + 5} Q ${holeX - 50} ${holeY + 60} ${holeX} ${holeY + 75} Q ${holeX + 50} ${holeY + 60} ${holeX + 8} ${holeY + 5}`, {
    stroke: CORD,
    strokeWidth: 3,
    fill: 'none',
    animDelay: 0,
    animDuration: 0.8,
  });

  // Cord through hole indicators
  svg.circle(s, holeX - 5, holeY + 2, 3, { fill: CORD, stroke: 'none' });
  svg.circle(s, holeX + 5, holeY + 2, 3, { fill: CORD, stroke: 'none' });

  // Cord (back side, dashed) — animated cord threading
  svg.animatedPath(s, `M ${holeX - 8} ${holeY - 5} Q ${holeX - 40} ${holeY + 50} ${holeX} ${holeY + 65} Q ${holeX + 40} ${holeY + 50} ${holeX + 8} ${holeY - 5}`, {
    stroke: CORD,
    strokeWidth: 2,
    fill: 'none',
    dashArray: '6,4',
    animDelay: 0.8,
    animDuration: 0.8,
  });

  // A small bead marking the bight that travels during the solution. It starts
  // near the hole and is moved along 2D keyframes by the updater.
  const bead = svg.ellipse(s, holeX, holeY + 40, 7, 7, { stroke: CORD, strokeWidth: 2.5, fill: 'none' });
  bead.style.transition = 'cx .12s linear, cy .12s linear';

  // Labels
  svg.label(s, 100, 90, px, py + 10, 'Wooden paddle');
  svg.label(s, holeX, py - 12, holeX, holeY - 12, '20mm hole');
  svg.label(s, 400, 200, holeX + 45, holeY + 50, 'Cord loop');

  // Dimensions
  svg.dimensionArrow(s, px, py + ph + 25, px + pw, py + ph + 25, '150mm');
  svg.dimensionArrow(s, px - 25, py, px - 25, py + ph, '80mm');

  // Side view inset
  svg.rect(s, 20, 245, 150, 110, {
    fill: WASH,
    stroke: FAINT,
    strokeWidth: 1,
    rx: 4,
  });
  svg.text(s, 95, 262, 'Side view', { fontSize: 10, anchor: 'middle', fill: RIGID });

  // Paddle side view (thin rectangle)
  svg.rect(s, 60, 285, 70, 10, { fill: WOOD, stroke: WOOD, strokeWidth: 1.5 });

  // Cord going through
  svg.line(s, 95, 280, 95, 285, { stroke: CORD, strokeWidth: 2 });
  svg.path(s, 'M 85 280 Q 95 270 105 280', { stroke: CORD, strokeWidth: 2, fill: 'none' });
  svg.line(s, 95, 295, 95, 300, { stroke: CORD, strokeWidth: 2 });
  svg.path(s, 'M 85 300 Q 95 310 105 300', { stroke: CORD, strokeWidth: 2, fill: 'none' });

  // Motion arrows showing key movements (toggled per step by the updater)
  const arrowPush = svg.motionArrow(s, holeX, holeY + 5, holeX, holeY - 20, { label: 'Push through', curvature: 0.3 });
  const arrowStretch = svg.motionArrow(s, holeX + 10, holeY - 20, px + pw + 10, holeY - 10, { label: 'Stretch over edge', curvature: 0.3 });
  const arrowFree = svg.motionArrow(s, px + pw + 10, holeY - 10, holeX, py + ph + 5, { label: 'Pull free', curvature: 0.3 });

  // Hand icon near manipulation point
  svg.handIcon(s, holeX + 35, holeY + 30, { scale: 0.6, rotation: -30 });

  // Step badges (highlighted per phase by the updater)
  const badge1 = svg.stepBadge(s, holeX - 40, holeY - 15, 1, 3);
  svg.actionLabel(s, holeX - 40, holeY - 2, 'Push loop through hole');
  const badge2 = svg.stepBadge(s, px + pw + 15, holeY - 30, 2, 3);
  svg.actionLabel(s, px + pw + 15, holeY - 17, 'Stretch over edge');
  const badge3 = svg.stepBadge(s, holeX, py + ph + 10, 3, 3);
  svg.actionLabel(s, holeX, py + ph + 23, 'Pull free');
  const badges = [badge1, badge2, badge3];

  // Key insight
  svg.calloutBox(s, 20, 340, 460, 30, 'Key: The short edge of the paddle can fit through the cord loop', {
    fontSize: 10,
  });

  // ---- Timeline updater: sync the 2D bead + badges + arrows to the solution.
  // animationSteps: 0 look, 1 gather slack, 2 push bight through hole,
  // 3 bight emerges at rear, 4 stretch over short edge, 5 pull to front
  // (loop around body), 6 slide off — free.
  // Bead keyframes mirror the 3D bight: down into the gathered slack, up
  // through the hole, out over the right (short) edge, onto the body, then
  // down to hang free below the paddle's right end.
  const beadFrames = [
    [holeX, holeY + 40],            // 0: bight resting in the front loop
    [holeX, holeY + 55],            // 1: slack gathered low at the front
    [holeX, holeY],                 // 2: bight folded into the hole
    [holeX, holeY - 25],            // 3: bight emerged at the rear (drawn above)
    [px + pw + 12, holeY - 8],      // 4: stretched over the short (right) edge
    [holeX + 55, holeY + 5],        // 5: back at the front, ringing the body
    [px + pw - 20, py + ph + 15],   // 6: free, hanging below the right end
  ];
  return function update(state) {
    const [bx, by] = svg.lerpFrames(beadFrames, state.stepIndex, state.stepProgress);
    if (bead) {
      bead.setAttribute('cx', bx);
      bead.setAttribute('cy', by);
    }
    const i = Math.max(0, Math.min(state.stepIndex ?? 0, beadFrames.length - 1));
    // Checkpoint phase: gather+push+emerge -> badge 1, stretch -> badge 2,
    // pull-around + slide-off -> badge 3. Step 0 has no active badge.
    const phase = i < 1 ? -1 : i <= 3 ? 0 : i === 4 ? 1 : 2;
    badges.forEach((b, k) => svg.highlight(b, k === phase, { dim: 0.3, color: CORD }));
    svg.highlight(arrowPush, phase === 0, { glow: false, dim: 0 });
    svg.highlight(arrowStretch, phase === 1, { glow: false, dim: 0 });
    svg.highlight(arrowFree, phase === 2, { glow: false, dim: 0 });
    // Subtle emphasis of the active cord loop during the manipulation steps.
    if (cordLoop) svg.highlight(cordLoop, i >= 1, { glow: false, dim: 0.85 });
  };
}

export function dispose() {
  highlights.dispose();
}
