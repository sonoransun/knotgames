import * as THREE from 'three';

export class CordPath {
  constructor(controlPoints, options = {}) {
    this.radius = options.radius || 2.5;
    this.closed = options.closed || false;
    this.material = options.material;
    this.radialSegments = options.radialSegments || 8;

    this.points = controlPoints.map(p =>
      p instanceof THREE.Vector3 ? p.clone() : new THREE.Vector3(p[0], p[1], p[2])
    );

    this._buildMesh();
  }

  _buildMesh() {
    const curve = new THREE.CatmullRomCurve3(this.points, this.closed, 'centripetal');
    const tubularSegments = Math.max(this.points.length * 10, 48);
    const geometry = new THREE.TubeGeometry(
      curve,
      tubularSegments,
      this.radius,
      this.radialSegments,
      this.closed
    );

    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.mesh.geometry = geometry;
    } else {
      this.mesh = new THREE.Mesh(geometry, this.material);
    }
  }

  // Update cord to new control points
  update(newControlPoints) {
    this.points = newControlPoints.map(p =>
      p instanceof THREE.Vector3 ? p.clone() : new THREE.Vector3(p[0], p[1], p[2])
    );
    this._buildMesh();
  }

  // Interpolate between two sets of control points
  static interpolatePoints(fromPoints, toPoints, t) {
    // Both arrays must have the same length
    const result = [];
    const len = Math.min(fromPoints.length, toPoints.length);
    for (let i = 0; i < len; i++) {
      const f = fromPoints[i];
      const to = toPoints[i];
      const fx = f instanceof THREE.Vector3 ? f.x : f[0];
      const fy = f instanceof THREE.Vector3 ? f.y : f[1];
      const fz = f instanceof THREE.Vector3 ? f.z : f[2];
      const tx = to instanceof THREE.Vector3 ? to.x : to[0];
      const ty = to instanceof THREE.Vector3 ? to.y : to[1];
      const tz = to instanceof THREE.Vector3 ? to.z : to[2];
      result.push([
        fx + (tx - fx) * t,
        fy + (ty - fy) * t,
        fz + (tz - fz) * t,
      ]);
    }
    return result;
  }

  // Add the mesh to a scene/group
  addTo(parent) {
    parent.add(this.mesh);
    return this;
  }

  dispose() {
    if (this.mesh) {
      this.mesh.geometry.dispose();
    }
  }
}

// Helper: generate a catenary (hanging cord) between two anchor points
export function catenaryPoints(from, to, sag = 20, numPoints = 12) {
  const points = [];
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const x = from[0] + (to[0] - from[0]) * t;
    const y = from[1] + (to[1] - from[1]) * t - sag * 4 * t * (1 - t);
    const z = from[2] + (to[2] - from[2]) * t;
    points.push([x, y, z]);
  }
  return points;
}
