import { cart } from '../cart.js';

// Live order tracking (demo): an animated street map with the van driving the route,
// an ETA countdown and status steps. Time runs ~12× faster so a 30-minute delivery takes ~2.5 minutes.
const T = { confirmed: 6, picking: 40, arrive: 140 }; // seconds after the order was placed
const SHOW_FOR = 200;
const ROUTE = 'M110 310 L110 210 L310 210 L310 110 L510 110';

export function initTracking({ app, modal, headerBtn }) {
  const svg = modal.querySelector('#trMap');
  const etaEl = modal.querySelector('#trEta');
  const statusEl = modal.querySelector('#trStatus');
  const subEl = modal.querySelector('#trSub');
  const steps = [...modal.querySelectorAll('#trSteps li')];
  const numEl = modal.querySelector('#trNum');
  const itemsEl = modal.querySelector('#trItems');
  let order = null, celebrated = false;

  // ---------- the map ----------
  let blocks = '';
  const tint = ['#f1e9dc', '#ece2d2', '#f4ede2', '#e8dfcf'];
  for (let cx = 0; cx < 6; cx++)
    for (let cy = 0; cy < 4; cy++) {
      const x = 22 + cx * 100, y = 22 + cy * 100;
      const park = (cx === 2 || cx === 3) && cy === 2;
      blocks += park
        ? `<rect x="${x}" y="${y}" width="76" height="76" rx="10" fill="#cfe6c0"/><circle cx="${x + 22}" cy="${y + 26}" r="9" fill="#9fcb8b"/><circle cx="${x + 52}" cy="${y + 48}" r="12" fill="#9fcb8b"/><circle cx="${x + 30}" cy="${y + 58}" r="7" fill="#b3d7a1"/>`
        : `<rect x="${x}" y="${y}" width="76" height="76" rx="10" fill="${tint[(cx * 3 + cy) % 4]}"/>` +
          // little buildings
          `<rect x="${x + 8}" y="${y + 8}" width="26" height="24" rx="4" fill="#fff" opacity=".7"/><rect x="${x + 42}" y="${y + 10}" width="26" height="30" rx="4" fill="#fff" opacity=".55"/><rect x="${x + 10}" y="${y + 42}" width="56" height="24" rx="4" fill="#fff" opacity=".45"/>`;
    }
  svg.innerHTML = `
    <rect width="600" height="420" fill="#dcd4c6"/>
    ${blocks}
    <path d="M0 395 C120 360 200 420 330 392 S520 360 600 380 V420 H0z" fill="#bfe0ee"/>
    <text x="200" y="202" class="st">Bedford Ave</text><text x="402" y="102" class="st">N 7th St</text>
    <path d="${ROUTE}" class="route"/>
    <path d="${ROUTE}" class="route-done" id="trDone"/>
    <g transform="translate(110 310)"><circle r="18" class="pulse"/><circle r="14" fill="#1f7a4d"/><text y="5" text-anchor="middle" font-size="14">🍎</text></g>
    <g transform="translate(510 110)"><circle r="18" class="pulse home"/><circle r="14" fill="#e8453c"/><text y="5" text-anchor="middle" font-size="14">🏠</text></g>
    <g id="trVan"><g class="van-body"><rect x="-17" y="-9" width="24" height="18" rx="4" fill="#1f7a4d"/><path d="M7 -7h6l6 6v8H7z" fill="#26915b"/><rect x="-14" y="-5" width="16" height="10" rx="2" fill="#fff" opacity=".9"/><circle cx="-10" cy="10" r="3.4" fill="#222"/><circle cx="12" cy="10" r="3.4" fill="#222"/></g></g>`;
  const path = svg.querySelector('#trDone');
  const van = svg.querySelector('#trVan');
  const len = path.getTotalLength();
  path.style.strokeDasharray = `${len}`;

  const latest = () => cart.orders[0];
  const elapsed = (o) => (Date.now() - o.placed) / 1000;
  const ease = (x) => x * x * (3 - 2 * x);

  function frame() {
    const o = latest();
    // header pill while an order is live
    const live = o && elapsed(o) < SHOW_FOR;
    headerBtn.hidden = !live;
    if (live) {
      const t = elapsed(o);
      headerBtn.querySelector('b').textContent = t >= T.arrive ? 'Delivered' : `${Math.max(1, Math.ceil(((T.arrive - t) / T.arrive) * 30))} min`;
    }
    if (!modal.hidden && order) {
      const t = elapsed(order);
      const stage = t < T.confirmed ? 0 : t < T.picking ? 1 : t < T.arrive ? 2 : 3;
      steps.forEach((li, i) => {
        li.classList.toggle('done', i < stage || stage === 3);
        li.classList.toggle('on', i === stage && stage !== 3);
      });
      const k = stage < 2 ? 0 : stage === 3 ? 1 : ease((t - T.picking) / (T.arrive - T.picking));
      const at = path.getPointAtLength(k * len);
      const ahead = path.getPointAtLength(Math.min(len, k * len + 2));
      const ang = (Math.atan2(ahead.y - at.y, ahead.x - at.x) * 180) / Math.PI;
      van.setAttribute('transform', `translate(${at.x} ${at.y}) rotate(${stage === 2 ? ang : 0})`);
      van.classList.toggle('moving', stage === 2);
      path.style.strokeDashoffset = `${len * (1 - k)}`;
      const mins = Math.max(1, Math.ceil(((T.arrive - t) / T.arrive) * 30));
      etaEl.textContent = stage === 3 ? 'Delivered ✓' : `${mins} min`;
      statusEl.textContent = ['Order confirmed', 'Picking your groceries', 'On the way to you', 'Delivered. Enjoy!'][stage];
      subEl.textContent = [
        'We’ve sent your order to the store.',
        'Sam is choosing the ripest produce for you.',
        `Sam is ${Math.max(0.1, (1 - k) * 2.4).toFixed(1)} miles away in the Freshly e-van.`,
        'Left at your door. Thanks for shopping with Freshly!',
      ][stage];
      if (stage === 3 && !celebrated) {
        celebrated = true;
        app.confetti();
      }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  function open(o = latest()) {
    if (!o) return app.toast('No orders yet. Your next one will show up here.');
    order = o;
    celebrated = elapsed(o) >= T.arrive;
    numEl.textContent = `Order ${o.num}`;
    itemsEl.innerHTML = o.items.slice(0, 10).map(([id]) => (app.byId[id] ? app.img(app.byId[id]) : '')).join('') + (o.items.length > 10 ? `<span>+${o.items.length - 10}</span>` : '');
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
  }
  const close = () => {
    modal.hidden = true;
    document.body.style.overflow = '';
  };
  headerBtn.addEventListener('click', () => open());
  modal.querySelector('[data-close]').addEventListener('click', close);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) close();
    if (e.target.closest('[data-demo]')) app.toast(`${e.target.closest('[data-demo]').dataset.demo} (demo)`);
  });
  return { open, close, get isOpen() { return !modal.hidden; } };
}
