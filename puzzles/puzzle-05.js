import * as THREE from 'three';
import { createMaterials, createHighlightMaterial, applyHighlight, removeHighlight } from '../lib/materials.js';
import { enableShadowsOnGroup } from '../lib/scene.js';
import { StepArrowManager } from '../lib/arrow-helpers.js';
import * as svg from '../lib/svg.js';

export const metadata = {
  id: 6,
  name: 'Trinity Lock',
  difficulty: 'Intermediate',
  principle: 'Borromean rings (no pairwise linking)',
  type: 'Assembly',
  description: 'Three ovals must be interlocked so all three hold together, yet no two are linked. Remove any one and the other two fall apart. Assembly requires simultaneous three-body weaving.',
  cameraPosition: [60, 80, 180],
};

const OVAL_LONG = 40;
const OVAL_SHORT = 20;
const ROD_R = 2;

function createOval(material) {
  const pts = [];
  const segments = 48;
  for (let i = 0; i <= segments; i++) {
    const angle = (2 * Math.PI * i) / segments;
    pts.push(new THREE.Vector3(
      Math.cos(angle) * OVAL_LONG,
      Math.sin(angle) * OVAL_SHORT,
      0
    ));
  }
  const curve = new THREE.CatmullRomCurve3(pts, true);
  const geometry = new THREE.TubeGeometry(curve, 64, ROD_R, 12, true);
  return new THREE.Mesh(geometry, material);
}

// Standard Borromean ("golden rectangle") configuration: three mutually
// orthogonal ellipses, one per coordinate plane, with the long/short axes
// cyclically permuted so each ring's short opening is threaded by the next
// ring's long axis:
//   red    — XY plane: long semi-axis along x, short along y (base pose)
//   blue   — YZ plane: long along y, short along z
//   yellow — ZX plane: long along z, short along x
// The Euler triples below map the base oval (long x, short y, in XY) onto
// those planes. With OVAL_LONG/OVAL_SHORT = 40/20 the three center-curves
// stay ~16.3 units apart (verified numerically), far beyond the 2*ROD_R = 4
// contact distance, so the tubes interlock without touching.
const RING_ROT = {
  red: [0, 0, 0],
  blue: [Math.PI / 2, Math.PI / 2, 0],
  yellow: [Math.PI / 2, 0, Math.PI / 2],
};

function borromeanPositions() {
  return {
    red: { rotation: RING_ROT.red, position: [0, 0, 0] },
    blue: { rotation: RING_ROT.blue, position: [0, 0, 0] },
    yellow: { rotation: RING_ROT.yellow, position: [0, 0, 0] },
  };
}

function createBorromeanGroup(mats, separated = false) {
  const group = new THREE.Group();
  const pos = borromeanPositions();
  const ovals = {};

  // Rings keep their locked orientation even when separated, so assembly is a
  // pure translation of each ring along its own approach axis.
  for (const name of ['red', 'blue', 'yellow']) {
    const oval = createOval(mats[name]);
    oval.rotation.set(...pos[name].rotation);
    oval.position.set(...(separated ? SEP[name] : pos[name].position));
    group.add(oval);
    ovals[name] = oval;
  }

  return { group, ovals };
}

export function create3DScene() {
  const mats = createMaterials();
  const { group } = createBorromeanGroup(mats, false);
  enableShadowsOnGroup(group);
  return group;
}

export function createAnimScene() {
  const mats = createMaterials();
  const { group, ovals } = createBorromeanGroup(mats, true);
  enableShadowsOnGroup(group);
  const arrowManager = new StepArrowManager(group);
  return { group, objects: { ...ovals, arrowManager } };
}

// Approach axes: red slides in along -x (in its own XY plane), blue along +x
// (perpendicular to its YZ plane), yellow along +y (perpendicular to its ZX
// plane). All three converge on the shared center where the weave locks.
const SEP = { red: [-80, 0, 0], blue: [80, 0, 0], yellow: [0, 80, 0] };
const MID = { red: [-30, 0, 0], blue: [30, 0, 0], yellow: [0, 30, 0] };
const LOCK = { red: [0, 0, 0], blue: [0, 0, 0], yellow: [0, 0, 0] };

