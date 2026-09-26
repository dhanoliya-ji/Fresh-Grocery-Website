import { ALLERGEN_TYPES } from '../data.js';
import { prefs, savePrefs, emitPrefs } from '../prefs.js';

// Preferences panel: language, display & accessibility, allergy filter and "install as an app".
// Language and motion need a fresh start of the page; everything else applies instantly.
const LANGS = [
  ['en', 'English', 'EN'],
  ['hi', 'हिन्दी', 'हि'],
  ['es', 'Español', 'ES'],
];

export function initSettings({ app, modal, openers, theme, pwa }) {
  const { t } = app;
  const $ = (q) => modal.querySelector(q);
  const root = document.documentElement;

  $('#pfLang').innerHTML = LANGS.map(([id, name]) => `<button data-lang="${id}" lang="${id}"><b>${name}</b></button>`).join('');
  $('#pfText').innerHTML = [[1, 'A'], [1.12, 'A+'], [1.25, 'A++']].map(([v, l]) => `<button data-text="${v}" style="font-size:${0.85 * v}rem" aria-label="${t('Text size')} ${l}">${l}</button>`).join('');
  $('#pfAllergy').innerHTML = ALLERGEN_TYPES.map((a) => `<button data-allergy="${a.id}" aria-pressed="false"><span>${a.icon}</span>${t(a.name)}</button>`).join('');

  function sync() {
    modal.querySelectorAll('[data-lang]').forEach((b) => b.classList.toggle('on', b.dataset.lang === prefs.lang));
    modal.querySelectorAll('[data-text]').forEach((b) => b.classList.toggle('on', +b.dataset.text === prefs.text));
    modal.querySelectorAll('[data-allergy]').forEach((b) => {
      const on = prefs.allergies.includes(b.dataset.allergy);
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', String(on));
    });
    $('#pfContrast').checked = prefs.contrast;
    $('#pfReadable').checked = prefs.readable;
    $('#pfMotion').checked = prefs.motion === 'reduce';
    $('#pfTheme').checked = theme.evening;
    const n = prefs.allergies.length;
    document.querySelectorAll('.allergy-count').forEach((el) => (el.textContent = n ? String(n) : ''));
    document.querySelectorAll('[data-open-prefs="allergies"]').forEach((el) => el.classList.toggle('on', n > 0));
    // install row
    const st = pwa.status();
    $('#pfInstall').hidden = st !== 'ready';
    $('#pfInstalled').hidden = st !== 'installed';
    $('#pfIos').hidden = st !== 'ios';
    $('#pfOffline').innerHTML = pwa.offlineReady() ? `✓ ${t('Saved for offline use')}` : t('Visit once online and it will work offline too.');
  }

  function applyVisual() {
    root.style.setProperty('--text', prefs.text);
    root.classList.toggle('hc', prefs.contrast);
    root.classList.toggle('readable', prefs.readable);
    if (prefs.readable && !document.getElementById('readableFont')) {
      const l = document.createElement('link');
      l.id = 'readableFont';
      l.rel = 'stylesheet';
      l.href = 'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&display=swap';
      document.head.appendChild(l);
    }
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.closest('[data-close]')) return close();
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.lang && b.dataset.lang !== prefs.lang) {
      prefs.lang = b.dataset.lang;
      savePrefs();
      location.reload();
      return;
    }
    if (b.dataset.text) {
      prefs.text = +b.dataset.text;
      savePrefs();
      applyVisual();
    }
    if (b.dataset.allergy) {
      const a = b.dataset.allergy;
      prefs.allergies = prefs.allergies.includes(a) ? prefs.allergies.filter((x) => x !== a) : [...prefs.allergies, a];
      savePrefs();
      emitPrefs();
      app.toast(prefs.allergies.length ? t('Hiding products with: {list}', { list: prefs.allergies.map((x) => t(ALLERGEN_TYPES.find((y) => y.id === x).name)).join(', ') }) : t('Showing all products again'), null, 'allergy');
    }
    if (b.id === 'pfInstallBtn') pwa.install();
    sync();
  });
  modal.addEventListener('change', (e) => {
    const id = e.target.id;
    if (id === 'pfContrast') prefs.contrast = e.target.checked;
    if (id === 'pfReadable') prefs.readable = e.target.checked;
    if (id === 'pfTheme') return theme.toggle();
    if (id === 'pfMotion') {
      prefs.motion = e.target.checked ? 'reduce' : 'system';
      savePrefs();
      location.reload();
      return;
    }
    savePrefs();
    applyVisual();
    sync();
  });

  function open(section) {
    sync();
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    if (section) modal.querySelector(`[data-sec="${section}"]`)?.scrollIntoView({ block: 'center' });
  }
  function close() {
    modal.hidden = true;
    document.body.style.overflow = '';
  }
  document.addEventListener('click', (e) => {
    const o = e.target.closest('[data-open-prefs]');
    if (o) open(o.dataset.openPrefs);
  });
  openers.forEach((b) => b.addEventListener('click', () => open()));
  addEventListener('freshly:pwa', sync);
  applyVisual();
  sync();
  return { open, close, sync };
}
