import * as THREE from 'three';
import { createMaterials } from '../lib/materials.js';
import { createBall, createBlock } from '../lib/components.js';
import { CordPath } from '../lib/cord.js';
import { enableShadowsOnGroup } from '../lib/scene.js';
import { StepArrowManager } from '../lib/arrow-helpers.js';
import { resolveStep, HighlightCache } from '../lib/puzzle-helpers.js';
import * as svg from '../lib/svg.js';

export const metadata = {
  id: 19,
  name: 'The Tangle Dance',
  difficulty: 'Intermediate-Advanced',
  principle: 'Conway rational tangles — the fraction is a complete invariant',
  type: 'Sequential transformation',
  description: 'Two cords span a square frame, their ball handles seated in four corner cups. Only two moves exist — twist the right-hand handles (x → x + 1) or quarter-turn the whole frame (x → −1/x) — so every reachable state is a single Conway fraction. Solving is Euclid’s algorithm run by hand: rotate when positive, twist when negative, and 3/2 descends to 0.',
  cameraPosition: [0, 120, 220],
};

// ---- Dimensions shared with scad/puzzle_19 (SCAD mirrors these as p19_*) ----
const FRAME_W = 170;    // frame plate outer width (square)
const FRAME_BAR = 18;   // frame bar width
const FRAME_T = 10;     // plate thickness
const HANDLE_D = 16;    // ball handle diameter
const CUP_D = 17;       // corner cup socket diameter
const CORD_R = 2;       // 4mm braided cord

const SOCKET_XY = 52;   // cup centers at (+/-SOCKET_XY, +/-SOCKET_XY), frame-local

// The frame is presented tilted back like a board on an easel, so the camera
// reads the tangle face-on while quarter-turn corners still clear the ground.
const PLATE_ELEV = 66;                          // tilt-group origin height
const TILT_X = (32 * Math.PI) / 180 - Math.PI / 2; // plate 32 deg from horizontal

// ---- Tangle pictures --------------------------------------------------------
// Each display state is a pair of 14-point strands in "world view" coordinates:
// x right, y up as the solver sees the plate, z the over/under weave riding at
// z = 10 in front of the plate face (over = 14, under = 6, cup seats at 12).
// ALL states share the 14-point count so every keyframe morph is well-defined.
// Point order is fixed per cord across the whole dance (point 0 = the end that
// starts in the SE cup for blue, NW for red) so twists move only the two
// endpoints that physically lift, cross, and re-seat.

// 3/2 = 1 + 1/2: a two-crossing vertical twist stack plus one right-hand
// crossing (the setup card's T,T,R,T,T relaxed to three crossings).
// Blue runs SE -> right crossing -> down the stack's right side -> NE.
const BLUE_32 = [
  [52, -52, 12], [42, -34, 10], [34, -14, 11], [28, 0, 14], [12, 14, 11],
  [-6, 30, 9], [-16, 16, 6], [-26, 0, 10], [-16, -16, 14], [-6, -30, 11],
  [12, -20, 9], [28, 0, 6], [40, 24, 10], [52, 52, 12],
];
// Red runs NW -> down the stack's left side -> SW.
const RED_32 = [
  [-52, 52, 12], [-44, 44, 10], [-34, 36, 10], [-26, 28, 10], [-21, 22, 11],
  [-16, 16, 14], [-6, 0, 11], [-11, -8, 9], [-16, -16, 6], [-21, -22, 9],
  [-26, -28, 10], [-34, -36, 10], [-44, -44, 10], [-52, -52, 12],
];

