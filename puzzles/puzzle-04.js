import * as THREE from 'three';
import { createMaterials } from '../lib/materials.js';
import { createRing } from '../lib/components.js';
import { CordPath } from '../lib/cord.js';
import { enableShadowsOnGroup } from '../lib/scene.js';
import { StepArrowManager } from '../lib/arrow-helpers.js';
import { resolveStep, applyStepTransforms, HighlightCache } from '../lib/puzzle-helpers.js';
import * as svg from '../lib/svg.js';

export const metadata = {
  id: 4,
  name: 'Mobius Snare',
  difficulty: 'Intermediate',
  principle: 'Non-orientability (Mobius boundary)',
  type: 'Disentanglement',
  description: 'A cord loop is threaded around a Mobius band. On an ordinary band, the cord would be trapped between two edges. But a Mobius band has only one edge — the twist enables escape.',
  cameraPosition: [0, 40, 200],
};

const BAND_R = 50;
const BAND_W = 12;

function createMobiusBand(material) {
  const R = BAND_R;
  const w = BAND_W;

  // Built by hand rather than with ParametricGeometry (removed from three
  // core; lives in examples/jsm) — we need the custom normals anyway.
  const geometry = new THREE.BufferGeometry();

  const uSteps = 120;
  const vSteps = 10;
  const vertices = [];
  const normals = [];
  const uvs = [];
  const indices = [];

  for (let i = 0; i <= uSteps; i++) {
    const u = (i / uSteps) * Math.PI * 2;
    for (let j = 0; j <= vSteps; j++) {
      const v = (j / vSteps - 0.5) * w;
      const x = (R + v * Math.cos(u / 2)) * Math.cos(u);
      const y = v * Math.sin(u / 2);
      const z = (R + v * Math.cos(u / 2)) * Math.sin(u);

      vertices.push(x, y, z);

      // Approximate normal
      const du = 0.01;
      const dv = 0.01;
      const x1 = (R + v * Math.cos((u + du) / 2)) * Math.cos(u + du);
      const y1 = v * Math.sin((u + du) / 2);
      const z1 = (R + v * Math.cos((u + du) / 2)) * Math.sin(u + du);
      const x2 = (R + (v + dv) * Math.cos(u / 2)) * Math.cos(u);
      const y2 = (v + dv) * Math.sin(u / 2);
      const z2 = (R + (v + dv) * Math.cos(u / 2)) * Math.sin(u);

      const tu = [x1 - x, y1 - y, z1 - z];
      const tv = [x2 - x, y2 - y, z2 - z];
      const nx = tu[1] * tv[2] - tu[2] * tv[1];
      const ny = tu[2] * tv[0] - tu[0] * tv[2];
      const nz = tu[0] * tv[1] - tu[1] * tv[0];
      const nl = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
      normals.push(nx / nl, ny / nl, nz / nl);

      uvs.push(i / uSteps, j / vSteps);
    }
  }

  for (let i = 0; i < uSteps; i++) {
    for (let j = 0; j < vSteps; j++) {
      const a = i * (vSteps + 1) + j;
      const b = a + 1;
      const c = (i + 1) * (vSteps + 1) + j;
      const d = c + 1;
      indices.push(a, b, c);
      indices.push(b, d, c);
    }
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);

  const mesh = new THREE.Mesh(geometry, material);
  return mesh;
}

// Every cord keyframe below samples the same 25 control points (i = 0..24)
// at the same u angles — CordPath.interpolatePoints silently truncates to the
// shorter array, so all keyframes must keep this count in lockstep.
const CORD_SEGMENTS = 24;

// Weight peaking at the half-twist (u = 0 ≡ 2π, where the rivet join sits)
// and fading to 0 on the far side of the band.
function twistProximity(u) {
  const c = Math.cos(u / 2);
  return c * c;
}

// Cord wraps around the band, hanging below (rest pose).
function initialCordPath() {
  const R = BAND_R;
  const pts = [];
  // Cord goes around the band at a position slightly offset from center
  const cordOffset = 3;
  for (let i = 0; i <= CORD_SEGMENTS; i++) {
    const u = (i / CORD_SEGMENTS) * Math.PI * 2;
    const v = cordOffset * Math.cos(u / 2);
    const x = (R + v * Math.cos(u / 2) + 2) * Math.cos(u);
    const y = v * Math.sin(u / 2) - 25;
    const z = (R + v * Math.cos(u / 2) + 2) * Math.sin(u);
    pts.push([x, y, z]);
  }
  return pts;
}

