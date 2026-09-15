/* ============================================================
   Huzaifa Khan — portfolio engine
   GSAP + ScrollTrigger + Three.js + custom lerp smooth-scroll
   ============================================================ */
(() => {
'use strict';

gsap.registerPlugin(ScrollTrigger);

/* ── EDIT ME ────────────────────────────────────────────────
   Everything the site needs to reach you. Leave a field empty
   and its control quietly falls back to the contact page
   instead of rendering a dead link.                          */
const CONTACT = {
  email:    'REPLACE_WITH_YOUR_EMAIL@example.com',
  whatsapp: '',   // digits only, country code first, e.g. '923001234567'
  github:   'https://github.com/huzaifakhan-durrani',
  linkedin: 'https://www.linkedin.com/in/huzaifa-khan-durrani-%F0%9F%A5%88-9b3656285/'
};
const MAILTO = `mailto:${CONTACT.email}`;
const WHATSAPP = CONTACT.whatsapp
  ? `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent("Hi Huzaifa — I found you through your site.")}`
  : 'contact.html';

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouch = window.matchMedia('(hover:none)').matches;
const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp  = (a, b, t) => a + (b - a) * t;

/* ============================================================
   1 · SMOOTH SCROLL  (lerped native scroll, Lenis-style)
   ============================================================ */
const Smooth = (() => {
  let target = window.scrollY, current = target, ticking = false, enabled = !isTouch && !REDUCED;
  let maxY = () => document.documentElement.scrollHeight - window.innerHeight;

  function onWheel(e) {
    if (!enabled || document.body.classList.contains('locked')) return;
    e.preventDefault();
    const d = e.deltaMode === 1 ? e.deltaY * 18 : e.deltaMode === 2 ? e.deltaY * window.innerHeight : e.deltaY;
    target = clamp(target + d, 0, maxY());
  }
  function onKey(e) {
    if (!enabled) return;
    const step = { PageDown: .85, PageUp: -.85, ArrowDown: .12, ArrowUp: -.12, Home: -99, End: 99 }[e.key];
    if (step === undefined) return;
    if (/input|textarea/i.test(e.target.tagName)) return;
    e.preventDefault();
    target = clamp(target + step * window.innerHeight, 0, maxY());
  }
  function raf() {
    if (enabled) {
      current = lerp(current, target, 0.095);
      if (Math.abs(target - current) < 0.12) current = target;
      if (Math.abs(window.scrollY - current) > 0.05) {
        ticking = true;
        window.scrollTo(0, current);
        ticking = false;
      }
    }
    ScrollTrigger.update();
    requestAnimationFrame(raf);
  }
  // resync when the user drags the scrollbar or the browser jumps
  window.addEventListener('scroll', () => {
    if (!ticking && enabled && Math.abs(window.scrollY - current) > 2) {
      current = target = window.scrollY;
    }
  }, { passive: true });

  window.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('keydown', onKey);
  window.addEventListener('resize', () => { target = clamp(target, 0, maxY()); ScrollTrigger.refresh(); });
  requestAnimationFrame(raf);

  return {
    to(y, instant) {
      target = clamp(y, 0, maxY());
      if (instant || !enabled) { current = target; window.scrollTo(0, target); }
    },
    get target() { return target; },
    stop() { enabled = false; },
    start() { if (!isTouch && !REDUCED) { current = target = window.scrollY; enabled = true; } }
  };
})();

// anchor links
$$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
  const id = a.getAttribute('href');
  if (id === '#' || id.length < 2) return;
  const el = $(id);
  if (!el) return;
  e.preventDefault();
  closeAllMenus();
  const y = id === '#top' ? 0 : el.getBoundingClientRect().top + window.scrollY - 20;
  if (REDUCED || isTouch) { window.scrollTo({ top: y, behavior: 'smooth' }); }
  else gsap.to({ v: Smooth.target }, {
    v: y, duration: 1.15, ease: 'power3.inOut',
    onUpdate() { Smooth.to(this.targets()[0].v, true); }
  });
}));

/* ============================================================
   2 · TEXT UTILITIES
   ============================================================ */
const GLYPHS = '!<>-_\\/[]{}—=+*^?#01アイウエオカキクケコサシスセソナニヌネノ';

function scramble(el, finalText) {
  const from = el.dataset._orig ?? el.textContent;
  el.dataset._orig = from;
  const text = finalText ?? from;
  const queue = [];
  for (let i = 0; i < text.length; i++) {
    const start = Math.floor(Math.random() * 14);
    const end = start + Math.floor(Math.random() * 14) + 6;
    queue.push({ to: text[i], start, end, char: '' });
  }
  let frame = 0;
  cancelAnimationFrame(el._scr);
  (function run() {
    let out = '', done = 0;
    for (const q of queue) {
      if (frame >= q.end) { done++; out += q.to; }
      else if (frame >= q.start) {
        if (!q.char || Math.random() < 0.3) q.char = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        out += `<span style="opacity:.55">${q.char}</span>`;
      } else out += q.to === ' ' ? ' ' : '<span style="opacity:0">' + q.to + '</span>';
    }
    el.innerHTML = out;
    if (done < queue.length) { frame++; el._scr = requestAnimationFrame(run); }
    else el.textContent = text;
  })();
}

// split words into per-character spans
function splitChars(el) {
  if (el.dataset._split) return $$('.ch', el);
  el.dataset._split = '1';
  const txt = el.textContent;
  el.textContent = '';
  const out = [];
  for (const c of txt) {
    const s = document.createElement('span');
    s.className = 'ch';
    s.textContent = c === ' ' ? ' ' : c;
    el.appendChild(s);
    out.push(s);
  }
  return out;
}

