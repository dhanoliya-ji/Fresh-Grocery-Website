import gsap from 'gsap';
import { BOXES, BOX_SIZES } from '../data.js';
import { load, save } from '../cart.js';

// Weekly fresh-box subscription (demo): pick a box, a size, a delivery day and how often.
// A 3D wooden crate shows this week's contents; upcoming deliveries can be skipped one by one.
const DEF = { type: 'mixed', size: 'm', day: 1, freq: 1, active: false, skips: [] };
const iso = (d) => d.toISOString().slice(0, 10);
const weekNo = (d) => Math.floor((d.getTime() / 864e5 + 4) / 7);

export function initSubscribe({ root, app }) {
  const { t } = app;
  const s = Object.assign({}, DEF, load('freshly-box-v1', {}));
  const persist = () => save('freshly-box-v1', s);
  const $ = (q) => root.querySelector(q);
  const DAYS = [t('Mon'), t('Tue'), t('Wed'), t('Thu'), t('Fri'), t('Sat'), t('Sun')];
  const box = () => BOXES.find((b) => b.id === s.type);
  const size = () => BOX_SIZES.find((z) => z.id === s.size);
  const price = () => Math.round(box().base * size().k) - 0.01;

  // the next six delivery dates on the chosen weekday
  function deliveries() {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() + 1);
    while ((d.getDay() + 6) % 7 !== s.day) d.setDate(d.getDate() + 1);
    return Array.from({ length: 6 }, (_, i) => new Date(d.getTime() + i * 7 * s.freq * 864e5));
  }
  // this week's contents rotate through the box's pool
  const contents = (when) => {
    const pool = box().pool.filter((id) => app.byId[id]);
    const n = Math.min(size().items, pool.length);
    const off = weekNo(when) % pool.length;
    return Array.from({ length: n }, (_, i) => app.byId[pool[(off + i) % pool.length]]);
  };

  $('#boxTypes').innerHTML = BOXES.map((b) => `<button class="bt" data-type="${b.id}" style="--c:${b.color}"><span class="bt-pics">${b.pool.slice(0, 3).map((id) => `<img src="${app.src(app.byId[id])}" alt="" loading="lazy" />`).join('')}</span><b>${t(b.name)}</b><small>${t(b.blurb)}</small><em>${t('from')} ${app.money(b.base - 0.01)}/${t('wk')}</em></button>`).join('');
  $('#boxSizes').innerHTML = BOX_SIZES.map((z) => `<button data-size="${z.id}"><b>${t(z.name)}</b><small>${t(z.serves)}</small></button>`).join('');
  $('#boxDays').innerHTML = DAYS.map((d, i) => `<button data-day="${i}">${d}</button>`).join('');
  $('#boxFreq').innerHTML = `<button data-freq="1">${t('Every week')}</button><button data-freq="2">${t('Every 2 weeks')}</button>`;

  function render(drop) {
    root.querySelectorAll('[data-type]').forEach((b) => b.classList.toggle('on', b.dataset.type === s.type));
    root.querySelectorAll('[data-size]').forEach((b) => b.classList.toggle('on', b.dataset.size === s.size));
    root.querySelectorAll('[data-day]').forEach((b) => b.classList.toggle('on', +b.dataset.day === s.day));
    root.querySelectorAll('[data-freq]').forEach((b) => b.classList.toggle('on', +b.dataset.freq === s.freq));
    const ds = deliveries();
    const next = ds.find((d) => !s.skips.includes(iso(d)));
    const items = contents(next || ds[0]);
    const fmt = (d) => d.toLocaleDateString(app.locale, { weekday: 'short', month: 'short', day: 'numeric' });
    $('#crateItems').innerHTML = items.map((p, i) => `<img src="${app.src(p)}" alt="${app.esc(p.name)}" class="${p.cut ? '' : 'photo'}" style="--i:${i};--n:${items.length}" />`).join('');
    $('#boxName').textContent = `${t(box().name)} · ${t(size().name)}`;
    $('#boxPrice').innerHTML = `${app.money(price())}<small>/${t('box')}</small>`;
    $('#boxList').textContent = items.map((p) => p.name).join(' · ');
    $('#boxDates').innerHTML = ds.map((d) => {
      const skip = s.skips.includes(iso(d));
      return `<button class="bd ${skip ? 'skip' : ''} ${d === next ? 'next' : ''}" data-date="${iso(d)}" ${s.active ? '' : 'disabled'}><b>${fmt(d)}</b><span>${skip ? t('Skipped') : d === next ? t('Next box') : t('Skip')}</span></button>`;
    }).join('');
    $('#boxCta').textContent = s.active ? t('Save changes') : t('Subscribe · {v}/box', { v: app.money(price()) });
    $('#boxStatus').innerHTML = s.active
      ? `<span class="live">●</span> ${t('Active')} · ${t('next box')} <b>${next ? fmt(next) : '–'}</b> · <button class="linkish" id="boxCancel">${t('Cancel')}</button>`
      : t('No commitment. Skip or cancel any time.');
    root.classList.toggle('subscribed', s.active);
    if (drop && !app.reduced) gsap.from('#crateItems img', { y: -140, opacity: 0, rotate: () => (Math.random() - 0.5) * 60, duration: 0.7, stagger: 0.05, ease: 'bounce.out' });
  }

  root.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    let drop = false;
    if (b.dataset.type) (s.type = b.dataset.type), (drop = true);
    else if (b.dataset.size) (s.size = b.dataset.size), (drop = true);
    else if (b.dataset.day) s.day = +b.dataset.day;
    else if (b.dataset.freq) s.freq = +b.dataset.freq;
    else if (b.dataset.date) {
      const k = s.skips.indexOf(b.dataset.date);
      if (k >= 0) s.skips.splice(k, 1);
      else s.skips.push(b.dataset.date);
      app.toast(k >= 0 ? t('Delivery back on') : t('Skipped that week'));
    } else if (b.id === 'boxCta') {
      const first = !s.active;
      s.active = true;
      if (first) {
        app.confetti();
        app.toast(t('🎉 Subscribed to the <b>{name}</b>', { name: t(box().name) }));
        if (!app.reduced) gsap.fromTo('.crate', { y: 0 }, { y: -30, duration: 0.25, yoyo: true, repeat: 1, ease: 'power2.out' });
      } else app.toast(t('Subscription updated'));
    } else if (b.id === 'boxCancel') {
      s.active = false;
      s.skips = [];
      app.toast(t('Subscription cancelled'));
    } else return;
    persist();
    render(drop);
  });
  render(false);
}
