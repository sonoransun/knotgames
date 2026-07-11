import * as THREE from 'three';
import { createMaterials } from '../lib/materials.js';
import { createRing, createBall } from '../lib/components.js';
import { CordPath } from '../lib/cord.js';
import { enableShadowsOnGroup } from '../lib/scene.js';
import { StepArrowManager } from '../lib/arrow-helpers.js';
import { resolveStep, applyStepTransforms, HighlightCache } from '../lib/puzzle-helpers.js';
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

// ---------------------------------------------------------------------------
// External cord keyframes (the "pattern" layer, md Setup #2: the arc between
// ports 2 and 3 where the outer ring sits). All frames share the SAME 9-point
// count — CordPath.interpolatePoints truncates silently on a mismatch.

// Rest pose: out of port 2, up through the outer ring's hole, back into port 3.
function threadedCord() {
  return [
    [TORUS_MAJOR_R + 17, 0, 0],     // emerging from port 2
    [TORUS_MAJOR_R + 21, 8, 6],
    [TORUS_MAJOR_R + 25, 15, 10],
    [TORUS_MAJOR_R + 28, 19, 5],
    [TORUS_MAJOR_R + 30, 20, 0],    // apex — threads the outer ring
    [TORUS_MAJOR_R + 28, 19, -5],
    [TORUS_MAJOR_R + 25, 15, -10],
    [TORUS_MAJOR_R + 21, 8, -8],
    [TORUS_MAJOR_R + 17, 0, -5],    // diving back into port 3
  ];
}

// A bight of slack pulled out through port 2 (ring still threaded).
function bightOutCord() {
  return [
    [TORUS_MAJOR_R + 17, 0, 0],
    [TORUS_MAJOR_R + 27, -6, 12],   // slack loop bulges out of port 2...
    [TORUS_MAJOR_R + 33, -2, 16],   // ...apex of the bight, clear of the shell
    [TORUS_MAJOR_R + 31, 12, 8],
    [TORUS_MAJOR_R + 30, 20, 0],    // still threaded through the ring
    [TORUS_MAJOR_R + 28, 19, -5],
    [TORUS_MAJOR_R + 25, 15, -10],
    [TORUS_MAJOR_R + 21, 8, -8],
    [TORUS_MAJOR_R + 17, 0, -5],
  ];
}

// The bight carried up and over the outer ring (over its body, not the hole).
function bightOverCord() {
  return [
    [TORUS_MAJOR_R + 17, 0, 0],
    [TORUS_MAJOR_R + 23, 10, 10],
    [TORUS_MAJOR_R + 29, 24, 12],
    [TORUS_MAJOR_R + 33, 30, 6],
    [TORUS_MAJOR_R + 35, 32, 0],    // arcs OVER the ring (ring plane is y=20)
    [TORUS_MAJOR_R + 33, 30, -6],
    [TORUS_MAJOR_R + 29, 24, -10],
    [TORUS_MAJOR_R + 23, 10, -9],
    [TORUS_MAJOR_R + 17, 0, -5],
  ];
}

// Fed back through port 3: the pattern is rerouted — a low arc hugging the
// shell that no longer passes through (or near) the outer ring.
function reroutedCord() {
  return [
    [TORUS_MAJOR_R + 17, 0, 0],
    [TORUS_MAJOR_R + 19, 4, 8],
    [TORUS_MAJOR_R + 21, 5, 13],
    [TORUS_MAJOR_R + 22, 3, 16],
    [TORUS_MAJOR_R + 23, 0, 17],
    [TORUS_MAJOR_R + 22, -3, 14],
    [TORUS_MAJOR_R + 21, -4, 10],
    [TORUS_MAJOR_R + 19, -2, 3],
    [TORUS_MAJOR_R + 17, 0, -5],
  ];
}

