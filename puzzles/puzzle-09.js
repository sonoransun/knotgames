import * as THREE from 'three';
import { createMaterials } from '../lib/materials.js';
import { createRing, createBall } from '../lib/components.js';
import { CordPath } from '../lib/cord.js';
import * as svg from '../lib/svg.js';

export const metadata = {
  id: 9,
  name: 'Genus Trap',
  difficulty: 'Expert',
  principle: 'Genus-2 surface fundamental group',
  type: 'Disentanglement',
  description: 'A clear acrylic block with two non-intersecting tunnels. The cord path encodes the word aba\u207B\u00B9 in the fundamental group. Only algebraic cancellation frees the rings.',
  cameraPosition: [80, 60, 200],
};

const BLOCK_W = 120;
const BLOCK_H = 60;
const BLOCK_D = 80;
const TUNNEL_R = 7.5;

function createAcrylicBlock(mats) {
  const group = new THREE.Group();

  // Transparent block
  const blockGeo = new THREE.BoxGeometry(BLOCK_W, BLOCK_H, BLOCK_D);
  const block = new THREE.Mesh(blockGeo, mats.acrylic);
  block.position.y = BLOCK_H / 2;
  group.add(block);

  // Tunnel A (left-right, lower) - shown as dark cylinder
  const tunnelAGeo = new THREE.CylinderGeometry(TUNNEL_R, TUNNEL_R, BLOCK_W + 2, 16);
  const tunnelMat = new THREE.MeshStandardMaterial({
    color: 0x334455,
    transparent: true,
    opacity: 0.3,
  });
  const tunnelA = new THREE.Mesh(tunnelAGeo, tunnelMat);
  tunnelA.rotation.z = Math.PI / 2;
  tunnelA.position.set(0, 25, 0); // at height 25mm
  group.add(tunnelA);

  // Tunnel B (front-back, higher)
  const tunnelBGeo = new THREE.CylinderGeometry(TUNNEL_R, TUNNEL_R, BLOCK_D + 2, 16);
  const tunnelB = new THREE.Mesh(tunnelBGeo, tunnelMat.clone());
  tunnelB.material.color.set(0x553344);
  tunnelB.rotation.x = Math.PI / 2;
  tunnelB.position.set(0, 35, 0); // at height 35mm
  group.add(tunnelB);

  return group;
}

// Cord path: enter A left → exit A right → around → enter B front → exit B back → around → enter A right → exit A left
function initialCordPath() {
  const hw = BLOCK_W / 2;
  const hd = BLOCK_D / 2;
  return [
    [-hw - 30, 25, 0],          // ball stop (left)
    [-hw - 5, 25, 0],           // entering tunnel A
    [0, 25, 0],                 // through tunnel A
    [hw + 5, 25, 0],            // exiting tunnel A right
    [hw + 15, 30, -10],         // looping around outside
    [hw + 10, 35, -hd + 10],   // approaching front face
    [30, 35, -hd - 5],         // ring 1 here
    [0, 35, -hd - 5],          // entering tunnel B from front
    [0, 35, 0],                // through tunnel B
    [0, 35, hd + 5],           // exiting tunnel B back
    [-20, 32, hd + 15],        // looping around outside
    [-hw - 10, 30, hd - 10],   // ring 2 here
    [-hw - 15, 28, 5],         // approaching left face
    [-hw - 5, 25, 0],          // re-entering tunnel A from...
    [0, 25, 0],                // wait - actually enters from right
  ];
}

// Simplified initial path
function cordPathInitial() {
  const hw = BLOCK_W / 2 + 5;
  const hd = BLOCK_D / 2 + 5;
  return [
    [-hw - 25, 25, 0],        // left ball
    [-hw, 25, 0],              // tunnel A entrance (left)
    [hw, 25, 0],               // tunnel A exit (right)
    [hw + 15, 30, -15],        // outside loop
    [20, 35, -hd],             // toward front
    [0, 35, -hd],              // tunnel B entrance (front)
    [0, 35, hd],               // tunnel B exit (back)
    [-30, 32, hd + 10],        // outside loop
    [-hw - 10, 28, 10],        // toward left
    [-hw, 25, 0],              // tunnel A entrance (from right... re-enter)
    [hw, 25, 0],               // through A again
    [hw + 25, 25, 0],          // right ball
  ];
}

function cordPathSolved() {
  const hw = BLOCK_W / 2 + 5;
  return [
    [-hw - 25, 25, 0],
    [-hw, 25, 0],
    [0, 25, 0],
    [hw, 25, 0],
    [hw + 10, 25, 0],
    [hw + 15, 25, 0],
    [hw + 15, 25, 0],
    [hw + 10, 25, 0],
    [hw, 25, 0],
    [0, 25, 0],
    [-hw, 25, 0],
    [-hw - 25, 25, 0],
  ];
}