// 1/3: a tidy three-crossing vertical twist stack. Blue SW -> NE, red SE -> NW.
const BLUE_13 = [
  [-52, -52, 12], [-46, -46, 11], [-38, -42, 10], [-24, -36, 10], [-10, -28, 9],
  [0, -20, 6], [10, -10, 10], [0, 0, 14], [-10, 10, 10], [0, 20, 6],
  [10, 28, 9], [24, 36, 10], [40, 44, 11], [52, 52, 12],
];
const RED_13 = [
  [52, -52, 12], [46, -46, 11], [38, -42, 10], [24, -36, 10], [10, -28, 11],
  [0, -20, 14], [-10, -10, 10], [0, 0, 6], [10, 10, 10], [0, 20, 14],
  [-10, 28, 11], [-24, 36, 10], [-40, 44, 11], [-52, 52, 12],
];

// -2: two horizontal crossings. Blue NW -> NE, red SW -> SE.
const BLUE_M2 = [
  [-52, 52, 12], [-46, 44, 11], [-38, 32, 10], [-28, 16, 10], [-22, 8, 9],
  [-15, 0, 6], [0, -10, 10], [15, 0, 14], [22, 8, 11], [28, 16, 10],
  [38, 32, 10], [46, 44, 11], [50, 48, 12], [52, 52, 12],
];
const RED_M2 = [
  [-52, -52, 12], [-46, -44, 11], [-38, -32, 10], [-28, -16, 10], [-22, -8, 11],
  [-15, 0, 14], [0, 10, 10], [15, 0, 6], [22, -8, 9], [28, -16, 10],
  [38, -32, 10], [46, -44, 11], [50, -48, 12], [52, -52, 12],
];

// -1: a single crossing. Blue NW -> SE beneath, red SW -> NE on top.
const BLUE_M1 = [
  [-52, 52, 12], [-44, 44, 11], [-34, 34, 10], [-24, 24, 10], [-16, 16, 9],
  [-8, 8, 7], [0, 0, 6], [8, -8, 7], [16, -16, 9], [24, -24, 10],
  [34, -34, 10], [44, -44, 11], [49, -49, 12], [52, -52, 12],
];
const RED_M1 = [
  [-52, -52, 12], [-44, -44, 11], [-34, -34, 10], [-24, -24, 10], [-16, -16, 11],
  [-8, -8, 13], [0, 0, 14], [8, 8, 13], [16, 16, 11], [24, 24, 10],
  [34, 34, 10], [44, 44, 11], [49, 49, 12], [52, 52, 12],
];

// 0: two parallel horizontal strands — blue back on top, exactly the card's start.
const BLUE_0 = [
  [-52, 52, 12], [-46, 51, 11], [-38, 49, 10], [-28, 48, 10], [-18, 47, 10],
  [-8, 46, 10], [0, 46, 10], [8, 46, 10], [18, 47, 10], [28, 48, 10],
  [38, 49, 10], [46, 51, 11], [50, 52, 11], [52, 52, 12],
];
const RED_0 = BLUE_0.map(([x, y, z]) => [x, -y, z]);

// Lifted out of the cups: same plan view, raised weave-free above the plate.
const LIFT_Z = [44, 38, 34, 31, 29, 28, 28, 28, 28, 29, 31, 34, 38, 44];
const BLUE_LIFT = BLUE_0.map(([x, y], i) => [x, y, LIFT_Z[i]]);
const RED_LIFT = RED_0.map(([x, y], i) => [x, y, LIFT_Z[i]]);

// Rotate a picture a quarter-turn clockwise (what the frame does to the world
// view) or counter-clockwise (what converts a world view into frame-local
// coordinates once the frame has been turned clockwise that many times).
const rotCW = pts => pts.map(([x, y, z]) => [y, -x, z]);
function rotCCW(pts, turns) {
  return pts.map(([x, y, z]) => {
    for (let k = 0; k < turns; k++) [x, y] = [-y, x];
    return [x, y, z];
  });
}