const arrowConfigs = {
  1: { arrows: [
    { from: [-80, 0, 0], to: [-30, 0, 0], opts: { color: 0xdd3333 } },
    { from: [80, 0, 0], to: [30, 0, 0], opts: { color: 0x3333dd } },
    { from: [0, 80, 0], to: [0, 30, 0], opts: { color: 0xddcc33 } },
  ] },
  2: { arrows: [
    { from: [-30, 0, 0], to: [0, 0, 0], opts: { color: 0xdd3333 } },
    { from: [30, 0, 0], to: [0, 0, 0], opts: { color: 0x3333dd } },
    { from: [0, 30, 0], to: [0, 0, 0], opts: { color: 0xddcc33 } },
  ] },
};
let highlightMat = null;

export const animationSteps = [
  {
    label: 'Start: hold three separate ovals — no two are linked together',
    duration: 2.0,
    positions: SEP,
    rotations: RING_ROT,
  },
  {
    label: 'Slide the ovals closer, overlapping but not yet interlocked',
    duration: 2.5,
    easing: 'easeOut',
    positions: MID,
    rotations: RING_ROT,
  },
  {
    label: 'Weave all three ovals together at the same time',
    duration: 3.0,
    easing: 'easeOut',
    positions: LOCK,
    rotations: RING_ROT,
  },
  {
    label: 'Hold and check: remove any one oval and the others fall apart',
    duration: 2.5,
    positions: LOCK,
    rotations: RING_ROT,
  },
];

export function updateAnimation(objects, state) {
  const { stepIndex, stepProgress } = state;

  // Direction arrows
  if (objects.arrowManager) {
    objects.arrowManager.showForStep(stepIndex, arrowConfigs);
    objects.arrowManager.updateOpacity(stepProgress);
  }

  // Highlight active ovals during weaving
  if (stepIndex >= 2) {
    for (const name of ['red', 'blue', 'yellow']) {
      const oval = objects[name];
      if (!oval) continue;
      if (!highlightMat) {
        highlightMat = createHighlightMaterial(oval.material, 0xaaccff, 0.3);
      }
      applyHighlight(oval, highlightMat);
    }
  } else {
    for (const name of ['red', 'blue', 'yellow']) {
      const oval = objects[name];
      if (oval) removeHighlight(oval);
    }
  }

  const step = animationSteps[stepIndex];
  const prevStep = stepIndex > 0 ? animationSteps[stepIndex - 1] : animationSteps[0];

  for (const name of ['red', 'blue', 'yellow']) {
    const oval = objects[name];
    if (!oval) continue;

    const fp = prevStep.positions[name];
    const tp = step.positions[name];
    oval.position.set(
      fp[0] + (tp[0] - fp[0]) * stepProgress,
      fp[1] + (tp[1] - fp[1]) * stepProgress,
      fp[2] + (tp[2] - fp[2]) * stepProgress,
    );
  }
}

