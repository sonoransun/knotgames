import * as THREE from 'three';
import { createMaterials, createHighlightMaterial, applyHighlight, removeHighlight } from '../lib/materials.js';
import { createRod, createBlock } from '../lib/components.js';
import { CordPath } from '../lib/cord.js';
import { enableShadowsOnGroup } from '../lib/scene.js';
import { StepArrowManager } from '../lib/arrow-helpers.js';
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

// Create a Seifert surface patch as a mesh
// Each Seifert circle is a disk connected to neighbors with half-twist bands
function createSeifertSurface(material) {
  const group = new THREE.Group();

  // Three Seifert disks (from resolving the three crossings)
  // Disk 1 — top region
  const disk1Geo = new THREE.CircleGeometry(25, 32);
  const disk1 = new THREE.Mesh(disk1Geo, material);
  disk1.position.set(0, TREFOIL_SCALE * 0.8, 0);
  disk1.rotation.x = -Math.PI / 6;
  group.add(disk1);

  // Disk 2 — bottom-left region
  const disk2Geo = new THREE.CircleGeometry(25, 32);
  const disk2 = new THREE.Mesh(disk2Geo, material);
  disk2.position.set(-TREFOIL_SCALE * 0.7, -TREFOIL_SCALE * 0.4, 0);
  disk2.rotation.x = -Math.PI / 6;
  disk2.rotation.y = 2 * Math.PI / 3;
  group.add(disk2);

  // Disk 3 — bottom-right region
  const disk3Geo = new THREE.CircleGeometry(25, 32);
  const disk3 = new THREE.Mesh(disk3Geo, material);
  disk3.position.set(TREFOIL_SCALE * 0.7, -TREFOIL_SCALE * 0.4, 0);
  disk3.rotation.x = -Math.PI / 6;
  disk3.rotation.y = -2 * Math.PI / 3;
  group.add(disk3);

  // Half-twist bands connecting disks at crossing points
  const bandGeo = new THREE.PlaneGeometry(15, 30, 1, 8);
  const positions = bandGeo.attributes.position;
  // Apply a half-twist deformation
  for (let i = 0; i < positions.count; i++) {
    const y = positions.getY(i);
    const twist = (y / 30) * Math.PI;
    const x = positions.getX(i);
    positions.setX(i, x * Math.cos(twist));
    positions.setZ(i, x * Math.sin(twist));
  }
  positions.needsUpdate = true;
  bandGeo.computeVertexNormals();

  // Band 1: connecting disk 1 and disk 2
  const band1 = new THREE.Mesh(bandGeo.clone(), material);
  band1.position.set(-TREFOIL_SCALE * 0.35, TREFOIL_SCALE * 0.2, 0);
  band1.rotation.z = Math.PI / 3;
  group.add(band1);

  // Band 2: connecting disk 2 and disk 3
  const band2 = new THREE.Mesh(bandGeo.clone(), material);
  band2.position.set(0, -TREFOIL_SCALE * 0.5, 0);
  group.add(band2);

  // Band 3: connecting disk 3 and disk 1
  const band3 = new THREE.Mesh(bandGeo.clone(), material);
  band3.position.set(TREFOIL_SCALE * 0.35, TREFOIL_SCALE * 0.2, 0);
  band3.rotation.z = -Math.PI / 3;
  group.add(band3);

  return group;
}

function createTrefoilFrame(material) {
  const pts = trefoilPoints(TREFOIL_SCALE);
  return createRod(pts, ROD_R, material, true);
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
  const surfaceMat = new THREE.MeshStandardMaterial({
    color: 0x66aadd,
    metalness: 0.1,
    roughness: 0.6,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.7,
  });
  const surface = createSeifertSurface(surfaceMat);
  group.add(surface);

  enableShadowsOnGroup(group);
  return group;
}

