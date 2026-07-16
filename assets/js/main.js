/* ═══════════════════════════════════════════════════════════
   OLDCARTS — main.js
   Orchestration: heartbeat clock, preloader, smooth scroll,
   cursor, HUD, menu, split reveals, marquee, the OLDCARTS
   instrument, ECG course-of-care, protocol previews,
   generative specimen, consult oscilloscope, magnetic buttons.
   ═══════════════════════════════════════════════════════════ */
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
/* on slow devices/connections the page has already been blank too long —
   skip the theatrical intro and show content immediately */
const slowStart = performance.now() > 2200;
const skipIntro = reducedMotion || slowStart;
const isTouch = matchMedia('(hover: none), (pointer: coarse)').matches;
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin);

/* ───────────────────────────────────────────────────────────
   HEARTBEAT CLOCK — one metronome for the whole page.
   Lub-dub envelope at a resting 58 BPM.
   ─────────────────────────────────────────────────────────── */
const beatClock = {
  bpm: 58,
  value: 0,
  phase: 0,
  onBeat: [],
  _last: -1,
};
function gauss(x, mu, sig) {
  const d = x - mu;
  return Math.exp(-(d * d) / (2 * sig * sig));
}
gsap.ticker.add((time) => {
  const period = 60 / beatClock.bpm;
  const phase = (time % period) / period;
  beatClock.phase = phase;
  beatClock.value =
    gauss(phase, 0.055, 0.022) + 0.55 * gauss(phase, 0.24, 0.035);
  if (phase < beatClock._last) beatClock.onBeat.forEach((fn) => fn());
  beatClock._last = phase;
});

/* ───────────────────────────────────────────────────────────
   SMOOTH SCROLL (Lenis) + ScrollTrigger proxy
   ─────────────────────────────────────────────────────────── */
let lenis = null;
if (!reducedMotion) {
  lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* anchor links through lenis */
$$('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const target = $(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    closeMenu();
    if (lenis) lenis.scrollTo(target, { offset: -20, duration: 1.4 });
    else target.scrollIntoView({ behavior: 'smooth' });
  });
});

/* ───────────────────────────────────────────────────────────
   PRELOADER → INTRO
   ─────────────────────────────────────────────────────────── */
const preloader = $('#preloader');
const pctEl = $('#preloader-pct');
const trace = $('#preloader-trace');

const heroSplits = $$('.hero__line').map(
  (line) => new SplitText(line, { type: 'chars', charsClass: 'chr', aria: 'none' })
);
heroSplits.forEach((s) => gsap.set(s.chars, { yPercent: 118, rotate: 3 }));
/* accessible name lives on the h1 (valid role); visual chars are hidden from SR */
const heroTitle = $('.hero__title');
if (heroTitle) {
  heroTitle.setAttribute('aria-label', 'Your business has symptoms. We diagnose them.');
  $$('.hero__line', heroTitle).forEach((l) => l.setAttribute('aria-hidden', 'true'));
}

function intro() {
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  tl.to(preloader, {
    clipPath: 'inset(0 0 100% 0)',
    duration: 0.9,
    ease: 'power4.inOut',
    onComplete: () => preloader.remove(),
  });
  tl.to(
    heroSplits.map((s) => s.chars).flat(),
    { yPercent: 0, rotate: 0, duration: 1.1, stagger: 0.016, ease: 'power4.out' },
    '-=0.35'
  );
  tl.to(
    '.hero [data-reveal]',
    { opacity: 1, translate: '0 0', duration: 1, stagger: 0.12 },
    '-=0.8'
  );
  tl.from('.hero__vitals', { opacity: 0, y: 20, duration: 0.9 }, '-=0.7');
  tl.from('.hud__bar > *', { opacity: 0, y: -14, duration: 0.7, stagger: 0.07 }, '-=0.9');
  const eyebrow = $('.hero__eyebrow');
  if (eyebrow && !reducedMotion) {
    tl.to(
      eyebrow,
      {
        duration: 1.4,
        scrambleText: {
          text: '{original}',
          chars: '▮▯░╱—+×',
          speed: 0.6,
        },
      },
      '<-0.4'
    );
  }
}

