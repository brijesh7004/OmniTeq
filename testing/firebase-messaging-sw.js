/* ============================================================
   Firebase Cloud Messaging — background service worker.

   Runs even when the dashboard tab is closed or the browser is
   in the background (Android/Chrome). Receives DATA-ONLY messages
   from the Cloud Function and shows a system notification.

   MUST live at the web root and be named exactly
   "firebase-messaging-sw.js".
   ============================================================ */

importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");
importScripts("firebase-config.js");

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// The Cloud Function sends data-only messages, so we build the
// notification here. This avoids the browser auto-showing a second
// banner (which happens with "notification" payloads).
messaging.onBackgroundMessage((payload) => {
  const data = payload.data || {};
  const title = data.title || "જટકા મશીન";
  const options = {
    body: data.body || "",
    icon: "icon-192.png",
    badge: "icon-192.png",
    tag: data.tag || "jatka-status",
    renotify: true,
    data: { url: data.url || "/" }
  };
  return self.registration.showNotification(title, options);
});

// Focus/open the dashboard when the notification is tapped.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      for (const win of wins) {
        if ("focus" in win) return win.focus();
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});