// Step 1 end: the loop is flattened against the underside face and slid up
// toward the twist — the section nearest the rivets leads the way.
function towardTwistCordPath() {
  const R = BAND_R;
  const pts = [];
  for (let i = 0; i <= CORD_SEGMENTS; i++) {
    const u = (i / CORD_SEGMENTS) * Math.PI * 2;
    const near = twistProximity(u);
    const v = 3 * Math.cos(u / 2);
    const radial = R + v * Math.cos(u / 2) + 3 + near * 3;
    pts.push([
      radial * Math.cos(u),
      v * Math.sin(u / 2) - 10 + near * 4,
      radial * Math.sin(u),
    ]);
  }
  return pts;
}

// Step 2 end: the leading section arcs across the twist point, just outside
// the rivet join — it now appears to sit on 'the other face' (same face!).
// Base radial offset is +5 (not +3): the low section (u ≈ π..1.7π, y ≈ -4)
// otherwise skims the strip's tilted lower half mid-interpolation.
function crossTwistCordPath() {
  const R = BAND_R;
  const pts = [];
  for (let i = 0; i <= CORD_SEGMENTS; i++) {
    const u = (i / CORD_SEGMENTS) * Math.PI * 2;
    const near = twistProximity(u);
    const v = 3 * Math.cos(u / 2);
    const radial = R + v * Math.cos(u / 2) + 5 + near * 6;
    pts.push([
      radial * Math.cos(u),
      v * Math.sin(u / 2) - 4 + near * 9,
      radial * Math.sin(u),
    ]);
  }
  return pts;
}

// Step 3 end: the second circuit — the loop rides just above the apparent
// top face (the same one-sided surface, one half-twist later); the crossing
// point at the rivets stays anchored (y ≈ +5 here and in crossTwistCordPath).
// Offsets (+4 radial, +9 height) keep the whole spline clear of the twisting
// strip — this pose is also the launch point for the edge-clear escape below.
function secondCircuitCordPath() {
  const R = BAND_R;
  const pts = [];
  for (let i = 0; i <= CORD_SEGMENTS; i++) {
    const u = (i / CORD_SEGMENTS) * Math.PI * 2;
    const near = twistProximity(u);
    const v = 3 * Math.cos(u / 2);
    const radial = R + v * Math.cos(u / 2) + 4 + near * 4;
    pts.push([
      radial * Math.cos(u),
      -(v * Math.sin(u / 2)) + 9 - near * 4,
      radial * Math.sin(u),
    ]);
  }
  return pts;
}

// Mid-escape keyframe, applied INSIDE the final step by updateAnimation (not
// a sixth animation step): from the second-circuit pose the loop slides
// straight off the band's single edge, radially outward past the outer
// boundary (max band radius is BAND_R + BAND_W/2 = 56). The heights match
// secondCircuitCordPath exactly, so the first half of the escape is a pure
// radial expansion — the cord moves away from the surface at every point and
// can never sweep through the strip. Only after clearing the edge does it
// drop to the solved pose, entirely outside and below the band.
function edgeClearCordPath() {
  const pts = [];
  for (let i = 0; i <= CORD_SEGMENTS; i++) {
    const u = (i / CORD_SEGMENTS) * Math.PI * 2;
    const near = twistProximity(u);
    const v = 3 * Math.cos(u / 2);
    pts.push([
      68 * Math.cos(u),
      -(v * Math.sin(u / 2)) + 9 - near * 4,
      68 * Math.sin(u),
    ]);
  }
  return pts;
}

// Step 4 end: cord is free, hanging below as a simple loop.
function solvedCordPath() {
  const pts = [];
  for (let i = 0; i <= CORD_SEGMENTS; i++) {
    const t = i / CORD_SEGMENTS;
    const angle = t * Math.PI * 2;
    pts.push([
      Math.cos(angle) * 25,
      -80 - Math.sin(angle) * 15,
      Math.sin(angle) * 25,
    ]);
  }
  return pts;
}

