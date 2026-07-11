import * as THREE from 'three';
import { createMaterials } from '../lib/materials.js';
import { createRod, createBlock } from '../lib/components.js';
import { CordPath } from '../lib/cord.js';
import { enableShadowsOnGroup } from '../lib/scene.js';
import { StepArrowManager } from '../lib/arrow-helpers.js';
import { resolveStep, applyStepTransforms, HighlightCache } from '../lib/puzzle-helpers.js';
import * as svg from '../lib/svg.js';

export const metadata = {
  id: 16,
  name: 'The Seifert Sail',
  difficulty: 'Advanced',
  principle: 'Seifert surfaces (surfaces bounded by knots)',
  type: 'Assembly',
  description: 'Assemble three shaped panels inside a trefoil frame to form a Seifert surface — a continuous orientable surface whose boundary is the knot. Every knot bounds such a surface; the genus of this surface is a knot invariant.',
  cameraPosition: [0, 80, 220],
};

const TREFOIL_SCALE = 45;
const ROD_R = 2;

function trefoilPoint(t, scale) {
  const x = Math.sin(t) + 2 * Math.sin(2 * t);
  const y = Math.cos(t) - 2 * Math.cos(2 * t);
  const z = -Math.sin(3 * t);
  return [x * scale, y * scale, z * scale * 0.4];
}

function trefoilPoints(scale, segments = 80) {
  const pts = [];
  for (let i = 0; i <= segments; i++) {
    const t = (2 * Math.PI * i) / segments;
    pts.push(trefoilPoint(t, scale));
  }
  return pts;
}

const DISK_R = 25;
const BAND_W = 15;

// Seat poses of the three Seifert-disk panels (from resolving the three
// crossings): A top, B bottom-left, C bottom-right regions of the trefoil
// interior. Shared by the surface builder (static scene) and the animation
// keyframes, so the seated panels and the band geometry always agree.
const PANEL_SEAT = [
  { position: [0, TREFOIL_SCALE * 0.8, 0],
    rotation: [-Math.PI / 6, 0, 0] },
  { position: [-TREFOIL_SCALE * 0.7, -TREFOIL_SCALE * 0.4, 0],
    rotation: [-Math.PI / 6, 2 * Math.PI / 3, 0] },
  { position: [TREFOIL_SCALE * 0.7, -TREFOIL_SCALE * 0.4, 0],
    rotation: [-Math.PI / 6, -2 * Math.PI / 3, 0] },
];

// Staging poses: the unassembled panels lie flat on the front of the base
// (the md setup: "three shaped panels lie beside the base, unassembled").
const PANEL_STAGED = [
  { position: [-52, -105, 55], rotation: [-Math.PI / 2, 0, 0] },
  { position: [0, -105, 55], rotation: [-Math.PI / 2, 0, 0] },
  { position: [52, -105, 55], rotation: [-Math.PI / 2, 0, 0] },
];

// Self-crossings of the trefoil frame. In the xy-projection of trefoilPoint
// they sit exactly at radius 1.5·scale, at 0°/±120° from the +y axis (the
// crossing parameter solves cos t = -1/4); the two strands pass at z ≈ ±13,
// symmetric about z = 0, so the markers sit between them.
const CROSSINGS = [0, 1, 2].map((k) => {
  const a = (2 * Math.PI * k) / 3;
  return [Math.sin(a) * 1.5 * TREFOIL_SCALE, Math.cos(a) * 1.5 * TREFOIL_SCALE, 0];
});

// Rim point of a disk (center, plane normal) nearest to `toward`: project the
// direction to `toward` into the disk plane and walk one radius outward.
function rimAnchor(center, normal, toward) {
  const dir = toward.clone().sub(center);
  dir.addScaledVector(normal, -dir.dot(normal));
  if (dir.lengthSq() < 1e-8) dir.set(1, 0, 0); // degenerate: toward is on the disk axis
  dir.normalize();
  return center.clone().addScaledVector(dir, DISK_R);
}

