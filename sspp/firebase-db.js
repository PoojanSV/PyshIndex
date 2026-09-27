/**
 * Shree Shyam Boys PG - Firebase Realtime Database, Auth & Cloud Messaging Layer
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

const OWNER_EMAIL = "sspg.owner@gmail.com";

/**
 * VAPID Key for Web Push (Firebase Cloud Messaging)
 * HOW TO GET THIS:
 * 1. Go to Firebase Console → Project Settings → Cloud Messaging
 * 2. Scroll to "Web configuration" → "Web Push certificates"
 * 3. Click "Generate key pair" if none exists
 * 4. Copy the "Key pair" value and replace the string below
 */
const FCM_VAPID_KEY = "BIIu5W0z3esd1gl9_HiM6rCD-itYrYubtOBUEdlVXcTmPLkiEiEAa0r0ZAdKeKPnSkNvhPOj57vXbR_lgENR85E";

// Initialize Firebase App, Auth, Database & Messaging
let app, auth, db, messaging;
try {
  if (!firebase.apps.length) {
    app = firebase.initializeApp(firebaseConfig);
  } else {
    app = firebase.app();
  }
  auth = firebase.auth();
  db = firebase.database();
  // Messaging is only available in HTTPS or localhost
  if (typeof firebase.messaging === 'function' && 'serviceWorker' in navigator) {
    try { messaging = firebase.messaging(); } catch(me) { console.warn('FCM init skipped:', me.message); }
  }
} catch (e) {
  console.error("Firebase init error:", e);
}

// Default Seed Rooms (Floors 1, 2, 3)
const DEFAULT_ROOMS = {
  "101": { roomNumber: "101", floor: "1", capacity: 2, type: "AC Double Sharing", rent: 8500 },
  "102": { roomNumber: "102", floor: "1", capacity: 2, type: "AC Double Sharing", rent: 8500 },
  "103": { roomNumber: "103", floor: "1", capacity: 3, type: "Non-AC Triple Sharing", rent: 7000 },
  "104": { roomNumber: "104", floor: "1", capacity: 1, type: "AC Single Room", rent: 12000 },
  "201": { roomNumber: "201", floor: "2", capacity: 2, type: "AC Double Sharing", rent: 8500 },
  "202": { roomNumber: "202", floor: "2", capacity: 2, type: "AC Double Sharing", rent: 8500 },
  "203": { roomNumber: "203", floor: "2", capacity: 3, type: "Non-AC Triple Sharing", rent: 7000 },
  "204": { roomNumber: "204", floor: "2", capacity: 2, type: "AC Double Sharing", rent: 8500 },
  "301": { roomNumber: "301", floor: "3", capacity: 2, type: "AC Double Sharing", rent: 8500 },
  "302": { roomNumber: "302", floor: "3", capacity: 2, type: "Non-AC Double Sharing", rent: 7500 },
  "303": { roomNumber: "303", floor: "3", capacity: 3, type: "Non-AC Triple Sharing", rent: 7000 },
  "304": { roomNumber: "304", floor: "3", capacity: 1, type: "AC Single Room", rent: 12000 }
};

// ONLY 1 GUEST IN DATABASE AS REQUESTED BY USER
const DEFAULT_GUESTS = {
  "guest_1": {
    id: "guest_1",
    name: "Aman Verma",
    email: "aman.verma@gmail.com",
    phone: "+91 98765 43210",
    floor: "2",
    room: "204",
    roomType: "AC Double Sharing",
    rent: 8500,
    acUnits: 20,
    acRate: 100,
    acAmount: 2000,
    otherExpense: 0,
    overdue: 0,
    totalDue: 10500,
    paymentStatus: "pending",
    dueDate: "Oct 5, 2026",
    billingMonth: "October 2026",
    lastPaymentDate: "None",
    paymentReminder: false,
    lastReminderSent: null,
    checkInDate: "2026-07-01",
    photoURL: null
  }
};

const DEFAULT_ANNOUNCEMENTS = {
  "ann_1": {
    id: "ann_1",
    title: "October Rent Due Notice",
    message: "Rent for October is due by the 5th. Pay online or at front desk.",
    targetType: "all",
    targetValue: "all",
    author: "Owner",
    createdAt: Date.now() - 3600000 * 24,
    dateStr: "Sep 27, 8:00 AM",
    category: "urgent"
  },
  "ann_2": {
    id: "ann_2",
    title: "Water Tank Cleaning",
    message: "Water supply will be off tomorrow from 10 to 11 AM for tank cleaning.",
    targetType: "all",
    targetValue: "all",
    author: "Owner",
    createdAt: Date.now() - 3600000 * 48,
    dateStr: "Sep 25, 9:00 AM",
    category: "maintenance"
  }
};

const DEFAULT_COMPLAINTS = {
  "comp_1": {
    id: "comp_1",
    guestId: "guest_1",
    guestName: "Aman Verma",
    guestEmail: "aman.verma@gmail.com",
    room: "204",
    floor: "2",
    recipient: "Maintenance staff",
    category: "Water & electricity",
    message: "Room 204 geyser wasn't heating water.",
    status: "resolved",
    resolutionNotes: "Heating element replaced on Sep 20.",
    createdAt: Date.now() - 3600000 * 120,
    dateStr: "Sep 19, 2026"
  }
};

