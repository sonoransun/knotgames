// EXKNOTS docs — HTML chrome + page templates. Pure string builders, no DOM.
// Consumed by scripts/build-docs.js. All asset/nav links are RELATIVE (computed
// from each page's depth via `rel`); only canonical/OG URLs are absolute.

export const SITE = 'https://sonoransun.github.io/knotgames';
export const REPO = 'https://github.com/sonoransun/knotgames';

export const ARCS = [
  { n: 1, title: 'Things Are Not What They Seem', range: [1, 5],  blurb: 'Unknots, model inversion, linking number, non-orientable surfaces, and chirality — first lessons in topological intuition.' },
  { n: 2, title: 'Structure Matters',             range: [6, 9],  blurb: 'Brunnian links, Borromean rings, multi-step disentanglement, and the unknotting number.' },
  { n: 3, title: 'Deep Mathematics Is Physical',  range: [10, 12], blurb: 'The Hopf link, genus and handles, and the Hopf fibration made tactile.' },
  { n: 4, title: 'Classification and Construction', range: [13, 17], blurb: 'Braid groups, torus knots, tricolorability, Seifert surfaces, and satellite knots.' },
  { n: 5, title: 'The Limits and Language of Invariants', range: [18, 20], blurb: 'Where linking number fails, where the Conway fraction succeeds, and what connected sums hide from your invariants.' },
];
export const arcOf = (id) => ARCS.find((a) => id >= a.range[0] && id <= a.range[1]) || ARCS[0];

export const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// wordmark with the X drawn as the riso accent
const wordmark = (cls = 'brand-word') => {
  const w = 'EXKNOTS'.split('').map((c) => (c === 'X' ? '<span class="x">X</span>' : c)).join('');
  return `<span class="${cls}">${w}</span>`;
};