if (skipIntro) {
  gsap.set(preloader, { display: 'none' });
  preloader.remove();
  heroSplits.forEach((s) => gsap.set(s.chars, { yPercent: 0, rotate: 0 }));
  gsap.set('[data-reveal]', { opacity: 1, translate: '0 0' });
  document.body.classList.remove('js');
} else {
  gsap.set(preloader, { clipPath: 'inset(0 0 0% 0)' });
  const load = { p: 0 };
  const len = trace.getTotalLength();
  trace.style.strokeDasharray = len;
  trace.style.strokeDashoffset = len;
  gsap.timeline()
    .to(load, {
      p: 100,
      duration: 1.05,
      ease: 'power2.inOut',
      onUpdate: () => (pctEl.textContent = String(Math.round(load.p)).padStart(2, '0')),
    })
    .to(trace, { strokeDashoffset: 0, duration: 1.05, ease: 'power2.inOut' }, 0)
    .add(intro, '-=0.15');
}

/* ───────────────────────────────────────────────────────────
   CURSOR — diagnostic crosshair
   ─────────────────────────────────────────────────────────── */
const cursor = $('#cursor');
if (!isTouch && cursor) {
  const label = $('#cursor-label');
  const pos = { x: innerWidth / 2, y: innerHeight / 2 };
  const target = { x: pos.x, y: pos.y };
  addEventListener('pointermove', (e) => {
    target.x = e.clientX;
    target.y = e.clientY;
  }, { passive: true });
  gsap.ticker.add(() => {
    pos.x += (target.x - pos.x) * 0.18;
    pos.y += (target.y - pos.y) * 0.18;
    cursor.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
  });
  addEventListener('pointerdown', () => cursor.classList.add('is-down'));
  addEventListener('pointerup', () => cursor.classList.remove('is-down'));

  const hoverSel = 'a, button, .slat, .protocol__head, [data-magnetic]';
  document.addEventListener('pointerover', (e) => {
    const t = e.target.closest(hoverSel);
    if (!t) return;
    cursor.classList.add('is-hover');
    const txt = t.closest('[data-cursor]')?.dataset.cursor;
    if (txt) {
      label.textContent = txt;
      cursor.classList.add('has-label');
    }
  });
  document.addEventListener('pointerout', (e) => {
    if (e.target.closest(hoverSel)) {
      cursor.classList.remove('is-hover', 'has-label');
    }
  });
}

/* ───────────────────────────────────────────────────────────
   HUD — clock, beat dot, scroll progress
   ─────────────────────────────────────────────────────────── */
const clockEl = $('#hud-clock');
setInterval(() => {
  if (!clockEl) return;
  clockEl.textContent = new Date().toLocaleTimeString('en-US', {
    hour12: false,
    timeZone: 'America/New_York',
  });
}, 1000);

const beatDot = $('#hud-beat');
beatClock.onBeat.push(() => {
  if (!beatDot || reducedMotion) return;
  gsap.fromTo(beatDot, { scale: 1.9, opacity: 1 }, { scale: 1, opacity: 0.6, duration: 0.5 });
});

/* live section readout */
const secEl = $('#hud-sec');
$$('[data-section]').forEach((sec) => {
  ScrollTrigger.create({
    trigger: sec,
    start: 'top 55%',
    end: 'bottom 55%',
    onToggle: (self) => {
      if (self.isActive && secEl) secEl.textContent = `${sec.dataset.section}/05`;
    },
  });
});

const progressFill = $('#scroll-progress');
const hud = $('#hud');
ScrollTrigger.create({
  start: 0,
  end: () => document.documentElement.scrollHeight - innerHeight,
  onUpdate: (self) => {
    progressFill.style.transform = `scaleX(${self.progress})`;
    hud.classList.toggle('is-scrolled', self.scroll() > 40);
  },
});

/* ───────────────────────────────────────────────────────────
   OVERLAY MENU
   ─────────────────────────────────────────────────────────── */