/* ============================================================
   3 · PROCEDURAL ARTWORK  (no external images)
   ============================================================ */
function artFor(seed) {
  const h1 = (seed * 47) % 360, h2 = (h1 + 40 + seed * 11) % 360;
  const pinkish = `hsl(${325 + (seed * 7) % 30} 92% 58%)`;
  return `radial-gradient(120% 90% at ${18 + (seed * 13) % 60}% ${20 + (seed * 17) % 50}%, ${pinkish} 0%, transparent 52%),
          radial-gradient(90% 80% at ${70 - (seed * 9) % 45}% ${75 - (seed * 5) % 40}%, hsl(${h2} 80% 45%) 0%, transparent 55%),
          radial-gradient(140% 120% at 50% 120%, hsl(${h1} 60% 22%) 0%, transparent 60%),
          linear-gradient(${30 + seed * 23}deg, #131317, #08080a)`;
}
$$('[data-art]').forEach(el => {
  el.style.background = artFor(+el.dataset.art);
  el.style.filter = 'saturate(.85) brightness(.75)';
});

/* ============================================================
   4 · CONTENT INJECTION
   ============================================================ */
// -- marquee rows
const TECH = (window.ICONS ? window.ICONS.tech : []).map(
  ([name, slug, color]) => `<span class="tech">${window.ICONS.svg(slug, color, 15)}${name.toUpperCase()}</span>`
);
const PHRASES = ['BUILT TO EVOLVE', 'CLARITY BEFORE CODE', 'MEASURED TRUTH', 'ADOPTION NOT DELIVERY', 'PARTNERSHIP NOT PROJECT', 'NO LEGACY · NO LIMITS', 'SHIP · MEASURE · BEND'];
const JP = ['進化する', '明快さ', '真実', '導入', '提携', '限界なし', '出荷する'];

function fillMarquee(el, items, sep) {
  const make = () => items.map(t => `<span>${t}${sep ? `<i style="color:var(--pink);font-style:normal;margin-left:22px">${sep}</i>` : ''}</span>`).join('');
  el.innerHTML = make() + make() + make();
}
if ($('#mq1')) fillMarquee($('#mq1'), TECH, '✦');
if ($('#mq2')) fillMarquee($('#mq2'), PHRASES.map((p, i) => `${p} <i style="opacity:.45">${JP[i]}</i>`), '·');
if ($('#mq3')) fillMarquee($('#mq3'), [...PHRASES].reverse().map((p, i) => `${JP[i]} <i style="opacity:.45">${p}</i>`), '·');

// -- reviews
const GOOGLE_G = `<svg class="rev__g" viewBox="0 0 24 24" aria-hidden="true">
  <path fill="#4285F4" d="M23.52 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.54 5.54 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.87z"/>
  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.94-2.91l-3.88-3c-1.08.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.28v3.09A12 12 0 0 0 12 24z"/>
  <path fill="#FBBC05" d="M5.29 14.29a7.2 7.2 0 0 1 0-4.58V6.62H1.28a12 12 0 0 0 0 10.76z"/>
  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.28 6.62l4.01 3.09C6.23 6.86 8.88 4.75 12 4.75z"/>
</svg>`;

const REVIEWS = [
  { t: 'Huzaifa rebuilt our storefront in six weeks and the numbers moved in the first month. He asks the questions our last agency never bothered with.', n: 'Paola Constantino', r: 'Ops Lead · Solmar Rentals', c: '#c2410c' },
  { t: 'He is on top of everything. Incredibly attentive and always reachable when I have questions. A genuinely hard worker who sticks around after launch.', n: 'Raquel Fisk', r: 'Founder · Northbound', c: '#1d4ed8' },
  { t: 'Excellent work on our platform. The diagnosis phase alone paid for the project — he found three silent leaks nobody had measured.', n: 'Daniel Okonkwo', r: 'CTO · Atlas Logistics', c: '#047857' },
  { t: 'We came for a website and left with a proper operating system for the business. Documentation so clear our team ships without him now.', n: 'Mira Haddad', r: 'Director · Verso Legal', c: '#7c3aed' },
  { t: 'The AI agent handles 70% of our intake. What impressed me was that he talked us out of the expensive version first.', n: 'Tomás Rivera', r: 'GM · Sable Health', c: '#be123c' },
  { t: 'Fast, precise, and refreshingly honest about trade-offs. Our load times went from four seconds to under one.', n: 'Ayesha Noor', r: 'Head of Digital · Meridian', c: '#0369a1' }
];
if ($('#reviewTrack')) $('#reviewTrack').innerHTML = [...REVIEWS, ...REVIEWS].map(r => `
  <article class="rev">
    <div class="rev__top">${GOOGLE_G}google reviews</div>
    <div class="rev__stars">★★★★★</div>
    <p class="rev__body">"${r.t}"</p>
    <div class="rev__more">click to read more →</div>
    <div class="rev__who">
      <span class="rev__av" style="background:${r.c}">${r.n[0]}</span>
      <span><b>${r.n}</b> · ${r.r}</span>
    </div>
  </article>`).join('');



// -- footer social (labels decode on reveal)
const SOCIAL_LINKS = { linkedin: CONTACT.linkedin, github: CONTACT.github };
if ($('#footSocial')) $('#footSocial').innerHTML = (window.ICONS ? window.ICONS.social : [])
  .filter(([name]) => SOCIAL_LINKS[name])
  .map(([name, slug, color]) =>
    `<a class="fsoc" href="${SOCIAL_LINKS[name]}" target="_blank" rel="noopener noreferrer">
       ${window.ICONS.svg(slug, color, 15)}<span data-scramble-late>${name}</span></a>`)
  .join('');