// Port markers where the external arc leaves/re-enters the shell. Per the
// reconciled md these are ports 2 and 3 (ports 1 and 4 feed the tunnel's far
// sections and are not modeled in this stylized view).
function createPortMarkers(material) {
  const group = new THREE.Group();
  const portGeo = new THREE.TorusGeometry(4, 1.5, 8, 16);

  // Port 2 — the cord exits the tunnel here
  const port2 = new THREE.Mesh(portGeo, material);
  port2.position.set(TORUS_MAJOR_R + TORUS_MINOR_R + 2, 0, 0);
  port2.rotation.y = Math.PI / 2;
  group.add(port2);

  // Port 3 — the cord re-enters the tunnel here
  const port3 = new THREE.Mesh(portGeo, material);
  port3.position.set(TORUS_MAJOR_R + TORUS_MINOR_R + 2, 0, -5);
  port3.rotation.y = Math.PI / 2;
  group.add(port3);

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
  const extCord = new CordPath(threadedCord(), {
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

  // Inner ring — trapped on the INTERNAL tunnel section between ports 3 and 4
  // (md Setup #3): the trefoil tunnel strands pass through it at the far side
  // of the shell.
  const innerRing = createRing(22, 3, mats.brass);
  innerRing.position.set(-(TORUS_MAJOR_R + 5), 0, 0);
  group.add(innerRing);

  // Outer ring — linked only to the external pattern arc (ports 2-3); freeable
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

  const extCord = new CordPath(threadedCord(), {
    radius: 2.5,
    material: mats.cord,
  });
  extCord.addTo(group);

  const ports = createPortMarkers(mats.yellow);
  group.add(ports);

  // Inner ring on the internal tunnel section (between ports 3 and 4)
  const innerRing = createRing(22, 3, mats.brass);
  innerRing.position.set(-(TORUS_MAJOR_R + 5), 0, 0);
  group.add(innerRing);

  const outerRing = createRing(30, 4, mats.brass);
  outerRing.position.set(TORUS_MAJOR_R + 30, 20, 0);
  outerRing.rotation.x = Math.PI / 2;
  group.add(outerRing);

  enableShadowsOnGroup(group);
  const arrowManager = new StepArrowManager(group);

  return { group, objects: { tunnelCord, extCord, outerRing, innerRing, arrowManager } };
}

// Direction arrows per step (red = companion layer, blue = pattern/cord moves,
// gold = identify the ring's arc, green = the freed ring sliding off).
const arrowConfigs = {
  1: { arrows: [
    { from: [-(TORUS_MAJOR_R + 7), 26, 6], to: [-(TORUS_MAJOR_R + 2), 10, 2], opts: { color: 0xcc4444 } },
    { from: [TORUS_MAJOR_R + 40, -8, 18], to: [TORUS_MAJOR_R + 27, 8, 10], opts: { color: 0x4488ff } },
  ]},
  2: { arrows: [
    { from: [TORUS_MAJOR_R + 40, 30, 12], to: [TORUS_MAJOR_R + 32, 22, 3], opts: { color: 0xffcc44 } },
  ]},
  3: { arrows: [
    { from: [TORUS_MAJOR_R + 18, 1, 2], to: [TORUS_MAJOR_R + 33, -4, 15], opts: { color: 0x4488ff } },
  ]},
  4: { arrows: [
    { from: [TORUS_MAJOR_R + 29, 22, 10], to: [TORUS_MAJOR_R + 35, 34, 0], opts: { color: 0x4488ff } },
  ]},
  5: { arrows: [
    { from: [TORUS_MAJOR_R + 25, 6, 14], to: [TORUS_MAJOR_R + 18, 0, -4], opts: { color: 0x4488ff } },
  ]},
  6: { arrows: [
    { from: [TORUS_MAJOR_R + 33, 24, 4], to: [TORUS_MAJOR_R + 52, 40, 22], opts: { color: 0x44cc44 } },
  ]},
};

const RING_REST = [TORUS_MAJOR_R + 30, 20, 0];

// Seven steps mirroring the md Solution: trace, identify, bight out through
// port 2, over the ring, back in through port 3, slide the ring off.
export const animationSteps = [
  {
    label: 'Look: a knot within a knot — two rings ride a two-layer satellite structure',
    duration: 3.0,
    extCord: threadedCord(),
    outerRingPos: RING_REST,
  },
  {
    label: 'Trace the path: red tunnel = internal companion, blue arc = external pattern',
    duration: 2.5,
    extCord: threadedCord(),
    outerRingPos: RING_REST,
  },
  {
    label: 'The outer ring sits on the external arc between ports 2 and 3',
    duration: 2.0,
    extCord: threadedCord(),
    outerRingPos: RING_REST,
  },
  {
    label: 'Pull a bight of the external cord out through port 2',
    duration: 2.5,
    easing: 'easeInOut',
    extCord: bightOutCord(),
    outerRingPos: RING_REST,
  },
  {
    label: 'Pass the bight up and over the outer ring',
    duration: 2.5,
    easing: 'easeInOut',
    extCord: bightOverCord(),
    outerRingPos: RING_REST,
  },
  {
    label: 'Feed the bight back through port 3 — the pattern is rerouted',
    duration: 2.5,
    easing: 'easeInOut',
    extCord: reroutedCord(),
    outerRingPos: RING_REST,
  },
  {
    label: 'Slide the outer ring off — the inner ring stays trapped by the companion knot',
    duration: 3.0,
    easing: 'easeOut',
    extCord: reroutedCord(),
    outerRingPos: [TORUS_MAJOR_R + 55, 42, 26],
  },
];

const stepSpec = {
  extCord: { target: 'extCord', kind: 'cordPoints' },
  outerRingPos: { target: 'outerRing', kind: 'position' },
};

const highlights = new HighlightCache();

export function updateAnimation(objects, state) {
  const { step, prevStep, t, stepIndex } = resolveStep(animationSteps, state, {
    arrowManager: objects.arrowManager,
    arrowConfigs,
  });

  applyStepTransforms(objects, prevStep, step, t, stepSpec);

  // Step 1 traces the two layers in turn: companion first, then pattern.
  // (t is already eased — used only as a halfway switch, not re-eased.)
  const tunnelOn = stepIndex === 1 && t < 0.5;
  const extOn = (stepIndex === 1 && t >= 0.5) || (stepIndex >= 2 && stepIndex <= 5);
  highlights.set(objects.tunnelCord.mesh, tunnelOn, 0xff6644, 0.35);
  highlights.set(objects.extCord.mesh, extOn, 0x4488ff, 0.3);
  // Ring spotlights: outer while identified / passed over / freed; inner at
  // the end — the lesson is that it stays behind.
  highlights.set(objects.outerRing, stepIndex === 2 || stepIndex === 4 || stepIndex === 6, 0xffcc44, 0.3);
  highlights.set(objects.innerRing, stepIndex === 6, 0xff6644, 0.35);
}

export function createSVGDiagram(container) {
  const s = svg.createSVG(container, 500, 420);

  const INK = 'var(--dia-ink, #24211a)';
  const FAINT = 'var(--dia-faint, #c9bda7)';
  const CORD = 'var(--dia-cord, #1f57c4)';
  const NEG = 'var(--dia-neg, #cf3a26)';
  const RING = 'var(--dia-ring, #b97d12)';
  const GOLD = 'var(--dia-gold, #c79a22)';
  const WASH = 'var(--dia-wash, #ece3d0)';

  svg.text(s, 250, 25, 'The Satellite Trap — JSJ Decomposition', {
    fontSize: 14, anchor: 'middle', fontWeight: 'bold',
  });

  // Torus (top view — two concentric ellipses)
  const cx = 220, cy = 170;
  svg.ellipse(s, cx, cy, 100, 55, { stroke: FAINT, strokeWidth: 2, fill: 'none' });
  svg.ellipse(s, cx, cy, 55, 30, { stroke: FAINT, strokeWidth: 1, fill: WASH, dashArray: '4,3' });

  // Internal tunnel (trefoil path, shown as red dashed) — the companion layer
  const tunnelEl = svg.path(s, `M ${cx + 80} ${cy} C ${cx + 90} ${cy - 40}, ${cx + 20} ${cy - 55}, ${cx} ${cy - 40} C ${cx - 30} ${cy - 25}, ${cx - 90} ${cy - 15}, ${cx - 80} ${cy} C ${cx - 90} ${cy + 15}, ${cx - 30} ${cy + 55}, ${cx} ${cy + 40} C ${cx + 20} ${cy + 25}, ${cx + 90} ${cy + 40}, ${cx + 80} ${cy}`, {
    stroke: NEG, strokeWidth: 2.5, fill: 'none', dashArray: '6,3',
  });
  svg.text(s, cx - 50, cy - 45, 'Companion', { fontSize: 9, fill: NEG, fontWeight: 'bold' });
  svg.text(s, cx - 50, cy - 33, '(trefoil tunnel)', { fontSize: 8, fill: NEG });

  // Ports 2 and 3 — the endpoints of the outer ring's external arc
  svg.circle(s, cx + 95, cy - 8, 5, { fill: GOLD, stroke: RING, strokeWidth: 1.5 });
  svg.circle(s, cx + 95, cy + 8, 5, { fill: GOLD, stroke: RING, strokeWidth: 1.5 });
  svg.text(s, cx + 110, cy - 8, 'P2', { fontSize: 8, fill: RING });
  svg.text(s, cx + 110, cy + 12, 'P3', { fontSize: 8, fill: RING });

  // External loop (pattern layer) — redrawn per step from loopFrames below.
  const P2 = [cx + 100, cy - 8];
  const P3 = [cx + 100, cy + 8];
  const loopD = (f) =>
    `M ${P2[0]} ${P2[1]} C ${f[0]} ${f[1]}, ${f[2]} ${f[3]}, ${f[4]} ${f[5]} ` +
    `C ${f[6]} ${f[7]}, ${f[8]} ${f[9]}, ${P3[0]} ${P3[1]}`;
  // Control frames [c1x,c1y, c2x,c2y, midx,midy, c3x,c3y, c4x,c4y] — one per
  // animation step (end pose of that step); frame 0 doubles as the rest pose.
  const restLoop = [cx + 130, cy - 25, cx + 150, cy - 10, cx + 140, cy, cx + 150, cy + 10, cx + 130, cy + 25];
  const reroutedLoop = [cx + 110, cy - 16, cx + 122, cy - 9, cx + 120, cy, cx + 122, cy + 9, cx + 110, cy + 16];
  const loopFrames = [
    restLoop,                                                                                            // 0 look
    restLoop,                                                                                            // 1 trace layers
    restLoop,                                                                                            // 2 identify arc
    [cx + 118, cy - 42, cx + 152, cy - 30, cx + 142, cy - 2, cx + 150, cy + 10, cx + 130, cy + 25],      // 3 bight out P2
    [cx + 126, cy - 36, cx + 168, cy - 22, cx + 164, cy + 2, cx + 156, cy + 14, cx + 130, cy + 25],      // 4 over the ring
    reroutedLoop,                                                                                        // 5 back in P3
    reroutedLoop,                                                                                        // 6 ring slides off
  ];
  const extLoop = svg.path(s, loopD(restLoop), { stroke: CORD, strokeWidth: 2.5, fill: 'none' });
  svg.text(s, cx + 150, cy - 20, 'Pattern', { fontSize: 9, fill: CORD, fontWeight: 'bold' });
  svg.text(s, cx + 150, cy - 8, '(external loop)', { fontSize: 8, fill: CORD });

  // Outer ring (around external cord) — animatable
  const outerRingEl = svg.ellipse(s, cx + 140, cy, 14, 10, { stroke: RING, strokeWidth: 2.5, fill: 'none' });
  outerRingEl.style.transition = 'cx .12s linear, cy .12s linear';
  svg.label(s, cx + 175, cy + 20, cx + 154, cy, 'Outer ring');

  // Inner ring (inside torus) — stays trapped
  const innerRingEl = svg.ellipse(s, cx - 70, cy, 10, 7, { stroke: RING, strokeWidth: 2.5, fill: 'none' });
  svg.label(s, cx - 115, cy - 15, cx - 80, cy, 'Inner ring');

  // Per-step motion arrows (revealed by the updater)
  const arrowBight = svg.motionArrow(s, cx + 102, cy - 12, cx + 124, cy - 38, { label: 'Bight out P2', curvature: 0.3 });
  const arrowOver = svg.motionArrow(s, cx + 138, cy - 22, cx + 166, cy - 2, { label: 'Over the ring', curvature: 0.4 });
  const arrowBack = svg.motionArrow(s, cx + 124, cy + 34, cx + 102, cy + 12, { label: 'Back in P3', curvature: 0.3 });
  const arrowExit = svg.motionArrow(s, cx + 150, cy - 8, cx + 178, cy - 30, { label: 'Ring slides off', curvature: 0.3 });

  // Hand icon near the ports
  svg.handIcon(s, cx + 120, cy + 20, { scale: 0.6, rotation: -10 });

  // Explanation
  svg.rect(s, 30, 250, 440, 60, { fill: WASH, stroke: FAINT, strokeWidth: 1, rx: 4 });
  svg.text(s, 250, 268, 'Two layers — solve each one separately:', {
    fontSize: 11, anchor: 'middle', fontWeight: 'bold', fill: INK,
  });
  svg.text(s, 250, 285, 'Inner tunnel (red dashed): a fixed knot that traps the inner ring', {
    fontSize: 9, anchor: 'middle', fill: NEG,
  });
  svg.text(s, 250, 299, 'Outer loop (blue): reroute it through ports 2 and 3 to free the outer ring', {
    fontSize: 9, anchor: 'middle', fill: CORD,
  });

  // Step badges (highlighted per phase by the updater)
  const badge1 = svg.stepBadge(s, 45, 325, 1, 3, { radius: 11 });
  svg.actionLabel(s, 130, 325, 'Trace the layers — spot which ring is on which');
  const badge2 = svg.stepBadge(s, 45, 350, 2, 3, { radius: 11 });
  svg.actionLabel(s, 130, 350, 'Bight out port 2, over the ring, back in port 3');
  const badge3 = svg.stepBadge(s, 45, 375, 3, 3, { radius: 11 });
  svg.actionLabel(s, 130, 375, 'Slide the outer ring off — the inner stays');
  const badges = [badge1, badge2, badge3];

  // Key insight
  svg.calloutBox(s, 30, 390, 440, 25, 'A knot inside a knot — solve each layer on its own to free the right ring!');

  // ---- Timeline updater: sync the 2D loop, rings, badges, and arrows to the
  // 7 animationSteps: 0 look / 1 trace layers / 2 identify arc / 3 bight out
  // P2 / 4 over the ring / 5 back in P3 / 6 slide the outer ring off.
  // Ring keyframes mirror the 3D motion: it holds on the pattern loop through
  // the reroute, then sweeps up-and-out to the right when freed.
  const ringFrames = [
    [cx + 140, cy],        // 0 rest pose
    [cx + 140, cy],
    [cx + 140, cy],
    [cx + 140, cy],
    [cx + 140, cy],
    [cx + 140, cy],
    [cx + 185, cy - 35],   // 6: freed — sweeps up and to the right
  ];
  return function update(state) {
    if (!state) return;
    const last = animationSteps.length - 1;
    const i = Math.max(0, Math.min(state.stepIndex | 0, last));
    const p = Math.max(0, Math.min(state.stepProgress ?? 0, 1));

    // Reshape the external loop and move the outer ring along their keyframes.
    extLoop.setAttribute('d', loopD(svg.lerpFrames(loopFrames, i, p)));
    const [rx, ry] = svg.lerpFrames(ringFrames, i, p);
    outerRingEl.setAttribute('cx', rx);
    outerRingEl.setAttribute('cy', ry);

    // Layer tracing (step 1 spotlights companion then pattern, in turn) and
    // lesson highlights (dim: 1 leaves inactive elements at full opacity).
    svg.highlight(tunnelEl, i === 1 && p < 0.5, { dim: 1, color: NEG });
    svg.highlight(extLoop, (i === 1 && p >= 0.5) || (i >= 2 && i <= 5), { dim: 1, color: CORD });
    svg.highlight(outerRingEl, i === 2 || i === 6, { dim: 1, color: RING });
    svg.highlight(innerRingEl, i === 6, { dim: 1, color: NEG });

    // Highlight the active phase badge, dim the rest.
    const phase = i <= 2 ? 0 : i <= 5 ? 1 : 2;
    badges.forEach((b, k) => {
      if (b) svg.highlight(b, k === phase, { dim: 0.3, color: CORD });
    });

    // Show only the motion arrow relevant to the current step.
    svg.highlight(arrowBight, i === 3, { glow: false, dim: 0 });
    svg.highlight(arrowOver, i === 4, { glow: false, dim: 0 });
    svg.highlight(arrowBack, i === 5, { glow: false, dim: 0 });
    svg.highlight(arrowExit, i === 6, { glow: false, dim: 0 });
  };
}

export function dispose() {
  highlights.dispose();
}
