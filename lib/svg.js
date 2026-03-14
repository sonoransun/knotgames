// SVG diagram helper functions

const SVG_NS = 'http://www.w3.org/2000/svg';

export function createSVG(container, width = 600, height = 400) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.style.maxWidth = width + 'px';
  svg.style.background = '#fafafa';
  svg.style.borderRadius = '8px';

  // Arrowhead marker definition
  const defs = document.createElementNS(SVG_NS, 'defs');
  const marker = document.createElementNS(SVG_NS, 'marker');
  marker.setAttribute('id', 'arrowhead');
  marker.setAttribute('markerWidth', '8');
  marker.setAttribute('markerHeight', '6');
  marker.setAttribute('refX', '8');
  marker.setAttribute('refY', '3');
  marker.setAttribute('orient', 'auto');
  const arrowPath = document.createElementNS(SVG_NS, 'path');
  arrowPath.setAttribute('d', 'M0,0 L8,3 L0,6 Z');
  arrowPath.setAttribute('fill', '#999');
  marker.appendChild(arrowPath);
  defs.appendChild(marker);

  // Reverse arrowhead
  const marker2 = marker.cloneNode(true);
  marker2.setAttribute('id', 'arrowhead-rev');
  marker2.setAttribute('orient', 'auto-start-reverse');
  defs.appendChild(marker2);

  svg.appendChild(defs);
  container.appendChild(svg);
  return svg;
}

export function line(svg, x1, y1, x2, y2, opts = {}) {
  const el = document.createElementNS(SVG_NS, 'line');
  el.setAttribute('x1', x1);
  el.setAttribute('y1', y1);
  el.setAttribute('x2', x2);
  el.setAttribute('y2', y2);
  el.setAttribute('stroke', opts.stroke || '#333');
  el.setAttribute('stroke-width', opts.strokeWidth || 2);
  if (opts.dashArray) el.setAttribute('stroke-dasharray', opts.dashArray);
  if (opts.opacity) el.setAttribute('opacity', opts.opacity);
  svg.appendChild(el);
  return el;
}

export function path(svg, d, opts = {}) {
  const el = document.createElementNS(SVG_NS, 'path');
  el.setAttribute('d', d);
  el.setAttribute('stroke', opts.stroke || '#333');
  el.setAttribute('stroke-width', opts.strokeWidth || 2);
  el.setAttribute('fill', opts.fill || 'none');
  if (opts.dashArray) el.setAttribute('stroke-dasharray', opts.dashArray);
  if (opts.strokeLinecap) el.setAttribute('stroke-linecap', opts.strokeLinecap);
  svg.appendChild(el);
  return el;
}

export function circle(svg, cx, cy, r, opts = {}) {
  const el = document.createElementNS(SVG_NS, 'circle');
  el.setAttribute('cx', cx);
  el.setAttribute('cy', cy);
  el.setAttribute('r', r);
  el.setAttribute('fill', opts.fill || 'none');
  el.setAttribute('stroke', opts.stroke || '#333');
  el.setAttribute('stroke-width', opts.strokeWidth || 2);
  svg.appendChild(el);
  return el;
}

export function ellipse(svg, cx, cy, rx, ry, opts = {}) {
  const el = document.createElementNS(SVG_NS, 'ellipse');
  el.setAttribute('cx', cx);
  el.setAttribute('cy', cy);
  el.setAttribute('rx', rx);
  el.setAttribute('ry', ry);
  el.setAttribute('fill', opts.fill || 'none');
  el.setAttribute('stroke', opts.stroke || '#333');
  el.setAttribute('stroke-width', opts.strokeWidth || 2);
  if (opts.transform) el.setAttribute('transform', opts.transform);
  svg.appendChild(el);
  return el;
}

export function rect(svg, x, y, w, h, opts = {}) {
  const el = document.createElementNS(SVG_NS, 'rect');
  el.setAttribute('x', x);
  el.setAttribute('y', y);
  el.setAttribute('width', w);
  el.setAttribute('height', h);
  el.setAttribute('fill', opts.fill || 'none');
  el.setAttribute('stroke', opts.stroke || '#333');
  el.setAttribute('stroke-width', opts.strokeWidth || 2);
  if (opts.rx) el.setAttribute('rx', opts.rx);
  svg.appendChild(el);
  return el;
}

