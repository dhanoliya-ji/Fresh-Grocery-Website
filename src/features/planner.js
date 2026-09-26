import gsap from 'gsap';
import { MEALS } from '../data.js';
import { cart, load, save } from '../cart.js';

// Meal planner: put a dinner on each day of the week (drag, or tap a meal then a day),
// and the planner merges every ingredient into one shopping list.
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const KEEP_ONE = new Set(['pantry']); // a bottle of olive oil covers the whole week

export function initPlanner({ root, app }) {
  const mealsEl = root.querySelector('#meals');
  const weekEl = root.querySelector('#week');
  const listEl = root.querySelector('#planList');
  const byMeal = Object.fromEntries(MEALS.map((m) => [m.id, m]));
  let plan = load('freshly-plan-v1', {});
  let selected = null;
  const mImg = (m) => `${app.BASE}img/${m.img}.webp`;

  // dates for this week, starting Monday
  const monday = new Date();
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const dates = DAYS.map((_, i) => new Date(monday.getTime() + i * 864e5));
  const todayIdx = (new Date().getDay() + 6) % 7;

  mealsEl.innerHTML = MEALS.map((m) => `
    <button class="meal" draggable="true" data-meal="${m.id}" data-cursor="Drag">
      <img src="${mImg(m)}" alt="" loading="lazy" draggable="false" />
      <span><b>${m.name}</b><small>⏱ ${m.time} · ${m.kcal} kcal</small></span>
    </button>`).join('') + '<button class="btn btn-ghost surprise" id="surprise">🎲 Surprise me</button>';

  function renderWeek() {
    weekEl.innerHTML = DAYS.map((d, i) => {
      const m = byMeal[plan[d]];
      return `<div class="day ${i === todayIdx ? 'today' : ''} ${m ? 'full' : ''}" data-day="${d}">
        <header><b>${d}</b><small>${dates[i].getDate()}</small></header>
        ${m ? `<div class="dish"><img src="${mImg(m)}" alt="" /><span>${m.name}</span><button class="rm" data-rm="${d}" aria-label="Remove ${m.name} from ${d}">×</button></div>` : '<p class="drop">Drop a dinner here</p>'}
      </div>`;
    }).join('');
    renderList();
  }

  function renderList() {
    const days = DAYS.filter((d) => byMeal[plan[d]]);
    if (!days.length) {
      listEl.innerHTML = '<p class="plan-empty">Your shopping list builds itself as you plan. 🥕</p>';
      return;
    }
    const need = {};
    days.forEach((d) => byMeal[plan[d]].items.forEach(([id, q]) => (need[id] = (need[id] || 0) + q)));
    Object.keys(need).forEach((id) => KEEP_ONE.has(app.byId[id].cat) && (need[id] = 1));
    const ids = Object.keys(need).sort((a, b) => app.byId[a].cat.localeCompare(app.byId[b].cat));
    const total = ids.reduce((s, id) => s + app.byId[id].price * need[id], 0);
    const kcal = days.reduce((s, d) => s + byMeal[plan[d]].kcal, 0);
    listEl.innerHTML = `
      <div class="pl-head"><div><h3>Shopping list</h3><p>${days.length} dinner${days.length > 1 ? 's' : ''} · ${ids.length} items · ≈${Math.round(kcal / days.length)} kcal per dinner</p></div>
      <div class="pl-cta"><button class="btn btn-ghost" id="planClear">Clear week</button><button class="btn btn-primary" id="planAdd">Add all to basket · ${app.money(total)}</button></div></div>
      <ul class="pl-items">${ids.map((id) => `<li>${app.img(app.byId[id])}<span>${app.esc(app.byId[id].name)}</span><b>× ${need[id]}</b></li>`).join('')}</ul>`;
    listEl.querySelector('#planAdd').addEventListener('click', () => {
      ids.forEach((id, i) => setTimeout(() => {
        cart.add(id, need[id]);
        if (i < 8) app.flyToCart(listEl.querySelectorAll('.pl-items img')[i], app.byId[id]);
      }, i * 90));
      app.toast(`Added <b>${ids.length} items</b> for ${days.length} dinners`);
    });
    listEl.querySelector('#planClear').addEventListener('click', () => {
      plan = {};
      save('freshly-plan-v1', plan);
      renderWeek();
    });
  }

  function assign(day, meal) {
    plan[day] = meal;
    save('freshly-plan-v1', plan);
    renderWeek();
    const el = weekEl.querySelector(`[data-day="${day}"] .dish`);
    if (el && !app.reduced) gsap.from(el, { scale: 0.6, rotate: -8, opacity: 0, duration: 0.5, ease: 'back.out(2)' });
  }
  const select = (id) => {
    selected = selected === id ? null : id;
    mealsEl.querySelectorAll('.meal').forEach((b) => b.classList.toggle('sel', b.dataset.meal === selected));
    root.classList.toggle('picking', !!selected);
  };

  mealsEl.addEventListener('click', (e) => {
    const b = e.target.closest('.meal');
    if (b) select(b.dataset.meal);
    if (e.target.closest('#surprise')) {
      const free = DAYS.filter((d) => !plan[d]);
      (free.length ? free : DAYS).forEach((d, i) => setTimeout(() => assign(d, MEALS[(Math.random() * MEALS.length) | 0].id), i * 120));
    }
  });
  weekEl.addEventListener('click', (e) => {
    const rm = e.target.closest('[data-rm]');
    if (rm) {
      delete plan[rm.dataset.rm];
      save('freshly-plan-v1', plan);
      return renderWeek();
    }
    const d = e.target.closest('.day');
    if (d && selected) {
      assign(d.dataset.day, selected);
      select(selected);
    }
  });
  // desktop drag and drop
  mealsEl.addEventListener('dragstart', (e) => {
    const b = e.target.closest('.meal');
    if (!b) return;
    e.dataTransfer.setData('text/plain', b.dataset.meal);
    e.dataTransfer.effectAllowed = 'copy';
    root.classList.add('picking');
  });
  mealsEl.addEventListener('dragend', () => root.classList.remove('picking'));
  weekEl.addEventListener('dragover', (e) => {
    const d = e.target.closest('.day');
    if (!d) return;
    e.preventDefault();
    weekEl.querySelectorAll('.day').forEach((x) => x.classList.toggle('over', x === d));
  });
  weekEl.addEventListener('dragleave', (e) => e.target.closest('.day')?.classList.remove('over'));
  weekEl.addEventListener('drop', (e) => {
    const d = e.target.closest('.day');
    if (!d) return;
    e.preventDefault();
    d.classList.remove('over');
    root.classList.remove('picking');
    const id = e.dataTransfer.getData('text/plain');
    if (byMeal[id]) assign(d.dataset.day, id);
  });
  renderWeek();
}
