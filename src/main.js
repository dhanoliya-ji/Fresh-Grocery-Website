import './style.css';
import './features.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { STORE, CATEGORIES, PRODUCTS, DEALS, BUNDLES, RECIPE, REVIEWS, byId } from './data.js';
import { cart, money } from './cart.js';
import { tilt } from './tilt.js';
import { createHero } from './hero.js';
import { odo, flip } from './fx/odometer.js';
import { splitWords, revealHeadings } from './fx/reveal.js';
import { createBasket } from './fx/basket.js';
import { initCursor } from './fx/cursor.js';
import { initSeason } from './fx/season.js';
import { initTheme } from './features/theme.js';
import { initWalk } from './features/walk.js';
import { initStoreMap } from './features/storemap.js';
import { initWheel } from './features/wheel.js';
import { initSmoothie } from './features/smoothie.js';
import { initPlanner } from './features/planner.js';
import { initTracking } from './features/tracking.js';
import { initCompare } from './features/compare.js';
import { initVoice } from './features/voice.js';
import { initFarms } from './features/farms.js';
import { initActivity } from './features/activity.js';
import { initScratch } from './features/scratch.js';

gsap.registerPlugin(ScrollTrigger);
const BASE = import.meta.env.BASE_URL;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const catName = (id) => CATEGORIES.find((c) => c.id === id)?.name || '';
const catColor = (id) => CATEGORIES.find((c) => c.id === id)?.color || '#f4ecdf';
const src = (p) => `${BASE}img/${p.cut ? 'c' : 'p'}/${p.img}.webp`;
const img = (p, extra = '') => `<img src="${src(p)}" alt="${esc(p.name)}" class="${p.cut ? '' : 'photo'} ${extra}" loading="lazy" draggable="false" />`;
const stars = (r) => `<b>★ ${r.toFixed(1)}</b>`;

// how fresh is it? a believable "picked / baked N hours ago", stable for the day
const hash = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
const dayNo = Math.floor(Date.now() / 864e5);
function freshness(p) {
  const verb = { fruits: 'Picked', vegetables: 'Picked', bakery: 'Baked', dairy: p.id === 'eggs' ? 'Collected' : 'Bottled', meat: 'Cut' }[p.cat];
  if (!verb) return null;
  const max = p.cat === 'bakery' ? 5 : p.cat === 'meat' ? 8 : 14;
  const h = 1 + ((hash(p.id) + dayNo) % max);
  return { text: `${verb} ${h}h ago`, f: Math.max(0.35, 1 - h / 24) };
}
const freshHtml = (p) => {
  const f = freshness(p);
  return f ? `<span class="fresh" style="--f:${f.f.toFixed(2)}" title="Freshness"><i></i>${f.text}</span>` : '';
};

// ============================================================ header
const header = $('#header');
addEventListener('scroll', () => header.classList.toggle('scrolled', scrollY > 10), { passive: true });
const etaEl = $('#eta');
setInterval(() => (etaEl.textContent = 22 + Math.floor(Math.random() * 12)), 30000);
$('#year').textContent = new Date().getFullYear();

// ============================================================ toasts & fx
function toast(text, p) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `${p ? `<img src="${src(p)}" alt="" />` : ''}<span>${text}</span>`;
  $('#toasts').appendChild(el);
  setTimeout(() => el.remove(), 2900);
}

// product image flies in a 3D arc into the cart button
function flyToCart(fromEl, p) {
  if (!fromEl || reduced) return bumpCart();
  const r = fromEl.getBoundingClientRect();
  const c = $('#cartBtn').getBoundingClientRect();
  const f = document.createElement('img');
  f.src = src(p);
  f.className = `flyer ${p.cut ? '' : 'photo'}`;
  const size = Math.min(140, Math.max(60, r.width));
  Object.assign(f.style, { left: `${r.left + r.width / 2 - size / 2}px`, top: `${r.top + r.height / 2 - size / 2}px`, width: `${size}px`, height: `${size}px` });
  document.body.appendChild(f);
  const dx = c.left + c.width / 2 - (r.left + r.width / 2);
  const dy = c.top + c.height / 2 - (r.top + r.height / 2);
  const tl = gsap.timeline({ onComplete: () => (f.remove(), bumpCart()) });
  tl.to(f, { duration: 0.75, ease: 'power1.in', x: dx })
    .to(f, { duration: 0.75, ease: 'back.out(1)', keyframes: [{ y: -120 }, { y: dy }] }, 0)
    .to(f, { duration: 0.75, scale: 0.22, rotation: 320, ease: 'power2.in' }, 0);
}
function bumpCart() {
  const b = $('#cartBtn');
  b.classList.remove('bump');
  void b.offsetWidth;
  b.classList.add('bump');
}

// confetti burst
function confetti() {
  if (reduced) return;
  const cv = $('#confetti');
  const ctx = cv.getContext('2d');
  cv.width = innerWidth * devicePixelRatio;
  cv.height = innerHeight * devicePixelRatio;
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  const cols = ['#1f7a4d', '#2e9e5b', '#e8453c', '#ffc94a', '#ff8a3d', '#8fd19e'];
  const P = Array.from({ length: 180 }, () => ({ x: innerWidth / 2, y: innerHeight * 0.45, vx: (Math.random() - 0.5) * 16, vy: -Math.random() * 16 - 4, r: Math.random() * 6 + 4, c: cols[(Math.random() * cols.length) | 0], a: Math.random() * 6, va: (Math.random() - 0.5) * 0.4 }));
  let t = 0;
  const step = () => {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of P) {
      p.vy += 0.35;
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.a += p.va;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.a);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2);
      ctx.restore();
    }
    if (++t < 200) requestAnimationFrame(step);
    else ctx.clearRect(0, 0, innerWidth, innerHeight);
  };
  step();
}

// everything the feature modules need from the page
const app = { BASE, reduced, esc, src, img, money, byId, PRODUCTS, CATEGORIES, catColor, tilt, toast, flyToCart, confetti, openProduct, setCat, openDrawer };

