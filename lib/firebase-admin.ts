import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

console.log(
  "FIREBASE PROJECT:",
  process.env.FIREBASE_PROJECT_ID
);


const app =
  getApps().length === 0
    ? initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,

          clientEmail:
            process.env.FIREBASE_CLIENT_EMAIL,

          privateKey:
            process.env.FIREBASE_PRIVATE_KEY
              ?.replace(/\\n/g, "\n"),
        }),
      })
    : getApps()[0];


export { app };