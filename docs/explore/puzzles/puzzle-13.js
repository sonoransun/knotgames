import * as THREE from 'three';
import { createMaterials } from '../lib/materials.js';
import { createRing, createBall } from '../lib/components.js';
import { CordPath } from '../lib/cord.js';
import { enableShadowsOnGroup } from '../lib/scene.js';
import { StepArrowManager } from '../lib/arrow-helpers.js';
import { resolveStep, applyStepTransforms, HighlightCache } from '../lib/puzzle-helpers.js';
import * as svg from '../lib/svg.js';

export const metadata = {
  id: 14,
  name: 'The Torus Winder',
  difficulty: 'Advanced',
  principle: 'Torus knots — (p,q) winding numbers',
  type: 'Assembly',
  description: 'Wind a cord around a torus following guide notches to create a (2,3) torus knot — the simplest non-trivial torus knot. Only specific winding number pairs produce genuine knots that trap a sliding ring.',
  cameraPosition: [0, 60, 200],
};

const TORUS_MAJOR_R = 50;
const TORUS_MINOR_R = 15;
const CORD_RADIUS = 2.5;
const CORD_LIFT = TORUS_MINOR_R + 3; // cord centerline rides 3mm above the tube surface
const EQUATOR_R = TORUS_MAJOR_R + CORD_LIFT;
const SEGMENTS = 96; // every cord keyframe has SEGMENTS + 1 points

// Generate (p,q) torus knot points on a torus surface
function torusKnotPoints(p, q, majorR, minorR, segments = SEGMENTS) {
  const pts = [];
  for (let i = 0; i <= segments; i++) {
    const t = (2 * Math.PI * i) / segments;
    const phi = p * t; // angle around torus hole
    const theta = q * t; // angle around torus tube
    const r = majorR + (minorR + 3) * Math.cos(theta);
    pts.push([
      r * Math.cos(phi),
      (minorR + 3) * Math.sin(theta),
      r * Math.sin(phi),
    ]);
  }
  return pts;
}

// Simple unwound cord path (not knotted — just a loop on the torus surface)
function unwoundCordPath() {
  const pts = [];
  for (let i = 0; i <= SEGMENTS; i++) {
    const t = (2 * Math.PI * i) / SEGMENTS;
    pts.push([EQUATOR_R * Math.cos(t), 0, EQUATOR_R * Math.sin(t)]);
  }
  return pts;
}

// Full (2,3) torus knot winding
function fullWindPath() {
  return torusKnotPoints(2, 3, TORUS_MAJOR_R, TORUS_MINOR_R);
}

// Cord keyframe for a partially wound (2,3) knot: the first fraction f of the
// knot path hugs the torus; the not-yet-wound remainder lies as slack around
// the outside, bulged slightly outward so it reads as loose cord. Every frame
// has SEGMENTS + 1 points, so all cord keyframes interpolate 1:1
// (CordPath.interpolatePoints silently truncates mismatched arrays).
// At the wrap boundaries used below (f = 1/3, 2/3) the wound front sits
// exactly on the outer equator, so the arc and the slack join seamlessly.
function windingFrame(f) {
  if (f <= 0) return unwoundCordPath();
  if (f >= 1) return fullWindPath();
  const pts = [];
  const wound = Math.round(SEGMENTS * f);
  for (let i = 0; i <= wound; i++) {
    const t = (2 * Math.PI * f * i) / wound;
    const phi = 2 * t;
    const theta = 3 * t;
    const r = TORUS_MAJOR_R + CORD_LIFT * Math.cos(theta);
    pts.push([r * Math.cos(phi), CORD_LIFT * Math.sin(theta), r * Math.sin(phi)]);
  }
  const phiEnd = 4 * Math.PI * f; // axis angle of the wound front
  const phiClose = 2 * Math.PI * Math.ceil(phiEnd / (2 * Math.PI) - 1e-9);
  const slackSegs = SEGMENTS - wound;
  for (let j = 1; j <= slackSegs; j++) {
    const s = j / slackSegs;
    const phi = phiEnd + (phiClose - phiEnd) * s;
    const r = EQUATOR_R + 6 * Math.sin(Math.PI * s); // slack bulge
    pts.push([r * Math.cos(phi), 0, r * Math.sin(phi)]);
  }
  return pts;
}

