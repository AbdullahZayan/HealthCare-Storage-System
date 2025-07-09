const admin = require("firebase-admin");

const fs = require("fs");
const path = require("path");

let firebaseApp = null;

if (!admin.apps.length) {
  if (process.env.FIREBASE_KEY_JSON) {
    const serviceAccountPath = "/tmp/firebase-key.json";
    fs.writeFileSync(serviceAccountPath, process.env.FIREBASE_KEY_JSON);

    const serviceAccount = require(serviceAccountPath);

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET, // e.g., my-project.appspot.com
    });
  } else {
    console.error("❌ Missing FIREBASE_KEY_JSON in environment");
  }
}

const bucket = firebaseApp?.storage().bucket();

module.exports = { bucket };
