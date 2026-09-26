// Offline + installable: registers the service worker (production builds only), warms the image cache
// so the whole store works without a connection, and handles the browser's "install app" prompt.
export function initPWA({ app, urls }) {
  const { t } = app;
  let deferred = null;
  let offlineReady = false;
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !standalone;
  const ping = () => dispatchEvent(new Event('freshly:pwa'));

  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    navigator.serviceWorker
      .register(`${app.BASE}sw.js`)
      .then(() => navigator.serviceWorker.ready)
      .then((reg) => {
        // give the first paint priority, then quietly cache every product photo
        setTimeout(() => reg.active?.postMessage({ type: 'warm', urls }), 5000);
      })
      .catch(() => {});
    navigator.serviceWorker.addEventListener('message', (e) => {
      if (e.data?.type === 'warmed') {
        offlineReady = true;
        ping();
      }
    });
    caches?.has?.('freshly-warm').then((has) => {
      offlineReady = has;
      ping();
    });
  }

  addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e;
    document.documentElement.classList.add('can-install');
    ping();
  });
  addEventListener('appinstalled', () => {
    deferred = null;
    document.documentElement.classList.remove('can-install');
    app.toast(t('🎉 Freshly is installed. Find it on your home screen.'));
    ping();
  });

  const setNet = () => {
    document.documentElement.classList.toggle('is-offline', !navigator.onLine);
  };
  addEventListener('offline', () => {
    setNet();
    app.toast(t('📴 You’re offline. You can keep browsing; orders will wait for a connection.'));
  });
  addEventListener('online', () => {
    setNet();
    app.toast(t('✅ Back online'));
  });
  setNet();

  return {
    status: () => (standalone ? 'installed' : deferred ? 'ready' : ios ? 'ios' : 'none'),
    offlineReady: () => offlineReady,
    async install() {
      if (!deferred) return;
      deferred.prompt();
      await deferred.userChoice;
      deferred = null;
      document.documentElement.classList.remove('can-install');
      ping();
    },
  };
}