function createTorus(material) {
  const geometry = new THREE.TorusGeometry(TORUS_MAJOR_R, TORUS_MINOR_R, 32, 64);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = Math.PI / 2;
  return mesh;
}

// Guide notch markers on torus surface
function createGuideNotches(material) {
  const group = new THREE.Group();
  const notchGeo = new THREE.SphereGeometry(2, 8, 8);
  // Place 6 guide markers at key positions on the (2,3) path
  const pts = torusKnotPoints(2, 3, TORUS_MAJOR_R, TORUS_MINOR_R, 6);
  for (let i = 0; i < 6; i++) {
    const notch = new THREE.Mesh(notchGeo, material);
    notch.position.set(pts[i][0], pts[i][1], pts[i][2]);
    group.add(notch);
  }
  return group;
}

// The three self-crossings of the (2,3) knot: viewed down the torus axis the
// two strands align radially where cos(theta) = 0, i.e. at axis angles 60°,
// 180° and 300°. Beads sit on the over-strand (y = +CORD_LIFT), hidden until
// the verify step reveals them.
const CROSSING_PHIS = [Math.PI / 3, Math.PI, 5 * Math.PI / 3];

function createCrossingBeads(material) {
  const group = new THREE.Group();
  const beadGeo = new THREE.SphereGeometry(5, 16, 16);
  for (const phi of CROSSING_PHIS) {
    const bead = new THREE.Mesh(beadGeo, material);
    bead.position.set(TORUS_MAJOR_R * Math.cos(phi), CORD_LIFT, TORUS_MAJOR_R * Math.sin(phi));
    bead.visible = false;
    group.add(bead);
  }
  return group;
}

export function create3DScene() {
  const mats = createMaterials();
  const group = new THREE.Group();

  // Torus
  const torus = createTorus(mats.steel);
  group.add(torus);

  // Guide notches
  const notches = createGuideNotches(mats.yellow);
  group.add(notches);

  // (2,3) torus knot cord (completed state)
  const knotPts = fullWindPath();
  const cord = new CordPath(knotPts, {
    radius: CORD_RADIUS,
    material: mats.cord,
    closed: true,
  });
  cord.addTo(group);

  // Ball-stops at cord start/end
  const ball1 = createBall(10, mats.wood);
  ball1.position.set(knotPts[0][0], knotPts[0][1], knotPts[0][2]);
  group.add(ball1);

  // Trapped sliding ring
  const ring = createRing(25, 3, mats.brass);
  ring.position.set(TORUS_MAJOR_R + TORUS_MINOR_R + 5, 0, 0);
  group.add(ring);

  enableShadowsOnGroup(group);
  return group;
}

export function createAnimScene() {
  const mats = createMaterials();
  const group = new THREE.Group();

  const torus = createTorus(mats.steel);
  group.add(torus);

  const notches = createGuideNotches(mats.yellow);
  group.add(notches);

  // Start with unwound cord
  const cord = new CordPath(unwoundCordPath(), {
    radius: CORD_RADIUS,
    material: mats.cord,
    closed: true,
  });
  cord.addTo(group);

  // Ball-stop that leads the winding front through the hole
  const ball = createBall(10, mats.wood);
  ball.position.set(EQUATOR_R, 0, 0);
  group.add(ball);

  // Crossing beads — revealed during the verify step
  const crossings = createCrossingBeads(mats.brass);
  group.add(crossings);

  // Ring starts free
  const ring = createRing(25, 3, mats.brass);
  ring.position.set(TORUS_MAJOR_R + TORUS_MINOR_R + 15, 0, 0);
  group.add(ring);

  enableShadowsOnGroup(group);
  const arrowManager = new StepArrowManager(group);

  return { group, objects: { cord, ball, crossings, ring, arrowManager } };
}

// Winding arrows track the ball-stop's travel for each step (blue); the final
// arrow shows the ring sliding into the catch (gold).
const arrowConfigs = {
  1: { arrows: [
    { from: [55, 22, 45], to: [-20, -20, 35], opts: { color: 0x4488ff } },
  ] },
  2: { arrows: [
    { from: [-55, 22, -40], to: [-30, -20, 35], opts: { color: 0x4488ff } },
  ] },
  3: { arrows: [
    { from: [-15, 22, 65], to: [60, -8, 15], opts: { color: 0x4488ff } },
  ] },
  5: { arrows: [
    { from: [80, 6, 10], to: [50, 16, 36], opts: { color: 0xffcc44 } },
  ] },
};

