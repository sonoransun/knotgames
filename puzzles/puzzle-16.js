import * as THREE from 'three';
import { createMaterials } from '../lib/materials.js';
import { createRod, createRing, createBall, createBlock } from '../lib/components.js';
import * as svg from '../lib/svg.js';

export const metadata = {
  id: 16,
  name: 'The Crossing Number',
  difficulty: 'Beginner-Intermediate',
  principle: 'Unknotting number (crossing changes)',
  type: 'Transformation',
  description: 'A figure-eight knot frame has 4 crossings controlled by flippable pins. Flip exactly one crossing to convert it to the unknot and free a trapped ring. The figure-eight has unknotting number 1 — but which crossing?',
  cameraPosition: [0, 60, 200],
};

const FIG8_SCALE = 40;
const ROD_R = 2;
const PIN_RADIUS = 1.5;
const PIN_HEIGHT = 15;

// Figure-eight knot parametric curve
function fig8Point(t, scale) {
  const x = (2 + Math.cos(2 * t)) * Math.cos(3 * t);
  const y = (2 + Math.cos(2 * t)) * Math.sin(3 * t);
  const z = Math.sin(4 * t);
  return [x * scale * 0.4, y * scale * 0.4, z * scale * 0.25];
}

function fig8Points(scale, segments = 80) {
  const pts = [];
  for (let i = 0; i <= segments; i++) {
    const t = (2 * Math.PI * i) / segments;
    pts.push(fig8Point(t, scale));
  }
  return pts;
}

// Crossing pin positions (approximate crossing locations on figure-eight)
const CROSSING_POSITIONS = [
  { pos: [0, FIG8_SCALE * 0.5, 0], label: 'A' },
  { pos: [FIG8_SCALE * 0.4, 0, 0], label: 'B' },
  { pos: [0, -FIG8_SCALE * 0.5, 0], label: 'C' },  // This is the one to flip
  { pos: [-FIG8_SCALE * 0.4, 0, 0], label: 'D' },
];

function createPin(pos, material, highlighted = false) {
  const group = new THREE.Group();
  const pinMat = highlighted
    ? new THREE.MeshStandardMaterial({ color: 0x33cc33, metalness: 0.7, roughness: 0.3 })
    : material;

  const pin = new THREE.Mesh(
    new THREE.CylinderGeometry(PIN_RADIUS, PIN_RADIUS, PIN_HEIGHT, 8),
    pinMat
  );
  pin.position.set(pos[0], pos[1], pos[2]);
  pin.rotation.x = Math.PI / 2;
  group.add(pin);

  // Pin cap
  const cap = createBall(5, pinMat);
  cap.position.set(pos[0], pos[1], pos[2] + PIN_HEIGHT / 2);
  group.add(cap);

  return group;
}

function createFig8Frame(material) {
  const pts = fig8Points(FIG8_SCALE);
  return createRod(pts, ROD_R, material, true);
}

export function create3DScene() {
  const mats = createMaterials();
  const group = new THREE.Group();

  // Base
  const base = createBlock(150, 8, 150, mats.wood);
  base.position.y = -FIG8_SCALE * 1.5;
  group.add(base);

  // Figure-eight knot frame
  const frame = createFig8Frame(mats.steel);
  group.add(frame);

  // Crossing pins
  for (const crossing of CROSSING_POSITIONS) {
    group.add(createPin(crossing.pos, mats.brass));
  }

  // Trapped ring
  const ring = createRing(25, 3, mats.brass);
  ring.position.set(0, 0, FIG8_SCALE * 0.3);
  group.add(ring);

  return group;
}

export function createAnimScene() {
  const mats = createMaterials();
  const group = new THREE.Group();

  const base = createBlock(150, 8, 150, mats.wood);
  base.position.y = -FIG8_SCALE * 1.5;
  group.add(base);

  const frame = createFig8Frame(mats.steel);
  group.add(frame);

  // Create pins with crossing C highlighted
  const pins = [];
  for (let i = 0; i < CROSSING_POSITIONS.length; i++) {
    const pin = createPin(CROSSING_POSITIONS[i].pos, mats.brass, i === 2);
    pins.push(pin);
    group.add(pin);
  }

  const ring = createRing(25, 3, mats.brass);
  ring.position.set(0, 0, FIG8_SCALE * 0.3);
  group.add(ring);

  return { group, objects: { ring, pinC: pins[2] } };
}

export const animationSteps = [
  {
    label: 'Figure-eight knot with 4 crossings — ring is trapped',
    duration: 2.0,
    ringPos: [0, 0, FIG8_SCALE * 0.3],
    pinFlipped: false,
  },
  {
    label: 'Identify crossing C (highlighted green) — the unknotting crossing',
    duration: 2.0,
    ringPos: [0, 0, FIG8_SCALE * 0.3],
    pinFlipped: false,
  },
  {
    label: 'Flip crossing C: swap over/under — figure-eight becomes the unknot!',
    duration: 2.5,
    ringPos: [0, 0, FIG8_SCALE * 0.3],
    pinFlipped: true,
  },
  {
    label: 'Ring slides free — unknotting number of the figure-eight is 1',
    duration: 2.5,
    ringPos: [FIG8_SCALE * 1.5, -FIG8_SCALE, FIG8_SCALE],
    pinFlipped: true,
  },
];

