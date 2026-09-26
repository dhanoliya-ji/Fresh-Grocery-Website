import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { cart } from '../cart.js';
import { STORE } from '../data.js';
import { splitWords } from '../fx/reveal.js';

// Page-wide polish: the colour journey, statement lines, section dots, the mobile bottom bar,
// the sticky mini-cart, skeleton loading and small feedback animations.

// ---------------- colour journey: the page background shifts as you move through the store ----------------
const JOURNEY = [
  ['categories', '#fbf5ea'],
  ['storemap', '#f6efe1'],
  ['deals', '#fcecdc'], // warm market stall
  ['shop', '#fbf7ef'],
  ['smoothie', '#fde6e6'], // berry pink
  ['recipe', '#e7f3e0'], // leafy green
  ['planner', '#f8f1e2'],
  ['cook', '#e4f1ee'], // cool fridge mint
  ['boxes', '#f9ead3'], // bakery crust
  ['how', '#e9f2f7'], // morning sky
  ['reviews', '#fbf1e4'],
];

export function initUX({ app, smooth }) {
  const { t, reduced } = app;
  const root = document.documentElement;
  const $ = (s) => document.querySelector(s);

  root.classList.add('journey');
  for (const [id, col] of JOURNEY) {
    const el = document.getElementById(id);
    if (!el) continue;
    el.dataset.journey = col;
    ScrollTrigger.create({ trigger: el, start: 'top 55%', end: 'bottom 55%', onToggle: (s) => s.isActive && root.style.setProperty('--jc', col) });
  }
  ScrollTrigger.create({ trigger: '#hero', start: 'top top', end: 'bottom 55%', onToggle: (s) => s.isActive && root.style.setProperty('--jc', '#fbf7ef') });

  // ---------------- statement lines: huge words that fill with colour as you scroll ----------------
  document.querySelectorAll('.statement h2').forEach((h) => {
    const words = splitWords(h);
    if (reduced) return;
    gsap.fromTo(words, { opacity: 0.16 }, { opacity: 1, stagger: 0.15, ease: 'none', scrollTrigger: { trigger: h, start: 'top 85%', end: 'bottom 45%', scrub: 0.6 } });
    const u = h.parentElement.querySelector('.st-line path');
    if (u) gsap.fromTo(u, { strokeDashoffset: 1 }, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: h, start: 'top 70%', end: 'bottom 40%', scrub: 0.6 } });
  });

  // ---------------- section dots (desktop) + bottom-bar tabs follow the section in view ----------------
  const bar = $('#bottomBar');
  const TAB_OF = { hero: 'home', categories: 'shop', storemap: 'shop', walk: 'shop', deals: 'shop', shop: 'shop' };
  const SECTIONS = [['hero', t('Home')], ['categories', t('Aisles')], ['storemap', t('Store map')], ['walk', t('Store walk')], ['deals', t('Deals')], ['shop', t('Shop')], ['smoothie', t('Smoothies')], ['recipe', t('Recipe of the day')], ['planner', t('Meal plan')], ['cook', t('What can I cook?')], ['boxes', t('Fresh boxes')], ['how', t('Delivery')], ['farms', t('Our growers')], ['reviews', t('Reviews')]].filter(([id]) => document.getElementById(id));
  const rail = $('#dots');
  rail.innerHTML = SECTIONS.map(([id, name]) => `<button data-go="${id}" aria-label="${name}"><span>${name}</span><i></i></button>`).join('');
  const setDot = (id) => rail.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.go === id));
  SECTIONS.forEach(([id]) => ScrollTrigger.create({ trigger: `#${id}`, start: 'top 50%', end: 'bottom 50%', onToggle: (s) => s.isActive && (setDot(id), setTab(id)) }));
  rail.addEventListener('click', (e) => {
    const b = e.target.closest('[data-go]');
    if (!b) return;
    const el = document.getElementById(b.dataset.go);
    b.dataset.go === 'hero' ? smooth.scrollTo(0, { offset: 0 }) : smooth.scrollTo(el);
  });
  ScrollTrigger.create({ start: 300, end: 'max', onToggle: (s) => rail.classList.toggle('show', s.isActive) });

  // ---------------- mobile bottom bar ----------------
  function setTab(id) {
    const tab = TAB_OF[id] || 'more';
    bar.querySelectorAll('[data-tab]').forEach((b) => b.classList.toggle('on', b.dataset.tab === tab));
  }
  bar.addEventListener('click', (e) => {
    const b = e.target.closest('[data-tab]');
    if (!b) return;
    const tab = b.dataset.tab;
    if (tab === 'home') smooth.scrollTo(0, { offset: 0 });
    if (tab === 'shop') {
      document.getElementById('shop').scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => $('#search').focus({ preventScroll: true }), 700);
    }
    if (tab === 'list') $('#listBtn').click();
    if (tab === 'more') $('#prefsBtn').click();
    if (tab === 'basket') $('#cartBtn').click();
    b.classList.remove('tap');
    void b.offsetWidth;
    b.classList.add('tap');
  });

  // ---------------- sticky mini-cart (desktop) ----------------
  const mini = $('#miniCart');
  let pastHero = false;
  ScrollTrigger.create({ trigger: '#hero', start: 'bottom 30%', end: 'max', onToggle: (s) => ((pastHero = s.isActive), syncMini()) });
  function syncMini() {
    const n = cart.count;
    mini.classList.toggle('show', pastHero && n > 0);
    mini.querySelector('.mn-count').textContent = t(n === 1 ? '{n} item' : '{n} items', { n });
    mini.querySelector('.mn-total').textContent = app.money(cart.subtotal);
    const k = Math.min(1, cart.subtotal / STORE.freeDeliveryOver);
    const C = 2 * Math.PI * 9;
    mini.querySelector('.mn-ring .fg').style.strokeDashoffset = C * (1 - k);
    mini.querySelector('.mn-free').textContent = k >= 1 || cart.promo?.type === 'ship' ? t('Free delivery ✓') : t('{v} to free delivery', { v: app.money(STORE.freeDeliveryOver - cart.subtotal) });
    const bc = bar.querySelector('.bb-count');
    bc.textContent = n || '';
  }
  mini.addEventListener('click', () => $('#cartBtn').click());
  cart.on(syncMini);
  syncMini();

  // ---------------- micro-feedback ----------------
  // the cart count pops whenever it changes; add buttons squish and flash a tick
  let lastCount = cart.count;
  cart.on(() => {
    if (cart.count !== lastCount) {
      ['#cartCount', '#bottomBar .bb-count', '#miniCart .mn-count'].forEach((s) => {
        const el = $(s);
        if (!el) return;
        el.classList.remove('pop');
        void el.offsetWidth;
        el.classList.add('pop');
      });
      if (cart.count > lastCount) {
        const bb = bar.querySelector('[data-tab="basket"]');
        bb.classList.remove('wobble');
        void bb.offsetWidth;
        bb.classList.add('wobble');
      }
    }
    lastCount = cart.count;
  });
  document.addEventListener('pointerdown', (e) => {
    const b = e.target.closest('.add, .btn, .chip, .stepper button, .fruit, .bt, .seg button');
    if (!b) return;
    b.classList.remove('squish');
    void b.offsetWidth;
    b.classList.add('squish');
  });

  // ---------------- skeleton loading: images fade in once loaded, with a shimmer until then ----------------
  const mark = (img) => (img.complete && img.naturalWidth ? img.classList.add('ld') : null);
  document.addEventListener('load', (e) => e.target.tagName === 'IMG' && e.target.classList.add('ld'), true);
  document.addEventListener('error', (e) => e.target.tagName === 'IMG' && e.target.classList.add('ld', 'broken'), true);
  document.querySelectorAll('img').forEach(mark);
  new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach((n) => n.nodeType === 1 && (n.tagName === 'IMG' ? mark(n) : n.querySelectorAll?.('img').forEach(mark))))).observe(document.body, { childList: true, subtree: true });

  // ---------------- freshness stamp: a slowly rotating seal ----------------
  const stamp = $('#stamp text textPath');
  if (stamp) stamp.textContent = `${t('FRESHNESS GUARANTEED')} · ${t('PICKED TODAY')} · ${t('LOCAL FARMS')} · `;
}