const menuBtn = $('#menu-btn');
const menu = $('#overlay-menu');
$$('.menu__nav a').forEach((a, i) => (a.style.transitionDelay = `${0.18 + i * 0.055}s`));
function closeMenu() {
  menu.classList.remove('is-open');
  menuBtn.setAttribute('aria-expanded', 'false');
  menu.setAttribute('aria-hidden', 'true');
}
menuBtn?.addEventListener('click', () => {
  const open = menu.classList.toggle('is-open');
  menuBtn.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-hidden', String(!open));
});

/* ───────────────────────────────────────────────────────────
   HERO 3D + scroll link
   ─────────────────────────────────────────────────────────── */
const heroCanvas = $('#hero-canvas');
function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { return false; }
}
if (heroCanvas && webglAvailable()) {
  /* lazy-boot the 3D scene off the critical path — the page is fully
     usable before three.js is even parsed */
  const bootHero = () =>
    import('./hero3d.js')
      .then((m) => {
        const heroScene = m.createHeroScene({ canvas: heroCanvas, beatClock, reducedMotion });
        ScrollTrigger.create({
          trigger: '.hero',
          start: 'top top',
          end: 'bottom top',
          onUpdate: (self) => heroScene.setScroll(self.progress),
        });
        gsap.fromTo(heroCanvas, { opacity: 0 }, { opacity: 1, duration: 1.2, ease: 'power2.out' });
      })
      .catch((err) => {
        console.warn('[oldcarts] hero scene unavailable, falling back to vignette', err);
        heroCanvas.style.display = 'none';
      });
  if ('requestIdleCallback' in window) requestIdleCallback(bootHero, { timeout: 2500 });
  else setTimeout(bootHero, 400);
} else if (heroCanvas) {
  heroCanvas.style.display = 'none';
}

/* ───────────────────────────────────────────────────────────
   SCROLL REVEALS — generic + split lines
   ─────────────────────────────────────────────────────────── */
$$('[data-reveal]').forEach((el) => {
  if (el.closest('.hero')) return; // hero handled by intro
  gsap.to(el, {
    opacity: 1,
    translate: '0 0',
    duration: 1,
    ease: 'power3.out',
    scrollTrigger: { trigger: el, start: 'top 88%' },
  });
});

if (!reducedMotion) {
  $$('[data-split-lines]').forEach((el) => {
    const split = new SplitText(el, { type: 'lines', linesClass: 'sline', aria: 'none' });
    split.lines.forEach((l) => {
      const wrap = document.createElement('span');
      /* padding/negative-margin keeps descenders visible inside the mask */
      wrap.style.cssText = 'display:block;overflow:hidden;padding-bottom:.14em;margin-bottom:-.14em;';
      l.parentNode.insertBefore(wrap, l);
      wrap.appendChild(l);
      l.style.display = 'block';
    });
    gsap.from(split.lines, {
      yPercent: 112,
      duration: 1.15,
      stagger: 0.09,
      ease: 'power4.out',
      scrollTrigger: { trigger: el, start: 'top 85%' },
    });
  });
}

/* ───────────────────────────────────────────────────────────
   MARQUEE — infinite, velocity-reactive
   ─────────────────────────────────────────────────────────── */
const marqueeTrack = $('#marquee-track');
if (marqueeTrack) {
  const seg = marqueeTrack.children[0];
  for (let i = 0; i < 3; i++) marqueeTrack.appendChild(seg.cloneNode(true));
  if (!reducedMotion) {
    let x = 0;
    let speed = 0.6;
    gsap.ticker.add(() => {
      const vel = lenis ? Math.abs(lenis.velocity) : 0;
      const boost = 1 + Math.min(vel / 60, 3);
      x -= speed * boost;
      const w = seg.offsetWidth;
      if (-x >= w) x += w;
      marqueeTrack.style.transform = `translate3d(${x}px,0,0)`;
    });
  }
}

/* ───────────────────────────────────────────────────────────
   VITALS — mini ECG + jittering readouts
   ─────────────────────────────────────────────────────────── */
