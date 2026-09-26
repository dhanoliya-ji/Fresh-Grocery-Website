import { byId, STORE } from './data.js';

// Cart + wishlist, saved in this browser (localStorage).
const KEY = 'freshly-cart-v1';
const WKEY = 'freshly-wish-v1';
const load = (k, d) => {
  try {
    return JSON.parse(localStorage.getItem(k)) ?? d;
  } catch {
    return d;
  }
};
const save = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* private mode */
  }
};

export const cart = {
  lines: load(KEY, {}), // id -> qty
  wish: new Set(load(WKEY, [])),
  listeners: [],
  on(fn) {
    this.listeners.push(fn);
  },
  emit(e) {
    save(KEY, this.lines);
    save(WKEY, [...this.wish]);
    for (const fn of this.listeners) fn(e);
  },
  qty(id) {
    return this.lines[id] || 0;
  },
  add(id, n = 1) {
    if (!byId[id]) return;
    this.lines[id] = Math.min(99, this.qty(id) + n);
    this.emit({ type: 'add', id, n });
  },
  set(id, n) {
    if (n <= 0) delete this.lines[id];
    else this.lines[id] = Math.min(99, n);
    this.emit({ type: 'set', id, n });
  },
  clear() {
    this.lines = {};
    this.emit({ type: 'clear' });
  },
  toggleWish(id) {
    if (this.wish.has(id)) this.wish.delete(id);
    else this.wish.add(id);
    this.emit({ type: 'wish', id });
  },
  get items() {
    return Object.entries(this.lines)
      .filter(([id]) => byId[id])
      .map(([id, q]) => ({ p: byId[id], q }));
  },
  get count() {
    return this.items.reduce((s, l) => s + l.q, 0);
  },
  get subtotal() {
    return this.items.reduce((s, l) => s + l.p.price * l.q, 0);
  },
  get delivery() {
    return this.subtotal >= STORE.freeDeliveryOver || this.subtotal === 0 ? 0 : STORE.deliveryFee;
  },
  get total() {
    return this.subtotal === 0 ? 0 : this.subtotal + this.delivery + STORE.serviceFee;
  },
};

export const money = (v) => `$${v.toFixed(2)}`;
