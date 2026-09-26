import gsap from 'gsap';
import { MEALS } from '../data.js';
import { cart, load, save } from '../cart.js';
import { blockedBy, onPrefs } from '../prefs.js';

// "What can I cook?": tick what's already in the fridge, and every recipe is scored by how much of it
// you have. Recipes re-rank live (with a smooth FLIP reorder) and one click adds just the missing items.
const BASICS = ['garlic', 'onions', 'oliveoil', 'butter', 'lemons'];

export function initCook({ root, app }) {
  const { t } = app;
  const fridgeEl = root.querySelector('#fridge');
  const listEl = root.querySelector('#cookList');
  const sumEl = root.querySelector('#cookSum');
  const ids = [...new Set(MEALS.flatMap((m) => m.items.map(([id]) => id)))].filter((id) => app.byId[id]);
  ids.sort((a, b) => app.byId[a].cat.localeCompare(app.byId[b].cat) || app.byId[a].name.localeCompare(app.byId[b].name));
  let have = new Set(load('freshly-fridge-v1', []));

  fridgeEl.innerHTML = ids.map((id) => {
    const p = app.byId[id];
    return `<button class="fr-item" data-id="${id}" aria-pressed="false"><span class="fr-check" aria-hidden="true"></span><img src="${app.src(p)}" alt="" class="${p.cut ? '' : 'photo'}" loading="lazy" /><span>${app.esc(p.name)}</span></button>`;
  }).join('');

  const score = (m) => {
    const need = m.items.map(([id]) => id);
    const got = need.filter((id) => have.has(id));
    return { m, need, got, missing: need.filter((id) => !have.has(id)), k: got.length / need.length };
  };

  function render(animate) {
    fridgeEl.querySelectorAll('.fr-item').forEach((b) => {
      const on = have.has(b.dataset.id);
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', String(on));
    });
    const results = MEALS.map(score).sort((a, b) => b.k - a.k || a.missing.length - b.missing.length);
    const ready = results.filter((r) => r.k === 1).length;
    sumEl.innerHTML = !have.size ? t('Tick what you already have, and we’ll find dinner.') : ready ? t('You can cook <b>{n}</b> of these right now!', { n: ready }) : t('<b>{n}</b> ingredients ticked. Here’s what’s closest.', { n: have.size });

    // FLIP: remember where each card was, re-render, then animate from the old spot
    const before = new Map([...listEl.children].map((el) => [el.dataset.meal, el.getBoundingClientRect()]));
    listEl.innerHTML = results.map(({ m, need, got, missing, k }) => {
      const cost = missing.reduce((s, id) => s + app.byId[id].price, 0);
      const warn = [...new Set(need.flatMap((id) => blockedBy(id)))];
      const R = 20, C = 2 * Math.PI * R;
      return `<article class="ck ${k === 1 ? 'ready' : ''}" data-meal="${m.id}">
        <img class="ck-img" src="${app.BASE}img/${m.img}.webp" alt="" loading="lazy" />
        <div class="ck-body">
          <div class="ck-top"><h4>${app.esc(m.name)}</h4><svg class="ck-ring" viewBox="0 0 48 48" aria-label="${Math.round(k * 100)}%"><circle cx="24" cy="24" r="${R}" /><circle cx="24" cy="24" r="${R}" class="fg" style="stroke-dasharray:${C};stroke-dashoffset:${C * (1 - k)}" /><text x="24" y="28">${Math.round(k * 100)}%</text></svg></div>
          <small>⏱ ${m.time.replace("min", t("min"))} · ${m.kcal} ${t("kcal")} · ${t('you have {a} of {b}', { a: got.length, b: need.length })}</small>
          ${warn.length ? `<p class="ck-warn">⚠ ${t('Contains')} ${warn.map((w) => t(w)).join(', ')}</p>` : ''}
          <div class="ck-miss">${missing.length ? missing.map((id) => `<span>${app.esc(app.byId[id].name)}</span>`).join('') : `<span class="ok">✓ ${t('You have everything!')}</span>`}</div>
          ${missing.length ? `<button class="btn btn-primary sm" data-cook="${m.id}">${t('Add {n} missing', { n: missing.length })} · ${app.money(cost)}</button>` : `<button class="btn btn-ghost sm" data-plan="${m.id}">${t('Cook it tonight')} 🍳</button>`}
        </div>
      </article>`;
    }).join('');
    if (animate && !app.reduced)
      [...listEl.children].forEach((el) => {
        const a = before.get(el.dataset.meal);
        if (!a) return;
        const b = el.getBoundingClientRect();
        const dy = a.top - b.top;
        if (Math.abs(dy) > 1) gsap.fromTo(el, { y: dy }, { y: 0, duration: 0.55, ease: 'power3.out' });
      });
  }

  const persist = () => save('freshly-fridge-v1', [...have]);
  fridgeEl.addEventListener('click', (e) => {
    const b = e.target.closest('.fr-item');
    if (!b) return;
    const id = b.dataset.id;
    if (have.has(id)) have.delete(id);
    else have.add(id);
    persist();
    render(true);
    if (!app.reduced) gsap.fromTo(b.querySelector('.fr-check'), { scale: 0.4 }, { scale: 1, duration: 0.4, ease: 'back.out(3)' });
  });
  root.querySelector('#fridgeBasics').addEventListener('click', () => {
    BASICS.forEach((id) => have.add(id));
    persist();
    render(true);
  });
  root.querySelector('#fridgeClear').addEventListener('click', () => {
    have.clear();
    persist();
    render(true);
  });
  listEl.addEventListener('click', (e) => {
    const b = e.target.closest('[data-cook]');
    if (b) {
      const m = MEALS.find((x) => x.id === b.dataset.cook);
      const missing = m.items.filter(([id]) => !have.has(id));
      missing.forEach(([id, q], i) => setTimeout(() => {
        cart.add(id, q);
        app.flyToCart(b, app.byId[id]);
      }, i * 110));
      app.toast(t('Added the {n} missing items for <b>{name}</b>', { n: missing.length, name: app.esc(m.name) }));
    }
    const c = e.target.closest('[data-plan]');
    if (c) {
      app.confetti();
      app.toast(t('Enjoy your {name}! 🍳', { name: app.esc(MEALS.find((x) => x.id === c.dataset.plan).name) }));
    }
  });
  onPrefs(() => render(false));
  render(false);
}
