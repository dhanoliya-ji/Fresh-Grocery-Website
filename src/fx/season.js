import { SEASONS, byId } from '../data.js';
import { load, save } from '../cart.js';

// Seasonal mode: picks the season from today's date (northern hemisphere), lets visitors preview
// the others, and decorates the hero with falling leaves, snow, blossom petals or summer sparkles.
const auto = () => {
  const m = new Date().getMonth();
  return m >= 2 && m <= 4 ? 'spring' : m >= 5 && m <= 7 ? 'summer' : m >= 8 && m <= 10 ? 'autumn' : 'winter';
};

export function initSeason({ app, canvas, banner }) {
  const { reduced, esc, src, money } = app;
  let season = load('freshly-season', null) || auto();
  const ctx = canvas.getContext('2d');
  let P = [], w = 0, h = 0, on = true;

  const palette = {
    autumn: ['#d9622b', '#e89a2c', '#b8401f', '#c9a227', '#8f3d1d'],
    winter: ['#ffffff', '#eef5ff', '#dde9f8'],
    spring: ['#ffc6d9', '#ffb3cc', '#fff0f5', '#ffd6e5'],
    summer: ['#fff3b0', '#ffe27a', '#ffffff'],
  };
  const make = (initial) => {
    const cols = palette[season];
    const s = season;
    return {
      x: Math.random() * w,
      y: initial ? Math.random() * h : -20 - Math.random() * 80,
      r: s === 'winter' ? 1.5 + Math.random() * 3 : s === 'summer' ? 1 + Math.random() * 2.2 : 6 + Math.random() * 7,
      vy: s === 'summer' ? -(6 + Math.random() * 10) : s === 'winter' ? 25 + Math.random() * 40 : 30 + Math.random() * 35,
      vx: (Math.random() - 0.5) * 20,
      a: Math.random() * 6.28,
      va: (Math.random() - 0.5) * 3,
      sw: Math.random() * 6.28,
      c: cols[(Math.random() * cols.length) | 0],
      life: Math.random(),
    };
  };
  const fill = () => {
    const n = reduced ? 0 : season === 'summer' ? 38 : season === 'winter' ? 70 : 26;
    P = Array.from({ length: n }, () => make(true));
  };
  const resize = () => {
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = w * devicePixelRatio;
    canvas.height = h * devicePixelRatio;
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  };
  addEventListener('resize', resize);
  new IntersectionObserver(([e]) => (on = e.isIntersecting)).observe(canvas);

  const leaf = (p) => {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.a);
    ctx.scale(1, Math.abs(Math.cos(p.sw * 0.7)) * 0.7 + 0.3); // tumbling in 3D
    ctx.fillStyle = p.c;
    ctx.beginPath();
    if (season === 'autumn') {
      ctx.moveTo(0, -p.r);
      ctx.quadraticCurveTo(p.r * 0.9, -p.r * 0.2, 0, p.r);
      ctx.quadraticCurveTo(-p.r * 0.9, -p.r * 0.2, 0, -p.r);
      ctx.fill();
      ctx.strokeStyle = 'rgba(80,30,10,.35)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(0, -p.r);
      ctx.lineTo(0, p.r * 1.25);
      ctx.stroke();
    } else {
      // blossom petal
      ctx.ellipse(0, 0, p.r * 0.55, p.r * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };
  let last = performance.now();
  const loop = (now) => {
    requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!on) return;
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < P.length; i++) {
      const p = P[i];
      p.sw += dt * 1.6;
      p.a += p.va * dt;
      p.x += (p.vx + Math.sin(p.sw) * 22) * dt;
      p.y += p.vy * dt;
      if (season === 'summer') {
        // sun sparkles drift up and twinkle
        p.life += dt * 0.5;
        const tw = 0.5 + 0.5 * Math.sin(p.life * 6 + p.a);
        ctx.fillStyle = p.c;
        ctx.globalAlpha = 0.35 + tw * 0.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * (0.6 + tw * 0.6), 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        if (p.y < -10) P[i] = { ...make(false), y: h + 10 };
      } else if (season === 'winter') {
        // a soft blue shadow keeps white flakes visible on the cream sky
        ctx.fillStyle = p.c;
        ctx.shadowColor = 'rgba(70, 110, 160, 0.45)';
        ctx.shadowBlur = 4;
        ctx.globalAlpha = 0.95;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
      } else leaf(p);
      if (p.y > h + 20 || p.x < -40 || p.x > w + 40) P[i] = make(false);
    }
  };

  function apply() {
    const S = SEASONS[season];
    document.documentElement.dataset.season = season;
    const eb = document.querySelector('.hero .eyebrow');
    if (eb) eb.innerHTML = `<span>${S.icon}</span> ${S.line} · Picked this morning`;
    banner.querySelector('.sb-title').innerHTML = `${S.icon} ${S.name} picks <small>${S.line.toLowerCase()}</small>`;
    banner.querySelector('.sb-items').innerHTML = S.picks
      .map((id) => byId[id])
      .map((p) => `<article class="mc" data-id="${p.id}"><div class="mc-pic">${app.img(p)}</div><b>${esc(p.name)}</b><span class="mc-row"><span class="price">${money(p.price)}</span><button class="add sm" data-act="add" data-id="${p.id}" aria-label="Add ${esc(p.name)}">+</button></span></article>`)
      .join('');
    banner.querySelectorAll('[data-season]').forEach((b) => b.classList.toggle('on', b.dataset.season === season));
    fill();
  }
  banner.querySelector('.sb-switch').innerHTML = Object.entries(SEASONS).map(([k, s]) => `<button data-season="${k}" title="${s.name}" aria-label="Preview ${s.name}">${s.icon}</button>`).join('');
  banner.addEventListener('click', (e) => {
    const b = e.target.closest('[data-season]');
    if (!b) return;
    season = b.dataset.season;
    save('freshly-season', season === auto() ? null : season);
    apply();
  });
  resize();
  apply();
  requestAnimationFrame(loop);
  return { get season() { return season; } };
}