const vitalEcg = $('#vital-ecg');
if (vitalEcg) {
  const ctx = vitalEcg.getContext('2d');
  const W = vitalEcg.width, H = vitalEcg.height;
  const pts = new Array(W).fill(H * 0.62);
  let px = 0;
  function ecgSample(phase) {
    // stylized PQRST from the shared clock
    let y = 0;
    y += gauss(phase, 0.0, 0.02) * -2;
    y += gauss(phase, 0.05, 0.008) * 4;
    y += gauss(phase, 0.07, 0.012) * -16;
    y += gauss(phase, 0.09, 0.01) * 6;
    y += gauss(phase, 0.26, 0.04) * -5;
    return y;
  }
  function drawEcg() {
    px = (px + 2) % W;
    pts[px] = H * 0.62 + ecgSample(beatClock.phase);
    pts[(px + 1) % W] = null; // gap
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = '#FF5C42';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    let started = false;
    for (let i = 0; i < W; i++) {
      const v = pts[i];
      if (v == null) { started = false; continue; }
      if (!started) { ctx.moveTo(i, v); started = true; }
      else ctx.lineTo(i, v);
    }
    ctx.stroke();
    if (!reducedMotion) requestAnimationFrame(drawEcg);
  }
  drawEcg();
}
const opsEl = $('#vital-ops');
const sysEl = $('#vital-sys');
function jitterVitals() {
  if (opsEl) opsEl.textContent = (0.91 + Math.random() * 0.07).toFixed(2);
  if (sysEl) sysEl.textContent = `${115 + Math.round(Math.random() * 6)}/${74 + Math.round(Math.random() * 4)}`;
}
jitterVitals();
setInterval(jitterVitals, 1600);

/* ───────────────────────────────────────────────────────────
   01 — THE INSTRUMENT (OLDCARTS slats)
   ─────────────────────────────────────────────────────────── */
const slats = $$('.slat');
const isDesktopInstrument = () => matchMedia('(min-width: 901px)').matches;
let userTouchedInstrument = false;
let activeSlat = 0;

function setActiveSlat(i, fromUser = false) {
  if (fromUser) userTouchedInstrument = true;
  if (!isDesktopInstrument()) {
    // mobile: toggle accordion
    slats.forEach((s, j) => s.classList.toggle('is-active', j === i && !(s.classList.contains('is-active') && fromUser)));
    return;
  }
  activeSlat = i;
  slats.forEach((s, j) => s.classList.toggle('is-active', j === i));
}
slats.forEach((s, i) => {
  s.dataset.cursor = 'EXAMINE';
  const body = $('.slat__body', s);
  const letter = $('.slat__letter', s).textContent.trim();
  if (body) body.dataset.letter = letter;
  s.addEventListener('pointerenter', () => { if (isDesktopInstrument()) setActiveSlat(i, true); });
  s.addEventListener('click', () => setActiveSlat(i, true));
  s.setAttribute('tabindex', '0');
  s.addEventListener('focus', () => { if (isDesktopInstrument()) setActiveSlat(i, true); });
  s.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveSlat(i, true); }
  });
});
setActiveSlat(0);
/* gentle auto-cycle until the visitor takes over */
if (!reducedMotion) {
  setInterval(() => {
    if (userTouchedInstrument || !isDesktopInstrument()) return;
    const rect = $('#method-instrument').getBoundingClientRect();
    if (rect.top > innerHeight || rect.bottom < 0) return;
    setActiveSlat((activeSlat + 1) % slats.length);
  }, 3600);
}

/* ───────────────────────────────────────────────────────────
   02 — COURSE OF CARE — scroll-drawn ECG
   ─────────────────────────────────────────────────────────── */
