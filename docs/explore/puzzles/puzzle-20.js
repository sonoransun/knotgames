import * as THREE from 'three';
import { createMaterials } from '../lib/materials.js';
import { createRod, createBall, createBlock, createRing } from '../lib/components.js';
import { CordPath } from '../lib/cord.js';
import { enableShadowsOnGroup } from '../lib/scene.js';
import { StepArrowManager } from '../lib/arrow-helpers.js';
import { resolveStep, applyStepTransforms, HighlightCache } from '../lib/puzzle-helpers.js';
import * as svg from '../lib/svg.js';

export const metadata = {
  id: 20,
  name: "The Granny's Downfall",
  difficulty: 'Advanced',
  principle: 'Connected sums — composite knots and chirality under composition',
  type: 'Identification / Assembly',
  description: 'Two closed six-crossing loops — a square knot (left trefoil # right trefoil) and a granny knot (left # left). Crossing number, genus, tricolorability, and the Alexander polynomial all agree; only the signature differs, and a printed mold board carved with the square-knot diagram proves it: exactly one loop seats flush.',
  cameraPosition: [0, 140, 200],
};

// ---- Dimensions shared with scad/puzzle_20 (SCAD mirrors these as p20_*) ----
const MOLD_W = 200;   // mold board width (x)
const MOLD_D = 120;   // mold board depth (z)
const MOLD_H = 14;    // mold board height (y)

const CORD_R = 2.5;       // 5mm braided cord
const CHANNEL_R = 2.8;    // dark inset channel path radius
const BRIDGE_W = 16;      // bridge block along the under-strand
const BRIDGE_H = 6;
const BRIDGE_D = 11;

// ---- Composite-knot geometry -----------------------------------------------
// A trefoil # trefoil control-point loop, built from the same parametrization
// as puzzle-11 (Mirror Gate): hand flips the weave coordinate, so 'L'/'R'
// really are mirror factors. Each factor keeps ALL of its trefoil except a
// short arc trimmed at one lobe apex; the two open mouths face each other and
// are spliced with two straight neck strands — the sum sphere's equator.
// The result is ONE closed loop with a fixed point count, so every animation
// keyframe (rumpled, stretched, flattened, seated, strained) morphs cleanly.
const LOBE_PTS = 17;      // control points kept per trefoil factor
const NECK_PTS = 3;       // control points per neck strand
const LOOP_PTS = 2 * (LOBE_PTS + NECK_PTS); // 40 — identical across ALL keyframes
const LOBE_GAP = 0.25;    // radians trimmed each side of the spliced apex
const LOBE_SPREAD = 3.9;  // factor center offset from the neck, trefoil units

function trefoilLocal(t, hand) {
  return {
    x: Math.sin(t) + 2 * Math.sin(2 * t),
    y: Math.cos(t) - 2 * Math.cos(2 * t),
    w: hand * -Math.sin(3 * t), // weave (over/under) coordinate
  };
}

// One truncated trefoil factor as normalized [nx, w, nz] triples.
// mouthDir = +1 puts the factor at nx = -LOBE_SPREAD with its mouth facing +x
// (left factor); -1 mirrors the placement (right factor). The mouth is made by
// trimming the arc around the t = PI lobe apex, then rotating the factor 90
// degrees in its plane — a rotation, so handedness is preserved.
function lobeArc(handLetter, mouthDir) {
  const hand = handLetter === 'R' ? 1 : -1;
  const pts = [];
  for (let i = 0; i < LOBE_PTS; i++) {
    const t = Math.PI + LOBE_GAP + (i * (2 * Math.PI - 2 * LOBE_GAP)) / (LOBE_PTS - 1);
    const p = trefoilLocal(t, hand);
    const rx = mouthDir > 0 ? -p.y : p.y;
    const rz = mouthDir > 0 ? p.x : -p.x;
    pts.push([rx - mouthDir * LOBE_SPREAD, p.w, rz]);
  }
  return pts;
}

