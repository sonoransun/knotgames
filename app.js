import { createScene } from './lib/scene.js';
import { AnimationController } from './lib/animation.js';
import * as logger from './lib/logger.js';
import * as debug from './lib/debug.js';
import { validatePuzzleModule } from './lib/validate.js';

// Puzzle metadata registry
const puzzleRegistry = [
  { id: 1,  module: './puzzles/puzzle-01.js', name: 'The Gatekeeper',     difficulty: 'beginner' },
  { id: 2,  module: './puzzles/puzzle-02.js', name: "Shepherd's Yoke",    difficulty: 'beginner' },
  { id: 3,  module: './puzzles/puzzle-03.js', name: "The Prisoner's Ring", difficulty: 'intermediate' },
  { id: 4,  module: './puzzles/puzzle-04.js', name: 'Mobius Snare',       difficulty: 'intermediate' },
  { id: 5,  module: './puzzles/puzzle-05.js', name: 'Trinity Lock',       difficulty: 'intermediate' },
  { id: 6,  module: './puzzles/puzzle-06.js', name: "Devil's Pitchfork",  difficulty: 'advanced' },
  { id: 7,  module: './puzzles/puzzle-07.js', name: "The Ferryman's Knot", difficulty: 'advanced' },
  { id: 8,  module: './puzzles/puzzle-08.js', name: 'Ouroboros Chain',    difficulty: 'advanced' },
  { id: 9,  module: './puzzles/puzzle-09.js', name: 'Genus Trap',         difficulty: 'expert' },
  { id: 10, module: './puzzles/puzzle-10.js', name: 'The Hopf Paradox',   difficulty: 'expert' },
];

// Debug mode initialization
const webglSupported = checkWebGLSupport();

if (debug.isDebugMode()) {
  logger.enableDebugLogging();
  debug.createDebugOverlay();
  logger.puzzle.info('Debug mode enabled');
}

if (!webglSupported) {
  logger.scene.warn('WebGL not supported — 3D views will be unavailable');
}

logger.puzzle.info('EXKNOTS initialized, registry has', puzzleRegistry.length, 'puzzles');

function checkWebGLSupport() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

let currentPuzzle = null;
let modelScene = null;
let animScene = null;
let animController = null;

// DOM refs
const puzzleList = document.getElementById('puzzle-list');
const welcome = document.getElementById('welcome');
const puzzleView = document.getElementById('puzzle-view');
const puzzleName = document.getElementById('puzzle-name');
const puzzleDifficulty = document.getElementById('puzzle-difficulty');
const puzzleType = document.getElementById('puzzle-type');
const puzzlePrinciple = document.getElementById('puzzle-principle');
const puzzleDescription = document.getElementById('puzzle-description');
const svgContainer = document.getElementById('svg-container');
const modelCanvas = document.getElementById('three-canvas');
const animCanvas = document.getElementById('anim-canvas');
const stepLabel = document.getElementById('step-label');
const btnPlay = document.getElementById('btn-play');
const btnStepBack = document.getElementById('btn-step-back');
const btnStepFwd = document.getElementById('btn-step-fwd');
const scrubber = document.getElementById('scrubber');
const stepCounter = document.getElementById('step-counter');
const speedSelect = document.getElementById('speed-select');
const sidebarToggle = document.getElementById('sidebar-toggle');
const sidebar = document.getElementById('sidebar');

// Build sidebar
puzzleRegistry.forEach(entry => {
  const li = document.createElement('li');
  li.dataset.id = entry.id;

  const num = document.createElement('span');
  num.className = 'num';
  num.textContent = entry.id + '.';

  const dot = document.createElement('span');
  dot.className = `difficulty-dot diff-${entry.difficulty}`;

  const name = document.createElement('span');
  name.textContent = entry.name;

  li.appendChild(num);
  li.appendChild(dot);
  li.appendChild(name);

  li.addEventListener('click', () => loadPuzzle(entry.id));
  puzzleList.appendChild(li);
});

// Sidebar toggle (mobile)
sidebarToggle.addEventListener('click', () => {
  sidebar.classList.toggle('open');
});

// Animation controls
btnPlay.addEventListener('click', () => {
  if (animController) {
    animController.togglePlay();
    btnPlay.textContent = animController.playing ? '\u23F8' : '\u25B6';
  }
});

