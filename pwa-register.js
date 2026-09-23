(() => {
  'use strict';
  if (!('serviceWorker' in navigator)) return;
  const current = document.currentScript;
  const scriptUrl = current && current.src ? new URL(current.src) : new URL('./pwa-register.js', location.href);
  const swUrl = new URL('./sw.js', scriptUrl);
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(swUrl.href, { updateViaCache: 'none' }).catch((err) => {
      console.warn('[晩夏 PWA] Service Worker registration failed:', err);
    });
  }, { once: true });
})();