(function careEcg() {
  const svg = $('#care-ecg');
  if (!svg) return;
  const BASE = 150;
  const centers = [120, 360, 600, 840, 1080];
  let d = `M0 ${BASE}`;
  centers.forEach((cx) => {
    d += ` L${cx - 60} ${BASE}`;
    d += ` Q${cx - 48} ${BASE - 12} ${cx - 38} ${BASE}`;        // P wave
    d += ` L${cx - 16} ${BASE}`;
    d += ` L${cx - 10} ${BASE + 14}`;                            // Q
    d += ` L${cx} ${BASE - 105}`;                                // R spike
    d += ` L${cx + 9} ${BASE + 26}`;                             // S
    d += ` L${cx + 16} ${BASE}`;
    d += ` Q${cx + 34} ${BASE - 18} ${cx + 52} ${BASE}`;         // T wave
  });
  d += ` L1200 ${BASE}`;
  $('#care-trace-bg').setAttribute('d', d);
  const tracePath = $('#care-trace');
  tracePath.setAttribute('d', d);
  const len = tracePath.getTotalLength();
  tracePath.style.strokeDasharray = len;
  tracePath.style.strokeDashoffset = len;

  const stages = $$('.care__stage');
  const pinned = matchMedia('(min-width: 861px)').matches && !reducedMotion;
  ScrollTrigger.create({
    trigger: '#care-pin',
    start: pinned ? 'top top' : 'top 70%',
    end: pinned ? '+=140%' : 'bottom 45%',
    pin: pinned,
    scrub: reducedMotion ? false : 0.6,
    onUpdate: (self) => {
      tracePath.style.strokeDashoffset = len * (1 - self.progress);
      stages.forEach((st, i) =>
        st.classList.toggle('is-lit', self.progress > (i + 0.55) / stages.length)
      );
    },
  });
})();

/* ───────────────────────────────────────────────────────────
   03 — PROTOCOLS — accordion + generative hover previews
   ─────────────────────────────────────────────────────────── */
const protocols = $$('.protocol');
protocols.forEach((p) => {
  p.dataset.cursor = 'EXPAND';
  $$('.protocol__rx li', p).forEach((li, k) => (li.style.transitionDelay = `${0.12 + k * 0.05}s`));
  const head = $('.protocol__head', p);
  head.addEventListener('click', () => togglePlan(p));
  p.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      if (e.target === p) { e.preventDefault(); togglePlan(p); }
    }
  });
});
function togglePlan(p) {
  const wasOpen = p.classList.contains('is-open');
  protocols.forEach((o) => o.classList.remove('is-open'));
  if (!wasOpen) p.classList.add('is-open');
  ScrollTrigger.refresh();
}

