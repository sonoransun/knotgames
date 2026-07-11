import * as THREE from 'three';
import { createMaterials } from '../lib/materials.js';
import { createRod, createRing, createBlock } from '../lib/components.js';
import { enableShadowsOnGroup } from '../lib/scene.js';
import { StepArrowManager } from '../lib/arrow-helpers.js';
import { resolveStep, applyStepTransforms, HighlightCache } from '../lib/puzzle-helpers.js';
import * as svg from '../lib/svg.js';

export const metadata = {
  id: 15,
  name: 'The Tricolor Lock',
  difficulty: 'Intermediate',
  principle: 'Fox tricolorability (knot invariant)',
  type: 'Assembly',
  description: 'Color the three arcs of a trefoil so that at every crossing, strands are all the same color or all different. Valid coloring frees a trapped ring — tricolorability is a topological invariant.',
  cameraPosition: [0, 60, 200],
};

const TREFOIL_SCALE = 40;
const ROD_R = 2;

// Trefoil parametric curve
function trefoilPoint(t, scale) {
  const x = Math.sin(t) + 2 * Math.sin(2 * t);
  const y = Math.cos(t) - 2 * Math.cos(2 * t);
  const z = -Math.sin(3 * t);
  return [x * scale, y * scale, z * scale * 0.4];
}

// Generate three separate arcs of the trefoil (between undercrossings)
function trefoilArc(startT, endT, scale, segments = 24) {
  const pts = [];
  for (let i = 0; i <= segments; i++) {
    const t = startT + (endT - startT) * (i / segments);
    pts.push(trefoilPoint(t, scale));
  }
  return pts;
}

// The three arcs of a trefoil, split at the undercrossings
// Trefoil crossings occur at approximately t = 0, 2pi/3, 4pi/3
const ARC_BOUNDS = [
  [0.1, 2 * Math.PI / 3 - 0.1],
  [2 * Math.PI / 3 + 0.1, 4 * Math.PI / 3 - 0.1],
  [4 * Math.PI / 3 + 0.1, 2 * Math.PI - 0.1],
];

function createTrefoilArcs(mats) {
  const group = new THREE.Group();
  const arcMats = [mats.red, mats.blue, mats.yellow];

  for (let i = 0; i < 3; i++) {
    const pts = trefoilArc(ARC_BOUNDS[i][0], ARC_BOUNDS[i][1], TREFOIL_SCALE);
    const arc = createRod(pts, ROD_R, arcMats[i]);
    group.add(arc);
  }

  return group;
}

function createGrayTrefoilArcs(mats) {
  const group = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const pts = trefoilArc(ARC_BOUNDS[i][0], ARC_BOUNDS[i][1], TREFOIL_SCALE);
    const arc = createRod(pts, ROD_R, mats.steel);
    group.add(arc);
  }
  return group;
}

// Crossing markers (small spheres at crossing points).
// Child order: 0 = bottom (t=0, the escape gate), 1 = upper-left (t=2pi/3),
// 2 = upper-right (t=4pi/3).
function createCrossingMarkers(material) {
  const group = new THREE.Group();
  const crossTs = [0, 2 * Math.PI / 3, 4 * Math.PI / 3];
  for (const t of crossTs) {
    const pt = trefoilPoint(t, TREFOIL_SCALE);
    const marker = new THREE.Mesh(new THREE.SphereGeometry(3, 12, 12), material);
    marker.position.set(pt[0], pt[1], pt[2]);
    group.add(marker);
  }
  return group;
}

export function create3DScene() {
  const mats = createMaterials();
  const group = new THREE.Group();

  // Base
  const base = createBlock(140, 8, 140, mats.wood);
  base.position.y = -TREFOIL_SCALE * 2.5;
  group.add(base);

  // Colored trefoil arcs
  const arcs = createTrefoilArcs(mats);
  group.add(arcs);

  // Crossing markers
  const markers = createCrossingMarkers(mats.brass);
  group.add(markers);

  // Trapped ring on the trefoil
  const ring = createRing(30, 3, mats.brass);
  ring.position.set(0, 0, TREFOIL_SCALE * 0.5);
  group.add(ring);

  enableShadowsOnGroup(group);
  return group;
}