export function create3DScene() {
  const mats = createMaterials();
  const group = new THREE.Group();

  const band = createMobiusBand(mats.leather);
  group.add(band);

  const ring = createRing(40, 4, mats.brass);
  ring.position.set(0, -60, 0);
  ring.rotation.x = Math.PI / 2;
  group.add(ring);

  const cord = new CordPath(initialCordPath(), {
    radius: 1.5,
    material: mats.cord,
    closed: true,
  });
  cord.addTo(group);

  // Rivet indicators
  const rivetMat = mats.brass;
  const rivet1 = new THREE.Mesh(new THREE.SphereGeometry(1.5, 8, 8), rivetMat);
  rivet1.position.set(BAND_R + 3, 0, 0);
  group.add(rivet1);
  const rivet2 = new THREE.Mesh(new THREE.SphereGeometry(1.5, 8, 8), rivetMat);
  rivet2.position.set(BAND_R + 9, 0, 0);
  group.add(rivet2);

  enableShadowsOnGroup(group);
  return group;
}

export function createAnimScene() {
  const mats = createMaterials();
  const group = new THREE.Group();

  const band = createMobiusBand(mats.leather);
  group.add(band);

  const ring = createRing(40, 4, mats.brass);
  ring.position.set(0, -60, 0);
  ring.rotation.x = Math.PI / 2;
  group.add(ring);

  const cord = new CordPath(initialCordPath(), {
    radius: 1.5,
    material: mats.cord,
    closed: true,
  });
  cord.addTo(group);

  enableShadowsOnGroup(group);
  const arrowManager = new StepArrowManager(group);

  return { group, objects: { ring, cord, arrowManager } };
}

// Yellow = slide along the surface; green = cross the twist / come away free.
const arrowConfigs = {
  1: { arrows: [
    { from: [15, -14, 50], to: [48, -8, 22], opts: { color: 0xffcc44 } },
  ]},
  2: { arrows: [
    { from: [56, -8, 12], to: [60, 8, -12], opts: { color: 0x44cc44 } },
  ]},
  3: { arrows: [
    { type: 'curved', points: [[55, 10, -10], [35, 12, -40], [0, 12, -58]], opts: { color: 0xffcc44 } },
  ]},
  4: { arrows: [
    { from: [58, 9, -14], to: [74, 7, -18], opts: { color: 0x44cc44 } },
    { from: [0, -55, 0], to: [0, -88, 0], opts: { color: 0x44cc44 } },
  ]},
};

// Five beats, following the md's solution: flatten the loop and slide it to
// the twist, cross the twist point (checkpoint: the 'other face' is the same
// face — halfway done), continue the second circuit on the same face (the
// boundary makes two trips around before it closes), then lift off the
// single edge. The final beat interpolates through an extra mid-step
// keyframe (edgeClearCordPath, see updateAnimation) so the cord slides off
// the edge radially before dropping — a straight lerp to the solved pose
// would sweep the cord through the band's interior, the exact move the
// puzzle declares impossible.
export const animationSteps = [
  {
    label: 'Look: the cord loop wraps around the twisted band',
    duration: 2.5,
    cord: initialCordPath(),
    ring: { position: [0, -60, 0] },
  },
  {
    label: 'Flatten the loop against the surface and slide it toward the twist',
    duration: 2.0,
    easing: 'easeInOut',
    cord: towardTwistCordPath(),
    ring: { position: [0, -54, 0] },
  },
  {
    label: 'Cross the twist point — checkpoint: the "other face" is the same face',
    duration: 2.5,
    easing: 'easeInOut',
    cord: crossTwistCordPath(),
    ring: { position: [0, -50, 0] },
  },
  {
    label: 'Keep sliding on the same face — the second trip around the band',
    duration: 2.5,
    easing: 'easeInOut',
    cord: secondCircuitCordPath(),
    ring: { position: [0, -48, 0] },
  },
  {
    label: 'The cord clears the single edge and comes away — free!',
    duration: 2.75,
    easing: 'easeOut',
    cord: solvedCordPath(),
    ring: { position: [0, -80, 0] },
  },
];

const highlights = new HighlightCache();

