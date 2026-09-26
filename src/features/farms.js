import gsap from 'gsap';
import { FARMS } from '../data.js';

// Meet the growers: a row of farm cards; each opens a profile with the farmer's story,
// how they grow, and the products we buy from them.
export function initFarms({ app, row, modal }) {
  const pic = (f) => `${app.BASE}img/${f.img}.webp`;
  row.innerHTML = FARMS.map((f) => `
    <button class="grower" data-farm="${f.id}" data-cursor="Meet">
      <img src="${pic(f)}" alt="" loading="lazy" />
      <span class="g-body"><b>${app.esc(f.name)}</b><small>${app.esc(f.place)} · ${f.miles} mi</small></span>
      <span class="g-av">${f.farmer.split(' ').map((w) => w[0]).filter((c) => /[A-Z]/.test(c)).slice(0, 2).join('')}</span>
    </button>`).join('');
  row.querySelectorAll('.grower').forEach((el) => app.tilt(el, { max: 8 }));

  const box = modal.querySelector('.farm-box');
  function open(id) {
    const f = FARMS.find((x) => x.id === id);
    if (!f) return;
    const ps = f.products.map((pid) => app.byId[pid]).filter(Boolean);
    box.querySelector('.fm-body').innerHTML = `
      <div class="fm-hero"><img src="${pic(f)}" alt="" /><div class="fm-title"><p class="kicker">Meet the grower</p><h3>${app.esc(f.name)}</h3><p>${app.esc(f.farmer)} · ${app.esc(f.place)}</p></div></div>
      <div class="fm-main">
        <div class="fm-stats"><div><b>${f.miles} mi</b><span>from our store</span></div><div><b>${f.since}</b><span>farming since</span></div><div><b>${f.acres}</b><span>acres</span></div></div>
        <blockquote>“${app.esc(f.quote)}”</blockquote>
        <p class="fm-story">${app.esc(f.story)}</p>
        <div class="fm-tags">${f.practices.map((p) => `<span>✓ ${app.esc(p)}</span>`).join('')}</div>
        <h4>From this farm</h4>
        <div class="fm-products">${ps.map((p) => `<article class="mc" data-id="${p.id}"><div class="mc-pic">${app.img(p)}</div><b>${app.esc(p.name)}</b><span class="mc-row"><span class="price">${app.money(p.price)}</span><button class="add sm" data-act="add" data-id="${p.id}" aria-label="Add ${app.esc(p.name)}">+</button></span></article>`).join('')}</div>
      </div>`;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    if (!app.reduced) {
      gsap.fromTo(box.querySelector('.fm-hero img'), { scale: 1.25 }, { scale: 1.05, duration: 1.4, ease: 'power3.out' });
      gsap.from(box.querySelectorAll('.fm-main > *'), { y: 18, opacity: 0, stagger: 0.05, duration: 0.5, ease: 'power3.out', delay: 0.1 });
    }
  }
  const close = () => {
    modal.hidden = true;
    document.body.style.overflow = '';
  };
  row.addEventListener('click', (e) => {
    const g = e.target.closest('[data-farm]');
    if (g) open(g.dataset.farm);
  });
  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.closest('[data-close]')) close();
  });
  return { open, close, get isOpen() { return !modal.hidden; } };
}
