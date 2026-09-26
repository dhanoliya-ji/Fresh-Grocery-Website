import { GRAMS } from '../data.js';
import { cart, load, save } from '../cart.js';
import { isBlocked } from '../prefs.js';

// Basket insights in the drawer:
//  - nutrition goals: rings fill toward your calories / protein target for the days you're shopping for
//  - budget mode: a bar that warns as the total nears your budget, with one-tap cheaper swaps
// sensible like-for-like swaps only (steak -> chicken, coffee -> tea, ...)
const SWAPS = { steak: ['chicken'], shrimp: ['salmon', 'chicken'], salmon: ['chicken'], coffee: ['tea'], croissant: ['bagel', 'baguette'], muffin: ['bagel'], bread: ['baguette'], blueberries: ['strawberries', 'grapes'], nuts: ['chips'], juice: ['lemonade'], pineapple: ['mango'], mushrooms: ['broccoli'], honey: ['cereal'], cheese: ['yogurt'], cookies: ['chocolate'], tea: ['water'], grapes: ['bananas'], yogurt: ['milk'] };
const DEF = { kcal: 2000, protein: 75, people: 1, days: 3, budgetOn: false, budget: 50 };

export function initInsights({ app, root, cartBtn }) {
  const { t } = app;
  const g = Object.assign({}, DEF, load('freshly-goals-v1', {}));
  const form = root.querySelector('#goalsForm');
  const $ = (s) => root.querySelector(s);
  let lastLevel = 0;

  const ring = (el, k, label, sub, color) => {
    const R = 21, C = 2 * Math.PI * R;
    const shown = Math.min(1, k);
    el.innerHTML = `<svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="${R}" class="bg"/><circle cx="26" cy="26" r="${R}" class="fg" style="stroke:${color};stroke-dasharray:${C};stroke-dashoffset:${C * (1 - shown)}"/></svg><b>${Math.round(k * 100)}%</b><span>${label}</span><small>${sub}</small>`;
    el.classList.toggle('full', k >= 1);
  };

  function totals() {
    let kcal = 0, protein = 0;
    for (const { p, q } of cart.items) {
      const grams = (GRAMS[p.id] || 300) * q;
      kcal += ((p.kcal || 0) * grams) / 100;
      protein += ((p.protein || 0) * grams) / 100;
    }
    return { kcal, protein };
  }

  // cheaper swaps: for the priciest lines, the closest cheaper product in the same aisle
  function swaps() {
    return cart.items
      .map(({ p, q }) => {
        const alt = (SWAPS[p.id] || []).map((id) => app.byId[id]).filter((x) => x && x.price < p.price * 0.9 && !cart.qty(x.id) && !isBlocked(x.id))[0];
        return alt && { p, q, alt, save: (p.price - alt.price) * q };
      })
      .filter(Boolean)
      .sort((a, b) => b.save - a.save)
      .slice(0, 2);
  }

  function update() {
    const { kcal, protein } = totals();
    const need = g.kcal * g.people * g.days, needP = g.protein * g.people * g.days;
    const kK = need ? kcal / need : 0, kP = needP ? protein / needP : 0;
    ring($('#kcalRing'), kK, t('calories'), `${Math.round(kcal).toLocaleString()} kcal`, '#ff8a3d');
    ring($('#protRing'), kP, t('protein'), `${Math.round(protein)} g`, '#2e9e5b');
    const daysCovered = kcal / (g.kcal * g.people || 1);
    $('#insText').innerHTML = cart.count
      ? t('Enough calories for about <b>{d} days</b> for {p}.', { d: daysCovered.toFixed(1), p: g.people === 1 ? t('1 person') : t('{n} people', { n: g.people }) })
      : t('Add food to see how far your basket goes.');

    // budget
    const box = $('#budgetBox');
    box.hidden = !g.budgetOn;
    cartBtn.classList.toggle('over-budget', g.budgetOn && cart.total > g.budget);
    if (!g.budgetOn) return;
    const spent = cart.total, k = spent / g.budget;
    const level = k > 1 ? 2 : k > 0.85 ? 1 : 0;
    box.dataset.level = level;
    $('#bdText').innerHTML = t('{a} of your {b} budget', { a: `<b>${app.money(spent)}</b>`, b: app.money(g.budget) });
    $('#bdLeft').textContent = k > 1 ? t('Over by {v}', { v: app.money(spent - g.budget) }) : t('{v} left', { v: app.money(g.budget - spent) });
    $('#bdFill').style.width = `${Math.min(100, k * 100)}%`;
    const sw = level ? swaps() : [];
    $('#swaps').innerHTML = sw.map((s) => `<div class="swap"><span>💡 ${t('Swap')} <b>${app.esc(s.p.name)}</b> → <b>${app.esc(s.alt.name)}</b></span><button class="btn btn-ghost sm" data-swap="${s.p.id}" data-to="${s.alt.id}" data-q="${s.q}" data-save="${s.save.toFixed(2)}">${t('Save {v}', { v: app.money(s.save) })}</button></div>`).join('');
    // warn once each time you cross a threshold on the way up
    if (level > lastLevel) app.toast(level === 2 ? t('⚠ Over your {b} budget. See the cheaper swaps in your basket.', { b: app.money(g.budget) }) : t('Heads up: {n}% of your {b} budget used', { n: Math.round(k * 100), b: app.money(g.budget) }));
    lastLevel = level;
  }

  root.addEventListener('click', (e) => {
    const s = e.target.closest('[data-swap]');
    if (s) {
      const q = +s.dataset.q;
      cart.set(s.dataset.swap, 0);
      cart.add(s.dataset.to, q);
      app.toast(t('Swapped. You saved {v}', { v: app.money(+s.dataset.save) }));
    }
    if (e.target.closest('#goalsBtn')) {
      form.hidden = !form.hidden;
      if (!form.hidden) fill();
    }
  });
  function fill() {
    form.kcal.value = g.kcal;
    form.protein.value = g.protein;
    form.people.value = g.people;
    form.days.value = g.days;
    form.budgetOn.checked = g.budgetOn;
    form.budget.value = g.budget;
  }
  form.addEventListener('input', () => {
    const n = (v, lo, hi, d) => Math.max(lo, Math.min(hi, Number(v) || d));
    g.kcal = n(form.kcal.value, 800, 5000, DEF.kcal);
    g.protein = n(form.protein.value, 10, 300, DEF.protein);
    g.people = n(form.people.value, 1, 12, 1);
    g.days = n(form.days.value, 1, 14, 3);
    g.budgetOn = form.budgetOn.checked;
    g.budget = n(form.budget.value, 5, 2000, 50);
    save('freshly-goals-v1', g);
    lastLevel = 3; // don't toast while typing
    update();
    lastLevel = g.budgetOn ? (cart.total > g.budget ? 2 : cart.total / g.budget > 0.85 ? 1 : 0) : 0;
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    form.hidden = true;
  });
  // start at the current level so nothing is announced on page load
  lastLevel = g.budgetOn ? (cart.total > g.budget ? 2 : cart.total / g.budget > 0.85 ? 1 : 0) : 0;
  cart.on(update);
  update();
  return { update };
}
