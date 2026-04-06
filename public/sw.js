// public/sw.js

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// 🔔 Listen for immediate display commands from the React App
self.addEventListener("message", (event) => {
  if (event.data?.type === "SHOW_FOCUS_NOTIFICATION") {
    const title = event.data.title || "Focus Complete 🎉";
    const options = {
      body: event.data.body || "Your session has ended. Take a break!",
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      vibrate: [300, 100, 300, 100, 300],
      tag: "focus-session-notification",
      renotify: true,
      requireInteraction: true,
      // ✅ ADDED: Native Action Buttons
      actions: [
        { action: "open", title: "🚀 Open Focus" },
        { action: "dismiss", title: "Close" }
      ]
    };

    event.waitUntil(self.registration.showNotification(title, options));
  }
});

// 🔔 Handle user clicking the notification or actions
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  // If user clicked the "dismiss" button, just exit
  if (event.action === "dismiss") return;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsArr) => {
      // If a tab is already open, focus it
      for (const client of clientsArr) {
        if (client.url.includes("/focus") && "focus" in client) {
          return client.focus();
        }
      }
      // Otherwise open the focus page
      return clients.openWindow("/focus");
    })
  );
});