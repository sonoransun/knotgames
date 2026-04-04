import * as THREE from 'three';
import { createMaterials } from '../lib/materials.js';
import { createStraightRod } from '../lib/components.js';
import { CordPath } from '../lib/cord.js';
import * as svg from '../lib/svg.js';

export const metadata = {
  id: 8,
  name: 'Ouroboros Chain',
  difficulty: 'Advanced',
  principle: 'Gray code / binary recursion (Chinese Rings)',
  type: 'Sequential disentanglement',
  description: 'Six interlocked cord loops on a shuttle bar. Removal requires exactly 42 moves in a precise Gray code sequence. No shortcuts exist.',
  cameraPosition: [0, 100, 250],
};

const NUM_LOOPS = 6;
const POST_SPACING = 30;
const POST_HEIGHT = 80;
const POST_R = 5;
const BASE_W = 220;
const BASE_H = 20;
const BASE_D = 50;

function createBase(mats) {
  const group = new THREE.Group();

  // Wooden base
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(BASE_W, BASE_H, BASE_D),
    mats.wood
  );
  base.position.y = -BASE_H / 2;
  group.add(base);

  // Posts
  for (let i = 0; i < NUM_LOOPS; i++) {
    const x = (i - (NUM_LOOPS - 1) / 2) * POST_SPACING;
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(POST_R, POST_R, POST_HEIGHT, 12),
      mats.darkWood
    );
    post.position.set(x, POST_HEIGHT / 2, 0);
    group.add(post);
  }

  // Shuttle bar
  const barLen = BASE_W - 20;
  const bar = createStraightRod([-barLen / 2, 15, BASE_D / 2 - 5], [barLen / 2, 15, BASE_D / 2 - 5], 1.5, mats.steel);
  group.add(bar);

  return group;
}

// Create loop paths for each of the 6 loops (all ON shuttle bar)
function createLoopPaths(loopStates) {
  const paths = [];
  const barZ = BASE_D / 2 - 5;
  const barY = 15;

  for (let i = 0; i < NUM_LOOPS; i++) {
    const x = (i - (NUM_LOOPS - 1) / 2) * POST_SPACING;
    const onBar = loopStates ? loopStates[i] : true;

    if (onBar) {
      paths.push([
        [x, POST_HEIGHT * 0.7, 0],
        [x - 8, POST_HEIGHT * 0.4, barZ * 0.5],
        [x - 5, barY + 5, barZ - 3],
        [x, barY, barZ],               // on shuttle bar
        [x + 5, barY + 5, barZ - 3],
        [x + 8, POST_HEIGHT * 0.4, barZ * 0.5],
        [x, POST_HEIGHT * 0.7, 0],
      ]);
    } else {
      // Off bar: loop hangs from post, not touching bar
      paths.push([
        [x, POST_HEIGHT * 0.7, 0],
        [x - 10, POST_HEIGHT * 0.5, 8],
        [x - 8, POST_HEIGHT * 0.2, 15],
        [x, barY - 10, 18],
        [x + 8, POST_HEIGHT * 0.2, 15],
        [x + 10, POST_HEIGHT * 0.5, 8],
        [x, POST_HEIGHT * 0.7, 0],
      ]);
    }
  }
  return paths;
}

export function create3DScene() {
  const mats = createMaterials();
  const group = new THREE.Group();

  group.add(createBase(mats));

  // All loops ON
  const loopPaths = createLoopPaths(null);
  const cordColors = [mats.cord, mats.cordRed, mats.cord, mats.cordRed, mats.cord, mats.cordRed];

  for (let i = 0; i < NUM_LOOPS; i++) {
    const cord = new CordPath(loopPaths[i], {
      radius: 2,
      material: cordColors[i],
      closed: true,
    });
    cord.addTo(group);
  }

  return group;
}

export function createAnimScene() {
  const mats = createMaterials();
  const group = new THREE.Group();

  group.add(createBase(mats));

  const loopPaths = createLoopPaths(null);
  const cordColors = [mats.cord, mats.cordRed, mats.cord, mats.cordRed, mats.cord, mats.cordRed];
  const cords = [];

  for (let i = 0; i < NUM_LOOPS; i++) {
    const cord = new CordPath(loopPaths[i], {
      radius: 2,
      material: cordColors[i],
      closed: true,
    });
    cord.addTo(group);
    cords.push(cord);
  }

  return { group, objects: { cords } };
}

// Generate first 8 moves of the Gray code sequence for animation
function generateFirstMoves() {
  // Simplified: show the pattern with the first few moves
  const states = [
    [true, true, true, true, true, true],     // initial
    [true, true, true, true, true, false],     // remove loop 6
    [true, true, true, true, false, false],    // remove loop 5
    [true, true, true, true, false, true],     // replace loop 6
    [true, true, true, false, false, true],    // remove loop 4
    [true, true, true, false, false, false],   // remove loop 6
    [true, true, false, false, false, false],  // remove loop 3
    [true, true, false, false, false, true],   // replace loop 6
    [false, false, false, false, false, false], // final: all off
  ];
  return states;
}

