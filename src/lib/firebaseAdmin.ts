import * as admin from "firebase-admin";

let adminApp: admin.app.App | null = null;

// Initialize Firebase Admin safely (Turbopack + Next.js compatible)
export function initAdmin() {
  if (!admin.apps.length) {
    adminApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
  } else {
    adminApp = admin.app();
  }
}

// Expose auth() instance so we can verify tokens in route handlers
export const adminAuth = () => {
  if (!adminApp) initAdmin();
  return admin.auth();
};
