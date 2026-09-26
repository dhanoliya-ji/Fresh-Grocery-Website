import { load, save } from '../cart.js';

// Day / evening-market theme. The choice is remembered; 3D scenes are told so they can relight.
export function initTheme({ button, onChange }) {
  const root = document.documentElement;
  const set = (mode, persist = true) => {
    const evening = mode === 'evening';
    if (evening) root.dataset.theme = 'evening';
    else delete root.dataset.theme;
    button.setAttribute('aria-pressed', String(evening));
    button.title = evening ? 'Switch to daylight' : 'Switch to evening market';
    button.innerHTML = evening
      ? '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6"/></svg>'
      : '<svg viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', evening ? '#1b1913' : '#1f7a4d');
    if (persist) save('freshly-theme', evening ? 'evening' : 'day');
    onChange(evening);
  };
  button.addEventListener('click', () => set(root.dataset.theme === 'evening' ? 'day' : 'evening'));
  set(load('freshly-theme', 'day'), false);
  return { get evening() { return root.dataset.theme === 'evening'; } };
}
