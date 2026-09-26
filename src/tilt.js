// 3D tilt with glare: the card rotates toward the pointer; children with translateZ pop out.
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

export function tilt(el, { max = 12, scale = 1.02 } = {}) {
  if (reduced || !fine) return;
  el.classList.add('tilt');
  if (!el.querySelector(':scope > .glare')) {
    const g = document.createElement('span');
    g.className = 'glare';
    el.appendChild(g);
  }
  let raf = 0, tx = 0, ty = 0, cx = 0, cy = 0, active = false;
  const frame = () => {
    cx += (tx - cx) * 0.18;
    cy += (ty - cy) * 0.18;
    el.style.transform = `perspective(900px) rotateX(${cy}deg) rotateY(${cx}deg) scale(${active ? scale : 1})`;
    if (Math.abs(tx - cx) > 0.02 || Math.abs(ty - cy) > 0.02 || active) raf = requestAnimationFrame(frame);
    else {
      raf = 0;
      if (!active) el.style.transform = '';
    }
  };
  const kick = () => raf || (raf = requestAnimationFrame(frame));
  el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    tx = (px - 0.5) * max * 2;
    ty = -(py - 0.5) * max * 2;
    el.style.setProperty('--gx', `${px * 100}%`);
    el.style.setProperty('--gy', `${py * 100}%`);
    active = true;
    kick();
  });
  el.addEventListener('pointerleave', () => {
    active = false;
    tx = ty = 0;
    kick();
  });
}
