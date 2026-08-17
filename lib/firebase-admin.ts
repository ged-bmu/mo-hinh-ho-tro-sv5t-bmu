import { cert, getApps, initializeApp } from "firebase-admin/app";

const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

console.log("=== FIREBASE DEBUG ===");
console.log("PROJECT:", process.env.FIREBASE_PROJECT_ID);
console.log("EMAIL:", process.env.FIREBASE_CLIENT_EMAIL);
console.log("KEY EXISTS:", !!rawPrivateKey);
console.log("KEY LENGTH:", rawPrivateKey?.length);
console.log("KEY START:", rawPrivateKey?.substring(0, 30));
console.log("KEY END:", rawPrivateKey?.substring(rawPrivateKey.length - 30));

const privateKey = rawPrivateKey?.replace(/\\n/g, "\n");

console.log("AFTER REPLACE START:", privateKey?.substring(0, 30));
console.log("AFTER REPLACE END:", privateKey?.substring(privateKey.length - 30));

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