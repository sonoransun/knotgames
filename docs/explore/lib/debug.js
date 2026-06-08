// Debug mode: overlay with FPS, renderer stats, and puzzle state

let overlayEl = null;
let fpsTimestamps = [];
let debugActive = false;

export function isDebugMode() {
  try {
    return new URLSearchParams(window.location.search).has('debug');
  } catch {
    return false;
  }
}

export function isActive() {
  return debugActive;
}

export function createDebugOverlay() {
  if (overlayEl) return overlayEl;
  overlayEl = document.createElement('div');
  overlayEl.id = 'debug-overlay';
  document.body.appendChild(overlayEl);
  debugActive = true;
  return overlayEl;
}

export function destroyDebugOverlay() {
  if (overlayEl) {
    overlayEl.remove();
    overlayEl = null;
  }
  debugActive = false;
  fpsTimestamps = [];
}

export function toggleDebugOverlay() {
  if (debugActive) {
    destroyDebugOverlay();
  } else {
    createDebugOverlay();
  }
}

export function updateDebugOverlay(data = {}) {
  if (!overlayEl) return;

  // FPS calculation
  const now = performance.now();
  fpsTimestamps.push(now);
  // Keep last 60 frames
  while (fpsTimestamps.length > 60) fpsTimestamps.shift();
  let fps = 0;
  if (fpsTimestamps.length >= 2) {
    const elapsed = (fpsTimestamps[fpsTimestamps.length - 1] - fpsTimestamps[0]) / 1000;
    fps = elapsed > 0 ? Math.round((fpsTimestamps.length - 1) / elapsed) : 0;
  }

  const lines = [`FPS: ${fps}`];

  // Renderer stats
  if (data.renderer) {
    const info = data.renderer.info;
    lines.push(`Draw calls: ${info.render.calls}`);
    lines.push(`Triangles: ${info.render.triangles}`);
    lines.push(`Geometries: ${info.memory.geometries}`);
    lines.push(`Textures: ${info.memory.textures}`);
  }

  // Puzzle info
  if (data.puzzleName) {
    lines.push(`Puzzle: ${data.puzzleName}`);
  }

  // Animation state
  if (data.animation) {
    const a = data.animation;
    lines.push(`Anim: ${a.playing ? 'PLAY' : 'PAUSE'} ${a.step}/${a.totalSteps}`);
    lines.push(`Progress: ${(a.progress * 100).toFixed(1)}%`);
    lines.push(`Speed: ${a.speed}x`);
  }

  // Memory (Chrome only)
  if (performance.memory) {
    const mb = (performance.memory.usedJSHeapSize / 1048576).toFixed(1);
    lines.push(`Heap: ${mb} MB`);
  }

  overlayEl.textContent = lines.join('\n');
}