const states = generateFirstMoves();

export const animationSteps = states.map((state, i) => {
  const labels = [
    'Initial: all 6 loops on the shuttle bar',
    'Move 1: Remove loop 6 (rightmost)',
    'Move 2: Remove loop 5',
    'Move 3: Replace loop 6 (must go backward!)',
    'Move 4: Remove loop 4',
    'Move 5: Remove loop 6 again',
    'Move 6: Remove loop 3',
    'Move 7: Replace loop 6 (recursive pattern continues...)',
    '...42 moves later: all loops removed! Shuttle bar is free.',
  ];
  return {
    label: labels[i] || `State ${i}`,
    duration: i === 0 ? 2.0 : (i === states.length - 1 ? 3.0 : 1.8),
    loopStates: state,
  };
});

export function updateAnimation(objects, state) {
  const { stepIndex, stepProgress } = state;
  const step = animationSteps[stepIndex];
  const prevStep = stepIndex > 0 ? animationSteps[stepIndex - 1] : animationSteps[0];

  const fromPaths = createLoopPaths(prevStep.loopStates);
  const toPaths = createLoopPaths(step.loopStates);

  for (let i = 0; i < NUM_LOOPS; i++) {
    const interpolated = CordPath.interpolatePoints(fromPaths[i], toPaths[i], stepProgress);
    objects.cords[i].update(interpolated);
  }
}

export function createSVGDiagram(container) {
  const s = svg.createSVG(container, 500, 390);

  svg.text(s, 250, 25, 'Ouroboros Chain — Top View', {
    fontSize: 14, anchor: 'middle', fontWeight: 'bold',
  });

  // Base (top-down view)
  svg.rect(s, 70, 80, 360, 80, { fill: '#deb887', stroke: '#8b6914', strokeWidth: 2, rx: 4 });

  // Posts (circles from top)
  const postY = 120;
  for (let i = 0; i < 6; i++) {
    const x = 110 + i * 56;
    svg.circle(s, x, postY, 8, { fill: '#8b6914', stroke: '#6b4f12', strokeWidth: 1.5 });
    svg.text(s, x, postY + 3, String(i + 1), { fontSize: 9, anchor: 'middle', fill: 'white', fontWeight: 'bold' });
  }

  // Shuttle bar
  svg.line(s, 85, 145, 415, 145, { stroke: '#999', strokeWidth: 3 });
  svg.text(s, 250, 142, 'shuttle bar', { fontSize: 9, anchor: 'middle', fill: '#666' });

  // Loops (arcs from post to bar)
  const loopColors = ['#2255aa', '#cc3333', '#2255aa', '#cc3333', '#2255aa', '#cc3333'];
  for (let i = 0; i < 6; i++) {
    const x = 110 + i * 56;
    svg.path(s, `M ${x - 6} ${postY + 8} Q ${x - 15} ${postY + 25} ${x} ${postY + 30} Q ${x + 15} ${postY + 25} ${x + 6} ${postY + 8}`, {
      stroke: loopColors[i], strokeWidth: 2, fill: 'none',
    });
  }

  // Chain dependency arrows
  svg.text(s, 250, 195, 'Each loop threads through its left neighbor:', {
    fontSize: 11, anchor: 'middle', fill: '#333',
  });

  for (let i = 1; i < 6; i++) {
    const x1 = 110 + i * 56;
    const x0 = 110 + (i - 1) * 56;
    svg.path(s, `M ${x1} 210 L ${x0 + 10} 210`, {
      stroke: '#999', strokeWidth: 1,
    });
    svg.text(s, (x0 + x1) / 2, 208, '\u2192', { fontSize: 14, anchor: 'middle', fill: '#999' });
  }

  // State table
  svg.rect(s, 50, 235, 400, 90, { fill: '#f5f5f5', stroke: '#ddd', strokeWidth: 1, rx: 4 });
  svg.text(s, 250, 255, 'Gray Code Sequence (first 4 of 42 moves):', {
    fontSize: 11, anchor: 'middle', fontWeight: 'bold',
  });

  const rows = [
    ['Start:', '1 1 1 1 1 1'],
    ['Move 1:', '1 1 1 1 1 0  (remove #6)'],
    ['Move 2:', '1 1 1 1 0 0  (remove #5)'],
    ['Move 3:', '1 1 1 1 0 1  (replace #6!)'],
  ];
  rows.forEach((row, i) => {
    svg.text(s, 120, 275 + i * 14, row[0], { fontSize: 9, fill: '#666' });
    svg.text(s, 180, 275 + i * 14, row[1], { fontSize: 9, fill: '#333', fontFamily: 'monospace' });
  });

  // Key insight
  const calloutRect = svg.rect(s, 50, 340, 400, 30, { fill: '#e8f0fe', stroke: '#4a90d9', strokeWidth: 1, rx: 4 });
  svg.text(s, 250, 360, 'Key: Removal order follows a binary Gray code — no shortcuts exist', {
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
