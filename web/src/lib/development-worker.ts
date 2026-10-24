// Run before hydration: an installed PWA must not serve mutable Next dev bundles.
export function developmentWorkerCleanup(scriptPath: string) {
  return `(async () => {
    if (!('serviceWorker' in navigator)) return;
    const workerURL = new URL(${JSON.stringify(scriptPath)}, location.origin).href;
    const registrations = await navigator.serviceWorker.getRegistrations();
    const own = registrations.filter(r => [r.active, r.waiting, r.installing].some(w => w?.scriptURL === workerURL));
    if (!own.length) return;
    const controlled = navigator.serviceWorker.controller?.scriptURL === workerURL;
    await Promise.all(own.map(r => r.unregister()));
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('tajwidlens-pwa-')).map(key => caches.delete(key)));
    if (controlled) location.reload();
  })().catch(() => {});`;
}