// Frame-local cord keyframes. During R steps the cords ride the frame rigidly
// (same array as the step before); during T steps they morph in place.
const A_32 = BLUE_32;               const B_32 = RED_32;               // steps 0-1
const A_13 = rotCCW(BLUE_13, 1);    const B_13 = rotCCW(RED_13, 1);    // steps 2-3
const A_M2 = rotCCW(BLUE_M2, 2);    const B_M2 = rotCCW(RED_M2, 2);    // step 4
const A_M1 = rotCCW(BLUE_M1, 2);    const B_M1 = rotCCW(RED_M1, 2);    // step 5
const A_0 = rotCCW(BLUE_0, 2);      const B_0 = rotCCW(RED_0, 2);      // step 6
const A_LIFT = rotCCW(BLUE_LIFT, 2); const B_LIFT = rotCCW(RED_LIFT, 2); // step 7

// World-view state table shared by the 2D diagram. cross entries name the
// over-strand and the control-point index sitting exactly on the crossing.
const CROSS_32 = [{ over: 'red', i: 5 }, { over: 'blue', i: 8 }, { over: 'blue', i: 3 }];
const CROSS_13 = [{ over: 'red', i: 5 }, { over: 'blue', i: 7 }, { over: 'red', i: 9 }];
const CROSS_M2 = [{ over: 'red', i: 5 }, { over: 'blue', i: 7 }];
const CROSS_M1 = [{ over: 'red', i: 6 }];

const STATES_2D = [
  { frac: '3/2', move: null, blue: BLUE_32, red: RED_32, cross: CROSS_32 },
  { frac: '−2/3', move: 'R', blue: rotCW(BLUE_32), red: rotCW(RED_32), cross: CROSS_32 },
  { frac: '1/3', move: 'T', blue: BLUE_13, red: RED_13, cross: CROSS_13 },
  { frac: '−3', move: 'R', blue: rotCW(BLUE_13), red: rotCW(RED_13), cross: CROSS_13 },
  { frac: '−2', move: 'T', blue: BLUE_M2, red: RED_M2, cross: CROSS_M2 },
  { frac: '−1', move: 'T', blue: BLUE_M1, red: RED_M1, cross: CROSS_M1 },
  { frac: '0', move: 'T', blue: BLUE_0, red: RED_0, cross: [] },
  { frac: '0', move: null, blue: BLUE_0, red: RED_0, cross: [] },
];

// ---- 3D construction ---------------------------------------------------------
function buildFrame(mats) {
  const frame = new THREE.Group();
  const barOff = (FRAME_W - FRAME_BAR) / 2;
  const sideLen = FRAME_W - 2 * FRAME_BAR;

  const barSpecs = [
    [FRAME_W, FRAME_BAR, 0, barOff],   // top
    [FRAME_W, FRAME_BAR, 0, -barOff],  // bottom
    [FRAME_BAR, sideLen, -barOff, 0],  // left
    [FRAME_BAR, sideLen, barOff, 0],   // right
  ];
  for (const [w, h, x, y] of barSpecs) {
    const bar = createBlock(w, h, FRAME_T, mats.wood);
    bar.position.set(x, y, 0);
    frame.add(bar);
  }

  // Corner gussets carry the cup sockets across the open interior corners.
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      const gusset = createBlock(36, 36, FRAME_T, mats.wood);
      gusset.position.set(sx * 56, sy * 56, 0);
      frame.add(gusset);

      const cup = new THREE.Mesh(
        new THREE.CylinderGeometry(CUP_D / 2 + 2.5, CUP_D / 2 + 1, 7, 28),
        mats.darkWood,
      );
      cup.rotation.x = Math.PI / 2;
      cup.position.set(sx * SOCKET_XY, sy * SOCKET_XY, FRAME_T / 2 + 1.5);
      frame.add(cup);
    }
  }
  return frame;
}