export function createAnimScene() {
  const mats = createMaterials();
  const group = new THREE.Group();

  const base = createBlock(140, 8, 140, mats.wood);
  base.position.y = -TREFOIL_SCALE * 2.5;
  group.add(base);

  // Start with gray (uncolored) arcs
  const grayArcs = createGrayTrefoilArcs(mats);
  group.add(grayArcs);

  // Also create colored arcs — the "sleeves"; each child snaps visible in turn
  const coloredArcs = createTrefoilArcs(mats);
  coloredArcs.children.forEach(arc => { arc.visible = false; });
  group.add(coloredArcs);

  const markers = createCrossingMarkers(mats.brass);
  group.add(markers);

  const ring = createRing(30, 3, mats.brass);
  ring.position.set(0, 0, TREFOIL_SCALE * 0.5);
  group.add(ring);

  // Ghost ring at the escape destination — translucent target indicator.
  const ghostMat = mats.brass.clone();
  ghostMat.transparent = true;
  ghostMat.opacity = 0.20;
  ghostMat.depthWrite = false;
  const ghostRing = createRing(30, 3, ghostMat);
  ghostRing.position.set(TREFOIL_SCALE * 1.5, -TREFOIL_SCALE, TREFOIL_SCALE);
  group.add(ghostRing);

  enableShadowsOnGroup(group);
  const arrowManager = new StepArrowManager(group);

  return { group, objects: { grayArcs, coloredArcs, markers, ring, ghostRing, arrowManager } };
}

// Yellow = move the ring to the gate; green = through the open gate.
const arrowConfigs = {
  4: { arrows: [
    { from: [0, 0, TREFOIL_SCALE * 0.5], to: [0, -TREFOIL_SCALE, TREFOIL_SCALE * 0.3], opts: { color: 0xffcc44 } },
  ] },
  5: { arrows: [
    { from: [0, -TREFOIL_SCALE, TREFOIL_SCALE * 0.3], to: [TREFOIL_SCALE * 1.5, -TREFOIL_SCALE, TREFOIL_SCALE], opts: { color: 0x44cc44 } },
  ] },
};

// The ring rests at the front of the trefoil, slides down to the bottom
// (gate) crossing, then escapes through it to the ghost-ring target.
const RING_REST = [0, 0, TREFOIL_SCALE * 0.5];
const RING_GATE = [0, -TREFOIL_SCALE, TREFOIL_SCALE * 0.3];
const RING_FREE = [TREFOIL_SCALE * 1.5, -TREFOIL_SCALE, TREFOIL_SCALE];

// Six beats following the md's solution: identify the arcs (1), snap the
// sleeves on (2), verify the Fox rule crossing by crossing (3-4), then
// slide the ring to the gate and pass it through (5-6). Sequential-sub-beat
// steps (1, 2, 3) use linear easing so their thirds stay evenly paced.
export const animationSteps = [
  {
    label: 'Look: three gray arcs form a trefoil — the ring is trapped',
    duration: 2.5,
    ringPos: RING_REST,
  },
  {
    label: 'Identify the three arcs — each runs from one undercrossing to the next',
    duration: 3.0,
    easing: 'linear',
    ringPos: RING_REST,
  },
  {
    label: 'Snap the color sleeves on: one color per arc — red, blue, yellow',
    duration: 2.5,
    easing: 'linear',
    ringPos: RING_REST,
  },
  {
    label: 'Fox check at each crossing: red, blue, yellow meet — all different ✓',
    duration: 3.0,
    easing: 'linear',
    ringPos: RING_REST,
  },
  {
    label: 'Slide the ring to the escape-gate crossing — three distinct depths, gate open',
    duration: 2.0,
    easing: 'easeInOut',
    ringPos: RING_GATE,
  },
  {
    label: 'Three distinct depths open a channel — the ring passes through, free!',
    duration: 2.5,
    easing: 'easeOut',
    ringPos: RING_FREE,
  },
];

const highlights = new HighlightCache();

// Highlight tints previewing each arc's sleeve color (red, blue, yellow).
const ARC_TINTS = [0xcf3a26, 0x1f57c4, 0xc79a22];
// Crossing-check order: upper-left, upper-right, then the bottom gate last —
// the gate is verified last, right before the ring slides to it.
const CHECK_ORDER = [1, 2, 0];
const GATE_MARKER = 0;

