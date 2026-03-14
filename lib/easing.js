// Easing functions: t in [0,1] → [0,1]

export function linear(t) {
  return t;
}

export function easeInOut(t) {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function easeOut(t) {
  return 1 - Math.pow(1 - t, 3);
}

export function easeIn(t) {
  return t * t * t;
}
