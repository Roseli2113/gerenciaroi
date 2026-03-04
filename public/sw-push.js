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
      
      const hasVisibleClient = allClients.some(
        (client) => client.visibilityState === 'visible'
      );

      // Always broadcast to play the custom MP3 sound in open tabs
      const bc = new BroadcastChannel('sale-sound-channel');
      bc.postMessage({ type: 'PLAY_SALE_SOUND', sale: data });
      bc.close();

      if (hasVisibleClient) {
        // App is open and visible — DON'T show system notification
        // The BroadcastChannel message above will trigger the MP3 + toast
        console.log('[SW-Push] App is visible, skipping system notification');
        return;
      }

      // App is in background — show a silent system notification
      const title = data.title || '💰 Nova Venda!';
      const options = {
        body: data.body || 'Você recebeu uma nova venda!',
        icon: '/pwa-192.png',
        badge: '/pwa-192.png',
        vibrate: [200, 100, 200],
        tag: data.tag || 'sale-notification',
        renotify: true,
        silent: true,
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