// The escape (last step) routes through this intermediate keyframe: first
// slide the loop off the single edge, radially outward (t < SPLIT), then
// drop it clear below the band (t >= SPLIT). Same 25 control points at the
// same u angles as every other cord keyframe.
const EDGE_CLEAR_CORD = edgeClearCordPath();
const EDGE_CLEAR_SPLIT = 0.45;

export function updateAnimation(objects, state) {
  const { step, prevStep, t, stepIndex } = resolveStep(animationSteps, state, {
    arrowManager: objects.arrowManager,
    arrowConfigs,
  });

  // Highlight the cord while it is being worked (every step after the look)
  highlights.set(objects.cord.mesh, stepIndex >= 1, 0x4488ff, 0.3);

  // Cord is interpolated by hand (not via applyStepTransforms) because the
  // final step is two-phase: second circuit -> edge-clear -> solved. A
  // single lerp would drag the cord through the band's interior.
  let cordFrom = prevStep.cord;
  let cordTo = step.cord;
  let cordT = t;
  if (stepIndex === animationSteps.length - 1) {
    if (t < EDGE_CLEAR_SPLIT) {
      cordTo = EDGE_CLEAR_CORD;
      cordT = t / EDGE_CLEAR_SPLIT;
    } else {
      cordFrom = EDGE_CLEAR_CORD;
      cordT = (t - EDGE_CLEAR_SPLIT) / (1 - EDGE_CLEAR_SPLIT);
    }
  }
  if (cordFrom && cordTo) {
    objects.cord.update(CordPath.interpolatePoints(cordFrom, cordTo, cordT));
  }

  applyStepTransforms(objects, prevStep, step, t, {
    ring: { target: 'ring', kind: 'position' },
  });
}

