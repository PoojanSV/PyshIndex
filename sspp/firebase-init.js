// firebase-init.js — shared Firebase setup for Shree Shyam Boys PG
// Loaded via <script src="firebase-init.js"></script> AFTER the three
// firebase-*-compat.js CDN scripts, on every page.

const firebaseConfig = {
  apiKey: "AIzaSyBykGMuY03LvlaOcRw7Zjh74Vx_5szl3ag",
  authDomain: "sspg-61c4c.firebaseapp.com",
  projectId: "sspg-61c4c",
  storageBucket: "sspg-61c4c.firebasestorage.app",
  messagingSenderId: "772639618703",
  appId: "1:772639618703:web:79aa38bc39bc462bf0a2fa",
  measurementId: "G-BM7LQN0Y5X"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.database();

// The one Google account allowed to act as the owner. Everyone else who
// signs in is treated as a guest and must already have a /guests record
// (added by the owner from owner.html) matching their email.
const OWNER_EMAIL = "sspg.owner@gmail.com";

function pgSignInWithGoogle() {
  var provider = new firebase.auth.GoogleAuthProvider();
  return auth.signInWithPopup(provider);
}

function pgSignOut() {
  return auth.signOut();
}

// Wires the small circular avatar in the nav bar to act as a sign-out
// control, without changing its appearance.
function pgWireSignOut(elId) {
  var el = document.getElementById(elId || "navAvatar");
  if (!el) return;
  el.style.cursor = "pointer";
  el.title = "Sign out";
  el.addEventListener("click", function () {
    if (confirm("Sign out of your account?")) {
      pgSignOut().then(function () {
        window.location.href = "login.html";
      });
    }
  });
}

// Fills an avatar circle with the signed-in user's real Google profile
// photo (ctx.photo), falling back to their initial letter if there is no
// photo or it fails to load.
function pgSetAvatar(elId, ctx) {
  var el = document.getElementById(elId);
  if (!el) return;
  var initial = (ctx.name || "?").charAt(0).toUpperCase();
  if (ctx.photo) {
    el.textContent = "";
    var img = document.createElement("img");
    img.src = ctx.photo;
    img.alt = ctx.name || "Profile photo";
    img.referrerPolicy = "no-referrer";
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "cover";
    img.style.borderRadius = "50%";
    img.onerror = function () {
      el.textContent = initial;
    };
    el.appendChild(img);
  } else {
    el.textContent = initial;
  }
}

// Call at the top of every protected page.
//   role: "owner"  -> only sspg.owner@gmail.com may stay on this page
//         "guest"  -> only a registered guest may stay on this page
// Redirects to login.html when signed out, and cross-redirects owner/guest
// to their own home page if they land on the wrong one.
// onReady(ctx) fires once the right kind of user is confirmed, where ctx is:
//   { uid, email, name, photo, isOwner, guestId?, guest? }
function pgRequireAuth(role, onReady) {
  auth.onAuthStateChanged(function (user) {
    if (!user) {
      window.location.href = "login.html";
      return;
    }

    if (user.email === OWNER_EMAIL) {
      if (role === "guest") {
        window.location.href = "owner.html";
        return;
      }
      onReady({
        uid: user.uid,
        email: user.email,
        name: user.displayName || "Owner",
        photo: user.photoURL,
        isOwner: true
      });
      return;
    }

    // Not the owner account — must be an already-registered guest.
    db.ref("guests")
      .orderByChild("email")
      .equalTo(user.email)
      .once("value")
      .then(function (snap) {
        if (!snap.exists()) {
          alert(
            "This Google account isn't registered as a guest yet. Please ask the owner to add you first."
          );
          auth.signOut().then(function () {
            window.location.href = "login.html";
          });
          return;
        }

        if (role === "owner") {
          window.location.href = "index.html";
          return;
        }

        var guestId, guestData;
        snap.forEach(function (child) {
          guestId = child.key;
          guestData = child.val();
        });

        // Link this Google uid to the guest record on first login.
        if (guestData.uid !== user.uid) {
          db.ref("guests/" + guestId + "/uid").set(user.uid);
        }

        onReady({
          uid: user.uid,
          email: user.email,
          name: guestData.name || user.displayName || "Resident",
          photo: user.photoURL,
          isOwner: false,
          guestId: guestId,
          guest: guestData
        });
      });
  });
}
