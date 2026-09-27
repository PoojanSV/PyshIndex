/**
 * Firebase Cloud Messaging & Web Push Service Worker
 * Shree Shyam Boys PG — Native Android Push Notifications
 *
 * Runs 100% in the browser background via Google Chrome on Android.
 * Generates REAL Android OS system notifications (Notification Center & Heads-Up).
 * Zero billing details required • Zero external APK compilation.
 */

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

// ─────────────────────────────────────────────────────────────
//  Safely initialize Firebase Compat Messaging if network allows
//  Wrapped in try/catch so SW NEVER fails to install/activate
// ─────────────────────────────────────────────────────────────
let messaging = null;
try {
  importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');
  if (typeof firebase !== 'undefined' && firebase.initializeApp) {
    firebase.initializeApp(firebaseConfig);
    messaging = firebase.messaging();
    messaging.onBackgroundMessage(function (payload) {
      console.log('[SW] Firebase background push received:', payload);
      return showSSPGNotification(payload.notification || {}, payload.data || {});
    });
  }
} catch (e) {
  console.log('[SW] Optional Firebase SDK init skipped in SW:', e.message);
}

// ─────────────────────────────────────────────────────────────
//  Core Native Push Event (FCM / Web Push / Android Push)
//  Fires directly from Android OS / Google Play Services
// ─────────────────────────────────────────────────────────────
self.addEventListener('push', function (event) {
  console.log('[SW] Push event received:', event);

  let notif = {};
  let data  = {};

  if (event.data) {
    try {
      const parsed = event.data.json();
      notif = parsed.notification || {};
      data  = parsed.data || {};

      if (!notif.title && parsed.title) {
        notif = { title: parsed.title, body: parsed.body };
      }
    } catch (e) {
      const text = event.data.text();
      notif = { title: 'Shree Shyam Boys PG', body: text };
    }
  }

  event.waitUntil(showSSPGNotification(notif, data));
});

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
//  Real Android System Notification Display
// ─────────────────────────────────────────────────────────────
function showSSPGNotification(notif, data) {
  notif = notif || {};
  data  = data  || {};

  const title  = notif.title || data.title || 'Shree Shyam Boys PG';
  const body   = notif.body  || data.body  || 'You have a new alert.';
  const origin = self.location.origin;
  const icon   = origin + '/logo.png';
  const badge  = origin + '/logo.png';
  const tag    = data.tag || ('sspg-notif-' + Date.now());
  const url    = data.url || '/index.html';

  const fullOptions = {
    body: body,
    icon: icon,
    badge: badge,
    tag: tag,
    data: { url: url },
    renotify: true,
    requireInteraction: true,
    vibrate: [300, 150, 300, 150, 450],
    actions: [
      { action: 'open', title: 'Open App' }
    ]
  };

  return self.registration.showNotification(title, fullOptions).catch(function (err) {
    console.warn('[SW] Full showNotification failed, retrying basic:', err);
    return self.registration.showNotification(title, {
      body: body,
      icon: icon,
      tag: tag,
      data: { url: url }
    });
  });
}

// ─────────────────────────────────────────────────────────────
//  Notification Click Handler — opens or focuses the app tab
// ─────────────────────────────────────────────────────────────
self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const url = (event.notification.data && event.notification.data.url) || '/index.html';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          if ('navigate' in client) client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// ─────────────────────────────────────────────────────────────
//  Service Worker Lifecycle: Activate Immediately
// ─────────────────────────────────────────────────────────────
self.addEventListener('install', function (event) {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim());
});
