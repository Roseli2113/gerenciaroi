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
    data: {
      url: data.url || '/',
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});

// Activate immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});