// -- search index
const INDEX = [
  ['Web Development', 'service'], ['AI Agent Development', 'service'], ['SEO', 'service'],
  ['GEO / AEO', 'service'], ['Cloud Migration', 'service'], ['Data & Analytics', 'service'],
  ['Meridian Retail', 'case study'], ['Sable Health', 'case study'], ['Atlas Logistics', 'case study'],
  ['Verso Legal', 'case study'], ['The 5D method', 'page'], ['Contact', 'page']
];
const results = $('#searchResults');
function renderSearch(q = '') {
  if (!results) return;
  const list = INDEX.filter(([t]) => t.toLowerCase().includes(q.toLowerCase())).slice(0, 7);
  results.innerHTML = list.length
    ? list.map(([t, k]) => `<a href="#"><span>${t}</span><em>${k}</em></a>`).join('')
    : `<a href="#"><span style="color:var(--fg-faint)">no matches for "${q}"</span></a>`;
}
renderSearch();

/* ============================================================
   5 · INTRO
   ============================================================ */
function introAlreadySeen() {
  if (/[?&](nointro|skip)\b/.test(location.search)) return true;
  try {
    if (sessionStorage.getItem('hk_intro') === '1') return true;
    sessionStorage.setItem('hk_intro', '1');
  } catch (e) { /* private mode — just play it */ }
  return false;
}

let introDone = false;
function finishIntro() {
  if (introDone) return;
  introDone = true;
  const intro = $('#intro');
  if (intro) intro.remove();
  document.body.classList.remove('locked');
  Smooth.start();
  afterIntro();
}

function runIntro() {
  const intro = $('#intro'), count = $('#introCount'), bar = $('#introBar');
  if (!intro) { finishIntro(); return; }
  if (REDUCED || introAlreadySeen()) { finishIntro(); return; }

  document.body.classList.add('locked');
  Smooth.stop();
  scramble($('.intro__label'), 'initialising');

  // never let a stalled frame loop trap the visitor behind the overlay
  const failsafe = setTimeout(finishIntro, 6000);
  const tl = gsap.timeline({ onComplete: () => { clearTimeout(failsafe); finishIntro(); } });
  const n = { v: 0 };
  tl.to(n, {
    v: 100, duration: 1.8, ease: 'power2.inOut',
    onUpdate() {
      const v = Math.round(n.v);
      count.textContent = String(v).padStart(3, '0');
      bar.style.width = v + '%';
    }
  })
    .to('.intro__name span', { y: '0%', opacity: 1, duration: .85, stagger: .07, ease: 'expo.out' }, '-=.9')
    .to('.intro__inner', { y: -28, opacity: 0, duration: .5, ease: 'power2.in' }, '+=.25')
    .set('.intro__curtain', { transformOrigin: 'bottom' })
    .to('.intro__curtain', { scaleY: 1, duration: .7, ease: 'expo.inOut' }, '-=.25');
}

function afterIntro() {
  gsap.from('.nav__pill', { y: -70, opacity: 0, duration: 1, delay: .15, ease: 'expo.out' });
  if (!$('.hero__title')) { ScrollTrigger.refresh(); return; }   // subpage: nothing else to stage
  // hero title char reveal
  const chars = [];
  $$('.hero__title [data-split]').forEach(w => chars.push(...splitChars(w)));
  gsap.set(chars, { yPercent: 115, opacity: 0 });
  gsap.to(chars, { yPercent: 0, opacity: 1, duration: 1.1, stagger: .018, ease: 'expo.out', delay: .05 });
  gsap.to('.hero__sub', { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1, delay: .45, ease: 'power3.out' });
  gsap.from('.hero__actions .btn', { y: 24, opacity: 0, duration: .8, stagger: .08, delay: .62, ease: 'power3.out' });
  gsap.from('.hero__status', { opacity: 0, y: -10, duration: .9, delay: .8, ease: 'power2.out' });
  ScrollTrigger.refresh();
}

/* ============================================================
   6 · BUTTON HOVER ORIGIN + MAGNETIC BUTTONS
   ============================================================ */
/* Feed the circular fill the point where the pointer crossed the edge, so it
   grows from that side — and re-feed it on the way out so it retracts toward
   the exit. Seeded at the centre for keyboard focus and touch. */
$$('.btn, .nav__cta').forEach(el => {
  const seed = () => {
    const r = el.getBoundingClientRect();
    if (!r.width) return;
    el.style.setProperty('--d', (2 * Math.hypot(r.width, r.height)).toFixed(0) + 'px');
    if (!el.style.getPropertyValue('--mx')) {
      el.style.setProperty('--mx', (r.width / 2).toFixed(0) + 'px');
      el.style.setProperty('--my', (r.height / 2).toFixed(0) + 'px');
    }
  };
  const track = e => {
    const r = el.getBoundingClientRect();
    el.style.setProperty('--d', (2 * Math.hypot(r.width, r.height)).toFixed(0) + 'px');
    el.style.setProperty('--mx', (e.clientX - r.left).toFixed(0) + 'px');
    el.style.setProperty('--my', (e.clientY - r.top).toFixed(0) + 'px');
  };
  seed();
  el.addEventListener('pointerenter', track);
  el.addEventListener('pointerleave', track);
});

/* ============================================================
   6b · MAGNETIC
   ============================================================ */
