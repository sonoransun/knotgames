// Tests for the docs generator: the GitHub-compatible slugger (the highest-risk
// correctness item — puzzle cross-links depend on it), the registry→puzzle
// mapping, and link/diagram integrity over the committed docs/ tree.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { ghSlug, numberlessAlias, loadPuzzles } from '../scripts/build-docs.js';
import { puzzleRegistry } from '../puzzles/registry.js';

const N = puzzleRegistry.length;

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = path.join(ROOT, 'docs');

describe('ghSlug (GitHub-compatible heading anchors)', () => {
  it('matches GitHub slugs for numbered primer headings', () => {
    expect(ghSlug('1. What Is Topology?')).toBe('1-what-is-topology');
    expect(ghSlug('12. Chirality and Handedness')).toBe('12-chirality-and-handedness');
    expect(ghSlug('18. Satellite Knots and JSJ Decomposition')).toBe('18-satellite-knots-and-jsj-decomposition');
    expect(ghSlug('2. Curves: Open vs. Closed')).toBe('2-curves-open-vs-closed');
  });
  it('produces number-less aliases that match the puzzle cross-links', () => {
    expect(numberlessAlias('12. Chirality and Handedness')).toBe('chirality-and-handedness');
    expect(numberlessAlias('3. Linking Number')).toBe('linking-number');
    expect(numberlessAlias('18. Satellite Knots and JSJ Decomposition')).toBe('satellite-knots-and-jsj-decomposition');
    // an unnumbered heading has no distinct alias
    expect(numberlessAlias('Glossary')).toBeNull();
  });
});

describe('registry → puzzles', () => {
  const puzzles = loadPuzzles();
  it('has one record per registry entry with contiguous display ids 1..N', () => {
    expect(puzzles).toHaveLength(N);
    expect(puzzles.map((p) => p.id).sort((a, b) => a - b)).toEqual([...Array(N)].map((_, i) => i + 1));
  });
  it('maps every puzzle to an existing markdown source', () => {
    for (const p of puzzles) expect(existsSync(path.join(ROOT, p.mdPath)), p.mdPath).toBe(true);
  });
  it('keeps the filename slug for output URLs (decoupled from display id)', () => {
    const mirror = puzzles.find((p) => p.name === 'The Mirror Gate');
    expect(mirror.id).toBe(5);               // display position
    expect(mirror.htmlName).toBe('11-the-mirror-gate.html'); // filename number
  });
});

const hasDocs = existsSync(path.join(DOCS, 'index.html'));
describe.skipIf(!hasDocs)('docs/ integrity (run `npm run build:docs` first)', () => {
  const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const f = path.join(d, e.name);
    if (e.isDirectory()) return ['explore', 'diagrams', 'assets'].includes(e.name) ? [] : walk(f);
    return f.endsWith('.html') ? [f] : [];
  });
  const pages = walk(DOCS);
  const idCache = new Map();
  const idsOf = (f) => {
    if (!idCache.has(f)) idCache.set(f, new Set([...new JSDOM(readFileSync(f, 'utf8')).window.document.querySelectorAll('[id]')].map((n) => n.id)));
    return idCache.get(f);
  };

  it('renders the landing, every puzzle, references, and the explorer', () => {
    expect(existsSync(path.join(DOCS, 'index.html'))).toBe(true);
    expect(existsSync(path.join(DOCS, 'explore/index.html'))).toBe(true);
    expect(existsSync(path.join(DOCS, 'theory/topology-primer.html'))).toBe(true);
    expect(existsSync(path.join(DOCS, 'construction/materials.html'))).toBe(true);
    expect(existsSync(path.join(DOCS, '.nojekyll'))).toBe(true);
    expect(pages.filter((f) => /\/puzzles\/\d\d-/.test(f))).toHaveLength(N);
  });

  it('has no absolute-root links (they 404 under the /knotgames/ base path)', () => {
    const offenders = [];
    for (const f of pages)
      for (const a of new JSDOM(readFileSync(f, 'utf8')).window.document.querySelectorAll('a[href^="/"]'))
        offenders.push(`${path.relative(DOCS, f)} → ${a.getAttribute('href')}`);
    expect(offenders).toEqual([]);
  });

  it('resolves every intra-doc anchored link to a real element id', () => {
    const broken = [];
    for (const f of pages) {
      for (const a of new JSDOM(readFileSync(f, 'utf8')).window.document.querySelectorAll('a[href]')) {
        const href = a.getAttribute('href');
        if (/^(https?:|mailto:|tel:|#)/i.test(href) || href.startsWith('/')) continue;
        let [p0, frag] = href.split('#');
        let target = p0 ? path.normalize(path.join(path.dirname(f), p0)) : f;
        if (target.endsWith(path.sep) || target.endsWith('/')) target = path.join(target, 'index.html');
        if (!existsSync(target)) { broken.push(`${path.relative(DOCS, f)} → ${href} (missing file)`); continue; }
        if (!frag) continue;
        if (target.includes(path.join('docs', 'explore'))) continue; // hash routes, not anchors
        if (!idsOf(target).has(decodeURIComponent(frag))) broken.push(`${path.relative(DOCS, f)} → ${href} (missing #${frag})`);
      }
    }
    expect(broken).toEqual([]);
  });

  it('inlines diagrams as <svg> inside <figure> (theme-aware)', () => {
    const primer = new JSDOM(readFileSync(path.join(DOCS, 'theory/topology-primer.html'), 'utf8')).window.document;
    const figs = primer.querySelectorAll('figure.dia-figure');
    expect(figs.length).toBeGreaterThan(0);
    expect([...figs].every((fig) => fig.querySelector('svg'))).toBe(true);
  });
});
