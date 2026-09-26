import { SHOPPERS } from '../data.js';

// "Live" activity popups: small notes like "Maya in Astoria just added Strawberries".
// They are made-up demo data and say so. They pause while a dialog or the basket is open.
export function initActivity({ app, host, busy }) {
  // desktop only: on a phone they would sit on top of the content
  if (innerWidth < 820) return;
  let shown = 0;
  const verbs = ['just added', 'just ordered', 'saved', 'just bought'];
  const pick = (a) => a[(Math.random() * a.length) | 0];
  function pop() {
    if (shown >= 14) return;
    if (document.hidden || busy()) return schedule(6000);
    const [name, place] = pick(SHOPPERS);
    const p = pick(app.PRODUCTS.filter((x) => x.rating >= 4.6));
    const mins = 1 + ((Math.random() * 9) | 0);
    const el = document.createElement('div');
    el.className = 'act';
    el.innerHTML = `<img src="${app.src(p)}" alt="" class="${p.cut ? '' : 'photo'}" /><div><p><b>${name}</b> in ${place} ${pick(verbs)} <b>${app.esc(p.name)}</b></p><small>${mins} min ago · <span class="demo-tag">demo</span></small></div><button aria-label="Dismiss">×</button>`;
    el.querySelector('button').addEventListener('click', () => el.remove());
    el.addEventListener('click', (e) => !e.target.closest('button') && app.openProduct(p.id));
    host.appendChild(el);
    shown++;
    setTimeout(() => el.classList.add('out'), 5200);
    setTimeout(() => el.remove(), 5800);
    schedule(18000 + Math.random() * 16000);
  }
  function schedule(ms) {
    setTimeout(pop, ms);
  }
  schedule(9000);
}