if (!isTouch) {
  // magnetic buttons
  $$('[data-magnetic]').forEach(el => {
    const strength = 0.32;
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      gsap.to(el, {
        x: (e.clientX - (r.left + r.width / 2)) * strength,
        y: (e.clientY - (r.top + r.height / 2)) * strength * 1.4,
        duration: .5, ease: 'power3.out'
      });
    });
    el.addEventListener('mouseleave', () => gsap.to(el, { x: 0, y: 0, duration: .7, ease: 'elastic.out(1,.4)' }));
  });
}

/* ============================================================
   7 · NAV
   ============================================================ */
const nav = $('#nav');
let openTimer;

function closeAllMenus() {
  $$('.mega').forEach(m => m.classList.remove('is-open'));
  $$('.nav__item').forEach(i => i.classList.remove('is-open'));
}
$$('.nav__item').forEach(item => {
  const panel = $(`.mega[data-panel="${item.dataset.menu}"]`);
  const open = () => {
    clearTimeout(openTimer);
    closeAllMenus();
    item.classList.add('is-open');
    panel.classList.add('is-open');
    gsap.fromTo(panel.querySelectorAll('.mcard,.mlink'),
      { y: 14, opacity: 0 },
      { y: 0, opacity: 1, duration: .5, stagger: .022, ease: 'power3.out', overwrite: true });
  };
  const close = () => { openTimer = setTimeout(closeAllMenus, 160); };
  item.addEventListener('mouseenter', open);
  item.addEventListener('mouseleave', close);
  panel.addEventListener('mouseenter', () => clearTimeout(openTimer));
  panel.addEventListener('mouseleave', close);
  item.querySelector('.nav__link').addEventListener('click', e => {
    e.preventDefault();
    panel.classList.contains('is-open') ? closeAllMenus() : open();
  });
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeAllMenus(); closeSearch(); } });

// Buttons and nav links get the colour wipe only — no text scrambling on
// hover, which read as glitching mid-interaction.

// compact nav on scroll
ScrollTrigger.create({
  start: 60, end: 99999,
  onToggle: s => nav.classList.toggle('is-compact', s.isActive)
});

/* ============================================================
   8 · SEARCH
   ============================================================ */
const searchEl = $('#search'), searchInput = $('#searchInput');
const hasSearch = !!(searchEl && searchInput);
function openSearch() { if (!hasSearch) return; searchEl.classList.add('is-open'); setTimeout(() => searchInput.focus(), 80); }
function closeSearch() { if (!hasSearch) return; searchEl.classList.remove('is-open'); searchInput.blur(); }
if (hasSearch) {
  const sb = $('#searchBtn');
  if (sb) sb.addEventListener('click', openSearch);
  searchEl.addEventListener('click', e => { if (e.target === searchEl) closeSearch(); });
  searchInput.addEventListener('input', e => renderSearch(e.target.value));
}
document.addEventListener('keydown', e => {
  if (e.key === '/' && !/input|textarea/i.test(e.target.tagName)) { e.preventDefault(); openSearch(); }
});

/* ============================================================
   9 · GLOBE (three.js point cloud w/ continents)
   ============================================================ */