// ============================================================ hero
const hero = createHero({
  canvas: $('#heroCanvas'),
  base: BASE,
  tip: $('#heroTip'),
  reduced,
  onPick: (it) => {
    setCat(it.cat);
    toast(`Showing ${catName(it.cat)}`, byId[it.id]);
    setTimeout(() => $('#shop').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' }), 150);
  },
});
hero.setLabels((id) => byId[id]?.name || id);
const heroWords = splitWords($('#heroTitle'));
if (!reduced) {
  gsap.set(heroWords, { yPercent: 115 });
  gsap.set('.hero-copy > :not(h1)', { y: 26, opacity: 0 });
  gsap.to('.hero-copy', { y: -60, opacity: 0.2, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  // the sun climbs from a low morning sun toward noon as you scroll
  gsap.fromTo('.sun', { y: 120, x: 60, scale: 0.85 }, { y: -80, x: -40, scale: 1.05, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
}
function startHero() {
  hero.start();
  if (reduced) return;
  gsap.to(heroWords, { yPercent: 0, duration: 1, stagger: 0.07, ease: 'power4.out', delay: 0.1 });
  gsap.to('.hero-copy > :not(h1)', { y: 0, opacity: 1, duration: 0.9, stagger: 0.09, ease: 'power3.out', delay: 0.35 });
}

// loader: hide once the hero produce has arrived (at least ~0.9 s so the apple can drop, at most 4 s)
{
  const t0 = performance.now();
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    setTimeout(() => {
      $('#loader').classList.add('gone');
      startHero();
    }, Math.max(0, 900 - (performance.now() - t0)));
  };
  hero.ready().then(finish);
  setTimeout(finish, 4000);
}

// ============================================================ categories
const catGrid = $('#catGrid');
catGrid.innerHTML = CATEGORIES.map((c) => {
  const p = byId[c.hero];
  const n = PRODUCTS.filter((x) => x.cat === c.id).length;
  return `<button class="cat" data-cat="${c.id}" style="--c:${c.color}"><h3>${c.name}</h3><p>${c.blurb}</p><span class="cnt">${n} items</span>${img(p)}</button>`;
}).join('');
$$('.cat').forEach((el) => {
  tilt(el, { max: 10 });
  el.addEventListener('click', () => {
    setCat(el.dataset.cat);
    $('#shop').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  });
});

// ============================================================ shop: filters, search, grid
const state = { cat: 'all', q: '', organic: false, sale: false, max: 20, sort: 'pop' };
const chips = $('#chips');
chips.innerHTML = [{ id: 'all', name: 'All' }, ...CATEGORIES].map((c) => `<button class="chip ${c.id === 'all' ? 'on' : ''}" data-cat="${c.id}" role="tab">${c.name}</button>`).join('');
chips.addEventListener('click', (e) => {
  const b = e.target.closest('.chip');
  if (b) setCat(b.dataset.cat);
});
function setCat(id) {
  state.cat = id;
  $$('.chip').forEach((c) => c.classList.toggle('on', c.dataset.cat === id));
  render();
}
$('#fOrganic').addEventListener('change', (e) => ((state.organic = e.target.checked), render()));
$('#fSale').addEventListener('change', (e) => ((state.sale = e.target.checked), render()));
$('#fPrice').addEventListener('input', (e) => {
  state.max = +e.target.value;
  $('#priceOut').textContent = state.max >= 20 ? '$20+' : `$${state.max}`;
  render();
});
$('#sort').addEventListener('change', (e) => ((state.sort = e.target.value), render()));
$('#clearFilters').addEventListener('click', () => {
  Object.assign(state, { cat: 'all', q: '', organic: false, sale: false, max: 20 });
  $('#search').value = '';
  $('#fOrganic').checked = $('#fSale').checked = false;
  $('#fPrice').value = 20;
  $('#priceOut').textContent = '$20+';
  setCat('all');
});

const match = (p, q) => {
  if (!q) return true;
  const hay = `${p.name} ${catName(p.cat)} ${p.origin} ${p.badges.join(' ')}`.toLowerCase();
  return q.toLowerCase().split(/\s+/).every((w) => hay.includes(w));
};
function filtered() {
  let list = PRODUCTS.filter((p) => (state.cat === 'all' || p.cat === state.cat) && match(p, state.q) && (!state.organic || p.badges.includes('Organic')) && (!state.sale || p.old) && (state.max >= 20 || p.price <= state.max));
  const s = state.sort;
  if (s === 'low') list.sort((a, b) => a.price - b.price);
  else if (s === 'high') list.sort((a, b) => b.price - a.price);
  else if (s === 'rating') list.sort((a, b) => b.rating - a.rating);
  else if (s === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
  else list.sort((a, b) => b.reviews - a.reviews);
  return list;
}

const buyHtml = (p) => {
  const q = cart.qty(p.id);
  return q ? `<div class="stepper" data-id="${p.id}"><button data-act="dec" aria-label="Remove one">−</button><span>${q}</span><button data-act="inc" aria-label="Add one">+</button></div>` : `<button class="add" data-act="add" data-id="${p.id}" aria-label="Add ${esc(p.name)} to basket">+</button>`;
};
const badgeHtml = (p) => p.badges.map((b) => `<span class="badge ${b.split(' ')[0]}">${b === 'Sale' ? `-${Math.round((1 - p.price / p.old) * 100)}%` : b}</span>`).join('');
const cardHtml = (p, i) => `
  <article class="card enter" data-id="${p.id}" style="animation-delay:${Math.min(i, 12) * 35}ms">
    <div class="pic" style="--c:${catColor(p.cat)}">
      <div class="badges">${badgeHtml(p)}</div>
      <button class="icon-btn wish ${cart.wish.has(p.id) ? 'on' : ''}" data-act="wish" aria-label="Save ${esc(p.name)}"><svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-9.3-9.2C1.4 8.4 3.4 5 6.9 5c2 0 3.6 1.2 5.1 3 1.5-1.8 3.1-3 5.1-3 3.5 0 5.5 3.4 4.2 6.8C19.5 16.4 12 21 12 21z"/></svg></button>
      <button class="cmp-btn ${compare?.has(p.id) ? 'on' : ''}" data-act="cmp" aria-label="Compare ${esc(p.name)}" title="Compare">⇄</button>
      ${img(p)}
    </div>
    <h3>${esc(p.name)}</h3>
    <span class="unit">${p.unit} · ${esc(p.origin)}</span>
    <span class="rate">${stars(p.rating)} (${p.reviews})${freshHtml(p)}</span>
    <div class="foot"><span class="price">${money(p.price)}${p.old ? `<s>${money(p.old)}</s>` : ''}</span><span class="buy">${buyHtml(p)}</span></div>
  </article>`;

const grid = $('#grid');
function render() {
  const list = filtered();
  $('#shopTitle').textContent = state.q ? `Results for “${state.q}”` : state.cat === 'all' ? 'All products' : catName(state.cat);
  $('#resultCount').textContent = `${list.length} product${list.length === 1 ? '' : 's'}`;
  grid.innerHTML = list.map(cardHtml).join('');
  $('#empty').hidden = list.length > 0;
  $$('.card', grid).forEach((c) => tilt(c, { max: 9 }));
}
function refreshBuy(id) {
  $$(`.card[data-id="${id}"] .buy`).forEach((el) => (el.innerHTML = buyHtml(byId[id])));
  $$(`.card[data-id="${id}"] .wish`).forEach((el) => el.classList.toggle('on', cart.wish.has(id)));
}

// one delegated handler for every product tile on the page (grid, deals, mini cards)
document.addEventListener('click', (e) => {
  const act = e.target.closest('[data-act]');
  const card = e.target.closest('[data-id].card, .deal[data-id], .mc[data-id]');
  if (act) {
    const id = act.dataset.id || act.closest('[data-id]')?.dataset.id;
    const p = byId[id];
    if (!p) return;
    e.stopPropagation();
    const a = act.dataset.act;
    if (a === 'add') {
      cart.add(id);
      flyToCart(act.closest('.card, .deal, .mc')?.querySelector('img'), p);
      toast(`Added <b>${esc(p.name)}</b>`, p);
    } else if (a === 'inc') cart.add(id);
    else if (a === 'dec') cart.set(id, cart.qty(id) - 1);
    else if (a === 'wish') {
      cart.toggleWish(id);
      toast(cart.wish.has(id) ? `Saved ${esc(p.name)} ♥` : 'Removed from wishlist');
    } else if (a === 'cmp') compare.toggle(id);
    return;
  }
  if (card && !e.target.closest('button')) openProduct(card.dataset.id);
});

// ---------------- search + suggestions ----------------
const search = $('#search'), suggest = $('#suggest');
let sIdx = -1;
function showSuggest() {
  const q = search.value.trim();
  if (!q) return suggest.classList.remove('show');
  const hits = PRODUCTS.filter((p) => match(p, q)).slice(0, 6);
  sIdx = -1;
  suggest.innerHTML = hits.length
    ? hits.map((p) => `<button data-id="${p.id}" role="option"><img src="${src(p)}" alt="" /><span>${esc(p.name).replace(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'i'), '<em>$1</em>')}</span><b>${money(p.price)}</b></button>`).join('')
    : `<button disabled><span>No matches for “${esc(q)}”</span></button>`;
  suggest.classList.add('show');
}
search.addEventListener('input', () => {
  state.q = search.value.trim();
  showSuggest();
  render();
});
search.addEventListener('keydown', (e) => {
  const opts = $$('button[data-id]', suggest);
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    sIdx = (sIdx + (e.key === 'ArrowDown' ? 1 : -1) + opts.length) % opts.length;
    opts.forEach((o, i) => o.classList.toggle('act', i === sIdx));
  } else if (e.key === 'Enter') {
    if (sIdx >= 0 && opts[sIdx]) openProduct(opts[sIdx].dataset.id);
    else $('#shop').scrollIntoView({ behavior: 'smooth' });
    suggest.classList.remove('show');
  } else if (e.key === 'Escape') suggest.classList.remove('show');
});
suggest.addEventListener('click', (e) => {
  const b = e.target.closest('button[data-id]');
  if (b) {
    openProduct(b.dataset.id);
    suggest.classList.remove('show');
  }
});
document.addEventListener('click', (e) => !e.target.closest('.search') && suggest.classList.remove('show'));
addEventListener('keydown', (e) => {
  if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
    e.preventDefault();
    search.focus();
  }
});

// ============================================================ deals: 3D ring carousel
const stage = $('#carStage');
const deals = DEALS.map((d) => ({ ...d, p: byId[d.id] }));
stage.innerHTML = deals.map(({ p, label }) => `
  <article class="deal" data-id="${p.id}">
    <span class="off">-${Math.round((1 - p.price / p.old) * 100)}%<small>OFF</small></span>
    <span class="lbl">${label}</span>
    <div class="d-img">${img(p)}</div>
    <h4>${esc(p.name)}</h4><span class="unit">${p.unit}</span>
    <div class="d-row"><span class="price">${money(p.price)}<s>${money(p.old)}</s></span><button class="add" data-act="add" data-id="${p.id}" aria-label="Add ${esc(p.name)}">+</button></div>
  </article>`).join('');
const dealEls = $$('.deal', stage);
let rot = 0;
const layoutRing = () => {
  const n = dealEls.length;
  const radius = innerWidth < 600 ? 230 : Math.max(300, Math.min(520, innerWidth * 0.36));
  dealEls.forEach((el, i) => (el.style.transform = `rotateY(${(360 / n) * i}deg) translateZ(${radius}px)`));
  stage.style.transform = `translateZ(${-radius}px) rotateY(${rot}deg)`;
  const front = ((Math.round(-rot / (360 / n)) % n) + n) % n;
  dealEls.forEach((el, i) => {
    const off = Math.min((i - front + n) % n, (front - i + n) % n);
    el.classList.toggle('dim', off !== 0);
    el.style.visibility = off > 1 ? 'hidden' : '';
  });
};
const spin = (dir) => {
  rot -= dir * (360 / dealEls.length);
  layoutRing();
};
$('#carNext').addEventListener('click', () => spin(1));
$('#carPrev').addEventListener('click', () => spin(-1));
addEventListener('resize', layoutRing);
layoutRing();
let auto = setInterval(() => spin(1), 4200);
$('#carousel').addEventListener('pointerenter', () => clearInterval(auto));
$('#carousel').addEventListener('pointerleave', () => (auto = setInterval(() => spin(1), 4200)));
// swipe
let sx = null;
$('#carousel').addEventListener('pointerdown', (e) => (sx = e.clientX));
$('#carousel').addEventListener('pointerup', (e) => {
  if (sx !== null && Math.abs(e.clientX - sx) > 40) spin(e.clientX < sx ? 1 : -1);
  sx = null;
});

// bundles
$('#bundles').innerHTML = BUNDLES.map((b) => {
  const total = b.items.reduce((s, id) => s + byId[id].price, 0);
  return `<div class="bundle"><img src="${BASE}img/${b.img}.webp" alt="" loading="lazy" /><div><p class="kicker">Bundle · save ${money(b.save)}</p><h4>${b.name}</h4><div class="mini">${b.items.map((id) => `<span>${esc(byId[id].name)}</span>`).join('')}</div><div class="b-row"><span class="price">${money(total - b.save)}<s>${money(total)}</s></span><button class="btn btn-primary" data-bundle="${b.id}">Add bundle</button></div></div></div>`;
}).join('');
$('#bundles').addEventListener('click', (e) => {
  const b = BUNDLES.find((x) => x.id === e.target.closest('[data-bundle]')?.dataset.bundle);
  if (!b) return;
  b.items.forEach((id, i) => setTimeout(() => {
    cart.add(id);
    flyToCart(e.target, byId[id]);
  }, i * 140));
  toast(`Added the <b>${b.name}</b>`);
});

// countdown to Sunday 23:59, flip-clock style
const cd = { d: $('#cdD'), h: $('#cdH'), m: $('#cdM'), s: $('#cdS') };
const endOfWeek = () => {
  const d = new Date();
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7));
  d.setHours(23, 59, 59, 0);
  return d;
};
let dealEnd = endOfWeek();
const tickCd = () => {
  let s = Math.max(0, Math.floor((dealEnd - Date.now()) / 1000));
  if (s === 0) dealEnd = new Date(Date.now() + 7 * 864e5);
  flip(cd.d, String(Math.floor(s / 86400)));
  s %= 86400;
  flip(cd.h, String(Math.floor(s / 3600)).padStart(2, '0'));
  s %= 3600;
  flip(cd.m, String(Math.floor(s / 60)).padStart(2, '0'));
  flip(cd.s, String(s % 60).padStart(2, '0'));
};
tickCd();
setInterval(tickCd, 1000);

// ============================================================ recipe of the day
$('#recipeTitle').textContent = RECIPE.title;
$('#recipeMeta').textContent = `⏱ ${RECIPE.time} · serves ${RECIPE.serves} · ${RECIPE.kcal} kcal per serving`;
$('#recipeImg').src = `${BASE}img/${RECIPE.img}.webp`;
$('#recipeImg').alt = RECIPE.title;
$('#ingredients').innerHTML = RECIPE.items.map(({ id, note }) => `<li>${img(byId[id])}<div><b>${esc(byId[id].name)}</b><small>${note}</small></div></li>`).join('');
$('#steps').innerHTML = RECIPE.steps.map((s) => `<li>${esc(s)}</li>`).join('');
const recipeTotal = RECIPE.items.reduce((s, { id, qty }) => s + byId[id].price * qty, 0);
$('#recipeTotal').textContent = money(recipeTotal);
$('#addRecipe').addEventListener('click', () => {
  RECIPE.items.forEach(({ id, qty }, i) => setTimeout(() => {
    cart.add(id, qty);
    flyToCart($$('#ingredients img')[i], byId[id]);
  }, i * 120));
  toast(`Added everything for the <b>${RECIPE.title}</b>`);
});
// ingredients fly in from all sides as you scroll, then orbit the plate in 3D (depth scaling + layering)
const orbit = $('#orbit');
const orbiters = RECIPE.items.filter(({ id }) => byId[id].cut).map(({ id }) => {
  const el = document.createElement('img');
  el.src = src(byId[id]);
  el.alt = '';
  orbit.appendChild(el);
  return el;
});
let orbitOn = false, assemble = reduced ? 1 : 0;
new IntersectionObserver(([e]) => (orbitOn = e.isIntersecting)).observe(orbit);
if (!reduced) {
  ScrollTrigger.create({ trigger: '.recipe-visual', start: 'top 90%', end: 'center 55%', scrub: 0.8, onUpdate: (s) => (assemble = s.progress) });
  gsap.fromTo('#plate', { scale: 0.7, rotate: -40, opacity: 0.2 }, { scale: 1, rotate: 0, opacity: 1, ease: 'none', scrollTrigger: { trigger: '.recipe-visual', start: 'top 90%', end: 'center 60%', scrub: 0.8 } });
}
const orbitLoop = (t) => {
  requestAnimationFrame(orbitLoop);
  if (!orbitOn) return;
  const w = orbit.clientWidth;
  const n = orbiters.length;
  orbiters.forEach((el, i) => {
    const a = (reduced ? 0 : t * 0.00022) + (i / n) * Math.PI * 2;
    const z = Math.sin(a);
    let x = Math.cos(a) * w * 0.44 + w * 0.5 - w * 0.09;
    let y = z * w * 0.13 + w * 0.46 - w * 0.09 + Math.sin(t * 0.002 + i) * 4;
    let s = 0.75 + (z + 1) * 0.22;
    let r = Math.cos(a) * 12;
    // before assembly each ingredient waits off to one side, big and spinning
    const k = Math.min(1, Math.max(0, assemble * 1.7 - (i / n) * 0.7));
    const e = 1 - Math.pow(1 - k, 3);
    if (e < 1) {
      const ang = i * 2.4 + 0.6;
      const fx = w * 0.5 + Math.cos(ang) * w * 1.1, fy = w * 0.4 + Math.sin(ang) * w * 0.9;
      x = fx + (x - fx) * e;
      y = fy + (y - fy) * e;
      s = 1.6 + (s - 1.6) * e;
      r = r + (1 - e) * 200;
    }
    el.style.transform = `translate(${x}px, ${y}px) scale(${s}) rotate(${r}deg)`;
    el.style.zIndex = z > 0 ? 3 : 0;
    el.style.opacity = (0.65 + (z + 1) * 0.17) * Math.min(1, e * 2.5);
  });
};
requestAnimationFrame(orbitLoop);

// ============================================================ delivery section: the van story
if (!reduced) {
  const road = $('#road');
  const wheels = $$('#van .wh');
  let last = 0;
  const tl = gsap.timeline({
    scrollTrigger: { trigger: road, start: 'top 88%', end: 'bottom 15%', scrub: 0.6 },
    onUpdate: () => {
      const x = gsap.getProperty('#van', 'x');
      if (Math.abs(x - last) > 0.1) wheels.forEach((w) => (w.style.transform = `rotate(${(x / (2 * Math.PI * 12)) * 360}deg)`));
      last = x;
    },
  });
  const stop = () => road.clientWidth * 0.74 + 22;
  tl.fromTo('#van', { x: 0 }, { x: stop, ease: 'power2.out', duration: 0.45 })
    .fromTo('#parcel', { x: -70, y: -40, rotate: -30, scale: 0.5, opacity: 0 }, { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1, ease: 'back.out(2)', duration: 0.15 })
    .fromTo('#delivered', { scale: 0, opacity: 0, y: 10 }, { scale: 1, opacity: 1, y: 0, ease: 'back.out(3)', duration: 0.1 })
    .to('#van', { x: () => road.clientWidth + 420, ease: 'power2.in', duration: 0.3 }, '+=0.05');
}
$('#zipForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const z = $('#zip').value.trim();
  const out = $('#zipOut');
  if (!/^\d{5}$/.test(z)) {
    out.className = 'zip-out no';
    out.textContent = 'Please enter a 5-digit ZIP code.';
  } else if (z[0] === '9' || z[0] === '8') {
    out.className = 'zip-out no';
    out.textContent = `Not in ${z} yet. We’re expanding west soon!`;
  } else {
    out.className = 'zip-out ok';
    out.textContent = `Yes! We deliver to ${z}. Next slot in about ${20 + (parseInt(z, 10) % 25)} minutes.`;
  }
});

