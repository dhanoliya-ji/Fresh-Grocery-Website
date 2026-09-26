import { cart } from '../cart.js';

// Scratch card in the checkout summary: rub off the foil (mouse or finger) to reveal a surprise
// discount for this order. Once about half the foil is gone the rest peels away.
const AMOUNTS = [1, 2, 2, 3, 3, 5];

export function initScratch({ app, host, onWin }) {
  const cv = host.querySelector('canvas');
  const prizeEl = host.querySelector('.sc-prize b');
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  let amount = 0, done = false, down = false, last = null;

  function paintFoil() {
    const r = host.getBoundingClientRect();
    cv.width = Math.max(1, r.width) * devicePixelRatio;
    cv.height = Math.max(1, r.height) * devicePixelRatio;
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    const g = ctx.createLinearGradient(0, 0, r.width, r.height);
    g.addColorStop(0, '#c9ccd1');
    g.addColorStop(0.35, '#f1f2f4');
    g.addColorStop(0.55, '#b6bac1');
    g.addColorStop(1, '#e3e5e8');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, r.width, r.height);
    // sparkle speckles
    for (let i = 0; i < 120; i++) {
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.6})`;
      ctx.fillRect(Math.random() * r.width, Math.random() * r.height, 1.5, 1.5);
    }
    ctx.fillStyle = '#5b6168';
    ctx.font = "700 15px Inter, 'Noto Sans Devanagari', sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText(`🎁  ${app.t('Scratch for a surprise')}`, r.width / 2, r.height / 2 + 5);
  }

  // new card for each checkout
  function reset() {
    // already scratched for this basket: keep showing the win
    if (cart.bonus > 0) {
      done = true;
      prizeEl.textContent = app.money(cart.bonus);
      host.classList.add('won');
      cv.style.opacity = '0';
      return;
    }
    done = false;
    amount = AMOUNTS[(Math.random() * AMOUNTS.length) | 0];
    prizeEl.textContent = app.money(amount);
    host.classList.remove('won');
    cv.style.opacity = '';
    requestAnimationFrame(paintFoil);
  }
  const at = (e) => {
    const r = cv.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  function scratch(p) {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineCap = ctx.lineJoin = 'round';
    ctx.lineWidth = 30;
    ctx.beginPath();
    ctx.moveTo((last || p).x, (last || p).y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last = p;
  }
  function cleared() {
    const d = ctx.getImageData(0, 0, cv.width, cv.height).data;
    let clear = 0, n = 0;
    for (let i = 3; i < d.length; i += 4 * 24) {
      n++;
      if (d[i] < 40) clear++;
    }
    return clear / n;
  }
  function win() {
    done = true;
    host.classList.add('won');
    cv.style.opacity = '0';
    cart.setBonus(amount);
    app.toast(app.t('🎉 Surprise! <b>{v} off</b> this order', { v: app.money(amount) }));
    onWin?.();
  }
  cv.addEventListener('pointerdown', (e) => {
    if (done) return;
    down = true;
    last = null;
    cv.setPointerCapture(e.pointerId);
    scratch(at(e));
  });
  cv.addEventListener('pointermove', (e) => {
    if (!down || done) return;
    scratch(at(e));
  });
  const up = () => {
    if (!down) return;
    down = false;
    if (!done && cleared() > 0.45) win();
  };
  cv.addEventListener('pointerup', up);
  cv.addEventListener('pointercancel', up);
  return { reset, get won() { return done; } };
}
