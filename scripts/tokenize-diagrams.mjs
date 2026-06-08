#!/usr/bin/env node
// One-time (idempotent) codemod: convert the hand-authored diagram SVGs to a
// unified, theme-aware palette. For every SVG in diagrams/:
//   1. remove the baked full-canvas background rect (-> transparent)
//   2. map ~56 fragmented hex/named colors onto 12 semantic --dia-* tokens,
//      written as `var(--dia-x, <light-fallback>)` so the file still renders
//      standalone (e.g. on GitHub) while inheriting page tokens when inlined
//   3. ensure the root <svg> has role="img" (the existing <title> names it)
// Idempotent: re-running on already-tokenized files is a no-op.
//
//   node scripts/tokenize-diagrams.mjs

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIA = path.join(ROOT, 'diagrams');

// light fallbacks (kept in sync with the --dia-* tokens in assets/css/docs.css)
const FB = {
  surface: '#fbf7ee', ink: '#24211a', inksoft: '#6a6151', rigid: '#8a8275',
  faint: '#c9bda7', cord: '#1f57c4', neg: '#cf3a26', pos: '#2f8f43',
  ring: '#b97d12', gold: '#c79a22', wood: '#b07d52', wash: '#ece3d0',
};
const COLOR = {
  '#fafafa': 'surface', '#fff': 'surface', '#ffffff': 'surface', white: 'surface', '#fdf8f0': 'surface', '#e8e0d8': 'surface',
  '#333': 'ink', '#444': 'ink', '#000': 'ink', '#000000': 'ink', black: 'ink',
  '#555': 'inksoft', '#666': 'inksoft',
  '#777': 'rigid', '#888': 'rigid', '#999': 'rigid',
  '#aaa': 'faint', '#bbb': 'faint', '#ccc': 'faint', '#ddd': 'faint', '#c0c0c0': 'faint', '#c8c8c8': 'faint', '#eee': 'faint', '#e8e8e8': 'faint',
  '#2255aa': 'cord', '#44c': 'cord', '#4444cc': 'cord', '#3333dd': 'cord', '#5588cc': 'cord', '#446': 'cord', '#4a90d9': 'cord',
  '#c44': 'neg', '#cc4444': 'neg', '#dd3333': 'neg', '#a40': 'neg',
  '#33aa33': 'pos', '#2a9d2a': 'pos', '#27ae60': 'pos', '#0a0': 'pos', '#4a4': 'pos', '#2a2': 'pos', '#070': 'pos', '#0a6': 'pos',
  '#cc8800': 'ring', '#aa9000': 'ring', '#b90': 'ring', '#8b6914': 'ring', '#6b4f10': 'ring',
  '#ddcc33': 'gold', '#ccaa44': 'gold', '#ca4': 'gold', '#dc3': 'gold', '#b0a070': 'gold',
  '#c4956a': 'wood', '#a07050': 'wood',
  '#eeffee': 'wash', '#aaccee': 'wash', '#f0f0ff': 'wash', '#fff5f5': 'wash', '#ffeeee': 'wash', '#e8f0ff': 'wash', '#f5f5ff': 'wash', '#f5fff5': 'wash',
};
const tokenVal = (name) => `var(--dia-${name}, ${FB[name]})`;
const SURFACE_HEX = new Set(['#fafafa', '#fff', '#ffffff', '#fdf8f0', '#e8e0d8']);

function parseAttrs(tag) {
  const a = {};
  for (const m of tag.matchAll(/([\w:-]+)\s*=\s*"([^"]*)"/g)) a[m[1]] = m[2];
  return a;
}

function tokenize(svg) {
  // viewBox dims (for bg-rect detection)
  let vbW = 0, vbH = 0;
  const vb = svg.match(/viewBox\s*=\s*"([\d.\s-]+)"/);
  if (vb) { const n = vb[1].trim().split(/\s+/).map(Number); vbW = n[2]; vbH = n[3]; }

  // 1. remove full-canvas background rect(s)
  svg = svg.replace(/<rect\b[^>]*\/?>(?:<\/rect>)?/g, (tag) => {
    const at = parseAttrs(tag);
    const fill = (at.fill || '').toLowerCase();
    if (!SURFACE_HEX.has(fill) && fill !== 'white') return tag;
    const w = parseFloat(at.width), h = parseFloat(at.height);
    const x = parseFloat(at.x || '0'), y = parseFloat(at.y || '0');
    const spansCanvas = vbW && Math.abs(w - vbW) <= 1 && Math.abs(h - vbH) <= 1 && Math.abs(x) <= 1 && Math.abs(y) <= 1;
    return spansCanvas ? '' : tag;
  });

  // 2. map colors on presentation attributes
  svg = svg.replace(/\b(fill|stroke|stop-color|flood-color)="([^"]+)"/g, (full, attr, val) => {
    const key = val.trim().toLowerCase();
    if (key === 'none') return full;
    const token = COLOR[key];
    return token ? `${attr}="${tokenVal(token)}"` : full;
  });
  // also inside style="..." blocks
  svg = svg.replace(/style="([^"]*)"/g, (full, body) => {
    const nb = body.replace(/(fill|stroke|stop-color|flood-color)\s*:\s*([^;]+)/g, (m, prop, val) => {
      const key = val.trim().toLowerCase();
      if (key === 'none') return m;
      const token = COLOR[key];
      return token ? `${prop}:${tokenVal(token)}` : m;
    });
    return `style="${nb}"`;
  });

  // 3. ensure role="img" on the root svg
  svg = svg.replace(/<svg\b(?![^>]*\brole=)/, '<svg role="img"');

  return svg;
}

function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const fp = path.join(dir, f);
    return statSync(fp).isDirectory() ? walk(fp) : fp.endsWith('.svg') ? [fp] : [];
  });
}

let n = 0;
for (const file of walk(DIA)) {
  const before = readFileSync(file, 'utf8');
  const after = tokenize(before);
  if (after !== before) { writeFileSync(file, after); n++; }
}
console.log(`tokenized ${n} of ${walk(DIA).length} diagram SVGs`);