function head({ title, desc, rel, canonical }) {
  const t = title ? `${esc(title)} · EXKNOTS` : 'EXKNOTS — 20 Topological Hand Puzzles';
  const d = esc(desc || 'Twenty topological hand-dexterity puzzles you solve with your fingers — each with a 2D diagram, a rotatable 3D model, an animated solution, and the mathematics behind it.');
  const url = `${SITE}/${canonical || ''}`.replace(/\/$/, canonical ? '' : '/');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${t}</title>
<meta name="description" content="${d}">
<link rel="canonical" href="${url}">
<meta name="theme-color" content="#0f1320">
<meta property="og:type" content="website">
<meta property="og:site_name" content="EXKNOTS">
<meta property="og:title" content="${esc(title || 'EXKNOTS — 20 Topological Hand Puzzles')}">
<meta property="og:description" content="${d}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/assets/brand/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${SITE}/assets/brand/og-image.png">
<link rel="icon" href="${rel}/assets/brand/favicon.svg" type="image/svg+xml">
<link rel="icon" href="${rel}/assets/brand/favicon-32.png" sizes="32x32">
<link rel="apple-touch-icon" href="${rel}/assets/brand/favicon-180.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500;700&family=Newsreader:ital,opsz,wght@0,6..72,300..700;1,6..72,300..600&display=swap">
<link rel="stylesheet" href="${rel}/assets/css/docs.css">
</head>`;
}

function nav({ rel, current, logomark }) {
  const link = (key, label, href, extra = '') =>
    `<li><a href="${href}"${current === key ? ' aria-current="page"' : ''}${extra}>${label}</a></li>`;
  return `<nav class="nav" aria-label="Primary">
  <a class="brand" href="${rel}/index.html" aria-label="EXKNOTS home">${logomark}${wordmark()}</a>
  <button class="nav-burger" aria-label="Menu" aria-expanded="false" aria-controls="nav-links">☰</button>
  <ul class="nav-links" id="nav-links">
    ${link('explore', 'Explore', `${rel}/explore/`)}
    ${link('puzzles', 'Puzzles', `${rel}/puzzles/`)}
    ${link('theory', 'Theory', `${rel}/theory/`)}
    ${link('build', 'Build', `${rel}/construction/materials.html`)}
    <li><a href="${REPO}">GitHub ↗</a></li>
    ${link('explore', 'Open Explorer', `${rel}/explore/`, ' class="cta"')}
  </ul>
  <button class="theme-toggle" aria-label="Toggle dark mode" aria-pressed="false" title="Toggle theme"><span class="sun">☀</span><span class="moon">☾</span></button>
</nav>`;
}

function footer({ rel, logomark, puzzles }) {
  const cols = ARCS.map((a) => {
    const items = puzzles
      .filter((p) => p.id >= a.range[0] && p.id <= a.range[1])
      .map((p) => `<li><a href="${rel}/puzzles/${p.htmlName}">${p.id}. ${esc(p.name)}</a></li>`)
      .join('');
    return `<div><h4>Arc ${a.n}</h4><ul>${items}</ul></div>`;
  }).join('');
  return `<footer class="foot">
  <div class="wrap">
    <div class="foot-grid">
      <div>
        <a class="brand" href="${rel}/index.html" style="color:#ece5d6">${logomark}${wordmark()}</a>
        <p style="margin:.8rem 0 0;max-width:30ch;font-size:.92rem">Topology you solve with your hands — 20 puzzles, their solutions, and the mathematics behind them.</p>
      </div>
      ${cols}
    </div>
    <div class="foot-fine">
      <span>EXKNOTS · MIT License</span>
      <span><a href="${rel}/theory/topology-primer.html">Topology Primer</a> · <a href="${rel}/construction/materials.html">Build Guide</a> · <a href="${REPO}">Source ↗</a></span>
    </div>
  </div>
</footer>`;
}

// Full page shell. `content` is the <main> inner HTML.
export function pageShell({ title, desc, rel, canonical, current, content, bodyClass = '', logomark, puzzles, progress = false }) {
  return `${head({ title, desc, rel, canonical })}
<body${bodyClass ? ` class="${bodyClass}"` : ''}>
<a class="skip-link" href="#main">Skip to content</a>
${nav({ rel, current, logomark })}
${progress ? '<div class="progress" role="presentation"></div>' : ''}
<main id="main">
${content}
</main>
${footer({ rel, logomark, puzzles })}
<script src="${rel}/assets/js/docs.js" defer></script>
</body>
</html>`;
}

// ---- Page builders --------------------------------------------------------

export function landingPage({ rel, logomark, puzzles }) {
  const arcCards = ARCS.map((a) =>
    `<a class="arc-card reveal" style="--ac:var(--arc${a.n})" href="${rel}/puzzles/#arc-${a.n}">
      <span class="arc-n">Arc ${a.n}</span>
      <h3>${esc(a.title)}</h3>
      <span class="arc-range">Puzzles ${a.range[0]}–${a.range[1]}</span>
      <p>${esc(a.blurb)}</p>
    </a>`).join('');

  const groups = ARCS.map((a) => {
    const cards = puzzles.filter((p) => p.id >= a.range[0] && p.id <= a.range[1]).map(puzzleCard.bind(null, rel, logomark)).join('');
    return `<section class="arc-group" id="arc-${a.n}" style="--ac:var(--arc${a.n})">
      <span class="eyebrow">Arc ${a.n} · ${esc(a.title)}</span>
      <div class="cat-grid">${cards}</div>
    </section>`;
  }).join('');

  const content = `
<section class="hero">
  <div class="wrap">
    ${logomark}
    <h1 class="hero-word">E<span class="x">X</span>KNOTS</h1>
    <p class="hero-tag">Twenty topological puzzles you solve with your hands.</p>
    <div class="hero-cta">
      <a class="btn btn--primary" href="${rel}/explore/">▶ Open the Explorer</a>
      <a class="btn btn--ghost" href="${rel}/theory/topology-primer.html">Read the Primer</a>
    </div>
  </div>
</section>

<section class="band wrap">
  <p class="prose" style="font-size:clamp(1.2rem,2.6vw,1.6rem);max-width:42ch;color:var(--ink-2)">
    Each puzzle is a physical object — rod, ring, cord, frame — that looks trapped and isn't, or looks free and won't come loose. The trick is always a theorem. Read it, rotate it in 3D, watch it solve, then build it.
  </p>
</section>

<section class="band band--alt">
  <div class="wrap">
    <div class="section-head"><h2>Five Arcs</h2><span class="count">A learning sequence</span></div>
    <div class="arc-grid">${arcCards}</div>
  </div>
</section>

<section class="band wrap">
  <div class="section-head"><h2>The Series</h2><span class="count">20 puzzles</span></div>
  ${groups}
</section>

<section class="band band--alt">
  <div class="wrap split">
    <a href="${rel}/explore/">
      <span class="eyebrow">Interactive</span>
      <h3>Solve it in 3D</h3>
      <p>Rotate every model, scrub the animated solution step by step, and read the diagram alongside.</p>
    </a>
    <a href="${rel}/construction/materials.html">
      <span class="eyebrow">Workshop</span>
      <h3>Build it for real</h3>
      <p>Shared materials, bending and welding notes, ring sizing, and FDM-printable OpenSCAD parts.</p>
    </a>
  </div>
</section>`;

  return pageShell({
    rel, current: 'home', logomark, puzzles, canonical: '',
    title: '', desc: 'Twenty topological hand-dexterity puzzles you solve with your fingers — diagrams, rotatable 3D models, animated solutions, and the mathematics behind them.',
    content,
  });
}

export function puzzleCard(rel, logomark, p) {
  return `<a class="pcard reveal" style="--ac:var(--arc${p.arc})" href="${rel}/puzzles/${p.htmlName}">
    <div class="pc-top">
      <span class="pc-num">${p.id}</span>
      ${logomark.replace('class="logomark"', 'class="logomark pc-glyph"')}
    </div>
    <h3>${esc(p.name)}</h3>
    <span class="pc-principle">${esc(p.principle || '')}</span>
    <div class="pc-meta">
      <span class="pill ${p.difficulty}">${esc(p.metaDifficulty || p.difficulty)}</span>
      <span class="pc-type">${esc(p.type || '')}</span>
    </div>
    <span class="pc-explore">▶ Open in explorer #${p.id}</span>
  </a>`;
}

export function catalogPage({ rel, logomark, puzzles }) {
  const groups = ARCS.map((a) => {
    const cards = puzzles.filter((p) => p.id >= a.range[0] && p.id <= a.range[1]).map(puzzleCard.bind(null, rel, logomark)).join('');
    return `<section class="arc-group" id="arc-${a.n}" style="--ac:var(--arc${a.n})">
      <span class="eyebrow">Arc ${a.n} · ${esc(a.title)}</span>
      <div class="cat-grid">${cards}</div>
    </section>`;
  }).join('');
  const content = `
<header class="doc-header"><div class="wrap">
  <span class="eyebrow">The Series</span>
  <h1 class="doc-title">All 20 Puzzles</h1>
  <p class="doc-lead">Ordered for learning, not difficulty alone. Numbers are display positions; the five arcs build on one another.</p>
</div></header>
<div class="wrap band" style="padding-top:1rem">${groups}</div>`;
  return pageShell({ rel, current: 'puzzles', logomark, puzzles, canonical: 'puzzles/', title: 'All Puzzles', desc: 'The complete series of 20 topological puzzles, grouped into five learning arcs.', content });
}

export function theoryIndexPage({ rel, logomark, puzzles }) {
  const card = (href, eyebrow, title, desc) =>
    `<a class="pcard reveal" style="--ac:var(--arc1)" href="${href}"><div class="pc-top"><span class="eyebrow">${esc(eyebrow)}</span></div><h3>${esc(title)}</h3><p class="pc-principle" style="font-style:normal">${esc(desc)}</p></a>`;
  const content = `
<header class="doc-header" style="--ac:var(--arc1)"><div class="wrap">
  <span class="eyebrow">Theory &amp; Build</span>
  <h1 class="doc-title">Reference</h1>
  <p class="doc-lead">The mathematics behind the series, the order it's taught in, and how to build the puzzles.</p>
</div></header>
<div class="wrap band" style="padding-top:1rem"><div class="cat-grid">
  ${card(`${rel}/theory/topology-primer.html`, 'Primer', 'Topology Primer', 'Every concept used in the series — linking number, genus, chirality, braid groups, Seifert surfaces, the Hopf fibration, and more.')}
  ${card(`${rel}/theory/pedagogical-arc.html`, 'Pedagogy', 'The Pedagogical Arc', 'Why the puzzles are ordered as they are, with time estimates and a concept map across the five arcs.')}
  ${card(`${rel}/theory/interdisciplinary-connections.html`, 'Connections', 'Interdisciplinary Connections', "Where each puzzle's concept shows up in DNA, quantum matter, plasmas, computing, and everyday craft — the sciences behind the series.")}
  ${card(`${rel}/construction/materials.html`, 'Workshop', 'Build Guide', 'Shared materials, construction techniques, ring sizing, and prototyping advice.')}
</div></div>`;
  return pageShell({ rel, current: 'theory', logomark, puzzles, canonical: 'theory/', title: 'Reference', desc: 'Theory primer, pedagogical arc, interdisciplinary connections, and the construction guide for the EXKNOTS series.', content });
}

// Article (puzzle or theory). `tocHtml`, `prevNext` optional.
export function articlePage({ rel, logomark, puzzles, current, canonical, title, desc, header, bodyHtml, tocHtml, prevNext }) {
  const layout = tocHtml
    ? `<div class="doc-layout"><div class="prose">${bodyHtml}${prevNext || ''}</div><aside class="toc" aria-label="On this page"><span class="eyebrow">On this page</span>${tocHtml}</aside></div>`
    : `<div class="prose">${bodyHtml}${prevNext || ''}</div>`;
  const content = `${header}\n<div class="wrap band" style="padding-top:1.4rem">${layout}</div>`;
  return pageShell({ rel, current, logomark, puzzles, canonical, title, desc, content, progress: true });
}

export function puzzleHeader(rel, p) {
  return `<header class="doc-header" style="--ac:var(--arc${p.arc})"><div class="wrap">
  <span class="doc-num">${p.id}</span>
  <h1 class="doc-title">${esc(p.name)}</h1>
  <div class="doc-meta">
    <span class="pill ${p.difficulty}">${esc(p.metaDifficulty || p.difficulty)}</span>
    <span class="pc-type">${esc(p.type || '')}</span>
    <span class="pc-principle">${esc(p.principle || '')}</span>
  </div>
  <div class="doc-actions"><a class="btn btn--primary" href="${rel}/explore/#${p.id}">▶ Open in Interactive Explorer</a></div>
</div></header>`;
}

export function theoryHeader(title, eyebrow, lead) {
  return `<header class="doc-header" style="--ac:var(--arc1)"><div class="wrap">
  <span class="eyebrow">${esc(eyebrow)}</span>
  <h1 class="doc-title">${esc(title)}</h1>
  ${lead ? `<p class="doc-lead">${esc(lead)}</p>` : ''}
</div></header>`;
}

export function prevNextHtml(rel, prev, next) {
  const p = prev
    ? `<a class="pn-prev" href="${rel}/puzzles/${prev.htmlName}"><span class="pn-k">← Previous</span><span class="pn-name">${prev.id}. ${esc(prev.name)}</span></a>`
    : `<a class="pn-prev" href="${rel}/puzzles/" ><span class="pn-k">←</span><span class="pn-name">All puzzles</span></a>`;
  const n = next
    ? `<a class="pn-next" href="${rel}/puzzles/${next.htmlName}"><span class="pn-k">Next →</span><span class="pn-name">${next.id}. ${esc(next.name)}</span></a>`
    : `<a class="pn-next" href="${rel}/theory/topology-primer.html"><span class="pn-k">→</span><span class="pn-name">Topology Primer</span></a>`;
  return `<nav class="prevnext" aria-label="Puzzle navigation">${p}${n}</nav>`;
}

export function tocFromHeadings(headings) {
  if (!headings.length) return '';
  const items = headings.map((h) => `<li><a class="lvl-${h.level}" href="#${h.id}">${esc(h.text)}</a></li>`).join('');
  return `<ol>${items}</ol>`;
}
