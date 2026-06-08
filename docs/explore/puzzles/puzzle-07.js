import * as THREE from 'three';
import { createMaterials, createHighlightMaterial, applyHighlight, removeHighlight } from '../lib/materials.js';
import { createPost, createRing, createBall } from '../lib/components.js';
import { CordPath } from '../lib/cord.js';
import { enableShadowsOnGroup } from '../lib/scene.js';
import { StepArrowManager } from '../lib/arrow-helpers.js';
import * as svg from '../lib/svg.js';

export const metadata = {
  id: 8,
  name: "The Ferryman's Knot",
  difficulty: 'Advanced',
  principle: 'Open knot vs closed knot; Reidemeister moves',
  type: 'Disentanglement',
  description: 'A cord wraps around a post in a trefoil-like pattern. Knot theory says trefoils can\'t be unknotted — but this is an open arc on a fixed axis. The rules are completely different.',
  cameraPosition: [60, 120, 200],
};

const POST_H = 200;
const POST_R = 10;
const FINIAL_R = 15;
const RING_Y = 40;

// Three wraps around the post (trefoil-like)
function initialCordPath() {
  const pts = [];
  const R = POST_R + 8;
  // From hook at base
  pts.push([30, 0, 0]);    // hook position
  pts.push([25, 10, 5]);

  // Three helical wraps with crossings
  for (let wrap = 0; wrap < 3; wrap++) {
    const baseY = 30 + wrap * 50;
    const dir = wrap % 2 === 0 ? 1 : -1;
    pts.push([R * dir, baseY, R]);
    pts.push([-R * dir, baseY + 15, -R]);
    pts.push([R * dir, baseY + 30, R * 0.5]);
    pts.push([0, baseY + 40, -R * dir]);
  }

  // Up to ring
  pts.push([5, RING_Y + 140, 5]);
  pts.push([0, RING_Y + 150, 0]);

  return pts;
}

// Two wraps remaining
function midCordPath1() {
  const pts = [];
  const R = POST_R + 8;
  pts.push([30, 0, 0]);
  pts.push([25, 10, 5]);

  for (let wrap = 0; wrap < 2; wrap++) {
    const baseY = 30 + wrap * 50;
    const dir = wrap % 2 === 0 ? 1 : -1;
    pts.push([R * dir, baseY, R]);
    pts.push([-R * dir, baseY + 15, -R]);
    pts.push([R * dir, baseY + 30, R * 0.5]);
    pts.push([0, baseY + 40, -R * dir]);
  }

  // Straight up to ring (no third wrap)
  pts.push([5, 130, 5]);
  pts.push([3, 150, 3]);
  pts.push([0, 170, 0]);
  pts.push([0, 180, 0]);

  return pts;
}

// One wrap remaining
function midCordPath2() {
  const pts = [];
  const R = POST_R + 8;
  pts.push([30, 0, 0]);
  pts.push([25, 10, 5]);

  const baseY = 30;
  pts.push([R, baseY, R]);
  pts.push([-R, baseY + 15, -R]);
  pts.push([R, baseY + 30, R * 0.5]);
  pts.push([0, baseY + 40, -R]);

  pts.push([5, 80, 5]);
  pts.push([3, 110, 3]);
  pts.push([2, 140, 2]);
  pts.push([0, 170, 0]);
  pts.push([0, 180, 0]);
  pts.push([0, 180, 0]);

  return pts;
}

// Fully unwound
function solvedCordPath() {
  return [
    [30, 0, 0],
    [25, 10, 5],
    [20, 30, 8],
    [15, 60, 10],
    [12, 90, 8],
    [8, 120, 5],
    [5, 140, 3],
    [3, 155, 2],
    [2, 165, 1],
    [0, 175, 0],
    [0, 180, 0],
    [0, 180, 0],
  ];
}

export function create3DScene() {
  const mats = createMaterials();
  const group = new THREE.Group();

  // Post
  const post = createPost(POST_R * 2, POST_H, mats.wood);
  group.add(post);

  // Ball finial
  const finial = createBall(FINIAL_R * 2, mats.wood);
  finial.position.set(0, POST_H, 0);
  group.add(finial);

  // Base
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(80, 15, 80),
    mats.darkWood
  );
  base.position.y = -7.5;
  group.add(base);

  // Ring around post
  const ring = createRing(50, 4, mats.brass);
  ring.position.set(0, RING_Y, 0);
  group.add(ring);

  // Hook in base
  const hook = new THREE.Mesh(
    new THREE.TorusGeometry(5, 1.5, 8, 16, Math.PI),
    mats.steel
  );
  hook.position.set(30, 2, 0);
  hook.rotation.x = Math.PI / 2;
  group.add(hook);

  // Cord
  const cord = new CordPath(initialCordPath(), {
    radius: 2.5,
    material: mats.cord,
  });
  cord.addTo(group);

  enableShadowsOnGroup(group);
  return group;
}