export function updateAnimation(objects, state) {
  const { step, prevStep, t, stepIndex } = resolveStep(animationSteps, state, {
    arrowManager: objects.arrowManager,
    arrowConfigs,
  });

  const grayMeshes = objects.grayArcs.children;
  const coloredMeshes = objects.coloredArcs.children;
  const markerMeshes = objects.markers.children;

  // Step 1 — identify the arcs: spotlight each gray arc in turn, tinted
  // with the color its sleeve will take.
  const identifyActive = stepIndex === 1 ? Math.min(2, Math.floor(t * 3)) : -1;
  grayMeshes.forEach((mesh, k) => highlights.set(mesh, k === identifyActive, ARC_TINTS[k], 0.5));

  // Step 2 — snap the sleeves on one at a time: colored arc k pops on
  // partway through its third of the step, replacing its gray twin.
  const snapT = stepIndex > 2 ? 3 : stepIndex === 2 ? t * 3 : 0;
  for (let k = 0; k < 3; k++) {
    const snapped = snapT >= k + 0.4;
    coloredMeshes[k].visible = snapped;
    grayMeshes[k].visible = !snapped;
  }

  // Step 3 — per-crossing Fox check: glow each crossing marker in turn.
  // From step 4 on, only the gate crossing stays lit — the way out.
  const checkActive = stepIndex === 3 ? Math.min(2, Math.floor(t * 3)) : -1;
  CHECK_ORDER.forEach((markerIdx, k) => {
    const on = k === checkActive || (markerIdx === GATE_MARKER && stepIndex >= 4);
    highlights.set(markerMeshes[markerIdx], on, 0x44cc44, 0.8);
  });

  // Highlight the ring while it is moving (steps 4-5)
  highlights.set(objects.ring, stepIndex >= 4, 0xffcc44, 0.3);

  // Fade the ghost target ring as the active ring approaches it
  if (objects.ghostRing) {
    const lastIndex = animationSteps.length - 1;
    const fadeAmount = stepIndex >= lastIndex ? t : 0;
    objects.ghostRing.material.opacity = 0.20 * (1 - fadeAmount);
    objects.ghostRing.visible = objects.ghostRing.material.opacity > 0.01;
  }

  applyStepTransforms(objects, prevStep, step, t, {
    ringPos: { target: 'ring', kind: 'position' },
  });
}