// ============================================================ farms parallax
$('#farmBg').style.backgroundImage = `url(${BASE}img/s/farm.webp)`;
if (!reduced) {
  gsap.to('#farmBg', { yPercent: 16, ease: 'none', scrollTrigger: { trigger: '.farms', start: 'top bottom', end: 'bottom top', scrub: true } });
  [['.fp1', -40, -8], ['.fp2', 30, 9], ['.fp3', -20, 2]].forEach(([s, y, r]) => gsap.fromTo(s, { y: -y, rotate: r * 0.3 }, { y, rotate: r, ease: 'none', scrollTrigger: { trigger: '.farms', start: 'top bottom', end: 'bottom top', scrub: true } }));
}

// ============================================================ reviews
const avCols = ['#2e9e5b', '#e8453c', '#ff8a3d', '#3d7bd9', '#9b59b6', '#16a085'];
$('#revTrack').innerHTML = REVIEWS.map((r, i) => `<article class="rev"><div class="stars">${'★'.repeat(r.stars)}${'☆'.repeat(5 - r.stars)}</div><p>“${esc(r.text)}”</p><div class="who"><span class="av" style="background:${avCols[i % 6]}">${r.name[0]}</span><div><b>${esc(r.name)}</b><small>${esc(r.city)} · verified buyer</small></div></div></article>`).join('');
$$('.rev').forEach((el) => tilt(el, { max: 6 }));

