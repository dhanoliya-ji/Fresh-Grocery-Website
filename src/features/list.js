import { cart, load, save } from '../cart.js';
import { findProduct, parseQty } from '../match.js';
import { prefs } from '../prefs.js';

// Shopping list that ticks itself off: type (or say) "milk, 2 bananas, bread", each line is matched to a
// product, and it's crossed off as soon as that product is in the basket. You can also tick things by hand.
export function initList({ app, panel, button, search }) {
  const { t } = app;
  let items = load('freshly-list-v1', []); // { k, text, pid, qty, done }
  const $ = (q) => panel.querySelector(q);
  const form = $('#listForm'), input = $('#listInput'), ul = $('#listItems');
  const wasTicked = new Set();
  const persist = () => save('freshly-list-v1', items);
  const ticked = (it) => it.done || (it.pid && cart.qty(it.pid) > 0);

  function render() {
    const count = items.filter((it) => !ticked(it)).length;
    button.querySelector('.count').textContent = count || '';
    $('#listEmpty').hidden = items.length > 0;
    ul.innerHTML = items.map((it) => {
      const p = it.pid && app.byId[it.pid];
      const on = ticked(it);
      const just = on && !wasTicked.has(it.k);
      return `<li class="li ${on ? 'on' : ''} ${just ? 'just' : ''}" data-k="${it.k}">
        <button class="li-check" data-tick aria-label="${on ? t('Untick') : t('Tick')} ${app.esc(it.text)}"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></button>
        ${p ? `<img src="${app.src(p)}" alt="" class="${p.cut ? '' : 'photo'}" />` : '<span class="li-q">?</span>'}
        <div class="li-t"><b>${it.qty > 1 ? `${it.qty} × ` : ''}${app.esc(p ? p.name : it.text)}</b><small>${p ? `${app.money(p.price)} · ${p.unit}${cart.qty(p.id) ? ` · ${t('{n} in basket', { n: cart.qty(p.id) })}` : ''}` : `${t('No exact match.')} <button class="linkish" data-find>${t('Search')}</button>`}</small></div>
        ${p && !on ? `<button class="add sm" data-add aria-label="${t('Add')} ${app.esc(p.name)}">+</button>` : ''}
        <button class="li-x" data-rm aria-label="${t('Remove')}">×</button>
      </li>`;
    }).join('');
    items.forEach((it) => (ticked(it) ? wasTicked.add(it.k) : wasTicked.delete(it.k)));
    const done = items.filter(ticked).length;
    $('#listProg').textContent = items.length ? t('{a} of {b} ticked off', { a: done, b: items.length }) : '';
    $('#listBar').style.width = items.length ? `${(done / items.length) * 100}%` : '0';
    $('#listAddAll').hidden = !items.some((it) => it.pid && !ticked(it));
    $('#listClear').hidden = !done;
    if (items.length && done === items.length && !render.celebrated) {
      render.celebrated = true;
      app.toast(t('✅ Everything on your list is ticked off!'));
    }
    if (done < items.length) render.celebrated = false;
  }

  function addText(text) {
    const parts = text.split(/[,;\n]+|\s+and\s+|\s+y\s+|\s+और\s+/i).map((s) => s.trim()).filter(Boolean);
    for (const part of parts) {
      const { qty, text: name } = parseQty(part);
      const p = findProduct(name);
      const same = p && items.find((it) => it.pid === p.id);
      if (same) same.qty += qty;
      else items.push({ k: Math.random().toString(36).slice(2, 9), text: part, pid: p?.id || null, qty, done: false });
    }
    persist();
    render();
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!input.value.trim()) return;
    addText(input.value);
    input.value = '';
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      form.requestSubmit();
    }
  });
  ul.addEventListener('click', (e) => {
    const li = e.target.closest('.li');
    if (!li) return;
    const it = items.find((x) => x.k === li.dataset.k);
    if (e.target.closest('[data-tick]')) {
      if (ticked(it) && it.pid && cart.qty(it.pid)) it.done = !it.done;
      else it.done = !ticked(it);
    } else if (e.target.closest('[data-add]')) {
      cart.add(it.pid, it.qty);
      app.flyToCart(li.querySelector('img'), app.byId[it.pid]);
    } else if (e.target.closest('[data-rm]')) items = items.filter((x) => x !== it);
    else if (e.target.closest('[data-find]')) {
      search.value = it.text;
      search.dispatchEvent(new Event('input'));
      close();
      document.getElementById('shop').scrollIntoView({ behavior: 'smooth' });
      return;
    } else return;
    persist();
    render();
  });
  $('#listAddAll').addEventListener('click', () => {
    const todo = items.filter((it) => it.pid && !ticked(it));
    todo.forEach((it, i) => setTimeout(() => cart.add(it.pid, it.qty), i * 90));
    app.toast(t('Added <b>{n} items</b> from your list', { n: todo.length }));
  });
  $('#listClear').addEventListener('click', () => {
    items = items.filter((it) => !ticked(it));
    persist();
    render();
  });

  // dictation into the list box
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const mic = $('#listMic');
  if (!SR) mic.hidden = true;
  else {
    const rec = new SR();
    rec.lang = { en: 'en-US', hi: 'hi-IN', es: 'es-ES' }[prefs.lang] || 'en-US';
    rec.onresult = (e) => {
      const said = [...e.results].map((r) => r[0].transcript).join(' ');
      addText(said);
    };
    rec.onend = () => mic.classList.remove('on');
    rec.onerror = () => mic.classList.remove('on');
    mic.addEventListener('click', () => {
      if (mic.classList.contains('on')) return rec.stop();
      mic.classList.add('on');
      try {
        rec.start();
      } catch {
        mic.classList.remove('on');
      }
    });
  }

  const open = () => {
    panel.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
    document.getElementById('scrim').classList.add('show');
    setTimeout(() => input.focus(), 300);
  };
  function close() {
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
    if (!document.getElementById('drawer').classList.contains('open')) document.getElementById('scrim').classList.remove('show');
  }
  button.addEventListener('click', open);
  $('[data-close]').addEventListener('click', close);
  document.getElementById('scrim').addEventListener('click', close);
  addEventListener('keydown', (e) => e.key === 'Escape' && panel.classList.contains('open') && close());
  cart.on(render);
  render();
  return { open, close, get isOpen() { return panel.classList.contains('open'); } };
}
