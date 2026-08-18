"use client";

import { useEffect } from "react";

export default function RegisterSW() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/firebase-messaging-sw.js")
        .then((registration) => {
          console.log(
            "✅ Firebase Service Worker registered:",
            registration.scope
          );
        })
        .catch((err) => {
          console.error(
            "❌ Service Worker registration failed:",
            err
          );
        });
    }
  }, []);

  return null;
}