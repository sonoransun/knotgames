import * as THREE from 'three';
import { createMaterials, createHighlightMaterial, applyHighlight, removeHighlight } from '../lib/materials.js';
import { createRing, createBall } from '../lib/components.js';
import { CordPath } from '../lib/cord.js';
import { enableShadowsOnGroup } from '../lib/scene.js';
import { StepArrowManager } from '../lib/arrow-helpers.js';
import * as svg from '../lib/svg.js';

export const metadata = {
  id: 17,
  name: 'The Satellite Trap',
  difficulty: 'Expert',
  principle: 'Satellite knots (JSJ decomposition)',
  type: 'Extraction',
  description: 'A torus shell hides a trefoil-knotted internal tunnel. A cord threads through, creating a satellite knot — a knot within a knot. The outer ring is linked only to the pattern layer and can be freed by decomposing the structure.',
  cameraPosition: [0, 60, 250],
};

const TORUS_MAJOR_R = 55;
const TORUS_MINOR_R = 12;
const TUNNEL_R = 4;

// Create the main torus shell (semi-transparent to show internal structure)
function createTorusShell(material) {
  const geometry = new THREE.TorusGeometry(TORUS_MAJOR_R, TORUS_MINOR_R, 32, 64);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = Math.PI / 2;
  return mesh;
}

// Internal trefoil tunnel path (a (2,3) torus knot inside the torus tube)
function tunnelKnotPath(segments = 96) {
  const pts = [];
  for (let i = 0; i <= segments; i++) {
    const t = (2 * Math.PI * i) / segments;
    const p = 2, q = 3;
    const phi = p * t;
    const theta = q * t;
    // Path inside the torus tube wall (at half the minor radius)
    const tunnelOffset = TORUS_MINOR_R * 0.5;
    const r = TORUS_MAJOR_R + tunnelOffset * Math.cos(theta);
    pts.push([
      r * Math.cos(phi),
      tunnelOffset * Math.sin(theta),
      r * Math.sin(phi),
    ]);
  }
  return pts;
}

// Cord path through the tunnel (follows the trefoil tunnel)
function cordThroughTunnel(segments = 96) {
  return tunnelKnotPath(segments);
}

// External cord loop (the "pattern" — how cord connects outside the torus)
function externalCordPath() {
  return [
    [TORUS_MAJOR_R + TORUS_MINOR_R + 5, 0, 0],  // exit port 1
    [TORUS_MAJOR_R + 25, 15, 10],
    [TORUS_MAJOR_R + 30, 20, 0],                   // where outer ring sits
    [TORUS_MAJOR_R + 25, 15, -10],
    [TORUS_MAJOR_R + TORUS_MINOR_R + 5, 0, -5],  // back to port 2
  ];
}

// Freed external cord (rerouted to unlink from outer ring)
function freedExternalCord() {
  return [
    [TORUS_MAJOR_R + TORUS_MINOR_R + 5, 0, 0],
    [TORUS_MAJOR_R + 20, 5, 15],
    [TORUS_MAJOR_R + 15, 0, 20],
    [TORUS_MAJOR_R + 20, -5, 15],
    [TORUS_MAJOR_R + TORUS_MINOR_R + 5, 0, -5],
  ];
}

// Port markers (where cord exits the torus surface)
function createPortMarkers(material) {
  const group = new THREE.Group();
  const portGeo = new THREE.TorusGeometry(4, 1.5, 8, 16);

  // Port 1 (top-right)
  const port1 = new THREE.Mesh(portGeo, material);
  port1.position.set(TORUS_MAJOR_R + TORUS_MINOR_R + 2, 0, 0);
  port1.rotation.y = Math.PI / 2;
  group.add(port1);

  // Port 2
  const port2 = new THREE.Mesh(portGeo, material);
  port2.position.set(TORUS_MAJOR_R + TORUS_MINOR_R + 2, 0, -5);
  port2.rotation.y = Math.PI / 2;
  group.add(port2);

  return group;
}