export function createAnimScene() {
  const mats = createMaterials();
  const group = new THREE.Group();

  const post = createPost(POST_R * 2, POST_H, mats.wood);
  group.add(post);

  const finial = createBall(FINIAL_R * 2, mats.wood);
  finial.position.set(0, POST_H, 0);
  group.add(finial);

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(80, 15, 80),
    mats.darkWood
  );
  base.position.y = -7.5;
  group.add(base);

  const ring = createRing(50, 4, mats.brass);
  ring.position.set(0, RING_Y, 0);
  group.add(ring);

  const hook = new THREE.Mesh(
    new THREE.TorusGeometry(5, 1.5, 8, 16, Math.PI),
    mats.steel
  );
  hook.position.set(30, 2, 0);
  hook.rotation.x = Math.PI / 2;
  group.add(hook);

  const cord = new CordPath(initialCordPath(), {
    radius: 2.5,
    material: mats.cord,
  });
  cord.addTo(group);

  enableShadowsOnGroup(group);
  const arrowManager = new StepArrowManager(group);

  return { group, objects: { ring, cord, arrowManager } };
}

const arrowConfigs = {
  1: { arrows: [
    { from: [0, RING_Y, 0], to: [0, 20, 0], opts: { color: 0xffcc44 } },
    { from: [0, 180, 0], to: [20, 210, 10], opts: { color: 0x44cc44 } },
  ]},
  2: { arrows: [
    { from: [0, 180, 0], to: [20, 210, 10], opts: { color: 0x44cc44 } },
  ]},
  3: { arrows: [
    { from: [0, 180, 0], to: [20, 210, 10], opts: { color: 0x44cc44 } },
  ]},
};

let highlightMat = null;

export const animationSteps = [
  {
    label: 'Look: the cord wraps three times around the post like a knot',
    duration: 2.5,
    cord: initialCordPath(),
    ring: { position: [0, RING_Y, 0] },
  },
  {
    label: 'Slide the ring down, then lift the top wrap over the ball finial',
    duration: 3.0,
    easing: 'easeOut',
    cord: midCordPath1(),
    ring: { position: [0, 20, 0] },
  },
  {
    label: 'Lift the second wrap over the finial — one wrap left',
    duration: 3.0,
    easing: 'easeOut',
    cord: midCordPath2(),
    ring: { position: [0, 15, 0] },
  },
  {
    label: 'Pull the last wrap over the finial — cord hangs free!',
    duration: 2.5,
    easing: 'easeOut',
    cord: solvedCordPath(),
    ring: { position: [0, RING_Y, 0] },
  },
];

export function updateAnimation(objects, state) {
  const { stepIndex, stepProgress } = state;

  // Direction arrows
  if (objects.arrowManager) {
    objects.arrowManager.showForStep(stepIndex, arrowConfigs);
    objects.arrowManager.updateOpacity(stepProgress);
  }

  // Highlight active cord during movement steps
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

  if (step.cord && prevStep.cord) {
    const interpolated = CordPath.interpolatePoints(prevStep.cord, step.cord, stepProgress);
    objects.cord.update(interpolated);
  }

  if (step.ring && prevStep.ring) {
    const f = prevStep.ring.position;
    const t = step.ring.position;
    objects.ring.position.set(
      f[0] + (t[0] - f[0]) * stepProgress,
      f[1] + (t[1] - f[1]) * stepProgress,
      f[2] + (t[2] - f[2]) * stepProgress,
    );
  }
}