export function createSVGDiagram(container) {
  const s = svg.createSVG(container, 500, 380);

  const CORD = 'var(--dia-cord, #1f57c4)';
  const RING = 'var(--dia-ring, #b97d12)';
  const WOOD = 'var(--dia-wood, #b07d52)';
  const GOLD = 'var(--dia-gold, #c79a22)';

  svg.text(s, 250, 25, 'Mobius Snare — Initial State', {
    fontSize: 14, anchor: 'middle', fontWeight: 'bold',
  });

  // Mobius band (3/4 view approximation using figure-8 shape)
  svg.path(s, 'M 150 160 C 150 100, 250 80, 250 140 C 250 180, 350 160, 350 120 C 350 80, 250 100, 250 140 C 250 200, 150 220, 150 160', {
    stroke: WOOD, strokeWidth: 14, fill: 'none', strokeLinecap: 'round',
  });

  // Inner edge (lighter, showing the twist)
  svg.path(s, 'M 155 160 C 155 108, 245 88, 248 138 C 250 170, 345 155, 345 122', {
    stroke: WOOD, strokeWidth: 3, fill: 'none',
  });

  // Rivet at join
  svg.circle(s, 150, 160, 4, { fill: GOLD, stroke: GOLD, strokeWidth: 1 });

  // Cord around the band — the primary moving element
  const cordWrap = svg.path(s, 'M 200 175 C 180 180, 160 195, 200 210 C 230 220, 300 215, 300 195 C 300 180, 260 170, 230 175', {
    stroke: CORD, strokeWidth: 2.5, fill: 'none',
  });
  cordWrap.style.transition = 'transform .12s linear';

  // Cord down to ring
  const cordDropL = svg.line(s, 240, 210, 250, 260, { stroke: CORD, strokeWidth: 2.5 });
  const cordDropR = svg.line(s, 260, 210, 250, 260, { stroke: CORD, strokeWidth: 2.5 });
  cordDropL.style.transition = 'transform .12s linear';
  cordDropR.style.transition = 'transform .12s linear';

  // Ring — animatable
  const ring = svg.ellipse(s, 250, 275, 18, 14, { stroke: RING, strokeWidth: 3, fill: 'none' });
  ring.style.transition = 'cx .12s linear, cy .12s linear';

  // Labels
  svg.label(s, 400, 120, 350, 130, 'Half-twist');
  svg.label(s, 90, 165, 150, 160, 'Rivet join');
  svg.label(s, 370, 275, 268, 275, 'Ring');
  svg.label(s, 380, 200, 300, 195, 'Cord loop');

  // Checkpoint annotation for the twist crossing (lit during that step)
  const checkpoint = svg.label(s, 400, 90, 352, 118, '"Other face" = same face');

  // Motion arrows showing key movements (toggled per step by the updater)
  const arrow1 = svg.motionArrow(s, 230, 175, 300, 195, { label: 'Slide along surface', curvature: 0.3 });
  const arrow2 = svg.motionArrow(s, 250, 260, 250, 305, { label: 'Pull free', curvature: 0.2 });

  // Hand icon near manipulation point
  svg.handIcon(s, 200, 220, { scale: 0.6, rotation: 15 });

  // Step badges (highlighted per phase by the updater)
  const badge1 = svg.stepBadge(s, 130, 200, 1, 3);
  svg.actionLabel(s, 130, 213, 'Slide loop along the surface');
  const badge2 = svg.stepBadge(s, 130, 232, 2, 3);
  svg.actionLabel(s, 130, 245, 'Cross the twist — same face');
  const badge3 = svg.stepBadge(s, 300, 260, 3, 3);
  svg.actionLabel(s, 300, 273, 'Lift off the single edge');
  const badges = [badge1, badge2, badge3];

  // Key insight
  const calloutRect = svg.rect(s, 20, 330, 460, 40, { fill: 'var(--dia-wash, #ece3d0)', stroke: 'var(--dia-ring, #b97d12)', strokeWidth: 1, rx: 4 });
  calloutRect.classList.add('callout-box');
  svg.text(s, 250, 348, 'Key: The band has only ONE edge because of the twist.', {
    fontSize: 11, anchor: 'middle', fill: 'var(--dia-ring, #b97d12)', fontWeight: 'bold',
  });
  svg.text(s, 250, 362, 'Slide flat along the surface — two full trips — and it lifts right off.', {
    fontSize: 10, anchor: 'middle', fill: 'var(--dia-ring, #b97d12)',
  });

  // Inject pulse animation for the callout
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

  // ---- Timeline updater: sync the 2D cord + ring + badges + arrows to the
  // five-step solution: 0 = look (rest), 1 = slide the loop toward the twist,
  // 2 = cross the twist point (checkpoint: 'other face' = same face),
  // 3 = second trip around on the same face, 4 = clear the single edge, free.
  // Cord frames are [dx, dy] translations of the wrap assembly: toward the
  // rivet join, across it, back around, then dropping free below the band.
  const cordFrames = [[0, 0], [-30, -14], [-52, -26], [12, -20], [0, 60]];
  // Ring keyframes mirror the 3D ring motion (rides up a little while the
  // loop is worked along the surface, then sinks away free).
  const ringFrames = [[250, 275], [235, 268], [220, 262], [248, 258], [250, 330]];
  const LAST_STEP = cordFrames.length - 1;
  return function update(state) {
    const i = Math.max(0, Math.min(state.stepIndex ?? 0, LAST_STEP));
    const p = Math.max(0, Math.min(state.stepProgress ?? 0, 1));

    // Ring position interpolated along keyframes
    const [cx, cy] = svg.lerpFrames(ringFrames, i, p);
    ring.setAttribute('cx', cx);
    ring.setAttribute('cy', cy);

    // Cord assembly slides along the band, then drops as it escapes
    const [dx, dy] = svg.lerpFrames(cordFrames, i, p);
    const xf = `translate(${dx}px, ${dy}px)`;
    if (cordWrap) cordWrap.style.transform = xf;
    if (cordDropL) cordDropL.style.transform = xf;
    if (cordDropR) cordDropR.style.transform = xf;

    // Badges: 0 = slide (both trips), 1 = cross the twist, 2 = lift off free
    const phase = i === 2 ? 1 : i === LAST_STEP ? 2 : 0;
    badges.forEach((b, k) => svg.highlight(b, k === phase, { dim: 0.3, color: CORD }));

    // Checkpoint callout lights up while the cord crosses the twist point
    svg.highlight(checkpoint, i === 2, { color: CORD, dim: 0.25 });

    // Motion arrows: slide arrow on both trips, pull-free arrow at the end
    svg.highlight(arrow1, i === 1 || i === 3, { glow: false, dim: 0 });
    svg.highlight(arrow2, i === LAST_STEP, { glow: false, dim: 0 });
  };
}

export function dispose() {
  highlights.dispose();
}