// ============================================================ promos
const CODES = {
  FRESH10: { label: 'FRESH10 · 10% off', type: 'pct', value: 10 },
  FREESHIP: { label: 'FREESHIP · free delivery', type: 'ship', value: 0 },
  HELLO5: { label: 'HELLO5 · $5 off', type: 'amt', value: 5 },
};
$('#newsForm').addEventListener('submit', (e) => {
  e.preventDefault();
  cart.setPromo(CODES.FRESH10);
  toast('🎉 Code <b>FRESH10</b> applied: 10% off your basket (demo)');
  e.target.reset();
});
$('#promoForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const code = $('#promoInput').value.trim().toUpperCase();
  if (!code) return;
  if (!CODES[code]) return toast(`“${esc(code)}” isn’t a valid code. Try FRESH10`);
  cart.setPromo(CODES[code]);
  $('#promoInput').value = '';
  toast(`🎁 <b>${CODES[code].label}</b> applied`);
});
$('#promoRemove').addEventListener('click', () => cart.setPromo(null));

// ============================================================ cart drawer
const drawer = $('#drawer'), scrim = $('#scrim');
const basket = createBasket($('#basketItems'));
function openDrawer() {
  drawer.classList.add('open');
  drawer.setAttribute('aria-hidden', 'false');
  scrim.classList.add('show');
  renderDrawer();
  setTimeout(() => basket.shake(), 380);
}
function closeDrawer() {
  drawer.classList.remove('open');
  drawer.setAttribute('aria-hidden', 'true');
  if (!anyModalOpen()) scrim.classList.remove('show');
}
$('#cartBtn').addEventListener('click', openDrawer);
$('#drawerClose').addEventListener('click', closeDrawer);
scrim.addEventListener('click', () => {
  closeDrawer();
  scrim.classList.remove('show');
});
$('#startShopping').addEventListener('click', () => {
  closeDrawer();
  scrim.classList.remove('show');
  $('#shop').scrollIntoView({ behavior: 'smooth' });
});
function renderDrawer() {
  const items = cart.items;
  $('#lines').innerHTML = items.map(({ p, q }) => `<li class="line" data-id="${p.id}">${img(p)}<div><b>${esc(p.name)}</b><small>${p.unit} · ${money(p.price)}</small><div class="stepper"><button data-act="dec" aria-label="Remove one">−</button><span>${q}</span><button data-act="inc" aria-label="Add one">+</button></div></div><div class="lp">${money(p.price * q)}</div></li>`).join('');
  $('#drawerEmpty').hidden = items.length > 0;
  $('#drawerFoot').hidden = items.length === 0;
  odo($('#subTotal'), money(cart.subtotal));
  $('#delFee').textContent = cart.delivery ? money(cart.delivery) : 'FREE';
  odo($('#grandTotal'), money(cart.total));
  $('#discRow').hidden = !cart.discount;
  $('#discAmt').textContent = `−${money(cart.discount)}`;
  $('#promoOn').hidden = !cart.promo;
  $('#promoForm').hidden = !!cart.promo;
  $('#promoLabel').textContent = cart.promo?.label || '';
  const left = STORE.freeDeliveryOver - cart.subtotal;
  $('#freeText').innerHTML = cart.promo?.type === 'ship' ? '🎁 Free delivery from your prize!' : left > 0 ? `Add <b>${money(left)}</b> more for <b>free delivery</b>` : '🎉 You’ve unlocked <b>free delivery</b>!';
  $('#freeFill').style.width = `${cart.promo?.type === 'ship' ? 100 : Math.min(100, (cart.subtotal / STORE.freeDeliveryOver) * 100)}%`;
  // the basket fills with the latest items, which fall in and settle with physics
  basket.set(items.flatMap(({ p, q }) => Array.from({ length: Math.min(q, 3) }, (_, k) => ({ key: `${p.id}-${k}`, src: src(p), photo: !p.cut }))).slice(-10));
}
$('#lines').addEventListener('click', (e) => {
  const b = e.target.closest('[data-act]');
  const id = e.target.closest('.line')?.dataset.id;
  if (!b || !id) return;
  e.stopPropagation();
  cart.set(id, cart.qty(id) + (b.dataset.act === 'inc' ? 1 : -1));
});

