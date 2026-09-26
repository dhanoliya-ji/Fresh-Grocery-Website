import gsap from 'gsap';
import { PRIZES } from '../data.js';
import { cart, load, save } from '../cart.js';

// Daily prize wheel: one spin per day (remembered in this browser). The prize becomes the basket promo.
export function initWheel({ app, fab, modal }) {
  const cv = modal.querySelector('canvas');
  const ctx = cv.getContext('2d');
  const wheel = modal.querySelector('.wheel-disc');
  const pointer = modal.querySelector('.pointer');
  const spinBtn = modal.querySelector('#spinBtn');
  const msg = modal.querySelector('#wheelMsg');
  const again = modal.querySelector('#wheelAgain');
  const SEG = 360 / PRIZES.length;
  const today = () => new Date().toDateString();
  let state = { r: 0 }, spinning = false;

  // draw the wheel once: coloured wedges, white dividers, labels along the radius
  const S = cv.width, R = S / 2;
  const draw = () => {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, S, S);
  ctx.translate(R, R);
  PRIZES.forEach((p, i) => {
    const a0 = ((i * SEG - 90) * Math.PI) / 180, a1 = (((i + 1) * SEG - 90) * Math.PI) / 180;
    const g = ctx.createRadialGradient(0, 0, R * 0.2, 0, 0, R);
    g.addColorStop(0, p.color);
    g.addColorStop(1, shade(p.color, -0.18));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, R - 18, a0, a1);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.9)';
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.save();
    ctx.rotate((a0 + a1) / 2);
    ctx.textAlign = 'right';
    ctx.fillStyle = light(p.color) ? '#1f2a22' : '#ffffff';
    const lines = p.short.split('\n');
    ctx.font = `800 ${lines.length > 1 ? 34 : 54}px Fraunces, 'Noto Serif Devanagari', Georgia, serif`;
    lines.forEach((l, k) => ctx.fillText(l, R - 52, (k - (lines.length - 1) / 2) * 38 + (lines.length > 1 ? 12 : 18)));
    ctx.restore();
  });
  // rim with bulbs
  ctx.lineWidth = 22;
  ctx.strokeStyle = '#1f7a4d';
  ctx.beginPath();
  ctx.arc(0, 0, R - 11, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    ctx.fillStyle = i % 2 ? '#ffc94a' : '#fff6d6';
    ctx.beginPath();
    ctx.arc(Math.cos(a) * (R - 11), Math.sin(a) * (R - 11), 6, 0, Math.PI * 2);
    ctx.fill();
  }
  };
  // labels use the page serif, so wait for the fonts
  draw();
  document.fonts.ready.then(draw);

  function pick() {
    const total = PRIZES.reduce((s, p) => s + p.weight, 0);
    let r = Math.random() * total;
    return PRIZES.findIndex((p) => (r -= p.weight) < 0);
  }
  const under = (r) => Math.floor((((-r % 360) + 360) % 360) / SEG);

  function showResult(i, fresh) {
    const p = PRIZES[i];
    msg.innerHTML = fresh
      ? app.t('🎉 You won <b>{prize}</b>! It’s been applied to your basket.', { prize: p.label })
      : `${app.t('Today’s prize: <b>{prize}</b>.', { prize: p.label })} ${cart.promo?.label === p.label ? app.t('It’s in your basket.') : ''} ${app.t('Come back tomorrow for another spin.')}`;
    spinBtn.disabled = true;
    spinBtn.textContent = '✓';
    again.hidden = false;
    fab.classList.add('done');
  }

  function open() {
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    const s = load('freshly-spin', null);
    if (s?.date === today()) {
      state.r = -(s.prize + 0.5) * SEG;
      wheel.style.transform = `rotate(${state.r}deg)`;
      showResult(s.prize, false);
    } else {
      spinBtn.disabled = false;
      spinBtn.textContent = app.t('SPIN');
      again.hidden = true;
      msg.innerHTML = app.t('One free spin every day. Every slice is a win!');
    }
  }
  function close() {
    modal.hidden = true;
    document.body.style.overflow = '';
  }

  spinBtn.addEventListener('click', () => {
    if (spinning || spinBtn.disabled) return;
    spinning = true;
    const i = pick();
    const jitter = (Math.random() - 0.5) * SEG * 0.6;
    const target = -(i + 0.5) * SEG + jitter;
    const base = state.r - (((state.r - target) % 360) + 360) % 360;
    const end = base - 360 * 6; // six full turns, landing on the chosen slice
    let last = under(state.r);
    msg.textContent = app.t('Good luck…');
    gsap.to(state, {
      r: end,
      duration: app.reduced ? 0.01 : 5.4,
      ease: 'power4.out',
      onUpdate: () => {
        wheel.style.transform = `rotate(${state.r}deg)`;
        const u = under(state.r);
        if (u !== last) {
          last = u;
          pointer.classList.remove('tick');
          void pointer.offsetWidth;
          pointer.classList.add('tick');
        }
      },
      onComplete: () => {
        spinning = false;
        const p = PRIZES[i];
        save('freshly-spin', { date: today(), prize: i });
        cart.setPromo({ label: p.label, type: p.type, value: p.value, id: p.id });
        showResult(i, true);
        app.confetti();
        app.toast(app.t('🎁 <b>{prize}</b> applied to your basket', { prize: p.label }));
      },
    });
  });
  again.addEventListener('click', () => {
    save('freshly-spin', null);
    open();
  });
  fab.addEventListener('click', open);
  modal.querySelector('[data-close]').addEventListener('click', close);
  modal.addEventListener('click', (e) => e.target === modal && close());
  if (load('freshly-spin', null)?.date === today()) fab.classList.add('done');
  return { open, close, get isOpen() { return !modal.hidden; } };
}

function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c) => Math.max(0, Math.min(255, Math.round(c + c * k)));
  return `rgb(${f(n >> 16)}, ${f((n >> 8) & 255)}, ${f(n & 255)})`;
}
function light(hex) {
  const n = parseInt(hex.slice(1), 16);
  return (n >> 16) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 > 170;
}