export function create3DScene() {
  const mats = createMaterials();
  const group = new THREE.Group();

  // Torus shell (semi-transparent)
  const shellMat = new THREE.MeshPhysicalMaterial({
    color: 0xaaccee,
    transmission: 0.6,
    roughness: 0.1,
    ior: 1.45,
    thickness: 20,
  });
  const shell = createTorusShell(shellMat);
  group.add(shell);

  // Internal tunnel visualization (trefoil cord inside torus)
  const tunnelCord = new CordPath(cordThroughTunnel(), {
    radius: TUNNEL_R,
    material: mats.cordRed,
    closed: true,
  });
  tunnelCord.addTo(group);

  // External cord (the pattern)
  const extCord = new CordPath(externalCordPath(), {
    radius: 2.5,
    material: mats.cord,
  });
  extCord.addTo(group);

  // Port markers
  const ports = createPortMarkers(mats.yellow);
  group.add(ports);

  // Ball-stops
  const ball1 = createBall(10, mats.wood);
  ball1.position.set(-(TORUS_MAJOR_R + TORUS_MINOR_R + 8), 0, 0);
  group.add(ball1);

  const ball2 = createBall(10, mats.wood);
  ball2.position.set(TORUS_MAJOR_R + TORUS_MINOR_R + 8, 0, 15);
  group.add(ball2);

  // Inner ring (trapped — on the cord inside the tunnel)
  const innerRing = createRing(22, 3, mats.brass);
  innerRing.position.set(-(TORUS_MAJOR_R + 5), 0, 0);
  group.add(innerRing);

  // Outer ring (linked to external pattern — can be freed)
  const outerRing = createRing(30, 4, mats.brass);
  outerRing.position.set(TORUS_MAJOR_R + 30, 20, 0);
  outerRing.rotation.x = Math.PI / 2;
  group.add(outerRing);

  enableShadowsOnGroup(group);
  return group;
}

export function createAnimScene() {
  const mats = createMaterials();
  const group = new THREE.Group();

  const shellMat = new THREE.MeshPhysicalMaterial({
    color: 0xaaccee,
    transmission: 0.6,
    roughness: 0.1,
    ior: 1.45,
    thickness: 20,
  });
  const shell = createTorusShell(shellMat);
  group.add(shell);

  const tunnelCord = new CordPath(cordThroughTunnel(), {
    radius: TUNNEL_R,
    material: mats.cordRed,
    closed: true,
  });
  tunnelCord.addTo(group);

  const extCord = new CordPath(externalCordPath(), {
    radius: 2.5,
    material: mats.cord,
  });
  extCord.addTo(group);

  const ports = createPortMarkers(mats.yellow);
  group.add(ports);

  const innerRing = createRing(22, 3, mats.brass);
  innerRing.position.set(-(TORUS_MAJOR_R + 5), 0, 0);
  group.add(innerRing);

  const outerRing = createRing(30, 4, mats.brass);
  outerRing.position.set(TORUS_MAJOR_R + 30, 20, 0);
  outerRing.rotation.x = Math.PI / 2;
  group.add(outerRing);

  enableShadowsOnGroup(group);
  const arrowManager = new StepArrowManager(group);

  return { group, objects: { extCord, outerRing, innerRing, arrowManager } };
}

const arrowConfigs = {
  1: { arrows: [
    { from: [TORUS_MAJOR_R + 30, 20, 5], to: [TORUS_MAJOR_R + 30, 20, -5], opts: { color: 0xffcc44 } },
  ]},
  2: { arrows: [
    { from: [TORUS_MAJOR_R + TORUS_MINOR_R + 5, 0, 0], to: [TORUS_MAJOR_R + 20, 5, 15], opts: { color: 0x4488ff } },
  ]},
  3: { arrows: [
    { from: [TORUS_MAJOR_R + 30, 20, 0], to: [TORUS_MAJOR_R + 50, 40, 30], opts: { color: 0x44cc44 } },
  ]},
};
let highlightMat = null;

