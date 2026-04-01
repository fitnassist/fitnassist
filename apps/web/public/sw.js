// Service Worker for Web Push Notifications

self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const options = {
      body: data.body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: {
        link: data.link || '/dashboard',
      },
      tag: data.type || 'notification',
      renotify: true,
    };

    event.waitUntil(self.registration.showNotification(data.title, options));
  } catch {
    // Ignore malformed push events
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const link = event.notification.data?.link || '/dashboard';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Focus existing window if available
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(link);
          return client.focus();
        }
      }
      // Otherwise open new window
      return self.clients.openWindow(link);
    })
  );
});