// Closed control-point loop for the connected sum h1 # h2, normalized:
// nx in [-6.9, 6.9], nz in [-3, 3], w (weave) in [-1, 1].
function compositeKnotPoints(h1, h2) {
  const left = lobeArc(h1, 1);
  const right = lobeArc(h2, -1);
  const neck = (a, b) => {
    const pts = [];
    for (let k = 1; k <= NECK_PTS; k++) {
      const f = k / (NECK_PTS + 1);
      pts.push([
        a[0] + (b[0] - a[0]) * f,
        a[1] + (b[1] - a[1]) * f,
        a[2] + (b[2] - a[2]) * f,
      ]);
    }
    return pts;
  };
  return [
    ...left,
    ...neck(left[LOBE_PTS - 1], right[0]),   // neck strand, left mouth -> right mouth
    ...right,
    ...neck(right[LOBE_PTS - 1], left[0]),   // return neck strand
  ];
}

const BASE_A = compositeKnotPoints('L', 'R'); // square knot: mirror factors
const BASE_B = compositeKnotPoints('L', 'L'); // granny knot: matching factors

// Map normalized loop points into world space. weave scales the over/under
// coordinate into y; xStretch pulls the factors apart to expose the neck.
function placeLoop(base, { scale, weave, center, xStretch = 1 }) {
  const [cx, cy, cz] = center;
  return base.map(([nx, w, nz]) => [
    cx + nx * scale * xStretch,
    cy + w * weave,
    cz + nz * scale,
  ]);
}

// ---- Mold board -------------------------------------------------------------
// Flattened square-knot layout: factors at x = +/-LOBE_SPREAD*FLAT_SCALE.
const FLAT_SCALE = 13;
const SEAT_Y = MOLD_H;        // seated cord centerline rides the board surface
const SEAT_WEAVE = 5;         // overs at 19 (bridge groove), unders at 9 (tunnel)

// The three crossings of this trefoil parametrization sit at radius 1.5 from
// the factor center, at 120-degree spacing; after each factor's mouth
// rotation they land at these plane angles (degrees).
const CROSS_R = 1.5;
const CROSS_ANGLES_LEFT = [180, 300, 60];
const CROSS_ANGLES_RIGHT = [0, 120, 240];

function bridgeSpecs() {
  const specs = [];
  const r = CROSS_R * FLAT_SCALE;
  for (const [angles, side] of [[CROSS_ANGLES_LEFT, -1], [CROSS_ANGLES_RIGHT, 1]]) {
    for (const deg of angles) {
      const th = (deg * Math.PI) / 180;
      const dx = -Math.sin(th); // strand tangent at the crossing (in-plane)
      const dz = Math.cos(th);
      specs.push({
        x: side * LOBE_SPREAD * FLAT_SCALE + Math.cos(th) * r,
        z: Math.sin(th) * r,
        rotY: Math.atan2(-dz, dx),
      });
    }
  }
  return specs;
}

function createMold(mats) {
  const group = new THREE.Group();

  const board = createBlock(MOLD_W, MOLD_H, MOLD_D, mats.wood);
  board.position.y = MOLD_H / 2;
  group.add(board);

  // Dark inset channel tracing the flattened square-knot diagram (weave 0:
  // the carved groove is a constant-depth path; only the cord goes over/under).
  const channelPts = placeLoop(BASE_A, {
    scale: FLAT_SCALE, weave: 0, center: [0, MOLD_H - 1.8, 0],
  });
  const channel = createRod(channelPts, CHANNEL_R, mats.darkWood, true);
  group.add(channel);

  // Six bridges, one per crossing: tunnel beneath, open groove across the top.
  for (const spec of bridgeSpecs()) {
    const bridge = createBlock(BRIDGE_W, BRIDGE_H, BRIDGE_D, mats.darkWood);
    bridge.position.set(spec.x, MOLD_H + BRIDGE_H / 2 - 1, spec.z);
    bridge.rotation.y = spec.rotY;
    group.add(bridge);
  }

  return group;
}

// ---- Keyframe poses ----------------------------------------------------------
const A_HOVER = [0, 64, -26];   // loop A rest center (rumpled, front)
const B_HOVER = [0, 112, 22];   // loop B rest center (rumpled, back/top)
const NECK_STRETCH = 1.14;

