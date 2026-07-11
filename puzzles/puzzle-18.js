import * as THREE from 'three';
import { createMaterials } from '../lib/materials.js';
import { createRing, createBlock } from '../lib/components.js';
import { CordPath } from '../lib/cord.js';
import { enableShadowsOnGroup } from '../lib/scene.js';
import { StepArrowManager } from '../lib/arrow-helpers.js';
import { resolveStep, applyStepTransforms, HighlightCache } from '../lib/puzzle-helpers.js';
import * as svg from '../lib/svg.js';

export const metadata = {
  id: 18,
  name: 'The Whitehead Waltz',
  difficulty: 'Advanced',
  principle: 'Whitehead link — linking number zero without splittability',
  type: 'Identification / Disentanglement',
  description: 'Two identical-looking stations: a ring in a stand, a cord woven through twice with a clasp below. Both compute linking number zero, but only one cord comes free — the other is a genuine Whitehead link, and the whole difference is a single flipped crossing at the clasp.',
  cameraPosition: [0, 90, 230],
};

// ---- Dimensions shared with scad/puzzle_18 (SCAD mirrors these as p18_*) ----
const RING_OD = 80;    // ring outer diameter (68mm aperture at 6-8mm wire)
const RING_WIRE = 8;   // ring wire thickness
const STAND_W = 90;    // stand base width
const STAND_H = 40;    // pedestal height up to the saddle seat
const CORD_R = 2;      // 4mm braided cord

const BASE_H = 10;     // base slab height
const BASE_D = 56;     // base slab depth
const COL_X = 31;      // saddle column offset from the stand centerline
const COL_W = 8;       // saddle column width
const COL_D = 16;      // saddle column depth
const STATION_X = 70;  // stations sit at x = ±STATION_X
const RING_CY = 68;    // ring center height once seated in the saddles

const AX = -STATION_X; // Station A — the true Whitehead link
const BX = STATION_X;  // Station B — the decoy

// ---- Cord geometry -----------------------------------------------------------
// Station-local frame: ring in the x/y plane at z = 0, center (0, RING_CY, 0),
// aperture facing the viewer (+z). The closed cord makes two "pass" arcs that
// pierce the ring plane inside the aperture — pass 1 front→back (apex index 3),
// pass 2 back→front (apex index 13) — so the four hanging strands cross the
// ring wire in the flat view at c1..c4 (front strands over, back strands
// under: signs +, +, −, −, summing to lk = 0 on BOTH stations). The lobe
// endpoints interleave below, so the two hanging lobes cross exactly once in
// projection: the clasp. The ONLY difference between the stations is the z of
// the back strand at that one crossing.
//
// ALL keyframes of a cord share this 20-point count (closed CordPath).
function cordRest(hooked) {
  const zB = hooked ? 21 : -12; // back strand at the clasp (A reaches in front)
  const zF = hooked ? 7 : 12;   // front strand at the clasp (A ducks under it)
  const zL = hooked ? 10 : -12; // back lobe low point: on A it stays in front
                                // through the hook and only returns behind
                                // past the low point, clear of the other lobe
  return [
    [-21, 29, 12],  //  0 front-left hanging strand, below the wire (c1 above)
    [-22, 44, 12],  //  1 inside the aperture, front-left
    [-19, 56, 8],   //  2
    [-14, 62, 0],   //  3 pass 1 apex — pierces the ring plane front→back
    [-9, 55, -8],   //  4
    [-7, 44, -12],  //  5 inside the aperture, back-left
    [-7, 29, -12],  //  6 below the wire (c2 above)
    [-1, 19, zB],   //  7 the clasp — back strand
    [6, 14, zL],    //  8 back lobe low point
    [14, 18, -12],  //  9
    [21, 29, -12],  // 10 below the wire (c4 above)
    [22, 44, -12],  // 11 inside the aperture, back-right
    [19, 56, -8],   // 12
    [14, 62, 0],    // 13 pass 2 apex — pierces the ring plane back→front
    [9, 55, 8],     // 14
    [7, 44, 12],    // 15 inside the aperture, front-right
    [7, 29, 12],    // 16 below the wire (c3 above)
    [1, 19, zF],    // 17 the clasp — front strand
    [-6, 14, 12],   // 18 front lobe low point
    [-14, 18, 12],  // 19
  ];
}

