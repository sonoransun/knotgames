// Cross-validates dimensional constants between JS puzzle files and SCAD puzzle files.
// Pure JS test — does not require OpenSCAD to be installed.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');

// Extract a numeric constant from a JS or SCAD source file.
// JS:   const NAME = 42;
// SCAD: name = 42;
function extractConst(source, name) {
  // JS pattern: const/let/var NAME = number
  const jsMatch = source.match(new RegExp(`(?:const|let|var)\\s+${name}\\s*=\\s*([\\d.]+)`));
  if (jsMatch) return parseFloat(jsMatch[1]);
  // SCAD pattern: name = number (at start of line)
  const scadMatch = source.match(new RegExp(`^${name}\\s*=\\s*([\\d.]+)`, 'm'));
  if (scadMatch) return parseFloat(scadMatch[1]);
  return null;
}

// Dimension pairs to cross-validate.
// relation: 'equal' means jsVal === scadVal
//           'js_r_scad_d' means jsVal * 2 === scadVal (JS uses radius, SCAD uses diameter)
const CHECKS = [
  {
    js: 'puzzles/puzzle-01.js',
    scad: 'scad/puzzle_01/gatekeeper.scad',
    pairs: [
      { jsVar: 'BAR_WIDTH',   scadVar: 'p1_bar_width',   relation: 'equal' },
      { jsVar: 'BAR_HEIGHT',  scadVar: 'p1_bar_height',  relation: 'equal' },
      { jsVar: 'BEND_RADIUS', scadVar: 'p1_bend_radius', relation: 'equal' },
      { jsVar: 'RING_OD',     scadVar: 'p1_ring_od',     relation: 'equal' },
    ],
  },
  {
    js: 'puzzles/puzzle-02.js',
    scad: 'scad/puzzle_02/shepherds_yoke.scad',
    pairs: [
      { jsVar: 'PADDLE_W', scadVar: 'p2_paddle_w', relation: 'equal' },
      { jsVar: 'PADDLE_H', scadVar: 'p2_paddle_h', relation: 'equal' },
      { jsVar: 'PADDLE_D', scadVar: 'p2_paddle_d', relation: 'equal' },
      { jsVar: 'HOLE_R',   scadVar: 'p2_hole_d',   relation: 'js_r_scad_d' },
    ],
  },
  {
    js: 'puzzles/puzzle-03.js',
    scad: 'scad/puzzle_03/prisoners_ring.scad',
    pairs: [
      { jsVar: 'FRAME_W', scadVar: 'p3_frame_w', relation: 'equal' },
      { jsVar: 'FRAME_H', scadVar: 'p3_frame_h', relation: 'equal' },
    ],
  },
  {
    js: 'puzzles/puzzle-05.js',
    scad: 'scad/puzzle_05/trinity_lock.scad',
    pairs: [
      { jsVar: 'OVAL_LONG',  scadVar: 'p5_oval_long',  relation: 'js_r_scad_d' },
      { jsVar: 'OVAL_SHORT', scadVar: 'p5_oval_short', relation: 'js_r_scad_d' },
    ],
  },
  {
    js: 'puzzles/puzzle-08.js',
    scad: 'scad/puzzle_08/ouroboros_chain.scad',
    pairs: [
      { jsVar: 'POST_HEIGHT', scadVar: 'p8_post_h',  relation: 'equal' },
      { jsVar: 'POST_R',      scadVar: 'p8_post_d',  relation: 'js_r_scad_d' },
      { jsVar: 'BASE_W',      scadVar: 'p8_base_w',  relation: 'equal' },
      { jsVar: 'BASE_D',      scadVar: 'p8_base_d',  relation: 'equal' },
      // POST_SPACING (30 JS, 26 SCAD) and BASE_H (20 JS, 25 SCAD) intentionally
      // diverge — SCAD adapted dimensions for 220mm printer bed constraints.
    ],
  },
  {
    js: 'puzzles/puzzle-09.js',
    scad: 'scad/puzzle_09/genus_trap.scad',
    pairs: [
      { jsVar: 'BLOCK_W',  scadVar: 'p9_block_w',  relation: 'equal' },
      { jsVar: 'BLOCK_H',  scadVar: 'p9_block_h',  relation: 'equal' },
      { jsVar: 'BLOCK_D',  scadVar: 'p9_block_d',  relation: 'equal' },
      { jsVar: 'TUNNEL_R', scadVar: 'p9_tunnel_d',  relation: 'js_r_scad_d' },
    ],
  },
  {
    js: 'puzzles/puzzle-10.js',
    scad: 'scad/puzzle_10/hopf_paradox.scad',
    pairs: [
      { jsVar: 'HOOP_R', scadVar: 'p10_hoop_d', relation: 'js_r_scad_d' },
    ],
  },
];

describe('JS-SCAD dimension cross-validation', () => {
  for (const check of CHECKS) {
    const jsSource = readFileSync(resolve(ROOT, check.js), 'utf-8');
    const scadSource = readFileSync(resolve(ROOT, check.scad), 'utf-8');

    describe(`${check.js} <-> ${check.scad}`, () => {
      for (const { jsVar, scadVar, relation } of check.pairs) {
        it(`${jsVar} matches ${scadVar} (${relation})`, () => {
          const jsVal = extractConst(jsSource, jsVar);
          const scadVal = extractConst(scadSource, scadVar);
          expect(jsVal, `JS var ${jsVar} not found`).not.toBeNull();
          expect(scadVal, `SCAD var ${scadVar} not found`).not.toBeNull();
          if (relation === 'equal') {
            expect(jsVal).toBe(scadVal);
          } else if (relation === 'js_r_scad_d') {
            expect(jsVal * 2).toBe(scadVal);
          }
        });
      }
    });
  }
});