export const animationSteps = [
  {
    label: 'Look: two rings sit on a knot-within-a-knot structure',
    duration: 2.5,
    extCord: externalCordPath(),
    outerRingPos: [TORUS_MAJOR_R + 30, 20, 0],
    innerRingPos: [-(TORUS_MAJOR_R + 5), 0, 0],
  },
  {
    label: 'The outer ring hooks only on the external cord, not the inner tunnel',
    duration: 2.5,
    extCord: externalCordPath(),
    outerRingPos: [TORUS_MAJOR_R + 30, 20, 0],
    innerRingPos: [-(TORUS_MAJOR_R + 5), 0, 0],
  },
  {
    label: 'Reroute the cord at the ports to bypass the outer ring',
    duration: 3.0,
    extCord: freedExternalCord(),
    outerRingPos: [TORUS_MAJOR_R + 30, 20, 0],
    innerRingPos: [-(TORUS_MAJOR_R + 5), 0, 0],
  },
  {
    label: 'Pull the outer ring free! The inner ring stays locked forever',
    duration: 2.5,
    extCord: freedExternalCord(),
    outerRingPos: [TORUS_MAJOR_R + 50, 40, 30],
    innerRingPos: [-(TORUS_MAJOR_R + 5), 0, 0],
  },
];

export function updateAnimation(objects, state) {
  const { stepIndex, stepProgress } = state;

  // Direction arrows
  if (objects.arrowManager) {
    objects.arrowManager.showForStep(stepIndex, arrowConfigs);
    objects.arrowManager.updateOpacity(stepProgress);
  }

  // Highlight outer ring during movement
  if (stepIndex >= 1) {
    if (!highlightMat) {
      highlightMat = createHighlightMaterial(objects.outerRing.material, 0xffcc44, 0.3);
    }
    applyHighlight(objects.outerRing, highlightMat);
  } else {
    removeHighlight(objects.outerRing);
  }

  const step = animationSteps[stepIndex];
  const prevStep = stepIndex > 0 ? animationSteps[stepIndex - 1] : animationSteps[0];

  // Interpolate external cord
  if (step.extCord && prevStep.extCord) {
    const interpolated = CordPath.interpolatePoints(prevStep.extCord, step.extCord, stepProgress);
    objects.extCord.update(interpolated);
  }

  // Interpolate outer ring
  const fo = prevStep.outerRingPos;
  const to = step.outerRingPos;
  objects.outerRing.position.set(
    fo[0] + (to[0] - fo[0]) * stepProgress,
    fo[1] + (to[1] - fo[1]) * stepProgress,
    fo[2] + (to[2] - fo[2]) * stepProgress,
  );

  // Inner ring stays put (trapped)
  const fi = prevStep.innerRingPos;
  const ti = step.innerRingPos;
  objects.innerRing.position.set(
    fi[0] + (ti[0] - fi[0]) * stepProgress,
    fi[1] + (ti[1] - fi[1]) * stepProgress,
    fi[2] + (ti[2] - fi[2]) * stepProgress,
  );
}

