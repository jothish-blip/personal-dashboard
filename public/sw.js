// public/sw.js

// 1. Force immediate takeover on install
self.addEventListener("install", (event) => {
  console.log("[NexSW] Installing Service Worker...");
  self.skipWaiting();
});

// 2. Claim all clients immediately on activation
self.addEventListener("activate", (event) => {
  console.log("[NexSW] Activated and claiming clients.");
  event.waitUntil(self.clients.claim());
});

/**
 * 🔔 SHOW_NOTIFICATION COMMAND
 */
self.addEventListener("message", (event) => {
  console.log("[NexSW] Message received:", event.data);

  if (event.data?.type === "SHOW_NOTIFICATION") {
    const { title, body, url: targetUrl } = event.data;

    // Smart tag: ensures only one notification per specific topic exists
    const smartTag = (title || "Alert").replace(/\s+/g, "-").toLowerCase();

    // Dynamic Action Labels
    let openLabel = "🚀 Open App";
    if (targetUrl.includes("/focus")) openLabel = "🔥 Resume Focus";
    else if (targetUrl.includes("/calender-event")) openLabel = "📅 Open Planner";
    else if (targetUrl.includes("/diary")) openLabel = "📓 Open Diary";
    else if (targetUrl.includes("/mini-nisc")) openLabel = "🧠 Open Workspace";
    else if (targetUrl === "/") openLabel = "📊 Open Dashboard";

    const isCritical = title.includes("Alert") || title.includes("Missed") || title.includes("Pressure");

    const options = {
      body: body || "System update available.",
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      vibrate: [200, 100, 200],
      tag: `nextask-${smartTag}`,
      renotify: true,
      requireInteraction: isCritical, 
      timestamp: Date.now(), 
      data: {
        url: targetUrl || "/",
      },
      actions: [
        { action: "open", title: openLabel },
        { action: "snooze", title: "⏰ Snooze (10m)" },
        { action: "dismiss", title: "Dismiss" },
      ],
    };

    event.waitUntil(
      self.registration.showNotification(title || "NexTask", options)
        .then(() => console.log("[NexSW] Notification displayed successfully."))
        .catch(err => console.error("[NexSW] Failed to show notification:", err))
    );
  }
});

/**
 * 🔔 NOTIFICATION INTERACTION HANDLER
 */
self.addEventListener("notificationclick", (event) => {
  console.log("[NexSW] Notification clicked. Action:", event.action);
  event.notification.close();

  // 1. Snooze Logic
  if (event.action === "snooze") {
    const snoozeTitle = `Re: ${event.notification.title}`;
    const snoozeBody = event.notification.body;
    const snoozeData = event.notification.data;

    event.waitUntil(
      new Promise((resolve) => {
        setTimeout(() => {
          self.registration.showNotification(snoozeTitle, {
            body: snoozeBody,
            icon: "/favicon.ico",
            badge: "/favicon.ico",
            data: snoozeData,
            timestamp: Date.now(),
            actions: [
              { action: "open", title: "🚀 Open Now" },
              { action: "dismiss", title: "Dismiss" }
            ]
          });
          resolve();
        }, 10 * 60 * 1000); // 10 Minutes
      })
    );
    return;
  }

  if (event.action === "dismiss") return;

  // 2. Navigation Logic
  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsArr) => {
      // Logic: Try to find an existing tab and focus it, otherwise open new
      for (const client of clientsArr) {
        if (client.url.includes(self.registration.scope) && "focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      return clients.openWindow(targetUrl);
    })
  );
});