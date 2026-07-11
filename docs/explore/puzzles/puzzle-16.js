import * as THREE from 'three';
import { createMaterials, createHighlightMaterial, applyHighlight, removeHighlight } from '../lib/materials.js';
import { createRod, createRing, createBall, createBlock } from '../lib/components.js';
import { enableShadowsOnGroup } from '../lib/scene.js';
import { StepArrowManager } from '../lib/arrow-helpers.js';
import * as svg from '../lib/svg.js';

export const metadata = {
  id: 9,
  name: 'The Crossing Number',
  difficulty: 'Beginner-Intermediate',
  principle: 'Unknotting number (crossing changes)',
  type: 'Transformation',
  description: 'A figure-eight knot frame has 4 crossings controlled by flippable pins. On this minimal diagram flipping any one pin converts the knot to the unknot (u = 1) and frees the trapped ring — the real task is predicting which Reidemeister moves a flip unlocks before touching it.',
  cameraPosition: [0, 60, 200],
};

const FIG8_SCALE = 40;
const ROD_R = 2;
const PIN_RADIUS = 1.5;
const PIN_HEIGHT = 15;

// Figure-eight knot parametric curve
function fig8Point(t, scale) {
  const x = (2 + Math.cos(2 * t)) * Math.cos(3 * t);
  const y = (2 + Math.cos(2 * t)) * Math.sin(3 * t);
  const z = Math.sin(4 * t);
  return [x * scale * 0.4, y * scale * 0.4, z * scale * 0.25];
}

function fig8Points(scale, segments = 80) {
  const pts = [];
  for (let i = 0; i <= segments; i++) {
    const t = (2 * Math.PI * i) / segments;
    pts.push(fig8Point(t, scale));
  }
  return pts;
}

// Crossing pin positions (approximate crossing locations on figure-eight)
const CROSSING_POSITIONS = [
  { pos: [0, FIG8_SCALE * 0.5, 0], label: 'A' },
  { pos: [FIG8_SCALE * 0.4, 0, 0], label: 'B' },
  { pos: [0, -FIG8_SCALE * 0.5, 0], label: 'C' },  // The worked-example flip (any of the four unknots this diagram)
  { pos: [-FIG8_SCALE * 0.4, 0, 0], label: 'D' },
];

function createPin(pos, material, highlighted = false) {
  const group = new THREE.Group();
  const pinMat = highlighted
    ? new THREE.MeshStandardMaterial({ color: 0x33cc33, metalness: 0.7, roughness: 0.3 })
    : material;

  const pin = new THREE.Mesh(
    new THREE.CylinderGeometry(PIN_RADIUS, PIN_RADIUS, PIN_HEIGHT, 8),
    pinMat
  );
  pin.position.set(pos[0], pos[1], pos[2]);
  pin.rotation.x = Math.PI / 2;
  group.add(pin);

  // Pin cap
  const cap = createBall(5, pinMat);
  cap.position.set(pos[0], pos[1], pos[2] + PIN_HEIGHT / 2);
  group.add(cap);

  return group;
}

function createFig8Frame(material) {
  const pts = fig8Points(FIG8_SCALE);
  return createRod(pts, ROD_R, material, true);
}

export function create3DScene() {
  const mats = createMaterials();
  const group = new THREE.Group();

  // Base
  const base = createBlock(150, 8, 150, mats.wood);
  base.position.y = -FIG8_SCALE * 1.5;
  group.add(base);

  // Figure-eight knot frame
  const frame = createFig8Frame(mats.steel);
  group.add(frame);

  // Crossing pins
  for (const crossing of CROSSING_POSITIONS) {
    group.add(createPin(crossing.pos, mats.brass));
  }

  // Trapped ring
  const ring = createRing(25, 3, mats.brass);
  ring.position.set(0, 0, FIG8_SCALE * 0.3);
  group.add(ring);

  enableShadowsOnGroup(group);
  return group;
}

export function createAnimScene() {
  const mats = createMaterials();
  const group = new THREE.Group();

  const base = createBlock(150, 8, 150, mats.wood);
  base.position.y = -FIG8_SCALE * 1.5;
  group.add(base);

  const frame = createFig8Frame(mats.steel);
  group.add(frame);

  // Create pins with crossing C highlighted
  const pins = [];
  for (let i = 0; i < CROSSING_POSITIONS.length; i++) {
    const pin = createPin(CROSSING_POSITIONS[i].pos, mats.brass, i === 2);
    pins.push(pin);
    group.add(pin);
  }

  const ring = createRing(25, 3, mats.brass);
  ring.position.set(0, 0, FIG8_SCALE * 0.3);
  group.add(ring);

  enableShadowsOnGroup(group);
  const arrowManager = new StepArrowManager(group);

  return { group, objects: { ring, pinC: pins[2], arrowManager } };
}