export function updateAnimation(objects, state) {
  const { stepIndex, stepProgress } = state;
  const step = animationSteps[stepIndex];
  const prevStep = stepIndex > 0 ? animationSteps[stepIndex - 1] : animationSteps[0];

  // Animate pin flip (rotate 180 degrees)
  if (step.pinFlipped && !prevStep.pinFlipped) {
    objects.pinC.rotation.x = stepProgress * Math.PI;
  } else if (step.pinFlipped) {
    objects.pinC.rotation.x = Math.PI;
  }

  // Interpolate ring position
  const f = prevStep.ringPos;
  const t = step.ringPos;
  objects.ring.position.set(
    f[0] + (t[0] - f[0]) * stepProgress,
    f[1] + (t[1] - f[1]) * stepProgress,
    f[2] + (t[2] - f[2]) * stepProgress,
  );
}

export function createSVGDiagram(container) {
  const s = svg.createSVG(container, 500, 400);

  svg.text(s, 250, 25, 'The Crossing Number — Figure-Eight Knot', {
    fontSize: 14, anchor: 'middle', fontWeight: 'bold',
  });

  const cx = 250, cy = 160;

  // Figure-eight knot diagram (simplified 2D projection)
  // Top loop
  svg.path(s, `M ${cx} ${cy - 30} C ${cx + 50} ${cy - 60}, ${cx + 60} ${cy - 10}, ${cx + 20} ${cy + 10}`, {
    stroke: '#888', strokeWidth: 3, fill: 'none',
  });
  // Bottom loop
  svg.path(s, `M ${cx} ${cy + 30} C ${cx - 50} ${cy + 60}, ${cx - 60} ${cy + 10}, ${cx - 20} ${cy - 10}`, {
    stroke: '#888', strokeWidth: 3, fill: 'none',
  });
  // Connecting strands
  svg.path(s, `M ${cx + 20} ${cy + 10} C ${cx + 10} ${cy + 20}, ${cx - 10} ${cy + 20}, ${cx - 20} ${cy + 10}`, {
    stroke: '#888', strokeWidth: 3, fill: 'none',
  });
  svg.path(s, `M ${cx - 20} ${cy - 10} C ${cx - 10} ${cy - 20}, ${cx + 10} ${cy - 20}, ${cx + 20} ${cy - 10}`, {
    stroke: '#888', strokeWidth: 3, fill: 'none',
  });

  // Crossing pins (labeled A, B, C, D)
  const crossSVG = [
    { x: cx, y: cy - 30, label: 'A' },
    { x: cx + 25, y: cy, label: 'B' },
    { x: cx, y: cy + 30, label: 'C', highlight: true },
    { x: cx - 25, y: cy, label: 'D' },
  ];

  for (const c of crossSVG) {
    const color = c.highlight ? '#33cc33' : '#cc8800';
    svg.circle(s, c.x, c.y, 8, {
      fill: c.highlight ? '#ccffcc' : '#fff',
      stroke: color, strokeWidth: 2,
    });
    svg.text(s, c.x, c.y + 1, c.label, {
      fontSize: 10, anchor: 'middle', fill: color, fontWeight: 'bold',
      dominantBaseline: 'central',
    });
  }

  // Ring
  svg.ellipse(s, cx + 40, cy, 15, 12, { stroke: '#cc8800', strokeWidth: 2.5, fill: 'none' });
  svg.label(s, cx + 80, cy - 15, cx + 55, cy, 'Ring');

  // Unknotting number explanation
  svg.rect(s, 40, 240, 420, 70, { fill: '#f5f5f5', stroke: '#ddd', strokeWidth: 1, rx: 4 });
  svg.text(s, 250, 258, 'Unknotting Number:', { fontSize: 11, anchor: 'middle', fontWeight: 'bold', fill: '#333' });
  svg.text(s, 250, 274, 'Minimum crossing changes to convert to the unknot', {
    fontSize: 10, anchor: 'middle', fill: '#666',
  });
  svg.text(s, 250, 292, 'Figure-eight knot: unknotting number = 1 (flip crossing C)', {
    fontSize: 10, anchor: 'middle', fill: '#33cc33', fontWeight: 'bold',
  });
  svg.text(s, 250, 306, 'Trefoil knot: unknotting number = 1    Unknot: unknotting number = 0', {
    fontSize: 9, anchor: 'middle', fill: '#888',
  });

  // Trial results
  svg.rect(s, 70, 320, 360, 40, { fill: '#fff', stroke: '#ddd', strokeWidth: 1, rx: 3 });
  svg.text(s, 250, 335, 'Flip A \u2192 trefoil \u2717   Flip B \u2192 5_1 knot \u2717   Flip C \u2192 unknot \u2713   Flip D \u2192 trefoil \u2717', {
    fontSize: 9, anchor: 'middle', fill: '#555',
  });
  svg.text(s, 250, 350, 'Only one crossing change works!', {
    fontSize: 9, anchor: 'middle', fill: '#33cc33', fontWeight: 'bold',
  });

  // Key insight
  const calloutRect = svg.rect(s, 30, 370, 440, 25, { fill: '#e8f0fe', stroke: '#4a90d9', strokeWidth: 1, rx: 4 });
  calloutRect.classList.add('callout-box');
  svg.text(s, 250, 387, 'Key: Unknotting number measures a knot\'s intrinsic distance from the unknot', {
    fontSize: 10, anchor: 'middle', fill: '#2a5a8a',
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
