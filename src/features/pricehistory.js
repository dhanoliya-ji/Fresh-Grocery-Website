// Price history (demo data): 8 weekly prices per product, ending at today's price.
// Sale items trend down from their old price; everything else wanders a few percent.
const hash = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 11);
const cents = (v) => Math.round(v * 100) / 100;
const WEEKS = 8;

export function history(p) {
  let seed = hash(p.id);
  const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  const pts = [];
  if (p.old) {
    for (let i = 0; i < WEEKS - 2; i++) pts.push(cents(p.old * (0.98 + rnd() * 0.04)));
    pts.push(cents((p.old + p.price) / 2 + (rnd() - 0.5) * 0.1));
  } else {
    let v = p.price * (1 + (rnd() - 0.4) * 0.12);
    for (let i = 0; i < WEEKS - 1; i++) {
      v = Math.max(p.price * 0.88, Math.min(p.price * 1.14, v * (1 + (rnd() - 0.5) * 0.08)));
      pts.push(cents(v));
    }
  }
  pts.push(p.price);
  return pts;
}

export function trend(p) {
  const h = history(p);
  const min = Math.min(...h), max = Math.max(...h);
  return { h, min, max, lowest: p.price <= min + 0.001, change: (p.price - h[0]) / h[0] };
}

// tiny sparkline for product cards
export function sparkSvg(p) {
  const { h, min, max } = trend(p);
  const W = 46, H = 16, pad = 2;
  const x = (i) => pad + (i / (h.length - 1)) * (W - pad * 2);
  const y = (v) => pad + (1 - (v - min) / (max - min || 1)) * (H - pad * 2);
  const d = h.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  return `<svg class="spark" viewBox="0 0 ${W} ${H}" aria-hidden="true"><path d="${d}" /><circle cx="${x(h.length - 1)}" cy="${y(h[h.length - 1])}" r="2" /></svg>`;
}

// full chart for the product view, with a hover readout
export function mountChart(host, p, { money, t }) {
  const { h, min, max, change } = trend(p);
  const W = 360, H = 120, L = 34, R = 10, T = 12, B = 22;
  const lo = min * 0.97, hi = max * 1.03;
  const x = (i) => L + (i / (h.length - 1)) * (W - L - R);
  const y = (v) => T + (1 - (v - lo) / (hi - lo || 1)) * (H - T - B);
  const line = h.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  const area = `${line} L${x(h.length - 1)} ${H - B} L${x(0)} ${H - B} Z`;
  const down = change < -0.005, up = change > 0.005;
  const label = down ? t('↓ {n}% in 8 weeks', { n: Math.round(-change * 100) }) : up ? t('↑ {n}% in 8 weeks', { n: Math.round(change * 100) }) : t('Steady price');
  host.innerHTML = `
    <div class="ph-head"><b>${t('Price history')}</b><span class="ph-chg ${down ? 'down' : up ? 'up' : ''}">${label}</span></div>
    <svg viewBox="0 0 ${W} ${H}" class="ph-svg" role="img" aria-label="${t('Price history')}">
      <defs><linearGradient id="phg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="currentColor" stop-opacity=".28"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></linearGradient></defs>
      ${[lo, (lo + hi) / 2, hi].map((v) => `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" class="ph-grid"/><text x="${L - 6}" y="${y(v) + 3}" class="ph-y">${money(v).replace('.00', '')}</text>`).join('')}
      <path d="${area}" class="ph-area" fill="url(#phg)"/>
      <path d="${line}" class="ph-line" pathLength="1"/>
      ${h.map((v, i) => `<circle cx="${x(i)}" cy="${y(v)}" r="${i === h.length - 1 ? 4.5 : 2.5}" class="ph-dot ${i === h.length - 1 ? 'now' : ''}" style="--d:${0.2 + i * 0.08}s"/>`).join('')}
      ${h.map((_, i) => (i % 2 === 1 || i === h.length - 1 ? `<text x="${x(i)}" y="${H - 6}" class="ph-x">${i === h.length - 1 ? t('now') : `-${h.length - 1 - i}${t('w')}`}</text>` : '')).join('')}
      <line class="ph-cursor" x1="0" x2="0" y1="${T}" y2="${H - B}" />
    </svg>
    <div class="ph-tip"></div>`;
  const svg = host.querySelector('svg'), tip = host.querySelector('.ph-tip'), cur = host.querySelector('.ph-cursor');
  svg.addEventListener('pointermove', (e) => {
    const r = svg.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const i = Math.max(0, Math.min(h.length - 1, Math.round(((px - L) / (W - L - R)) * (h.length - 1))));
    cur.setAttribute('x1', x(i));
    cur.setAttribute('x2', x(i));
    host.classList.add('hov');
    tip.textContent = `${i === h.length - 1 ? t('This week') : t('{n} weeks ago', { n: h.length - 1 - i })}: ${money(h[i])}`;
    tip.style.left = `${(x(i) / W) * 100}%`;
  });
  svg.addEventListener('pointerleave', () => host.classList.remove('hov'));
}