function buildPuzzle(mats) {
  const frame = buildFrame(mats);

  const cordA = new CordPath(A_32, { radius: CORD_R, material: mats.cord });
  cordA.addTo(frame);
  const cordB = new CordPath(B_32, { radius: CORD_R, material: mats.cordRed });
  cordB.addTo(frame);

  // Ball handles ride the cord endpoints (color-matched to their cord).
  const handles = {};
  const handleDefs = [
    ['handleA1', mats.blue, A_32[0]],
    ['handleA2', mats.blue, A_32[A_32.length - 1]],
    ['handleB1', mats.red, B_32[0]],
    ['handleB2', mats.red, B_32[B_32.length - 1]],
  ];
  for (const [name, mat, p] of handleDefs) {
    const ball = createBall(HANDLE_D, mat);
    ball.position.set(p[0], p[1], p[2] + 1);
    frame.add(ball);
    handles[name] = ball;
  }

  return { frame, cordA, cordB, ...handles };
}

export function create3DScene() {
  const mats = createMaterials();
  const group = new THREE.Group();

  const tilt = new THREE.Group();
  tilt.position.set(0, PLATE_ELEV, 0);
  tilt.rotation.x = TILT_X;
  group.add(tilt);

  const parts = buildPuzzle(mats);
  tilt.add(parts.frame);

  enableShadowsOnGroup(group);
  return group;
}

export function createAnimScene() {
  const mats = createMaterials();
  const group = new THREE.Group();

  const tilt = new THREE.Group();
  tilt.position.set(0, PLATE_ELEV, 0);
  tilt.rotation.x = TILT_X;
  group.add(tilt);

  const parts = buildPuzzle(mats);
  tilt.add(parts.frame);

  enableShadowsOnGroup(group);
  // Arrows live on the tilt group (plate coordinates) so they do not spin
  // with the frame: "right edge" always means the solver's right.
  const arrowManager = new StepArrowManager(tilt);

  return {
    group,
    objects: {
      frame: parts.frame,
      cordA: parts.cordA,
      cordB: parts.cordB,
      handleA1: parts.handleA1,
      handleA2: parts.handleA2,
      handleB1: parts.handleB1,
      handleB2: parts.handleB2,
      arrowManager,
    },
  };
}

// ---- Animation -----------------------------------------------------------------
const ROTATE_ARROW = {
  arrows: [{
    type: 'curved',
    points: [[-91, 53, 20], [-53, 91, 20], [0, 105, 20], [53, 91, 20], [91, 53, 20]],
    opts: { color: 0xffcc44, radius: 1.2, headWidth: 5, headLength: 10 },
  }],
};
const TWIST_ARROWS = {
  arrows: [
    { type: 'curved', points: [[56, -40, 16], [76, 0, 34], [56, 40, 16]], opts: { color: 0x44ccff } },
    { type: 'curved', points: [[46, 40, 22], [30, 0, 36], [46, -40, 22]], opts: { color: 0xffcc44 } },
  ],
};
const arrowConfigs = {
  1: ROTATE_ARROW,
  2: TWIST_ARROWS,
  3: ROTATE_ARROW,
  4: TWIST_ARROWS,
  5: TWIST_ARROWS,
  6: TWIST_ARROWS,
  7: { arrows: [
    { from: [-52, 52, 20], to: [-52, 52, 58], opts: { color: 0x44ff88 } },
    { from: [52, 52, 20], to: [52, 52, 58], opts: { color: 0x44ff88 } },
    { from: [-52, -52, 20], to: [-52, -52, 58], opts: { color: 0x44ff88 } },
    { from: [52, -52, 20], to: [52, -52, 58], opts: { color: 0x44ff88 } },
  ]},
};

