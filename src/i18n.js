import { PRODUCTS, CATEGORIES, MEALS, RECIPE, DEALS, BUNDLES, SEASONS, PRIZES } from './data.js';
import { prefs } from './prefs.js';
import { DICT, NAMES } from './i18n-dict.js';

// English, Hindi and Spanish. English strings are the keys: t('Add to basket') looks the phrase up in the
// chosen language and falls back to English. Static page text is translated in place by translateDom().
// Product descriptions, farm stories and reviews stay in English.
export const lang = ['en', 'hi', 'es'].includes(prefs.lang) ? prefs.lang : 'en';
export const locale = { en: 'en-US', hi: 'hi-IN', es: 'es-ES' }[lang];
const D = DICT[lang] || {};
const norm = (s) => s.replace(/\s+/g, ' ').trim();

export function t(s, vars) {
  let out = lang === 'en' ? s : (D[s] ?? D[norm(s)] ?? s);
  if (vars) out = out.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ''));
  return out;
}

// translate every text node and label in the static page that has a translation
export function translateDom(root = document.body) {
  document.documentElement.lang = lang;
  if (lang === 'en') return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.parentElement && !/^(SCRIPT|STYLE|TEXTAREA)$/.test(n.parentElement.tagName) && n.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const n of nodes) {
    const key = norm(n.nodeValue);
    const tr = D[key];
    if (tr) n.nodeValue = n.nodeValue.match(/^\s*/)[0] + tr + n.nodeValue.match(/\s*$/)[0];
  }
  for (const attr of ['placeholder', 'aria-label', 'title']) root.querySelectorAll(`[${attr}]`).forEach((el) => {
    const v = norm(el.getAttribute(attr));
    if (D[v]) el.setAttribute(attr, D[v]);
  });
  const title = D[document.title];
  if (title) document.title = title;
}

// names in the catalogue (the English name is kept as an alias so English searches still work)
if (lang !== 'en') {
  const N = NAMES[lang];
  const unit = (u) => u.replace(/\beach\b/, N.units.each).replace(/(\d)\s?ct\b/, `$1 ${N.units.ct}`);
  PRODUCTS.forEach((p) => {
    p.alias = p.name;
    p.name = N.products[p.id] || p.name;
    p.unit = unit(p.unit);
  });
  CATEGORIES.forEach((c) => {
    const [name, blurb] = N.cats[c.id] || [];
    c.alias = c.name;
    c.name = name || c.name;
    c.blurb = blurb || c.blurb;
  });
  MEALS.forEach((m) => (m.name = N.meals[m.id] || m.name));
  RECIPE.title = N.meals.salad || RECIPE.title;
  RECIPE.items.forEach((it, i) => (it.note = N.recipeNotes[i] || it.note));
  RECIPE.steps = N.recipeSteps || RECIPE.steps;
  DEALS.forEach((d) => (d.label = t(d.label)));
  BUNDLES.forEach((b) => (b.name = t(b.name)));
  Object.values(SEASONS).forEach((s) => {
    s.name = t(s.name);
    s.line = t(s.line);
  });
  PRIZES.forEach((p) => {
    p.label = t(p.label);
    p.short = t(p.short);
  });
}