btnStepBack.addEventListener('click', () => {
  if (animController) animController.stepBackward();
});

btnStepFwd.addEventListener('click', () => {
  if (animController) animController.stepForward();
});

scrubber.addEventListener('input', () => {
  if (animController) {
    animController.seekTo(scrubber.value / 1000);
  }
});

speedSelect.addEventListener('change', () => {
  if (animController) {
    animController.setSpeed(parseFloat(speedSelect.value));
  }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Ctrl+Shift+D: toggle debug overlay
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.code === 'KeyD') {
    e.preventDefault();
    debug.toggleDebugOverlay();
    if (debug.isActive()) {
      logger.enableDebugLogging();
      logger.puzzle.info('Debug overlay toggled ON');
    }
    return;
  }

  if (!animController) return;
  if (e.code === 'Space') {
    e.preventDefault();
    animController.togglePlay();
    btnPlay.textContent = animController.playing ? '\u23F8' : '\u25B6';
  } else if (e.code === 'ArrowRight') {
    animController.stepForward();
  } else if (e.code === 'ArrowLeft') {
    animController.stepBackward();
  }
});

async function loadPuzzle(id) {
  // Cleanup current puzzle
  if (currentPuzzle) {
    if (currentPuzzle.dispose) currentPuzzle.dispose();
    currentPuzzle = null;
  }
  if (modelScene) {
    modelScene.stop();
    // Clear puzzle objects from scene (keep lights, grid)
    clearPuzzleObjects(modelScene.scene);
  }
  if (animScene) {
    animScene.stop();
    clearPuzzleObjects(animScene.scene);
  }
  animController = null;
  svgContainer.innerHTML = '';
  stepLabel.textContent = '';
  btnPlay.textContent = '\u25B6';
  scrubber.value = 0;

  // Update sidebar active state
  document.querySelectorAll('#puzzle-list li').forEach(li => {
    li.classList.toggle('active', parseInt(li.dataset.id) === id);
  });

  // Close mobile sidebar
  sidebar.classList.remove('open');

  // Find registry entry
  const entry = puzzleRegistry.find(e => e.id === id);
  if (!entry) return;

  logger.puzzle.info('Loading puzzle', id, entry.name);

  // Dynamic import
  let puzzleModule;
  try {
    puzzleModule = await import(entry.module);
  } catch (err) {
    logger.puzzle.warn('Puzzle not yet implemented:', id, err.message);
    welcome.style.display = '';
    puzzleView.style.display = 'none';
    welcome.querySelector('h2').textContent = `Puzzle ${id}: Coming Soon`;
    welcome.querySelector('p').textContent = `${entry.name} visualization is not yet implemented.`;
    return;
  }

  // Validate module structure
  const validationErrors = validatePuzzleModule(puzzleModule, id);
  if (validationErrors.length > 0) {
    logger.puzzle.warn('Puzzle', id, 'validation issues:', validationErrors.join('; '));
  }

  currentPuzzle = puzzleModule;

  // Show puzzle view
  welcome.style.display = 'none';
  puzzleView.style.display = '';

  // Update header
  const meta = puzzleModule.metadata;
  puzzleName.textContent = `${meta.id}. ${meta.name}`;
  puzzleDifficulty.textContent = meta.difficulty;
  puzzleDifficulty.className = `badge diff-badge-${meta.difficulty.toLowerCase().replace(/[^a-z]/g, '')}`;
  puzzleType.textContent = meta.type;
  puzzlePrinciple.textContent = meta.principle;
  puzzleDescription.textContent = meta.description || '';

  // Initialize 3D model scene
  if (webglSupported) {
    try {
      if (!modelScene) {
        modelScene = createScene(modelCanvas);
        logger.scene.info('Model scene created');
      } else {
        clearPuzzleObjects(modelScene.scene);
      }

      if (puzzleModule.create3DScene) {
        const group = puzzleModule.create3DScene(modelScene.scene);
        if (group) modelScene.scene.add(group);
      }

      if (meta.cameraPosition) {
        modelScene.setCameraPosition(...meta.cameraPosition);
      } else {
        modelScene.setCameraPosition(0, 80, 250);
      }

      modelScene.start();
    } catch (err) {
      logger.scene.error('Failed to create 3D model scene:', err);
      modelCanvas.parentElement.innerHTML = '<p class="error-msg">3D rendering failed. See SVG diagram above.</p>';
    }
  } else {
    modelCanvas.parentElement.innerHTML = '<p class="error-msg">WebGL not supported. 3D view unavailable.</p>';
  }

  // Create SVG diagram
  if (puzzleModule.createSVGDiagram) {
    puzzleModule.createSVGDiagram(svgContainer);
  }

  // Initialize animation scene
  let animObjects = null;
  if (webglSupported) {
    try {
      if (!animScene) {
        animScene = createScene(animCanvas);
        logger.scene.info('Animation scene created');
      } else {
        clearPuzzleObjects(animScene.scene);
      }

      let animGroup = null;
      if (puzzleModule.createAnimScene) {
        const result = puzzleModule.createAnimScene(animScene.scene);
        animGroup = result.group;
        animObjects = result.objects;
        if (animGroup) animScene.scene.add(animGroup);
      } else if (puzzleModule.create3DScene) {
        const group = puzzleModule.create3DScene(animScene.scene);
        if (group) animScene.scene.add(group);
      }

      if (meta.cameraPosition) {
        animScene.setCameraPosition(...meta.cameraPosition);
      } else {
        animScene.setCameraPosition(0, 80, 250);
      }
    } catch (err) {
      logger.scene.error('Failed to create animation scene:', err);
      animCanvas.parentElement.innerHTML = '<p class="error-msg">Animation rendering failed.</p>';
    }
  } else {
    animCanvas.parentElement.innerHTML = '<p class="error-msg">WebGL not supported. Animation unavailable.</p>';
  }

  // Setup animation controller
  if (puzzleModule.animationSteps && puzzleModule.animationSteps.length > 0) {
    try {
      animController = new AnimationController(
        puzzleModule.animationSteps,
        (state) => {
          stepLabel.textContent = state.step.label;
          stepCounter.textContent = `Step ${state.stepIndex + 1}/${puzzleModule.animationSteps.length}`;
          scrubber.value = Math.round(state.totalProgress * 1000);
          btnPlay.textContent = animController.playing ? '\u23F8' : '\u25B6';

          if (puzzleModule.updateAnimation && animObjects) {
            puzzleModule.updateAnimation(animObjects, state);
          }
        }
      );

      logger.anim.info('Animation controller created,', puzzleModule.animationSteps.length, 'steps');
      stepCounter.textContent = `Step 0/${puzzleModule.animationSteps.length}`;
    } catch (err) {
      logger.anim.error('Failed to create animation controller:', err);
    }
  }

  if (animScene) {
    animScene.setOnFrame(() => {
      if (animController) animController.update();
      // Update debug overlay each frame
      if (debug.isActive()) {
        debug.updateDebugOverlay({
          renderer: modelScene?.renderer,
          puzzleName: meta.name,
          animation: animController ? {
            playing: animController.playing,
            step: animController.getCurrentStepIndex() + 1,
            totalSteps: puzzleModule.animationSteps?.length || 0,
            progress: animController.getProgress(),
            speed: animController.speed,
          } : null,
        });
      }
    });

    animScene.start();
  }

  logger.puzzle.info('Puzzle loaded:', meta.name);
}

function clearPuzzleObjects(scene) {
  // Keep only lights and the grid helper; remove everything else
  const keep = new Set();
  scene.children.forEach(child => {
    if (child.isLight || child.isGridHelper || child.type === 'GridHelper') {
      keep.add(child);
    }
  });
  for (let i = scene.children.length - 1; i >= 0; i--) {
    const child = scene.children[i];
    if (!keep.has(child)) {
      scene.remove(child);
      disposeObject(child);
    }
  }
}

function disposeObject(obj) {
  if (obj.geometry) obj.geometry.dispose();
  if (obj.material) {
    if (Array.isArray(obj.material)) {
      obj.material.forEach(m => m.dispose());
    } else {
      obj.material.dispose();
    }
  }
  if (obj.children) {
    obj.children.forEach(disposeObject);
  }
}

// Load first puzzle by default if hash is present
const hashId = parseInt(location.hash.replace('#', ''));
if (hashId >= 1 && hashId <= 10) {
  loadPuzzle(hashId);
}
