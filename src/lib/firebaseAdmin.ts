import * as admin from "firebase-admin";

export function adminAuth() {
  // If already initialized → reuse
  if (admin.apps.length > 0) {
    return admin.auth();
  }

  const key = process.env.FIREBASE_ADMIN_KEY;
  if (!key) {
    throw new Error("FIREBASE_ADMIN_KEY is missing");
  }

  let parsedKey;

  try {
    parsedKey = JSON.parse(key);
  } catch (err) {
    console.error("❌ Invalid FIREBASE_ADMIN_KEY JSON:", err);
    throw new Error("Invalid FIREBASE_ADMIN_KEY JSON");
  }

  admin.initializeApp({
    credential: admin.credential.cert(parsedKey),
  });

  return admin.auth();
}
