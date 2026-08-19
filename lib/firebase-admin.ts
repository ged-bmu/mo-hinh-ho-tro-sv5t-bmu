import { cert, getApps, initializeApp } from "firebase-admin/app";

const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;
const privateKey = rawPrivateKey?.replace(/\\n/g, "\n");

const app =
  getApps().length === 0
    ? initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey,
        }),
      })
    : getApps()[0];

export { app };