export function createSVGDiagram(container) {
  const s = svg.createSVG(container, 500, 400);
  const SVG_NS = 'http://www.w3.org/2000/svg';

  const RED = 'var(--dia-neg, #cf3a26)';
  const BLUE = 'var(--dia-cord, #1f57c4)';
  const YELLOW = 'var(--dia-gold, #c79a22)';
  const RING = 'var(--dia-ring, #b97d12)';
  const INK = 'var(--dia-ink, #24211a)';
  const INKSOFT = 'var(--dia-inksoft, #6a6151)';
  const FAINT = 'var(--dia-faint, #c9bda7)';
  const POS = 'var(--dia-pos, #2f8f43)';

  svg.text(s, 250, 25, 'The Tricolor Lock — Fox 3-Coloring', {
    fontSize: 14, anchor: 'middle', fontWeight: 'bold',
  });

  // Trefoil diagram with three colored arcs
  const cx = 250, cy = 170;

  // Arc 1 (Red) — top lobe
  const arcRed = svg.path(s, `M ${cx + 15} ${cy - 10} C ${cx + 50} ${cy - 70}, ${cx - 50} ${cy - 70}, ${cx - 15} ${cy - 10}`, {
    stroke: RED, strokeWidth: 4, fill: 'none',
  });

  // Arc 2 (Blue) — bottom-right lobe
  const arcBlue = svg.path(s, `M ${cx - 15} ${cy + 5} C ${cx + 10} ${cy + 70}, ${cx + 70} ${cy + 20}, ${cx + 15} ${cy - 5}`, {
    stroke: BLUE, strokeWidth: 4, fill: 'none',
  });

  // Arc 3 (Yellow) — bottom-left lobe
  const arcYellow = svg.path(s, `M ${cx + 10} ${cy + 5} C ${cx - 20} ${cy + 70}, ${cx - 70} ${cy + 20}, ${cx - 10} ${cy - 5}`, {
    stroke: YELLOW, strokeWidth: 4, fill: 'none',
  });

  // Crossing indicators with over/under gaps (occlusion uses surface token).
  // Left (cx-15, cy-5), right (cx+15, cy-5), bottom (cx, cy+15) — the bottom
  // crossing is the escape gate.
  svg.crossingGap(s, cx - 15, cy - 5, Math.PI / 4, 14);
  svg.crossingGap(s, cx + 15, cy - 5, -Math.PI / 4, 14);
  svg.crossingGap(s, cx, cy + 15, 0, 14);

  // Redraw over-strands after gaps
  const overYellow = svg.path(s, `M ${cx - 20} ${cy - 12} L ${cx - 10} ${cy + 2}`, {
    stroke: YELLOW, strokeWidth: 4, fill: 'none',
  });
  const overRed = svg.path(s, `M ${cx + 20} ${cy - 12} L ${cx + 10} ${cy + 2}`, {
    stroke: RED, strokeWidth: 4, fill: 'none',
  });
  const overBlue = svg.path(s, `M ${cx - 5} ${cy + 10} L ${cx + 5} ${cy + 20}`, {
    stroke: BLUE, strokeWidth: 4, fill: 'none',
  });

  // Arc labels
  const labelRed = svg.text(s, cx, cy - 65, 'Arc 1 (Red)', { fontSize: 10, anchor: 'middle', fill: RED, fontWeight: 'bold' });
  const labelBlue = svg.text(s, cx + 65, cy + 40, 'Arc 2 (Blue)', { fontSize: 10, anchor: 'middle', fill: BLUE, fontWeight: 'bold' });
  const labelYellow = svg.text(s, cx - 65, cy + 40, 'Arc 3 (Yellow)', { fontSize: 10, anchor: 'middle', fill: YELLOW, fontWeight: 'bold' });

  // Each arc's elements start desaturated (bare steel); the updater snaps
  // the color on during the sleeve step and spotlights arcs one at a time
  // during the identify step, glowing in the arc's future color.
  const arcEls = [
    [arcRed, overRed, labelRed],
    [arcBlue, overBlue, labelBlue],
    [arcYellow, overYellow, labelYellow],
  ];
  const arcGlows = [RED, BLUE, YELLOW];
  for (const els of arcEls) {
    for (const el of els) {
      el.style.transition = 'opacity .25s ease, filter .25s ease';
      el.style.filter = 'grayscale(1)';
    }
  }

  // Per-crossing Fox-check annotations ('R·B·Y ✓'), hidden until the check
  // step reveals them one crossing at a time. Order: left, right, gate.
  function crossingCheck(x, y, tx, ty) {
    const g = document.createElementNS(SVG_NS, 'g');
    svg.circle(g, x, y, 11, { stroke: POS, strokeWidth: 1.5, fill: 'none' });
    svg.text(g, tx, ty, 'R·B·Y ✓', { fontSize: 10, anchor: 'middle', fill: POS, fontWeight: 'bold' });
    g.style.transition = 'opacity .25s ease, filter .25s ease';
    g.style.opacity = '0';
    s.appendChild(g);
    return g;
  }
  const checks = [
    crossingCheck(cx - 15, cy - 5, cx - 82, cy - 25),  // left crossing
    crossingCheck(cx + 15, cy - 5, cx + 82, cy - 25),  // right crossing
    crossingCheck(cx, cy + 15, cx, cy + 78),           // bottom crossing — the gate
  ];

  // Ring — animatable primary element
  const ring = svg.ellipse(s, cx, cy, 15, 12, { stroke: RING, strokeWidth: 2.5, fill: 'none' });
  ring.style.transition = 'cx .12s linear, cy .12s linear';

  // Motion arrow showing ring exit (toggled per step by the updater)
  const arrowExit = svg.motionArrow(s, cx + 5, cy + 15, cx + 55, cy + 50, { label: 'Slide ring out', curvature: 0.3 });

  // Hand icon near the ring
  svg.handIcon(s, cx + 20, cy + 5, { scale: 0.6, rotation: 30 });

  // Coloring rule box
  svg.rect(s, 50, 260, 400, 45, { fill: 'var(--dia-surface, #fbf7ee)', stroke: FAINT, strokeWidth: 1, rx: 4 });
  svg.text(s, 250, 278, 'Fox rule: at every crossing — all same OR all different', {
    fontSize: 11, anchor: 'middle', fontWeight: 'bold', fill: INK,
  });
  svg.text(s, 250, 294, 'The gate opens only on all-different: proof of a nontrivial coloring', {
    fontSize: 10, anchor: 'middle', fill: INKSOFT,
  });

  // Step badges (highlighted per phase by the updater)
  const badge1 = svg.stepBadge(s, 30, 316, 1, 3, { radius: 10 });
  svg.actionLabel(s, 140, 316, 'Identify arcs, add sleeves');
  const badge2 = svg.stepBadge(s, 30, 339, 2, 3, { radius: 10 });
  svg.actionLabel(s, 140, 339, 'Fox check at each crossing');
  const badge3 = svg.stepBadge(s, 30, 362, 3, 3, { radius: 10 });
  svg.actionLabel(s, 140, 362, 'Slide ring through the gate');
  const badges = [badge1, badge2, badge3];

  // Key insight
  svg.calloutBox(s, 30, 377, 440, 20,
    'If you can 3-color it, it is a real knot — a simple visual test!');

  // ---- Timeline updater: sync the 2D arcs + checks + ring + badges to the
  // solution. animationSteps: 0=look, 1=identify arcs, 2=snap sleeves,
  // 3=per-crossing Fox check, 4=slide to the gate, 5=pass through.
  // Ring keyframes (END-of-step poses; frame 0 doubles as the rest pose):
  // parked through the coloring work, down to the bottom-gate crossing in
  // step 4, then out toward the lower right (mirroring the 3D escape).
  const ringKeys = [
    [cx, cy],            // 0: look
    [cx, cy],            // 1: identify arcs
    [cx, cy],            // 2: snap sleeves on
    [cx, cy],            // 3: Fox check
    [cx, cy + 15],       // 4: slide to the gate crossing
    [cx + 55, cy + 50],  // 5: through the gate — free
  ];
  const LAST_STEP = ringKeys.length - 1;
  return function update(state) {
    if (!state) return;
    const i = Math.max(0, Math.min(state.stepIndex ?? 0, LAST_STEP));
    const p = Math.max(0, Math.min(state.stepProgress ?? 0, 1));
    const [ringX, ringY] = svg.lerpFrames(ringKeys, i, p);
    ring.setAttribute('cx', ringX);
    ring.setAttribute('cy', ringY);

    // Arcs: gray until their sleeve snaps on (step 2 colors them one at a
    // time, matching the 3D); step 1 spotlights each arc in turn.
    const identify = i === 1 ? Math.min(2, Math.floor(p * 3)) : -1;
    arcEls.forEach((els, k) => {
      const sleeveT = i > 2 ? 1 : i === 2 ? Math.max(0, Math.min(1, p * 3 - k)) : 0;
      const gray = `grayscale(${(1 - sleeveT).toFixed(3)})`;
      const active = k === identify;
      for (const el of els) {
        el.style.opacity = identify === -1 || active ? '1' : '0.3';
        el.style.filter = active ? `${gray} drop-shadow(0 0 5px ${arcGlows[k]})` : gray;
      }
    });

    // Fox check: reveal 'R·B·Y ✓' crossing by crossing during step 3 (the
    // active one glows; earlier ones stay lit). Afterward only the gate
    // check stays prominent — it glows while the ring slides to it.
    const checkActive = i === 3 ? Math.min(2, Math.floor(p * 3)) : -1;
    checks.forEach((g, k) => {
      let opacity = 0;
      let glow = false;
      if (i === 3) {
        opacity = p * 3 >= k ? 1 : 0;
        glow = k === checkActive;
      } else if (i > 3) {
        const isGate = k === 2;
        opacity = isGate ? 1 : 0.45;
        glow = isGate && i === 4;
      }
      g.style.opacity = String(opacity);
      g.style.filter = glow ? `drop-shadow(0 0 5px ${POS})` : 'none';
    });

    // Phase badges: 0 = identify + snap sleeves (steps 1-2), 1 = Fox check
    // (step 3), 2 = slide through the gate (steps 4-5); none during the look.
    const phase = i >= 4 ? 2 : i === 3 ? 1 : i >= 1 ? 0 : -1;
    badges.forEach((b, k) => svg.highlight(b, k === phase, { dim: 0.3, color: BLUE }));
    // Exit arrow only relevant on the final pass-through step.
    svg.highlight(arrowExit, i === 5, { glow: false, dim: 0 });
  };
}

export function dispose() {
  highlights.dispose();
}