export function createSVGDiagram(container) {
  const s = svg.createSVG(container, 500, 420);

  svg.text(s, 250, 25, 'The Satellite Trap — JSJ Decomposition', {
    fontSize: 14, anchor: 'middle', fontWeight: 'bold',
  });

  // Torus (top view — two concentric ellipses)
  const cx = 220, cy = 170;
  svg.ellipse(s, cx, cy, 100, 55, { stroke: '#aaa', strokeWidth: 2, fill: 'none' });
  svg.ellipse(s, cx, cy, 55, 30, { stroke: '#aaa', strokeWidth: 1, fill: '#f0f4f8', dashArray: '4,3' });

  // Internal tunnel (trefoil path, shown as red dashed)
  svg.path(s, `M ${cx + 80} ${cy} C ${cx + 90} ${cy - 40}, ${cx + 20} ${cy - 55}, ${cx} ${cy - 40} C ${cx - 30} ${cy - 25}, ${cx - 90} ${cy - 15}, ${cx - 80} ${cy} C ${cx - 90} ${cy + 15}, ${cx - 30} ${cy + 55}, ${cx} ${cy + 40} C ${cx + 20} ${cy + 25}, ${cx + 90} ${cy + 40}, ${cx + 80} ${cy}`, {
    stroke: '#cc3333', strokeWidth: 2.5, fill: 'none', dashArray: '6,3',
  });
  svg.text(s, cx - 50, cy - 45, 'Companion', { fontSize: 9, fill: '#cc3333', fontWeight: 'bold' });
  svg.text(s, cx - 50, cy - 33, '(trefoil tunnel)', { fontSize: 8, fill: '#cc3333' });

  // External cord (pattern — shown as blue)
  // Port markers
  svg.circle(s, cx + 95, cy - 8, 5, { fill: '#ddcc33', stroke: '#aa9900', strokeWidth: 1.5 });
  svg.circle(s, cx + 95, cy + 8, 5, { fill: '#ddcc33', stroke: '#aa9900', strokeWidth: 1.5 });
  svg.text(s, cx + 110, cy - 8, 'P1', { fontSize: 8, fill: '#aa9900' });
  svg.text(s, cx + 110, cy + 12, 'P2', { fontSize: 8, fill: '#aa9900' });

  // External loop
  svg.path(s, `M ${cx + 100} ${cy - 8} C ${cx + 130} ${cy - 25}, ${cx + 150} ${cy - 10}, ${cx + 140} ${cy} C ${cx + 150} ${cy + 10}, ${cx + 130} ${cy + 25}, ${cx + 100} ${cy + 8}`, {
    stroke: '#2255aa', strokeWidth: 2.5, fill: 'none',
  });
  svg.text(s, cx + 150, cy - 20, 'Pattern', { fontSize: 9, fill: '#2255aa', fontWeight: 'bold' });
  svg.text(s, cx + 150, cy - 8, '(external loop)', { fontSize: 8, fill: '#2255aa' });

  // Outer ring (around external cord)
  svg.ellipse(s, cx + 140, cy, 14, 10, { stroke: '#cc8800', strokeWidth: 2.5, fill: 'none' });
  svg.label(s, cx + 175, cy + 20, cx + 154, cy, 'Outer ring');

  // Inner ring (inside torus)
  svg.ellipse(s, cx - 70, cy, 10, 7, { stroke: '#cc8800', strokeWidth: 2.5, fill: 'none' });
  svg.label(s, cx - 115, cy - 15, cx - 80, cy, 'Inner ring');

  // Motion arrows showing reroute and ring exit
  svg.motionArrow(s, cx + 100, cy - 8, cx + 100, cy + 8, { label: 'Reroute cord', curvature: 0.4 });
  svg.motionArrow(s, cx + 140, cy, cx + 170, cy - 20, { label: 'Pull ring free', curvature: 0.3 });

  // Hand icon near the ports
  svg.handIcon(s, cx + 120, cy + 20, { scale: 0.6, rotation: -10 });

  // Explanation
  svg.rect(s, 30, 250, 440, 60, { fill: '#f5f5f5', stroke: '#ddd', strokeWidth: 1, rx: 4 });
  svg.text(s, 250, 268, 'Two layers — solve each one separately:', {
    fontSize: 11, anchor: 'middle', fontWeight: 'bold', fill: '#333',
  });
  svg.text(s, 250, 285, 'Inner tunnel (red dashed): a fixed knot that traps the inner ring', {
    fontSize: 9, anchor: 'middle', fill: '#cc3333',
  });
  svg.text(s, 250, 299, 'Outer loop (blue): can be rerouted at the ports to free the outer ring', {
    fontSize: 9, anchor: 'middle', fill: '#2255aa',
  });

  // Step badges
  svg.stepBadge(s, 45, 325, 1, 3, { radius: 11 });
  svg.actionLabel(s, 110, 325, 'Spot which ring is on which layer');
  svg.stepBadge(s, 45, 350, 2, 3, { radius: 11 });
  svg.actionLabel(s, 110, 350, 'Reroute cord at the two ports');
  svg.stepBadge(s, 45, 375, 3, 3, { radius: 11 });
  svg.actionLabel(s, 110, 375, 'Pull outer ring free');

  // Key insight
  const calloutRect = svg.rect(s, 30, 390, 440, 25, { fill: '#fff3e0', stroke: '#e67e22', strokeWidth: 1, rx: 4 });
  calloutRect.classList.add('callout-box');
  svg.text(s, 250, 407, 'A knot inside a knot — solve each layer on its own to free the right ring!', {
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