/* preview panel */
if (!isTouch) {
  const panel = document.createElement('div');
  panel.className = 'preview';
  panel.innerHTML = `<canvas width="600" height="400"></canvas><span class="preview__tag"></span>`;
  document.body.appendChild(panel);
  const pcv = $('canvas', panel);
  const pctx = pcv.getContext('2d');
  const ptag = $('.preview__tag', panel);
  const PW = 600, PH = 400;
  const TAGS = ['SPECIMEN — WORKFLOW GRAPH', 'SPECIMEN — VITAL SIGNS', 'SPECIMEN — 90-DAY RADAR', 'SPECIMEN — SYSTEM LATTICE'];

  const patterns = [
    /* 0 — workflow graph: drifting nodes, connecting vessels */
    (t) => {
      bg();
      const N = 14;
      const nodes = [];
      for (let i = 0; i < N; i++) {
        const a = (i / N) * Math.PI * 2;
        nodes.push({
          x: PW / 2 + Math.cos(a + t * 0.25 + i) * (90 + 60 * Math.sin(t * 0.3 + i * 2.4)),
          y: PH / 2 + Math.sin(a * 1.7 + t * 0.32) * (70 + 30 * Math.cos(t * 0.22 + i)),
        });
      }
      pctx.strokeStyle = 'rgba(143,184,165,.4)';
      pctx.lineWidth = 1;
      nodes.forEach((n, i) => {
        const m = nodes[(i + 3) % N];
        pctx.beginPath();
        pctx.moveTo(n.x, n.y);
        pctx.quadraticCurveTo(PW / 2, PH / 2, m.x, m.y);
        pctx.stroke();
      });
      nodes.forEach((n, i) => {
        pctx.fillStyle = i % 4 === 0 ? '#FF5C42' : '#EDE7DB';
        pctx.beginPath();
        pctx.arc(n.x, n.y, i % 4 === 0 ? 4 : 2.2, 0, 7);
        pctx.fill();
      });
    },
    /* 1 — vital bars: a living scorecard */
    (t) => {
      bg();
      const cols = 16;
      const gap = 8;
      const bw = (PW - gap * (cols + 1)) / cols;
      for (let i = 0; i < cols; i++) {
        const h = (0.25 + 0.6 * Math.abs(Math.sin(t * 0.9 + i * 0.7)) + beatClock.value * 0.18) * (PH - 90);
        const x = gap + i * (bw + gap);
        pctx.fillStyle = i === 11 ? '#FF5C42' : 'rgba(143,184,165,.55)';
        pctx.fillRect(x, PH - 45 - h, bw, h);
      }
      pctx.strokeStyle = 'rgba(237,231,219,.3)';
      pctx.setLineDash([4, 6]);
      pctx.beginPath();
      pctx.moveTo(0, PH * 0.38);
      pctx.lineTo(PW, PH * 0.38);
      pctx.stroke();
      pctx.setLineDash([]);
    },
    /* 2 — 90-day radar sweep */
    (t) => {
      bg();
      const cx = PW / 2, cy = PH / 2, R = 140;
      pctx.strokeStyle = 'rgba(237,231,219,.18)';
      [0.33, 0.66, 1].forEach((k) => {
        pctx.beginPath();
        pctx.arc(cx, cy, R * k, 0, 7);
        pctx.stroke();
      });
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2;
        pctx.beginPath();
        pctx.moveTo(cx, cy);
        pctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
        pctx.stroke();
      }
      const sweep = t * 1.1;
      const grd = pctx.createConicGradient
        ? pctx.createConicGradient(sweep, cx, cy)
        : null;
      if (grd) {
        grd.addColorStop(0, 'rgba(255,92,66,.5)');
        grd.addColorStop(0.12, 'rgba(255,92,66,0)');
        grd.addColorStop(1, 'rgba(255,92,66,0)');
        pctx.fillStyle = grd;
        pctx.beginPath();
        pctx.arc(cx, cy, R, 0, 7);
        pctx.fill();
      }
      for (let i = 0; i < 7; i++) {
        const a = i * 2.4 + 0.9;
        const r = R * (0.3 + ((i * 37) % 60) / 90);
        const bl = Math.max(0, Math.sin(sweep - a));
        pctx.fillStyle = `rgba(237,231,219,${0.25 + bl * 0.75})`;
        pctx.beginPath();
        pctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 3, 0, 7);
        pctx.fill();
      }
    },
    /* 3 — system lattice: plus-glyph grid waves */
    (t) => {
      bg();
      const step = 40;
      for (let y = step; y < PH; y += step) {
        for (let x = step; x < PW; x += step) {
          const w = Math.sin(x * 0.02 + t * 1.4) * Math.cos(y * 0.025 + t * 0.9);
          const s = 4 + w * 3.4;
          const on = w > 0.55;
          pctx.strokeStyle = on ? '#FF5C42' : 'rgba(143,184,165,.4)';
          pctx.lineWidth = on ? 1.6 : 1;
          pctx.beginPath();
          pctx.moveTo(x - s, y); pctx.lineTo(x + s, y);
          pctx.moveTo(x, y - s); pctx.lineTo(x, y + s);
          pctx.stroke();
        }
      }
    },
  ];
  function bg() {
    pctx.fillStyle = '#0E1512';
    pctx.fillRect(0, 0, PW, PH);
  }

  let currentPattern = -1;
  let previewRaf = null;
  const ppos = { x: 0, y: 0 };
  const ptarget = { x: 0, y: 0 };

  function loopPreview() {
    const t = performance.now() / 1000;
    patterns[currentPattern](t);
    ppos.x += (ptarget.x - ppos.x) * 0.13;
    ppos.y += (ptarget.y - ppos.y) * 0.13;
    panel.style.transform = `translate(${ppos.x + 26}px, ${ppos.y - 100}px)`;
    previewRaf = requestAnimationFrame(loopPreview);
  }
  protocols.forEach((p, i) => {
    p.addEventListener('pointerenter', (e) => {
      currentPattern = i;
      ptag.textContent = TAGS[i];
      ptarget.x = e.clientX; ptarget.y = e.clientY;
      ppos.x = e.clientX; ppos.y = e.clientY;
      panel.classList.add('is-visible');
      if (!previewRaf && !reducedMotion) loopPreview();
      else if (reducedMotion) patterns[i](0);
    });
    p.addEventListener('pointermove', (e) => {
      ptarget.x = e.clientX; ptarget.y = e.clientY;
    });
    p.addEventListener('pointerleave', () => {
      panel.classList.remove('is-visible');
      cancelAnimationFrame(previewRaf);
      previewRaf = null;
    });
  });
}