function buildGlobe() {
  const canvas = $('#globe');
  if (!canvas) return null;
  if (!window.THREE || REDUCED) { canvas.style.display = 'none'; return null; }

  // --- simplified continent outlines [lon, lat]
  const LAND = [
    // Africa
    [[-17,15],[-16,12],[-13,8],[-8,4],[0,5],[9,4],[9,2],[13,-2],[12,-6],[12,-17],[15,-22],[18,-29],[20,-35],[26,-34],[32,-29],[35,-24],[40,-16],[40,-11],[39,-7],[42,-2],[48,0],[51,10],[44,11],[43,12],[37,15],[34,20],[33,28],[32,31],[25,32],[18,30],[11,33],[0,36],[-6,35],[-10,30],[-16,22]],
    // Eurasia
    [[-10,36],[-9,43],[-2,43],[0,48],[-5,50],[2,51],[4,53],[8,54],[10,57],[18,55],[21,56],[24,60],[21,65],[24,71],[30,70],[40,68],[55,68],[70,72],[80,74],[100,76],[113,74],[130,71],[140,72],[160,70],[179,68],[179,63],[170,60],[163,58],[155,55],[140,54],[135,44],[130,43],[129,37],[126,35],[122,31],[121,25],[110,21],[105,10],[100,13],[98,8],[94,16],[90,22],[88,21],[80,15],[77,8],[73,17],[70,21],[68,24],[60,25],[57,25],[52,28],[48,30],[44,38],[36,36],[28,36],[23,38],[19,40],[15,38],[12,45],[8,44],[3,42],[-3,36]],
    // North America
    [[-168,66],[-165,60],[-162,55],[-155,58],[-148,61],[-140,60],[-135,57],[-130,54],[-125,49],[-124,42],[-120,34],[-117,32],[-110,24],[-105,21],[-97,16],[-92,15],[-88,16],[-87,21],[-91,25],[-94,29],[-89,29],[-84,30],[-81,25],[-80,32],[-75,35],[-70,42],[-66,45],[-60,47],[-56,52],[-64,58],[-78,62],[-85,66],[-95,68],[-105,69],[-115,70],[-125,70],[-135,69],[-145,70],[-156,71],[-165,68]],
    // South America
    [[-81,8],[-77,8],[-72,11],[-64,10],[-60,8],[-52,5],[-50,0],[-44,-2],[-38,-5],[-35,-8],[-38,-13],[-39,-18],[-45,-23],[-48,-25],[-53,-34],[-58,-38],[-62,-40],[-65,-45],[-68,-50],[-72,-54],[-75,-50],[-74,-44],[-73,-37],[-71,-30],[-70,-23],[-70,-18],[-76,-14],[-81,-6],[-80,-2],[-79,2]],
    // Australia
    [[113,-22],[114,-26],[115,-32],[118,-35],[124,-34],[130,-32],[134,-33],[138,-35],[141,-38],[146,-39],[150,-37],[153,-31],[153,-26],[148,-20],[145,-15],[142,-11],[137,-12],[132,-11],[130,-13],[126,-14],[122,-17],[117,-20]],
    // Greenland
    [[-45,60],[-50,62],[-53,66],[-55,70],[-60,76],[-55,80],[-45,83],[-30,82],[-22,76],[-25,70],[-32,66],[-40,62]],
    // Madagascar / UK / Japan / NZ / Sumatra-Java
    [[43,-12],[50,-15],[50,-25],[45,-25],[43,-19]],
    [[-6,50],[-3,53],[-5,58],[-2,58],[0,53],[1,51]],
    [[130,31],[132,34],[137,35],[141,41],[145,44],[141,45],[139,38],[135,34],[131,31]],
    [[166,-46],[174,-41],[178,-37],[173,-34],[170,-43]],
    [[95,5],[105,-6],[115,-8],[105,-7],[100,0]]
  ];

  const W = 1024, H = 512;
  const c2 = document.createElement('canvas'); c2.width = W; c2.height = H;
  const ctx = c2.getContext('2d');
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#fff';
  for (const poly of LAND) {
    ctx.beginPath();
    poly.forEach(([lon, lat], i) => {
      const x = (lon + 180) / 360 * W, y = (90 - lat) / 180 * H;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    });
    ctx.closePath(); ctx.fill();
  }
  const mask = ctx.getImageData(0, 0, W, H).data;
  const isLand = (lon, lat) => {
    const x = Math.floor((lon + 180) / 360 * W), y = Math.floor((90 - lat) / 180 * H);
    return mask[(clamp(y, 0, H - 1) * W + clamp(x, 0, W - 1)) * 4] > 100;
  };

  // --- three setup
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.z = 7.25;          // frames the sphere at ~62% of viewport height
  const group = new THREE.Group();
  scene.add(group);
  const R = 1.72;
  const LIFT = 0.67;                 // sits the globe centre at ~38vh, clearing the nav

  // fibonacci sphere -> land dots + faint ocean dots
  const N = window.innerWidth < 760 ? 46000 : 115000;
  const land = [], sea = [];
  const phi = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const th = phi * i;
    const x = Math.cos(th) * r, z = Math.sin(th) * r;
    const lat = Math.asin(y) * 180 / Math.PI;
    const lon = Math.atan2(z, x) * 180 / Math.PI;
    (isLand(lon, lat) ? land : sea).push(x * R, y * R, z * R);
  }
  function pts(arr, size, color, opacity) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
    const m = new THREE.PointsMaterial({ size, color, transparent: true, opacity, sizeAttenuation: true, depthWrite: false });
    const p = new THREE.Points(g, m);
    group.add(p); return p;
  }
  pts(land, 0.0225, 0xffffff, 1);
  pts(sea.filter((_, i) => i % 18 < 3), 0.014, 0x9aa0ad, 0.20);

  // opaque core so we only ever see the near hemisphere
  const shell = new THREE.Mesh(
    new THREE.SphereGeometry(R * 0.988, 64, 40),
    new THREE.MeshBasicMaterial({ color: 0x0a0a0c })
  );
  shell.renderOrder = -1;
  group.add(shell);

  // orbit rings
  const rings = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const rr = R * (1.18 + i * 0.075);
    const geo = new THREE.BufferGeometry();
    const v = [];
    for (let a = 0; a <= 180; a++) {
      const t = a / 180 * Math.PI * 2;
      v.push(Math.cos(t) * rr, 0, Math.sin(t) * rr);
    }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({
      color: 0xffffff, transparent: true, opacity: 0.07 + i * 0.012
    }));
    line.rotation.x = (18 + i * 13) * Math.PI / 180;
    line.rotation.z = (i * 41) * Math.PI / 180;
    rings.add(line);
  }
  scene.add(rings);

  // travelling arcs between random land points
  const arcs = new THREE.Group(); scene.add(arcs);
  const landPts = [];
  for (let i = 0; i < land.length; i += 3) landPts.push(new THREE.Vector3(land[i], land[i + 1], land[i + 2]));
  for (let i = 0; i < 9; i++) {
    const a = landPts[(Math.random() * landPts.length) | 0];
    const b = landPts[(Math.random() * landPts.length) | 0];
    const mid = a.clone().add(b).multiplyScalar(.5).normalize().multiplyScalar(R * (1.24 + Math.random() * .2));
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    const geo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(60));
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({
      color: i % 3 === 0 ? 0xff2e88 : 0xffffff, transparent: true, opacity: i % 3 === 0 ? .32 : .13
    }));
    arcs.add(line);
  }
  group.rotation.x = 0.36;
  arcs.rotation.x = 0.36;
  group.position.y = arcs.position.y = rings.position.y = LIFT;

  let tx = 0, ty = 0;
  if (!isTouch) window.addEventListener('mousemove', e => {
    tx = (e.clientY / innerHeight - .5) * .22;
    ty = (e.clientX / innerWidth - .5) * .34;
  });

  /* --- grab to spin -------------------------------------------------
     Drag reads as a trackball: horizontal drag feeds the spin velocity
     (so a flick keeps coasting), vertical drag tilts and stays put.
     On release the spin eases back to its idle drift.            */
  const IDLE = 0.0013;
  let spinVel = IDLE, tilt = 0, dragging = false, px = 0, py = 0, lastMove = 0;

  canvas.addEventListener('pointerdown', e => {
    dragging = true; px = e.clientX; py = e.clientY; lastMove = performance.now();
    canvas.classList.add('is-drag');
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', e => {
    if (!dragging) return;
    const dx = e.clientX - px, dy = e.clientY - py;
    px = e.clientX; py = e.clientY; lastMove = performance.now();
    spinVel = dx * 0.0045;
    tilt = clamp(tilt + dy * 0.004, -0.75, 0.75);
  });
  const release = e => {
    if (!dragging) return;
    dragging = false;
    canvas.classList.remove('is-drag');
    // a drag that ended while stationary shouldn't fling
    if (performance.now() - lastMove > 90) spinVel = IDLE;
    if (e && e.pointerId != null && canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);

  // Frame the sphere at 62% of viewport height, but never wider than 85% of
  // viewport width — otherwise it bursts out of portrait/phone screens.
  let lift = LIFT;
  function size() {
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    renderer.setSize(r.width, r.height, false);
    const aspect = r.width / r.height;
    const frac = Math.min(0.62, 0.85 * aspect);       // sphere / viewport height
    const visibleH = (R * 2) / frac;                  // world units across the viewport
    camera.aspect = aspect;
    camera.position.z = visibleH / (2 * Math.tan(camera.fov * Math.PI / 360));
    camera.updateProjectionMatrix();
    lift = visibleH * 0.08;                           // centre at 42vh: crown clears the nav
  }
  size(); window.addEventListener('resize', size);

  const state = { spin: 0, scale: 1, drift: 0 };
  (function tick() {
    if (!dragging) spinVel = lerp(spinVel, IDLE, 0.025);   // coast, then resume drift
    state.spin += spinVel;
    group.rotation.y = arcs.rotation.y = state.spin;
    rings.rotation.y = -state.spin * 0.55;
    group.rotation.x = lerp(group.rotation.x, 0.36 + tilt + tx, .05);
    arcs.rotation.x = group.rotation.x;
    group.position.x = arcs.position.x = lerp(group.position.x, ty * 0.4, .05);
    group.position.y = arcs.position.y = rings.position.y = lift + state.drift * lift;
    group.scale.setScalar(state.scale);
    arcs.scale.setScalar(state.scale);
    rings.scale.setScalar(state.scale);
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  })();

  return state;
}
const globeState = buildGlobe();

