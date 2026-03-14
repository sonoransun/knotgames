import * as THREE from 'three';
import { createMaterials } from '../lib/materials.js';
import { createUBar, createRing } from '../lib/components.js';
import { CordPath, catenaryPoints } from '../lib/cord.js';
import * as svg from '../lib/svg.js';
import { CordPath as CordPathClass } from '../lib/cord.js';

export const metadata = {
  id: 1,
  name: 'The Gatekeeper',
  difficulty: 'Beginner',
  principle: 'Unknot recognition',
  type: 'Disentanglement',
  description: 'A ring appears trapped on a cord that wraps around a U-shaped bar. The visual complexity of the wrap suggests the ring is locked — but the cord never forms a closed loop. It is topologically the unknot.',
  cameraPosition: [0, 80, 220],
};

// Dimensions (in mm, used as scene units)
const BAR_WIDTH = 60;
const BAR_HEIGHT = 120;
const BEND_RADIUS = 20;
const ROD_RADIUS = 2;
const RING_OD = 50;
const RING_WIRE = 4;
const CORD_RADIUS = 2.5;

// Key positions
const LEFT_TIP = [-BAR_WIDTH / 2, BAR_HEIGHT, 0];
const RIGHT_TIP = [BAR_WIDTH / 2, BAR_HEIGHT, 0];
const RING_REST_Y = 55; // Where ring hangs in initial state

// Cord path for initial (locked) state
// Path: left tip → down to ring → through ring → wrap around U-bar curve → back through ring → up to right tip
function initialCordPath() {
  return [
    LEFT_TIP,
    [-30, 100, 0],
    [-28, 75, 3],         // approach ring from left-front
    [-15, RING_REST_Y, 5],  // through ring going right
    [-5, 40, 3],           // down toward curve
    [-15, 15, 0],          // start wrapping around curve
    [0, 8, 8],             // front of curve wrap
    [15, 15, 0],           // past curve, going up
    [5, 40, -3],           // up from curve
    [15, RING_REST_Y, -5], // back through ring from behind
    [28, 75, -3],
    [30, 100, 0],
    RIGHT_TIP,
  ];
}

// Cord path for solved state (ring freed, cord hangs simply)
function solvedCordPath() {
  return [
    LEFT_TIP,
    [-30, 100, 0],
    [-28, 70, 0],
    [-20, 45, 0],
    [-10, 25, 0],
    [0, 15, 0],
    [10, 25, 0],
    [20, 45, 0],
    [28, 70, 0],
    [30, 100, 0],
    [30, 100, 0],
    [30, 100, 0],
    RIGHT_TIP,
  ];
}

// Intermediate cord paths for animation
function midCordPath1() {
  // Ring sliding down, cord slack adjusting
  return [
    LEFT_TIP,
    [-30, 100, 0],
    [-28, 75, 2],
    [-15, 45, 4],         // ring lower
    [-5, 30, 3],
    [-15, 15, 0],
    [0, 8, 6],
    [15, 15, 0],
    [5, 30, -3],
    [15, 45, -4],
    [28, 75, -2],
    [30, 100, 0],
    RIGHT_TIP,
  ];
}

function midCordPath2() {
  // Ring sliding past the drape, cord unwinding
  return [
    LEFT_TIP,
    [-30, 100, 0],
    [-25, 70, 1],
    [-15, 35, 2],
    [-5, 20, 1],
    [-10, 12, 0],
    [0, 10, 3],
    [10, 12, 0],
    [15, 25, -1],
    [20, 45, 0],
    [28, 70, 0],
    [30, 100, 0],
    RIGHT_TIP,
  ];
}

export function create3DScene() {
  const mats = createMaterials();
  const group = new THREE.Group();

  // U-bar
  const uBar = createUBar(BAR_WIDTH, BAR_HEIGHT, BEND_RADIUS, ROD_RADIUS, mats.steel);
  group.add(uBar);

  // Ring - positioned at initial hanging point
  const ring = createRing(RING_OD, RING_WIRE, mats.brass);
  ring.position.set(0, RING_REST_Y, 0);
  ring.rotation.x = Math.PI / 2; // Orient ring to face forward
  group.add(ring);

  // Cord
  const cord = new CordPath(initialCordPath(), {
    radius: CORD_RADIUS,
    material: mats.cord,
  });
  cord.addTo(group);

  // Small balls at cord attachment points (stopper knots)
  const knot1 = new THREE.Mesh(
    new THREE.SphereGeometry(3.5, 12, 12),
    mats.cord
  );
  knot1.position.set(...LEFT_TIP);
  group.add(knot1);

  const knot2 = new THREE.Mesh(
    new THREE.SphereGeometry(3.5, 12, 12),
    mats.cord
  );
  knot2.position.set(...RIGHT_TIP);
  group.add(knot2);

  return group;
}

export function createAnimScene() {
  const mats = createMaterials();
  const group = new THREE.Group();

  // U-bar
  const uBar = createUBar(BAR_WIDTH, BAR_HEIGHT, BEND_RADIUS, ROD_RADIUS, mats.steel);
  group.add(uBar);

  // Ring
  const ring = createRing(RING_OD, RING_WIRE, mats.brass);
  ring.position.set(0, RING_REST_Y, 0);
  ring.rotation.x = Math.PI / 2;
  group.add(ring);

  // Cord
  const cord = new CordPath(initialCordPath(), {
    radius: CORD_RADIUS,
    material: mats.cord,
  });
  cord.addTo(group);

  // Stopper knots
  const knot1 = new THREE.Mesh(
    new THREE.SphereGeometry(3.5, 12, 12),
    mats.cord
  );
  knot1.position.set(...LEFT_TIP);
  group.add(knot1);

  const knot2 = new THREE.Mesh(
    new THREE.SphereGeometry(3.5, 12, 12),
    mats.cord
  );
  knot2.position.set(...RIGHT_TIP);
  group.add(knot2);

  return {
    group,
    objects: { ring, cord },
  };
}