export function createSVGDiagram(container) {
  const s = svg.createSVG(container, 500, 400);

  const INK = 'var(--dia-ink, #24211a)';
  const RIGID = 'var(--dia-rigid, #8a8275)';
  const CORD = 'var(--dia-cord, #1f57c4)';
  const RING = 'var(--dia-ring, #b97d12)';
  const WOOD = 'var(--dia-wood, #b07d52)';
  const WASH = 'var(--dia-wash, #ece3d0)';

  svg.text(s, 250, 25, "The Ferryman's Knot — Initial State", {
    fontSize: 14, anchor: 'middle', fontWeight: 'bold',
  });

  // Post
  svg.rect(s, 240, 60, 20, 260, { fill: WOOD, stroke: INK, strokeWidth: 1.5 });

  // Finial
  svg.circle(s, 250, 55, 18, { fill: WOOD, stroke: INK, strokeWidth: 1.5 });

  // Base
  svg.rect(s, 200, 320, 100, 20, { fill: INK, stroke: INK, strokeWidth: 1.5 });

  // Cord wraps (simplified front view — three X crossings, animated).
  // Capture each wrap's two strands so the updater can lift them off one by one.
  const wraps = [];
  for (let i = 0; i < 3; i++) {
    const y = 120 + i * 60;
    const delay = i * 0.6;
    // Front strand (animated)
    const front = svg.animatedPath(s, `M 220 ${y} L 280 ${y + 40}`, {
      stroke: CORD, strokeWidth: 2.5, fill: 'none',
      animDuration: 0.5, animDelay: delay,
    });
    // Back strand (with gap for crossing)
    const gap = svg.crossingGap(s, 250, y + 20, Math.PI / 4, 14);
    const back = svg.animatedPath(s, `M 280 ${y} L 220 ${y + 40}`, {
      stroke: CORD, strokeWidth: 2.5, fill: 'none',
      animDuration: 0.5, animDelay: delay + 0.25,
    });
    wraps.push({ front, back, gap });
  }

  // Cord to hook
  svg.path(s, 'M 240 300 L 310 320', { stroke: CORD, strokeWidth: 2.5 });

  // Hook
  svg.path(s, 'M 310 320 Q 320 310 310 300', { stroke: RIGID, strokeWidth: 3, fill: 'none' });

  // Ring on post — animatable primary moving element
  const ring = svg.ellipse(s, 250, 305, 22, 8, { stroke: RING, strokeWidth: 3, fill: 'none' });
  ring.style.transition = 'cy .12s linear';

  // Labels
  svg.label(s, 340, 55, 268, 55, 'Ball finial (30mm)');
  svg.label(s, 130, 170, 218, 170, '3 crossings');
  svg.label(s, 350, 305, 272, 305, 'Ring (trapped by finial)');
  svg.label(s, 360, 320, 320, 315, 'Hook in base');

  // Motion arrows showing solution (toggled per step by the updater)
  const arrowSlide = svg.motionArrow(s, 250, 300, 250, 270, { label: 'Slide ring down', curvature: 0.3 });
  const arrowLift = svg.motionArrow(s, 260, 120, 290, 55, { label: 'Lift wrap over ball', curvature: 0.4 });

  // Hand icon near manipulation point
  svg.handIcon(s, 285, 130, { scale: 0.6, rotation: -15 });

  // Step badges (highlighted per phase by the updater)
  const badge1 = svg.stepBadge(s, 42, 130, 1, 3, { radius: 11 });
  svg.actionLabel(s, 105, 130, 'Slide ring down');
  const badge2 = svg.stepBadge(s, 42, 165, 2, 3, { radius: 11 });
  svg.actionLabel(s, 130, 165, 'Lift each wrap over ball');
  const badge3 = svg.stepBadge(s, 42, 200, 3, 3, { radius: 11 });
  svg.actionLabel(s, 110, 200, 'Pull cord free');
  const badges = [badge1, badge2, badge3];

  // Key insight
  const calloutRect = svg.rect(s, 20, 355, 460, 35, { fill: WASH, stroke: RING, strokeWidth: 1, rx: 4 });
  svg.text(s, 250, 370, 'The cord is an open arc, not a closed knot — each wrap lifts off!', {
    fontSize: 10, anchor: 'middle', fill: RING, fontWeight: 'bold',
  });
  svg.text(s, 250, 383, 'Slide the ring down for slack, then lift wraps over the finial one by one.', {
    fontSize: 10, anchor: 'middle', fill: RING,
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
  calloutRect.classList.add('callout-box');

  // ---- Timeline updater: sync 2D ring + wraps + badges + arrows to the solution.
  // Steps (0-based): 0 look, 1 slide ring + lift top wrap, 2 lift second wrap, 3 last wrap free.
  // Ring slides down the post in step 1, then stays low (matches the 3D ring motion).
  const ringY = [305, 312, 312, 312];
  const setWrapVisible = (wrap, on) => {
    if (!wrap) return;
    svg.highlight(wrap.front, on, { glow: false, dim: 0 });
    svg.highlight(wrap.back, on, { glow: false, dim: 0 });
    if (wrap.gap) svg.highlight(wrap.gap, on, { glow: false, dim: 0 });
  };
  return function update(state) {
    const last = ringY.length - 1;
    const i = Math.max(0, Math.min(state.stepIndex ?? 0, last));
    const p = Math.max(0, Math.min(state.stepProgress ?? 0, 1));

    // Ring vertical slide
    const from = i === 0 ? ringY[0] : ringY[i - 1];
    const to = ringY[i];
    ring.setAttribute('cy', from + (to - from) * p);

    // Lift wraps off one at a time as the solution progresses.
    // After step 1 the top wrap is gone, after step 2 the second, after step 3 all gone.
    const wrapsRemaining = i <= 0 ? 3 : i === 1 ? 2 : i === 2 ? 1 : 0;
    wraps.forEach((w, k) => {
      // wraps[2] is the topmost (highest y index => lowest on screen). Lift from the top:
      // remaining count keeps the lowest-indexed wraps; index 0 is top crossing on screen.
      setWrapVisible(w, k < wrapsRemaining);
    });

    // Badges: phase 0 = slide ring, phase 1 = lift wraps, phase 2 = pull free
    const phase = i <= 1 ? 0 : i === 2 ? 1 : 2;
    badges.forEach((b, k) => svg.highlight(b, k === phase, { dim: 0.3, color: CORD }));

    // Arrows: slide arrow during the slide-down step, lift arrow during the lift steps
    svg.highlight(arrowSlide, i === 1, { glow: false, dim: 0 });
    svg.highlight(arrowLift, i === 1 || i === 2 || i === 3, { glow: false, dim: 0 });
  };
}

export function dispose() {}
