import { byId, STORE } from './data.js';

// Cart, wishlist, promo and order history, saved in this browser (localStorage).
const KEY = 'freshly-cart-v1';
const WKEY = 'freshly-wish-v1';
const PKEY = 'freshly-promo-v1';
const OKEY = 'freshly-orders-v1';
const VKEY = 'freshly-viewed-v1';
export const load = (k, d) => {
  try {
    return JSON.parse(localStorage.getItem(k)) ?? d;
  } catch {
    return d;
  }
};
export const save = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* private mode */
  }
};
const cents = (v) => Math.round(v * 100) / 100;

export const cart = {
  lines: load(KEY, {}), // id -> qty
  wish: new Set(load(WKEY, [])),
  // one promo at a time (wheel prize or newsletter code) + a per-order scratch-card bonus
  promo: load(PKEY, null), // { label, type: 'pct' | 'amt' | 'ship' | 'item', value, id }
  bonus: 0,
  orders: load(OKEY, []), // newest first: { num, items: [[id, q]], total, placed, when, street }
  viewed: load(VKEY, []),
  listeners: [],
  on(fn) {
    this.listeners.push(fn);
  },
  emit(e) {
    save(KEY, this.lines);
    save(WKEY, [...this.wish]);
    save(PKEY, this.promo);
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
    this.bonus = 0;
    this.emit({ type: 'clear' });
  },
  toggleWish(id) {
    if (this.wish.has(id)) this.wish.delete(id);
    else this.wish.add(id);
    this.emit({ type: 'wish', id });
  },
  setPromo(p) {
    this.promo = p;
    if (p?.type === 'item' && !this.qty(p.id)) this.lines[p.id] = 1;
    this.emit({ type: 'promo' });
  },
  setBonus(v) {
    this.bonus = v;
    this.emit({ type: 'promo' });
  },
  view(id) {
    this.viewed = [id, ...this.viewed.filter((x) => x !== id)].slice(0, 12);
    save(VKEY, this.viewed);
  },
  placeOrder(extra) {
    const o = { num: `FR-${Math.floor(100000 + Math.random() * 900000)}`, items: this.items.map(({ p, q }) => [p.id, q]), total: this.total, placed: Date.now(), ...extra };
    this.orders = [o, ...this.orders].slice(0, 10);
    save(OKEY, this.orders);
    // a used promo is spent
    this.promo = null;
    this.clear();
    return o;
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
    return cents(this.items.reduce((s, l) => s + l.p.price * l.q, 0));
  },
  get discount() {
    const s = this.subtotal;
    if (!s) return 0;
    const p = this.promo;
    let d = 0;
    if (p?.type === 'pct') d = (s * p.value) / 100;
    else if (p?.type === 'amt') d = p.value;
    else if (p?.type === 'item') d = this.qty(p.id) ? byId[p.id].price : 0;
    return cents(Math.min(s, d + this.bonus));
  },
  get delivery() {
    if (this.subtotal === 0 || this.promo?.type === 'ship') return 0;
    return this.subtotal >= STORE.freeDeliveryOver ? 0 : STORE.deliveryFee;
  },
  get total() {
    return this.subtotal === 0 ? 0 : cents(this.subtotal - this.discount + this.delivery + STORE.serviceFee);
  },
};

export const money = (v) => `$${v.toFixed(2)}`;
