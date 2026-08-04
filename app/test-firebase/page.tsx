"use client";

import { firebaseApp } from "@/lib/firebase";

export default function TestFirebasePage() {
  return (
    <div style={{ padding: 30 }}>
      <h1>Firebase OK ✅</h1>

      <pre>
        {JSON.stringify(firebaseApp.options, null, 2)}
      </pre>
    </div>
  );
}