function cordPathMid() {
  const hw = BLOCK_W / 2 + 5;
  const hd = BLOCK_D / 2 + 5;
  return [
    [-hw - 25, 25, 0],
    [-hw, 25, 0],
    [hw, 25, 0],
    [hw + 15, 28, -10],
    [15, 32, -hd + 5],
    [0, 30, -hd + 10],
    [0, 28, hd - 15],
    [-25, 27, hd - 5],
    [-hw - 8, 26, 5],
    [-hw, 25, 0],
    [0, 25, 0],
    [-hw - 25, 25, 0],
  ];
}

export function create3DScene() {
  const mats = createMaterials();
  const group = new THREE.Group();

  group.add(createAcrylicBlock(mats));

  // Rings
  const ring1 = createRing(40, 4, mats.brass);
  ring1.position.set(25, 35, -BLOCK_D / 2 - 8);
  ring1.rotation.y = Math.PI / 2;
  group.add(ring1);

  const ring2 = createRing(40, 4, mats.brass);
  ring2.position.set(-BLOCK_W / 2 - 12, 30, BLOCK_D / 2 + 5);
  group.add(ring2);

  // Ball stops
  const ball1 = createBall(15, mats.wood);
  ball1.position.set(-BLOCK_W / 2 - 30, 25, 0);
  group.add(ball1);

  const ball2 = createBall(15, mats.wood);
  ball2.position.set(BLOCK_W / 2 + 30, 25, 0);
  group.add(ball2);

  // Cord
  const cord = new CordPath(cordPathInitial(), {
    radius: 2.5,
    material: mats.cord,
  });
  cord.addTo(group);

  return group;
}

export function createAnimScene() {
  const mats = createMaterials();
  const group = new THREE.Group();

  group.add(createAcrylicBlock(mats));

  const ring1 = createRing(40, 4, mats.brass);
  ring1.position.set(25, 35, -BLOCK_D / 2 - 8);
  ring1.rotation.y = Math.PI / 2;
  group.add(ring1);

  const ring2 = createRing(40, 4, mats.brass);
  ring2.position.set(-BLOCK_W / 2 - 12, 30, BLOCK_D / 2 + 5);
  group.add(ring2);

  const ball1 = createBall(15, mats.wood);
  ball1.position.set(-BLOCK_W / 2 - 30, 25, 0);
  group.add(ball1);

  const ball2 = createBall(15, mats.wood);
  ball2.position.set(BLOCK_W / 2 + 30, 25, 0);
  group.add(ball2);

  const cord = new CordPath(cordPathInitial(), {
    radius: 2.5,
    material: mats.cord,
  });
  cord.addTo(group);

  return { group, objects: { ring1, ring2, cord } };
}

export const animationSteps = [
  {
    label: 'Initial: cord path encodes word aba\u207B\u00B9 — rings are trapped',
    duration: 3.0,
    cord: cordPathInitial(),
    ring1: { position: [25, 35, -BLOCK_D / 2 - 8] },
    ring2: { position: [-BLOCK_W / 2 - 12, 30, BLOCK_D / 2 + 5] },
  },
  {
    label: 'Pull bight through Tunnel B and reroute through Tunnel A',
    duration: 3.5,
    cord: cordPathMid(),
    ring1: { position: [25, 35, -BLOCK_D / 2 - 8] },
    ring2: { position: [-BLOCK_W / 2 - 12, 30, BLOCK_D / 2 + 5] },
  },
  {
    label: 'Word becomes aa\u207B\u00B9 = identity. Rings slide free!',
    duration: 3.0,
    cord: cordPathSolved(),
    ring1: { position: [50, 10, -BLOCK_D / 2 - 30] },
    ring2: { position: [-BLOCK_W / 2 - 30, 10, BLOCK_D / 2 + 25] },
  },
];

export function updateAnimation(objects, state) {
  const { stepIndex, stepProgress } = state;
  const step = animationSteps[stepIndex];
  const prevStep = stepIndex > 0 ? animationSteps[stepIndex - 1] : animationSteps[0];

  if (step.cord && prevStep.cord) {
    const interpolated = CordPath.interpolatePoints(prevStep.cord, step.cord, stepProgress);
    objects.cord.update(interpolated);
  }

  for (const name of ['ring1', 'ring2']) {
    if (step[name] && prevStep[name]) {
      const f = prevStep[name].position;
      const t = step[name].position;
      objects[name].position.set(
        f[0] + (t[0] - f[0]) * stepProgress,
        f[1] + (t[1] - f[1]) * stepProgress,
        f[2] + (t[2] - f[2]) * stepProgress,
      );
    }
  }
}