// Seed database ensuring rooms and ONLY 1 GUEST
async function ensureSeedData() {
  if (!db) return;
  try {
    const snapshot = await db.ref('rooms').once('value');
    if (!snapshot.exists()) {
      await db.ref('rooms').set(DEFAULT_ROOMS);
    }
    const guestsSnap = await db.ref('guests').once('value');
    if (!guestsSnap.exists()) {
      await db.ref('guests').set(DEFAULT_GUESTS);
    } else {
      // User requested: "remove all the guest only keep 1"
      const val = guestsSnap.val() || {};
      const keys = Object.keys(val);
      if (keys.length > 1) {
        for (let i = 1; i < keys.length; i++) {
          await db.ref(`guests/${keys[i]}`).remove();
        }
      }
    }
    const annSnap = await db.ref('announcements').once('value');
    if (!annSnap.exists()) {
      await db.ref('announcements').set(DEFAULT_ANNOUNCEMENTS);
    }
    const compSnap = await db.ref('complaints').once('value');
    if (!compSnap.exists()) {
      await db.ref('complaints').set(DEFAULT_COMPLAINTS);
    }
  } catch (err) {
    console.warn("Seed check error:", err);
  }
}

// ---------------- AUTHENTICATION & ROLE ROUTING ----------------

function isOwnerEmail(email) {
  if (!email) return false;
  return email.trim().toLowerCase() === OWNER_EMAIL.toLowerCase();
}

// Sign in with Google Popup
async function signInWithGoogle() {
  if (!auth) throw new Error("Firebase Auth not initialized");
  const provider = new firebase.auth.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    const result = await auth.signInWithPopup(provider);
    return result.user;
  } catch (err) {
    if (err.code === 'auth/popup-blocked') {
      return auth.signInWithRedirect(provider);
    }
    throw err;
  }
}

// Sign out
async function signOutUser() {
  if (!auth) return;
  await auth.signOut();
  localStorage.removeItem('sspg_active_guest_id');
  window.location.href = 'login.html';
}

// Check logged in user state
function onAuthStateChanged(callback) {
  if (!auth) {
    callback(null);
    return () => { };
  }
  return auth.onAuthStateChanged(callback);
}

// Find guest by email in Realtime Database
async function findGuestByEmail(email) {
  if (!db || !email) return null;
  const snap = await db.ref('guests').once('value');
  const allGuests = snap.val() || {};
  const normalized = email.trim().toLowerCase();

  for (const key of Object.keys(allGuests)) {
    const g = allGuests[key];
    if (g.email && g.email.trim().toLowerCase() === normalized) {
      return { id: key, ...g };
    }
  }
  return null;
}

// Update guest photoURL when Google profile photo changes
async function updateGuestPhoto(guestId, photoURL) {
  if (!db || !guestId || !photoURL) return;
  try {
    await db.ref(`guests/${guestId}`).update({ photoURL });
  } catch (e) {
    console.warn("Could not update guest photo:", e);
  }
}

// Protect pages based on role
// allowedRole: 'owner' | 'guest' | 'any'
function requireAuth(allowedRole = 'any') {
  onAuthStateChanged(async (user) => {
    if (!user) {
      window.location.href = 'login.html';
      return;
    }

    const isOwner = isOwnerEmail(user.email);

    if (allowedRole === 'owner') {
      if (!isOwner) {
        alert("Access Denied: Owner Portal is restricted to " + OWNER_EMAIL);
        window.location.href = 'index.html';
      }
      return;
    }

    if (allowedRole === 'guest') {
      if (isOwner) {
        // Owner can view guest pages as well
        return;
      }
      // Check if registered guest
      const guest = await findGuestByEmail(user.email);
      if (!guest) {
        alert(`Access Denied: Account ${user.email} is not registered as a guest at Shree Shyam PG. Please contact the owner.`);
        await signOutUser();
      }
    }
  });
}

// ---------------- ACTIVE RESIDENT MANAGEMENT ----------------

const STORAGE_KEY_GUEST = 'sspg_active_guest_id';

function getActiveGuestId() {
  return localStorage.getItem(STORAGE_KEY_GUEST) || 'guest_1';
}

function setActiveGuestId(id) {
  localStorage.setItem(STORAGE_KEY_GUEST, id);
  window.dispatchEvent(new CustomEvent('sspg:activeGuestChanged', { detail: { guestId: id } }));
}

// Real-time listener for the currently active guest
function listenToActiveGuest(callback) {
  if (!auth) {
    callback(DEFAULT_GUESTS['guest_1']);
    return () => { };
  }

  // Subscribe to auth to resolve the resident
  let dbListener = null;
  let currentRef = null;

  const authUnsub = auth.onAuthStateChanged(async (user) => {
    if (!user) {
      const fallbackId = getActiveGuestId();
      if (db) {
        currentRef = db.ref(`guests/${fallbackId}`);
        dbListener = currentRef.on('value', (snap) => {
          callback(snap.exists() ? { id: fallbackId, ...snap.val() } : DEFAULT_GUESTS['guest_1']);
        });
      } else {
        callback(DEFAULT_GUESTS['guest_1']);
      }
      return;
    }

    // If owner is testing, allow using localStorage active guest ID or first guest
    if (isOwnerEmail(user.email)) {
      const activeId = getActiveGuestId();
      if (db) {
        currentRef = db.ref(`guests/${activeId}`);
        dbListener = currentRef.on('value', (snap) => {
          if (snap.exists()) {
            callback({ id: activeId, ...snap.val(), isOwnerViewing: true });
          } else {
            // First guest
            db.ref('guests').limitToFirst(1).once('value', s => {
              const val = s.val() || {};
              const k = Object.keys(val)[0];
              callback(k ? { id: k, ...val[k], isOwnerViewing: true } : DEFAULT_GUESTS['guest_1']);
            });
          }
        });
      }
      return;
    }

    // If resident logged in with Google:
    const guest = await findGuestByEmail(user.email);
    if (guest && db) {
      setActiveGuestId(guest.id);
      // Sync photo if available
      if (user.photoURL && user.photoURL !== guest.photoURL) {
        updateGuestPhoto(guest.id, user.photoURL);
        guest.photoURL = user.photoURL;
      }
      currentRef = db.ref(`guests/${guest.id}`);
      dbListener = currentRef.on('value', (snap) => {
        if (snap.exists()) {
          const data = snap.val();
          callback({ id: guest.id, ...data, photoURL: user.photoURL || data.photoURL });
        } else {
          callback(guest);
        }
      });
    } else {
      callback(null);
    }
  });

  return () => {
    authUnsub();
    if (currentRef && dbListener) currentRef.off('value', dbListener);
  };
}

