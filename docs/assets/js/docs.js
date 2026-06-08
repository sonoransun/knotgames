/* EXKNOTS docs — progressive enhancement. No dependencies, no build.
   Everything degrades gracefully if JS is off (theme follows OS, nav links work,
   reveals show, TOC is a plain anchor list). */
(() => {
  'use strict';
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Theme toggle (persisted; default follows OS) ---------------------- */
  const KEY = 'exknots-theme';
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'light' || saved === 'dark') root.setAttribute('data-theme', saved);
  } catch (_) {}
  const toggle = document.querySelector('.theme-toggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      const osDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const current = root.getAttribute('data-theme') || (osDark ? 'dark' : 'light');
      const next = current === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      toggle.setAttribute('aria-pressed', String(next === 'dark'));
      try { localStorage.setItem(KEY, next); } catch (_) {}
    });
  }

  /* ---- Mobile nav -------------------------------------------------------- */
  const burger = document.querySelector('.nav-burger');
  const links = document.querySelector('.nav-links');
  if (burger && links) {
    const close = () => { links.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); };
    burger.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      burger.setAttribute('aria-expanded', String(open));
    });
    links.addEventListener('click', (e) => { if (e.target.closest('a')) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  }

  /* ---- Nav shadow on scroll --------------------------------------------- */
  const nav = document.querySelector('.nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---- Scroll reveal ----------------------------------------------------- */
  const revealables = document.querySelectorAll('.reveal');
  if (revealables.length && 'IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    revealables.forEach((el, i) => {
      el.style.transitionDelay = `${Math.min(i % 8, 7) * 45}ms`;
      io.observe(el);
    });
  } else {
    revealables.forEach((el) => el.classList.add('in'));
  }

  /* ---- TOC scroll-spy + reading progress -------------------------------- */
  const tocLinks = [...document.querySelectorAll('.toc a[href^="#"]')];
  const progress = document.querySelector('.progress');
  if (tocLinks.length || progress) {
    const headings = tocLinks
      .map((a) => document.getElementById(decodeURIComponent(a.getAttribute('href').slice(1))))
      .filter(Boolean);
    const byId = new Map(tocLinks.map((a) => [decodeURIComponent(a.getAttribute('href').slice(1)), a]));
    const update = () => {
      if (progress) {
        const h = document.documentElement;
        const max = h.scrollHeight - h.clientHeight;
        progress.style.width = max > 0 ? `${(h.scrollTop / max) * 100}%` : '0%';
      }
      if (headings.length) {
        const y = window.scrollY + 140;
        let active = headings[0];
        for (const h of headings) { if (h.offsetTop <= y) active = h; }
        tocLinks.forEach((a) => a.classList.remove('active'));
        const a = active && byId.get(active.id);
        if (a) a.classList.add('active');
      }
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
  }
})();
