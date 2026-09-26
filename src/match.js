import { PRODUCTS } from './data.js';

// Match free text ("2 bananas", "some eggs", "olive oil") to a product.
// Used by voice commands and the shopping list.
const NUM = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, couple: 2, few: 3, dos: 2, tres: 3, cuatro: 4, uno: 1, una: 1, 'एक': 1, 'दो': 2, 'तीन': 3, 'चार': 4, 'पांच': 5 };
const stem = (s) => s.replace(/(ies)$/, 'y').replace(/(es|s)$/, '');

export function findProduct(words) {
  const w = words.toLowerCase().replace(/[^\p{L}\p{M}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
  if (!w) return null;
  const ws = w.split(' ').map(stem).filter((x) => x.length > 1 && !['of', 'some', 'the', 'fresh', 'de', 'la', 'el', 'los', 'las', 'unos', 'unas'].includes(x));
  let best = null, score = 0;
  for (const p of PRODUCTS) {
    const hay = `${p.name} ${p.id} ${p.alias || ''}`.toLowerCase();
    const s = ws.reduce((n, x) => n + (hay.includes(x) ? x.length : 0), 0);
    if (s > score) {
      score = s;
      best = p;
    }
  }
  return score >= 3 ? best : null;
}

// "2 bananas" -> { qty: 2, text: 'bananas' }
export function parseQty(text) {
  const t = text.trim().toLowerCase();
  const m = t.match(/^(\d+|[\p{L}]+)\s*(?:x\s+|×\s*)?(.*)$/u);
  if (m) {
    const n = /^\d+$/.test(m[1]) ? Number(m[1]) : NUM[m[1]];
    if (n && m[2]) return { qty: Math.min(20, n), text: m[2].replace(/^of\s+/, '') };
  }
  return { qty: 1, text: t };
}
