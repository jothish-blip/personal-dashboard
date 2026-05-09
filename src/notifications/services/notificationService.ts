// src/notifications/notificationService.ts

export const NotificationService = {
  /**
   * Request permission from the user
   */
  async requestPermission() {
    if (!("Notification" in window)) return false;
    const permission = await Notification.requestPermission();
    return permission === "granted";
  },

  /**
   * Trigger a Browser/OS level notification via Service Worker
   */
  async sendBrowserNotification(title: string, body: string, module: string) {
    if (Notification.permission !== "granted") {
      const granted = await this.requestPermission();
      if (!granted) return;
    }

    // Try sending through Service Worker for better background/mobile support
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.ready;
      registration.active?.postMessage({
        type: "SHOW_FOCUS_NOTIFICATION", // We reuse the SW listener we built
        title: `${module.toUpperCase()}: ${title}`,
        body: body,
      });
    } else {
      // Fallback for standard desktop browsers
      new Notification(title, { body, icon: "/favicon.ico" });
    }

    // Physical Feedback
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
  }
};