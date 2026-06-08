import * as THREE from 'three';
import { createMaterials, createHighlightMaterial, applyHighlight, removeHighlight } from '../lib/materials.js';
import { createRing, createBall } from '../lib/components.js';
import { CordPath } from '../lib/cord.js';
import { enableShadowsOnGroup } from '../lib/scene.js';
import { StepArrowManager } from '../lib/arrow-helpers.js';
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

// Generate (p,q) torus knot points on a torus surface
function torusKnotPoints(p, q, majorR, minorR, segments = 96) {
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
  const segments = 96;
  for (let i = 0; i <= segments; i++) {
    const t = (2 * Math.PI * i) / segments;
    const r = TORUS_MAJOR_R + (TORUS_MINOR_R + 3);
    pts.push([r * Math.cos(t), 0, r * Math.sin(t)]);
  }
  return pts;
}

// Partially wound cord (1 loop through, 1 around)
function partialWindPath() {
  return torusKnotPoints(1, 2, TORUS_MAJOR_R, TORUS_MINOR_R);
}

// Full (2,3) torus knot winding
function fullWindPath() {
  return torusKnotPoints(2, 3, TORUS_MAJOR_R, TORUS_MINOR_R);
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

  // Ring starts free
  const ring = createRing(25, 3, mats.brass);
  ring.position.set(TORUS_MAJOR_R + TORUS_MINOR_R + 15, 0, 0);
  group.add(ring);

  enableShadowsOnGroup(group);
  const arrowManager = new StepArrowManager(group);

  return { group, objects: { cord, ring, arrowManager } };
}

const arrowConfigs = {
  1: { arrows: [
    { from: [TORUS_MAJOR_R + 20, 0, 20], to: [TORUS_MAJOR_R, 15, 30], opts: { color: 0x4488ff } },
  ]},
  2: { arrows: [
    { from: [TORUS_MAJOR_R, 15, 30], to: [-TORUS_MAJOR_R, -10, -20], opts: { color: 0x4488ff } },
  ]},
};
let highlightMat = null;

export const animationSteps = [
  {
    label: 'Look: the cord sits flat on the torus — the ring slides freely',
    duration: 2.0,
    cord: unwoundCordPath(),
    ringPos: [TORUS_MAJOR_R + TORUS_MINOR_R + 15, 0, 0],
  },
  {
    label: 'Wind the cord once through the hole and twice around the tube',
    duration: 3.0,
    cord: partialWindPath(),
    ringPos: [TORUS_MAJOR_R + TORUS_MINOR_R + 10, 0, 0],
  },
  {
    label: 'Wind again: two passes through the hole, three around the tube',
    duration: 3.0,
    cord: fullWindPath(),
    ringPos: [TORUS_MAJOR_R + TORUS_MINOR_R + 5, 0, 0],
  },
  {
    label: 'The ring is trapped! The winding creates a genuine knot',
    duration: 2.5,
    easing: 'easeOut',
    cord: fullWindPath(),
    ringPos: [TORUS_MAJOR_R + TORUS_MINOR_R + 5, 0, 0],
  },
];