/* ============================================================
   10 · HERO SCROLL
   ============================================================ */
// globe parallaxes up + dissolves across the first viewport of scroll
if ($('.hero')) gsap.timeline({
  scrollTrigger: { trigger: '.hero', start: 'top top', end: '+=' + window.innerHeight, scrub: 1 }
})
  .to('.hero__globe', { yPercent: -16, opacity: .18, ease: 'none' }, 0)
  .to('.hero__cue', { opacity: 0, duration: .12 }, 0)
  .to('.hero__status', { opacity: 0, y: -50, ease: 'none' }, 0);

if (globeState) {
  ScrollTrigger.create({
    trigger: '.hero', start: 'top top', end: '+=' + window.innerHeight, scrub: 1,
    onUpdate: s => {
      globeState.scale = 1 + s.progress * 0.42;
      globeState.drift = s.progress * 0.5;
    }
  });
}

/* ============================================================
   11 · SCROLL RAIL
   ============================================================ */
const railFill = $('#railFill'), railPct = $('#railPct');
if (railFill && railPct) ScrollTrigger.create({
  start: 0, end: 'max',
  onUpdate: s => {
    const p = Math.round(s.progress * 100);
    railFill.style.height = p + '%';
    railPct.textContent = String(p).padStart(3, '0') + '%';
  }
});

/* ============================================================
   12 · MARQUEES  (scroll-velocity reactive)
   ============================================================ */
$$('.marquee').forEach((m, i) => {
  const row = m.querySelector('.marquee__row');
  const dir = m.classList.contains('marquee--rev') ? 1 : -1;
  const w = row.scrollWidth / 3;
  let x = dir < 0 ? 0 : -w;
  const base = 0.45 + i * 0.06;
  let boost = 0;
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: s => { boost = clamp(Math.abs(s.getVelocity()) / 900, 0, 7); }
  });
  (function run() {
    x += dir * (base + boost);
    if (dir < 0 && x <= -w) x += w;
    if (dir > 0 && x >= 0) x -= w;
    row.style.transform = `translate3d(${x}px,0,0)`;
    requestAnimationFrame(run);
  })();
});

/* ============================================================
   13 · COUNTERS
   ============================================================ */
$$('[data-count]').forEach(el => {
  const to = +el.dataset.count, dec = +(el.dataset.dec || 0);
  ScrollTrigger.create({
    trigger: el, start: 'top 92%', once: true,
    onEnter: () => gsap.to({ v: 0 }, {
      v: to, duration: 1.7, ease: 'power2.out',
      onUpdate() { el.textContent = this.targets()[0].v.toFixed(dec); }
    })
  });
});

/* ============================================================
   14 · REVIEWS CAROUSEL  (auto + drag)
   ============================================================ */
