import * as THREE from 'three';

export function createMaterials() {
  return {
    steel: new THREE.MeshStandardMaterial({
      color: 0x999999,
      metalness: 0.85,
      roughness: 0.25,
    }),
    brass: new THREE.MeshStandardMaterial({
      color: 0xccaa44,
      metalness: 0.85,
      roughness: 0.25,
    }),
    wood: new THREE.MeshStandardMaterial({
      color: 0xc4956a,
      metalness: 0.0,
      roughness: 0.7,
    }),
    darkWood: new THREE.MeshStandardMaterial({
      color: 0x8b6914,
      metalness: 0.0,
      roughness: 0.7,
    }),
    cord: new THREE.MeshStandardMaterial({
      color: 0x2255aa,
      metalness: 0.0,
      roughness: 0.6,
    }),
    cordRed: new THREE.MeshStandardMaterial({
      color: 0xcc3333,
      metalness: 0.0,
      roughness: 0.6,
    }),
    leather: new THREE.MeshStandardMaterial({
      color: 0x8b5a2b,
      metalness: 0.0,
      roughness: 0.8,
      side: THREE.DoubleSide,
    }),
    acrylic: new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.9,
      roughness: 0.05,
      ior: 1.49,
      thickness: 60,
    }),
    red: new THREE.MeshStandardMaterial({
      color: 0xdd3333,
      metalness: 0.7,
      roughness: 0.3,
    }),
    blue: new THREE.MeshStandardMaterial({
      color: 0x3333dd,
      metalness: 0.7,
      roughness: 0.3,
    }),
    yellow: new THREE.MeshStandardMaterial({
      color: 0xddcc33,
      metalness: 0.7,
      roughness: 0.3,
    }),
  };
}