export function createAnimScene() {
  const mats = createMaterials();
  const group = new THREE.Group();

  const base = createBlock(160, 8, 160, mats.wood);
  base.position.y = -TREFOIL_SCALE * 2.5;
  group.add(base);

  const frame = createTrefoilFrame(mats.steel);
  group.add(frame);

  // Seifert surface starts hidden (will be revealed)
  const surfaceMat = new THREE.MeshStandardMaterial({
    color: 0x66aadd,
    metalness: 0.1,
    roughness: 0.6,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.0,
  });
  const surface = createSeifertSurface(surfaceMat);
  group.add(surface);

  // Cord loop threaded through trefoil (starts linked)
  const cordPts = [
    [TREFOIL_SCALE * 1.5, 20, 0],
    [TREFOIL_SCALE * 0.5, 25, 15],
    [-TREFOIL_SCALE * 0.5, 20, 10],
    [-TREFOIL_SCALE * 1.5, 10, 0],
    [-TREFOIL_SCALE * 1.0, -10, -10],
    [0, -15, -15],
    [TREFOIL_SCALE * 1.0, -10, -10],
    [TREFOIL_SCALE * 1.5, 20, 0],
  ];
  const cord = new CordPath(cordPts, {
    radius: 2.5,
    material: mats.cord,
    closed: true,
  });
  cord.addTo(group);

  // Freed cord path (pulled away from trefoil)
  const freedCordPts = [
    [TREFOIL_SCALE * 2.0, 20, 30],
    [TREFOIL_SCALE * 1.5, 25, 35],
    [TREFOIL_SCALE * 0.5, 20, 40],
    [-TREFOIL_SCALE * 0.5, 10, 35],
    [-TREFOIL_SCALE * 1.0, -10, 30],
    [0, -15, 30],
    [TREFOIL_SCALE * 1.0, -10, 30],
    [TREFOIL_SCALE * 2.0, 20, 30],
  ];

  enableShadowsOnGroup(group);
  const arrowManager = new StepArrowManager(group);

  return { group, objects: { surface, surfaceMat, cord, cordPts, freedCordPts, arrowManager } };
}

const arrowConfigs = {
  1: { arrows: [
    { from: [0, TREFOIL_SCALE * 1.2, 0], to: [0, TREFOIL_SCALE * 0.8, 0], opts: { color: 0x66aadd } },
    { from: [-TREFOIL_SCALE, -TREFOIL_SCALE * 0.2, 0], to: [-TREFOIL_SCALE * 0.7, -TREFOIL_SCALE * 0.4, 0], opts: { color: 0x66aadd } },
  ]},
  2: { arrows: [
    { from: [TREFOIL_SCALE * 0.5, 20, 10], to: [TREFOIL_SCALE * 1.5, 20, 30], opts: { color: 0x44cc44 } },
  ]},
};
let highlightMat = null;

export const animationSteps = [
  {
    label: 'Look: the cord loops through the trefoil frame, seemingly stuck',
    duration: 2.0,
    surfaceOpacity: 0.0,
    cordPhase: 'linked',
  },
  {
    label: 'Slide the three panels into the frame to fill the trefoil shape',
    duration: 3.0,
    surfaceOpacity: 0.7,
    cordPhase: 'linked',
  },
  {
    label: 'Push the cord sideways across the filled surface to unlink it',
    duration: 2.5,
    surfaceOpacity: 0.7,
    cordPhase: 'freed',
  },
  {
    label: 'Pull the cord free! The surface showed a path through the knot',
    duration: 2.5,
    surfaceOpacity: 0.4,
    cordPhase: 'freed',
  },
];

export function updateAnimation(objects, state) {
  const { stepIndex, stepProgress } = state;

  // Direction arrows
  if (objects.arrowManager) {
    objects.arrowManager.showForStep(stepIndex, arrowConfigs);
    objects.arrowManager.updateOpacity(stepProgress);
  }

  // Highlight cord during push/free steps
  if (stepIndex >= 2) {
    if (!highlightMat) {
      highlightMat = createHighlightMaterial(objects.cord.mesh.material, 0x4488ff, 0.3);
    }
    applyHighlight(objects.cord.mesh, highlightMat);
  } else {
    removeHighlight(objects.cord.mesh);
  }

  const step = animationSteps[stepIndex];
  const prevStep = stepIndex > 0 ? animationSteps[stepIndex - 1] : animationSteps[0];

  // Animate surface opacity
  const fromOpacity = prevStep.surfaceOpacity;
  const toOpacity = step.surfaceOpacity;
  objects.surfaceMat.opacity = fromOpacity + (toOpacity - fromOpacity) * stepProgress;

  // Animate cord
  if (step.cordPhase === 'freed' && prevStep.cordPhase === 'linked') {
    const interpolated = CordPath.interpolatePoints(
      objects.cordPts, objects.freedCordPts, stepProgress
    );
    objects.cord.update(interpolated);
  } else if (step.cordPhase === 'freed') {
    objects.cord.update(objects.freedCordPts);
  }
}

