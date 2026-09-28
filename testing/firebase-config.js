/* ============================================================
   Firebase configuration for the jatka-machine project.

   Values come from Firebase Console → Project Settings:
     - "Your apps" → Web app  → firebaseConfig
     - Cloud Messaging → Web Push certificates → VAPID_KEY

   Loaded by BOTH the dashboard page (index.html) and the
   background service worker (firebase-messaging-sw.js), so keep
   all shared values here.

   Note: the Firebase apiKey is a public client identifier, not a
   secret — access is controlled by Realtime Database rules.
   ============================================================ */

const firebaseConfig = {
  apiKey: "AIzaSyBxXzu_4KXWPV6T4rh1CZEPw2gb3NfbxKE",
  authDomain: "jatka-machine.firebaseapp.com",
  projectId: "jatka-machine",
  storageBucket: "jatka-machine.firebasestorage.app",
  messagingSenderId: "1013560649163",
  appId: "1:1013560649163:web:f61611129d4ed482a6c24e",
  databaseURL: "https://jatka-machine-default-rtdb.firebaseio.com"
};

// Cloud Messaging → Web Push certificates → public key pair.
const VAPID_KEY = "BClotzjHOcqklVskdx1Ph7zAnBdxvvc7teJQSZrxCmnchFnPHA-oGEdpQO9Ep4CHI2-XKMRyu6Kq_jC2mX2JGF4";