const A_REST = placeLoop(BASE_A, { scale: 10, weave: 6.5, center: A_HOVER });
const A_STRETCH = placeLoop(BASE_A, { scale: 10, weave: 6.5, center: A_HOVER, xStretch: NECK_STRETCH });
const A_FLAT = placeLoop(BASE_A, { scale: FLAT_SCALE, weave: SEAT_WEAVE, center: [0, 46, 0] });
const A_SEATED = placeLoop(BASE_A, { scale: FLAT_SCALE, weave: SEAT_WEAVE, center: [0, SEAT_Y, 0] });

const B_REST = placeLoop(BASE_B, { scale: 10, weave: 6.5, center: B_HOVER });
const B_STRETCH = placeLoop(BASE_B, { scale: 10, weave: 6.5, center: B_HOVER, xStretch: NECK_STRETCH });
const B_END = placeLoop(BASE_B, { scale: 10, weave: 6.5, center: [0, 95, 26] });

// Loop B's failed seating attempt: the neck and the left factor drop flat into
// the channel, but the wrong-handed right factor cannot seat in ANY outline-
// preserving registration — flipping it is a symmetry of the trefoil that
// changes nothing — so the whole factor stands proud with inverted weave while
// the neck stays flat in its grooves. Same 40 points as every other keyframe.
function strainedBPoints() {
  const cy = 26;
  const PROUD = 14;
  return BASE_B.map(([nx, w, nz], i) => {
    const inRightLobe = i >= LOBE_PTS + NECK_PTS && i < 2 * LOBE_PTS + NECK_PTS;
    const y = inRightLobe ? cy - w * SEAT_WEAVE + PROUD : cy + w * SEAT_WEAVE;
    return [nx * FLAT_SCALE, y, nz * FLAT_SCALE + 8];
  });
}
const B_STRAINED = strainedBPoints();

// Factor centers at the stretched hover poses (for sum spheres + markers).
const FACTOR_DX = LOBE_SPREAD * 10 * NECK_STRETCH; // 44.5

// ---- Scenes ------------------------------------------------------------------
export function create3DScene() {
  const mats = createMaterials();
  const group = new THREE.Group();

  group.add(createMold(mats));

  const cordA = new CordPath(A_SEATED, { radius: CORD_R, material: mats.cord, closed: true });
  cordA.addTo(group);

  const cordB = new CordPath(placeLoop(BASE_B, { scale: 10, weave: 6.5, center: [0, 72, 10] }), {
    radius: CORD_R, material: mats.cordRed, closed: true,
  });
  cordB.addTo(group);

  enableShadowsOnGroup(group);
  return group;
}

function makeSumSphere(x, y, z) {
  const mat = new THREE.MeshStandardMaterial({
    color: 0x77bbee,
    transparent: true,
    opacity: 0,
    roughness: 0.25,
    depthWrite: false,
  });
  const sphere = createBall(74, mat);
  sphere.position.set(x, y, z);
  sphere.visible = false;
  return sphere;
}

function makeFactorMarker(mats, handLetter, x, y, z) {
  const base = handLetter === 'R' ? mats.blue : mats.red;
  const mat = base.clone();
  mat.transparent = true;
  mat.opacity = 0;
  mat.depthWrite = false;
  const ring = createRing(66, 2.5, mat);
  ring.rotation.x = Math.PI / 2;
  ring.position.set(x, y, z);
  ring.visible = false;
  return ring;
}

