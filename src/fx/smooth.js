import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Momentum smooth scrolling (mouse wheel / trackpad) wired into GSAP, so every scroll animation,
// including the pinned store walk, stays perfectly in sync. Touch devices keep their native scrolling.
// Anything scrollable inside a dialog, drawer or horizontal row scrolls natively.
export function initSmooth({ reduced }) {
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (reduced || !fine) return { scrollTo: nativeScrollTo, stop() {}, start() {} };

  const lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    wheelMultiplier: 1,
    prevent: (node) => !!node.closest?.('.modal, .drawer, .list-panel, .suggest, .fy-row, .growers, .meals, .week, .sb-items, .cmp-scroll, .lines, .list-items, textarea'),
  });
  lenis.on('scroll', ScrollTrigger.update);
  window.__lenis = lenis; // handy for debugging in the console
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  // pause the page while a dialog locks scrolling (the code sets body overflow: hidden)
  new MutationObserver(() => (document.body.style.overflow === 'hidden' ? lenis.stop() : lenis.start())).observe(document.body, { attributes: true, attributeFilter: ['style'] });
  const drawers = ['#drawer', '#listPanel'].map((s) => document.querySelector(s));
  new MutationObserver(() => (drawers.some((d) => d?.classList.contains('open')) ? lenis.stop() : document.body.style.overflow !== 'hidden' && lenis.start())).observe(document.body, { attributes: true, subtree: true, attributeFilter: ['class'] });

  // route smooth programmatic scrolls (nav links, "scroll to shop", ...) through Lenis
  const header = () => document.getElementById('header')?.offsetHeight || 72;
  const orig = Element.prototype.scrollIntoView;
  Element.prototype.scrollIntoView = function (arg) {
    if (arg && typeof arg === 'object' && arg.behavior === 'smooth' && !this.closest('.modal, .drawer, .list-panel')) return lenis.scrollTo(this, { offset: -header() - 8 });
    return orig.call(this, arg);
  };
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.getAttribute('href').length < 2) return;
    const el = document.querySelector(a.getAttribute('href'));
    if (!el) return;
    e.preventDefault();
    lenis.scrollTo(el, { offset: el.id === 'top' ? 0 : -header() - 8 });
  });
  return { scrollTo: (target, o) => lenis.scrollTo(target, { offset: -header() - 8, ...o }), stop: () => lenis.stop(), start: () => lenis.start(), lenis };
}

function nativeScrollTo(target) {
  const el = typeof target === 'number' ? null : target;
  if (el) el.scrollIntoView({ behavior: 'smooth' });
  else scrollTo({ top: target, behavior: 'smooth' });
}