export function createSVGDiagram(container) {
  const s = svg.createSVG(container, 500, 380);

  const RED = 'var(--dia-neg, #cf3a26)';
  const BLUE = 'var(--dia-cord, #1f57c4)';
  const GOLD = 'var(--dia-gold, #c79a22)';
  const RING = 'var(--dia-ring, #b97d12)';

  svg.text(s, 250, 25, 'Trinity Lock — Borromean Configuration', {
    fontSize: 14, anchor: 'middle', fontWeight: 'bold',
  });

  // Venn-style three-ellipse Borromean cluster: long axes at 0/240/120
  // degrees (3-fold symmetric), each ellipse pushed out from the shared
  // centroid perpendicular to its long axis — but only SPREAD px, so all
  // three overlap in a central triple region like a Venn diagram. Each pair
  // of locked ellipses then crosses at exactly 2 points (6 crossings total,
  // >= ~40px apart, so the crossing dressings never collide), and along
  // every ring its four crossings alternate partners (1-2-1-2) and senses
  // (over, under, over, under). That interleaving is what makes the flat
  // diagram genuinely Borromean — verified numerically: the diagram's link
  // determinant is 16 (the Borromean rings' value; a layout whose pairwise
  // lenses reduce away by Reidemeister-II moves would give 0, the unlink).
  const cx = 250;
  const cy = 180;
  const RX = 56;              // ring semi-axes — rounder than the physical
  const RY = 34;              //   2:1 ovals so the central weave stays open
  const SPREAD = 20;          // centroid -> ring-center distance
  const ROTS = [0, 240, 120]; // long-axis angle of each ring (deg)

  // Locked ring centers: red top, blue bottom-left, yellow bottom-right
  const positions = [
    [cx, cy - SPREAD],
    [cx - 0.866 * SPREAD, cy + 0.5 * SPREAD],
    [cx + 0.866 * SPREAD, cy + 0.5 * SPREAD],
  ];
  const colors = [RED, BLUE, GOLD];
  const names = ['Red (A)', 'Blue (B)', 'Yellow (C)'];

  // Draw the base rings (kept as references so the updater can move them)
  const ovalEls = [];
  for (let i = 0; i < 3; i++) {
    const el = svg.ellipse(s, positions[i][0], positions[i][1], RX, RY, {
      stroke: colors[i],
      strokeWidth: 4,
      fill: 'none',
      transform: `rotate(${ROTS[i]}, ${positions[i][0]}, ${positions[i][1]})`,
    });
    el.style.transition = 'cx .12s linear, cy .12s linear';
    ovalEls.push(el);
  }

  // 2D keyframes per animation step mirror the 3D SEP -> MID -> LOCK moves:
  // each oval retreats from its locked center along its own approach axis
  // (the centroid -> ring-center direction), far enough at SEP that the
  // three rings are fully disjoint on screen.
  const finalC = positions.map((p) => [p[0], p[1]]);
  const APPROACH = [[0, -1], [-0.866, 0.5], [0.866, 0.5]];
  const alongApproach = (k, d) => [
    finalC[k][0] + APPROACH[k][0] * d,
    finalC[k][1] + APPROACH[k][1] * d,
  ];
  const sepC = [0, 1, 2].map((k) => alongApproach(k, 65));
  const midC = [0, 1, 2].map((k) => alongApproach(k, 30));
  const centerKeys = [sepC, midC, finalC, finalC];

  // Ring name labels sit inside the separated rings' openings; the updater
  // fades them out as the weave overlay (with its own labels) fades in.
  const nameGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  s.appendChild(nameGroup);
  const nameSpots = [
    [sepC[0][0], sepC[0][1] + 3],
    [sepC[1][0], sepC[1][1] + 4],
    [sepC[2][0], sepC[2][1] + 4],
  ];
  for (let i = 0; i < 3; i++) {
    nameGroup.appendChild(svg.text(s, nameSpots[i][0], nameSpots[i][1], names[i], {
      fontSize: 11, fill: colors[i], anchor: 'middle', fontWeight: 'bold',
    }));
  }

  // Motion arrows along each ring's approach axis (toggled by the updater):
  // tail well outside the locked ring, head just short of its outer edge
  // (the extent along the approach axis is RY — it is perpendicular to the
  // ring's long axis).
  const approachArrow = (k, color) => {
    const [tx, ty] = alongApproach(k, RY + 22);
    const [hx, hy] = alongApproach(k, RY + 4);
    return svg.motionArrow(s, tx, ty, hx, hy, { color, curvature: 0.25 });
  };
  const arrowRed = approachArrow(0, RED);
  const arrowBlue = approachArrow(1, BLUE);
  const arrowYellow = approachArrow(2, GOLD);

  // Hand icon beside the cluster
  svg.handIcon(s, cx + 135, cy - 10, { scale: 0.6, rotation: 0 });

  // Step badges in the left margin (highlighted per phase by the updater)
  const badge1 = svg.stepBadge(s, 55, 115, 1, 3);
  svg.actionLabel(s, 55, 128, 'Lay ovals flat');
  const badge2 = svg.stepBadge(s, 55, 175, 2, 3);
  svg.actionLabel(s, 55, 188, 'Overlap loosely');
  const badge3 = svg.stepBadge(s, 55, 235, 3, 3);
  svg.actionLabel(s, 55, 248, 'Weave all three');
  const badges = [badge1, badge2, badge3];

  // ---- Weave overlay: the six over/under crossings of the locked Borromean
  // diagram. Crossing senses are copied from
  // diagrams/puzzles/05-trinity-lock/target.svg — the cyclic pattern
  // A over B, B over C, C over A (Red over Blue, Blue over Yellow, Yellow
  // over Red), so no pair is linked yet all three hold together. Each
  // crossing follows the lib/svg.js idiom: a surface-stroke gap laid along
  // the over ring's tangent, then a short over-arc in the over ring's color.
  const TAU = Math.PI * 2;
  // Point on locked ring k at parameter t, and inside/outside test for it.
  const ringPoint = (k, t) => {
    const a = (ROTS[k] * Math.PI) / 180;
    const px = RX * Math.cos(t);
    const py = RY * Math.sin(t);
    return [
      finalC[k][0] + px * Math.cos(a) - py * Math.sin(a),
      finalC[k][1] + px * Math.sin(a) + py * Math.cos(a),
    ];
  };
  const ringSide = (k, p) => {
    const a = (ROTS[k] * Math.PI) / 180;
    const dx = p[0] - finalC[k][0];
    const dy = p[1] - finalC[k][1];
    const u = (dx * Math.cos(a) + dy * Math.sin(a)) / RX;
    const v = (-dx * Math.sin(a) + dy * Math.cos(a)) / RY;
    return u * u + v * v - 1; // <0 inside, >0 outside
  };
  // Parameters where ring `over` crosses ring `under` (sign-change bisection).
  const crossingParams = (over, under) => {
    const N = 360;
    const out = [];
    let prev = ringSide(under, ringPoint(over, 0));
    for (let i = 1; i <= N; i++) {
      const cur = ringSide(under, ringPoint(over, (TAU * i) / N));
      if ((prev < 0) !== (cur < 0)) {
        let lo = (TAU * (i - 1)) / N;
        let hi = (TAU * i) / N;
        for (let b = 0; b < 32; b++) {
          const mid = (lo + hi) / 2;
          if ((ringSide(under, ringPoint(over, mid)) < 0) === (prev < 0)) lo = mid;
          else hi = mid;
        }
        out.push((lo + hi) / 2);
      }
      prev = cur;
    }
    return out;
  };

  const weave = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  s.appendChild(weave);
  weave.style.opacity = '0';
  const weavePairs = [
    { over: 0, under: 1, caption: 'Red over Blue' },
    { over: 1, under: 2, caption: 'Blue over Yellow' },
    { over: 2, under: 0, caption: 'Yellow over Red' },
  ];
  for (const { over, under, caption } of weavePairs) {
    let far = null;
    let farD = -1;
    for (const t of crossingParams(over, under)) {
      const [x, y] = ringPoint(over, t);
      // Local tangent of the over ring: rotate the parametric derivative.
      const a = (ROTS[over] * Math.PI) / 180;
      const dx = -RX * Math.sin(t);
      const dy = RY * Math.cos(t);
      const tangent = Math.atan2(dx * Math.sin(a) + dy * Math.cos(a), dx * Math.cos(a) - dy * Math.sin(a));
      weave.appendChild(svg.crossingGap(s, x, y, tangent, 12));
      // Short over-arc (±11px along the ring) covering the gap.
      const dt = 11 / Math.hypot(dx, dy);
      let d = '';
      for (let j = 0; j <= 8; j++) {
        const [ax, ay] = ringPoint(over, t - dt + (j * dt) / 4);
        d += (j ? ' L' : 'M') + ax.toFixed(1) + ' ' + ay.toFixed(1);
      }
      weave.appendChild(svg.path(s, d, { stroke: colors[over], strokeWidth: 4, strokeLinecap: 'round' }));
      const dist = Math.hypot(x - cx, y - cy);
      if (dist > farD) {
        farD = dist;
        far = [x, y];
      }
    }
    // Caption the pair beside its outermost crossing, pushed away from the
    // cluster centroid so it sits in clear space.
    weave.appendChild(svg.text(s,
      far[0] + ((far[0] - cx) / farD) * 30,
      far[1] + ((far[1] - cy) / farD) * 30,
      caption, { fontSize: 9, fill: colors[over], anchor: 'middle', fontWeight: '600' }));
  }

  // Properties box
  const calloutRect = svg.rect(s, 30, 290, 440, 75, { fill: 'var(--dia-wash, #ece3d0)', stroke: RING, strokeWidth: 1, rx: 4 });
  calloutRect.classList.add('callout-box');
  svg.text(s, 250, 310, 'How it works:', {
    fontSize: 12, anchor: 'middle', fontWeight: 'bold', fill: RING,
  });
  svg.text(s, 250, 328, 'No two ovals are linked on their own — pull any pair apart easily', {
    fontSize: 10, anchor: 'middle', fill: RING,
  });
  svg.text(s, 250, 344, 'But all three woven together lock tight — each one traps the other two', {
    fontSize: 10, anchor: 'middle', fill: RING,
  });
  svg.text(s, 250, 358, 'Remove any one oval and the remaining two fall apart immediately', {
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

  // ---- Timeline updater: sync the 2D ovals + badges + arrows + weave to the
  // solution. Each oval starts spread outward (separated, per sepC above) and
  // converges to its locked Borromean center, mirroring the 3D position
  // keyframes (SEP -> MID -> LOCK). The weave overlay is drawn at the LOCKED
  // positions only, so it stays hidden until the weaving step and fades in
  // with it — gaps never float over the still-moving ovals.
  function setOval(i, c) {
    const el = ovalEls[i];
    if (!el) return;
    el.setAttribute('cx', c[0]);
    el.setAttribute('cy', c[1]);
    // keep the per-oval rotation pinned to the moving center
    el.setAttribute('transform', `rotate(${ROTS[i]}, ${c[0]}, ${c[1]})`);
  }

  return function update(state) {
    if (!state) return;
    const last = centerKeys.length - 1;
    const i = Math.max(0, Math.min(state.stepIndex | 0, last));
    const p = Math.max(0, Math.min(state.stepProgress ?? 0, 1));
    const fromKey = i === 0 ? sepC : centerKeys[i - 1];
    const toKey = centerKeys[i];
    for (let k = 0; k < 3; k++) {
      const a = fromKey[k];
      const b = toKey[k];
      setOval(k, [a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p]);
    }
    // Badge phase: step 0 -> badge1, step 1 -> badge2, steps 2&3 -> badge3.
    const phase = i <= 0 ? 0 : i <= 1 ? 1 : 2;
    badges.forEach((b, k) => svg.highlight(b, k === phase, { dim: 0.3, color: BLUE }));
    // Arrows only appear while the ovals are converging (steps 1 & 2).
    const arrowsActive = i === 1 || i === 2;
    svg.highlight(arrowRed, arrowsActive, { glow: false, dim: 0 });
    svg.highlight(arrowBlue, arrowsActive, { glow: false, dim: 0 });
    svg.highlight(arrowYellow, arrowsActive, { glow: false, dim: 0 });
    // Weave overlay: 0 before the weaving step, fades in with its (already
    // eased) progress, then stays fully on. Ring name labels trade places
    // with it so the locked cluster is captioned by the crossing labels.
    const w = i < 2 ? 0 : i === 2 ? p : 1;
    weave.style.opacity = String(w);
    nameGroup.style.opacity = String(1 - w);
  };
}

export function dispose() {}