const arrowConfigs = {
  1: { arrows: [
    { from: [0, -FIG8_SCALE * 0.3, 5], to: [0, -FIG8_SCALE * 0.5, 5], opts: { color: 0x33cc33 } },
  ]},
  2: { arrows: [
    { from: [0, -FIG8_SCALE * 0.5, -5], to: [0, -FIG8_SCALE * 0.5, 10], opts: { color: 0x33cc33 } },
  ]},
  3: { arrows: [
    { from: [0, 0, FIG8_SCALE * 0.3], to: [FIG8_SCALE * 1.5, -FIG8_SCALE, FIG8_SCALE], opts: { color: 0x44cc44 } },
  ]},
};
let highlightMat = null;

export const animationSteps = [
  {
    label: 'Study the diagram: four crossings pair into two clasps — ring is trapped',
    duration: 2.0,
    ringPos: [0, 0, FIG8_SCALE * 0.3],
    pinFlipped: false,
  },
  {
    label: 'Predict: flipping C (green, our pick — any pin works) opens its clasp for an R-II slide',
    duration: 2.0,
    ringPos: [0, 0, FIG8_SCALE * 0.3],
    pinFlipped: false,
  },
  {
    label: 'Flip pin C to swap the over-under — the predicted moves unlock and the knot dissolves',
    duration: 2.5,
    ringPos: [0, 0, FIG8_SCALE * 0.3],
    pinFlipped: true,
  },
  {
    label: 'Slide the ring off — right on schedule; the skill was seeing it coming',
    duration: 2.5,
    ringPos: [FIG8_SCALE * 1.5, -FIG8_SCALE, FIG8_SCALE],
    pinFlipped: true,
  },
];

export function updateAnimation(objects, state) {
  const { stepIndex, stepProgress } = state;

  // Direction arrows
  if (objects.arrowManager) {
    objects.arrowManager.showForStep(stepIndex, arrowConfigs);
    objects.arrowManager.updateOpacity(stepProgress);
  }

  // Highlight ring during movement
  if (stepIndex >= 1) {
    if (!highlightMat) {
      highlightMat = createHighlightMaterial(objects.ring.material, 0xffcc44, 0.3);
    }
    applyHighlight(objects.ring, highlightMat);
  } else {
    removeHighlight(objects.ring);
  }

  const step = animationSteps[stepIndex];
  const prevStep = stepIndex > 0 ? animationSteps[stepIndex - 1] : animationSteps[0];

  // Animate pin flip (rotate 180 degrees)
  if (step.pinFlipped && !prevStep.pinFlipped) {
    objects.pinC.rotation.x = stepProgress * Math.PI;
  } else if (step.pinFlipped) {
    objects.pinC.rotation.x = Math.PI;
  }

  // Interpolate ring position
  const f = prevStep.ringPos;
  const t = step.ringPos;
  objects.ring.position.set(
    f[0] + (t[0] - f[0]) * stepProgress,
    f[1] + (t[1] - f[1]) * stepProgress,
    f[2] + (t[2] - f[2]) * stepProgress,
  );
}

// ---------------------------------------------------------------------------
// 2D diagram
//
// Screen-space projection of the same figure-eight parametrization the 3D
// frame uses: x = (2 + cos 2t) cos 3t, y = (2 + cos 2t) sin 3t (screen y
// flipped). This is the standard alternating 4_1 diagram, identical to the
// hand-authored diagrams/puzzles/16-the-crossing-number/setup.svg. The four
// crossings sit at the compass points; z = sin 4t decides over/under
// (Gauss code OA UD OB UA OC UB OD UC):
//   A north: strands at t = pi/6 (over) and 5pi/6 (under)
//   B east:  strands at t = 2pi/3 (over) and 4pi/3 (under)
//   C south: strands at t = 7pi/6 (over) and 11pi/6 (under)  <- the flip
//   D west:  strands at t = pi/3 (under) and 5pi/3 (over)

const SVG_NS = 'http://www.w3.org/2000/svg';

function fig8Screen(t, cx, cy, scale) {
  const r = 2 + Math.cos(2 * t);
  return [cx + scale * r * Math.cos(3 * t), cy - scale * r * Math.sin(3 * t)];
}

function fig8ScreenTangent(t, cx, cy, scale) {
  const [x0, y0] = fig8Screen(t - 0.01, cx, cy, scale);
  const [x1, y1] = fig8Screen(t + 0.01, cx, cy, scale);
  return Math.atan2(y1 - y0, x1 - x0);
}

