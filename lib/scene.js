import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as logger from './logger.js';

export function createScene(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f0f0);

  // Camera
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 2000);
  camera.position.set(0, 100, 300);

  // Orbit controls
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 50;
  controls.maxDistance = 800;
  controls.maxPolarAngle = Math.PI * 0.95;

  // Lighting
  const ambient = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambient);

  const keyLight = new THREE.DirectionalLight(0xfff5e0, 0.9);
  keyLight.position.set(150, 250, 200);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xe0e8ff, 0.35);
  fillLight.position.set(-120, 150, -100);
  scene.add(fillLight);

  // Simple environment map for metallic reflections
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  // Gradient background for environment
  const envGeo = new THREE.SphereGeometry(500, 32, 32);
  const envMat = new THREE.MeshBasicMaterial({
    side: THREE.BackSide,
    vertexColors: true,
  });
  // Create gradient colors
  const colors = [];
  const posAttr = envGeo.getAttribute('position');
  for (let i = 0; i < posAttr.count; i++) {
    const y = posAttr.getY(i);
    const t = (y / 500 + 1) * 0.5; // 0 at bottom, 1 at top
    const r = 0.6 + t * 0.3;
    const g = 0.65 + t * 0.3;
    const b = 0.75 + t * 0.2;
    colors.push(r, g, b);
  }
  envGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  envScene.add(new THREE.Mesh(envGeo, envMat));
  const envMap = pmremGenerator.fromScene(envScene).texture;
  scene.environment = envMap;
  envScene.traverse(child => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) child.material.dispose();
  });
  pmremGenerator.dispose();

  // Ground grid for spatial reference
  const grid = new THREE.GridHelper(400, 20, 0xcccccc, 0xe0e0e0);
  grid.position.y = -1;
  scene.add(grid);

  // Resize handling
  function resize() {
    const parent = canvas.parentElement;
    if (!parent) return;
    const w = parent.clientWidth;
    const h = parent.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  let resizeObserver = null;
  let resizeFallback = null;
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas.parentElement);
  } else {
    resizeFallback = resize;
    window.addEventListener('resize', resizeFallback);
    logger.scene.debug('ResizeObserver unavailable, using window resize fallback');
  }
  resize();

  logger.scene.info('WebGL scene created');

  // Animation loop
  let animFrameId = null;
  let onFrame = null;

  function animate() {
    animFrameId = requestAnimationFrame(animate);
    controls.update();
    if (onFrame) onFrame();
    renderer.render(scene, camera);
  }

  function start() {
    if (!animFrameId) animate();
  }

  function stop() {
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
  }

  function setOnFrame(fn) {
    onFrame = fn;
  }

  function setCameraPosition(x, y, z) {
    camera.position.set(x, y, z);
    controls.target.set(0, y * 0.3, 0);
    controls.update();
  }

  function dispose() {
    stop();
    if (resizeObserver) resizeObserver.disconnect();
    if (resizeFallback) window.removeEventListener('resize', resizeFallback);
    controls.dispose();
    renderer.dispose();
    logger.scene.info('Scene disposed');
  }

  return {
    renderer,
    scene,
    camera,
    controls,
    grid,
    start,
    stop,
    resize,
    setOnFrame,
    setCameraPosition,
    dispose,
  };
}