export const animationSteps = [
  {
    label: 'Preset: fraction 3/2 — the whole state is one number',
    duration: 3.0,
    frameRotZ: 0, cordA: A_32, cordB: B_32,
  },
  {
    label: 'Rotate 90° — the fraction inverts: −2/3',
    duration: 2.5,
    easing: 'easeInOut',
    frameRotZ: -Math.PI / 2, cordA: A_32, cordB: B_32,
  },
  {
    label: 'Twist the right handles — −2/3 + 1 = 1/3',
    duration: 2.5,
    frameRotZ: -Math.PI / 2, cordA: A_13, cordB: B_13, twist: true,
  },
  {
    label: 'Rotate — 1/3 inverts to −3',
    duration: 2.5,
    easing: 'easeInOut',
    frameRotZ: -Math.PI, cordA: A_13, cordB: B_13,
  },
  {
    label: 'Twist — −3 + 1 = −2',
    duration: 2.5,
    frameRotZ: -Math.PI, cordA: A_M2, cordB: B_M2, twist: true,
  },
  {
    label: 'Twist — −1',
    duration: 2.0,
    frameRotZ: -Math.PI, cordA: A_M1, cordB: B_M1, twist: true,
  },
  {
    label: 'Twist — 0: the strands run parallel',
    duration: 2.5,
    frameRotZ: -Math.PI, cordA: A_0, cordB: B_0, twist: true,
  },
  {
    label: 'Lift the handles out — untangled',
    duration: 2.5,
    easing: 'easeOut',
    frameRotZ: -Math.PI, cordA: A_LIFT, cordB: B_LIFT,
  },
];

const highlights = new HighlightCache();

export function updateAnimation(objects, state) {
  const { step, prevStep, t } = resolveStep(animationSteps, state, {
    arrowManager: objects.arrowManager,
    arrowConfigs,
  });

  // Frame quarter-turns: a single-axis spin, so a plain lerp is exact.
  const rz0 = prevStep.frameRotZ ?? 0;
  const rz1 = step.frameRotZ ?? 0;
  objects.frame.rotation.z = rz0 + (rz1 - rz0) * t;

  // Cords, plus the handles riding their endpoints. Twist steps arc the moving
  // control points out of the plate plane (sin bump) so the crossing handles
  // lift over each other instead of passing through.
  const lift = step.twist ? Math.sin(Math.PI * t) : 0;
  const cordFields = [
    ['cordA', 'handleA1', 'handleA2'],
    ['cordB', 'handleB1', 'handleB2'],
  ];
  for (const [field, h0, h1] of cordFields) {
    const from = prevStep[field];
    const to = step[field];
    if (!from || !to) continue;
    const pts = CordPath.interpolatePoints(from, to, t);
    if (lift > 0) {
      for (let i = 0; i < pts.length; i++) {
        const d = Math.hypot(to[i][0] - from[i][0], to[i][1] - from[i][1]);
        pts[i][2] += lift * Math.min(d * 0.35, 16);
      }
    }
    objects[field].update(pts);

    const last = pts.length - 1;
    objects[h0].position.set(pts[0][0], pts[0][1], pts[0][2] + 1);
    objects[h1].position.set(pts[last][0], pts[last][1], pts[last][2] + 1);

    // Glow the handle being lifted, crossed, and re-seated this step.
    const moved0 = Math.hypot(to[0][0] - from[0][0], to[0][1] - from[0][1]) > 4;
    const movedN = Math.hypot(to[last][0] - from[last][0], to[last][1] - from[last][1]) > 4;
    highlights.set(objects[h0], Boolean(step.twist) && moved0, 0xffcc44, 0.5);
    highlights.set(objects[h1], Boolean(step.twist) && movedN, 0xffcc44, 0.5);
  }
}