// B, step 3: the back lobe (the strand underneath at the clasp) folds into a
// bight and rises through the aperture — the clasp opens without resistance.
function cordBight() {
  const p = cordRest(false);
  p[6] = [-7, 33, -12];
  p[7] = [-2, 46, -7];
  p[8] = [0, 55, 0];    // bight tip at the ring plane, inside the aperture
  p[9] = [8, 45, -8];
  p[10] = [17, 32, -12];
  return p;
}

// B, step 4: the bight is through — the old back lobe hangs forward through
// the aperture and the projected self-crossing is gone (Reidemeister II).
function cordThrough() {
  const p = cordRest(false);
  p[6] = [-7, 34, -12];
  p[7] = [-3, 46, 4];   // left side through the plane, deep in the aperture
  p[8] = [5, 18, 22];   // the freed bight dangles well in front of the ring
  p[9] = [10, 34, 18];  // right side climbs in front of the band
  p[10] = [13, 47, -6]; // and re-enters the plane deep inside the aperture
  p[17] = [2, 22, 13];  // the freed front lobe relaxes
  p[18] = [-5, 16, 13];
  return p;
}

// B, step 5: a plain unknotted loop resting on the ground beside the stand.
function cordFree(dx) {
  const pts = [];
  const tilt = (35 * Math.PI) / 180;
  for (let k = 0; k < 20; k++) {
    const th = (2 * Math.PI * k) / 20;
    pts.push([
      dx + 66 + Math.cos(th) * 21 * Math.cos(tilt),
      23 + Math.sin(th) * 20,
      22 + Math.cos(th) * 21 * Math.sin(tilt),
    ]);
  }
  return pts;
}

// A, step 6: the same bight attempt binds. The rising bight drags the hooked
// front lobe up with it and the clasp cinches against the ring wire — the
// projected crossing survives (back strand still in front), just tightened.
function cordStrained() {
  const p = cordRest(true);
  p[6] = [-7, 28, -12];
  p[7] = [3, 22, 24];   // the hook, cinched — back strand still in front
  p[8] = [10, 26, 4];   // bight tip rises a little and jams below the wire
  p[9] = [13, 20, -12];
  p[10] = [19, 30, -12];
  p[16] = [7, 30, 12];
  p[17] = [0, 22, 6];   // front lobe dragged up, still trapped underneath
  p[18] = [-6, 16, 12];
  p[19] = [-13, 19, 12];
  return p;
}

const tx = (pts, dx) => pts.map(([x, y, z]) => [x + dx, y, z]);

const A_REST = tx(cordRest(true), AX);
const A_STRAIN = tx(cordStrained(), AX);
const B_REST = tx(cordRest(false), BX);
const B_BIGHT = tx(cordBight(), BX);
const B_THROUGH = tx(cordThrough(), BX);
const B_FREE = cordFree(BX);

// The four ring-cord crossings in the flat view (station-local x/y).
// over: which strand is on top; sign: contribution to the linking sum.
const CROSSINGS = [
  { x: -21.5, y: 39.1, sign: '+', over: 'cord', dist: 68 }, // c1 front-left
  { x: -7, y: 32.7, sign: '+', over: 'ring', dist: 84 },    // c2 back-left
  { x: 7, y: 32.7, sign: '−', over: 'cord', dist: 84 },     // c3 front-right
  { x: 21.5, y: 39.1, sign: '−', over: 'ring', dist: 68 },  // c4 back-right
];
const CLASP_LOCAL = { x: 0, y: 18.3 }; // the fifth crossing — cord vs itself

// ---- 3D construction ----------------------------------------------------------
function buildStation(group, mats, dx) {
  const base = createBlock(STAND_W, BASE_H, BASE_D, mats.wood);
  base.position.set(dx, BASE_H / 2, 0);
  group.add(base);

  for (const sx of [-1, 1]) {
    const col = createBlock(COL_W, STAND_H - BASE_H, COL_D, mats.wood);
    col.position.set(dx + sx * COL_X, (STAND_H + BASE_H) / 2, 0);
    group.add(col);

    const saddle = createBlock(14, 10, 16, mats.darkWood);
    saddle.position.set(dx + sx * COL_X, STAND_H + 4, 0);
    group.add(saddle);
  }

  // Ring upright in the saddles, aperture facing the viewer (torus is already
  // in the x/y plane).
  const ring = createRing(RING_OD, RING_WIRE, mats.brass);
  ring.position.set(dx, RING_CY, 0);
  group.add(ring);
  return ring;
}

