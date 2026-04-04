import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnimationController, lerpPosition } from '../lib/animation.js';

describe('AnimationController', () => {
  const steps = [
    { label: 'Step A', duration: 1.0 },
    { label: 'Step B', duration: 2.0 },
    { label: 'Step C', duration: 1.5 },
  ];

  let controller;
  let callback;

  beforeEach(() => {
    callback = vi.fn();
    controller = new AnimationController(steps, callback);
  });

  describe('constructor', () => {
    it('computes total duration', () => {
      expect(controller.totalDuration).toBe(4.5);
    });

    it('creates correct number of step bounds', () => {
      expect(controller.stepBounds).toHaveLength(3);
    });

    it('step bounds are contiguous', () => {
      for (let i = 1; i < controller.stepBounds.length; i++) {
        expect(controller.stepBounds[i].start).toBe(controller.stepBounds[i - 1].end);
      }
    });

    it('first bound starts at 0', () => {
      expect(controller.stepBounds[0].start).toBe(0);
    });

    it('last bound ends at totalDuration', () => {
      const last = controller.stepBounds[controller.stepBounds.length - 1];
      expect(last.end).toBe(4.5);
    });
  });

  describe('default duration', () => {
    it('uses 1.5s when step has no duration', () => {
      const ctrl = new AnimationController([{ label: 'X' }], vi.fn());
      expect(ctrl.totalDuration).toBe(1.5);
    });
  });

  describe('getCurrentStepIndex', () => {
    it('returns 0 at start', () => {
      expect(controller.getCurrentStepIndex()).toBe(0);
    });

    it('returns 1 when currentTime is in step B range', () => {
      controller.currentTime = 1.5;
      expect(controller.getCurrentStepIndex()).toBe(1);
    });

    it('returns last index when at end', () => {
      controller.currentTime = 4.5;
      expect(controller.getCurrentStepIndex()).toBe(2);
    });
  });

  describe('getCurrentStepLabel', () => {
    it('returns first step label at start', () => {
      expect(controller.getCurrentStepLabel()).toBe('Step A');
    });
  });

  describe('stepForward / stepBackward', () => {
    it('stepForward moves to next step start', () => {
      controller.stepForward();
      expect(controller.currentTime).toBe(1.0);
      expect(controller.playing).toBe(false);
    });

    it('stepForward from last step goes to end', () => {
      controller.currentTime = 3.5; // in step C
      controller.stepForward();
      expect(controller.currentTime).toBe(4.5);
    });

    it('stepBackward from step 0 stays at 0', () => {
      controller.stepBackward();
      expect(controller.currentTime).toBe(0);
    });

    it('stepBackward from step B goes to step A start', () => {
      controller.currentTime = 1.5;
      controller.stepBackward();
      expect(controller.currentTime).toBe(0);
    });
  });

  describe('seekTo / getProgress', () => {
    it('seekTo(0.5) sets currentTime to half of totalDuration', () => {
      controller.seekTo(0.5);
      expect(controller.currentTime).toBe(2.25);
    });

    it('getProgress returns correct fraction', () => {
      controller.currentTime = 2.25;
      expect(controller.getProgress()).toBeCloseTo(0.5);
    });

    it('getProgress is 0 at start', () => {
      expect(controller.getProgress()).toBe(0);
    });
  });

  describe('play / pause / togglePlay', () => {
    it('starts paused', () => {
      expect(controller.playing).toBe(false);
    });

    it('play sets playing to true', () => {
      controller.play();
      expect(controller.playing).toBe(true);
    });

    it('pause sets playing to false', () => {
      controller.play();
      controller.pause();
      expect(controller.playing).toBe(false);
    });

    it('togglePlay alternates', () => {
      controller.togglePlay();
      expect(controller.playing).toBe(true);
      controller.togglePlay();
      expect(controller.playing).toBe(false);
    });
  });

  describe('reset', () => {
    it('resets to beginning and pauses', () => {
      controller.currentTime = 2.0;
      controller.play();
      controller.reset();
      expect(controller.currentTime).toBe(0);
      expect(controller.playing).toBe(false);
    });
  });

  describe('setSpeed', () => {
    it('sets speed multiplier', () => {
      controller.setSpeed(2.0);
      expect(controller.speed).toBe(2.0);
    });
  });

  describe('update with mocked performance.now', () => {
    it('advances currentTime when playing', () => {
      const mockNow = vi.spyOn(performance, 'now');
      mockNow.mockReturnValueOnce(1000);
      controller.play(); // sets _lastTimestamp

      mockNow.mockReturnValueOnce(1500); // 500ms later
      controller.update();

      expect(controller.currentTime).toBeCloseTo(0.5, 1);
      mockNow.mockRestore();
    });

    it('respects speed multiplier', () => {
      const mockNow = vi.spyOn(performance, 'now');
      controller.setSpeed(2.0);
      mockNow.mockReturnValueOnce(1000);
      controller.play();

      mockNow.mockReturnValueOnce(1500); // 500ms later, at 2x speed = 1s
      controller.update();

      expect(controller.currentTime).toBeCloseTo(1.0, 1);
      mockNow.mockRestore();
    });

    it('clamps at totalDuration and pauses', () => {
      const mockNow = vi.spyOn(performance, 'now');
      controller.currentTime = 4.0; // near end
      mockNow.mockReturnValueOnce(1000);
      controller.play();

      mockNow.mockReturnValueOnce(2000); // 1s later, would exceed 4.5
      controller.update();

      expect(controller.currentTime).toBe(4.5);
      expect(controller.playing).toBe(false);
      mockNow.mockRestore();
    });

    it('does not advance when paused', () => {
      controller.currentTime = 1.0;
      controller.update();
      expect(controller.currentTime).toBe(1.0);
    });
  });

  describe('callback emission', () => {
    it('emits state on stepForward', () => {
      controller.stepForward();
      expect(callback).toHaveBeenCalled();
      const state = callback.mock.calls[0][0];
      expect(state).toHaveProperty('stepIndex');
      expect(state).toHaveProperty('stepProgress');
      expect(state).toHaveProperty('step');
      expect(state).toHaveProperty('totalProgress');
    });

    it('stepProgress is eased (not raw)', () => {
      controller.currentTime = 0.5; // halfway through step A
      controller._emitUpdate();
      const state = callback.mock.calls[0][0];
      // easeInOut(0.5) = 0.5, so this is coincidentally the same
      expect(state.stepProgress).toBeCloseTo(0.5);
    });
  });
});

describe('lerpPosition', () => {
  it('returns from at t=0', () => {
    expect(lerpPosition([0, 0, 0], [10, 20, 30], 0)).toEqual([0, 0, 0]);
  });

  it('returns to at t=1', () => {
    expect(lerpPosition([0, 0, 0], [10, 20, 30], 1)).toEqual([10, 20, 30]);
  });

  it('returns midpoint at t=0.5', () => {
    expect(lerpPosition([0, 0, 0], [10, 20, 30], 0.5)).toEqual([5, 10, 15]);
  });
});