// Ball-stop waypoints at the wrap boundaries of the winding (axis angles
// 0° → 240° → 480° ≡ 120° → 720° ≡ 0°). Each straight run between consecutive
// waypoints dips through the torus hole — one hole-pass per winding step.
const BALL_START = [EQUATOR_R, 0, 0];
const BALL_WRAP1 = [EQUATOR_R * Math.cos(4 * Math.PI / 3), 0, EQUATOR_R * Math.sin(4 * Math.PI / 3)];
const BALL_WRAP2 = [EQUATOR_R * Math.cos(2 * Math.PI / 3), 0, EQUATOR_R * Math.sin(2 * Math.PI / 3)];

// Ring poses: parked outside the torus until the test, then slid along the
// cord to the first crossing (axis angle 60°), tilted square to the strand.
const RING_REST = { position: [TORUS_MAJOR_R + TORUS_MINOR_R + 15, 0, 0], rotation: [0, 0, 0] };
const RING_CAUGHT = { position: [43, 16, 39], rotation: [-0.2, -1.12, 0] };

// Six beats following the md solution: survey (0); thread the ball-stop
// through the hole — 1st hole-pass, first wrap begins (1); over the tube and
// through the hole again — 2nd hole-pass (2); close the 3rd tube-wrap (3);
// verify the three self-crossings (4); ring test — it catches (5).
// Cord keyframes are wrap-boundary snapshots of the same 97-point winding.
export const animationSteps = [
  {
    label: 'Look: the cord lies loose around the torus — the ring slides freely',
    duration: 2.5,
    cord: unwoundCordPath(),
    ballPos: BALL_START,
    ringXf: RING_REST,
  },
  {
    label: 'Thread the ball-stop down through the hole — 1st hole-pass, and the first wrap begins',
    duration: 3.0,
    cord: windingFrame(1 / 3),
    ballPos: BALL_WRAP1,
    ringXf: RING_REST,
  },
  {
    label: 'Carry the cord over the tube and back through the hole — 2nd hole-pass, 2nd wrap',
    duration: 3.0,
    cord: windingFrame(2 / 3),
    ballPos: BALL_WRAP2,
    ringXf: RING_REST,
  },
  {
    label: 'Over the rim and under once more — the 3rd tube-wrap closes the (2,3) path',
    duration: 3.0,
    cord: fullWindPath(),
    ballPos: BALL_START,
    ringXf: RING_REST,
  },
  {
    label: 'Verify: the cord crosses itself exactly 3 times — one strand, a trefoil',
    duration: 2.5,
    easing: 'linear',
    cord: fullWindPath(),
    ballPos: BALL_START,
    ringXf: RING_REST,
  },
  {
    label: 'Ring test: slide the ring to a crossing — it catches; trapped',
    duration: 2.75,
    easing: 'easeOut',
    cord: fullWindPath(),
    ballPos: BALL_START,
    ringXf: RING_CAUGHT,
  },
];

const highlights = new HighlightCache();

export function updateAnimation(objects, state) {
  const { step, prevStep, t, stepIndex } = resolveStep(animationSteps, state, {
    arrowManager: objects.arrowManager,
    arrowConfigs,
  });

  // Cord and ball-stop glow while the winding is laid on (steps 1-3)
  const winding = stepIndex >= 1 && stepIndex <= 3;
  highlights.set(objects.cord.mesh, winding, 0x4488ff, 0.3);
  highlights.set(objects.ball, winding, 0x4488ff, 0.4);

  // Step 4 — verify: reveal the three crossing beads one at a time, glowing
  // the active one green. From step 5 only the first bead stays lit (gold) —
  // it is the crossing the ring is tested against.
  const verifyActive = stepIndex === 4 ? Math.min(2, Math.floor(t * 3)) : -1;
  objects.crossings.children.forEach((bead, k) => {
    bead.visible = stepIndex > 4 || (stepIndex === 4 && t * 3 >= k + 0.2);
    const lit = k === verifyActive || (stepIndex === 5 && k === 0);
    highlights.set(bead, lit, stepIndex === 5 ? 0xffcc44 : 0x44cc44, 0.8);
  });

  // Ring glows during the final test
  highlights.set(objects.ring, stepIndex === 5, 0xffcc44, 0.3);

  applyStepTransforms(objects, prevStep, step, t, {
    cord: { target: 'cord', kind: 'cordPoints' },
    ballPos: { target: 'ball', kind: 'position' },
    ringXf: { target: 'ring', kind: 'transform' },
  });
}