function buildScene(mats) {
  const group = new THREE.Group();

  buildStation(group, mats, AX);
  buildStation(group, mats, BX);

  const cordA = new CordPath(A_REST, { radius: CORD_R, material: mats.cord, closed: true });
  cordA.addTo(group);
  const cordB = new CordPath(B_REST, { radius: CORD_R, material: mats.cord, closed: true });
  cordB.addTo(group);

  return { group, cordA, cordB };
}

export function create3DScene() {
  const mats = createMaterials();
  const { group } = buildScene(mats);
  enableShadowsOnGroup(group);
  return group;
}

function makeMarkerMesh(radius, x, y, z) {
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffcc44,
    transparent: true,
    opacity: 0.5,
    roughness: 0.4,
  });
  const m = new THREE.Mesh(new THREE.TorusGeometry(radius, 1, 10, 28), mat);
  m.position.set(x, y, z);
  m.visible = false;
  return m;
}

export function createAnimScene() {
  const mats = createMaterials();
  const { group, cordA, cordB } = buildScene(mats);

  // Halo rings marking the four signed crossings per station (step 1) and the
  // two clasps (step 2). Ordered [A c1..c4, B c1..c4] so index % 4 = crossing.
  const crossMarkers = [];
  for (const dx of [AX, BX]) {
    for (const c of CROSSINGS) {
      const m = makeMarkerMesh(6, dx + c.x, c.y, 15);
      group.add(m);
      crossMarkers.push(m);
    }
  }
  const claspMarkers = [AX, BX].map(dx => {
    const m = makeMarkerMesh(8, dx + CLASP_LOCAL.x, CLASP_LOCAL.y, 26);
    group.add(m);
    return m;
  });

  enableShadowsOnGroup(group);
  const arrowManager = new StepArrowManager(group);

  return {
    group,
    objects: { cordA, cordB, crossMarkers, claspMarkers, arrowManager },
  };
}

// ---- Animation -----------------------------------------------------------------
const arrowConfigs = {
  // Step 2: sight both clasps from the front — the tell lives there.
  2: { arrows: [
    { from: [AX - 26, 4, 36], to: [AX - 4, 17, 24], opts: { color: 0xffcc44 } },
    { from: [BX + 26, 4, 36], to: [BX + 4, 17, 24], opts: { color: 0xffcc44 } },
  ]},
  // Step 3: fold B's under-lobe into a bight, up through the aperture.
  3: { arrows: [
    { from: [BX + 6, 12, -20], to: [BX + 1, 48, -6], opts: { color: 0x44ccff } },
  ]},
  // Step 4: the bight comes through toward the viewer.
  4: { arrows: [
    { from: [BX + 1, 56, -2], to: [BX + 6, 34, 20], opts: { color: 0x44ccff } },
  ]},
  // Step 5: the freed loop slides out beside the stand.
  5: { arrows: [
    { from: [BX + 24, 26, 18], to: [BX + 58, 24, 22], opts: { color: 0x44ff88 } },
  ]},
  // Step 6: the identical move on A — blocked.
  6: { arrows: [
    { from: [AX + 5, 12, -20], to: [AX + 1, 44, -6], opts: { color: 0xdd3333 } },
  ]},
};

export const animationSteps = [
  {
    label: 'Two identical-looking links',
    duration: 3.0,
    cordA: A_REST,
    cordB: B_REST,
  },
  {
    label: 'Count the signed crossings — linking number 0 on both',
    duration: 4.0,
    easing: 'linear',
    cordA: A_REST,
    cordB: B_REST,
  },
  {
    label: 'Inspect the clasps — one hooks, one only overlaps',
    duration: 2.5,
    cordA: A_REST,
    cordB: B_REST,
  },
  {
    label: 'Pull a bight of B back through its ring',
    duration: 2.5,
    cordA: A_REST,
    cordB: B_BIGHT,
  },
  {
    label: 'The false clasp dissolves — a Reidemeister II move',
    duration: 2.5,
    cordA: A_REST,
    cordB: B_THROUGH,
  },
  {
    label: 'B slides free',
    duration: 3.0,
    easing: 'easeInOut',
    cordA: A_REST,
    cordB: B_FREE,
  },
  {
    label: 'The same move on A binds — lk 0 is necessary, not sufficient',
    duration: 2.5,
    easing: 'easeInOut',
    cordA: A_STRAIN,
    cordB: B_FREE,
  },
];

const highlights = new HighlightCache();

