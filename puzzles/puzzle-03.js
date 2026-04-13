import * as THREE from 'three';
import { createMaterials, createHighlightMaterial, applyHighlight, removeHighlight } from '../lib/materials.js';
import { createFrame, createRing } from '../lib/components.js';
import { CordPath } from '../lib/cord.js';
import { enableShadowsOnGroup } from '../lib/scene.js';
import { StepArrowManager } from '../lib/arrow-helpers.js';
import * as svg from '../lib/svg.js';

export const metadata = {
  id: 3,
  name: "The Prisoner's Ring",
  difficulty: 'Beginner-Intermediate',
  principle: 'Linking number cancellation',
  type: 'Disentanglement',
  description: 'A cord loop wraps over a crossbar in a frame, apparently trapping a ring. But the +1 and -1 crossings cancel — linking number is zero.',
  cameraPosition: [0, 60, 220],
};

const FRAME_W = 100;
const FRAME_H = 150;
const ROD_R = 2;

function initialCordPath() {
  const hw = FRAME_W / 2;
  return [
    [-hw + 5, 40, 8],      // front-left of lower window
    [-hw + 5, 20, 10],     // going down
    [-10, -10, 12],        // bottom of drape
    [0, -30, 15],          // ring position (ring hangs here)
    [10, -10, 12],
    [hw - 5, 20, 10],      // right side going up
    [hw - 5, 40, 8],       // entering upper area
    [hw - 10, 55, 5],      // going to back through top window
    [hw - 15, 70, -5],     // crossing to back
    [0, 75, -8],           // back side, above crossbar
    [-hw + 15, 70, -5],    // left back
    [-hw + 10, 55, 5],     // crossing back to front through crossbar
    [-hw + 5, 40, 8],      // returning to front
  ];
}

function solvedCordPath() {
  const hw = FRAME_W / 2;
  return [
    [-hw + 5, 40, 8],
    [-hw + 5, 20, 10],
    [-10, -10, 12],
    [0, -30, 15],
    [10, -10, 12],
    [hw - 5, 20, 10],
    [hw - 5, 40, 8],
    [hw - 5, 55, 8],        // cord now just drapes, not crossing
    [0, 60, 8],
    [-hw + 5, 55, 8],
    [-hw + 5, 45, 8],
    [-hw + 5, 42, 8],
    [-hw + 5, 40, 8],
  ];
}

function midCordPath1() {
  const hw = FRAME_W / 2;
  return [
    [-hw + 5, 40, 8],
    [-hw + 5, 20, 10],
    [-10, -10, 12],
    [0, -30, 15],
    [10, -10, 12],
    [hw - 5, 20, 10],
    [hw - 5, 40, 8],
    [hw + 5, 55, 5],        // pulling bight over right end of crossbar
    [hw + 3, 70, -2],
    [0, 72, -6],
    [-hw + 15, 68, -4],
    [-hw + 10, 55, 4],
    [-hw + 5, 40, 8],
  ];
}

export function create3DScene() {
  const mats = createMaterials();
  const group = new THREE.Group();

  const frame = createFrame(FRAME_W, FRAME_H, ROD_R, mats.steel, 0);
  frame.position.y = FRAME_H / 2;
  group.add(frame);

  const ring = createRing(50, 4, mats.brass);
  ring.position.set(0, -30 + FRAME_H / 2, 15);
  ring.rotation.x = Math.PI / 2;
  group.add(ring);

  // Offset cord path to match frame position
  const offsetPath = initialCordPath().map(p => [p[0], p[1] + FRAME_H / 2, p[2]]);
  const cord = new CordPath(offsetPath, {
    radius: 2.5,
    material: mats.cord,
    closed: true,
  });
  cord.addTo(group);

  enableShadowsOnGroup(group);
  return group;
}

export function createAnimScene() {
  const mats = createMaterials();
  const group = new THREE.Group();

  const frame = createFrame(FRAME_W, FRAME_H, ROD_R, mats.steel, 0);
  frame.position.y = FRAME_H / 2;
  group.add(frame);

  const ring = createRing(50, 4, mats.brass);
  ring.position.set(0, -30 + FRAME_H / 2, 15);
  ring.rotation.x = Math.PI / 2;
  group.add(ring);

  const offsetPath = initialCordPath().map(p => [p[0], p[1] + FRAME_H / 2, p[2]]);
  const cord = new CordPath(offsetPath, {
    radius: 2.5,
    material: mats.cord,
    closed: true,
  });
  cord.addTo(group);

  enableShadowsOnGroup(group);
  const arrowManager = new StepArrowManager(group);

  return { group, objects: { ring, cord, arrowManager } };
}

const arrowConfigs = {
  1: { arrows: [{ from: [45, 115, 8], to: [55, 115, -2], opts: { color: 0x44cc44 } }] },
  2: { arrows: [{ from: [0, 135, 8], to: [40, 25, 30], opts: { color: 0x44cc44 } }] },
};
let highlightMat = null;

export const animationSteps = [
  {
    label: 'Look: the cord wraps over the crossbar with two opposite twists',
    duration: 2.0,
    cord: initialCordPath(),
    ring: { position: [0, -30, 15] },
  },
  {
    label: 'Pull the cord loop over the right end of the crossbar',
    duration: 2.5,
    cord: midCordPath1(),
    ring: { position: [0, -30, 15] },
  },
  {
    label: 'Cord slips free from the bar — now slide the ring off',
    duration: 2.5,
    cord: solvedCordPath(),
    ring: { position: [40, -50, 30] },
  },
];