export function createAnimScene() {
  const mats = createMaterials();
  const group = new THREE.Group();

  group.add(createMold(mats));

  const cordA = new CordPath(A_REST, { radius: CORD_R, material: mats.cord, closed: true });
  cordA.addTo(group);
  const cordB = new CordPath(B_REST, { radius: CORD_R, material: mats.cordRed, closed: true });
  cordB.addTo(group);

  // Translucent sum spheres, one per loop, enclosing the left factor: the
  // loop punctures each sphere exactly twice — at the two neck strands.
  const sphereA = makeSumSphere(-FACTOR_DX, A_HOVER[1], A_HOVER[2]);
  const sphereB = makeSumSphere(-FACTOR_DX, B_HOVER[1], B_HOVER[2]);
  group.add(sphereA);
  group.add(sphereB);

  // Handedness markers circling each factor (red = left-handed, blue = right).
  const markerAL = makeFactorMarker(mats, 'L', -FACTOR_DX, A_HOVER[1], A_HOVER[2]);
  const markerAR = makeFactorMarker(mats, 'R', FACTOR_DX, A_HOVER[1], A_HOVER[2]);
  const markerBL = makeFactorMarker(mats, 'L', -FACTOR_DX, B_HOVER[1], B_HOVER[2]);
  const markerBR = makeFactorMarker(mats, 'L', FACTOR_DX, B_HOVER[1], B_HOVER[2]);
  for (const m of [markerAL, markerAR, markerBL, markerBR]) group.add(m);

  enableShadowsOnGroup(group);
  const arrowManager = new StepArrowManager(group);

  return {
    group,
    objects: {
      cordA, cordB, sphereA, sphereB,
      markerAL, markerAR, markerBL, markerBR,
      arrowManager,
    },
  };
}

// ---- Animation ----------------------------------------------------------------
const arrowConfigs = {
  // Pull each loop from opposite sides: the factors separate and the neck shows.
  1: { arrows: [
    { from: [-24, A_HOVER[1], A_HOVER[2]], to: [-52, A_HOVER[1], A_HOVER[2]], opts: { color: 0xffcc44 } },
    { from: [24, A_HOVER[1], A_HOVER[2]], to: [52, A_HOVER[1], A_HOVER[2]], opts: { color: 0xffcc44 } },
    { from: [-24, B_HOVER[1], B_HOVER[2]], to: [-52, B_HOVER[1], B_HOVER[2]], opts: { color: 0xffcc44 } },
    { from: [24, B_HOVER[1], B_HOVER[2]], to: [52, B_HOVER[1], B_HOVER[2]], opts: { color: 0xffcc44 } },
  ]},
  // A flattens and moves over the mold.
  3: { arrows: [
    { from: [0, 62, -22], to: [0, 50, -2], opts: { color: 0x44ccff } },
  ]},
  // A seats: crossing-by-crossing drops under the bridges.
  4: { arrows: [
    { from: [-46, 50, 0], to: [-46, 24, 0], opts: { color: 0x44cc66 } },
    { from: [46, 50, 0], to: [46, 24, 0], opts: { color: 0x44cc66 } },
  ]},
  // B blocked: the wrong-handed factor cannot enter the last bridges.
  5: { arrows: [
    { from: [58, 66, 8], to: [58, 46, 8], opts: { color: 0xdd4433 } },
  ]},
};

export const animationSteps = [
  {
    label: 'Two six-crossing loops — every familiar invariant agrees',
    duration: 3.0,
    cordA: A_REST, cordB: B_REST,
    sphereOpacity: 0, markerOpacity: 0,
  },
  {
    label: 'Find the necks — each loop is two trefoils joined',
    duration: 2.5,
    easing: 'easeOut',
    cordA: A_STRETCH, cordB: B_STRETCH,
    sphereOpacity: 1, markerOpacity: 0,
  },
  {
    label: "Check each factor's handedness — A: left+right, B: left+left",
    duration: 2.5,
    cordA: A_STRETCH, cordB: B_STRETCH,
    sphereOpacity: 1, markerOpacity: 1,
  },
  {
    label: 'Flatten A into its symmetric form',
    duration: 2.5,
    cordA: A_FLAT, cordB: B_STRETCH,
    sphereOpacity: 0, markerOpacity: 0,
  },
  {
    label: 'A seats crossing-by-crossing under the bridges',
    duration: 2.5,
    easing: 'easeOut',
    cordA: A_SEATED, cordB: B_STRETCH,
    sphereOpacity: 0, markerOpacity: 0,
  },
  {
    label: 'B refuses — the wrong-handed factor cannot enter the last bridges',
    duration: 3.0,
    easing: 'easeInOut',
    cordA: A_SEATED, cordB: B_STRAINED,
    sphereOpacity: 0, markerOpacity: 0,
  },
  {
    label: 'Composition is real: same counts, different knots — ask the right invariant',
    duration: 3.0,
    easing: 'easeOut',
    cordA: A_SEATED, cordB: B_END,
    sphereOpacity: 0, markerOpacity: 0,
  },
];