cart.on((ev) => {
  $('#cartCount').textContent = cart.count || '';
  odo($('#cartTotal'), money(cart.subtotal));
  $('#wishCount').textContent = cart.wish.size || '';
  $('#wishBtn').classList.toggle('on', cart.wish.size > 0);
  if (ev.id) refreshBuy(ev.id);
  else $$('.card').forEach((c) => refreshBuy(c.dataset.id));
  if (drawer.classList.contains('open')) renderDrawer();
  if (!modal.hidden && mState.p) syncModal();
  if (!co.hidden) renderSummary();
});

// wishlist button filters the shop to saved items
$('#wishBtn').addEventListener('click', () => {
  if (!cart.wish.size) return toast('Tap ♥ on a product to save it');
  grid.innerHTML = [...cart.wish].map((id, i) => cardHtml(byId[id], i)).join('');
  $$('.card', grid).forEach((c) => tilt(c, { max: 9 }));
  $('#shopTitle').textContent = 'Your wishlist';
  $('#resultCount').textContent = `${cart.wish.size} saved`;
  $('#empty').hidden = true;
  $('#shop').scrollIntoView({ behavior: 'smooth' });
});

// ============================================================ product modal (drag to turn)
const modal = $('#modal');
const mState = { p: null, q: 1, rx: 0, ry: 0, vx: 0, vy: 0, drag: null, raf: 0 };
function openProduct(id) {
  const p = byId[id];
  if (!p) return;
  cart.view(id);
  renderForYou();
  mState.p = p;
  mState.q = 1;
  mState.rx = mState.ry = 0;
  $('#mImg').src = src(p);
  $('#mImg').className = p.cut ? '' : 'photo';
  $('#mImg').alt = p.name;
  $('#mVisual').style.setProperty('--m-bg', catColor(p.cat));
  $('#mBadges').innerHTML = badgeHtml(p);
  $('#mTitle').textContent = p.name;
  $('#mRating').innerHTML = `${stars(p.rating)} · ${p.reviews} reviews · ${esc(catName(p.cat))}`;
  $('#mFresh').innerHTML = freshHtml(p);
  $('#mPrice').innerHTML = `${money(p.price)} <small>/ ${p.unit}</small>${p.old ? `<s>${money(p.old)}</s>` : ''}`;
  $('#mDesc').textContent = p.desc;
  $('#mWeights').innerHTML = (p.weights || []).map((w, i) => `<button class="${i ? '' : 'on'}" data-w="${i}">${w}</button>`).join('');
  const fact = (k, v, u = 'g') => (v === null ? '' : `<div><dt>${k}</dt><dd>${v}${u}</dd></div>`);
  $('#mFacts').innerHTML = `${fact('Calories', p.kcal, '')}${fact('Protein', p.protein)}${fact('Carbs', p.carbs)}${fact('Fat', p.fat)}<div class="wide"><dt>Origin</dt><dd>${esc(p.origin)}</dd></div><div class="wide"><dt>Per</dt><dd>100 g (approx.)</dd></div>`;
  const pairs = PRODUCTS.filter((x) => x.cat !== p.cat && x.id !== p.id).sort(() => Math.random() - 0.5).slice(0, 3);
  $('#mPairs').innerHTML = pairs.map((x) => `<button class="pair" data-pair="${x.id}">${img(x)}<span>${esc(x.name)}</span></button>`).join('');
  syncModal();
  modal.hidden = false;
  scrim.classList.add('show');
  document.body.style.overflow = 'hidden';
  $('#mAdd').focus({ preventScroll: true });
  if (!reduced) gsap.fromTo('#mStage', { rotateY: -35, scale: 0.8, opacity: 0 }, { rotateY: 0, scale: 1, opacity: 1, duration: 0.7, ease: 'back.out(1.4)' });
}
function syncModal() {
  const p = mState.p;
  $('#mQty').textContent = mState.q;
  const inCart = cart.qty(p.id);
  $('#mAdd').textContent = `Add ${mState.q} · ${money(p.price * mState.q)}${inCart ? ` (${inCart} in basket)` : ''}`;
  $('#mWish').classList.toggle('on', cart.wish.has(p.id));
}
function closeModal(el = modal) {
  el.hidden = true;
  document.body.style.overflow = '';
  if (!drawer.classList.contains('open') && !anyModalOpen()) scrim.classList.remove('show');
}
const anyModalOpen = () => $$('.modal').some((m) => !m.hidden);
$('#modalClose').addEventListener('click', () => closeModal());
modal.addEventListener('click', (e) => e.target === modal && closeModal());
$('#mMinus').addEventListener('click', () => ((mState.q = Math.max(1, mState.q - 1)), syncModal()));
$('#mPlus').addEventListener('click', () => ((mState.q = Math.min(20, mState.q + 1)), syncModal()));
$('#mWish').addEventListener('click', () => cart.toggleWish(mState.p.id));
$('#mWeights').addEventListener('click', (e) => {
  const b = e.target.closest('[data-w]');
  if (!b) return;
  $$('#mWeights button').forEach((x) => x.classList.toggle('on', x === b));
});
$('#mAdd').addEventListener('click', () => {
  cart.add(mState.p.id, mState.q);
  flyToCart($('#mImg'), mState.p);
  toast(`Added ${mState.q} × <b>${esc(mState.p.name)}</b>`, mState.p);
});
$('#mPairs').addEventListener('click', (e) => {
  const b = e.target.closest('[data-pair]');
  if (b) openProduct(b.dataset.pair);
});
// drag to turn with inertia, springing back to the front
const mv = $('#mVisual'), ms = $('#mStage');
mv.addEventListener('pointerdown', (e) => {
  mState.drag = { x: e.clientX, y: e.clientY };
  mv.setPointerCapture(e.pointerId);
});
mv.addEventListener('pointermove', (e) => {
  if (mState.drag) {
    const dx = e.clientX - mState.drag.x, dy = e.clientY - mState.drag.y;
    mState.drag = { x: e.clientX, y: e.clientY };
    mState.vy = dx * 0.6;
    mState.vx = -dy * 0.4;
    mState.ry = Math.max(-70, Math.min(70, mState.ry + mState.vy));
    mState.rx = Math.max(-35, Math.min(35, mState.rx + mState.vx));
  } else if (e.pointerType === 'mouse') {
    const r = mv.getBoundingClientRect();
    mState.ty = ((e.clientX - r.left) / r.width - 0.5) * 24;
    mState.tx = -((e.clientY - r.top) / r.height - 0.5) * 16;
  }
  if (!mState.raf) mState.raf = requestAnimationFrame(turn);
});
mv.addEventListener('pointerup', () => (mState.drag = null));
mv.addEventListener('pointerleave', () => ((mState.tx = mState.ty = 0), mState.raf || (mState.raf = requestAnimationFrame(turn))));
function turn() {
  mState.raf = 0;
  if (!mState.drag) {
    mState.ry += ((mState.ty || 0) - mState.ry) * 0.12;
    mState.rx += ((mState.tx || 0) - mState.rx) * 0.12;
  }
  ms.style.transform = `rotateX(${mState.rx}deg) rotateY(${mState.ry}deg)`;
  if (mState.drag || Math.abs(mState.ry - (mState.ty || 0)) > 0.1 || Math.abs(mState.rx - (mState.tx || 0)) > 0.1) mState.raf = requestAnimationFrame(turn);
}

