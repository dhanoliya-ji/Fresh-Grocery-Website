import gsap from 'gsap';

// Split an element's text into masked words (keeping inline tags like <em> and <br>),
// so each word can slide up from behind its own mask.
export function splitWords(el) {
  if (el.dataset.split) return [...el.querySelectorAll('.w > span')];
  el.dataset.split = '1';
  el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
  const walk = (node) => {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === 3) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) frag.appendChild(document.createTextNode(' '));
          else {
            const w = document.createElement('span');
            w.className = 'w';
            w.setAttribute('aria-hidden', 'true');
            const inner = document.createElement('span');
            inner.textContent = part;
            w.appendChild(inner);
            frag.appendChild(w);
          }
        });
        child.replaceWith(frag);
      } else if (child.nodeType === 1 && child.tagName !== 'BR') walk(child);
    }
  };
  walk(el);
  return [...el.querySelectorAll('.w > span')];
}

// headings rise word by word when they scroll into view
export function revealHeadings(selector) {
  document.querySelectorAll(selector).forEach((el) => {
    const words = splitWords(el);
    gsap.from(words, { yPercent: 115, rotate: 4, duration: 0.9, stagger: 0.06, ease: 'power4.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
  });
}