/* ───────────────────────────────────────────────────────────
   04 — SPECIMEN — generative operational anatomy
   ─────────────────────────────────────────────────────────── */
(function specimen() {
  const cv = $('#specimen-canvas');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height;

  // deterministic pseudo-random
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  const LABELS = ['SALES', 'FULFILLMENT', 'CASH FLOW', 'PEOPLE', 'TOOLS', 'DATA', 'CLIENTS', 'PROCESS', 'COMMS', 'STRATEGY', 'REVIEW'];
  const branches = [];
  const SPINE_X = W * 0.5;
  for (let i = 0; i < 11; i++) {
    const y = H * 0.12 + (H * 0.74 * i) / 10;
    const side = i % 2 === 0 ? 1 : -1;
    branches.push({
      y,
      side,
      label: LABELS[i],
      len: W * (0.16 + rnd() * 0.2),
      curve: 40 + rnd() * 70,
      nodes: 2 + Math.floor(rnd() * 3),
      phase: rnd() * Math.PI * 2,
    });
  }

  let visible = false;
  const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0.05 });
  io.observe(cv);

  function draw(tms) {
    const t = tms / 1000;
    ctx.clearRect(0, 0, W, H);

    // ruled chart lines
    ctx.strokeStyle = 'rgba(237,231,219,.05)';
    ctx.lineWidth = 1;
    for (let y = 20; y < H; y += 34) {
      ctx.beginPath(); ctx.moveTo(14, y); ctx.lineTo(W - 14, y); ctx.stroke();
    }

    const sway = Math.sin(t * 0.5) * 6;
    // spine
    ctx.strokeStyle = 'rgba(237,231,219,.7)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(SPINE_X, H * 0.06);
    ctx.bezierCurveTo(SPINE_X + sway, H * 0.35, SPINE_X - sway, H * 0.65, SPINE_X, H * 0.92);
    ctx.stroke();

    const beat = beatClock.value;
    branches.forEach((b, i) => {
      const bx = SPINE_X + Math.sin(t * 0.5 + b.y * 0.01) * 4;
      const ex = bx + b.side * b.len * (1 + beat * 0.02);
      const ey = b.y + Math.sin(t * 0.4 + b.phase) * 5;
      ctx.strokeStyle = 'rgba(143,184,165,.55)';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(bx, b.y);
      ctx.quadraticCurveTo(bx + b.side * b.curve, (b.y + ey) / 2 - 18, ex, ey);
      ctx.stroke();
      // terminal node
      const pulseHere = (Math.floor(t / 2) % branches.length) === i;
      ctx.fillStyle = pulseHere ? '#FF5C42' : 'rgba(237,231,219,.85)';
      ctx.beginPath();
      ctx.arc(ex, ey, pulseHere ? 4.5 + beat * 3 : 3, 0, 7);
      ctx.fill();
      if (pulseHere) {
        ctx.strokeStyle = `rgba(255,92,66,${0.6 - beat * 0.4})`;
        ctx.beginPath();
        ctx.arc(ex, ey, 8 + beat * 14, 0, 7);
        ctx.stroke();
      }
      // clinical label at the terminal node
      ctx.font = '10px "Fragment Mono", monospace';
      ctx.textAlign = b.side > 0 ? 'left' : 'right';
      ctx.fillStyle = pulseHere ? 'rgba(255,92,66,.95)' : 'rgba(150,161,152,.55)';
      ctx.fillText(b.label, ex + b.side * 12, ey + 3);
      // intermediate nodes
      for (let k = 1; k <= b.nodes; k++) {
        const f = k / (b.nodes + 1);
        const ix = bx + (ex - bx) * f + b.side * Math.sin(f * Math.PI) * b.curve * 0.4;
        const iy = b.y + (ey - b.y) * f - Math.sin(f * Math.PI) * 14;
        ctx.fillStyle = 'rgba(143,184,165,.7)';
        ctx.beginPath();
        ctx.arc(ix, iy, 1.6, 0, 7);
        ctx.fill();
      }
    });

    // heart node on the spine
    const hy = H * 0.42;
    ctx.fillStyle = '#FF5C42';
    ctx.beginPath();
    ctx.arc(SPINE_X + sway * 0.4, hy, 5 + beat * 4, 0, 7);
    ctx.fill();
    ctx.strokeStyle = `rgba(255,92,66,${0.5 - beat * 0.3})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(SPINE_X + sway * 0.4, hy, 12 + beat * 22, 0, 7);
    ctx.stroke();

  }
  function loop(tt) {
    if (visible) draw(tt);
    if (!reducedMotion) requestAnimationFrame(loop);
  }
  draw(0);
  requestAnimationFrame(loop);
})();

/* ───────────────────────────────────────────────────────────
   05 — CONSULT — oscilloscope that wakes on approach
   ─────────────────────────────────────────────────────────── */
(function consultScope() {
  const cv = $('#consult-canvas');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  let W = 0, H = 0;
  function size() {
    W = cv.width = cv.offsetWidth * Math.min(devicePixelRatio, 1.5);
    H = cv.height = cv.offsetHeight * Math.min(devicePixelRatio, 1.5);
  }
  size();
  addEventListener('resize', size);

  let alive = 0;        // 0 flatline → 1 full pulse
  let aliveTarget = 0;
  let excite = 0, exciteTarget = 0;

  ScrollTrigger.create({
    trigger: '.consult',
    start: 'top 75%',
    onEnter: () => (aliveTarget = 1),
    onLeaveBack: () => (aliveTarget = 0),
  });
  $$('.consult .btn').forEach((b) => {
    b.addEventListener('pointerenter', () => (exciteTarget = 1));
    b.addEventListener('pointerleave', () => (exciteTarget = 0));
  });

  let visible = false;
  const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0 });
  io.observe(cv);

  function draw() {
    if (visible) {
      alive += (aliveTarget - alive) * 0.02;
      excite += (exciteTarget - excite) * 0.06;
      ctx.clearRect(0, 0, W, H);

      // grid
      const step = 46 * Math.min(devicePixelRatio, 1.5);
      ctx.strokeStyle = 'rgba(237,231,219,.045)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x < W; x += step) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
      for (let y = 0; y < H; y += step) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
      ctx.stroke();

      // trace
      const mid = H * 0.82;
      const amp = (H * 0.125) * alive * (1 + excite * 0.5);
      const bpmScale = 1 + excite * 0.6;
      ctx.strokeStyle = `rgba(255,92,66,${0.35 + alive * 0.5})`;
      ctx.lineWidth = 1.6 * Math.min(devicePixelRatio, 1.5);
      ctx.shadowColor = 'rgba(255,92,66,.5)';
      ctx.shadowBlur = 12 * alive;
      ctx.beginPath();
      const t = performance.now() / 1000;
      for (let x = 0; x <= W; x += 3) {
        const phase = ((x / W) * 2.2 - t * 0.55 * bpmScale) % 1;
        const ph = phase < 0 ? phase + 1 : phase;
        let y = 0;
        y += gauss(ph, 0.05, 0.008) * 0.28;
        y += gauss(ph, 0.07, 0.012) * -1;
        y += gauss(ph, 0.09, 0.01) * 0.38;
        y += gauss(ph, 0.26, 0.04) * -0.3;
        const yy = mid + y * amp;
        x === 0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    if (!reducedMotion) requestAnimationFrame(draw);
  }
  draw();
})();

/* ───────────────────────────────────────────────────────────
   MAGNETIC BUTTONS
   ─────────────────────────────────────────────────────────── */
if (!isTouch && !reducedMotion) {
  $$('[data-magnetic]').forEach((el) => {
    const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * 0.28);
      yTo((e.clientY - (r.top + r.height / 2)) * 0.34);
    });
    el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
  });
}

/* ───────────────────────────────────────────────────────────
   Section counters in HUD title (document title heartbeat)
   ─────────────────────────────────────────────────────────── */
console.info(
  '%c✚ OLDCARTS — designed & engineered by Claude. Read how: /guide',
  'color:#FF5C42;font-family:monospace;'
);