const transformSpec = {
  cordA: { target: 'cordA', kind: 'cordPoints' },
  cordB: { target: 'cordB', kind: 'cordPoints' },
};

const highlights = new HighlightCache();

export function updateAnimation(objects, state) {
  const { step, prevStep, t, stepIndex } = resolveStep(animationSteps, state, {
    arrowManager: objects.arrowManager,
    arrowConfigs,
  });

  applyStepTransforms(objects, prevStep, step, t, transformSpec);

  const lerpN = (a, b) => a + (b - a) * t;

  // Sum spheres fade in as the necks separate, fade out once identified.
  const sphereOp = lerpN(prevStep.sphereOpacity ?? 0, step.sphereOpacity ?? 0);
  for (const sphere of [objects.sphereA, objects.sphereB]) {
    if (!sphere) continue;
    sphere.material.opacity = sphereOp * 0.22;
    sphere.visible = sphereOp > 0.02;
  }

  // Handedness rings glow around each factor during the spiral test.
  const markerOp = lerpN(prevStep.markerOpacity ?? 0, step.markerOpacity ?? 0);
  const markers = [objects.markerAL, objects.markerAR, objects.markerBL, objects.markerBR];
  for (const marker of markers) {
    if (!marker) continue;
    highlights.set(marker, stepIndex === 2, 0xffcc44, 0.45);
    marker.material.opacity = markerOp * 0.9;
    marker.visible = markerOp > 0.02;
  }
}

