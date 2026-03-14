import * as THREE from 'three';

// Create a rod (tube) along a 3D path
export function createRod(points, radius = 2, material, closed = false) {
  const vectors = points.map(p => new THREE.Vector3(p[0], p[1], p[2]));
  const curve = new THREE.CatmullRomCurve3(vectors, closed, 'centripetal');
  const segments = Math.max(vectors.length * 12, 64);
  const geometry = new THREE.TubeGeometry(curve, segments, radius, 12, closed);
  const mesh = new THREE.Mesh(geometry, material);
  return mesh;
}

// Create a straight rod between two points
export function createStraightRod(from, to, radius = 2, material) {
  const dir = new THREE.Vector3(
    to[0] - from[0],
    to[1] - from[1],
    to[2] - from[2]
  );
  const length = dir.length();
  const geometry = new THREE.CylinderGeometry(radius, radius, length, 12);
  const mesh = new THREE.Mesh(geometry, material);

  // Position at midpoint
  mesh.position.set(
    (from[0] + to[0]) / 2,
    (from[1] + to[1]) / 2,
    (from[2] + to[2]) / 2
  );

  // Orient along direction
  dir.normalize();
  const up = new THREE.Vector3(0, 1, 0);
  const quat = new THREE.Quaternion().setFromUnitVectors(up, dir);
  mesh.quaternion.copy(quat);

  return mesh;
}

// Create a U-shaped bar (semicircular bend at bottom with two vertical arms)
export function createUBar(width, height, bendRadius, rodRadius = 2, material) {
  const halfW = width / 2;
  const points = [];
  const numBendPts = 16;

  // Left arm (top to bottom)
  points.push([-halfW, height, 0]);
  points.push([-halfW, bendRadius, 0]);

  // Semicircular bend at bottom
  for (let i = 0; i <= numBendPts; i++) {
    const angle = Math.PI + (Math.PI * i) / numBendPts; // PI to 2PI (left to right)
    const x = Math.cos(angle) * bendRadius;
    const y = Math.sin(angle) * bendRadius + bendRadius;
    points.push([x, y, 0]);
  }

  // Right arm (bottom to top)
  points.push([halfW, bendRadius, 0]);
  points.push([halfW, height, 0]);

  return createRod(points, rodRadius, material);
}

// Create a torus (ring)
export function createRing(outerDiameter, wireThickness = 4, material) {
  const centerRadius = (outerDiameter - wireThickness) / 2;
  const tubeRadius = wireThickness / 2;
  const geometry = new THREE.TorusGeometry(centerRadius, tubeRadius, 24, 48);
  const mesh = new THREE.Mesh(geometry, material);
  return mesh;
}

// Create a sphere (ball)
export function createBall(diameter, material) {
  const geometry = new THREE.SphereGeometry(diameter / 2, 32, 32);
  const mesh = new THREE.Mesh(geometry, material);
  return mesh;
}

// Create a rectangular frame with optional crossbar
export function createFrame(width, height, rodRadius = 2, material, crossbarHeight = null) {
  const group = new THREE.Group();
  const hw = width / 2;
  const hh = height / 2;

  // Four sides
  group.add(createStraightRod([-hw, -hh, 0], [-hw, hh, 0], rodRadius, material)); // left
  group.add(createStraightRod([hw, -hh, 0], [hw, hh, 0], rodRadius, material));   // right
  group.add(createStraightRod([-hw, hh, 0], [hw, hh, 0], rodRadius, material));   // top
  group.add(createStraightRod([-hw, -hh, 0], [hw, -hh, 0], rodRadius, material)); // bottom

  // Optional crossbar
  if (crossbarHeight !== null) {
    group.add(createStraightRod([-hw, crossbarHeight, 0], [hw, crossbarHeight, 0], rodRadius, material));
  }

  return group;
}

// Create a cylindrical post
export function createPost(diameter, height, material) {
  const geometry = new THREE.CylinderGeometry(diameter / 2, diameter / 2, height, 24);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = height / 2;
  return mesh;
}

// Create a block (box)
export function createBlock(width, height, depth, material) {
  const geometry = new THREE.BoxGeometry(width, height, depth);
  const mesh = new THREE.Mesh(geometry, material);
  return mesh;
}

// Create a circular hoop (great circle)
export function createHoop(diameter, rodRadius = 2, material, segments = 64) {
  const radius = diameter / 2;
  const points = [];
  for (let i = 0; i <= segments; i++) {
    const angle = (2 * Math.PI * i) / segments;
    points.push([
      Math.cos(angle) * radius,
      Math.sin(angle) * radius,
      0
    ]);
  }
  return createRod(points, rodRadius, material, true);
}
