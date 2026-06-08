import * as THREE from 'three';

export function createMaterials() {
  // Polished metals: MeshPhysical + a subtle clearcoat reads as real machined
  // steel/brass under the RoomEnvironment IBL. Cord is roughened so it looks
  // like braided rope, not plastic. envMapIntensity tuned per material.
  return {
    steel: new THREE.MeshPhysicalMaterial({
      color: 0x9a9ea3,
      metalness: 0.9,
      roughness: 0.28,
      clearcoat: 0.3,
      clearcoatRoughness: 0.18,
      envMapIntensity: 1.15,
    }),
    brass: new THREE.MeshPhysicalMaterial({
      color: 0xc8a13c,
      metalness: 0.9,
      roughness: 0.3,
      clearcoat: 0.3,
      clearcoatRoughness: 0.2,
      envMapIntensity: 1.15,
    }),
    wood: new THREE.MeshStandardMaterial({
      color: 0xc4956a,
      metalness: 0.0,
      roughness: 0.72,
      envMapIntensity: 0.45,
    }),
    darkWood: new THREE.MeshStandardMaterial({
      color: 0x8b6914,
      metalness: 0.0,
      roughness: 0.72,
      envMapIntensity: 0.45,
    }),
    cord: new THREE.MeshStandardMaterial({
      color: 0x2255aa,
      metalness: 0.0,
      roughness: 0.85,
      envMapIntensity: 0.5,
    }),
    cordRed: new THREE.MeshStandardMaterial({
      color: 0xcc3333,
      metalness: 0.0,
      roughness: 0.85,
      envMapIntensity: 0.5,
    }),
    leather: new THREE.MeshStandardMaterial({
      color: 0x8b5a2b,
      metalness: 0.0,
      roughness: 0.82,
      envMapIntensity: 0.4,
      side: THREE.DoubleSide,
    }),
    acrylic: new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.92,
      roughness: 0.05,
      ior: 1.49,
      thickness: 60,
      clearcoat: 0.4,
      clearcoatRoughness: 0.1,
    }),
    red: new THREE.MeshPhysicalMaterial({
      color: 0xdd3333,
      metalness: 0.55,
      roughness: 0.3,
      clearcoat: 0.4,
      clearcoatRoughness: 0.15,
      envMapIntensity: 1.0,
    }),
    blue: new THREE.MeshPhysicalMaterial({
      color: 0x3333dd,
      metalness: 0.55,
      roughness: 0.3,
      clearcoat: 0.4,
      clearcoatRoughness: 0.15,
      envMapIntensity: 1.0,
    }),
    yellow: new THREE.MeshPhysicalMaterial({
      color: 0xddcc33,
      metalness: 0.55,
      roughness: 0.3,
      clearcoat: 0.4,
      clearcoatRoughness: 0.15,
      envMapIntensity: 1.0,
    }),
  };
}

export function createHighlightMaterial(baseMaterial, color = 0x44aaff, intensity = 0.4) {
  const mat = baseMaterial.clone();
  mat.emissive = new THREE.Color(color);
  mat.emissiveIntensity = intensity;
  return mat;
}

export function applyHighlight(mesh, highlightMat) {
  if (!mesh.userData._originalMaterial) {
    mesh.userData._originalMaterial = mesh.material;
  }
  mesh.material = highlightMat;
}

export function removeHighlight(mesh) {
  if (mesh.userData._originalMaterial) {
    mesh.material = mesh.userData._originalMaterial;
    delete mesh.userData._originalMaterial;
  }
}
