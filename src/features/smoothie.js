import gsap from 'gsap';
import { BLEND } from '../data.js';
import { cart } from '../cart.js';

// Build-your-own smoothie: drag (or tap) fruit into the blender, blend, and the drink takes
// the mixed colour of what went in. The recipe can then be added to the basket.
const SHORT = { strawberries: 'Strawberry', bananas: 'Banana', blueberries: 'Blueberry', mango: 'Mango', pineapple: 'Pineapple', kiwi: 'Kiwi', oranges: 'Orange', apples: 'Apple', avocados: 'Avocado', lemons: 'Lemon' };
const SUFFIX = ['Blast', 'Glow', 'Boost', 'Sunrise', 'Dream', 'Splash', 'Cooler', 'Fizz'];
const MAX = 6;

const rgb = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return [n >> 16, (n >> 8) & 255, n & 255];
};
const hex = (c) => `rgb(${c.map((v) => Math.round(v)).join(',')})`;

export function initSmoothie({ root, app }) {
  const bar = root.querySelector('#fruitBar');
  const jar = root.querySelector('.jar');
  const pieces = root.querySelector('#pieces');
  const liquid = root.querySelector('#liquid');
  const blender = root.querySelector('.blender');
  const blendBtn = root.querySelector('#blendBtn');
  const countEl = root.querySelector('#smCount');
  const result = root.querySelector('#smResult');
  let inJar = []; // fruit ids, in order
  let blended = false;

  bar.innerHTML = Object.keys(BLEND)
    .map((id) => app.byId[id])
    .map((p) => `<button class="fruit" data-id="${p.id}" data-cursor="${app.t('Drag')}" aria-label="${app.t('Add {name} to basket', { name: app.esc(p.name) })}"><img src="${app.src(p)}" alt="" draggable="false" /><span>${app.t(SHORT[p.id])}</span></button>`)
    .join('');

  const sync = () => {
    countEl.textContent = `${inJar.length}/${MAX}`;
    blendBtn.disabled = !inJar.length || blended;
    root.classList.toggle('has-fruit', inJar.length > 0);
  };

  function addFruit(id, from) {
    if (blended) reset(true);
    if (inJar.length >= MAX) {
      app.toast(app.t('The blender is full. Hit <b>Blend</b>!'));
      return;
    }
    inJar.push(id);
    const p = app.byId[id];
    const el = document.createElement('img');
    el.src = app.src(p);
    el.alt = '';
    el.className = 'piece';
    pieces.appendChild(el);
    const jr = pieces.getBoundingClientRect();
    const size = jr.width * 0.34;
    el.style.width = `${size}px`;
    const n = inJar.length - 1;
    const ex = jr.width * (0.14 + ((n * 0.37) % 0.62)) - size * 0.1;
    const ey = jr.height - size * 0.95 - Math.floor(n / 2) * size * 0.42;
    const sx = from ? from.left + from.width / 2 - jr.left - size / 2 : ex;
    const sy = from ? from.top + from.height / 2 - jr.top - size / 2 : -size;
    gsap.fromTo(el, { x: sx, y: sy, rotation: 0, scale: 1.25 }, { x: ex, y: ey, rotation: (Math.random() - 0.5) * 70, scale: 1, duration: app.reduced ? 0.01 : 0.85, ease: 'bounce.out' });
    if (!app.reduced) gsap.fromTo(jar, { scaleY: 1 }, { scaleY: 0.97, duration: 0.12, yoyo: true, repeat: 1, delay: 0.3, transformOrigin: '50% 100%' });
    sync();
  }

  function mix() {
    const milk = rgb('#f7f0e3');
    const cols = inJar.map((id) => rgb(BLEND[id].color));
    const avg = [0, 1, 2].map((k) => cols.reduce((s, c) => s + c[k], 0) / cols.length);
    const c = avg.map((v, k) => v * 0.82 + milk[k] * 0.18);
    return { base: hex(c), top: hex(c.map((v) => Math.min(255, v + 28))), deep: hex(c.map((v) => v * 0.82)) };
  }

  function blend() {
    if (!inJar.length || blended) return;
    blended = true;
    sync();
    const { base, top, deep } = mix();
    const level = 30 + inJar.length * 10;
    root.classList.add('blending');
    const pr = pieces.getBoundingClientRect();
    const t = app.reduced ? 0.01 : 1;
    gsap.to([...pieces.children], {
      x: pr.width * 0.33,
      y: pr.height * 0.55,
      rotation: '+=900',
      scale: 0.15,
      opacity: 0,
      duration: 1.5 * t,
      stagger: 0.06 * t,
      ease: 'power2.in',
    });
    liquid.style.setProperty('--c1', top);
    liquid.style.setProperty('--c2', base);
    liquid.style.setProperty('--c3', deep);
    gsap.to(liquid, { height: `${level}%`, duration: 1.6 * t, ease: 'power2.inOut', delay: 0.2 * t });
    setTimeout(() => {
      root.classList.remove('blending');
      root.classList.add('blended');
      pieces.innerHTML = '';
      showResult();
    }, 1900 * t);
  }

  function showResult() {
    const counts = {};
    inJar.forEach((id) => (counts[id] = (counts[id] || 0) + 1));
    const ranked = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
    const suffix = SUFFIX[(inJar.join('').length + inJar.length) % SUFFIX.length];
    const T = app.t;
    const name = ranked.length === 1 ? T('{tag} {fruit} Smoothie', { tag: T(BLEND[ranked[0]].tag), fruit: T(SHORT[ranked[0]]) }) : `${T(BLEND[ranked[0]].tag)} ${T(SHORT[ranked[1]])} ${T(suffix)}`;
    const kcal = inJar.reduce((s, id) => s + BLEND[id].kcal, 0) + 90;
    const vitC = Math.min(300, inJar.reduce((s, id) => s + BLEND[id].vitC, 0));
    const price = ranked.reduce((s, id) => s + app.byId[id].price * counts[id], 0) + app.byId.yogurt.price;
    result.innerHTML = `
      <p class="kicker">${T('Your creation')}</p>
      <h3>${name}</h3>
      <div class="sm-stats">
        <div><b>${kcal}</b><span>${T('kcal')}</span></div>
        <div><b>${vitC}%</b><span>${T('vitamin C')}</span></div>
        <div><b>${inJar.length}</b><span>${T(inJar.length > 1 ? 'fruits' : 'fruit')}</span></div>
      </div>
      <p class="sm-list">${ranked.map((id) => `${counts[id]} × ${T(SHORT[id])}`).join(' · ')} · ${T('Greek yogurt base')}</p>
      <div class="sm-actions"><button class="btn btn-primary" id="smAdd">${T('Add ingredients')} · ${app.money(price)}</button><button class="btn btn-ghost" id="smAgain">${T('Blend another')}</button></div>`;
    result.hidden = false;
    if (!app.reduced) gsap.from(result.children, { y: 16, opacity: 0, stagger: 0.07, duration: 0.5, ease: 'power3.out' });
    result.querySelector('#smAdd').addEventListener('click', (e) => {
      ranked.forEach((id, i) => setTimeout(() => {
        cart.add(id, counts[id]);
        app.flyToCart(bar.querySelector(`[data-id="${id}"] img`), app.byId[id]);
      }, i * 130));
      cart.add('yogurt');
      app.toast(T('Added everything for your <b>{name}</b>', { name }));
    });
    result.querySelector('#smAgain').addEventListener('click', () => reset());
  }

  function reset(keepResult) {
    inJar = [];
    blended = false;
    pieces.innerHTML = '';
    root.classList.remove('blended', 'blending');
    gsap.to(liquid, { height: '12%', duration: 0.5 });
    liquid.style.removeProperty('--c1');
    liquid.style.removeProperty('--c2');
    liquid.style.removeProperty('--c3');
    if (!keepResult) result.hidden = true;
    sync();
  }

  // ---------- drag from the fruit bar into the jar (pointer events, so touch works too) ----------
  let drag = null;
  bar.addEventListener('pointerdown', (e) => {
    const b = e.target.closest('.fruit');
    if (!b) return;
    drag = { b, id: b.dataset.id, x: e.clientX, y: e.clientY, ghost: null };
    b.setPointerCapture(e.pointerId);
  });
  bar.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.ghost && Math.hypot(dx, dy) > 8) {
      const g = drag.b.querySelector('img').cloneNode();
      g.className = 'drag-ghost';
      document.body.appendChild(g);
      drag.ghost = g;
    }
    if (drag.ghost) {
      drag.ghost.style.transform = `translate(${e.clientX - 45}px, ${e.clientY - 45}px) rotate(${dx * 0.1}deg)`;
      const r = jar.getBoundingClientRect();
      blender.classList.toggle('over', e.clientX > r.left && e.clientX < r.right && e.clientY > r.top - 60 && e.clientY < r.bottom);
    }
  });
  const end = (e) => {
    if (!drag) return;
    const { b, id, ghost } = drag;
    drag = null;
    blender.classList.remove('over');
    if (!ghost) return addFruit(id, b.getBoundingClientRect()); // a tap
    const r = jar.getBoundingClientRect();
    const inside = e.clientX > r.left && e.clientX < r.right && e.clientY > r.top - 60 && e.clientY < r.bottom;
    const gr = ghost.getBoundingClientRect();
    ghost.remove();
    if (inside) addFruit(id, gr);
  };
  bar.addEventListener('pointerup', end);
  bar.addEventListener('pointercancel', () => {
    drag?.ghost?.remove();
    drag = null;
  });
  blendBtn.addEventListener('click', blend);
  sync();
}