// ---------------- DATABASE LISTENERS & CRUD ----------------

function listenToAllGuests(callback) {
  if (!db) {
    callback(Object.values(DEFAULT_GUESTS));
    return () => { };
  }
  const ref = db.ref('guests');
  const listener = ref.on('value', (snap) => {
    const data = snap.val() || {};
    const list = Object.keys(data).map(key => ({ id: key, ...data[key] }));
    callback(list);
  });
  return () => ref.off('value', listener);
}

function listenToAllRooms(callback) {
  if (!db) {
    callback(DEFAULT_ROOMS);
    return () => { };
  }
  const ref = db.ref('rooms');
  const listener = ref.on('value', (snap) => {
    const data = snap.val() || DEFAULT_ROOMS;
    callback(data);
  });
  return () => ref.off('value', listener);
}

function computeOccupancy(roomsObj, guestsList) {
  const occupancy = {};
  Object.keys(roomsObj).forEach(rNum => {
    const room = roomsObj[rNum];
    occupancy[rNum] = {
      ...room,
      residents: [],
      occupiedCount: 0,
      availableBeds: room.capacity,
      isFull: false,
      isEmpty: true
    };
  });

  guestsList.forEach(guest => {
    if (guest.room && occupancy[guest.room]) {
      occupancy[guest.room].residents.push(guest);
      occupancy[guest.room].occupiedCount += 1;
    }
  });

  Object.keys(occupancy).forEach(rNum => {
    const item = occupancy[rNum];
    item.availableBeds = Math.max(0, item.capacity - item.occupiedCount);
    item.isFull = item.occupiedCount >= item.capacity;
    item.isEmpty = item.occupiedCount === 0;
  });

  return occupancy;
}

// Add Guest (Capacity verified!)
async function addGuest(guestData) {
  if (!db) throw new Error("Firebase not connected");

  const roomsSnap = await db.ref(`rooms/${guestData.room}`).once('value');
  const roomInfo = roomsSnap.val();
  if (!roomInfo) throw new Error("Selected room does not exist.");

  const guestsSnap = await db.ref('guests').once('value');
  const allGuests = guestsSnap.val() || {};
  const currentResidents = Object.values(allGuests).filter(g => g.room === guestData.room);

  if (currentResidents.length >= roomInfo.capacity) {
    throw new Error(`Room ${guestData.room} is already at full capacity (${roomInfo.capacity}/${roomInfo.capacity} beds). Please select another room.`);
  }

  // Check if email already registered
  const existingEmail = Object.values(allGuests).find(g => g.email && g.email.toLowerCase() === guestData.email.trim().toLowerCase());
  if (existingEmail) {
    throw new Error(`A resident with email ${guestData.email} is already registered in Room ${existingEmail.room}.`);
  }

  const newKey = db.ref('guests').push().key;
  const newGuest = {
    id: newKey,
    name: guestData.name.trim(),
    email: guestData.email.trim().toLowerCase(),
    phone: guestData.phone.trim(),
    floor: guestData.floor,
    room: guestData.room,
    roomType: roomInfo.type || "Standard Sharing",
    rent: Number(guestData.rent) || roomInfo.rent || 8500,
    acUnits: Number(guestData.acUnits) || 0,
    acRate: Number(guestData.acRate) || 100,
    acAmount: (Number(guestData.acUnits) || 0) * (Number(guestData.acRate) || 100),
    otherExpense: Number(guestData.otherExpense) || 0,
    overdue: 0,
    totalDue: (Number(guestData.rent) || 8500) + ((Number(guestData.acUnits) || 0) * (Number(guestData.acRate) || 100)),
    paymentStatus: "pending",
    dueDate: guestData.dueDate || "Oct 5, 2026",
    billingMonth: guestData.billingMonth || "October 2026",
    lastPaymentDate: "None",
    paymentReminder: false,
    lastReminderSent: null,
    checkInDate: guestData.checkInDate || new Date().toISOString().split('T')[0],
    photoURL: null,
    createdAt: Date.now()
  };

  await db.ref(`guests/${newKey}`).set(newGuest);
  return newGuest;
}

