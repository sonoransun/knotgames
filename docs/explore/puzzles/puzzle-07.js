import * as THREE from 'three';
import { createMaterials } from '../lib/materials.js';
import { createPost, createRing, createBall } from '../lib/components.js';
import { CordPath } from '../lib/cord.js';
import { enableShadowsOnGroup } from '../lib/scene.js';
import { StepArrowManager } from '../lib/arrow-helpers.js';
import { resolveStep, applyStepTransforms, HighlightCache } from '../lib/puzzle-helpers.js';
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
const WRAP_R = POST_R + 8;

// Every cord keyframe must have exactly this many control points —
// CordPath.interpolatePoints silently truncates to the shorter array.
const CORD_POINTS = 16;

// One helical wrap around the post (4 control points). wrap 0 is the lowest;
// the highest wrap sits nearest the finial: it is the outermost wrap and is
// the one lifted off first (see the md's checkpoint-a/b diagrams).
function wrapPoints(wrap, radius) {
  const baseY = 30 + wrap * 50;
  const dir = wrap % 2 === 0 ? 1 : -1;
  return [
    [radius * dir, baseY, radius],
    [-radius * dir, baseY + 15, -radius],
    [radius * dir, baseY + 30, radius * 0.5],
    [0, baseY + 40, -radius * dir],
  ];
}

// Build a CORD_POINTS-length keyframe: hook lead-in, one helix per entry in
// wrapRadii (index 0 = lowest wrap), then a tail padded up the post so every
// keyframe interpolates 1:1. Larger radii read as slack gathered in a wrap.
function cordKeyframe(wrapRadii) {
  const pts = [
    [30, 0, 0], // at the hook
    [25, 10, 5],
  ];
  wrapRadii.forEach((r, w) => pts.push(...wrapPoints(w, r)));
  const startY = 30 + wrapRadii.length * 50 - 10; // y of the last wrap point
  const tail = CORD_POINTS - pts.length;
  for (let k = 1; k <= tail; k++) {
    const f = k / tail;
    const xz = 5 * (1 - f);
    pts.push([xz, startY + (180 - startY) * f, xz]);
  }
  return pts;
}

// Three tight wraps around the post (trefoil-like)
function initialCordPath() {
  return cordKeyframe([WRAP_R, WRAP_R, WRAP_R]);
}

// Fully unwound: the cord drapes alongside the post from hook to top end.
function solvedCordPath() {
  return [
    [30, 0, 0],
    [25, 10, 5],
    [20, 30, 8],
    [17, 45, 9],
    [15, 60, 10],
    [13, 75, 9],
    [12, 90, 8],
    [10, 105, 6],
    [8, 120, 5],
    [6, 130, 4],
    [5, 140, 3],
    [3, 155, 2],
    [2, 165, 1],
    [1, 172, 1],
    [0, 178, 0],
    [0, 180, 0],
  ];
}

// Post, finial, base, ring, hook, cord — shared by both scenes.
function buildScene() {
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
  return { group, ring, cord };
}

export function create3DScene() {
  return buildScene().group;
}

export function createAnimScene() {
  const { group, ring, cord } = buildScene();
  const arrowManager = new StepArrowManager(group);
  return { group, objects: { ring, cord, arrowManager } };
}

// Yellow = slide the ring down the post; green = lift a wrap over the finial.
const arrowConfigs = {
  1: { arrows: [
    { from: [0, RING_Y, 0], to: [0, 10, 0], opts: { color: 0xffcc44 } },
  ]},
  2: { arrows: [
    { from: [0, 180, 0], to: [20, 210, 10], opts: { color: 0x44cc44 } },
  ]},
  3: { arrows: [
    { from: [0, 30, 0], to: [0, 10, 0], opts: { color: 0xffcc44 } },
  ]},
  4: { arrows: [
    { from: [0, 180, 0], to: [20, 210, 10], opts: { color: 0x44cc44 } },
  ]},
  5: { arrows: [
    { from: [0, 180, 0], to: [20, 210, 10], opts: { color: 0x44cc44 } },
  ]},
};