// ---- 2D diagram ----------------------------------------------------------------
export function createSVGDiagram(container) {
  const s = svg.createSVG(container, 500, 430);
  const SVG_NS = 'http://www.w3.org/2000/svg';

  const INK = 'var(--dia-ink, #24211a)';
  const INKSOFT = 'var(--dia-inksoft, #6a6151)';
  const RIGID = 'var(--dia-rigid, #8a8275)';
  const FAINT = 'var(--dia-faint, #c9bda7)';
  const CORD = 'var(--dia-cord, #1f57c4)';
  const NEG = 'var(--dia-neg, #cf3a26)';
  const POS = 'var(--dia-pos, #2f8f43)';
  const SURFACE = 'var(--dia-surface, #fbf7ee)';

  svg.text(s, 250, 22, 'The Tangle Dance — the fraction is the state', {
    fontSize: 14, anchor: 'middle', fontWeight: 'bold',
  });

  // Draw one tangle state: both strands continuous first (under layer), then
  // the canonical crossing idiom at each crossing — a surface-colored occlusion
  // stroke along the over-strand's tangent, over-segment redrawn last.
  function drawTangleState(parent, st, cx, cy, k, sw) {
    const g = document.createElementNS(SVG_NS, 'g');
    parent.appendChild(g);
    const X = p => +(cx + p[0] * k).toFixed(1);
    const Y = p => +(cy - p[1] * k).toFixed(1);
    const polyD = pts => pts.map((p, i) => `${i ? 'L' : 'M'} ${X(p)} ${Y(p)}`).join(' ');
    const strand = (pts, color) => {
      const el = svg.path(g, polyD(pts), {
        stroke: color, strokeWidth: sw, strokeLinecap: 'round',
      });
      el.setAttribute('stroke-linejoin', 'round');
      return el;
    };

    strand(st.blue, CORD);
    strand(st.red, NEG);

    for (const c of st.cross) {
      const pts = c.over === 'blue' ? st.blue : st.red;
      const color = c.over === 'blue' ? CORD : NEG;
      const seg = pts.slice(c.i - 1, c.i + 2);
      const ang = Math.atan2(Y(seg[2]) - Y(seg[0]), X(seg[2]) - X(seg[0]));
      const L = sw * 1.2;
      const occ = svg.line(g,
        X(seg[1]) - Math.cos(ang) * L, Y(seg[1]) - Math.sin(ang) * L,
        X(seg[1]) + Math.cos(ang) * L, Y(seg[1]) + Math.sin(ang) * L,
        { stroke: SURFACE, strokeWidth: sw + 4 });
      occ.setAttribute('stroke-linecap', 'round');
      strand(seg, color);
    }

    // Handle dots at the strand endpoints show which cup holds which cord.
    for (const [pts, color] of [[st.blue, CORD], [st.red, NEG]]) {
      svg.circle(g, X(pts[0]), Y(pts[0]), sw + 1, { fill: color, stroke: 'none' });
      svg.circle(g, X(pts[pts.length - 1]), Y(pts[pts.length - 1]), sw + 1, { fill: color, stroke: 'none' });
    }
    return g;
  }

  // ---- Tangle box with four fixed ports (left) ----
  const BOX_CX = 120;
  const BOX_CY = 136;
  const BOX_K = 1.55;
  svg.rect(s, 28, 44, 184, 184, { stroke: RIGID, strokeWidth: 1.5, rx: 8 });
  for (const px of [-1, 1]) {
    for (const py of [-1, 1]) {
      svg.circle(s, BOX_CX + px * SOCKET_XY * BOX_K, BOX_CY - py * SOCKET_XY * BOX_K, 6.5, {
        stroke: RIGID, strokeWidth: 1.2, fill: SURFACE,
      });
    }
  }
  const bigGlyphs = STATES_2D.map((st, idx) => {
    const g = drawTangleState(s, st, BOX_CX, BOX_CY, BOX_K, 3);
    if (idx === STATES_2D.length - 1) {
      svg.text(g, BOX_CX, BOX_CY - 6, '✓', {
        fontSize: 26, anchor: 'middle', fontWeight: 'bold', fill: POS,
      });
    }
    g.style.opacity = idx === 0 ? '1' : '0';
    return g;
  });
  svg.text(s, BOX_CX, 240, 'the tangle box — four fixed ports', {
    fontSize: 8.5, anchor: 'middle', fill: INKSOFT,
  });

  // ---- Live fraction readout + the two move laws ----
  svg.text(s, BOX_CX, 258, 'fraction', { fontSize: 9, anchor: 'middle', fill: RIGID });
  const readout = svg.text(s, BOX_CX, 288, '3/2', {
    fontSize: 30, anchor: 'middle', fontWeight: 'bold', fill: CORD,
  });
  const lawT = svg.text(s, BOX_CX, 314, 'T twist right: x → x + 1', {
    fontSize: 10.5, anchor: 'middle', fill: INK,
  });
  const lawR = svg.text(s, BOX_CX, 330, 'R rotate 90°: x → −1/x', {
    fontSize: 10.5, anchor: 'middle', fill: INK,
  });
  svg.text(s, BOX_CX, 352, 'positive → rotate · negative → twist · zero → stop', {
    fontSize: 9, anchor: 'middle', fill: INKSOFT,
  });

  // ---- Fraction ladder (right): one rung per state, badge per move ----
  const RAIL_X = 291;
  const rungY = k => 64 + k * 44;
  svg.text(s, 378, 50, 'the descent', { fontSize: 11, anchor: 'middle', fontWeight: 'bold', fill: INK });
  svg.line(s, RAIL_X, rungY(0), RAIL_X, rungY(7), { stroke: FAINT, strokeWidth: 1.5 });

  const MOVES = [null, 'R', 'T', 'R', 'T', 'T', 'T', null];
  const rungGroups = STATES_2D.map((st, k) => {
    const g = document.createElementNS(SVG_NS, 'g');
    s.appendChild(g);
    const y = rungY(k);
    if (k === 0) {
      svg.circle(g, RAIL_X, y, 4, { fill: FAINT, stroke: 'none' });
    } else if (k === 7) {
      svg.circle(g, RAIL_X, y, 10, { stroke: POS, strokeWidth: 2, fill: SURFACE });
      svg.text(g, RAIL_X, y, '✓', {
        fontSize: 11, anchor: 'middle', dominantBaseline: 'central', fontWeight: 'bold', fill: POS,
      });
    } else {
      svg.stepBadge(g, RAIL_X, y, k, null, { radius: 10 });
    }
    drawTangleState(g, st, 326, y, 0.185, 2);
    const label = k === 0 ? 'preset  3/2'
      : k === 7 ? 'lift out — solved'
      : `${MOVES[k]} → ${st.frac}`;
    svg.text(g, 352, y + 4, label, { fontSize: 12, fill: INK });
    return g;
  });

  svg.calloutBox(s, 28, 394, 444, 28,
    'Conway 1970: equal fractions mean the same tangle — the number forgets nothing',
    { fontSize: 9.5 });

  // ---- Timeline updater ----
  const FRACS = STATES_2D.map(st => st.frac);

  return function update(state) {
    if (!state) return;
    const i = Math.max(0, Math.min(state.stepIndex | 0, STATES_2D.length - 1));
    const p = Math.max(0, Math.min(state.stepProgress ?? 0, 1));

    // Big readout flips mid-move; lands on green at zero.
    const showTarget = i === 0 || p >= 0.55;
    const frac = showTarget ? FRACS[i] : FRACS[i - 1];
    readout.textContent = frac;
    readout.setAttribute('fill', frac === '0' ? POS : CORD);

    // Crossfade the tangle-box glyph from the previous state to this one.
    bigGlyphs.forEach((g, k) => {
      let op = 0;
      if (k === i) op = i === 0 ? 1 : p;
      else if (k === i - 1) op = 1 - p;
      g.style.opacity = String(op);
    });

    // Spotlight the active rung and the law being applied.
    rungGroups.forEach((g, k) => svg.highlight(g, k === i, { dim: 0.35, color: CORD }));
    svg.highlight(lawT, MOVES[i] === 'T' || MOVES[i] === null, { dim: 0.4, glow: false });
    svg.highlight(lawR, MOVES[i] === 'R' || MOVES[i] === null, { dim: 0.4, glow: false });
  };
}

export function dispose() {
  highlights.dispose();
}
