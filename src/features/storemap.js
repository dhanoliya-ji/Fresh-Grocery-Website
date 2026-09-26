// 3D mini-map of the store: an isometric floor plan built from CSS 3D boxes.
// Aisles lift when hovered and open that aisle in the shop when clicked;
// a little shopper wanders the store, and the map tilts toward the mouse.
const LAYOUT = [
  // category, x, y, w (along x), d (along y), h (height) in floor pixels
  ['fruits', 40, 70, 96, 300, 46],
  ['vegetables', 180, 70, 96, 300, 46],
  ['bakery', 40, 430, 236, 84, 64],
  ['dairy', 330, 16, 380, 62, 118],
  ['meat', 740, 16, 190, 62, 104],
  ['pantry', 360, 140, 70, 290, 128],
  ['snacks', 500, 140, 70, 290, 128],
  ['drinks', 640, 140, 70, 290, 128],
];

export function initStoreMap({ host, app, CATEGORIES }) {
  const box = (cls, [x, y, w, d, h], color, inner = '', attrs = '') =>
    `<div class="box ${cls}" style="--x:${x}px;--y:${y}px;--w:${w}px;--d:${d}px;--h:${h}px;--c:${color}" ${attrs}><i class="f top"></i><i class="f fr"></i><i class="f bk"></i><i class="f lf"></i><i class="f rt"></i>${inner}</div>`;
  const bb = (html, h) => `<div class="bbw" style="--bh:${h}px"><div class="bb">${html}</div></div>`;

  const aisles = LAYOUT.map(([cat, ...geo]) => {
    const c = CATEGORIES.find((k) => k.id === cat);
    const p = app.byId[c.hero];
    return box('aisle', geo, c.color, bb(`${app.img(p)}<b>${c.name}</b>`, geo[4]), `data-cat="${cat}" tabindex="0" role="button" aria-label="${app.t('Go to {name}', { name: c.name })}" data-cursor="${app.t('Shop')}"`);
  }).join('');
  const counters = [400, 520, 640].map((x, i) => box('counter', [x, 500, 64, 36, 34], '#c9cfc7', i === 1 ? bb(`<b class="lbl">${app.lang === 'en' ? 'Checkout' : app.t('Checkout counters')}</b>`, 34) : '')).join('');
  host.innerHTML = `
    <div class="map-scale">
      <div class="map-floor">
        <div class="map-tiles"></div>
        ${aisles}${counters}
        <div class="map-door">${bb(`<b class="lbl door">${app.t('Entrance')}</b>`, 0)}</div>
        <div class="map-here"><i></i>${bb(`<b class="lbl here">${app.t('You are here')}</b>`, 0)}</div>
        <div class="shopper"><div class="bbw" style="--bh:0px"><div class="bb"><span class="cart-ico">🛒</span></div></div></div>
      </div>
    </div>`;

  const floor = host.querySelector('.map-floor');
  const fit = () => host.style.setProperty('--s', Math.min(1, host.clientWidth / 1080).toFixed(3));
  addEventListener('resize', fit);
  fit();

  // tilt toward the pointer
  let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
  const loop = () => {
    cx += (tx - cx) * 0.08;
    cy += (ty - cy) * 0.08;
    floor.style.setProperty('--rz', `${cx.toFixed(2)}deg`);
    floor.style.setProperty('--rx', `${cy.toFixed(2)}deg`);
    raf = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.02 ? requestAnimationFrame(loop) : 0;
  };
  if (!app.reduced) {
    host.addEventListener('pointermove', (e) => {
      const r = host.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 10;
      ty = -((e.clientY - r.top) / r.height - 0.5) * 8;
      raf ||= requestAnimationFrame(loop);
    });
    host.addEventListener('pointerleave', () => {
      tx = ty = 0;
      raf ||= requestAnimationFrame(loop);
    });
  }
  const go = (el) => {
    app.setCat(el.dataset.cat);
    app.toast(app.t('Heading to <b>{name}</b>', { name: CATEGORIES.find((c) => c.id === el.dataset.cat).name }));
    document.getElementById('shop').scrollIntoView({ behavior: app.reduced ? 'auto' : 'smooth' });
  };
  host.addEventListener('click', (e) => {
    const a = e.target.closest('.aisle');
    if (a) go(a);
  });
  host.addEventListener('keydown', (e) => {
    const a = e.target.closest('.aisle');
    if (a && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      go(a);
    }
  });
}