// Move Guest from one room to another
async function moveGuestRoom(guestId, newFloor, newRoom) {
  if (!db) throw new Error("Firebase not connected");

  const roomsSnap = await db.ref(`rooms/${newRoom}`).once('value');
  const roomInfo = roomsSnap.val();
  if (!roomInfo) throw new Error("Target room does not exist.");

  const guestsSnap = await db.ref('guests').once('value');
  const allGuests = guestsSnap.val() || {};
  const currentResidents = Object.values(allGuests).filter(g => g.room === newRoom && g.id !== guestId);

  if (currentResidents.length >= roomInfo.capacity) {
    throw new Error(`Cannot move: Room ${newRoom} is already full (${roomInfo.capacity}/${roomInfo.capacity} beds occupied).`);
  }

  await db.ref(`guests/${guestId}`).update({
    floor: newFloor,
    room: newRoom,
    roomType: roomInfo.type,
    movedAt: Date.now()
  });

  return true;
}

// Delete Guest
async function deleteGuest(guestId) {
  if (!db) throw new Error("Firebase not connected");
  await db.ref(`guests/${guestId}`).remove();
  return true;
}

// Edit Payment Info
async function updateGuestPayment(guestId, paymentUpdates) {
  if (!db) throw new Error("Firebase not connected");

  const updates = {};
  if (paymentUpdates.paymentStatus !== undefined) updates.paymentStatus = paymentUpdates.paymentStatus;
  if (paymentUpdates.rent !== undefined) updates.rent = Number(paymentUpdates.rent);
  if (paymentUpdates.acUnits !== undefined) updates.acUnits = Number(paymentUpdates.acUnits);
  if (paymentUpdates.acRate !== undefined) updates.acRate = Number(paymentUpdates.acRate);
  if (paymentUpdates.otherExpense !== undefined) updates.otherExpense = Number(paymentUpdates.otherExpense);
  if (paymentUpdates.overdue !== undefined) updates.overdue = Number(paymentUpdates.overdue);

  const acTotal = (updates.acUnits !== undefined ? updates.acUnits : (paymentUpdates.existingAcUnits || 0)) *
    (updates.acRate !== undefined ? updates.acRate : (paymentUpdates.existingAcRate || 100));
  updates.acAmount = acTotal;

  const rentVal = updates.rent !== undefined ? updates.rent : (paymentUpdates.existingRent || 8500);
  const otherVal = updates.otherExpense !== undefined ? updates.otherExpense : (paymentUpdates.existingOther || 0);
  const overdueVal = updates.overdue !== undefined ? updates.overdue : (paymentUpdates.existingOverdue || 0);

  updates.totalDue = rentVal + acTotal + otherVal + overdueVal;

  if (paymentUpdates.paymentStatus === 'paid') {
    updates.lastPaymentDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    updates.paymentReminder = false;
  }

  await db.ref(`guests/${guestId}`).update(updates);

  // If rent was paid, trigger Android Push notification to Owner!
  if (paymentUpdates.paymentStatus === 'paid') {
    try {
      const guestSnap = await db.ref(`guests/${guestId}`).once('value');
      const g = guestSnap.val() || {};
      await sendLivePushNotification({
        target: 'owner',
        title: `💰 Rent Received: Room ${g.room || ''}`,
        body: `${g.name || 'Resident'} has completed payment of ₹${(updates.totalDue || g.totalDue || 0).toLocaleString('en-IN')}.`,
        url: '/owner.html#guestsTab',
        tag: 'rent-paid-' + guestId
      });
    } catch(e) { console.warn('[Notification] Rent paid alert failed:', e); }
  }

  return updates;
}

// Send Payment Reminder — saves to RTDB + sends real Android push notification
async function sendPaymentReminder(guestId) {
  if (!db) throw new Error("Firebase not connected");
  const now = Date.now();
  await db.ref(`guests/${guestId}`).update({
    paymentReminder: true,
    lastReminderSent: now
  });

  const guestSnap = await db.ref(`guests/${guestId}`).once('value');
  const guest = guestSnap.val();
  if (!guest) return true;

  const title = `💰 Rent Payment Reminder — Room ${guest.room}`;
  const body  = `Your rent of ₹${guest.totalDue || guest.rent} for ${guest.billingMonth || 'this month'} is pending. Please pay by ${guest.dueDate || 'the due date'}.`;

  // 1. Write in-app announcement (classic bell)
  const newKey = db.ref('announcements').push().key;
  await db.ref(`announcements/${newKey}`).set({
    id: newKey,
    title,
    message: body,
    targetType: "room",
    targetValue: guest.room,
    author: "Owner",
    createdAt: now,
    dateStr: new Date(now).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
    category: "urgent",
    isPaymentReminder: true,
    guestId: guestId
  });

  // 2. Send real Android push notification directly to guest
  await sendLivePushNotification({
    target: 'guest',
    guestId: guestId,
    room: guest.room,
    floor: guest.floor,
    title: title,
    body: body,
    url: '/payments.html',
    tag: 'payment-reminder-' + guestId
  });

  return true;
}

// Announcements
async function sendAnnouncement(data) {
  if (!db) throw new Error("Firebase not connected");
  const newKey = db.ref('announcements').push().key;
  const now = Date.now();
  const dateStr = new Date(now).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
  });

  const ann = {
    id: newKey,
    title: data.title.trim(),
    message: data.message.trim(),
    targetType: data.targetType || "all",
    targetValue: data.targetValue || "all",
    author: "Owner",
    category: data.category || "general",
    createdAt: now,
    dateStr: dateStr
  };

  await db.ref(`announcements/${newKey}`).set(ann);

  // Also send real Android push to target devices
  const emoji = ann.category === 'urgent' ? '🚨' : ann.category === 'maintenance' ? '🔧' : '📢';
  await sendLivePushNotification({
    target: ann.targetType, // 'all', 'floor', 'room'
    floor: ann.targetValue,
    room: ann.targetValue,
    title: `${emoji} ${ann.title}`,
    body: ann.message,
    url: '/index.html',
    tag: 'announcement-' + newKey
  });

  return ann;
}

