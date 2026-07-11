#!/usr/bin/env node
// EXKNOTS docs generator. Pre-renders the markdown resources to static HTML,
// copies in the interactive explorer + diagrams + assets, and emits a
// self-contained GitHub Pages site under docs/. Dev-only tooling — the app
// itself keeps its no-build status.
//
//   node scripts/build-docs.js        (or: npm run build:docs)
//
// Deps: marked (markdown), jsdom (DOM post-processing), @resvg/resvg-js (PNG
// favicons + OG image), svgo (optional diagram minify). All dev-only.

import { readFileSync, writeFileSync, rmSync, mkdirSync, cpSync, readdirSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { marked } from 'marked';
import { JSDOM } from 'jsdom';
import { Resvg } from '@resvg/resvg-js';
import { puzzleRegistry } from '../puzzles/registry.js';
import * as T from './templates.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DOCS = path.join(ROOT, 'docs');
const p = (...a) => path.join(ROOT, ...a);

const LOGOMARK = readFileSync(p('assets/brand/logomark.svg'), 'utf8').trim();
const warnings = [];
const warn = (m) => { warnings.push(m); console.warn('  ⚠ ' + m); };

marked.setOptions({ gfm: true });

/* ---- GitHub-compatible heading slugger ---------------------------------- */
export function ghSlug(text) {
  return String(text).trim().toLowerCase()
    .replace(/[^\w\s-]/g, '')   // drop punctuation; keep [A-Za-z0-9_], space, hyphen (GitHub keeps leading numbers)
    .replace(/\s+/g, '-');
}
// number-less alias (strip a leading "12. " / "3) " etc.)
export function numberlessAlias(text) {
  const stripped = String(text).replace(/^\s*\d+\s*[.)]\s+/, '');
  const a = ghSlug(stripped);
  return a && a !== ghSlug(text) ? a : null;
}

