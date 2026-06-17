// public/sw.js

const SW_VERSION = "nexspace-v2";

/**

* INSTALL
  */
  self.addEventListener("install", () => {
  self.skipWaiting();
  });

/**

* ACTIVATE
  */
  self.addEventListener("activate", (event) => {
  event.waitUntil(
  Promise.all([
  self.clients.claim(),
  ])
  );
  });

/**

* SHOW NOTIFICATION
  */
  self.addEventListener("message", (event) => {
  try {
  if (event.data?.type !== "SHOW_NOTIFICATION") return;

  const title = event.data.title || "NexSpace";
  const body = event.data.body || "System update available.";
  const targetUrl = event.data.url || "/";

  const smartTag = title
  .replace(/\s+/g, "-")
  .toLowerCase();

  let openLabel = "🚀 Open App";

  if (targetUrl.includes("/focus")) {
  openLabel = "🔥 Resume Focus";
  } else if (targetUrl.includes("/planner")) {
  openLabel = "📅 Open Planner";
  } else if (targetUrl.includes("/diary")) {
  openLabel = "📓 Open Diary";
  } else if (targetUrl.includes("/workspace")) {
  openLabel = "🧠 Open Workspace";
  } else if (targetUrl === "/") {
  openLabel = "📊 Open Dashboard";
  }

  const isCritical =
  title.includes("Alert") ||
  title.includes("Missed") ||
  title.includes("Pressure");

  event.waitUntil(
  self.registration.showNotification(title, {
  body,
  icon: "/favicon.ico",
  badge: "/favicon.ico",

   tag: `nexspace-${smartTag}`,
   renotify: true,

   requireInteraction: isCritical,

   vibrate: isCritical
     ? [200, 100, 200]
     : [100],

   timestamp: Date.now(),

   data: {
     url: targetUrl,
     version: SW_VERSION,
   },

   actions: [
     {
       action: "open",
       title: openLabel,
     },
     {
       action: "dismiss",
       title: "Dismiss",
     },
   ],

  })
  );
  } catch (error) {
  console.error("[SW] Notification Error:", error);
  }
  });

/**

* NOTIFICATION CLICK
  */
  self.addEventListener("notificationclick", (event) => {
  event.notification.close();

if (event.action === "dismiss") {
return;
}

const targetUrl =
event.notification.data?.url || "/";

event.waitUntil(
clients
.matchAll({
type: "window",
includeUncontrolled: true,
})
.then(async (windowClients) => {
for (const client of windowClients) {
if ("focus" in client) {
try {
await client.navigate(targetUrl);
return client.focus();
} catch {
return client.focus();
}
}
}
    return clients.openWindow(targetUrl);
  })

);
});