export function text(svg, x, y, content, opts = {}) {
  const el = document.createElementNS(SVG_NS, 'text');
  el.setAttribute('x', x);
  el.setAttribute('y', y);
  el.setAttribute('font-size', opts.fontSize || 12);
  el.setAttribute('font-family', opts.fontFamily || 'system-ui, sans-serif');
  el.setAttribute('fill', opts.fill || '#333');
  if (opts.anchor) el.setAttribute('text-anchor', opts.anchor);
  if (opts.dominantBaseline) el.setAttribute('dominant-baseline', opts.dominantBaseline);
  if (opts.fontWeight) el.setAttribute('font-weight', opts.fontWeight);
  el.textContent = content;
  svg.appendChild(el);
  return el;
}

export function dimensionArrow(svg, x1, y1, x2, y2, label) {
  const g = document.createElementNS(SVG_NS, 'g');
  g.setAttribute('class', 'dimension');

  const lineEl = document.createElementNS(SVG_NS, 'line');
  lineEl.setAttribute('x1', x1);
  lineEl.setAttribute('y1', y1);
  lineEl.setAttribute('x2', x2);
  lineEl.setAttribute('y2', y2);
  lineEl.setAttribute('stroke', '#999');
  lineEl.setAttribute('stroke-width', 0.75);
  lineEl.setAttribute('marker-end', 'url(#arrowhead)');
  lineEl.setAttribute('marker-start', 'url(#arrowhead-rev)');
  g.appendChild(lineEl);

  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const textEl = document.createElementNS(SVG_NS, 'text');
  textEl.setAttribute('x', mx);
  textEl.setAttribute('y', my - 5);
  textEl.setAttribute('font-size', 10);
  textEl.setAttribute('font-family', 'system-ui, sans-serif');
  textEl.setAttribute('fill', '#999');
  textEl.setAttribute('text-anchor', 'middle');
  textEl.textContent = label;
  g.appendChild(textEl);

  svg.appendChild(g);
  return g;
}

export function label(svg, x, y, targetX, targetY, content) {
  const g = document.createElementNS(SVG_NS, 'g');
  g.setAttribute('class', 'label');

  // Leader line
  const lineEl = document.createElementNS(SVG_NS, 'line');
  lineEl.setAttribute('x1', x);
  lineEl.setAttribute('y1', y);
  lineEl.setAttribute('x2', targetX);
  lineEl.setAttribute('y2', targetY);
  lineEl.setAttribute('stroke', '#aaa');
  lineEl.setAttribute('stroke-width', 0.5);
  lineEl.setAttribute('stroke-dasharray', '3,2');
  g.appendChild(lineEl);

  const textEl = document.createElementNS(SVG_NS, 'text');
  textEl.setAttribute('x', x);
  textEl.setAttribute('y', y - 4);
  textEl.setAttribute('font-size', 10);
  textEl.setAttribute('font-family', 'system-ui, sans-serif');
  textEl.setAttribute('fill', '#666');
  textEl.setAttribute('text-anchor', 'middle');
  textEl.textContent = content;
  g.appendChild(textEl);

  svg.appendChild(g);
  return g;
}

// Draw a white gap on a path at a crossing point (for under-crossings in knot diagrams)
export function crossingGap(svg, cx, cy, angle, gapWidth = 12) {
  const dx = Math.cos(angle) * gapWidth / 2;
  const dy = Math.sin(angle) * gapWidth / 2;
  const gap = document.createElementNS(SVG_NS, 'line');
  gap.setAttribute('x1', cx - dx);
  gap.setAttribute('y1', cy - dy);
  gap.setAttribute('x2', cx + dx);
  gap.setAttribute('y2', cy + dy);
  gap.setAttribute('stroke', '#fafafa');
  gap.setAttribute('stroke-width', 8);
  gap.setAttribute('stroke-linecap', 'round');
  svg.appendChild(gap);
  return gap;
}