// ---- 2D diagram ----------------------------------------------------------------
export function createSVGDiagram(container) {
  const s = svg.createSVG(container, 500, 400);

  const INK = 'var(--dia-ink, #24211a)';
  const INKSOFT = 'var(--dia-inksoft, #6a6151)';
  const RIGID = 'var(--dia-rigid, #8a8275)';
  const FAINT = 'var(--dia-faint, #c9bda7)';
  const CORD = 'var(--dia-cord, #1f57c4)';
  const NEG = 'var(--dia-neg, #cf3a26)';
  const POS = 'var(--dia-pos, #2f8f43)';
  const WASH = 'var(--dia-wash, #ece3d0)';
  const SVG_NS = 'http://www.w3.org/2000/svg';

  svg.text(s, 250, 22, "The Granny's Downfall — Connected Sums", {
    fontSize: 14, anchor: 'middle', fontWeight: 'bold',
  });

  // ---- Two composite-knot diagrams: each factor a real 3-crossing trefoil ----
  // A connected sum is NOT one 2-strand twist region (that untwists to the
  // unknot, and trefoil#trefoil cannot live on two strands). Each factor is a
  // genuine trefoil — a 2-strand twist of THREE crossings closed by its own
  // cap — and the two are joined by a bare two-strand neck, the sum sphere's
  // equator. Handedness fixes the crossing sign: right-handed = all positive
  // (rising strand over), left-handed = all negative (falling strand over). So
  // Loop A (square) pairs L(−) with R(+); Loop B (granny) pairs L(−) with L(−).
  const CX_L = 78, CX_R = 182;

  // One trefoil factor: a vertical 2-strand twist (three same-signed crossings)
  // capped over the top, its two open bottom ends left for the neck to pick up.
  function drawTrefoilFactor(g, cx, cy, sign, sideDir, color) {
    const DX = 8, N = 3, D = 0.30, steps = 40;
    const yTop = cy - 24, H = 30, yBot = yTop + H;
    const phaseMax = N * Math.PI;
    const xA = (ph) => cx + DX * Math.cos(ph);
    const xB = (ph) => cx - DX * Math.cos(ph);
    const yOf = (ph) => yTop + H * (ph / phaseMax);
    const build = (xf) => {
      let d = '';
      for (let i = 0; i <= steps; i++) {
        const ph = (i / steps) * phaseMax;
        d += (i ? ' L ' : 'M ') + xf(ph).toFixed(1) + ' ' + yOf(ph).toFixed(1);
      }
      return d;
    };
    // both strands continuous first (the under layer)
    svg.path(g, build(xA), { stroke: color, strokeWidth: 2.5 });
    svg.path(g, build(xB), { stroke: color, strokeWidth: 2.5 });
    // cap the two top rails over the top — this closure makes it a trefoil,
    // not an unknot (the bottom ends run out through the neck instead)
    svg.path(g, `M ${(cx - DX).toFixed(1)} ${yTop} C ${(cx - DX).toFixed(1)} ${(yTop - DX * 1.7).toFixed(1)}, ${(cx + DX).toFixed(1)} ${(yTop - DX * 1.7).toFixed(1)}, ${(cx + DX).toFixed(1)} ${yTop}`,
      { stroke: color, strokeWidth: 2.5 });
    // crossings: occlusion + over-segment, every crossing the same sign
    for (let k = 0; k < N; k++) {
      const phc = (k + 0.5) * Math.PI;
      const yc = yOf(phc);
      const seg = (xf) => [[xf(phc - D), yOf(phc - D)], [xf(phc + D), yOf(phc + D)]];
      const segA = seg(xA), segB = seg(xB);
      // the "/" (rising) strand has dx and dy of opposite sign
      const risingIsA = (segA[1][0] - segA[0][0]) * (segA[1][1] - segA[0][1]) < 0;
      const over = ((sign > 0) === risingIsA) ? segA : segB;
      const ang = Math.atan2(over[1][1] - over[0][1], over[1][0] - over[0][0]);
      svg.crossingGap(g, cx, yc, ang, 12);
      svg.path(g, `M ${over[0][0].toFixed(1)} ${over[0][1].toFixed(1)} L ${over[1][0].toFixed(1)} ${over[1][1].toFixed(1)}`,
        { stroke: color, strokeWidth: 2.5, strokeLinecap: 'round' });
      // signed-crossing glyph on the factor's outer side
      svg.text(g, cx + sideDir * (DX + 8), yc + 3.5, sign > 0 ? '+' : '−',
        { fontSize: 11, anchor: 'middle', fontWeight: 'bold', fill: sign > 0 ? POS : NEG });
    }
    return { leftEnd: [cx - DX, yBot], rightEnd: [cx + DX, yBot] };
  }

  function drawComposite(cy, hands, color, name, subtitle) {
    const g = document.createElementNS(SVG_NS, 'g');
    s.appendChild(g);
    const sL = hands[0] === 'R' ? 1 : -1;
    const sR = hands[1] === 'R' ? 1 : -1;
    const L = drawTrefoilFactor(g, CX_L, cy, sL, -1, color);
    const R = drawTrefoilFactor(g, CX_R, cy, sR, 1, color);
    const midX = (CX_L + CX_R) / 2;
    // Neck: a trivial two-strand band. Inner ends join across the top, outer
    // ends swing lower — parallel, no crossing. Cutting it (the sum sphere)
    // and capping each side leaves two separate trefoils: this IS K1 # K2.
    svg.path(g, `M ${L.rightEnd[0]} ${L.rightEnd[1]} C ${L.rightEnd[0] + 10} ${cy + 14}, ${R.leftEnd[0] - 10} ${cy + 14}, ${R.leftEnd[0]} ${R.leftEnd[1]}`,
      { stroke: color, strokeWidth: 2.5 });
    svg.path(g, `M ${L.leftEnd[0]} ${L.leftEnd[1]} C ${L.leftEnd[0] - 2} ${cy + 24}, ${R.rightEnd[0] + 2} ${cy + 24}, ${R.rightEnd[0]} ${R.rightEnd[1]}`,
      { stroke: color, strokeWidth: 2.5 });

    // Neck marker: the sum sphere's equator, dashed, encircling both strands.
    const neckMark = svg.ellipse(g, midX, cy + 15, 13, 14, { stroke: FAINT, strokeWidth: 1.2 });
    neckMark.setAttribute('stroke-dasharray', '4,3');
    svg.text(g, midX + 17, cy + 15, 'neck', { fontSize: 8, fill: FAINT });

    svg.text(g, 22, cy - 32, name, { fontSize: 11, fontWeight: 'bold', fill: color });
    svg.text(g, 22, cy + 44, subtitle, { fontSize: 8.5, fill: INKSOFT });
    return { g, neckMark };
  }

  const diaA = drawComposite(100, ['L', 'R'], CORD, 'Loop A', 'square knot = L # R (mirror factors)');
  const diaB = drawComposite(215, ['L', 'L'], NEG, 'Loop B', 'granny knot = L # L (matching factors)');
  const neckMarks = [diaA.neckMark, diaB.neckMark];

  // Handedness labels — revealed at the spiral-test step.
  const handLabels = document.createElementNS(SVG_NS, 'g');
  s.appendChild(handLabels);
  const handAt = (x, y, letter, fill) =>
    svg.text(handLabels, x, y, letter, { fontSize: 12, anchor: 'middle', fontWeight: 'bold', fill });
  handAt(CX_L, 100 - 40, 'L', NEG);
  handAt(CX_R, 100 - 40, 'R', CORD);
  handAt(CX_L, 215 - 40, 'L', NEG);
  handAt(CX_R, 215 - 40, 'L', NEG);

  // Seat / block verdict badges next to each diagram.
  const seatBadge = document.createElementNS(SVG_NS, 'g');
  s.appendChild(seatBadge);
  svg.text(seatBadge, 282, 96, '✓', { fontSize: 15, anchor: 'middle', fontWeight: 'bold', fill: POS });
  svg.text(seatBadge, 282, 110, 'seats', { fontSize: 8.5, anchor: 'middle', fill: POS });

  const blockBadge = document.createElementNS(SVG_NS, 'g');
  s.appendChild(blockBadge);
  svg.text(blockBadge, 282, 211, '✗', { fontSize: 15, anchor: 'middle', fontWeight: 'bold', fill: NEG });
  svg.text(blockBadge, 282, 225, 'blocked', { fontSize: 8.5, anchor: 'middle', fill: NEG });

  // ---- Live invariant scoreboard ----
  const TBL_X = 300;
  svg.text(s, 392, 62, 'Invariant scoreboard', { fontSize: 11, anchor: 'middle', fontWeight: 'bold', fill: INK });
  svg.line(s, TBL_X, 70, 484, 70, { stroke: FAINT, strokeWidth: 1 });
  svg.text(s, TBL_X, 84, 'invariant', { fontSize: 8.5, fill: RIGID });
  svg.text(s, 408, 84, 'A', { fontSize: 8.5, anchor: 'middle', fill: RIGID });
  svg.text(s, 438, 84, 'B', { fontSize: 8.5, anchor: 'middle', fill: RIGID });
  svg.text(s, 470, 84, 'verdict', { fontSize: 8.5, anchor: 'middle', fill: RIGID });

  const ROWS = [
    { name: 'crossings', a: '6', b: '6', verdict: 'same' },
    { name: 'genus', a: '2', b: '2', verdict: 'same' },
    { name: 'tricolorings', a: '27', b: '27', verdict: 'same' },
    { name: 'Alexander Δ(t)', a: '(t−1+1/t)²', b: '≡ A', verdict: 'same', small: true },
    { name: 'signature σ', a: '0', b: '+4', verdict: '?', isSigma: true },
  ];
  const rowGroups = [];
  let sigmaVerdictEl = null;
  ROWS.forEach((row, k) => {
    const y = 104 + k * 24;
    const g = document.createElementNS(SVG_NS, 'g');
    s.appendChild(g);
    svg.text(g, TBL_X, y, row.name, { fontSize: 9.5, fill: INK });
    svg.text(g, 408, y, row.a, { fontSize: row.small ? 7.5 : 9.5, anchor: 'middle', fill: INK });
    svg.text(g, 438, y, row.b, { fontSize: row.small ? 7.5 : 9.5, anchor: 'middle', fill: INK });
    const v = svg.text(g, 470, y, row.verdict, {
      fontSize: 9, anchor: 'middle', fill: row.isSigma ? RIGID : POS,
    });
    if (row.isSigma) sigmaVerdictEl = v;
    rowGroups.push(g);
  });
  svg.line(s, TBL_X, 208, 484, 208, { stroke: FAINT, strokeWidth: 1 });
  svg.text(s, TBL_X, 224, 'σ adds under # and flips sign', { fontSize: 8, fill: INKSOFT });
  svg.text(s, TBL_X, 235, 'under mirror: (+2)+(−2)=0 vs (+2)+(+2)=+4', { fontSize: 8, fill: INKSOFT });

  // Mold strip: a side-view hint of the board with six bridges (two clumps).
  const moldY = 300;
  const stripBridges = [70, 94, 118, 174, 198, 222];
  svg.rect(s, 60, moldY, 232, 18, { fill: WASH, stroke: RIGID, strokeWidth: 1.5, rx: 3 });
  for (const bx of stripBridges) {
    svg.rect(s, bx - 7, moldY - 6, 14, 6, { fill: WASH, stroke: RIGID, strokeWidth: 1 });
  }
  svg.text(s, 176, moldY + 30, 'mold board — carved with the square-knot channel', {
    fontSize: 8.5, anchor: 'middle', fill: INKSOFT,
  });
  // The granny's wrong-handed second clump rides proud over ITS THREE bridges —
  // not one stray crossing at the neck.
  const proudMarks = document.createElementNS(SVG_NS, 'g');
  s.appendChild(proudMarks);
  for (const bx of [174, 198, 222]) {
    svg.path(proudMarks, `M ${bx - 6} ${moldY - 7} Q ${bx} ${moldY - 15} ${bx + 6} ${moldY - 7}`,
      { stroke: NEG, strokeWidth: 2, strokeLinecap: 'round' });
  }
  svg.text(s, 360, moldY + 6, 'square lies flush;', { fontSize: 9, fill: INK });
  svg.text(s, 360, moldY + 18, "granny's 2nd clump rides proud", { fontSize: 9, fill: INK });

  svg.calloutBox(s, 30, 358, 440, 32,
    'Four invariants tie — only the signature σ sees handedness, and the mold asks σ');

  // ---- Timeline updater ----
  // Row reveal step per scoreboard row; verdict marks flip at steps 4/5.
  const revealAt = [0, 1, 2, 3, 4];
  // Neck-marker opacity per step (fade in while the sum spheres show in 3D).
  const neckFrames = [[0.15], [1], [1], [0.5], [0.35], [0.35], [0.35]];

  return function update(state) {
    if (!state) return;
    const i = Math.max(0, Math.min(state.stepIndex | 0, animationSteps.length - 1));
    const p = Math.max(0, Math.min(state.stepProgress ?? 0, 1));

    rowGroups.forEach((g, k) => {
      const shown = i >= revealAt[k];
      const active = ROWS[k].isSigma ? i >= 5 : i === revealAt[k];
      svg.highlight(g, shown, { dim: 0.12, glow: false });
      // Set the glow directly so a row that stops being active loses it.
      g.style.filter = shown && active
        ? `drop-shadow(0 0 6px ${ROWS[k].isSigma ? NEG : CORD})`
        : 'none';
    });

    if (sigmaVerdictEl) {
      sigmaVerdictEl.textContent = i >= 5 ? 'differs!' : '?';
      sigmaVerdictEl.setAttribute('fill', i >= 5 ? NEG : RIGID);
      sigmaVerdictEl.setAttribute('font-weight', i >= 5 ? 'bold' : 'normal');
    }

    svg.highlight(handLabels, i >= 2, { dim: 0.05, glow: false });
    svg.highlight(seatBadge, i >= 4, { dim: 0.05, glow: false });
    svg.highlight(blockBadge, i >= 5, { dim: 0.05, glow: false });

    const [neckOp] = svg.lerpFrames(neckFrames, i, p);
    for (const mark of neckMarks) {
      mark.style.opacity = String(neckOp);
    }

    // The second clump's proud crossings on the mold strip appear when B refuses.
    svg.highlight(proudMarks, i >= 5, { dim: 0.06, color: NEG });
  };
}

export function dispose() {
  highlights.dispose();
}