export function updateAnimation(objects, state) {
  const { stepIndex, stepProgress } = state;

  // Direction arrows
  if (objects.arrowManager) {
    objects.arrowManager.showForStep(stepIndex, arrowConfigs);
    objects.arrowManager.updateOpacity(stepProgress);
  }

  // Highlight active ring
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
  const FH = FRAME_H / 2;

  if (step.cord && prevStep.cord) {
    const from = prevStep.cord.map(p => [p[0], p[1] + FH, p[2]]);
    const to = step.cord.map(p => [p[0], p[1] + FH, p[2]]);
    const interpolated = CordPath.interpolatePoints(from, to, stepProgress);
    objects.cord.update(interpolated);
  }

  if (step.ring && prevStep.ring) {
    const f = prevStep.ring.position;
    const t = step.ring.position;
    objects.ring.position.set(
      f[0] + (t[0] - f[0]) * stepProgress,
      f[1] + (t[1] - f[1]) * stepProgress + FH,
      f[2] + (t[2] - f[2]) * stepProgress,
    );
  }
}

export function createSVGDiagram(container) {
  const s = svg.createSVG(container, 500, 400);

  svg.text(s, 250, 25, "The Prisoner's Ring — Initial State", {
    fontSize: 14, anchor: 'middle', fontWeight: 'bold',
  });

  // Frame
  const fx = 175;
  const fy = 50;
  const fw = 150;
  const fh = 200;
  const crossY = fy + fh / 2;

  svg.rect(s, fx, fy, fw, fh, { stroke: '#888', strokeWidth: 4, fill: 'none' });
  svg.line(s, fx, crossY, fx + fw, crossY, { stroke: '#888', strokeWidth: 4 });

  // Cord: front side (through bottom window, up, through ring)
  svg.path(s, `M ${fx + 20} ${crossY - 20} L ${fx + 20} ${crossY + 30} Q 250 ${crossY + 80} ${fx + fw - 20} ${crossY + 30} L ${fx + fw - 20} ${crossY - 20}`, {
    stroke: '#2255aa', strokeWidth: 2.5, fill: 'none',
  });

  // Cord: back side (through top window, dashed)
  svg.path(s, `M ${fx + 20} ${crossY - 20} L ${fx + 20} ${crossY - 40} Q 250 ${crossY - 60} ${fx + fw - 20} ${crossY - 40} L ${fx + fw - 20} ${crossY - 20}`, {
    stroke: '#2255aa', strokeWidth: 2, fill: 'none', dashArray: '5,4',
  });

  // Ring
  svg.ellipse(s, 250, crossY + 65, 20, 16, {
    stroke: '#cc8800', strokeWidth: 3, fill: 'none',
  });

  // Crossing indicators
  svg.text(s, fx + 15, crossY - 5, 'twist A', { fontSize: 9, fill: '#d44', fontWeight: 'bold' });
  svg.text(s, fx + fw - 35, crossY - 5, 'twist B', { fontSize: 9, fill: '#44d', fontWeight: 'bold' });

  // Labels
  svg.label(s, 100, 80, fx, fy + 30, 'Frame');
  svg.label(s, 400, crossY, fx + fw, crossY, 'Crossbar');
  svg.label(s, 370, crossY + 65, 270, crossY + 65, 'Ring');
  svg.text(s, 250, crossY + 95, 'The two twists cancel each other — the cord is not truly trapped', {
    fontSize: 10, anchor: 'middle', fill: '#666', fontStyle: 'italic',
  });

  // Dimensions
  svg.dimensionArrow(s, fx, fy + fh + 20, fx + fw, fy + fh + 20, '100mm');
  svg.dimensionArrow(s, fx - 25, fy, fx - 25, fy + fh, '150mm');

  // Motion arrows showing key movements
  svg.motionArrow(s, fx + fw - 20, crossY - 20, fx + fw + 15, crossY - 10, { label: 'Pull over end', curvature: 0.3 });
  svg.motionArrow(s, 270, crossY + 65, 320, crossY + 80, { label: 'Slide ring off', curvature: 0.3 });

  // Hand icon near manipulation point
  svg.handIcon(s, fx + fw + 20, crossY + 10, { scale: 0.6, rotation: -20 });

  // Step badges
  svg.stepBadge(s, fx + fw + 25, crossY - 30, 1, 2);
  svg.actionLabel(s, fx + fw + 25, crossY - 17, 'Pull cord over bar end');
  svg.stepBadge(s, 320, crossY + 90, 2, 2);
  svg.actionLabel(s, 320, crossY + 103, 'Slide ring off');

  // Key insight
  const calloutRect = svg.rect(s, 30, 355, 440, 35, { fill: '#fff3e0', stroke: '#e67e22', strokeWidth: 1, rx: 4 });
  calloutRect.classList.add('callout-box');
  svg.text(s, 250, 377, 'Key: The two twists cancel out — pull the cord over one end to unhitch it', {
    fontSize: 11, anchor: 'middle', fill: '#bf5f00',
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
}

export function dispose() {}