export const animationSteps = [
  {
    label: 'Initial state: ring appears trapped by the cord wrap',
    duration: 2.0,
    ring: { position: [0, RING_REST_Y, 0] },
    cord: initialCordPath(),
  },
  {
    label: 'Push cord slack toward the left tip to create room',
    duration: 2.0,
    ring: { position: [0, 45, 0] },
    cord: midCordPath1(),
  },
  {
    label: 'Slide the ring downward past the wrap point',
    duration: 2.5,
    ring: { position: [-5, 20, 3] },
    cord: midCordPath2(),
  },
  {
    label: 'Ring slides free — the cord was never a closed loop!',
    duration: 2.5,
    ring: { position: [50, 10, 30] }, // Ring falls free to the side
    cord: solvedCordPath(),
  },
];

export function updateAnimation(objects, state) {
  const { stepIndex, stepProgress } = state;

  // Get current and previous step data
  const step = animationSteps[stepIndex];
  const prevStep = stepIndex > 0 ? animationSteps[stepIndex - 1] : animationSteps[0];

  // Interpolate ring position
  if (step.ring && prevStep.ring) {
    const from = prevStep.ring.position;
    const to = step.ring.position;
    objects.ring.position.set(
      from[0] + (to[0] - from[0]) * stepProgress,
      from[1] + (to[1] - from[1]) * stepProgress,
      from[2] + (to[2] - from[2]) * stepProgress,
    );
  }

  // Interpolate cord
  if (step.cord && prevStep.cord) {
    const interpolated = CordPathClass.interpolatePoints(prevStep.cord, step.cord, stepProgress);
    objects.cord.update(interpolated);
  }
}

export function createSVGDiagram(container) {
  const s = svg.createSVG(container, 500, 400);

  // Title
  svg.text(s, 250, 25, 'The Gatekeeper — Initial State', {
    fontSize: 14,
    anchor: 'middle',
    fontWeight: 'bold',
  });

  // U-bar (front view)
  const barLeft = 190;
  const barRight = 310;
  const barTop = 60;
  const barBottom = 300;
  const bendCenterY = 280;

  // Left arm
  svg.line(s, barLeft, barTop, barLeft, bendCenterY, { stroke: '#888', strokeWidth: 5 });
  // Right arm
  svg.line(s, barRight, barTop, barRight, bendCenterY, { stroke: '#888', strokeWidth: 5 });
  // Bottom curve
  svg.path(s, `M ${barLeft} ${bendCenterY} Q ${barLeft} ${barBottom} 250 ${barBottom} Q ${barRight} ${barBottom} ${barRight} ${bendCenterY}`, {
    stroke: '#888',
    strokeWidth: 5,
    fill: 'none',
  });

  // Stopper knots at tips
  svg.circle(s, barLeft, barTop, 5, { fill: '#2255aa', stroke: '#1a4488', strokeWidth: 1 });
  svg.circle(s, barRight, barTop, 5, { fill: '#2255aa', stroke: '#1a4488', strokeWidth: 1 });

  // Cord path (simplified 2D representation)
  // Left section: from left tip down to ring
  svg.path(s, `M ${barLeft} ${barTop} L ${barLeft + 5} 120 L 225 160`, {
    stroke: '#2255aa',
    strokeWidth: 2.5,
    fill: 'none',
    strokeLinecap: 'round',
  });

  // Cord wrapping around the curve (visual illusion of encirclement)
  // Down from ring through the U, wrapping
  svg.path(s, `M 225 160 L 220 200 Q 210 260 230 280 Q 250 295 270 280 Q 290 260 280 200 L 275 160`, {
    stroke: '#2255aa',
    strokeWidth: 2.5,
    fill: 'none',
    strokeLinecap: 'round',
  });

  // Cord: back up through ring to right tip
  svg.path(s, `M 275 160 L ${barRight - 5} 120 L ${barRight} ${barTop}`, {
    stroke: '#2255aa',
    strokeWidth: 2.5,
    fill: 'none',
    strokeLinecap: 'round',
  });

  // Ring (centered on cord at hang point)
  svg.ellipse(s, 250, 160, 22, 18, {
    stroke: '#cc8800',
    strokeWidth: 3,
    fill: 'none',
  });

  // Labels
  svg.label(s, 150, 45, barLeft, barTop, 'Stopper knot');
  svg.label(s, 350, 45, barRight, barTop, 'Stopper knot');
  svg.label(s, 340, 160, 272, 160, 'Ring (50mm)');
  svg.label(s, 130, 280, barLeft, 280, 'U-bar');
  svg.label(s, 340, 240, 280, 240, 'Cord wraps around');

  // Dimension: bar width
  svg.dimensionArrow(s, barLeft, 340, barRight, 340, '60mm');
  // Dimension: bar height
  svg.dimensionArrow(s, 170, barTop, 170, bendCenterY, '120mm');

  // Key insight callout
  svg.rect(s, 20, 355, 460, 35, {
    fill: '#e8f0fe',
    stroke: '#4a90d9',
    strokeWidth: 1,
    rx: 4,
  });
  svg.text(s, 250, 377, 'Key: The cord is an arc (open), not a closed loop — the wrap is an illusion', {
    fontSize: 11,
    anchor: 'middle',
    fill: '#2a5a8a',
  });
}

export function dispose() {
  // Materials and geometries are disposed by the app's cleanup
}