(() => {
  const track = $('#reviewTrack');
  if (!track) return;
  const half = () => track.scrollWidth / 2;
  let x = 0, drag = false, startX = 0, startPos = 0, vel = 0, auto = 0.42;
  const apply = () => { track.style.transform = `translate3d(${x}px,0,0)`; };

  function wrap() { const h = half(); if (x <= -h) x += h; if (x > 0) x -= h; }

  track.addEventListener('pointerdown', e => {
    drag = true; startX = e.clientX; startPos = x; vel = 0;
    track.classList.add('is-drag'); track.setPointerCapture(e.pointerId);
  });
  track.addEventListener('pointermove', e => {
    if (!drag) return;
    const nx = startPos + (e.clientX - startX);
    vel = nx - x; x = nx; wrap(); apply();
  });
  const end = () => { drag = false; track.classList.remove('is-drag'); };
  track.addEventListener('pointerup', end);
  track.addEventListener('pointercancel', end);
  track.addEventListener('mouseleave', end);

  let hover = false;
  track.addEventListener('mouseenter', () => hover = true);
  track.addEventListener('mouseleave', () => hover = false);

  (function run() {
    if (!drag) {
      vel *= 0.93;
      x += vel + (hover ? 0 : -auto);
      wrap(); apply();
    }
    requestAnimationFrame(run);
  })();
})();

/* ============================================================
   15 · THEME INVERSION + METHOD HORIZONTAL PIN
   ============================================================ */
(() => {
  const rail = $('#methodRail');
  if (!rail) return;
  const panels = $$('.phase', rail);
  const nodes = $$('.tracker__node');
  const labels = $$('.tracker__labels em');
  const n = panels.length;

  const setActive = i => {
    nodes.forEach((el, k) => el.classList.toggle('is-on', k <= i));
    labels.forEach((el, k) => el.classList.toggle('is-on', k <= i));
  };
  setActive(0);

  ScrollTrigger.create({
    trigger: '#methodPin',
    start: 'top top',
    end: () => '+=' + (window.innerHeight * (n - 1) * 1.15),
    pin: true,
    scrub: 1,
    anticipatePin: 1,
    invalidateOnRefresh: true,
    refreshPriority: 1,   // must recalc before the theme trigger below reads .method's height
    onUpdate: s => {
      const p = s.progress;
      rail.style.transform = `translate3d(${-p * (n - 1) * 100}vw,0,0)`;
      setActive(Math.round(p * (n - 1)));
      // parallax the ghost numerals + content
      panels.forEach((el, i) => {
        const local = clamp(p * (n - 1) - i, -1, 1);
        const ghost = el.querySelector('.phase__ghost');
        if (ghost) ghost.style.transform = `translate(-50%,-52%) translateX(${local * 26}vw)`;
        el.querySelector('.phase__t').style.transform = `translateX(${local * -7}vw)`;
        el.style.opacity = String(1 - Math.min(Math.abs(local), 1) * 0.28);
      });
    }
  });
})();

// The light chapter is painted by CSS (.chapter--light) and bridged by the
// torn ink edge — no global theme class to toggle, nothing to keep in sync.

/* ============================================================
   15b · TORN INK EDGE
   The sheet grows upward (scaleY 0 -> 1 from a bottom origin)
   as the boundary crosses the viewport; the SVG filter chews the
   advancing top edge into a ragged ink blot.
   ============================================================ */
$$('.ink, .inkband').forEach(win => {
  const sheet = $('.ink__sheet', win);
  if (!sheet) return;
  if (REDUCED) { sheet.style.transform = 'scaleY(1)'; return; }
  ScrollTrigger.create({
    trigger: win,
    start: 'bottom bottom',
    end: () => '+=' + (window.innerHeight * 1.25),
    scrub: true,
    invalidateOnRefresh: true,
    onUpdate: s => {
      sheet.style.transform = `scaleY(${s.progress.toFixed(4)})`;
    }
  });
});

/* ============================================================
   16 · ARC TEXT
   ============================================================ */
(() => {
  const host = $('#arc');
  if (!host) return;
  const txt = 'TECHNOLOGY DOESN’T HAVE TO BE THE MOST SOPHISTICATED — IT HAS TO BE THE MOST USEFUL · ';
  host.innerHTML = `
    <svg viewBox="0 0 600 600">
      <defs><path id="arcPath" d="M 60,300 a 240,240 0 1,1 480,0 a 240,240 0 1,1 -480,0"/></defs>
      <text><textPath href="#arcPath" startOffset="0%">${txt.repeat(2)}</textPath></text>
    </svg>`;
  const tp = host.querySelector('textPath');
  ScrollTrigger.create({
    trigger: '.friction', start: 'top bottom', end: 'bottom top', scrub: 1,
    onUpdate: s => { tp.setAttribute('startOffset', (-s.progress * 40) + '%'); }
  });
  gsap.to(host, {
    rotation: 18, ease: 'none',
    scrollTrigger: { trigger: '.friction', start: 'top bottom', end: 'bottom top', scrub: 1.4 }
  });
})();

/* ============================================================
   17 · REVEALS
   ============================================================ */
// generic blur-up reveals
$$('[data-reveal]').forEach(el => {
  gsap.to(el, {
    opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.05, ease: 'power3.out',
    scrollTrigger: { trigger: el, start: 'top 88%', once: true }
  });
});

// headline char reveals (outside hero)
$$('.friction__h [data-split], .deserve__h [data-split], .page__h [data-split]').forEach(w => {
  const chars = splitChars(w);
  gsap.set(chars, { yPercent: 110, opacity: 0, filter: 'blur(10px)' });
  gsap.to(chars, {
    yPercent: 0, opacity: 1, filter: 'blur(0px)',
    duration: 1.1, stagger: .022, ease: 'expo.out',
    scrollTrigger: { trigger: w.closest('h1,h2'), start: 'top 82%', once: true }
  });
});