/* ---- Registry → ordered puzzle records ---------------------------------- */
function moduleNumber(mod) {
  const m = mod.match(/puzzle-(\d+)\.js$/);
  if (!m) throw new Error(`registry module not recognized: ${mod}`);
  return m[1]; // zero-padded "11"
}
function findPuzzleMd(num) {
  const hit = readdirSync(p('puzzles')).find((f) => f.startsWith(num + '-') && f.endsWith('.md'));
  if (!hit) throw new Error(`no markdown for puzzle ${num}`);
  return hit; // "11-the-mirror-gate.md"
}
function extractPuzzleMeta(md) {
  const grab = (re) => (md.match(re)?.[1] || '').trim();
  return {
    h1Id: parseInt(grab(/^#\s+Puzzle\s+(\d+)\s*:/m), 10) || null,
    title: grab(/^#\s+Puzzle\s+\d+\s*:\s*(.+?)\s*$/m),
    metaDifficulty: grab(/^\*\*Difficulty:\*\*\s*(.+?)\s*$/m),
    type: grab(/^\*\*Type:\*\*\s*(.+?)\s*$/m),
    principle: grab(/^\*\*(?:Topological\s+)?Principle:\*\*\s*(.+?)\s*$/m),
  };
}

let puzzles = []; // populated by loadPuzzles() in main()
export function loadPuzzles() {
  const list = puzzleRegistry.map((e) => {
    const num = moduleNumber(e.module);
    const mdFile = findPuzzleMd(num);
    const md = readFileSync(p('puzzles', mdFile), 'utf8');
    const meta = extractPuzzleMeta(md);
    if (meta.h1Id && meta.h1Id !== e.id)
      warn(`puzzle ${mdFile}: H1 says "Puzzle ${meta.h1Id}" but registry id is ${e.id}`);
    return {
      id: e.id, name: e.name, difficulty: e.difficulty, num,
      mdFile, mdPath: path.join('puzzles', mdFile),
      htmlName: mdFile.replace(/\.md$/, '.html'),
      arc: T.arcOf(e.id).n,
      metaDifficulty: meta.metaDifficulty, type: meta.type, principle: meta.principle,
    };
  });
  const expected = puzzleRegistry.length;
  if (list.length !== expected) throw new Error(`expected ${expected} puzzles, got ${list.length}`);
  const ids = list.map((x) => x.id).sort((a, b) => a - b);
  if (ids.join(',') !== Array.from({ length: expected }, (_, i) => i + 1).join(','))
    throw new Error(`puzzle ids are not 1..${expected} contiguous`);
  return list;
}

/* ---- Source → output path mapping --------------------------------------- */
function mapSourceToOutput(srcRel) {
  srcRel = srcRel.replace(/^\.\//, '');
  if (srcRel === 'README.md') return 'index.html';
  if (srcRel.endsWith('.md')) return srcRel.replace(/\.md$/, '.html');
  return srcRel; // images, etc. — unchanged (tree mirrors source)
}

/* ---- Markdown → HTML with post-processing ------------------------------- */
// sourceDir: dir of the md relative to ROOT ('puzzles' | 'theory' | 'construction')
// outDir:    dir of the output html relative to DOCS (same set)
function renderMarkdown(md, { sourceDir, outDir, collectToc = true }) {
  const rawHtml = marked.parse(md);
  const dom = new JSDOM(`<!doctype html><body>${rawHtml}</body>`);
  const doc = dom.window.document;
  const body = doc.body;

  // 1. Remove an inline "Table of Contents" section (the sticky rail replaces it)
  for (const h of [...body.querySelectorAll('h2')]) {
    if (h.textContent.trim().toLowerCase() === 'table of contents') {
      let node = h.nextElementSibling;
      h.remove();
      while (node && !/^H[12]$/.test(node.tagName)) { const next = node.nextElementSibling; node.remove(); node = next; }
    }
  }

  // 2. Heading ids + number-less aliases + anchor links; collect TOC (h2 only)
  const slugCounts = new Map();
  const toc = [];
  for (const h of [...body.querySelectorAll('h2, h3')]) {
    const text = h.textContent.trim();
    let id = ghSlug(text);
    if (slugCounts.has(id)) { const n = slugCounts.get(id) + 1; slugCounts.set(id, n); id = `${id}-${n}`; }
    else slugCounts.set(id, 0);
    h.id = id;
    const alias = numberlessAlias(text);
    if (alias && !slugCounts.has(alias)) {
      slugCounts.set(alias, 0);
      const span = doc.createElement('span');
      span.id = alias; span.className = 'anchor-alias';
      h.parentNode.insertBefore(span, h);
    }
    const a = doc.createElement('a');
    a.href = '#' + id; a.className = 'anchor-link'; a.setAttribute('aria-hidden', 'true'); a.textContent = '#';
    h.appendChild(doc.createTextNode(' ')); h.appendChild(a);
    if (collectToc && h.tagName === 'H2') toc.push({ level: 2, id, text });
  }

  // 3. Rewrite links
  for (const a of [...body.querySelectorAll('a[href]')]) {
    const href = a.getAttribute('href');
    if (/^(https?:|mailto:|tel:|#)/i.test(href)) continue;
    if (href.startsWith('/')) { // absolute-root → unlink, keep text
      warn(`absolute-root link unlinked: ${href} (in ${sourceDir})`);
      const span = doc.createElement('span'); span.innerHTML = a.innerHTML; a.replaceWith(span); continue;
    }
    const [pathPart, frag] = href.split('#');
    const srcTarget = path.posix.normalize(path.posix.join(sourceDir, pathPart || ''));
    const outTarget = mapSourceToOutput(srcTarget);
    let rel = path.posix.relative(outDir, outTarget);
    if (!rel.startsWith('.')) rel = './' + rel;
    a.setAttribute('href', rel + (frag ? '#' + frag : ''));
  }

  // 4. Diagrams → responsive <figure> with the tokenized SVG INLINED, so it
  //    inherits the page's --dia-* tokens and tracks the theme toggle.
  let diaK = 0;
  for (const img of [...body.querySelectorAll('img')]) {
    const src = img.getAttribute('src') || '';
    const alt = img.getAttribute('alt') || '';
    const srcFileRel = path.posix.normalize(path.posix.join(sourceDir, src));
    let svgText = null, vbW = 0, vbH = 0;
    try {
      svgText = readFileSync(p(srcFileRel), 'utf8').replace(/^﻿/, '').replace(/<\?xml[^>]*\?>\s*/, '').replace(/<!DOCTYPE[^>]*>\s*/i, '').trim();
      const vb = svgText.match(/viewBox\s*=\s*"([\d.\s-]+)"/);
      if (vb) { const n = vb[1].trim().split(/\s+/).map(Number); vbW = n[2]; vbH = n[3]; }
    } catch { warn(`diagram not found: ${srcFileRel} (in ${sourceDir})`); }

    const fig = doc.createElement('figure');
    fig.className = 'dia-figure' + (vbW && vbW < 360 ? ' dia-narrow' : vbW >= 500 ? ' dia-wide' : '');
    img.replaceWith(fig);

    if (svgText && svgText.startsWith('<svg')) {
      // namespace internal ids so markers/gradients don't collide across the
      // multiple SVGs inlined on one page
      const k = diaK++;
      for (const id of [...new Set([...svgText.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]))]) {
        const nid = `d${k}-${id}`;
        svgText = svgText.split(`id="${id}"`).join(`id="${nid}"`)
          .split(`url(#${id})`).join(`url(#${nid})`)
          .split(`href="#${id}"`).join(`href="#${nid}"`);
      }
      fig.innerHTML = svgText;
      const svgEl = fig.querySelector('svg');
      if (svgEl) {
        svgEl.classList.add('dia');
        svgEl.removeAttribute('width'); svgEl.removeAttribute('height');
        if (alt && !svgEl.querySelector('title')) svgEl.setAttribute('aria-label', alt);
      }
    } else {
      // fallback: external reference (kept under docs/diagrams/)
      const im = doc.createElement('img');
      im.className = 'dia'; im.setAttribute('src', src); im.setAttribute('alt', alt);
      im.setAttribute('loading', 'lazy'); im.setAttribute('decoding', 'async');
      if (vbW && vbH) { im.setAttribute('width', String(Math.round(vbW))); im.setAttribute('height', String(Math.round(vbH))); }
      fig.appendChild(im);
    }
    if (alt) { const cap = doc.createElement('figcaption'); cap.textContent = alt; fig.appendChild(cap); }

    // unwrap a now-empty enclosing <p>
    const par = fig.parentElement;
    if (par && par.tagName === 'P' && !par.textContent.trim()) par.replaceWith(fig);
  }

  // 5. Callouts from bold lead-ins
  for (const para of [...body.querySelectorAll('p')]) {
    const strong = para.querySelector(':scope > strong:first-child');
    if (!strong) continue;
    const label = strong.textContent.trim().replace(/:$/, '');
    let kind = null;
    if (/^Lesson$/i.test(label)) kind = 'lesson';
    else if (/^Physical Intuition$/i.test(label)) kind = 'intuition';
    if (!kind) continue;
    const div = doc.createElement('div');
    div.className = `callout callout--${kind}`;
    const lab = doc.createElement('span'); lab.className = 'callout-label'; lab.textContent = label;
    strong.remove();
    div.appendChild(lab);
    const body2 = doc.createElement('p'); body2.innerHTML = para.innerHTML.replace(/^\s*:?\s*/, '');
    div.appendChild(body2);
    para.replaceWith(div);
  }

  // 6. Wrap tables for horizontal scroll on mobile
  for (const tbl of [...body.querySelectorAll('table')]) {
    const wrap = doc.createElement('div'); wrap.className = 'table-wrap';
    tbl.replaceWith(wrap); wrap.appendChild(tbl);
  }

  return { html: body.innerHTML, toc };
}

/* ---- Build ---------------------------------------------------------------- */
function cleanRebuild() {
  if (!DOCS.endsWith(path.join('knotgames', 'docs')) && !DOCS.endsWith(`${path.sep}docs`))
    throw new Error(`refusing to rm unexpected path: ${DOCS}`);
  rmSync(DOCS, { recursive: true, force: true });
  mkdirSync(DOCS, { recursive: true });
}

function writeFile(relDocs, html) {
  const out = path.join(DOCS, relDocs);
  mkdirSync(path.dirname(out), { recursive: true });
  writeFileSync(out, html);
}

function copyExplorer() {
  const dst = path.join(DOCS, 'explore');
  mkdirSync(dst, { recursive: true });
  for (const f of ['index.html', 'app.js', 'style.css']) cpSync(p(f), path.join(dst, f));
  cpSync(p('lib'), path.join(dst, 'lib'), { recursive: true });
  mkdirSync(path.join(dst, 'puzzles'), { recursive: true });
  for (const f of readdirSync(p('puzzles')).filter((f) => f.endsWith('.js')))
    cpSync(p('puzzles', f), path.join(dst, 'puzzles', f));
}

function rasterize(svgPath, outPath, width) {
  try {
    const svg = readFileSync(svgPath, 'utf8');
    const r = new Resvg(svg, { fitTo: { mode: 'width', value: width }, font: { loadSystemFonts: true } });
    writeFileSync(outPath, r.render().asPng());
  } catch (e) { warn(`rasterize failed for ${path.basename(outPath)}: ${e.message}`); }
}

function makeOgImage() {
  // dark ground, trefoil mark, EXKNOTS wordmark + tagline (system serif/mono via resvg)
  const inner = LOGOMARK.replace('<svg', '<svg x="86" y="150" width="330" height="330"');
  const og = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630">
<style>
  .lm-strand{stroke:#ff7d5e;stroke-width:7.5;fill:none;stroke-linecap:round;stroke-linejoin:round}
  .lm-gap{stroke:#0e1320;stroke-width:12.5;stroke-linecap:round}
  .wm{font-family:'DejaVu Serif','Nimbus Roman',serif;fill:#f1ead9}
  .tg{font-family:'DejaVu Sans Mono',monospace;fill:#9bb6ff;letter-spacing:2px}
  .x{fill:#ff7d5e}
</style>
<rect width="1200" height="630" fill="#0e1320"/>
<rect width="1200" height="630" fill="url(#g)"/>
<defs><radialGradient id="g" cx="30%" cy="35%" r="80%">
  <stop offset="0%" stop-color="#1b2750"/><stop offset="100%" stop-color="#0e1320"/>
</radialGradient></defs>
<g opacity="0.9">${inner}</g>
<text class="wm" x="458" y="298" font-size="118">E<tspan class="x">X</tspan>KNOTS</text>
<text class="tg" x="462" y="362" font-size="29">${puzzleRegistry.length} TOPOLOGICAL HAND PUZZLES</text>
<text class="tg" x="462" y="404" font-size="21" fill="#8a8475">solve it · rotate it · build it</text>
</svg>`;
  const tmp = path.join(DOCS, 'assets/brand/_og.svg');
  writeFileSync(tmp, og);
  rasterize(tmp, path.join(DOCS, 'assets/brand/og-image.png'), 1200);
  rmSync(tmp, { force: true });
}

function writeMisc() {
  writeFile('.nojekyll', '');
  const pages = ['', 'puzzles/', 'theory/', 'construction/materials.html', 'explore/',
    'theory/topology-primer.html', 'theory/pedagogical-arc.html',
    ...puzzles.map((x) => `puzzles/${x.htmlName}`)];
  const urls = pages.map((u) => {
    const loc = `${T.SITE}/${u}`.replace(/\/$/, u ? '/' : '/');
    return `  <url><loc>${loc}</loc></url>`;
  }).join('\n');
  writeFile('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
  writeFile('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${T.SITE}/sitemap.xml\n`);
  // themed 404 (assets at root depth)
  writeFile('404.html', T.pageShell({
    rel: '.', current: '', logomark: LOGOMARK, puzzles, canonical: '404.html',
    title: 'Not Found', desc: 'Page not found.',
    content: `<section class="hero"><div class="wrap"><h1 class="hero-word" style="font-size:clamp(3rem,10vw,6rem)">404</h1><p class="hero-tag">That knot isn't here.</p><div class="hero-cta"><a class="btn btn--primary" href="./index.html">▶ Home</a><a class="btn btn--ghost" href="./puzzles/">All puzzles</a></div></div></section>`,
  }));
}

function renderDoc(srcRel, outRel, current, eyebrow, lead, descr) {
  const md = readFileSync(p(srcRel), 'utf8');
  const title = (md.match(/^#\s+(.+?)\s*$/m)?.[1] || '').trim();
  const body = md.replace(/^#\s+.+?\n/, '');
  const outDir = path.posix.dirname(outRel);
  const { html, toc } = renderMarkdown(body, { sourceDir: path.posix.dirname(srcRel), outDir });
  writeFile(outRel, T.articlePage({
    rel: '..', logomark: LOGOMARK, puzzles, current,
    canonical: outRel, title, desc: descr || lead,
    header: T.theoryHeader(title, eyebrow, lead),
    bodyHtml: html, tocHtml: T.tocFromHeadings(toc),
  }));
}

export function build() {
  console.log('Building docs/ …');
  puzzles = loadPuzzles();
  cleanRebuild();

  // assets (css/js/brand svg) then generated rasters
  cpSync(p('assets'), path.join(DOCS, 'assets'), { recursive: true });
  rasterize(p('assets/brand/favicon.svg'), path.join(DOCS, 'assets/brand/favicon-32.png'), 32);
  rasterize(p('assets/brand/favicon.svg'), path.join(DOCS, 'assets/brand/favicon-180.png'), 180);
  makeOgImage();

  // diagrams + explorer
  cpSync(p('diagrams'), path.join(DOCS, 'diagrams'), { recursive: true });
  copyExplorer();

  // landing + index pages
  writeFile('index.html', T.landingPage({ rel: '.', logomark: LOGOMARK, puzzles }));
  writeFile('puzzles/index.html', T.catalogPage({ rel: '..', logomark: LOGOMARK, puzzles }));
  writeFile('theory/index.html', T.theoryIndexPage({ rel: '..', logomark: LOGOMARK, puzzles }));

  // puzzle pages
  for (const pz of puzzles) {
    const md = readFileSync(p(pz.mdPath), 'utf8');
    const body = md.split(/\n---\s*\n/).slice(1).join('\n---\n') || md.replace(/^#[^\n]*\n/, '');
    const { html, toc } = renderMarkdown(body, { sourceDir: 'puzzles', outDir: 'puzzles' });
    const idx = puzzles.findIndex((x) => x.id === pz.id);
    const prev = puzzles[idx - 1], next = puzzles[idx + 1];
    writeFile(`puzzles/${pz.htmlName}`, T.articlePage({
      rel: '..', logomark: LOGOMARK, puzzles, current: 'puzzles',
      canonical: `puzzles/${pz.htmlName}`, title: pz.name,
      desc: `${pz.name} — ${pz.principle || 'a topological puzzle'}. Setup, solution, topology, and construction.`,
      header: T.puzzleHeader('..', pz),
      bodyHtml: html, tocHtml: T.tocFromHeadings(toc),
      prevNext: T.prevNextHtml('..', prev, next),
    }));
  }

  // theory + construction pages
  renderDoc('theory/topology-primer.md', 'theory/topology-primer.html', 'theory', 'Theory',
    'Every concept used in the series — read it once, refer back often.', 'A self-contained topology primer: linking number, genus, chirality, braid groups, Seifert surfaces, the Hopf fibration, and more.');
  renderDoc('theory/pedagogical-arc.md', 'theory/pedagogical-arc.html', 'theory', 'Pedagogy',
    'Why the puzzles are ordered the way they are.', `The learning sequence behind the ${puzzleRegistry.length} puzzles, with time estimates and a concept map.`);
  renderDoc('construction/materials.md', 'construction/materials.html', 'build', 'Workshop',
    'Shared materials and construction techniques for building the puzzles.', 'Bill of materials, bending/welding notes, ring sizing, and prototyping advice for the EXKNOTS series.');

  writeMisc();

  console.log(`✓ Built docs/ — ${puzzles.length} puzzles, 3 reference pages, landing + 2 indexes.`);
  if (warnings.length) console.log(`  ${warnings.length} warning(s).`);
  return warnings;
}

// run the build only when invoked directly (so tests can import the helpers)
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) build();