function listenToAnnouncements(callback) {
  if (!db) {
    callback(Object.values(DEFAULT_ANNOUNCEMENTS));
    return () => { };
  }
  const ref = db.ref('announcements');
  const listener = ref.on('value', (snap) => {
    const data = snap.val() || {};
    const list = Object.keys(data).map(k => ({ id: k, ...data[k] }));
    list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    callback(list);
  });
  return () => ref.off('value', listener);
}

async function deleteAnnouncement(annId) {
  if (!db) throw new Error("Firebase not connected");
  await db.ref(`announcements/${annId}`).remove();
  return true;
}

// Complaints
async function submitComplaint(data) {
  if (!db) throw new Error("Firebase not connected");
  const newKey = db.ref('complaints').push().key;
  const now = Date.now();
  const dateStr = new Date(now).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });

  const comp = {
    id: newKey,
    guestId: data.guestId || getActiveGuestId(),
    guestName: data.guestName || "Resident",
    guestEmail: data.guestEmail || "",
    room: data.room || "204",
    floor: data.floor || "2",
    recipient: data.recipient || "Owner",
    category: data.category || "General",
    message: data.message.trim(),
    status: "open",
    resolutionNotes: "",
    createdAt: now,
    dateStr: dateStr
  };

  await db.ref(`complaints/${newKey}`).set(comp);

  // Notify owner with Android push notification
  try {
    await sendLivePushNotification({
      target: 'owner',
      title: `🚨 New Complaint: Room ${comp.room}`,
      body: `${comp.guestName} (${comp.category}): ${comp.message}`,
      url: '/owner.html',
      tag: 'complaint-new-' + newKey
    });
  } catch(e) { console.warn('[Notification] Complaint owner alert failed:', e); }

  return comp;
}

function listenToComplaints(callback) {
  if (!db) {
    callback(Object.values(DEFAULT_COMPLAINTS));
    return () => { };
  }
  const ref = db.ref('complaints');
  const listener = ref.on('value', (snap) => {
    const data = snap.val() || {};
    const list = Object.keys(data).map(k => ({ id: k, ...data[k] }));
    list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    callback(list);
  });
  return () => ref.off('value', listener);
}

async function updateComplaintStatus(compId, status, notes = "") {
  if (!db) throw new Error("Firebase not connected");
  const updates = { status: status };
  if (notes) updates.resolutionNotes = notes;
  await db.ref(`complaints/${compId}`).update(updates);

  // Notify guest with Android push when complaint is resolved or updated
  try {
    const compSnap = await db.ref(`complaints/${compId}`).once('value');
    const comp = compSnap.val();
    if (comp && comp.guestId) {
      const statusLabel = status === 'resolved' ? '✅ Resolved' : status === 'in_progress' ? '🔧 In Progress' : '📝 Updated';
      const notifBody = notes
        ? `Your ${comp.category} complaint has been ${status.replace('_', ' ')}. Note: ${notes}`
        : `Your ${comp.category} complaint is now ${status.replace('_', ' ')}.`;
      await sendLivePushNotification({
        target: 'guest',
        guestId: comp.guestId,
        room: comp.room,
        floor: comp.floor,
        title: `${statusLabel}: Your Complaint`,
        body: notifBody,
        url: '/complain.html',
        tag: 'complaint-update-' + compId
      });
    }
  } catch (e) { console.warn('[Notification] Complaint update push failed:', e.message); }

  return true;
}

// ==================== ANDROID PUSH NOTIFICATION SYSTEM ====================
// Zero Billing (Free Spark Plan) • Zero Extra Installs • Real Native Android OS Notifications

/**
 * Triggers a real Native Android OS status bar / shade notification.
 * Uses Service Worker's showNotification() so Android displays it in the top drawer,
 * vibrates the phone, plays sound, shows the logo, and opens the target page on tap.
 */
async function triggerAndroidNotification(title, body, options = {}) {
  const url   = options.url   || '/index.html';
  const tag   = options.tag   || ('sspg-' + Date.now());
  const icon  = options.icon  || '/logo.png';
  const badge = options.badge || '/logo.png';

  console.log('[AndroidPush] Triggering push:', title, body);

  // 1. Play custom audio chime
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(660, ctx.currentTime + 0.15);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) { /* AudioContext might need user interaction */ }

  // 2. Hardware vibration on Android
  if (navigator.vibrate) {
    try { navigator.vibrate([300, 150, 300, 150, 600]); } catch (e) {}
  }

  // 3. Real Native Android OS Notification via Service Worker
  let shownViaSW = false;
  if ('serviceWorker' in navigator && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      try {
        const reg = await navigator.serviceWorker.ready;
        if (reg && reg.showNotification) {
          await reg.showNotification(title, {
            body: body || '',
            icon: icon,
            badge: badge,
            tag: tag,
            renotify: true,
            requireInteraction: true,
            silent: false,
            vibrate: [300, 150, 300, 150, 600],
            data: { url: url },
            actions: [
              { action: 'open',    title: '📂 Open App' },
              { action: 'dismiss', title: '✕ Dismiss'   }
            ],
            timestamp: Date.now()
          });
          shownViaSW = true;
          console.log('[AndroidPush] Native Android Notification displayed successfully.');
        }
      } catch (err) {
        console.warn('[AndroidPush] showNotification error:', err);
      }

      // Fallback: postMessage to active service worker controller
      if (!shownViaSW && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SHOW_ANDROID_NOTIFICATION',
          title,
          body,
          data: { url, tag }
        });
      }
    } else {
      console.log('[AndroidPush] Permission is not granted yet:', Notification.permission);
    }
  }

  // 4. Always show floating toast banner as in-app visual feedback
  showForegroundPush(title, body, url);
}