// Parametric half-twist ribbon: sweep a width-BAND_W segment from rim anchor
// `a` to rim anchor `b`, rolling it linearly 0 -> PI about the band axis.
// The width line starts and ends in the (average) disk plane — a roll of PI
// flips it in place — so both ends sit flush against the disk rims while the
// mid-band stands perpendicular, making the half-twist plainly visible.
function createTwistBand(a, b, normalA, normalB, material) {
  const axis = b.clone().sub(a);
  const length = axis.length();
  const dir = axis.divideScalar(length);

  // Width direction: perpendicular to the band axis, lying in the average
  // disk plane so the band ends blend into the disks they join.
  const avgNormal = normalA.clone().add(normalB);
  const width = new THREE.Vector3().crossVectors(avgNormal, dir);
  if (width.lengthSq() < 1e-8) width.set(0, 1, 0).cross(dir); // axis ∥ normals fallback
  width.normalize();
  const lift = new THREE.Vector3().crossVectors(dir, width).normalize();

  const geo = new THREE.PlaneGeometry(BAND_W, length, 8, 24);
  const positions = geo.attributes.position;
  const point = new THREE.Vector3();
  for (let i = 0; i < positions.count; i++) {
    const u = positions.getX(i);                      // across the band, -W/2..W/2
    const v = positions.getY(i);                      // along the band,  -L/2..L/2
    const roll = (v / length + 0.5) * Math.PI;        // linear 0 -> PI half-twist
    point.copy(a)
      .addScaledVector(dir, v + length / 2)
      .addScaledVector(width, u * Math.cos(roll))
      .addScaledVector(lift, u * Math.sin(roll));
    positions.setXYZ(i, point.x, point.y, point.z);
  }
  positions.needsUpdate = true;
  geo.computeVertexNormals();

  return new THREE.Mesh(geo, material);
}

// Create a stylized Seifert-surface visualization as a mesh group: three
// panels approximating the spanning surface, joined rim-to-rim by half-twist
// bands (one per resolved crossing). The true Seifert construction yields
// 2 disks + 3 bands — see the md worked example; this model trades that
// layout for one readable panel per lobe. Every panel and band gets its own
// clone of `material` so the animation can seat/fade the parts independently;
// the parts are exposed via userData.panels ([A, B, C]) and userData.bands
// ([AB, BC, CA]).
function createSeifertSurface(material) {
  const group = new THREE.Group();

  const panels = PANEL_SEAT.map((seat) => {
    const mesh = new THREE.Mesh(new THREE.CircleGeometry(DISK_R, 32), material.clone());
    mesh.position.set(...seat.position);
    mesh.rotation.set(...seat.rotation);
    group.add(mesh);
    return mesh;
  });

  const centers = PANEL_SEAT.map((seat) => new THREE.Vector3(...seat.position));
  const normals = PANEL_SEAT.map((seat) =>
    new THREE.Vector3(0, 0, 1).applyEuler(new THREE.Euler(...seat.rotation)).normalize()
  );

  // One half-twist band per resolved crossing, joining consecutive disks
  // rim-to-rim; length and orientation derive from the disk centers/radii.
  // Slightly darker than the disks so the half-twists read against them.
  const bands = [[0, 1], [1, 2], [2, 0]].map(([i, j]) => {
    const bandMat = material.clone();
    bandMat.color.multiplyScalar(0.8);
    const a = rimAnchor(centers[i], normals[i], centers[j]);
    const b = rimAnchor(centers[j], normals[j], centers[i]);
    const band = createTwistBand(a, b, normals[i], normals[j], bandMat);
    group.add(band);
    return band;
  });

  group.userData.panels = panels;
  group.userData.bands = bands;
  return group;
}

function createTrefoilFrame(material) {
  const pts = trefoilPoints(TREFOIL_SCALE);
  return createRod(pts, ROD_R, material, true);
}

function createSurfaceMaterial(opacity) {
  return new THREE.MeshStandardMaterial({
    color: 0x66aadd,
    metalness: 0.1,
    roughness: 0.6,
    side: THREE.DoubleSide,
    transparent: true,
    opacity,
  });
}

export function create3DScene() {
  const mats = createMaterials();
  const group = new THREE.Group();

  // Base
  const base = createBlock(160, 8, 160, mats.wood);
  base.position.y = -TREFOIL_SCALE * 2.5;
  group.add(base);

  // Trefoil wire frame
  const frame = createTrefoilFrame(mats.steel);
  group.add(frame);

  // Seifert surface (assembled)
  const surface = createSeifertSurface(createSurfaceMaterial(0.7));
  group.add(surface);

  enableShadowsOnGroup(group);
  return group;
}