export function createSVGDiagram(container) {
  const s = svg.createSVG(container, 500, 400);

  svg.text(s, 250, 25, 'The Seifert Sail — Seifert Surface Construction', {
    fontSize: 14, anchor: 'middle', fontWeight: 'bold',
  });

  const cx = 250, cy = 160;

  // Trefoil knot outline
  svg.path(s, `M ${cx} ${cy - 55} C ${cx - 60} ${cy - 65}, ${cx - 65} ${cy + 15}, ${cx - 10} ${cy + 5} C ${cx + 40} ${cy - 5}, ${cx + 65} ${cy + 55}, ${cx} ${cy + 45} C ${cx - 65} ${cy + 55}, ${cx - 40} ${cy - 5}, ${cx + 10} ${cy + 5} C ${cx + 65} ${cy + 15}, ${cx + 60} ${cy - 65}, ${cx} ${cy - 55}`, {
    stroke: '#888', strokeWidth: 3, fill: 'none',
  });

  // Three Seifert disks (filled with semi-transparent color)
  svg.ellipse(s, cx, cy - 35, 25, 18, {
    fill: '#66aadd', stroke: '#4488bb', strokeWidth: 1.5, opacity: '0.5',
  });
  svg.ellipse(s, cx - 30, cy + 20, 25, 18, {
    fill: '#66aadd', stroke: '#4488bb', strokeWidth: 1.5, opacity: '0.5',
  });
  svg.ellipse(s, cx + 30, cy + 20, 25, 18, {
    fill: '#66aadd', stroke: '#4488bb', strokeWidth: 1.5, opacity: '0.5',
  });

  // Half-twist band indicators
  svg.path(s, `M ${cx - 12} ${cy - 20} L ${cx - 20} ${cy + 5}`, {
    stroke: '#4488bb', strokeWidth: 2, dashArray: '3,2',
  });
  svg.path(s, `M ${cx - 10} ${cy + 30} L ${cx + 10} ${cy + 30}`, {
    stroke: '#4488bb', strokeWidth: 2, dashArray: '3,2',
  });
  svg.path(s, `M ${cx + 12} ${cy - 20} L ${cx + 20} ${cy + 5}`, {
    stroke: '#4488bb', strokeWidth: 2, dashArray: '3,2',
  });

  // Labels
  svg.text(s, cx, cy - 55, 'Disk 1', { fontSize: 9, anchor: 'middle', fill: '#4488bb' });
  svg.text(s, cx - 55, cy + 15, 'Disk 2', { fontSize: 9, anchor: 'middle', fill: '#4488bb' });
  svg.text(s, cx + 55, cy + 15, 'Disk 3', { fontSize: 9, anchor: 'middle', fill: '#4488bb' });
  svg.text(s, cx - 25, cy - 5, 'band', { fontSize: 8, fill: '#4488bb' });
  svg.text(s, cx + 20, cy - 5, 'band', { fontSize: 8, fill: '#4488bb' });
  svg.text(s, cx, cy + 42, 'band', { fontSize: 8, anchor: 'middle', fill: '#4488bb' });

  // Motion arrows showing assembly and cord push
  svg.motionArrow(s, cx - 25, cy - 70, cx, cy - 35, { label: 'Place panel 1', curvature: 0.3 });
  svg.motionArrow(s, cx + 60, cy + 30, cx + 30, cy + 20, { label: 'Push cord across', curvature: 0.3 });

  // Hand icon
  svg.handIcon(s, cx - 55, cy - 30, { scale: 0.6, rotation: 15 });

  // Assembly steps
  svg.rect(s, 40, 240, 420, 55, { fill: '#f5f5f5', stroke: '#ddd', strokeWidth: 1, rx: 4 });
  svg.text(s, 250, 258, 'Assembly Steps:', { fontSize: 11, anchor: 'middle', fontWeight: 'bold', fill: '#333' });
  svg.text(s, 250, 274, '1. Fit three shaped panels into the trefoil frame', {
    fontSize: 9, anchor: 'middle', fill: '#666',
  });
  svg.text(s, 250, 288, '2. Connect panels at crossings with twisted strips', {
    fontSize: 9, anchor: 'middle', fill: '#666',
  });

  // Step badges
  svg.stepBadge(s, 35, 310, 1, 3, { radius: 11 });
  svg.actionLabel(s, 100, 310, 'Insert panels into frame');
  svg.stepBadge(s, 35, 335, 2, 3, { radius: 11 });
  svg.actionLabel(s, 100, 335, 'Push cord across surface');
  svg.stepBadge(s, 35, 360, 3, 3, { radius: 11 });
  svg.actionLabel(s, 100, 360, 'Pull cord free');

  // Key insight
  const calloutRect = svg.rect(s, 30, 375, 440, 25, { fill: '#fff3e0', stroke: '#e67e22', strokeWidth: 1, rx: 4 });
  calloutRect.classList.add('callout-box');
  svg.text(s, 250, 392, 'Fill the knot with panels and the cord can slide across them to escape!', {
    fontSize: 10, anchor: 'middle', fill: '#bf5f00',
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
}

export function dispose() {}