// eyebrows + footer socials scramble into view
$$('.eyebrow[data-scramble], [data-scramble-late]').forEach(el => {
  const finalText = el.textContent;
  el.textContent = '';
  ScrollTrigger.create({
    trigger: el, start: 'top 92%', once: true,
    onEnter: () => scramble(el, finalText)
  });
});

// case cards
$$('.case').forEach((el, i) => {
  gsap.from(el, {
    y: 46, opacity: 0, duration: 1, ease: 'power3.out', delay: (i % 2) * .08,
    scrollTrigger: { trigger: el, start: 'top 88%', once: true }
  });
});

// footer columns
$$('.foot__col').forEach((el, i) => {
  gsap.from(el, {
    y: 24, opacity: 0, duration: .8, delay: i * .06, ease: 'power3.out',
    scrollTrigger: { trigger: '.foot__cols', start: 'top 90%', once: true }
  });
});

/* ============================================================
   18 · CLICK RIPPLES
   Tapping the backdrop drops a stone in the water: a few concentric
   rings race outward on an ease-out curve, thinning and fading.
   Staggered radii + a trailing ring read as a surface wave rather
   than a single expanding circle.
   ============================================================ */
(() => {
  const cv = $('#ripples');
  if (!cv || REDUCED) { if (cv) cv.remove(); return; }
  const ctx = cv.getContext('2d');
  let dpr = 1, drops = [];

  function size() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = innerWidth * dpr;
    cv.height = innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  size();
  window.addEventListener('resize', size);

  // don't fire when the click was meant for something
  const INTERACTIVE = 'a,button,input,textarea,select,label,.rev,.case,.mcard,.nav__pill,.mega,.search__box';
  // fire on release, and only for a real click — dragging the globe
  // shouldn't leave a trail of ripples behind it
  let dn = null;
  window.addEventListener('pointerdown', e => {
    dn = (e.button === 0) ? { x: e.clientX, y: e.clientY, t: performance.now() } : null;
  });
  window.addEventListener('pointerup', e => {
    if (!dn) return;
    const moved = Math.hypot(e.clientX - dn.x, e.clientY - dn.y);
    const held = performance.now() - dn.t;
    dn = null;
    if (moved > 6 || held > 600) return;
    if (e.target.closest && e.target.closest(INTERACTIVE)) return;
    drops.push({ x: e.clientX, y: e.clientY, t: performance.now() });
    if (drops.length > 6) drops.shift();
  });

  const LIFE = 1500;
  const easeOut = t => 1 - Math.pow(1 - t, 3);

  (function draw() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    const now = performance.now();
    const reach = Math.max(innerWidth, innerHeight) * 0.42;

    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i];
      const age = (now - d.t) / LIFE;
      if (age >= 1) { drops.splice(i, 1); continue; }

      const fade = Math.pow(1 - age, 2);
      for (let k = 0; k < 3; k++) {
        const r = easeOut(age) * reach - k * 30;
        if (r <= 0) continue;
        const a = fade * (0.30 - k * 0.085);
        if (a <= 0) continue;
        ctx.beginPath();
        ctx.arc(d.x, d.y, r, 0, Math.PI * 2);
        ctx.strokeStyle = k === 1 ? `rgba(255,46,136,${a * 0.8})` : `rgba(255,255,255,${a})`;
        ctx.lineWidth = Math.max(0.4, (1 - age) * (k === 0 ? 1.7 : 1));
        ctx.stroke();
      }
    }
    requestAnimationFrame(draw);
  })();
})();


/* ============================================================
   19 · CONTACT WIRING
   ============================================================ */
// WhatsApp CTA -> wa.me, or the contact page while no number is set
$$('.nav__cta').forEach(a => {
  a.href = WHATSAPP;
  if (WHATSAPP.startsWith('http')) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
});
$$('[data-mailto]').forEach(a => { a.href = MAILTO; });

/* The form has no backend, so it hands off to the visitor's mail client with
   everything already filled in. Swap the handler for a fetch() to Formspree /
   Getform / your own endpoint when you want submissions to land server-side. */
(() => {
  const form = $('#cform');
  if (!form) return;
  const msg = $('#cformMsg', form) || $('#cformMsg');

  form.addEventListener('submit', e => {
    e.preventDefault();
    const data = new FormData(form);
    const name = (data.get('name') || '').toString().trim();
    const email = (data.get('email') || '').toString().trim();
    const body = (data.get('message') || '').toString().trim();

    if (!name || !email || !body) {
      msg.textContent = 'Please fill in all three fields.';
      msg.className = 'cform__msg is-err';
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      msg.textContent = 'That email address looks incomplete.';
      msg.className = 'cform__msg is-err';
      return;
    }

    const subject = `Project enquiry from ${name}`;
    const lines = `${body}

—
${name}
${email}`;
    window.location.href =
      `${MAILTO}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines)}`;

    msg.textContent = 'Opening your mail app with the message ready to send.';
    msg.className = 'cform__msg is-ok';
  });
})();

/* ============================================================
   BOOT
   ============================================================ */
window.addEventListener('load', () => {
  ScrollTrigger.refresh();
  runIntro();
});
// if `load` never fires (a hung font/CDN request), boot anyway
setTimeout(() => { if (!introDone) { ScrollTrigger.refresh(); runIntro(); } }, 4000);

})();