export function createSVGDiagram(container) {
  const s = svg.createSVG(container, 500, 400);
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const CORD = 'var(--dia-cord, #1f57c4)';
  const RIGID = 'var(--dia-rigid, #8a8275)';
  const RING = 'var(--dia-ring, #b97d12)';
  const GOLD = 'var(--dia-gold, #c79a22)';
  const INKSOFT = 'var(--dia-inksoft, #6a6151)';
  const POS = 'var(--dia-pos, #2f8f43)';

  svg.text(s, 250, 25, 'The Torus Winder — (2,3) Torus Knot', {
    fontSize: 14, anchor: 'middle', fontWeight: 'bold',
  });

  // Torus cross-section view
  const cx = 250, cy = 170;
  // Outer ring of torus (top view)
  svg.ellipse(s, cx, cy, 100, 60, { stroke: RIGID, strokeWidth: 2, fill: 'none' });
  svg.ellipse(s, cx, cy, 50, 30, { stroke: RIGID, strokeWidth: 1, fill: 'var(--dia-surface, #fbf7ee)', dashArray: '4,3' });

  // (2,3) trefoil knot drawn on the torus
  // Simplified: three lobes that wind around the torus
  svg.path(s, `M ${cx + 90} ${cy} C ${cx + 100} ${cy - 50}, ${cx + 40} ${cy - 70}, ${cx} ${cy - 55} C ${cx - 40} ${cy - 40}, ${cx - 100} ${cy - 30}, ${cx - 90} ${cy} C ${cx - 100} ${cy + 30}, ${cx - 40} ${cy + 70}, ${cx} ${cy + 55} C ${cx + 40} ${cy + 40}, ${cx + 100} ${cy + 50}, ${cx + 90} ${cy}`, {
    stroke: CORD, strokeWidth: 3, fill: 'none',
  });

  // Guide notch markers
  const notchPositions = [
    [cx + 90, cy], [cx - 45, cy - 50], [cx - 45, cy + 50],
    [cx + 45, cy - 45], [cx + 45, cy + 45], [cx - 90, cy],
  ];
  for (const [nx, ny] of notchPositions) {
    svg.circle(s, nx, ny, 4, { fill: GOLD, stroke: RING, strokeWidth: 1 });
  }

  // Self-crossing marks on the cord, hidden until the verify step reveals
  // them one at a time. crossings[0] is the one the ring is tested against.
  function crossingMark(x, y) {
    const g = document.createElementNS(SVG_NS, 'g');
    svg.circle(g, x, y, 8, { stroke: POS, strokeWidth: 1.5, fill: 'none' });
    svg.text(g, x, y + 3.5, '✕', { fontSize: 9, anchor: 'middle', fill: POS, fontWeight: 'bold' });
    g.style.transition = 'opacity .25s ease, filter .25s ease';
    g.style.opacity = '0';
    s.appendChild(g);
    return g;
  }
  const crossings = [
    crossingMark(cx + 79, cy - 41),
    crossingMark(cx - 64, cy - 33),
    crossingMark(cx + 64, cy + 41),
  ];

  // Sliding ring — primary animatable element; slides inward and is trapped
  const ring = svg.ellipse(s, cx + 130, cy, 16, 13, { stroke: RING, strokeWidth: 3, fill: 'none' });
  ring.style.transition = 'cx .12s linear, cy .12s linear';

  // Winding bookkeeping (updated per step by the updater) + the punchline
  const counter = svg.text(s, cx, cy + 92, 'hole-passes 0 of 2 · tube-wraps 0 of 3', {
    fontSize: 11, anchor: 'middle', fill: INKSOFT,
  });
  svg.text(s, cx, cy + 109, 'gcd(2,3) = 1 → one strand, 3 crossings: a trefoil', {
    fontSize: 11, anchor: 'middle', fill: CORD, fontWeight: 'bold',
  });

  // Motion arrows showing winding direction (toggled per step by the updater)
  const arrow1 = svg.motionArrow(s, cx + 90, cy - 10, cx + 60, cy - 50, { label: 'Wind through', curvature: 0.3 });
  const arrow2 = svg.motionArrow(s, cx - 50, cy + 40, cx + 50, cy + 40, { label: 'Wrap around', curvature: 0.3 });
  const arrow3 = svg.motionArrow(s, cx + 120, cy, cx + 95, cy - 25, { label: 'Ring catches', curvature: 0.4, color: GOLD });

  // Hand icon near the cord
  svg.handIcon(s, cx + 110, cy + 10, { scale: 0.6, rotation: -25 });

  // Step badges (highlighted per phase by the updater)
  const badge1 = svg.stepBadge(s, 35, 310, 1, 3, { radius: 11 });
  svg.actionLabel(s, 95, 310, 'Wind: 2 hole-passes, 3 tube-wraps');
  const badge2 = svg.stepBadge(s, 35, 335, 2, 3, { radius: 11 });
  svg.actionLabel(s, 95, 335, 'Verify: exactly 3 self-crossings');
  const badge3 = svg.stepBadge(s, 35, 360, 3, 3, { radius: 11 });
  svg.actionLabel(s, 95, 360, 'Ring test: it catches — trapped');
  const badges = [badge1, badge2, badge3];

  // Key insight
  svg.calloutBox(s, 30, 372, 440, 24,
    'How many times you wind through and around decides if the cord is truly knotted!');

  // ---- Timeline updater: sync the 2D ring + counter + crossings + badges +
  // arrows to the six solution beats. Ring keyframes are END-of-step poses
  // (frame 0 doubles as the rest pose): the ring creeps inward as the winding
  // tightens, then slides to the first crossing and catches in step 5.
  const ringKeys = [
    [cx + 130, cy],       // 0: look — free
    [cx + 126, cy],       // 1: 1st hole-pass
    [cx + 122, cy],       // 2: 2nd hole-pass
    [cx + 118, cy],       // 3: 3rd wrap closes the path
    [cx + 118, cy],       // 4: verify crossings
    [cx + 92, cy - 28],   // 5: slides in and catches at crossings[0]
  ];
  const COUNTER_TEXT = [
    'hole-passes 0 of 2 · tube-wraps 0 of 3',
    'hole-passes 1 of 2 · tube-wraps 1 of 3',
    'hole-passes 2 of 2 · tube-wraps 2 of 3',
    'hole-passes 2 of 2 · tube-wraps 3 of 3 — path closed',
    'one strand crossing itself 3 times — a trefoil',
    'the ring cannot pass any of the 3 crossings',
  ];
  const LAST_STEP = ringKeys.length - 1;
  return function update(state) {
    if (!state) return;
    const i = Math.max(0, Math.min(state.stepIndex ?? 0, LAST_STEP));
    const p = Math.max(0, Math.min(state.stepProgress ?? 0, 1));
    const [ringX, ringY] = svg.lerpFrames(ringKeys, i, p);
    ring.setAttribute('cx', ringX);
    ring.setAttribute('cy', ringY);

    counter.textContent = COUNTER_TEXT[i];

    // Verify step: reveal the crossing marks one at a time (active one
    // glows). Afterwards only the catch crossing stays prominent while the
    // ring slides up to it.
    const verifyActive = i === 4 ? Math.min(2, Math.floor(p * 3)) : -1;
    crossings.forEach((g, k) => {
      let opacity = 0;
      let glow = false;
      if (i === 4) {
        opacity = p * 3 >= k + 0.2 ? 1 : 0;
        glow = k === verifyActive;
      } else if (i > 4) {
        opacity = k === 0 ? 1 : 0.45;
        glow = k === 0;
      }
      g.style.opacity = String(opacity);
      g.style.filter = glow ? `drop-shadow(0 0 5px ${POS})` : 'none';
    });

    // Phase badges: winding (steps 1-3), verify (4), ring test (5)
    const phase = i >= 5 ? 2 : i === 4 ? 1 : i >= 1 ? 0 : -1;
    badges.forEach((b, k) => svg.highlight(b, k === phase, { dim: 0.3, color: CORD }));
    svg.highlight(arrow1, i >= 1 && i <= 2, { glow: false, dim: 0 });
    svg.highlight(arrow2, i === 3, { glow: false, dim: 0 });
    svg.highlight(arrow3, i === 5, { glow: false, dim: 0 });
  };
}

export function dispose() {
  highlights.dispose();
}