// Resting opacity of the assembled surface; it dims on the final step so the
// escaping cord stays legible in front of it.
const SURF_OPACITY = 0.75;

// Cord loop threaded through the trefoil (linked pose) and pulled clear of it
// (freed pose). Same 8 control points in each — CordPath.interpolatePoints
// requires identical counts.
const CORD_LINKED = [
  [TREFOIL_SCALE * 1.5, 20, 0],
  [TREFOIL_SCALE * 0.5, 25, 15],
  [-TREFOIL_SCALE * 0.5, 20, 10],
  [-TREFOIL_SCALE * 1.5, 10, 0],
  [-TREFOIL_SCALE * 1.0, -10, -10],
  [0, -15, -15],
  [TREFOIL_SCALE * 1.0, -10, -10],
  [TREFOIL_SCALE * 1.5, 20, 0],
];
const CORD_FREED = [
  [TREFOIL_SCALE * 2.0, 20, 30],
  [TREFOIL_SCALE * 1.5, 25, 35],
  [TREFOIL_SCALE * 0.5, 20, 40],
  [-TREFOIL_SCALE * 0.5, 10, 35],
  [-TREFOIL_SCALE * 1.0, -10, 30],
  [0, -15, 30],
  [TREFOIL_SCALE * 1.0, -10, 30],
  [TREFOIL_SCALE * 2.0, 20, 30],
];