export function updateAnimation(objects, state) {
  const { step, prevStep, t, stepIndex } = resolveStep(animationSteps, state, {
    arrowManager: objects.arrowManager,
    arrowConfigs,
  });

  applyStepTransforms(objects, prevStep, step, t, {
    cordA: { target: 'cordA', kind: 'cordPoints' },
    cordB: { target: 'cordB', kind: 'cordPoints' },
  });

  // Step 1: spotlight the four crossing regions in turn (both stations at once).
  const counting = stepIndex === 1;
  const phase = counting ? Math.min(3, Math.floor(t * 4)) : -1;
  objects.crossMarkers.forEach((m, i) => {
    m.visible = counting;
    highlights.set(m, counting && (i % 4) === phase, 0xffcc44, 0.9);
  });

  // Step 2: the clasps are the tell — glow both.
  const inspecting = stepIndex === 2;
  objects.claspMarkers.forEach(m => {
    m.visible = inspecting;
    highlights.set(m, inspecting, 0xffcc44, 0.9);
  });

  // Step 6: cord A strains against the hook — warning glow.
  highlights.set(objects.cordA.mesh, stepIndex === 6, 0xdd3333, 0.4);
}

// ---- 2D diagram ----------------------------------------------------------------
const mid2 = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];

// Smooth closed path through control points (quadratics through midpoints).
function closedPathD(pts) {
  const n = pts.length;
  const m0 = mid2(pts[n - 1], pts[0]);
  let d = `M ${m0[0].toFixed(1)} ${m0[1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const m = mid2(p, pts[(i + 1) % n]);
    d += ` Q ${p[0].toFixed(1)} ${p[1].toFixed(1)} ${m[0].toFixed(1)} ${m[1].toFixed(1)}`;
  }
  return d + ' Z';
}

// The same smoothing restricted to vertices i0..i1 — overlays the closed path
// exactly, so over-strand redraws sit pixel-perfect on the under drawing.
function segPathD(pts, i0, i1) {
  const n = pts.length;
  const at = k => pts[((k % n) + n) % n];
  const m0 = mid2(at(i0 - 1), at(i0));
  let d = `M ${m0[0].toFixed(1)} ${m0[1].toFixed(1)}`;
  for (let i = i0; i <= i1; i++) {
    const p = at(i);
    const m = mid2(p, at(i + 1));
    d += ` Q ${p[0].toFixed(1)} ${p[1].toFixed(1)} ${m[0].toFixed(1)} ${m[1].toFixed(1)}`;
  }
  return d;
}

export function createSVGDiagram(container) {
  const s = svg.createSVG(container, 500, 338);
  const SVG_NS = 'http://www.w3.org/2000/svg';

  const INK = 'var(--dia-ink, #24211a)';
  const INKSOFT = 'var(--dia-inksoft, #6a6151)';
  const FAINT = 'var(--dia-faint, #c9bda7)';
  const CORD = 'var(--dia-cord, #1f57c4)';
  const RINGC = 'var(--dia-ring, #b97d12)';
  const NEG = 'var(--dia-neg, #cf3a26)';
  const POS = 'var(--dia-pos, #2f8f43)';
  const SURFACE = 'var(--dia-surface, #fbf7ee)';

  svg.text(s, 250, 20, 'The Whitehead Waltz — same count, different fate', {
    fontSize: 14, anchor: 'middle', fontWeight: 'bold',
  });

  const K = 1.35;            // projection scale (station-local mm → px)
  const RING_R = 36 * K;     // projected wire-centerline radius
  const RING_SW = 9;         // ring stroke
  const CORD_SW = 4.5;       // cord stroke
  const CY = 126;

  function signBadge(parent, x, y, sign) {
    const g = document.createElementNS(SVG_NS, 'g');
    parent.appendChild(g);
    const color = sign === '+' ? POS : NEG;
    svg.circle(g, x, y, 6.5, { fill: SURFACE, stroke: color, strokeWidth: 1.6 });
    svg.text(g, x, y, sign, {
      fontSize: 10, anchor: 'middle', dominantBaseline: 'central',
      fontWeight: 'bold', fill: color,
    });
    return g;
  }

  // One station: front view of the ring + cord with the canonical crossing
  // idiom, sign badges at the four ring-cord crossings, and the live sum.
  function drawStation(cx, letter, hooked) {
    const g = document.createElementNS(SVG_NS, 'g');
    s.appendChild(g);

    // Project the (station-local) rest control points; A and B share the same
    // projection — the difference is pure over/under.
    const proj = ([x, y]) => [cx + x * K, CY + (RING_CY - y) * K];
    const P = cordRest(false).map(proj);
    const XY = c => proj([c.x, c.y]);

    // 1. Ring (the under-strand where the cord passes in front).
    svg.circle(g, cx, CY, RING_R, { stroke: RINGC, strokeWidth: RING_SW });

    // 2. Occlusion gaps along the cord tangent where the cord crosses OVER.
    const cordTangents = { 0: [0, 1], 2: [15, 16] };
    for (const [idx, [a, b]] of Object.entries(cordTangents)) {
      const [X, Y] = XY(CROSSINGS[idx]);
      const ang = Math.atan2(P[b][1] - P[a][1], P[b][0] - P[a][0]);
      svg.crossingGap(g, X, Y, ang, 20);
    }

    // 3. The cord — one continuous closed curve.
    const cordEl = svg.path(g, closedPathD(P), {
      stroke: CORD, strokeWidth: CORD_SW, strokeLinecap: 'round',
    });
    cordEl.setAttribute('stroke-linejoin', 'round');

    // 4. The clasp — the one self-crossing. Station A: the back lobe (points
    // 6-8) hooks in FRONT; station B: the front lobe (points 16-18) stays on
    // top and the lobes merely overlap.
    const [clX, clY] = XY(CLASP_LOCAL);
    const over = hooked ? [6, 8] : [16, 18];
    const oa = P[over[0]];
    const ob = P[over[1]];
    svg.crossingGap(g, clX, clY, Math.atan2(ob[1] - oa[1], ob[0] - oa[0]), 16);
    const overEl = svg.path(g, segPathD(P, over[0], over[1]), {
      stroke: CORD, strokeWidth: CORD_SW, strokeLinecap: 'round',
    });
    overEl.setAttribute('stroke-linejoin', 'round');

    // 5. Where the ring passes in front of the cord (back strands): a
    // surface-colored casing arc along the wire erases the under-strand,
    // then a longer ring arc is laid on top so it merges into the band.
    const ringArc = (alpha, halfSpan, sw, color) => {
      const p0 = [cx + RING_R * Math.cos(alpha - halfSpan), CY + RING_R * Math.sin(alpha - halfSpan)];
      const p1 = [cx + RING_R * Math.cos(alpha + halfSpan), CY + RING_R * Math.sin(alpha + halfSpan)];
      return svg.path(g,
        `M ${p0[0].toFixed(1)} ${p0[1].toFixed(1)} A ${RING_R.toFixed(1)} ${RING_R.toFixed(1)} 0 0 1 ${p1[0].toFixed(1)} ${p1[1].toFixed(1)}`,
        { stroke: color, strokeWidth: sw, strokeLinecap: 'round' });
    };
    for (const idx of [1, 3]) {
      const [X, Y] = XY(CROSSINGS[idx]);
      const alpha = Math.atan2(Y - CY, X - cx);
      ringArc(alpha, 0.12, RING_SW + 5, SURFACE); // casing (occlusion)
      ringArc(alpha, 0.24, RING_SW, RINGC);       // the wire back on top
    }

    // 6. Sign badges just outside each crossing, radially clear of the cord.
    const badges = CROSSINGS.map(c => {
      const [X, Y] = XY(c);
      const ux = (X - cx) / RING_R;
      const uy = (Y - CY) / RING_R;
      return signBadge(g, cx + ux * c.dist, CY + uy * c.dist, c.sign);
    });

    // 7. Clasp callout ring + label.
    const claspRing = svg.circle(g, clX, clY, 11, {
      stroke: RINGC, strokeWidth: 1.5, fill: 'none',
    });
    claspRing.setAttribute('stroke-dasharray', '4,3');
    const claspLabel = svg.text(g, cx, 224,
      hooked ? 'clasp: the lobes hook' : 'clasp: the lobes only overlap',
      { fontSize: 9, anchor: 'middle', fill: INKSOFT });

    // 8. The scoreboard: the four signed terms and their sum.
    const terms = ['+1', '+1', '−1', '−1'].map((txt, k) =>
      svg.text(g, cx - 51 + k * 26, 240, txt, {
        fontSize: 12, anchor: 'middle', fontWeight: 'bold',
        fill: k < 2 ? POS : NEG,
      }));
    const sumEq = svg.text(g, cx + 53, 240, '= 0', {
      fontSize: 12, anchor: 'middle', fontWeight: 'bold', fill: INK,
    });
    const lkLine = svg.text(g, cx, 256, 'lk = ½ × 0 = 0', {
      fontSize: 11, anchor: 'middle', fill: INK,
    });

    svg.text(g, cx, 44, `Station ${letter}`, {
      fontSize: 12, anchor: 'middle', fontWeight: 'bold', fill: INK,
    });

    return { g, badges, terms, sumEq, lkLine, claspRing, claspLabel };
  }

  const stations = [
    drawStation(125, 'A', true),
    drawStation(375, 'B', false),
  ];

  // Verdicts live outside the station groups so dimming can't hide them.
  const verdictA = svg.text(s, 125, 62, '✗ Whitehead — never comes free', {
    fontSize: 10.5, anchor: 'middle', fontWeight: 'bold', fill: NEG,
  });
  const verdictB = svg.text(s, 375, 62, '✓ unlink in disguise — slides free', {
    fontSize: 10.5, anchor: 'middle', fontWeight: 'bold', fill: POS,
  });
  verdictA.style.opacity = '0';
  verdictB.style.opacity = '0';

  // Motion arrows (toggled per step by the updater).
  const arrowBight = svg.motionArrow(s, 383, 196, 376, 116, {
    color: CORD, label: 'push the bight through', curvature: 0.25,
  });
  const arrowFree = svg.motionArrow(s, 430, 148, 468, 148, {
    color: POS, label: 'slides free', curvature: 0.2,
  });
  const arrowBlock = svg.motionArrow(s, 132, 196, 126, 116, {
    color: NEG, label: 'binds!', curvature: 0.25,
  });

  // Step badges.
  const stepDefs = [
    [40, 'count: lk = 0 twice'],
    [158, 'inspect the clasps'],
    [276, 'bight frees B'],
    [394, 'A binds — trapped'],
  ];
  const stepBadges = stepDefs.map(([x, label], k) => {
    const b = svg.stepBadge(s, x, 276, k + 1, null, { radius: 10 });
    svg.text(s, x + 16, 279.5, label, { fontSize: 9.5, fill: INKSOFT });
    return b;
  });

  svg.calloutBox(s, 28, 296, 444, 28,
    'lk = 0 is necessary, never sufficient — the clasp remembers what the count forgets',
    { fontSize: 9.5 });

  const last = animationSteps.length - 1;

  return function update(state) {
    if (!state) return;
    const i = Math.max(0, Math.min(state.stepIndex | 0, last));
    const p = Math.max(0, Math.min(state.stepProgress ?? 0, 1));

    const counting = i === 1;
    const phase = counting ? Math.min(3, Math.floor(p * 4)) : -1;
    const summed = i > 1 || (counting && p > 0.9);

    stations.forEach(st => {
      st.badges.forEach((b, k) => {
        const on = counting ? k <= phase : i >= 2;
        svg.highlight(b, on, {
          dim: counting ? 0.2 : 0.55,
          color: k < 2 ? POS : NEG,
        });
      });
      st.terms.forEach((txt, k) => {
        svg.highlight(txt, counting ? k <= phase : i >= 2, { dim: 0.3, glow: false });
      });
      svg.highlight(st.sumEq, summed, { dim: 0.25, glow: false });
      svg.highlight(st.lkLine, summed, { dim: 0.25, glow: false });
      svg.highlight(st.claspRing, i === 2, { dim: 0.12, color: RINGC });
      svg.highlight(st.claspLabel, i === 2, { dim: 0.4, glow: false });
    });

    // Spotlight the acting station: B during the extraction, A at the finale.
    svg.highlight(stations[0].g, !(i >= 3 && i <= 5), { dim: 0.45, glow: false });
    svg.highlight(stations[1].g, i !== 6, { dim: 0.45, glow: false });

    verdictB.style.opacity = i > 5 ? '1' : i === 5 ? String(p) : '0';
    verdictA.style.opacity = i === 6 ? String(p) : '0';

    svg.highlight(arrowBight, i === 3 || i === 4, { glow: false, dim: 0 });
    svg.highlight(arrowFree, i === 5, { glow: false, dim: 0 });
    svg.highlight(arrowBlock, i === 6, { glow: false, dim: 0 });

    const active = i === 1 ? 0 : i === 2 ? 1 : i >= 3 && i <= 5 ? 2 : i === 6 ? 3 : -1;
    stepBadges.forEach((b, k) => svg.highlight(b, k === active, { dim: 0.35, color: CORD }));
  };
}

export function dispose() {
  highlights.dispose();
}
