import { easeInOut } from './easing.js';
import * as logger from './logger.js';

export class AnimationController {
  constructor(steps, updateCallback, options = {}) {
    this.steps = steps;
    this.updateCallback = updateCallback;
    this.onStepChange = options.onStepChange || null;
    this.totalDuration = steps.reduce((sum, s) => sum + (s.duration || 1.5), 0);
    this.playing = false;
    this.speed = 1.0;
    this.currentTime = 0;
    this._lastTimestamp = null;
    this._lastStepIndex = -1;

    // Pre-compute step time boundaries
    this.stepBounds = [];
    let t = 0;
    for (const step of steps) {
      const dur = step.duration || 1.5;
      this.stepBounds.push({ start: t, end: t + dur, step });
      t += dur;
    }
  }

  play() {
    this.playing = true;
    this._lastTimestamp = performance.now();
    logger.anim.debug('Play');
  }

  pause() {
    this.playing = false;
    this._lastTimestamp = null;
    logger.anim.debug('Pause at', this.currentTime.toFixed(2) + 's');
  }

  togglePlay() {
    if (this.playing) this.pause();
    else this.play();
  }

  stepForward() {
    this.pause();
    const current = this.getCurrentStepIndex();
    if (current < this.steps.length - 1) {
      this.currentTime = this.stepBounds[current + 1].start;
    } else {
      this.currentTime = this.totalDuration;
    }
    this._emitUpdate();
  }

  stepBackward() {
    this.pause();
    const current = this.getCurrentStepIndex();
    if (current > 0) {
      this.currentTime = this.stepBounds[current - 1].start;
    } else {
      this.currentTime = 0;
    }
    this._emitUpdate();
  }

  seekTo(fraction) {
    this.currentTime = fraction * this.totalDuration;
    this._emitUpdate();
  }

  reset() {
    this.pause();
    this.currentTime = 0;
    this._emitUpdate();
  }

  setSpeed(speed) {
    this.speed = speed;
  }

  getCurrentStepIndex() {
    for (let i = 0; i < this.stepBounds.length; i++) {
      if (this.currentTime < this.stepBounds[i].end) return i;
    }
    return this.stepBounds.length - 1;
  }

  getCurrentStepLabel() {
    const idx = this.getCurrentStepIndex();
    return this.steps[idx]?.label || '';
  }

  getProgress() {
    return this.totalDuration > 0 ? this.currentTime / this.totalDuration : 0;
  }

  // Called each frame from the render loop
  update() {
    if (!this.playing) return;

    const now = performance.now();
    if (this._lastTimestamp) {
      const dt = ((now - this._lastTimestamp) / 1000) * this.speed;
      this.currentTime += dt;

      if (this.currentTime >= this.totalDuration) {
        this.currentTime = this.totalDuration;
        this.pause();
        logger.anim.info('Animation complete');
      }
    }
    this._lastTimestamp = now;
    this._emitUpdate();
  }

  _emitUpdate() {
    const idx = this.getCurrentStepIndex();
    const bound = this.stepBounds[idx];
    const stepProgress = bound.end > bound.start
      ? Math.min(1, (this.currentTime - bound.start) / (bound.end - bound.start))
      : 1;

    const easedProgress = easeInOut(stepProgress);

    if (idx !== this._lastStepIndex) {
      this._lastStepIndex = idx;
      if (this.onStepChange) {
        this.onStepChange(idx, this.steps[idx]);
      }
    }

    if (this.updateCallback) {
      this.updateCallback({
        stepIndex: idx,
        stepProgress: easedProgress,
        step: this.steps[idx],
        totalProgress: this.getProgress(),
      });
    }
  }
}

// Helper: lerp a position array
export function lerpPosition(from, to, t) {
  return [
    from[0] + (to[0] - from[0]) * t,
    from[1] + (to[1] - from[1]) * t,
    from[2] + (to[2] - from[2]) * t,
  ];
}