/**
 * Dispatch a live push notification via Firebase Realtime Database.
 * Runs 100% free on Firebase Spark tier (no billing details, no Cloud Functions).
 */
async function sendLivePushNotification({ target, guestId, floor, room, title, body, url, tag }) {
  if (!db) return;
  const notifId = db.ref('liveNotifications').push().key;
  const now = Date.now();
  const payload = {
    id: notifId,
    target: target || 'all', // 'all', 'guest', 'floor', 'room', 'owner'
    guestId: guestId || null,
    floor: floor ? String(floor) : null,
    room: room ? String(room) : null,
    title: title || 'Shree Shyam Boys PG',
    body: body || '',
    url: url || '/index.html',
    tag: tag || ('sspg-' + notifId),
    createdAt: now
  };

  try {
    await db.ref(`liveNotifications/${notifId}`).set(payload);
    console.log('[LivePush] Sent to RTDB:', notifId, payload.title);
  } catch (err) {
    console.warn('[LivePush] Failed to write notification:', err);
  }

  // Also write to pushQueue for backwards compatibility with any background worker
  try {
    const queueKey = db.ref('pushQueue').push().key;
    await db.ref(`pushQueue/${queueKey}`).set({
      type: target === 'guest' ? 'guest' : 'all',
      guestId: guestId || null,
      title,
      body,
      data: { url: url || '/index.html', tag: tag || 'sspg-push' },
      createdAt: now
    });
  } catch (e) {}

  // Auto-prune notifications older than 48 hours to keep free RTDB clean & tiny
  try {
    const cutoff = now - (48 * 60 * 60 * 1000);
    db.ref('liveNotifications')
      .orderByChild('createdAt')
      .endAt(cutoff)
      .limitToFirst(25)
      .once('value', snap => {
        const oldItems = snap.val();
        if (oldItems) {
          const updates = {};
          Object.keys(oldItems).forEach(k => { updates[`liveNotifications/${k}`] = null; });
          db.ref().update(updates);
        }
      });
  } catch (e) {}
}

/**
 * Real-time listener that receives live notifications from RTDB on Android devices
 * and triggers real Android system push notifications.
 */
let liveNotifListenerActive = false;
function startLiveNotificationListener(role, guestId = null, room = null, floor = null) {
  if (!db || liveNotifListenerActive) return;
  liveNotifListenerActive = true;

  const getSeenIds = () => {
    try {
      return JSON.parse(sessionStorage.getItem('sspg_seen_notifs') || '[]');
    } catch (e) { return []; }
  };
  const markSeen = (id) => {
    try {
      const ids = getSeenIds();
      ids.push(id);
      if (ids.length > 50) ids.shift();
      sessionStorage.setItem('sspg_seen_notifs', JSON.stringify(ids));
    } catch (e) {}
  };

  // Only trigger for notifications created from 30s before page open onwards
  const startTime = Date.now() - 30000;
  console.log(`[LivePush] Listener started for role=${role}, guestId=${guestId}, room=${room}, floor=${floor}`);

  db.ref('liveNotifications')
    .orderByChild('createdAt')
    .startAt(startTime)
    .on('child_added', (snap) => {
      const notif = snap.val();
      if (!notif || !notif.id) return;

      const seen = getSeenIds();
      if (seen.includes(notif.id)) return;

      // Check if this notification is targeted to this user/device
      let isForMe = false;
      if (role === 'owner') {
        if (notif.target === 'owner') isForMe = true;
      } else {
        // Resident
        if (notif.target === 'all') isForMe = true;
        else if (notif.target === 'guest' && notif.guestId && notif.guestId === guestId) isForMe = true;
        else if (notif.target === 'room' && notif.room && room && String(notif.room) === String(room)) isForMe = true;
        else if (notif.target === 'floor' && notif.floor && floor && String(notif.floor) === String(floor)) isForMe = true;
      }

      if (isForMe) {
        markSeen(notif.id);
        triggerAndroidNotification(notif.title, notif.body, {
          url: notif.url,
          tag: notif.tag
        });
      }
    });
}

/**
 * Request notification permission from the user (Android Chrome / browser).
 */
async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    alert("Web Notifications are not supported by this browser.");
    return 'unsupported';
  }

  try {
    const permission = await Notification.requestPermission();
    console.log('[AndroidPush] User answered permission:', permission);

    if (permission === 'granted') {
      if ('serviceWorker' in navigator) {
        await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      }

      const banner = document.getElementById('sspg-notif-prompt-banner');
      if (banner) banner.remove();

      await triggerAndroidNotification(
        "🔔 Android Notifications Active!",
        "Shree Shyam Boys PG alerts are now active on your Android device.",
        { url: window.location.pathname }
      );
    }
    return permission;
  } catch (err) {
    console.warn('[AndroidPush] requestPermission error:', err);
    return 'denied';
  }
}

/**
 * Test button helper — immediately fires an Android status bar notification.
 */
