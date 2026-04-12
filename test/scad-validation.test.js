// Validates that OpenSCAD puzzle files compile without errors.
// Tests the assembly view for each puzzle (runs assertions, checks syntax).
// For comprehensive per-part validation, use: npm run validate:scad
import { describe, it, expect } from 'vitest';
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const OPENSCAD = '/usr/bin/openscad';
const HAS_OPENSCAD = existsSync(OPENSCAD);

const SCAD_DIR = resolve(import.meta.dirname, '..', 'scad');

function compileScad(scadPath, part) {
  return new Promise((resolve, reject) => {
    execFile(OPENSCAD, [
      '-o', '/dev/null',
      '--export-format', 'stl',
      '-D', `part="${part}"`,
      scadPath,
    ], { timeout: 120000 }, (error, stdout, stderr) => {
      if (error) reject(new Error(`OpenSCAD failed: ${stderr || error.message}`));
      else resolve(stderr);
    });
  });
}

// Test assembly view for each puzzle (exercises assertions + full geometry).
// Individual part tests are handled by scripts/validate-scad.sh.
const PUZZLES = [
  'puzzle_01/gatekeeper.scad',
  'puzzle_02/shepherds_yoke.scad',
  'puzzle_03/prisoners_ring.scad',
  'puzzle_04/mobius_snare.scad',
  'puzzle_05/trinity_lock.scad',
  'puzzle_06/devils_pitchfork.scad',
  'puzzle_07/ferrymans_knot.scad',
  'puzzle_08/ouroboros_chain.scad',
  'puzzle_09/genus_trap.scad',
  'puzzle_10/hopf_paradox.scad',
];

describe.skipIf(!HAS_OPENSCAD)('OpenSCAD compilation', () => {
  for (const file of PUZZLES) {
    it(`${file} compiles (assembly)`, async () => {
      const scadPath = resolve(SCAD_DIR, file);
      expect(existsSync(scadPath), `${scadPath} should exist`).toBe(true);
      await compileScad(scadPath, 'assembly');
    }, 120000);
  }
});