// ============================================================ checkout (demo)
const co = $('#checkout');
const coState = { step: 0, day: 0, slot: null };
const scratch = initScratch({ app, host: $('#scratch') });
$('#checkoutBtn').addEventListener('click', () => {
  closeDrawer();
  openCheckout();
});
function openCheckout() {
  coState.step = 0;
  $('#coForm').hidden = false;
  $('#coDone').hidden = true;
  $('#scratch').hidden = false;
  $('#coForm').reset();
  showStep();
  renderSummary();
  renderDays();
  co.hidden = false;
  scrim.classList.add('show');
  document.body.style.overflow = 'hidden';
  scratch.reset();
}
function renderSummary() {
  if (!$('#coDone').hidden) return; // keep the placed order on screen
  const disc = cart.discount;
  $('#coLines').innerHTML =
    cart.items.map(({ p, q }) => `<li>${img(p)}<span>${q} × ${esc(p.name)}</span><b>${money(p.price * q)}</b></li>`).join('') +
    (disc ? `<li class="disc"><span>${cart.promo ? esc(cart.promo.label) : 'Discount'}${cart.bonus ? ' + scratch card' : ''}</span><b>−${money(disc)}</b></li>` : '') +
    `<li><span>Delivery</span><b>${cart.delivery ? money(cart.delivery) : 'FREE'}</b></li><li><span>Service fee</span><b>${money(STORE.serviceFee)}</b></li>`;
  odo($('#coTotal'), money(cart.total));
  if (coState.step === 2) $('#coNext').textContent = `Place order · ${money(cart.total)}`;
}
function showStep() {
  $$('#coForm fieldset').forEach((f) => (f.hidden = +f.dataset.step !== coState.step));
  $$('#coSteps li').forEach((li, i) => {
    li.classList.toggle('on', i === coState.step);
    li.classList.toggle('done', i < coState.step);
  });
  $('#coBack').style.visibility = coState.step ? 'visible' : 'hidden';
  $('#coNext').textContent = coState.step === 2 ? `Place order · ${money(cart.total)}` : 'Continue';
  $('#coErr').textContent = '';
}
function renderDays() {
  const days = [0, 1, 2].map((k) => {
    const d = new Date(Date.now() + k * 864e5);
    return { k, label: k === 0 ? 'Today' : k === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' }), date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) };
  });
  $('#days').innerHTML = days.map((d) => `<button type="button" data-day="${d.k}" class="${d.k === coState.day ? 'on' : ''}"><b>${d.label}</b>${d.date}</button>`).join('');
  const now = new Date().getHours() + new Date().getMinutes() / 60;
  const slots = [];
  for (let h = 8; h <= 22; h++) slots.push(h);
  $('#slots').innerHTML = slots.map((h) => {
    const full = (h * 7 + coState.day * 3) % 5 === 0;
    const past = coState.day === 0 && h < now + 0.6;
    const label = `${((h + 11) % 12) + 1}:00${h < 12 ? 'am' : 'pm'}`;
    return `<button type="button" data-slot="${h}" ${full || past ? 'disabled' : ''} class="${coState.slot === h ? 'on' : ''}">${label}${full && !past ? ' · full' : ''}</button>`;
  }).join('');
  // default to the earliest open window so the step is one click shorter
  if (coState.slot === null || $(`#slots [data-slot="${coState.slot}"]`)?.disabled) {
    coState.slot = null;
    const first = $('#slots button:not([disabled])');
    if (first) {
      coState.slot = +first.dataset.slot;
      first.classList.add('on');
    }
  }
}
$('#days').addEventListener('click', (e) => {
  const b = e.target.closest('[data-day]');
  if (!b) return;
  coState.day = +b.dataset.day;
  coState.slot = null;
  renderDays();
});
$('#slots').addEventListener('click', (e) => {
  const b = e.target.closest('[data-slot]');
  if (!b || b.disabled) return;
  coState.slot = +b.dataset.slot;
  renderDays();
});
const f = $('#coForm');
f.card.addEventListener('input', () => {
  const v = f.card.value.replace(/\D/g, '').slice(0, 16);
  f.card.value = v.replace(/(.{4})/g, '$1 ').trim();
  $('#cardNum').textContent = (v + '•'.repeat(16 - v.length)).replace(/(.{4})/g, '$1 ').trim();
});
f.exp.addEventListener('input', () => {
  const v = f.exp.value.replace(/\D/g, '').slice(0, 4);
  f.exp.value = v.length > 2 ? `${v.slice(0, 2)}/${v.slice(2)}` : v;
  $('#cardExp').textContent = f.exp.value || 'MM/YY';
});
f.name.addEventListener('input', () => ($('#cardName').textContent = f.name.value.toUpperCase() || 'YOUR NAME'));
$('#coBack').addEventListener('click', () => {
  coState.step = Math.max(0, coState.step - 1);
  showStep();
});
let lastOrder = null;
f.addEventListener('submit', (e) => {
  e.preventDefault();
  const fs = $(`fieldset[data-step="${coState.step}"]`);
  let bad = null;
  $$('input[required]', fs).forEach((i) => {
    const ok = i.value.trim() && (!i.pattern || new RegExp(`^${i.pattern}$`).test(i.value.trim()));
    i.classList.toggle('bad', !ok);
    if (!ok && !bad) bad = i;
  });
  if (coState.step === 2 && f.card.value.replace(/\D/g, '').length < 12) bad = f.card;
  if (bad) {
    $('#coErr').textContent = 'Please fill in the highlighted fields.';
    bad.focus();
    return;
  }
  if (coState.step === 1 && coState.slot === null) {
    $('#coErr').textContent = 'Pick a delivery window.';
    return;
  }
  if (coState.step < 2) {
    coState.step++;
    showStep();
    return;
  }
  // "place" the order
  const h = coState.slot;
  const when = `${coState.day === 0 ? 'today' : coState.day === 1 ? 'tomorrow' : 'in 2 days'} between ${((h + 11) % 12) + 1}:00 and ${((h + 11) % 12) + 1}:30${h < 12 ? 'am' : 'pm'}`;
  const saved = cart.discount;
  lastOrder = cart.placeOrder({ when, street: f.street.value });
  $('#doneText').innerHTML = `Order <b>${lastOrder.num}</b> · ${money(lastOrder.total)}${saved ? ` <span class="saved">(you saved ${money(saved)})</span>` : ''}<br />Arriving ${when} at ${esc(f.street.value)}.<br /><small>(Demo: no payment was taken.)</small>`;
  f.hidden = true;
  $('#scratch').hidden = true;
  $('#coDone').hidden = false;
  confetti();
  renderForYou();
});
$('#coClose').addEventListener('click', () => closeModal(co));
co.addEventListener('click', (e) => e.target === co && closeModal(co));
$('#doneBtn').addEventListener('click', () => closeModal(co));
$('#trackOrderBtn').addEventListener('click', () => {
  closeModal(co);
  tracking.open(lastOrder);
});

// ============================================================ buy again / recently viewed
let fyTab = 'again';
function renderForYou() {
  const counts = {};
  cart.orders.forEach((o) => o.items.forEach(([id, q]) => byId[id] && (counts[id] = (counts[id] || 0) + q)));
  const again = Object.keys(counts).sort((a, b) => counts[b] - counts[a]).slice(0, 12);
  const viewed = cart.viewed.filter((id) => byId[id]);
  if (fyTab === 'again' && !again.length && viewed.length) fyTab = 'viewed';
  const ids = fyTab === 'again' ? again : viewed;
  $('#forYou').hidden = !again.length && !viewed.length;
  $$('#forYou [data-tab]').forEach((b) => {
    b.classList.toggle('on', b.dataset.tab === fyTab);
    b.hidden = b.dataset.tab === 'again' ? !again.length : !viewed.length;
  });
  $('#reorderBtn').hidden = !cart.orders.length;
  $('#fyRow').innerHTML = ids.map((id) => byId[id]).map((p) => `<article class="mc" data-id="${p.id}"><div class="mc-pic">${img(p)}</div><b>${esc(p.name)}</b><span class="mc-row"><span class="price">${money(p.price)}</span><button class="add sm" data-act="add" data-id="${p.id}" aria-label="Add ${esc(p.name)}">+</button></span></article>`).join('');
}
$('#forYou').addEventListener('click', (e) => {
  const t = e.target.closest('[data-tab]');
  if (t) {
    fyTab = t.dataset.tab;
    renderForYou();
  }
});
$('#reorderBtn').addEventListener('click', () => {
  const o = cart.orders[0];
  if (!o) return;
  o.items.forEach(([id, q]) => cart.add(id, q));
  toast(`Added your last basket (<b>${o.items.length} items</b>)`);
  openDrawer();
});
renderForYou();

// ============================================================ credits
$('#creditsBtn').addEventListener('click', async () => {
  const c = await (await fetch(`${BASE}img/credits.json`)).json();
  $('#creditList').innerHTML = Object.entries(c).map(([k, v]) => `<li><b>${esc(k.split('/')[1])}</b>: “${esc((v.title || '').slice(0, 60))}”${v.creator ? ` by ${esc(v.creator)}` : ''}, ${esc(v.license || '')}. <a href="${esc(v.source)}" target="_blank" rel="noopener">source</a></li>`).join('');
  $('#credits').hidden = false;
});
$('#credits [data-close]').addEventListener('click', () => ($('#credits').hidden = true));
$$('.footer [data-cat]').forEach((a) => a.addEventListener('click', () => setCat(a.dataset.cat)));

// ============================================================ feature modules
const compare = initCompare({ app, tray: $('#cmpTray'), modal: $('#cmpModal') });
const tracking = initTracking({ app, modal: $('#track'), headerBtn: $('#trackBtn') });
$('#footTrack').addEventListener('click', () => tracking.open());
initWheel({ app, fab: $('#wheelFab'), modal: $('#wheel') });
initSmoothie({ root: $('#smoothie'), app });
initPlanner({ root: $('#planner'), app });
initFarms({ app, row: $('#growers'), modal: $('#farmModal') });
initStoreMap({ host: $('#storeMap'), app, CATEGORIES });
initVoice({ app, button: $('#micBtn'), input: search });
initSeason({ app, canvas: $('#seasonFx'), banner: $('#seasonBanner') });
initActivity({ app, host: $('#activity'), busy: () => anyModalOpen() || drawer.classList.contains('open') });
initCursor({ reduced });
const walk = initWalk({ section: $('#walk'), canvas: $('#walkCanvas'), tip: $('#walkTip'), nowEl: $('#walkNow'), ticksEl: $('#walkTicks'), app, CATEGORIES, PRODUCTS });
initTheme({
  button: $('#themeBtn'),
  onChange: (evening) => {
    hero.setNight(evening);
    walk.setNight(evening);
  },
});

// Escape closes the top-most layer
addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  const open = $$('.modal').filter((m) => !m.hidden).pop();
  if (open) closeModal(open);
  else if (drawer.classList.contains('open')) {
    closeDrawer();
    scrim.classList.remove('show');
  }
});

// ============================================================ reveal on scroll
if (!reduced) {
  revealHeadings('.section h2:not(#shopTitle), .walk-ui h2');
  $$('.sec-sub, .how-steps li, .bundle, .rev, .farm-card p, .farm-list, .recipe-meta, .news-in, .trust > div, .season-banner, .growers-wrap, .store-map').forEach((el) => {
    gsap.from(el, { y: 30, opacity: 0, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%' } });
  });
  gsap.from('.cat', { y: 50, opacity: 0, rotateX: -18, duration: 0.8, stagger: 0.07, ease: 'power3.out', scrollTrigger: { trigger: '.cat-grid', start: 'top 85%' } });
}

render();
cart.emit({ type: 'init' });

// keep every scroll animation lined up when content above it changes height (filters, planner, images)
{
  let t = 0;
  new ResizeObserver(() => {
    clearTimeout(t);
    t = setTimeout(() => ScrollTrigger.refresh(), 250);
  }).observe($('main'));
  addEventListener('load', () => ScrollTrigger.refresh());
}
