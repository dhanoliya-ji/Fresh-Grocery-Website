import { load, save } from './cart.js';
import { allergensOf } from './data.js';

// Visitor preferences, saved in this browser. index.html applies the visual ones before first paint.
export const prefs = Object.assign(
  { lang: 'en', text: 1, contrast: false, motion: 'system', readable: false, allergies: [] },
  load('freshly-prefs-v1', {}),
);
export const savePrefs = () => save('freshly-prefs-v1', prefs);

export const reducedMotion = () => prefs.motion === 'reduce' || matchMedia('(prefers-reduced-motion: reduce)').matches;

// allergy filter: a product is blocked when it contains anything the visitor avoids
export const blockedBy = (id) => allergensOf(id).filter((a) => prefs.allergies.includes(a));
export const isBlocked = (id) => blockedBy(id).length > 0;

// modules re-render when preferences that affect content change
export const onPrefs = (fn) => addEventListener('freshly:prefs', fn);
export const emitPrefs = () => dispatchEvent(new Event('freshly:prefs'));