export function createAnimScene() {
  const mats = createMaterials();
  const group = new THREE.Group();

  const base = createBlock(160, 8, 160, mats.wood);
  base.position.y = -TREFOIL_SCALE * 2.5;
  group.add(base);

  const frame = createTrefoilFrame(mats.steel);
  group.add(frame);

  // Surface parts: panels start staged on the base (visible), bands hidden
  // until their connection step.
  const surface = createSeifertSurface(createSurfaceMaterial(SURF_OPACITY));
  const panels = surface.userData.panels;
  const bands = surface.userData.bands;
  panels.forEach((mesh, i) => {
    mesh.position.set(...PANEL_STAGED[i].position);
    mesh.rotation.set(...PANEL_STAGED[i].rotation);
  });
  for (const band of bands) band.material.opacity = 0;
  group.add(surface);

  const cord = new CordPath(CORD_LINKED, {
    radius: 2.5,
    material: mats.cord,
    closed: true,
  });
  cord.addTo(group);

  enableShadowsOnGroup(group);

  // Crossing-region markers (step 1): a soft glow straddling both strands at
  // each self-crossing of the frame. Added after enableShadowsOnGroup — a
  // transparent glow must never cast a shadow.
  const crossingMat = new THREE.MeshStandardMaterial({
    color: 0xffcc44,
    emissive: 0xffcc44,
    emissiveIntensity: 0.7,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const markerGeo = new THREE.SphereGeometry(15, 24, 16);
  for (const c of CROSSINGS) {
    const marker = new THREE.Mesh(markerGeo, crossingMat);
    marker.position.set(...c);
    group.add(marker);
  }

  const arrowManager = new StepArrowManager(group);

  return {
    group,
    objects: {
      frame,
      panelA: panels[0],
      panelB: panels[1],
      panelC: panels[2],
      panelMats: panels.map((m) => m.material),
      bands,
      bandMats: bands.map((m) => m.material),
      crossingMat,
      cord,
      arrowManager,
    },
  };
}

const arrowConfigs = {
  2: { arrows: [
    { from: PANEL_STAGED[0].position, to: PANEL_SEAT[0].position, opts: { color: 0x66aadd } },
  ]},
  3: { arrows: [
    { from: PANEL_STAGED[1].position, to: PANEL_SEAT[1].position, opts: { color: 0x66aadd } },
  ]},
  4: { arrows: [
    { from: PANEL_SEAT[0].position, to: PANEL_SEAT[1].position, opts: { color: 0xffcc44 } },
  ]},
  5: { arrows: [
    { from: PANEL_STAGED[2].position, to: PANEL_SEAT[2].position, opts: { color: 0x66aadd } },
  ]},
  7: { arrows: [
    { from: [TREFOIL_SCALE * 0.5, 20, 10], to: [TREFOIL_SCALE * 1.5, 20, 30], opts: { color: 0x44cc44 } },
  ]},
};

// Cumulative keyframe poses — each step's fields describe the pose at the END
// of that step, and later poses extend earlier ones so nothing snaps back.
const REST = {
  panelA: PANEL_STAGED[0], panelB: PANEL_STAGED[1], panelC: PANEL_STAGED[2],
  panelOpacity: SURF_OPACITY, bandAB: 0, bandBC: 0, bandCA: 0,
  crossGlow: 0, cord: CORD_LINKED,
};
const A_SEATED = { ...REST, panelA: PANEL_SEAT[0] };
const AB_SEATED = { ...A_SEATED, panelB: PANEL_SEAT[1] };
const AB_JOINED = { ...AB_SEATED, bandAB: SURF_OPACITY };
const COMPLETE = { ...AB_JOINED, panelC: PANEL_SEAT[2], bandBC: SURF_OPACITY, bandCA: SURF_OPACITY };
const FREED = {
  ...COMPLETE, cord: CORD_FREED,
  panelOpacity: 0.45, bandAB: 0.45, bandBC: 0.45, bandCA: 0.45,
};

export const animationSteps = [
  {
    ...REST,
    label: 'Look: the cord loops through the trefoil frame, seemingly stuck',
    duration: 2.5,
  },
  {
    ...REST,
    crossGlow: 0.55,
    label: 'Find the three crossing regions of the trefoil — each will get a half-twist connection',
    duration: 2.0,
  },
  {
    ...A_SEATED,
    label: 'Seat Panel A in the upper region of the trefoil interior',
    duration: 2.0,
    easing: 'easeOut',
  },
  {
    ...AB_SEATED,
    label: 'Seat Panel B in the lower-left region',
    duration: 2.0,
    easing: 'easeOut',
  },
  {
    ...AB_JOINED,
    label: 'Connect A to B with a half-twist band — the twist keeps the surface orientable',
    duration: 2.0,
  },
  {
    ...COMPLETE,
    label: 'Seat Panel C and connect it to both neighbors — the surface is complete',
    duration: 2.5,
    easing: 'easeOut',
  },
  {
    ...COMPLETE,
    label: 'Verify: the boundary of the surface traces the trefoil wire all the way around',
    duration: 2.0,
  },
  {
    ...FREED,
    label: 'Push the cord across the surface — the ± puncture pair cancels and the cord slides free',
    duration: 3.0,
    easing: 'easeOut',
  },
];

const highlights = new HighlightCache();
const lerp = (a, b, t) => a + (b - a) * t;

export function updateAnimation(objects, state) {
  const { step, prevStep, t, stepIndex } = resolveStep(animationSteps, state, {
    arrowManager: objects.arrowManager,
    arrowConfigs,
  });

  // Seat the panels and move the cord between the step keyframes.
  applyStepTransforms(objects, prevStep, step, t, {
    panelA: { target: 'panelA', kind: 'transform' },
    panelB: { target: 'panelB', kind: 'transform' },
    panelC: { target: 'panelC', kind: 'transform' },
    cord: { target: 'cord', kind: 'cordPoints' },
  });

  // Opacities: panels together, bands individually (each fades in on its
  // connection step), crossing glow only around step 1.
  const panelOpacity = lerp(prevStep.panelOpacity, step.panelOpacity, t);
  for (const mat of objects.panelMats) mat.opacity = panelOpacity;
  ['bandAB', 'bandBC', 'bandCA'].forEach((field, k) => {
    const mat = objects.bandMats[k];
    mat.opacity = lerp(prevStep[field], step[field], t);
    objects.bands[k].castShadow = mat.opacity > 0.05; // hidden bands must not shadow
  });
  objects.crossingMat.opacity = lerp(prevStep.crossGlow, step.crossGlow, t);

  // Step 6 verifies the boundary (glow the trefoil wire); step 7 spotlights
  // the escaping cord.
  highlights.set(objects.frame, stepIndex === 6, 0xffcc44, 0.5);
  highlights.set(objects.cord.mesh, stepIndex === 7, 0x4488ff, 0.3);
}

export function createSVGDiagram(container) {
  const s = svg.createSVG(container, 500, 400);

  const INK = 'var(--dia-ink, #24211a)';
  const INKSOFT = 'var(--dia-inksoft, #6a6151)';
  const RIGID = 'var(--dia-rigid, #8a8275)';
  const FAINT = 'var(--dia-faint, #c9bda7)';
  const CORD = 'var(--dia-cord, #1f57c4)';
  const RING = 'var(--dia-ring, #b97d12)';
  const WASH = 'var(--dia-wash, #ece3d0)';

  svg.text(s, 250, 25, 'The Seifert Sail — Seifert Surface Construction', {
    fontSize: 14, anchor: 'middle', fontWeight: 'bold',
  });

  const cx = 250, cy = 160;

  // Trefoil knot outline — glows on the verify step (its edge IS the knot)
  const outline = svg.path(s, `M ${cx} ${cy - 55} C ${cx - 60} ${cy - 65}, ${cx - 65} ${cy + 15}, ${cx - 10} ${cy + 5} C ${cx + 40} ${cy - 5}, ${cx + 65} ${cy + 55}, ${cx} ${cy + 45} C ${cx - 65} ${cy + 55}, ${cx - 40} ${cy - 5}, ${cx + 10} ${cy + 5} C ${cx + 65} ${cy + 15}, ${cx + 60} ${cy - 65}, ${cx} ${cy - 55}`, {
    stroke: RIGID, strokeWidth: 3, fill: 'none',
  });

  // Three Seifert-disk panels — each fades in on its seating step
  const diskA = svg.ellipse(s, cx, cy - 35, 25, 18, {
    fill: CORD, stroke: CORD, strokeWidth: 1.5,
  });
  const diskB = svg.ellipse(s, cx - 30, cy + 20, 25, 18, {
    fill: CORD, stroke: CORD, strokeWidth: 1.5,
  });
  const diskC = svg.ellipse(s, cx + 30, cy + 20, 25, 18, {
    fill: CORD, stroke: CORD, strokeWidth: 1.5,
  });
  const disks = [diskA, diskB, diskC];

  // Half-twist band indicators — [A-B, B-C, C-A], fading in as they connect
  const bandEls = [
    svg.path(s, `M ${cx - 12} ${cy - 20} L ${cx - 20} ${cy + 5}`, {
      stroke: CORD, strokeWidth: 2, dashArray: '3,2',
    }),
    svg.path(s, `M ${cx - 10} ${cy + 30} L ${cx + 10} ${cy + 30}`, {
      stroke: CORD, strokeWidth: 2, dashArray: '3,2',
    }),
    svg.path(s, `M ${cx + 12} ${cy - 20} L ${cx + 20} ${cy + 5}`, {
      stroke: CORD, strokeWidth: 2, dashArray: '3,2',
    }),
  ];
  // Hidden until their step; the updater (primed with step 0 on load) drives
  // these opacities every frame.
  [...disks, ...bandEls].forEach((el) => { el.style.opacity = '0'; });

  // Crossing-region markers — the former crossings, where the bands will go
  const crossMarks = [
    [cx - 16, cy - 8], [cx, cy + 30], [cx + 16, cy - 8],
  ].map(([x, y]) => {
    const c = svg.circle(s, x, y, 11, { fill: 'none', stroke: RING, strokeWidth: 2 });
    c.setAttribute('stroke-dasharray', '4,3');
    return c;
  });

  // Labels
  svg.text(s, cx, cy - 55, 'Panel A', { fontSize: 9, anchor: 'middle', fill: CORD });
  svg.text(s, cx - 55, cy + 15, 'Panel B', { fontSize: 9, anchor: 'middle', fill: CORD });
  svg.text(s, cx + 55, cy + 15, 'Panel C', { fontSize: 9, anchor: 'middle', fill: CORD });
  svg.text(s, cx - 25, cy - 5, 'band', { fontSize: 8, fill: CORD });
  svg.text(s, cx + 20, cy - 5, 'band', { fontSize: 8, fill: CORD });
  svg.text(s, cx, cy + 42, 'band', { fontSize: 8, anchor: 'middle', fill: CORD });

  // The cord loop threaded through the knot — the primary moving element.
  // Sits linked over the surface, then slides off to the right to escape.
  const cord = svg.ellipse(s, cx, cy + 5, 14, 22, {
    stroke: RING, strokeWidth: 3, fill: 'none',
  });
  cord.style.transition = 'cx .12s linear, cy .12s linear, opacity .25s ease';

  // Hand icon
  svg.handIcon(s, cx - 55, cy - 30, { scale: 0.6, rotation: 15 });

  // Assembly steps
  svg.rect(s, 40, 240, 420, 55, { fill: WASH, stroke: FAINT, strokeWidth: 1, rx: 4 });
  svg.text(s, 250, 258, 'Assembly Steps:', { fontSize: 11, anchor: 'middle', fontWeight: 'bold', fill: INK });
  svg.text(s, 250, 274, '1. Seat panels A, B, C inside the trefoil frame', {
    fontSize: 9, anchor: 'middle', fill: INKSOFT,
  });
  svg.text(s, 250, 288, '2. Join them at the crossings with half-twist bands', {
    fontSize: 9, anchor: 'middle', fill: INKSOFT,
  });

  // Motion arrows (toggled per step by the updater)
  const arrowSeat = svg.motionArrow(s, cx - 25, cy - 70, cx, cy - 35, { label: 'Seat panel', curvature: 0.3 });
  const arrowPush = svg.motionArrow(s, cx + 35, cy + 5, cx + 95, cy + 5, { label: 'Push cord across', curvature: 0.25 });

  // Phase badges (highlighted per phase by the updater)
  const badge1 = svg.stepBadge(s, 35, 310, 1, 3, { radius: 11 });
  svg.actionLabel(s, 100, 310, 'Seat and join the panels');
  const badge2 = svg.stepBadge(s, 35, 335, 2, 3, { radius: 11 });
  svg.actionLabel(s, 100, 335, 'Verify: edge is the knot');
  const badge3 = svg.stepBadge(s, 35, 360, 3, 3, { radius: 11 });
  svg.actionLabel(s, 100, 360, 'Push cord across to free');
  const badges = [badge1, badge2, badge3];

  // Key insight
  svg.calloutBox(s, 30, 375, 440, 25,
    'Build the surface and the cord’s ± punctures cancel — it slides free!');

  // ---- Timeline updater: sync the 2D view to the 8-step solution.
  // 0 look / 1 crossings / 2 seat A / 3 seat B / 4 join A-B / 5 seat+join C /
  // 6 verify boundary / 7 push cord across and free.
  const seatStep = [2, 3, 5];   // step where each panel seats  (A, B, C)
  const bandStep = [4, 5, 5];   // step where each band connects (AB, BC, CA)
  const cordFrames = [
    [cx, cy + 5], [cx, cy + 5], [cx, cy + 5], [cx, cy + 5],
    [cx, cy + 5], [cx, cy + 5], [cx, cy + 5],
    [cx + 110, cy + 5],         // step 7: pushed across and clear of the knot
  ];
  const last = animationSteps.length - 1;
  return function update(state) {
    const i = Math.max(0, Math.min(state.stepIndex ?? 0, last));
    const p = Math.max(0, Math.min(state.stepProgress ?? 0, 1));

    const [cordX, cordY] = svg.lerpFrames(cordFrames, i, p);
    cord.setAttribute('cx', cordX);
    cord.setAttribute('cy', cordY);
    cord.style.opacity = i === last ? String(1 - 0.35 * p) : '1';

    // Each panel fades in on its seating step; each band on its connect step.
    disks.forEach((d, k) => {
      d.style.opacity = String(i < seatStep[k] ? 0 : i === seatStep[k] ? 0.5 * p : 0.5);
    });
    bandEls.forEach((b, k) => {
      b.style.opacity = String(i < bandStep[k] ? 0 : i === bandStep[k] ? p : 1);
    });

    // Step 1 spotlights the crossing regions; step 6 the boundary outline.
    crossMarks.forEach((c) => svg.highlight(c, i === 1, { dim: 0.15, color: RING }));
    svg.highlight(outline, i === 6, { dim: 1, color: RING });

    // Phase badges: build (0-5), verify (6), push free (7).
    const phase = i <= 5 ? 0 : i === 6 ? 1 : 2;
    badges.forEach((b, k) => svg.highlight(b, k === phase, { dim: 0.3, color: CORD }));

    // Motion arrows: only the relevant one for the current step.
    svg.highlight(arrowSeat, i === 2 || i === 3 || i === 5, { glow: false, dim: 0 });
    svg.highlight(arrowPush, i === last, { glow: false, dim: 0 });
  };
}

export function dispose() {
  highlights.dispose();
}
