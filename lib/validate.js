// Puzzle module structure validator

export function validatePuzzleModule(mod, expectedId) {
  const errors = [];

  if (!mod.metadata || typeof mod.metadata !== 'object') {
    errors.push('Missing or invalid metadata object');
    return errors; // Can't check further without metadata
  }

  const m = mod.metadata;
  if (typeof m.id !== 'number') errors.push('metadata.id must be a number');
  if (typeof m.name !== 'string' || !m.name) errors.push('metadata.name must be a non-empty string');
  if (typeof m.difficulty !== 'string') errors.push('metadata.difficulty must be a string');
  if (typeof m.principle !== 'string') errors.push('metadata.principle must be a string');
  if (typeof m.type !== 'string') errors.push('metadata.type must be a string');

  if (m.cameraPosition !== undefined) {
    if (!Array.isArray(m.cameraPosition) || m.cameraPosition.length !== 3 ||
        !m.cameraPosition.every(v => typeof v === 'number')) {
      errors.push('metadata.cameraPosition must be [x, y, z] (3 numbers)');
    }
  }

  if (expectedId !== undefined && m.id !== expectedId) {
    errors.push(`metadata.id is ${m.id} but expected ${expectedId}`);
  }

  if (typeof mod.create3DScene !== 'function') errors.push('Missing create3DScene function');
  if (typeof mod.createSVGDiagram !== 'function') errors.push('Missing createSVGDiagram function');
  if (typeof mod.createAnimScene !== 'function') errors.push('Missing createAnimScene function');
  if (typeof mod.updateAnimation !== 'function') errors.push('Missing updateAnimation function');
  if (typeof mod.dispose !== 'function') errors.push('Missing dispose function');

  if (!Array.isArray(mod.animationSteps)) {
    errors.push('Missing animationSteps array');
  } else if (mod.animationSteps.length === 0) {
    errors.push('animationSteps array is empty');
  } else {
    mod.animationSteps.forEach((step, i) => {
      if (typeof step.label !== 'string') {
        errors.push(`animationSteps[${i}] missing label string`);
      }
    });
  }

  return errors;
}