export function createSVGDiagram(container) {
  const s = svg.createSVG(container, 500, 380);

  svg.text(s, 250, 25, 'Genus Trap — Cutaway View', {
    fontSize: 14, anchor: 'middle', fontWeight: 'bold',
  });

  // Block outline (3/4 view)
  const bx = 130, by = 60, bw = 240, bh = 140;
  svg.rect(s, bx, by, bw, bh, {
    fill: 'rgba(200, 220, 255, 0.3)',
    stroke: '#88aacc',
    strokeWidth: 2,
    rx: 3,
  });
  svg.text(s, bx + bw / 2, by + bh + 15, 'Clear acrylic block', {
    fontSize: 10, anchor: 'middle', fill: '#666',
  });

  // Tunnel A (horizontal line, lower)
  const taY = by + bh * 0.55;
  svg.line(s, bx - 10, taY, bx + bw + 10, taY, {
    stroke: '#334455', strokeWidth: 8, opacity: '0.3',
  });
  svg.line(s, bx, taY, bx + bw, taY, { stroke: '#334455', strokeWidth: 1, dashArray: '4,3' });
  svg.text(s, bx + bw + 15, taY + 4, 'Tunnel A', { fontSize: 9, fill: '#334455' });
  svg.text(s, bx + bw + 15, taY + 14, '(h=25mm)', { fontSize: 8, fill: '#888' });

  // Tunnel B (vertical line, higher - perpendicular, shown as circle in cutaway)
  const tbY = by + bh * 0.35;
  const tbX = bx + bw / 2;
  svg.circle(s, tbX, tbY, 10, { fill: 'rgba(85,51,68,0.2)', stroke: '#553344', strokeWidth: 1 });
  svg.text(s, tbX + 18, tbY + 4, 'Tunnel B', { fontSize: 9, fill: '#553344' });
  svg.text(s, tbX + 18, tbY + 14, '(h=35mm, perpendicular)', { fontSize: 8, fill: '#888' });

  // Cord path representation (animated segments)
  svg.animatedPath(s, `M ${bx - 30} ${taY} L ${bx} ${taY}`, {
    stroke: '#2255aa', strokeWidth: 2.5, fill: 'none',
    animDuration: 0.6, animDelay: 0,
  });
  svg.text(s, bx - 35, taY - 8, 'a', { fontSize: 14, fill: '#2255aa', fontWeight: 'bold' });

  svg.animatedPath(s, `M ${bx + bw} ${taY} Q ${bx + bw + 25} ${taY - 20} ${tbX + 30} ${tbY}`, {
    stroke: '#2255aa', strokeWidth: 2, fill: 'none', dashArray: '4,3',
    animDuration: 0.8, animDelay: 0.6,
  });

  // Through tunnel B
  svg.circle(s, tbX, tbY, 4, { fill: '#2255aa', stroke: 'none' });
  svg.text(s, tbX - 20, tbY - 15, 'b', { fontSize: 14, fill: '#2255aa', fontWeight: 'bold' });

  svg.animatedPath(s, `M ${tbX - 30} ${tbY} Q ${bx - 20} ${tbY + 20} ${bx} ${taY}`, {
    stroke: '#2255aa', strokeWidth: 2, fill: 'none', dashArray: '4,3',
    animDuration: 0.8, animDelay: 1.4,
  });

  svg.text(s, bx + bw + 30, taY - 8, 'a\u207B\u00B9', { fontSize: 14, fill: '#2255aa', fontWeight: 'bold' });

  // Ball stops
  svg.circle(s, bx - 30, taY, 8, { fill: '#c4956a', stroke: '#8b6914', strokeWidth: 1 });
  svg.circle(s, bx + bw + 45, taY, 8, { fill: '#c4956a', stroke: '#8b6914', strokeWidth: 1 });

  // Rings
  svg.ellipse(s, bx + bw + 15, taY - 25, 10, 8, { stroke: '#cc8800', strokeWidth: 2.5, fill: 'none' });
  svg.ellipse(s, bx - 15, tbY + 20, 10, 8, { stroke: '#cc8800', strokeWidth: 2.5, fill: 'none' });

  // Word annotation
  svg.rect(s, 50, 250, 400, 50, { fill: '#f5f5f5', stroke: '#ddd', strokeWidth: 1, rx: 4 });
  svg.text(s, 250, 270, 'Cord path = word aba\u207B\u00B9 in fundamental group F(a,b)', {
    fontSize: 11, anchor: 'middle', fontWeight: 'bold', fill: '#333',
  });
  svg.text(s, 250, 288, 'Solution: reroute to cancel b, giving aa\u207B\u00B9 = identity', {
    fontSize: 10, anchor: 'middle', fill: '#666',
  });

  // Key insight
  const calloutRect = svg.rect(s, 50, 315, 400, 30, { fill: '#e8f0fe', stroke: '#4a90d9', strokeWidth: 1, rx: 4 });
  svg.text(s, 250, 335, 'Key: Two non-intersecting tunnels create genus-2 topology', {
    fontSize: 10, anchor: 'middle', fill: '#2a5a8a',
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
}

export function dispose() {}