async function testAndroidNotification() {
  if (!('Notification' in window)) {
    alert("Notifications are not supported in this browser.");
    return;
  }

  if (Notification.permission !== 'granted') {
    const res = await requestNotificationPermission();
    if (res !== 'granted') {
      alert("Please tap 'Allow' when the browser asks for Notification permission.");
      return;
    }
    return;
  }

  await triggerAndroidNotification(
    "🔔 Test Android Push Notification",
    "Shree Shyam Boys PG notifications are working with sound & vibration on your phone!",
    { url: window.location.pathname, tag: 'sspg-test-' + Date.now() }
  );
}

/**
 * Checks current notification permission state: 'granted', 'denied', or 'default'.
 */
function checkNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

/**
 * Renders an inviting, non-intrusive prompt banner if notifications aren't enabled yet.
 */
function renderNotificationPromptBanner(containerId = 'notifBannerMount') {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!('Notification' in window) || Notification.permission === 'granted') {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = `
    <div id="sspg-notif-prompt-banner" style="
      background: linear-gradient(135deg, rgba(232,192,102,0.14) 0%, rgba(184,134,59,0.2) 100%);
      border: 1px solid rgba(232,192,102,0.35);
      border-radius: 12px;
      padding: 12px 18px;
      margin-bottom: 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      flex-wrap: wrap;
    ">
      <div style="display:flex;align-items:center;gap:12px;">
        <span style="font-size:22px;line-height:1;">🔔</span>
        <div>
          <strong style="color:var(--gold-soft);font-size:13.5px;display:block;">Enable Android Push Notifications</strong>
          <span style="color:var(--body-text);font-size:12px;">Get instant phone alerts for PG notices, rent updates &amp; complaints.</span>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        <button onclick="SSPG.requestNotificationPermission()" style="
          background: linear-gradient(135deg, var(--btn-grad-1), var(--btn-grad-2));
          color: var(--btn-text);
          border: none;
          padding: 7px 15px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 12.5px;
          cursor: pointer;
        ">
          Turn On Notifications
        </button>
        <button onclick="document.getElementById('sspg-notif-prompt-banner').remove()" style="
          background: none;
          border: none;
          color: var(--muted);
          font-size: 18px;
          cursor: pointer;
          padding: 2px 6px;
        ">&times;</button>
      </div>
    </div>
  `;
}

/**
 * Initialize Push Notifications & Service Worker. Call once on DOMContentLoaded.
 */
async function initFCM(roleId, guestData = null) {
  let reg = null;

  // 1. Register Service Worker
  if ('serviceWorker' in navigator) {
    try {
      reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('[AndroidPush] Service worker active:', reg.scope);
    } catch (e) {
      console.warn('[AndroidPush] Service worker register failed:', e.message);
    }
  }

  // 2. Start Live RTDB notification listener for real Android alerts
  const room = guestData?.room || null;
  const floor = guestData?.floor || null;
  startLiveNotificationListener(roleId === 'owner' ? 'owner' : 'guest', roleId, room, floor);

  // 3. Register FCM Token if Firebase messaging SDK is present & permission granted
  if (messaging && 'Notification' in window) {
    try {
      if (Notification.permission === 'granted') {
        const token = await messaging.getToken({ vapidKey: FCM_VAPID_KEY, serviceWorkerRegistration: reg });
        if (token) {
          console.log('[FCM] Token registered:', token.substring(0, 20) + '...');
          await saveFCMToken(roleId, token);
        }
      }

      // Handle FCM foreground push: trigger real Android OS push notification!
      messaging.onMessage((payload) => {
        console.log('[FCM] Foreground push received:', payload);
        const notif = payload.notification || {};
        const data  = payload.data  || {};
        const title = notif.title || data.title || 'Shree Shyam Boys PG';
        const body  = notif.body  || data.body  || '';
        triggerAndroidNotification(title, body, { url: data.url || '/index.html', tag: data.tag });
      });
    } catch (err) {
      console.warn('[FCM] Optional token registration skipped:', err.message);
    }
  }

  return reg;
}

/**
 * Save FCM token to Firebase RTDB so owner can look up tokens by guestId.
 */
async function saveFCMToken(roleId, token) {
  if (!db || !token || !roleId) return;
  const tokenKey = btoa(token).replace(/[^a-zA-Z0-9]/g, '').substring(0, 20);
  await db.ref(`fcmTokens/${roleId}/${tokenKey}`).set({
    token,
    updatedAt: Date.now(),
    platform: navigator.userAgent.includes('Android') ? 'android' :
              navigator.userAgent.includes('iPhone') ? 'ios' : 'web'
  });
}

/**
 * Send push to specific guest (calls live push notification engine).
 */
async function sendPushToGuest(guestId, title, body, extraData = {}) {
  await sendLivePushNotification({
    target: 'guest',
    guestId,
    title,
    body,
    url: extraData.url || '/index.html',
    tag: extraData.tag || 'sspg-push'
  });
}

/**
 * Send push to ALL registered users (broadcast).
 */
async function sendPushToAll(title, body, extraData = {}) {
  await sendLivePushNotification({
    target: 'all',
    title,
    body,
    url: extraData.url || '/index.html',
    tag: extraData.tag || 'sspg-broadcast'
  });
}

/**
 * Show an in-app floating notification toast when the app is in the foreground.
 * Creates a beautiful slide-in banner that auto-dismisses.
 */
