// Rolling digits: every digit is a 0–9 column that slides to its new value, like a departure board.
// odo(el, '$12.49') builds or updates the columns; non-digits are plain characters.
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const col = '<span class="odo-c">' + '0123456789'.split('').map((d) => `<i>${d}</i>`).join('') + '</span>';

export function odo(el, text) {
  if (!el) return;
  if (reduced) {
    el.textContent = text;
    return;
  }
  const prev = el.dataset.odo;
  if (prev === text) return;
  el.dataset.odo = text;
  el.setAttribute('aria-label', text);
  const shape = (s) => s.replace(/\d/g, '0');
  // same layout (same digit positions): just roll the columns
  if (prev && shape(prev) === shape(text) && el.querySelector('.odo')) {
    [...el.querySelectorAll('.odo')].forEach((d, i) => {
      const v = text.replace(/\D/g, '')[i];
      d.firstChild.style.transform = `translateY(${-v * 10}%)`;
    });
    return;
  }
  // new layout: build it at the old values (or 0), then roll to the new ones on the next frame
  const oldDigits = (prev || '').replace(/\D/g, '');
  let di = 0;
  el.innerHTML = [...text].map((ch) => (/\d/.test(ch) ? `<span class="odo" aria-hidden="true">${col}</span>` : `<span class="odo-s" aria-hidden="true">${ch}</span>`)).join('');
  const cols = [...el.querySelectorAll('.odo-c')];
  cols.forEach((c, i) => {
    const from = oldDigits[oldDigits.length - cols.length + i] ?? 0;
    c.style.transition = 'none';
    c.style.transform = `translateY(${-from * 10}%)`;
  });
  requestAnimationFrame(() =>
    requestAnimationFrame(() =>
      cols.forEach((c) => {
        const v = text.replace(/\D/g, '')[di++];
        c.style.transition = '';
        c.style.transform = `translateY(${-v * 10}%)`;
      }),
    ),
  );
}

// flip-clock style: the box folds down and the new value unfolds
export function flip(el, text) {
  if (el.textContent === text) return;
  el.textContent = text;
  if (reduced) return;
  el.classList.remove('flip');
  void el.offsetWidth;
  el.classList.add('flip');
}
