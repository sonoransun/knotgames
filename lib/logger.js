// Structured logging with levels and categories

const LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };

let currentLevel = LEVELS.WARN; // production default: only warnings and errors

export function setLevel(level) {
  currentLevel = LEVELS[level] ?? LEVELS.WARN;
}

export function enableDebugLogging() {
  currentLevel = LEVELS.DEBUG;
}

export function getLevel() {
  return Object.entries(LEVELS).find(([, v]) => v === currentLevel)?.[0] || 'WARN';
}

function log(level, category, message, ...data) {
  if (LEVELS[level] < currentLevel) return;
  const prefix = `[${level}][${category}]`;
  const method = level === 'ERROR' ? 'error'
    : level === 'WARN' ? 'warn'
      : level === 'DEBUG' ? 'debug'
        : 'log';
  if (data.length > 0) {
    console[method](prefix, message, ...data);
  } else {
    console[method](prefix, message);
  }
}

function createCategory(name) {
  return {
    debug: (msg, ...d) => log('DEBUG', name, msg, ...d),
    info: (msg, ...d) => log('INFO', name, msg, ...d),
    warn: (msg, ...d) => log('WARN', name, msg, ...d),
    error: (msg, ...d) => log('ERROR', name, msg, ...d),
  };
}

export const puzzle = createCategory('PUZZLE');
export const scene = createCategory('SCENE');
export const anim = createCategory('ANIM');
export const svg = createCategory('SVG');