// Six beats, following the md's solution: slide the ring down for slack
// before the first two lifts (common mistake #3), then lift the outermost
// wrap over the finial; the last wrap comes off in a single pull with no
// separate slack beat. Checkpoints: after step 2 two wraps remain (a),
// after step 4 one wrap remains (b), after step 5 the cord hangs free (c).
export const animationSteps = [
  {
    label: 'Look: the cord wraps three times around the post like a knot',
    duration: 2.5,
    cord: initialCordPath(),
    ring: { position: [0, RING_Y, 0] },
  },
  {
    label: 'Slide the ring down to the base — slack gathers by the finial',
    duration: 2.0,
    easing: 'easeOut',
    // Wraps loosen as slack arrives; the outermost (top) wrap loosens most.
    cord: cordKeyframe([WRAP_R + 2, WRAP_R + 5, WRAP_R + 9]),
    ring: { position: [0, 14, 0] },
  },
  {
    label: 'Lift the outermost wrap over the ball finial — two wraps remain',
    duration: 2.5,
    easing: 'easeOut',
    cord: cordKeyframe([WRAP_R, WRAP_R]),
    ring: { position: [0, 26, 0] }, // pulling the loop through tugs the ring back up
  },
  {
    label: 'Slide the ring down again for fresh slack',
    duration: 2.0,
    easing: 'easeOut',
    cord: cordKeyframe([WRAP_R + 2, WRAP_R + 8]),
    ring: { position: [0, 14, 0] },
  },
  {
    label: 'Lift the next wrap over the finial — one wrap remains',
    duration: 2.5,
    easing: 'easeOut',
    cord: cordKeyframe([WRAP_R]),
    ring: { position: [0, 24, 0] },
  },
  {
    label: 'Pull the last wrap over the finial — cord hangs free!',
    duration: 2.75,
    easing: 'easeOut',
    cord: solvedCordPath(),
    ring: { position: [0, RING_Y, 0] },
  },
];

const highlights = new HighlightCache();

export function updateAnimation(objects, state) {
  const { step, prevStep, t, stepIndex } = resolveStep(animationSteps, state, {
    arrowManager: objects.arrowManager,
    arrowConfigs,
  });

  // Highlight the cord while it is being worked (every step after the look)
  highlights.set(objects.cord.mesh, stepIndex >= 1, 0x4488ff, 0.3);

  applyStepTransforms(objects, prevStep, step, t, {
    cord: { target: 'cord', kind: 'cordPoints' },
    ring: { target: 'ring', kind: 'position' },
  });
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
  // Steps (0-based): 0 look, 1 slide ring down, 2 lift outermost wrap (2 left),
  // 3 slide ring down again, 4 lift second wrap (1 left), 5 last wrap pulls free.
  // Ring cy at the END of each step: rest, at base, tugged up by the pull-through,
  // back down for fresh slack, tugged up, rest (matches the 3D ring motion).
  const ringFrames = [[305], [315], [309], [315], [309], [305]];
  const LAST_STEP = ringFrames.length - 1;
  const setWrapVisible = (wrap, on) => {
    if (!wrap) return;
    svg.highlight(wrap.front, on, { glow: false, dim: 0 });
    svg.highlight(wrap.back, on, { glow: false, dim: 0 });
    if (wrap.gap) svg.highlight(wrap.gap, on, { glow: false, dim: 0 });
  };
  return function update(state) {
    const i = Math.max(0, Math.min(state.stepIndex ?? 0, LAST_STEP));
    const p = Math.max(0, Math.min(state.stepProgress ?? 0, 1));

    // Ring vertical slide (down for slack before each lift, per the md)
    const [cy] = svg.lerpFrames(ringFrames, i, p);
    ring.setAttribute('cy', cy);

    // Wraps lift off one per lift step. wraps[0] is the top crossing on
    // screen — the outermost wrap, nearest the finial — and goes first
    // (matches the checkpoint-a/b diagrams: removed ghost at the top).
    const wrapsRemaining = i <= 1 ? 3 : i <= 3 ? 2 : i === 4 ? 1 : 0;
    wraps.forEach((w, k) => setWrapVisible(w, k >= wraps.length - wrapsRemaining));

    // Badges: 0 = slide ring down, 1 = lift wrap over ball, 2 = pull free
    const phase = i === 5 ? 2 : (i === 2 || i === 4) ? 1 : 0;
    badges.forEach((b, k) => svg.highlight(b, k === phase, { dim: 0.3, color: CORD }));

    // Arrows: slide arrow on the slack beats, lift arrow on the lift beats
    svg.highlight(arrowSlide, i === 1 || i === 3, { glow: false, dim: 0 });
    svg.highlight(arrowLift, i === 2 || i === 4 || i === 5, { glow: false, dim: 0 });
  };
}

export function dispose() {
  highlights.dispose();
}
