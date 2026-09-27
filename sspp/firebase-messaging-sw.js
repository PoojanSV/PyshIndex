/**
 * Firebase Cloud Messaging Service Worker
 * Shree Shyam Boys PG — Push Notifications
 *
 * Handles notifications in ALL states:
 *   ✅ App is open (foreground)      → handled by firebase-db.js onMessage()
 *   ✅ App tab is closed/background  → handled by onBackgroundMessage() below
 *   ✅ Chrome is completely closed   → handled by native 'push' event below
 *
 * MUST be at the root (same folder as index.html) for full scope.
 */

importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyBykGMuY03LvlaOcRw7Zjh74Vx_5szl3ag",
  authDomain: "sspg-61c4c.firebaseapp.com",
  projectId: "sspg-61c4c",
  storageBucket: "sspg-61c4c.firebasestorage.app",
  messagingSenderId: "772639618703",
  appId: "1:772639618703:web:79aa38bc39bc462bf0a2fa",
  measurementId: "G-BM7LQN0Y5X",
  databaseURL: "https://sspg-61c4c-default-rtdb.firebaseio.com"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// ─────────────────────────────────────────────────────────────
//  CASE 1: App tab closed / browser in background
//  Firebase SDK intercepts FCM push and calls this handler.
//  The SDK suppresses the default OS notification so we must
//  call showNotification() ourselves — which we do below.
// ─────────────────────────────────────────────────────────────
messaging.onBackgroundMessage(function (payload) {
  console.log('[SW] onBackgroundMessage:', payload);
  return showSSPGNotification(payload.notification || {}, payload.data || {});
});

// ─────────────────────────────────────────────────────────────
//  CASE 2: Chrome is COMPLETELY CLOSED
//  The native Service Worker 'push' event fires directly from
//  the OS push service (FCM → Google Play Services → Android).
//  Firebase's SDK does NOT intercept this — we handle it here.
//  This is what makes the phone ring even when Chrome is closed.
// ─────────────────────────────────────────────────────────────
self.addEventListener('push', function (event) {
  console.log('[SW] Native push event (Chrome closed path):', event);

  let notif = {};
  let data  = {};

  try {
    if (event.data) {
      const parsed = event.data.json();
      // FCM v1 wraps payload inside parsed.notification and parsed.data
      notif = parsed.notification || {};
      data  = parsed.data         || {};

      // Also check nested structure FCM sometimes uses
      if (!notif.title && parsed.fcmMessageId) {
        // Raw FCM v1 format
        notif = parsed.notification || {};
        data  = parsed.data || {};
      }
    }
  } catch (e) {
    console.warn('[SW] Could not parse push payload:', e);
  }

  event.waitUntil(showSSPGNotification(notif, data));
});

// ─────────────────────────────────────────────────────────────
//  Shared notification display function
// ─────────────────────────────────────────────────────────────
function showSSPGNotification(notif, data) {
  const title = notif.title || data.title || 'Shree Shyam Boys PG';
  const body  = notif.body  || data.body  || 'You have a new notification.';
  const icon  = '/logo.png';
  const badge = '/logo.png';
  const tag   = data.tag || 'sspg-notification';
  const url   = data.url || '/index.html';

  return self.registration.showNotification(title, {
    body,
    icon,
    badge,
    tag,
    data: { url },

    // ── Keeps notification on screen until user acts ──
    requireInteraction: true,
    renotify: true,

    // ── Android vibration: buzz-pause-buzz-pause-long buzz ──
    vibrate: [300, 150, 300, 150, 600],

    // ── Action buttons on the notification shade ──
    actions: [
      { action: 'open',    title: '📂 Open App' },
      { action: 'dismiss', title: '✕ Dismiss'   }
    ],

    // ── Allow sound (uses default notification sound) ──
    silent: false,

    // ── Timestamp shown on notification ──
    timestamp: Date.now()
  });
}

// ─────────────────────────────────────────────────────────────
//  Handle postMessage from web pages to trigger Android push
// ─────────────────────────────────────────────────────────────
self.addEventListener('message', function (event) {
  if (event.data && (event.data.type === 'SHOW_NOTIFICATION' || event.data.type === 'SHOW_ANDROID_NOTIFICATION')) {
    const { title, body, data } = event.data;
    event.waitUntil(showSSPGNotification({ title, body }, data || {}));
  }
});

// ─────────────────────────────────────────────────────────────
//  Handle tap on notification (opens / focuses the app)
// ─────────────────────────────────────────────────────────────
self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const url = (event.notification.data && event.notification.data.url) || '/index.html';

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(function (clientList) {
        // If the app is already open in any tab — focus it
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        // Otherwise open a fresh tab
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// ─────────────────────────────────────────────────────────────
//  Service Worker lifecycle — activate immediately
//  so updated SW takes over without waiting for page reload
// ─────────────────────────────────────────────────────────────
self.addEventListener('install',  () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());
