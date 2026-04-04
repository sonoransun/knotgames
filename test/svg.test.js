// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import {
  createSVG, line, path, circle, ellipse, rect, text,
  dimensionArrow, label, crossingGap,
  gradient, crossingWithColor, stepBadge,
} from '../lib/svg.js';

describe('SVG helpers', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  describe('createSVG', () => {
    it('creates an SVG element with correct attributes', () => {
      const svg = createSVG(container, 600, 400);
      expect(svg.tagName).toBe('svg');
      expect(svg.getAttribute('viewBox')).toBe('0 0 600 400');
      expect(svg.getAttribute('width')).toBe('100%');
    });

    it('appends to container', () => {
      createSVG(container);
      expect(container.querySelector('svg')).not.toBeNull();
    });

    it('creates defs with arrowhead markers', () => {
      const svg = createSVG(container);
      const defs = svg.querySelector('defs');
      expect(defs).not.toBeNull();
      expect(defs.querySelector('#arrowhead')).not.toBeNull();
      expect(defs.querySelector('#arrowhead-rev')).not.toBeNull();
    });
  });

  describe('line', () => {
    it('creates a line with correct coordinates', () => {
      const svg = createSVG(container);
      const el = line(svg, 10, 20, 100, 200);
      expect(el.tagName).toBe('line');
      expect(el.getAttribute('x1')).toBe('10');
      expect(el.getAttribute('y1')).toBe('20');
      expect(el.getAttribute('x2')).toBe('100');
      expect(el.getAttribute('y2')).toBe('200');
    });

    it('uses default stroke and width', () => {
      const svg = createSVG(container);
      const el = line(svg, 0, 0, 10, 10);
      expect(el.getAttribute('stroke')).toBe('#333');
      expect(el.getAttribute('stroke-width')).toBe('2');
    });

    it('accepts custom options', () => {
      const svg = createSVG(container);
      const el = line(svg, 0, 0, 10, 10, { stroke: '#f00', strokeWidth: 5, dashArray: '4,2' });
      expect(el.getAttribute('stroke')).toBe('#f00');
      expect(el.getAttribute('stroke-width')).toBe('5');
      expect(el.getAttribute('stroke-dasharray')).toBe('4,2');
    });
  });

  describe('path', () => {
    it('creates a path with d attribute', () => {
      const svg = createSVG(container);
      const el = path(svg, 'M 0 0 L 10 10');
      expect(el.tagName).toBe('path');
      expect(el.getAttribute('d')).toBe('M 0 0 L 10 10');
    });

    it('default fill is none', () => {
      const svg = createSVG(container);
      const el = path(svg, 'M 0 0');
      expect(el.getAttribute('fill')).toBe('none');
    });
  });

  describe('circle', () => {
    it('creates circle with correct attributes', () => {
      const svg = createSVG(container);
      const el = circle(svg, 50, 60, 25);
      expect(el.getAttribute('cx')).toBe('50');
      expect(el.getAttribute('cy')).toBe('60');
      expect(el.getAttribute('r')).toBe('25');
    });
  });

  describe('ellipse', () => {
    it('creates ellipse with correct attributes', () => {
      const svg = createSVG(container);
      const el = ellipse(svg, 50, 60, 30, 20);
      expect(el.getAttribute('cx')).toBe('50');
      expect(el.getAttribute('rx')).toBe('30');
      expect(el.getAttribute('ry')).toBe('20');
    });

    it('applies transform', () => {
      const svg = createSVG(container);
      const el = ellipse(svg, 50, 60, 30, 20, { transform: 'rotate(45)' });
      expect(el.getAttribute('transform')).toBe('rotate(45)');
    });
  });

  describe('rect', () => {
    it('creates rect with dimensions', () => {
      const svg = createSVG(container);
      const el = rect(svg, 10, 20, 100, 50);
      expect(el.getAttribute('x')).toBe('10');
      expect(el.getAttribute('y')).toBe('20');
      expect(el.getAttribute('width')).toBe('100');
      expect(el.getAttribute('height')).toBe('50');
    });

    it('applies rx for rounded corners', () => {
      const svg = createSVG(container);
      const el = rect(svg, 0, 0, 10, 10, { rx: 4 });
      expect(el.getAttribute('rx')).toBe('4');
    });
  });

  describe('text', () => {
    it('creates text with content', () => {
      const svg = createSVG(container);
      const el = text(svg, 100, 50, 'Hello');
      expect(el.textContent).toBe('Hello');
      expect(el.getAttribute('x')).toBe('100');
    });

    it('applies font options', () => {
      const svg = createSVG(container);
      const el = text(svg, 0, 0, 'Test', { fontSize: 16, anchor: 'middle', fontWeight: 'bold' });
      expect(el.getAttribute('font-size')).toBe('16');
      expect(el.getAttribute('text-anchor')).toBe('middle');
      expect(el.getAttribute('font-weight')).toBe('bold');
    });
  });

  describe('dimensionArrow', () => {
    it('returns a group with line and text', () => {
      const svg = createSVG(container);
      const g = dimensionArrow(svg, 0, 0, 100, 0, '50mm');
      expect(g.tagName).toBe('g');
      expect(g.querySelector('line')).not.toBeNull();
      expect(g.querySelector('text').textContent).toBe('50mm');
    });
  });

  describe('label', () => {
    it('returns a group with leader line and text', () => {
      const svg = createSVG(container);
      const g = label(svg, 50, 50, 100, 100, 'My Label');
      expect(g.tagName).toBe('g');
      expect(g.querySelector('line')).not.toBeNull();
      expect(g.querySelector('text').textContent).toBe('My Label');
    });
  });

  describe('crossingGap', () => {
    it('creates a white line at crossing point', () => {
      const svg = createSVG(container);
      const el = crossingGap(svg, 50, 50, Math.PI / 4);
      expect(el.tagName).toBe('line');
      expect(el.getAttribute('stroke')).toBe('#fafafa');
      expect(el.getAttribute('stroke-linecap')).toBe('round');
    });
  });

  describe('gradient', () => {
    it('creates a linearGradient in defs', () => {
      const svg = createSVG(container);
      gradient(svg, 'testGrad', [['0%', '#fff'], ['100%', '#000']]);
      const grad = svg.querySelector('#testGrad');
      expect(grad).not.toBeNull();
      expect(grad.tagName).toBe('linearGradient');
      expect(grad.querySelectorAll('stop')).toHaveLength(2);
    });

    it('defaults to vertical direction', () => {
      const svg = createSVG(container);
      gradient(svg, 'vGrad', [['0%', '#fff'], ['100%', '#000']]);
      const grad = svg.querySelector('#vGrad');
      expect(grad.getAttribute('x2')).toBe('0%');
      expect(grad.getAttribute('y2')).toBe('100%');
    });

    it('supports horizontal direction', () => {
      const svg = createSVG(container);
      gradient(svg, 'hGrad', [['0%', '#fff'], ['100%', '#000']], 'horizontal');
      const grad = svg.querySelector('#hGrad');
      expect(grad.getAttribute('x2')).toBe('100%');
      expect(grad.getAttribute('y2')).toBe('0%');
    });
  });

  describe('crossingWithColor', () => {
    it('returns a group with 3 children in order: under, gap, over', () => {
      const svg = createSVG(container);
      const g = crossingWithColor(svg,
        'M 0 0 L 10 10', 'M 10 0 L 0 10',
        5, 5, Math.PI / 4, '#f00', '#00f'
      );
      expect(g.tagName).toBe('g');
      expect(g.children).toHaveLength(3);
      expect(g.children[0].tagName).toBe('path'); // under
      expect(g.children[1].tagName).toBe('line');  // gap
      expect(g.children[2].tagName).toBe('path'); // over
    });

    it('uses correct colors', () => {
      const svg = createSVG(container);
      const g = crossingWithColor(svg,
        'M 0 0 L 10 10', 'M 10 0 L 0 10',
        5, 5, 0, '#f00', '#00f'
      );
      expect(g.children[0].getAttribute('stroke')).toBe('#00f'); // under
      expect(g.children[2].getAttribute('stroke')).toBe('#f00'); // over
    });
  });

  describe('stepBadge', () => {
    it('returns a group with circle and number', () => {
      const svg = createSVG(container);
      const g = stepBadge(svg, 100, 100, 3, 5);
      expect(g.tagName).toBe('g');
      const circ = g.querySelector('circle');
      expect(circ).not.toBeNull();
      const texts = g.querySelectorAll('text');
      expect(texts.length).toBeGreaterThanOrEqual(1);
      expect(texts[0].textContent).toBe('3');
    });

    it('includes total label when totalSteps given', () => {
      const svg = createSVG(container);
      const g = stepBadge(svg, 100, 100, 2, 4);
      const texts = g.querySelectorAll('text');
      expect(texts).toHaveLength(2);
      expect(texts[1].textContent).toBe('of 4');
    });

    it('omits total label when not given', () => {
      const svg = createSVG(container);
      const g = stepBadge(svg, 100, 100, 1);
      const texts = g.querySelectorAll('text');
      expect(texts).toHaveLength(1);
    });
  });
});
