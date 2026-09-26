import { cart } from '../cart.js';

// Compare up to three products side by side. Cards get a ⇄ toggle; a tray slides up from the bottom.
const MAX = 3;

export function initCompare({ app, tray, modal }) {
  const picked = [];
  const table = modal.querySelector('#cmpTable');

  function toggle(id) {
    const i = picked.indexOf(id);
    if (i >= 0) picked.splice(i, 1);
    else if (picked.length >= MAX) return app.toast(app.t('You can compare up to {n} products', { n: MAX }));
    else picked.push(id);
    sync();
  }
  function sync() {
    document.querySelectorAll('[data-act="cmp"]').forEach((b) => {
      const on = picked.includes(b.closest('[data-id]')?.dataset.id);
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', String(on));
    });
    tray.classList.toggle('show', picked.length > 0);
    document.documentElement.classList.toggle('tray-up', picked.length > 0);
    tray.querySelector('.ct-items').innerHTML =
      picked.map((id) => `<button class="ct-item" data-rm="${id}" title="Remove ${app.esc(app.byId[id].name)}">${app.img(app.byId[id])}<i>×</i></button>`).join('') +
      Array.from({ length: MAX - picked.length }, () => '<span class="ct-slot"></span>').join('');
    const go = tray.querySelector('#cmpGo');
    go.disabled = picked.length < 2;
    go.textContent = picked.length < 2 ? app.t('Pick one more') : app.t('Compare {n}', { n: picked.length });
  }

  function open() {
    const ps = picked.map((id) => app.byId[id]);
    // highlight the winner in each row
    const best = (f, low) => {
      const vals = ps.map(f).filter((v) => v !== null && v !== undefined);
      if (vals.length < 2) return null;
      return low ? Math.min(...vals) : Math.max(...vals);
    };
    const row = (label, f, fmt = (v) => v, low) => {
      const b = best(f, low);
      return `<tr><th>${app.t(label)}</th>${ps.map((p) => {
        const v = f(p);
        return `<td class="${v !== null && v === b ? 'best' : ''}">${v === null || v === undefined ? '–' : fmt(v)}</td>`;
      }).join('')}</tr>`;
    };
    table.innerHTML = `
      <thead><tr><th></th>${ps.map((p) => `<td><div class="cmp-pic" style="--c:${app.catColor(p.cat)}">${app.img(p)}</div><b>${app.esc(p.name)}</b><small>${p.unit}</small></td>`).join('')}</tr></thead>
      <tbody>
        ${row('Price', (p) => p.price, app.money, true)}
        ${row('Rating', (p) => p.rating, (v) => `★ ${v.toFixed(1)}`)}
        ${row('Reviews', (p) => p.reviews)}
        ${row('Calories', (p) => p.kcal, (v) => `${v} ${app.t('kcal')}`, true)}
        ${row('Protein', (p) => p.protein, (v) => `${v} g`)}
        ${row('Carbs', (p) => p.carbs, (v) => `${v} g`, true)}
        ${row('Fat', (p) => p.fat, (v) => `${v} g`, true)}
        <tr><th>${app.t('Origin')}</th>${ps.map((p) => `<td>${app.esc(p.origin)}</td>`).join('')}</tr>
        <tr><th>${app.t('Labels')}</th>${ps.map((p) => `<td>${p.badges.length ? p.badges.map((b) => app.t(b)).join(', ') : '–'}</td>`).join('')}</tr>
        <tr><th></th>${ps.map((p) => `<td><button class="btn btn-primary sm" data-cmp-add="${p.id}">${app.t('Add')} · ${app.money(p.price)}</button></td>`).join('')}</tr>
      </tbody>`;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
  }
  const close = () => {
    modal.hidden = true;
    document.body.style.overflow = '';
  };

  tray.addEventListener('click', (e) => {
    const rm = e.target.closest('[data-rm]');
    if (rm) toggle(rm.dataset.rm);
    if (e.target.closest('#cmpGo')) open();
    if (e.target.closest('#cmpClear')) {
      picked.length = 0;
      sync();
    }
  });
  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.closest('[data-close]')) close();
    const a = e.target.closest('[data-cmp-add]');
    if (a) {
      cart.add(a.dataset.cmpAdd);
      app.flyToCart(a.closest('td') && table.querySelector(`thead td:nth-child(${[...a.closest('tr').children].indexOf(a.closest('td')) + 1}) img`), app.byId[a.dataset.cmpAdd]);
      app.toast(app.t('Added <b>{name}</b>', { name: app.esc(app.byId[a.dataset.cmpAdd].name) }));
    }
  });
  return { toggle, sync, close, get isOpen() { return !modal.hidden; }, has: (id) => picked.includes(id) };
}
