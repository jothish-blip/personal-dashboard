// public/sw.js

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

/**
 * 🔔 SHOW_NOTIFICATION COMMAND
 * Listens for commands from the React App (via useNotificationSystem)
 */
self.addEventListener("message", (event) => {
  if (event.data?.type === "SHOW_NOTIFICATION") {
    const { title, body, url: targetUrl } = event.data;

    // 🧠 Smart tag: ensures only one notification per specific topic exists at a time
    const smartTag = (title || "Alert").replace(/\s+/g, "-").toLowerCase();

    // 🚀 Dynamic Action Labels (UX Polish)
    let openLabel = "🚀 Open App";
    if (targetUrl.includes("/focus")) openLabel = "🔥 Resume Focus";
    else if (targetUrl.includes("/calender-event")) openLabel = "📅 Open Planner";
    else if (targetUrl.includes("/diary")) openLabel = "📓 Open Diary";
    else if (targetUrl.includes("/mini-nisc")) openLabel = "🧠 Open Workspace";
    else if (targetUrl === "/") openLabel = "📊 Open Dashboard";

    // 🔧 Improvement 2: Dynamic Interaction
    // Only "sticky" if it's a critical alert or missed event
    const isCritical = title.includes("Alert") || title.includes("Missed") || title.includes("Pressure");

    const options = {
      body: body || "System notification.",
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      vibrate: [200, 100, 200],
      tag: `nextask-${smartTag}`,
      renotify: true,
      
      // 🔧 Improvement 2 Implementation
      requireInteraction: isCritical, 
      
      // 🔧 Improvement 3: Timestamp for OS sorting
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

    event.waitUntil(self.registration.showNotification(title || "NexTask", options));
  }
});

/**
 * 🔔 NOTIFICATION INTERACTION HANDLER
 */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  // 1. 🔧 Improvement 1: Reliable Snooze via event.waitUntil()
  if (event.action === "snooze") {
    const snoozeTitle = `Re: ${event.notification.title}`;
    const snoozeBody = event.notification.body;
    const snoozeData = event.notification.data;

    // We wrap the timeout in waitUntil to tell the browser: 
    // "Don't kill this Service Worker yet, I have a task to finish."
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
          resolve(); // Resolve promise so SW can finally rest
        }, 10 * 60 * 1000); // 10 Minutes
      })
    );
    return;
  }

  // 2. Handle Dismiss
  if (event.action === "dismiss") return;

  // 3. Handle Navigation (Open Action or Body Click)
  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsArr) => {
      // If a tab is already open, focus it and navigate
      for (const client of clientsArr) {
        if (client.url.includes(self.registration.scope) && "focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // If no tab is open, open a new one
      return clients.openWindow(targetUrl);
    })
  );
});