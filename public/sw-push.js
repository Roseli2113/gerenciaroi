// Combined Service Worker: Push Notifications + Offline Caching
// This handles Web Push events in the background

// Push notification received
self.addEventListener('push', (event) => {
  console.log('[SW] Push event received');
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: 'Gerencia ROI', body: event.data.text() };
  }

  const title = data.title || '💰 Nova Venda!';
  const options = {
    body: data.body || 'Você recebeu uma nova venda!',
    icon: '/pwa-192.png',
    badge: '/pwa-192.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'sale-notification',
    renotify: true,
    requireInteraction: true,
    silent: true, // Suppress default system sound so only our MP3 plays
    data: {
      url: data.url || '/',
    },
  };

  event.waitUntil(
    self.registration.showNotification(title, options).then(() => {
      // Use BroadcastChannel to reach ALL tabs regardless of SW scope
      const bc = new BroadcastChannel('sale-sound-channel');
      bc.postMessage({ type: 'PLAY_SALE_SOUND', sale: data });
      bc.close();
    })
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  event.notification.close();

  const urlPath = event.notification.data?.url || '/';
  // Open the app at the specified path
  event.waitUntil(clients.openWindow(urlPath));
});

// Activate immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});