function showForegroundPush(title, body, url = null) {
  // Remove existing if any
  const existing = document.getElementById('sspg-push-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'sspg-push-toast';
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 99999;
    background: linear-gradient(135deg, #0f2038 0%, #132744 100%);
    border: 1px solid rgba(232,192,102,0.4);
    border-radius: 16px;
    padding: 16px 20px;
    min-width: 300px;
    max-width: 380px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(232,192,102,0.15);
    color: #f5f3ec;
    font-family: 'Mukta', sans-serif;
    cursor: pointer;
    transform: translateX(120%);
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    display: flex;
    align-items: flex-start;
    gap: 14px;
  `;

  toast.innerHTML = `
    <div style="background:linear-gradient(135deg,#e8c066,#b8863b);border-radius:10px;padding:8px;flex-shrink:0;display:flex;align-items:center;justify-content:center;">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#20140a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
    </div>
    <div style="flex:1;min-width:0;">
      <div style="font-weight:700;font-size:14px;margin-bottom:4px;color:#f4dfa0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${title}</div>
      <div style="font-size:13px;color:#c8c4b8;line-height:1.45;">${body}</div>
      <div style="font-size:11px;color:#9fabc2;margin-top:6px;">Shree Shyam Boys PG · Now</div>
    </div>
    <button onclick="document.getElementById('sspg-push-toast').remove()" style="background:none;border:none;color:#9fabc2;cursor:pointer;padding:0;font-size:18px;line-height:1;flex-shrink:0;">&times;</button>
  `;

  if (url) toast.addEventListener('click', (e) => { if (e.target.tagName !== 'BUTTON') window.location.href = url; });

  document.body.appendChild(toast);

  // Play notification sound
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(660, ctx.currentTime + 0.15);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch(e) { /* Audio not available */ }

  // Vibrate if supported
  if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 400]);

  // Animate in
  requestAnimationFrame(() => {
    requestAnimationFrame(() => { toast.style.transform = 'translateX(0)'; });
  });

  // Auto-dismiss after 6s
  setTimeout(() => {
    if (document.getElementById('sspg-push-toast')) {
      toast.style.transform = 'translateX(120%)';
      setTimeout(() => toast.remove(), 400);
    }
  }, 6000);
}

// ---------------- CLASSIC IN-APP NOTIFICATION BELL WIDGET ----------------

function renderClassicNotificationDropdown(mountId = 'notificationDropdown') {
  const container = document.getElementById(mountId);
  if (!container) return;

  // Render structure
  container.innerHTML = `
    <div class="notif-bell-btn" id="notifBellBtn" title="Classic Notifications">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
      </svg>
      <span class="notif-badge" id="notifBadge" style="display:none;">0</span>
    </div>
    <div class="notif-panel" id="notifPanel">
      <div class="notif-panel-head">
        <span>Notifications</span>
        <span style="font-size:11px;color:var(--muted);font-weight:normal;" id="notifScopeLabel">Real-time alerts</span>
      </div>
      <div class="notif-list" id="notifItemsList">
        <div style="padding:20px;text-align:center;color:var(--muted);font-size:12.5px;">No new notifications</div>
      </div>
    </div>
  `;

  const btn = document.getElementById('notifBellBtn');
  const panel = document.getElementById('notifPanel');

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    panel.classList.toggle('show');
  });

  document.addEventListener('click', (e) => {
    if (!container.contains(e.target)) {
      panel.classList.remove('show');
    }
  });
}

function updateClassicNotificationContent(notifications = []) {
  const badge = document.getElementById('notifBadge');
  const list = document.getElementById('notifItemsList');
  if (!badge || !list) return;

  if (notifications.length > 0) {
    badge.style.display = 'inline-flex';
    badge.textContent = notifications.length;
  } else {
    badge.style.display = 'none';
  }

  if (notifications.length === 0) {
    list.innerHTML = `<div style="padding:24px;text-align:center;color:var(--muted);font-size:12.5px;">All caught up! No active notifications.</div>`;
    return;
  }

  let html = '';
  notifications.forEach(n => {
    html += `
      <div class="notif-item ${n.type || ''}">
        <div class="notif-item-top">
          <span class="notif-item-title">${n.title}</span>
          <span class="notif-item-time">${n.time || ''}</span>
        </div>
        <div class="notif-item-body">${n.message}</div>
      </div>
    `;
  });
  list.innerHTML = html;
}

// Initialize seed check
ensureSeedData();

// Export globals
window.SSPG = {
  OWNER_EMAIL,
  FCM_VAPID_KEY,
  auth,
  db,
  messaging,
  isOwnerEmail,
  signInWithGoogle,
  signOutUser,
  onAuthStateChanged,
  findGuestByEmail,
  requireAuth,
  getActiveGuestId,
  setActiveGuestId,
  listenToActiveGuest,
  listenToAllGuests,
  listenToAllRooms,
  computeOccupancy,
  addGuest,
  moveGuestRoom,
  deleteGuest,
  updateGuestPayment,
  sendPaymentReminder,
  sendAnnouncement,
  listenToAnnouncements,
  deleteAnnouncement,
  submitComplaint,
  listenToComplaints,
  updateComplaintStatus,
  renderClassicNotificationDropdown,
  updateClassicNotificationContent,
  // Android Push Notification Engine (Zero-Billing & Zero-Install)
  initFCM,
  saveFCMToken,
  sendPushToGuest,
  sendPushToAll,
  showForegroundPush,
  triggerAndroidNotification,
  sendLivePushNotification,
  startLiveNotificationListener,
  requestNotificationPermission,
  testAndroidNotification,
  checkNotificationPermission,
  renderNotificationPromptBanner
};
