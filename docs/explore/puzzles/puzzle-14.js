import * as THREE from 'three';
import { createMaterials, createHighlightMaterial, applyHighlight, removeHighlight } from '../lib/materials.js';
import { createRod, createRing, createBlock } from '../lib/components.js';
import { enableShadowsOnGroup } from '../lib/scene.js';
import { StepArrowManager } from '../lib/arrow-helpers.js';
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
const CROSSING_GAP = 10;

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

// Crossing markers (small spheres at crossing points)
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

  // Also create colored arcs (hidden initially)
  const coloredArcs = createTrefoilArcs(mats);
  coloredArcs.visible = false;
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

  return { group, objects: { grayArcs, coloredArcs, ring, ghostRing, arrowManager } };
}

const arrowConfigs = {
  1: { arrows: [
    { from: [0, TREFOIL_SCALE * 0.8, 0], to: [0, 0, TREFOIL_SCALE * 0.5], opts: { color: 0xdd3333 } },
  ]},
  3: { arrows: [
    { from: [0, 0, TREFOIL_SCALE * 0.5], to: [TREFOIL_SCALE * 1.5, -TREFOIL_SCALE, TREFOIL_SCALE], opts: { color: 0x44cc44 } },
  ]},
};
let highlightMat = null;

export const animationSteps = [
  {
    label: 'Look: three gray arcs form a trefoil — the ring is trapped',
    duration: 2.0,
    colored: false,
    ringPos: [0, 0, TREFOIL_SCALE * 0.5],
  },
  {
    label: 'Paint each arc a different color: red, blue, yellow',
    duration: 2.5,
    easing: 'easeIn',
    colored: true,
    ringPos: [0, 0, TREFOIL_SCALE * 0.5],
  },
  {
    label: 'Check each crossing — all three colors meet at every one',
    duration: 2.0,
    colored: true,
    ringPos: [0, 0, TREFOIL_SCALE * 0.5],
  },
  {
    label: 'Slide the ring out through the color-aligned crossing',
    duration: 2.5,
    easing: 'easeOut',
    colored: true,
    ringPos: [TREFOIL_SCALE * 1.5, -TREFOIL_SCALE, TREFOIL_SCALE],
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

  // Toggle coloring visibility
  objects.grayArcs.visible = !step.colored;
  objects.coloredArcs.visible = step.colored;

  // Fade the ghost target ring as the active ring approaches it
  if (objects.ghostRing) {
    const lastIndex = animationSteps.length - 1;
    const fadeAmount = stepIndex >= lastIndex ? stepProgress : 0;
    objects.ghostRing.material.opacity = 0.20 * (1 - fadeAmount);
    objects.ghostRing.visible = objects.ghostRing.material.opacity > 0.01;
  }

  // Interpolate ring position
  const prevStep = stepIndex > 0 ? animationSteps[stepIndex - 1] : animationSteps[0];
  const f = prevStep.ringPos;
  const t = step.ringPos;
  objects.ring.position.set(
    f[0] + (t[0] - f[0]) * stepProgress,
    f[1] + (t[1] - f[1]) * stepProgress,
    f[2] + (t[2] - f[2]) * stepProgress,
  );
}

export function createSVGDiagram(container) {
  const s = svg.createSVG(container, 500, 400);

  const RED = 'var(--dia-neg, #cf3a26)';
  const BLUE = 'var(--dia-cord, #1f57c4)';
  const YELLOW = 'var(--dia-gold, #c79a22)';
  const RING = 'var(--dia-ring, #b97d12)';
  const INK = 'var(--dia-ink, #24211a)';
  const INKSOFT = 'var(--dia-inksoft, #6a6151)';
  const FAINT = 'var(--dia-faint, #c9bda7)';
  const WASH = 'var(--dia-wash, #ece3d0)';

  svg.text(s, 250, 25, 'The Tricolor Lock — Fox 3-Coloring', {
    fontSize: 14, anchor: 'middle', fontWeight: 'bold',
  });

  // Trefoil diagram with three colored arcs
  const cx = 250, cy = 170;
  const R = 60;

  // Arc 1 (Red) — top lobe
  svg.path(s, `M ${cx + 15} ${cy - 10} C ${cx + 50} ${cy - 70}, ${cx - 50} ${cy - 70}, ${cx - 15} ${cy - 10}`, {
    stroke: RED, strokeWidth: 4, fill: 'none',
  });

  // Arc 2 (Blue) — bottom-right lobe
  svg.path(s, `M ${cx - 15} ${cy + 5} C ${cx + 10} ${cy + 70}, ${cx + 70} ${cy + 20}, ${cx + 15} ${cy - 5}`, {
    stroke: BLUE, strokeWidth: 4, fill: 'none',
  });

  // Arc 3 (Yellow) — bottom-left lobe
  svg.path(s, `M ${cx + 10} ${cy + 5} C ${cx - 20} ${cy + 70}, ${cx - 70} ${cy + 20}, ${cx - 10} ${cy - 5}`, {
    stroke: YELLOW, strokeWidth: 4, fill: 'none',
  });

  // Crossing indicators with over/under gaps (occlusion uses surface token)
  svg.crossingGap(s, cx - 15, cy - 5, Math.PI / 4, 14);
  svg.crossingGap(s, cx + 15, cy - 5, -Math.PI / 4, 14);
  svg.crossingGap(s, cx, cy + 15, 0, 14);

  // Redraw over-strands after gaps
  svg.path(s, `M ${cx - 20} ${cy - 12} L ${cx - 10} ${cy + 2}`, {
    stroke: YELLOW, strokeWidth: 4, fill: 'none',
  });
  svg.path(s, `M ${cx + 20} ${cy - 12} L ${cx + 10} ${cy + 2}`, {
    stroke: RED, strokeWidth: 4, fill: 'none',
  });
  svg.path(s, `M ${cx - 5} ${cy + 10} L ${cx + 5} ${cy + 20}`, {
    stroke: BLUE, strokeWidth: 4, fill: 'none',
  });

  // Arc labels
  svg.text(s, cx, cy - 65, 'Arc 1 (Red)', { fontSize: 10, anchor: 'middle', fill: RED, fontWeight: 'bold' });
  svg.text(s, cx + 65, cy + 40, 'Arc 2 (Blue)', { fontSize: 10, anchor: 'middle', fill: BLUE, fontWeight: 'bold' });
  svg.text(s, cx - 65, cy + 40, 'Arc 3 (Yellow)', { fontSize: 10, anchor: 'middle', fill: YELLOW, fontWeight: 'bold' });

  // Ring — animatable primary element
  const ring = svg.ellipse(s, cx, cy, 15, 12, { stroke: RING, strokeWidth: 2.5, fill: 'none' });
  ring.style.transition = 'cx .12s linear, cy .12s linear';

  // Motion arrow showing ring exit (toggled per step by the updater)
  const arrowExit = svg.motionArrow(s, cx + 5, cy + 15, cx + 55, cy + 50, { label: 'Slide ring out', curvature: 0.3 });

  // Hand icon near the ring
  svg.handIcon(s, cx + 20, cy + 5, { scale: 0.6, rotation: 30 });

  // Coloring rule box
  svg.rect(s, 50, 260, 400, 45, { fill: 'var(--dia-surface, #fbf7ee)', stroke: FAINT, strokeWidth: 1, rx: 4 });
  svg.text(s, 250, 278, '3-Color Rule:', { fontSize: 11, anchor: 'middle', fontWeight: 'bold', fill: INK });
  svg.text(s, 250, 294, 'At each crossing, all three strands must be different colors', {
    fontSize: 10, anchor: 'middle', fill: INKSOFT,
  });

  // Step badges (highlighted per phase by the updater)
  const badge1 = svg.stepBadge(s, 35, 320, 1, 3, { radius: 11 });
  svg.actionLabel(s, 95, 320, 'Paint each arc a color');
  const badge2 = svg.stepBadge(s, 35, 345, 2, 3, { radius: 11 });
  svg.actionLabel(s, 95, 345, 'Check all crossings');
  const badge3 = svg.stepBadge(s, 35, 370, 3, 3, { radius: 11 });
  svg.actionLabel(s, 95, 370, 'Slide ring through');
  const badges = [badge1, badge2, badge3];

  // Key insight
  const calloutRect = svg.rect(s, 30, 385, 440, 25, { fill: WASH, stroke: RING, strokeWidth: 1, rx: 4 });
  calloutRect.classList.add('callout-box');
  svg.text(s, 250, 402, 'If you can 3-color it, it is a real knot — a simple visual test!', {
    fontSize: 10, anchor: 'middle', fill: RING,
  });

  let styleEl = s.querySelector('style[data-anim]');
  if (!styleEl) {
    styleEl = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    styleEl.setAttribute('data-anim', '1');
    s.insertBefore(styleEl, s.firstChild);
  }
  styleEl.textContent += `
    @keyframes calloutPulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
    .callout-box { animation: calloutPulse 3s ease-in-out 2s 2; }
  `;

  // ---- Timeline updater: sync the 2D ring + badges + arrow to the solution.
  // animationSteps: 0=look, 1=paint, 2=check, 3=slide ring out.
  // The 3 badges map to steps 1..3 (the look step shares the paint badge).
  // Ring keyframes: stays centered while painting/checking, then exits
  // toward the lower-right crossing (mirroring the 3D escape direction).
  const ringKeys = [
    [cx, cy],            // step 0: look — ring at rest
    [cx, cy],            // step 1: paint — ring at rest
    [cx, cy],            // step 2: check — ring at rest
    [cx + 55, cy + 50],  // step 3: slide ring out — exit toward crossing
  ];
  return function update(state) {
    if (!state) return;
    const i = Math.max(0, Math.min(state.stepIndex ?? 0, ringKeys.length - 1));
    const p = Math.max(0, Math.min(state.stepProgress ?? 0, 1));
    const from = i === 0 ? ringKeys[0] : ringKeys[i - 1];
    const to = ringKeys[i];
    if (ring) {
      ring.setAttribute('cx', from[0] + (to[0] - from[0]) * p);
      ring.setAttribute('cy', from[1] + (to[1] - from[1]) * p);
    }
    // Badge phase: step 0 & 1 → badge 1, step 2 → badge 2, step 3 → badge 3.
    const phase = i <= 1 ? 0 : i === 2 ? 1 : 2;
    badges.forEach((b, k) => svg.highlight(b, k === phase, { dim: 0.3, color: BLUE }));
    // Exit arrow only relevant on the final slide-out step.
    svg.highlight(arrowExit, i === 3, { glow: false, dim: 0 });
  };
}

export function dispose() {}
