// Service Worker: Push Notifications
// Handles Web Push events in the background

// Push notification received
self.addEventListener('push', (event) => {
  console.log('[SW-Push] Push event received');
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: 'Gerencia ROI', body: event.data.text() };
  }

  event.waitUntil(
    (async () => {
      // Check if any app window is currently focused/visible
      const allClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });
      
      // Serialize repeated deliveries and remember sale tags across worker restarts.
      if (data.tag?.startsWith('sale-') && data.tag !== 'sale-notification') {
        const cache = await caches.open('sale-notifications-v1');
        const key = new URL(`/__sale-notified/${encodeURIComponent(data.tag)}`, self.location.origin).href;
        if (await cache.match(key)) return;
        await cache.put(key, new Response('1'));
      }

      const visibleClient = allClients.find(client => client.visibilityState === 'visible' && client.focused)
        || allClients.find(client => client.visibilityState === 'visible');
      if (visibleClient) {
        visibleClient.postMessage({ type: 'PLAY_SALE_SOUND', sale: data });
        return;
      }

      // In the background the system notification is the only alert.
      const title = data.title || '💰 Nova Venda!';
      const options = {
        body: data.body || 'Você recebeu uma nova venda!',
        icon: '/pwa-192.png',
        badge: '/pwa-192.png',
        vibrate: [200, 100, 200],
        tag: data.tag || `sale-${Date.now()}`,
        renotify: false,
        silent: true,
        requireInteraction: true,
        persistent: true,
        sticky: true,
        data: {
          url: data.url || '/',
        },
      };

      await self.registration.showNotification(title, options);
    })()
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW-Push] Notification clicked');
  event.notification.close();

  const urlPath = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Focus existing tab if available
      for (const client of clients) {
        if (client.url.includes(urlPath) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open new window
      return self.clients.openWindow(urlPath);
    })
  );
});

// Activate immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
