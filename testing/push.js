/* ============================================================
   Push notifications (Android/Chrome) via Firebase Cloud Messaging.

   - Registers the background service worker.
   - Asks the user for notification permission (via the button in
     the header).
   - Gets an FCM token and stores it in the Realtime Database under
     /fcmTokens/<token> so the Cloud Function knows where to send.
   - Shows a foreground banner when a push arrives while the tab is
     open (the Cloud Function sends data-only messages).

   Depends on firebase-config.js and the Firebase compat SDKs loaded
   in index.html.
   ============================================================ */

let messaging = null;

const notifyBtn = document.getElementById("enableNotifyBtn");

function setNotifyButton(state) {
  if (!notifyBtn) return;
  if (state === "granted") {
    notifyBtn.textContent = "🔔 Notifications On";
    notifyBtn.disabled = true;
  } else if (state === "denied") {
    notifyBtn.textContent = "🔕 Blocked";
    notifyBtn.disabled = true;
  } else {
    notifyBtn.textContent = "🔔 Enable Notifications";
    notifyBtn.disabled = false;
  }
}

// Save the token so the Cloud Function can target this browser.
// Key = token itself (so re-registering the same device is idempotent).
async function saveToken(token) {
  const url = firebaseConfig.databaseURL + "/fcmTokens/" + encodeURIComponent(token) + ".json";
  try {
    await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(true)
    });
  } catch (err) {
    console.error("Could not save FCM token:", err);
  }
}

async function initPush() {
  if (!("serviceWorker" in navigator) || !("Notification" in window)) {
    console.warn("Push not supported in this browser.");
    if (notifyBtn) notifyBtn.style.display = "none";
    return;
  }

  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  messaging = firebase.messaging();

  // Foreground: the SW doesn't run onBackgroundMessage while the tab
  // is focused, so show the banner here.
  messaging.onMessage((payload) => {
    const data = payload.data || {};
    if (Notification.permission === "granted") {
      new Notification(data.title || "જટકા મશીન", {
        body: data.body || "",
        icon: "icon-192.png",
        tag: data.tag || "jatka-status",
        renotify: true
      });
    }
  });

  setNotifyButton(Notification.permission);

  // If already granted from a previous visit, refresh the token silently.
  if (Notification.permission === "granted") {
    registerForPush();
  }
}

async function registerForPush() {
  try {
    const registration = await navigator.serviceWorker.register("firebase-messaging-sw.js");
    const permission = await Notification.requestPermission();
    setNotifyButton(permission);
    if (permission !== "granted") return;

    const token = await messaging.getToken({
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration
    });

    if (token) {
      await saveToken(token);
      console.log("FCM token registered.");
    } else {
      console.warn("No FCM token returned.");
    }
  } catch (err) {
    console.error("Push registration failed:", err);
  }
}

if (notifyBtn) {
  notifyBtn.addEventListener("click", registerForPush);
}

initPush();
