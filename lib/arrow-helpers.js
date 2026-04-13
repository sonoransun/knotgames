import * as THREE from 'three';

export function createMotionArrow(from, to, opts = {}) {
  const color = opts.color || 0x44cc44;
  const headLength = opts.headLength || 8;
  const headWidth = opts.headWidth || 4;

  const group = new THREE.Group();

  const dir = new THREE.Vector3(
    to[0] - from[0], to[1] - from[1], to[2] - from[2]
  );
  const length = dir.length();
  if (length < 0.01) return group;

  dir.normalize();
  const origin = new THREE.Vector3(from[0], from[1], from[2]);

  const arrow = new THREE.ArrowHelper(dir, origin, length, color, headLength, headWidth);
  arrow.traverse(child => {
    if (child.material) {
      child.material.transparent = true;
      child.material.opacity = 0.7;
      child.material.depthWrite = false;
    }
  });
  group.add(arrow);

  return group;
}

export function createCurvedArrow(points, opts = {}) {
  const color = opts.color || 0x44cc44;
  const group = new THREE.Group();

  const vectors = points.map(p => new THREE.Vector3(p[0], p[1], p[2]));
  const curve = new THREE.CatmullRomCurve3(vectors);
  const tubeGeo = new THREE.TubeGeometry(curve, 32, opts.radius || 0.8, 6, false);
  const tubeMat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: opts.opacity || 0.7,
    depthWrite: false,
  });
  group.add(new THREE.Mesh(tubeGeo, tubeMat));

  const endPoint = vectors[vectors.length - 1];
  const prevPoint = vectors[vectors.length - 2];
  const dir = new THREE.Vector3().subVectors(endPoint, prevPoint).normalize();

  const coneGeo = new THREE.ConeGeometry(opts.headWidth || 3, opts.headLength || 8, 8);
  const coneMat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: opts.opacity || 0.7,
    depthWrite: false,
  });
  const cone = new THREE.Mesh(coneGeo, coneMat);
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
