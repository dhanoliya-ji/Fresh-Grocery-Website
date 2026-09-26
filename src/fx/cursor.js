// Custom cursor (a dot plus a trailing ring that grows over anything clickable) and magnetic buttons.
// Mouse / trackpad only; touch devices and reduced-motion users keep the normal cursor.
const CLICKABLE = 'a, button, [role="button"], label.tgl, select, .card, .deal, .cat, .mc, .aisle, [data-cursor]:not([data-cursor=""])';
const MAGNETS = '.btn, .add, .car-nav, .cart-btn, .icon-btn, .fab';

export function initCursor({ reduced }) {
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!fine || reduced) return;
  document.documentElement.classList.add('has-cursor');
  const dot = document.createElement('div');
  dot.className = 'cur-dot';
  const ring = document.createElement('div');
  ring.className = 'cur-ring';
  ring.innerHTML = '<span></span>';
  document.body.append(ring, dot);
  const label = ring.firstChild;

  let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y, shown = false;
  let mag = null;
  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    x = e.clientX;
    y = e.clientY;
    if (!shown) {
      shown = true;
      rx = x;
      ry = y;
      document.documentElement.classList.add('cur-on');
    }
    const t = e.target instanceof Element ? e.target : null;
    const text = t?.closest('input, textarea, select, [contenteditable]');
    const click = !text && t?.closest(CLICKABLE);
    // an element can ask for a word in the ring, e.g. "View" on products or "Squeeze!" on the hero fruit
    const word = t?.closest('[data-cursor]:not([data-cursor=""])')?.dataset.cursor || (t?.closest('.card, .mc') ? 'View' : '');
    ring.classList.toggle('hover', !!click);
    ring.classList.toggle('word', !!word);
    ring.classList.toggle('text', !!text);
    dot.classList.toggle('text', !!text);
    label.textContent = word;

    // magnetic pull: the button leans toward the pointer, then springs back when it leaves
    const m = t?.closest(MAGNETS);
    if (m !== mag) {
      if (mag) mag.style.translate = '';
      mag = m;
    }
    if (mag) {
      const r = mag.getBoundingClientRect();
      const k = mag.classList.contains('btn') ? 0.22 : 0.3;
      mag.style.translate = `${(x - (r.left + r.width / 2)) * k}px ${(y - (r.top + r.height / 2)) * k}px`;
    }
  }, { passive: true });
  document.addEventListener('pointerleave', () => document.documentElement.classList.remove('cur-on'));
  document.addEventListener('pointerenter', () => shown && document.documentElement.classList.add('cur-on'));
  addEventListener('pointerdown', () => ring.classList.add('down'));
  addEventListener('pointerup', () => ring.classList.remove('down'));

  const loop = () => {
    rx += (x - rx) * 0.2;
    ry += (y - ry) * 0.2;
    dot.style.transform = `translate(${x}px, ${y}px)`;
    ring.style.transform = `translate(${rx}px, ${ry}px)`;
    requestAnimationFrame(loop);
  };
  loop();
}