export function updateAnimation(objects, state) {
  const { stepIndex, stepProgress } = state;

  // Direction arrows
  if (objects.arrowManager) {
    objects.arrowManager.showForStep(stepIndex, arrowConfigs);
    objects.arrowManager.updateOpacity(stepProgress);
  }

  // Highlight cord during winding steps
  if (stepIndex >= 1) {
    if (!highlightMat) {
      highlightMat = createHighlightMaterial(objects.cord.mesh.material, 0x4488ff, 0.3);
    }
    applyHighlight(objects.cord.mesh, highlightMat);
  } else {
    removeHighlight(objects.cord.mesh);
  }

  const step = animationSteps[stepIndex];
  const prevStep = stepIndex > 0 ? animationSteps[stepIndex - 1] : animationSteps[0];

  // Interpolate cord
  if (step.cord && prevStep.cord) {
    const interpolated = CordPath.interpolatePoints(prevStep.cord, step.cord, stepProgress);
    objects.cord.update(interpolated);
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

export function createSVGDiagram(container) {
  const s = svg.createSVG(container, 500, 400);
  const CORD = 'var(--dia-cord, #1f57c4)';
  const RIGID = 'var(--dia-rigid, #8a8275)';
  const RING = 'var(--dia-ring, #b97d12)';
  const GOLD = 'var(--dia-gold, #c79a22)';
  const INKSOFT = 'var(--dia-inksoft, #6a6151)';

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

  // Sliding ring — primary animatable element; slides inward and is trapped
  const ring = svg.ellipse(s, cx + 130, cy, 16, 13, { stroke: RING, strokeWidth: 3, fill: 'none' });
  ring.style.transition = 'cx .12s linear, cy .12s linear';

  // Winding number labels
  svg.text(s, cx, cy + 90, '2 passes through the hole', { fontSize: 11, anchor: 'middle', fill: INKSOFT });
  svg.text(s, cx, cy + 105, '3 wraps around the tube', { fontSize: 11, anchor: 'middle', fill: INKSOFT });
  svg.text(s, cx, cy + 120, 'This combination creates a true knot (trefoil)', { fontSize: 11, anchor: 'middle', fill: CORD, fontWeight: 'bold' });

  // Motion arrows showing winding direction (toggled per step by the updater)
  const arrow1 = svg.motionArrow(s, cx + 90, cy - 10, cx + 60, cy - 50, { label: 'Wind through', curvature: 0.3 });
  const arrow2 = svg.motionArrow(s, cx - 50, cy + 40, cx + 50, cy + 40, { label: 'Wrap around', curvature: 0.3 });
  const arrow3 = svg.motionArrow(s, cx + 120, cy, cx + 95, cy, { label: 'Ring trapped', curvature: 0.4, color: GOLD });

  // Hand icon near the cord
  svg.handIcon(s, cx + 110, cy + 10, { scale: 0.6, rotation: -25 });

  // Step badges (highlighted per phase by the updater)
  const badge1 = svg.stepBadge(s, 35, 310, 1, 3, { radius: 11 });
  svg.actionLabel(s, 95, 310, 'Wind cord through hole');
  const badge2 = svg.stepBadge(s, 35, 335, 2, 3, { radius: 11 });
  svg.actionLabel(s, 95, 335, 'Wrap cord around tube');
  const badge3 = svg.stepBadge(s, 35, 360, 3, 3, { radius: 11 });
  svg.actionLabel(s, 95, 360, 'Check: ring is trapped');
  const badges = [badge1, badge2, badge3];

  // Key insight
  const calloutRect = svg.rect(s, 30, 370, 440, 25, { fill: 'var(--dia-wash, #ece3d0)', stroke: 'var(--dia-ring, #b97d12)', strokeWidth: 1, rx: 4 });
  calloutRect.classList.add('callout-box');
  svg.text(s, 250, 387, 'How many times you wind through and around decides if the cord is truly knotted!', {
    fontSize: 10, anchor: 'middle', fill: 'var(--dia-ring, #b97d12)',
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

  // ---- Timeline updater: sync the 2D ring + badges + arrows to the solution.
  // The ring starts free outside the torus and slides inward as winding traps it,
  // mirroring the 3D ringPos motion toward the torus rim.
  const ringPos = [[cx + 130, cy], [cx + 118, cy], [cx + 110, cy], [cx + 110, cy]];
  return function update(state) {
    if (!state) return;
    const last = ringPos.length - 1;
    const i = Math.max(0, Math.min(state.stepIndex ?? 0, last));
    const p = Math.max(0, Math.min(state.stepProgress ?? 0, 1));
    const from = i === 0 ? ringPos[0] : ringPos[i - 1];
    const to = ringPos[i];
    if (ring) {
      ring.setAttribute('cx', from[0] + (to[0] - from[0]) * p);
      ring.setAttribute('cy', from[1] + (to[1] - from[1]) * p);
    }
    // Map step → badge phase (winding steps 0-1 → wind, step 2 → wrap, step 3 → trapped)
    const phase = i <= 1 ? 0 : i === 2 ? 1 : 2;
    badges.forEach((b, k) => svg.highlight(b, k === phase, { dim: 0.3, color: CORD }));
    svg.highlight(arrow1, i === 1, { glow: false, dim: 0 });
    svg.highlight(arrow2, i === 2, { glow: false, dim: 0 });
    svg.highlight(arrow3, i >= 3, { glow: false, dim: 0 });
  };
}

export function dispose() {}
