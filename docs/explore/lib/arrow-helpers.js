import * as THREE from 'three';

// Lit, lightly-emissive material so motion arrows respond to scene light yet
// stay readable over any surface (they no longer look like flat 2D overlays).
function arrowMaterial(color, opacity = 0.85) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.45,
    metalness: 0.0,
    emissive: new THREE.Color(color),
    emissiveIntensity: 0.3,
    transparent: true,
    opacity,
    depthWrite: false,
  });
}

export function createMotionArrow(from, to, opts = {}) {
  const color = opts.color || 0x44cc44;
  const headLength = opts.headLength || 9;
  const headWidth = opts.headWidth || 4;

  const group = new THREE.Group();

  const dir = new THREE.Vector3(to[0] - from[0], to[1] - from[1], to[2] - from[2]);
  const length = dir.length();
  if (length < 0.01) return group;
  dir.normalize();

  const mat = arrowMaterial(color, opts.opacity || 0.85);
  const shaftLen = Math.max(length - headLength, 0.01);
  const shaftR = headWidth * 0.16;

  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(shaftR, shaftR, shaftLen, 16), mat);
  shaft.position.y = shaftLen / 2;
  const head = new THREE.Mesh(new THREE.ConeGeometry(headWidth * 0.5, headLength, 20), mat);
  head.position.y = shaftLen + headLength / 2;

  const arrow = new THREE.Group();
  arrow.add(shaft);
  arrow.add(head);
  // orient +Y → dir, place at origin
  arrow.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  arrow.position.set(from[0], from[1], from[2]);
  group.add(arrow);

  return group;
}

export function createCurvedArrow(points, opts = {}) {
  const color = opts.color || 0x44cc44;
  const group = new THREE.Group();

  const vectors = points.map(p => new THREE.Vector3(p[0], p[1], p[2]));
  const curve = new THREE.CatmullRomCurve3(vectors);
  const mat = arrowMaterial(color, opts.opacity || 0.85);
  const tubeGeo = new THREE.TubeGeometry(curve, 48, opts.radius || 0.9, 16, false);
  group.add(new THREE.Mesh(tubeGeo, mat));

  const endPoint = vectors[vectors.length - 1];
  const prevPoint = vectors[vectors.length - 2];
  const dir = new THREE.Vector3().subVectors(endPoint, prevPoint).normalize();

  const coneGeo = new THREE.ConeGeometry(opts.headWidth || 3, opts.headLength || 8, 20);
  const cone = new THREE.Mesh(coneGeo, mat);
  cone.position.copy(endPoint);

  const up = new THREE.Vector3(0, 1, 0);
  const quat = new THREE.Quaternion().setFromUnitVectors(up, dir);
  cone.quaternion.copy(quat);

  group.add(cone);
  return group;
}

export class StepArrowManager {
  constructor(parentGroup) {
    this.parent = parentGroup;
    this.currentArrows = [];
    this._lastStepIndex = -1;
  }

  showForStep(stepIndex, arrowConfigs) {
    if (stepIndex === this._lastStepIndex) return;
    this._lastStepIndex = stepIndex;
    this.clear();

    const config = arrowConfigs[stepIndex];
    if (!config || !config.arrows) return;

    for (const arrowDef of config.arrows) {
      let arrow;
      if (arrowDef.type === 'curved') {
        arrow = createCurvedArrow(arrowDef.points, arrowDef.opts);
      } else {
        arrow = createMotionArrow(arrowDef.from, arrowDef.to, arrowDef.opts);
      }
      this.parent.add(arrow);
      this.currentArrows.push(arrow);
    }
  }

  updateOpacity(progress) {
    const opacity = progress < 0.1 ? progress / 0.1
      : progress > 0.85 ? (1 - progress) / 0.15
      : 1.0;

    for (const arrow of this.currentArrows) {
      arrow.traverse(child => {
        if (child.material) {
          child.material.opacity = opacity * 0.7;
        }
      });
    }
  }

  clear() {
    for (const arrow of this.currentArrows) {
      this.parent.remove(arrow);
      arrow.traverse(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });
    }
    this.currentArrows = [];
  }

  dispose() {
    this.clear();
    this._lastStepIndex = -1;
  }
}
