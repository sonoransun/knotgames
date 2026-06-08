import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import * as logger from './logger.js';

// Theme-aware backdrop colors for the 3D canvas (matches the site's warm
// "workbench" in light, a deep neutral in dark). Read once + on data-theme change.
function isDarkTheme() {
  const t = document.documentElement.getAttribute('data-theme');
  if (t === 'dark') return true;
  if (t === 'light') return false;
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

// A soft radial "contact shadow" texture — grounds the model regardless of the
// key light's angle. Cheap (one small canvas), no post-processing.
function makeContactShadowTexture() {
  const s = 256;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, 'rgba(0,0,0,0.55)');
  g.addColorStop(0.55, 'rgba(0,0,0,0.22)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createScene(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  // background set by applyTheme() below (theme-aware)

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

  // Lighting (IBL from RoomEnvironment carries much of the fill, so ambient
  // is modest and the key light does the shaping)
  const ambient = new THREE.AmbientLight(0xffffff, 0.35);
  scene.add(ambient);

  const keyLight = new THREE.DirectionalLight(0xfff5e0, 1.15);
  keyLight.position.set(150, 250, 200);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 2048;
  keyLight.shadow.mapSize.height = 2048;
  keyLight.shadow.camera.near = 1;
  keyLight.shadow.camera.far = 600;
  keyLight.shadow.camera.left = -200;
  keyLight.shadow.camera.right = 200;
  keyLight.shadow.camera.top = 200;
  keyLight.shadow.camera.bottom = -200;
  keyLight.shadow.bias = -0.0008;
  keyLight.shadow.normalBias = 0.6;
  keyLight.shadow.radius = 6;
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xe0e8ff, 0.4);
  fillLight.position.set(-120, 150, -100);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xffffff, 0.35);
  rimLight.position.set(0, 100, -250);
  scene.add(rimLight);

  // Image-based lighting: a neutral procedural studio (RoomEnvironment) gives
  // far more realistic metal reflections than the old gradient sphere — no asset.
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const envMap = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envMap;
  pmremGenerator.dispose();

  // Ground grid for spatial reference (colors set by applyTheme)
  const grid = new THREE.GridHelper(400, 20, 0xcccccc, 0xe0e0e0);
  grid.position.y = -1;
  scene.add(grid);

  // Shadow-receiving ground plane (cast shadows from the key light)
  const groundGeo = new THREE.PlaneGeometry(400, 400);
  const groundMat = new THREE.ShadowMaterial({ opacity: 0.18 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -1.5;
  ground.receiveShadow = true;
  scene.add(ground);

  // Soft contact shadow (radial blob) — anchors the model to the ground
  const contactTex = makeContactShadowTexture();
  const contactMat = new THREE.MeshBasicMaterial({
    map: contactTex, transparent: true, opacity: 0.5, depthWrite: false,
  });
  const contactShadow = new THREE.Mesh(new THREE.PlaneGeometry(220, 220), contactMat);
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.y = -1.4;
  contactShadow.renderOrder = -1;
  scene.add(contactShadow);

  // Theme-aware backdrop + grid; re-applied if the page theme toggles.
  function applyTheme() {
    const dark = isDarkTheme();
    scene.background = new THREE.Color(dark ? 0x12141d : 0xece4d6);
    grid.material.color.set(dark ? 0x2a3450 : 0xcfc4ad);
    contactMat.opacity = dark ? 0.4 : 0.5;
  }
  applyTheme();
  let themeObserver = null;
  if (typeof MutationObserver !== 'undefined') {
    themeObserver = new MutationObserver(applyTheme);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  }

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
    if (themeObserver) themeObserver.disconnect();
    contactTex.dispose();
    contactMat.dispose();
    envMap.dispose();
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

export function enableShadowsOnGroup(group) {
  group.traverse(child => {
    if (child.isMesh) {
      child.castShadow = true;
    }
  });
}