function fig8PathD(t0, t1, cx, cy, scale, segments, close = false) {
  const pts = [];
  for (let i = 0; i <= segments; i++) {
    const [x, y] = fig8Screen(t0 + ((t1 - t0) * i) / segments, cx, cy, scale);
    pts.push(`${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return `M ${pts.join(' L ')}${close ? ' Z' : ''}`;
}

export function createSVGDiagram(container) {
  const s = svg.createSVG(container, 500, 400);
  const RIGID = 'var(--dia-rigid, #8a8275)';
  const RING = 'var(--dia-ring, #b97d12)';
  const POS = 'var(--dia-pos, #2f8f43)';
  const NEG = 'var(--dia-neg, #cf3a26)';
  const FAINT = 'var(--dia-faint, #c9bda7)';
  const SURFACE = 'var(--dia-surface, #fbf7ee)';

  svg.text(s, 250, 25, 'The Crossing Number — Figure-Eight Knot', {
    fontSize: 14, anchor: 'middle', fontWeight: 'bold',
  });

  const cx = 250, cy = 150, SC = 21, WIRE = 2.5;

  // One visually continuous figure-eight wire (the under strand everywhere)
  svg.path(s, fig8PathD(0, 2 * Math.PI, cx, cy, SC, 240, true), {
    stroke: RIGID, strokeWidth: WIRE, strokeLinecap: 'round',
  });

  // Occlusion idiom (see crossingGap in lib/svg.js): break the base curve
  // with a surface-colored stroke along the over strand's tangent, then
  // redraw the over segment on top. tOver picks which strand wins.
  const overSegment = (parent, tOver) => {
    const g = document.createElementNS(SVG_NS, 'g');
    const [px, py] = fig8Screen(tOver, cx, cy, SC);
    svg.crossingGap(g, px, py, fig8ScreenTangent(tOver, cx, cy, SC), 19);
    const r = 2 + Math.cos(2 * tOver);
    const dt = 17 / (SC * Math.sqrt(4 * Math.sin(2 * tOver) ** 2 + 9 * r * r));
    svg.path(g, fig8PathD(tOver - dt, tOver + dt, cx, cy, SC, 12), {
      stroke: RIGID, strokeWidth: WIRE, strokeLinecap: 'round',
    });
    parent.appendChild(g);
    return g;
  };

  // Static crossings — over/under senses match setup.svg exactly
  overSegment(s, Math.PI / 6);        // A: north
  overSegment(s, (2 * Math.PI) / 3);  // B: east
  overSegment(s, (5 * Math.PI) / 3);  // D: west
  // Crossing C is prebuilt in BOTH senses; the updater crossfades them
  // during the flip step and swaps which one renders on top at p >= 0.5.
  const cWrap = document.createElementNS(SVG_NS, 'g');
  s.appendChild(cWrap);
  const cUnder = overSegment(cWrap, (11 * Math.PI) / 6); // flipped sense
  const cOver = overSegment(cWrap, (7 * Math.PI) / 6);   // original sense (starts on top)
  cUnder.style.opacity = '0';

  // Trapped ring threaded on the upper-left arc (wire passes back over it)
  const tRing = 2.903;
  const [rx0, ry0] = fig8Screen(tRing, cx, cy, SC);
  const ring = svg.circle(s, rx0, ry0, 8, { stroke: RING, strokeWidth: 2.5 });
  ring.style.transition = 'cx .12s linear, cy .12s linear';
  // Occlusion sized for the ring's small rim (setup.svg proportions: 7 wide,
  // 10 long — crossingGap's fixed 8-wide stroke bites too much of an r=8
  // ring), then the wire redrawn from the upstream rim crossing through it.
  const tOccl = tRing + 0.044; // downstream rim crossing
  const [ox, oy] = fig8Screen(tOccl, cx, cy, SC);
  const oang = fig8ScreenTangent(tOccl, cx, cy, SC);
  const occl = svg.line(s,
    ox - 5 * Math.cos(oang), oy - 5 * Math.sin(oang),
    ox + 5 * Math.cos(oang), oy + 5 * Math.sin(oang),
    { stroke: SURFACE, strokeWidth: 7 });
  occl.setAttribute('stroke-linecap', 'round');
  svg.path(s, fig8PathD(tRing - 0.042, tRing + 0.1, cx, cy, SC, 10), {
    stroke: RIGID, strokeWidth: WIRE, strokeLinecap: 'round',
  });
  svg.label(s, 150, 104, 196, 109, 'Ring');

  // Crossing pins: small offset labeled circles with dashed leader lines
  // (never drawn on the crossings themselves — those use the occlusion idiom)
  const pin = (fx, fy, tx, ty, px, py, letter, color) => {
    const g = document.createElementNS(SVG_NS, 'g');
    svg.line(g, fx, fy, tx, ty, { stroke: FAINT, strokeWidth: 0.75, dashArray: '2.5,2' });
    svg.circle(g, px, py, 8, { fill: SURFACE, stroke: color, strokeWidth: 1.5 });
    svg.text(g, px, py, letter, {
      fontSize: 9.5, anchor: 'middle', fill: color, fontWeight: 'bold', dominantBaseline: 'central',
    });
    s.appendChild(g);
    return g;
  };
  pin(250, 87.5, 250, 79, 250, 70, 'A', NEG);
  pin(291.5, 150, 321.5, 150, 331, 150, 'B', NEG);
  const pinC = pin(250, 212.5, 250, 221, 250, 230, 'C', POS);
  pin(208.5, 150, 178.5, 150, 169, 150, 'D', NEG);

  // Motion arrows (revealed per step by the updater)
  const arrowFlip = svg.motionArrow(s, 280, 212, 280, 242, { label: 'Flip pin C', curvature: -0.3 });
  const arrowExit = svg.motionArrow(s, 192, 100, 152, 72, { label: 'Ring slides out', curvature: 0.3 });
  svg.handIcon(s, 303, 234, { scale: 0.5 });

  // Explanation
  svg.rect(s, 40, 252, 420, 46, { fill: 'var(--dia-wash, #ece3d0)', stroke: FAINT, strokeWidth: 1, rx: 4 });
  svg.text(s, 250, 268, 'How it works:', { fontSize: 11, anchor: 'middle', fontWeight: 'bold', fill: 'var(--dia-ink, #24211a)' });
  svg.text(s, 250, 283, 'Flipping one crossing pin swaps which strand goes over and under', {
    fontSize: 10, anchor: 'middle', fill: 'var(--dia-inksoft, #6a6151)',
  });
  svg.text(s, 250, 295, 'Any one flip unknots this diagram — predict the route, then flip C', {
    fontSize: 10, anchor: 'middle', fill: POS, fontWeight: 'bold',
  });

  // Step badges
  const badge1 = svg.stepBadge(s, 50, 312, 1, null, { radius: 11 });
  svg.actionLabel(s, 150, 312, 'Predict C’s route (R-II)');
  const badge2 = svg.stepBadge(s, 50, 336, 2, null, { radius: 11 });
  svg.actionLabel(s, 150, 336, 'Flip pin C over');
  const badge3 = svg.stepBadge(s, 50, 360, 3, null, { radius: 11 });
  svg.actionLabel(s, 150, 360, 'Slide ring free');
  const badges = [badge1, badge2, badge3];

  // Mini legend: how to read a crossing
  svg.line(s, 300, 341, 318, 331, { stroke: RIGID, strokeWidth: 2 });
  svg.crossingGap(s, 309, 336, Math.atan2(10, 18), 11);
  svg.line(s, 300, 331, 318, 341, { stroke: RIGID, strokeWidth: 2 });
  svg.text(s, 326, 339, 'break = strand passes under', { fontSize: 9, fill: 'var(--dia-inksoft, #6a6151)' });

  svg.calloutBox(s, 30, 374, 440, 25, 'One flip is all it takes — every pin works here; the skill is seeing it coming!');

  // ---- Timeline updater: predict at pin C, crossfade the crossing flip, slide free
  return function update(state) {
    const i = state.stepIndex | 0;
    const p = state.stepProgress ?? 0;

    // ring slides out only on the last step
    const slide = i >= 3 ? p : 0;
    ring.setAttribute('cx', (rx0 - 55 * slide).toFixed(1));
    ring.setAttribute('cy', (ry0 - 38 * slide).toFixed(1));

    // crossing C: crossfade original sense -> flipped sense during the flip
    // step; whichever sense holds the majority renders on top
    const flip = i < 2 ? 0 : i === 2 ? Math.min(Math.max(p, 0), 1) : 1;
    cOver.style.opacity = String(1 - flip);
    cUnder.style.opacity = String(flip);
    const top = flip >= 0.5 ? cUnder : cOver;
    if (cWrap.lastChild !== top) cWrap.appendChild(top);

    // emphasize pin C through the predict/flip steps (dim floor keeps it
    // legible in the other steps — step 0 presents all four pins)
    svg.highlight(pinC, i >= 1 && i <= 2, { color: POS, dim: 0.45 });

    const phase = i <= 1 ? 0 : i === 2 ? 1 : 2;
    badges.forEach((b, k) => svg.highlight(b, k === phase, { dim: 0.3, color: POS }));
    svg.highlight(arrowFlip, i === 2, { glow: false, dim: 0 });
    svg.highlight(arrowExit, i >= 3, { glow: false, dim: 0 });
  };
}

export function dispose() {}
